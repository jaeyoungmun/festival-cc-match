import { NextResponse, NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { pickNextProfile } from "@/lib/feed";

// POST /api/feed/reroll
//
// 동작: 뽑기권 1장 차감 + 새 프로필 뽑아서 한 번에 반환.
// 기존 카드(current_profile_id)는 이미 seen_users에 있으므로 자연스럽게 다음 뽑기에서 제외됨.
//
// 후보 선정은 lib/feed.ts의 pickNextProfile에 위임한다 (캐릭터 선호도 필터 포함).
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

  // profiles 테이블 RLS가 본인 row 한정이라 다른 유저 카드는 service_role로 SELECT.
  const svc = await createServiceClient();

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
  let candidate;
  try {
    candidate = await pickNextProfile(svc, user.id);
  } catch (e) {
    console.error("[feed/reroll] pickNextProfile error:", e);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }

  if (!candidate) {
    return NextResponse.json({ empty: true });
  }

  // 3. 뽑을 사람이 있음 → 이제 차감
  const { error: balanceError } = await svc.rpc("decrement_reroll_balance", {
    p_user_id: user.id,
  });

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

  // 차감 후의 잔액을 명시적으로 다시 조회 (RPC 반환 타입에 의존하지 않도록).
  const { data: balanceRow } = await svc
    .from("reroll_balance")
    .select("balance")
    .eq("user_id", user.id)
    .maybeSingle();
  const remaining = balanceRow?.balance ?? 0;

  // 4. 새 카드를 seen으로 마킹 (가장 최근 seen = 현재 카드)
  await supabase
    .from("seen_users")
    .upsert(
      { viewer_id: user.id, target_id: candidate.id },
      { onConflict: "viewer_id,target_id" },
    );

  return NextResponse.json({ profile: candidate, remaining });
}
