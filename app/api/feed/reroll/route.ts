import { NextResponse, NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// POST /api/feed/reroll
//
// 동작: 뽑기권 1장 차감 + 새 프로필 뽑아서 한 번에 반환.
// 기존 카드(current_profile_id)는 이미 seen_users에 있으므로 자연스럽게 다음 뽑기에서 제외됨.
//
// Request body: { current_profile_id?: string }
// Response:
//   { profile: {...}, remaining: number }  — 새 카드 + 잔여
//   { empty: true, remaining: number }     — 더 이상 볼 사람 없음 (잔액은 차감됨)
//   { code: 'NO_REROLLS_LEFT' }            — 잔액 부족
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const { current_profile_id } = body ?? {};

  // 1. 기존 카드를 seen으로 마킹 (이미 있으면 onConflict로 무시)
  if (current_profile_id) {
    await supabase
      .from("seen_users")
      .upsert(
        { viewer_id: user.id, target_id: current_profile_id },
        { onConflict: "viewer_id,target_id" },
      );
  }

  // 2. 사전 체크 — 더 뽑을 프로필이 있는지 먼저 확인 (차감 전)
  //    없으면 뽑기권을 소비하지 않고 empty 반환
  const { data: nextData, error: rpcError } = await supabase.rpc(
    "get_next_profile",
    { viewer_id: user.id },
  );

  if (rpcError) {
    console.error("[feed/reroll] rpc error:", rpcError);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }

  if (!nextData || nextData.length === 0) {
    return NextResponse.json({ empty: true });
  }

  // 3. 뽑을 사람이 있음 → 이제 차감
  const svc = await createServiceClient();
  const { data: remaining, error: balanceError } = await svc.rpc(
    "decrement_reroll_balance",
    { p_user_id: user.id },
  );

  if (balanceError) {
    if (balanceError.message?.includes("NO_REROLLS_LEFT")) {
      return NextResponse.json(
        { error: "리롤 횟수가 없습니다", code: "NO_REROLLS_LEFT" },
        { status: 400 },
      );
    }
    console.error("[feed/reroll] balance error:", balanceError);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }

  const candidate = nextData[0];

  // 4. 새 카드를 seen으로 마킹 (가장 최근 seen = 현재 카드)
  await supabase
    .from("seen_users")
    .upsert(
      { viewer_id: user.id, target_id: candidate.id },
      { onConflict: "viewer_id,target_id" },
    );

  // 5. RPC가 character를 반환하지 않을 수 있어 풀 프로필 다시 조회
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, instagram_id, department, character")
    .eq("id", candidate.id)
    .maybeSingle();

  return NextResponse.json({ profile: profile ?? candidate, remaining });
}
