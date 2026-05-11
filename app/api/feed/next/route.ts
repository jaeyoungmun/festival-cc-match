import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// GET /api/feed/next
//
// 동작:
//   1. seen_users 중 가장 최근에 본 프로필이 있으면 → "현재 카드"로 간주하고 그대로 반환
//      (브라우저 새로고침해도 같은 카드 유지, 뽑기권 소비 없음)
//   2. 아직 본 프로필이 없으면 → 뽑기권 1장을 차감하고 새 프로필을 뽑아서 반환
//      (가입 직후 첫 진입 시. 잔액 0이면 needTickets 응답)
//
// Response:
//   { profile: {...} }              — 카드 표시
//   { empty: true }                 — 모든 프로필을 다 봄
//   { needTickets: true }           — 잔액 부족 + 현재 카드 없음
//
// 주의: seen_users 테이블에 created_at 컬럼이 필요합니다.
//   없다면: ALTER TABLE seen_users ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  // 1. 가장 최근 seen 항목 = 현재 보고 있던 카드
  const { data: lastSeen } = await supabase
    .from("seen_users")
    .select("target_id")
    .eq("viewer_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastSeen?.target_id) {
    const { data: currentProfile } = await supabase
      .from("profiles")
<<<<<<< HEAD
      .select("id, instagram_id, department, character")
=======
      .select("id, instagram_id")
>>>>>>> develop
      .eq("id", lastSeen.target_id)
      .maybeSingle();

    if (currentProfile) {
      return NextResponse.json({ profile: currentProfile });
    }
    // 현재 카드의 프로필이 삭제된 경우 → 새로 뽑는 흐름으로 폴백
  }

  // 2. 현재 카드 없음 → 사전체크 먼저 (차감 전에 뽑을 사람이 있는지 확인)
  const { data, error } = await supabase.rpc("get_next_profile", {
    viewer_id: user.id,
  });

  if (error) {
    console.error("[feed/next] rpc error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }

  if (!data || data.length === 0) {
    // 뽑을 사람 없음 → 차감하지 않고 empty 반환
    return NextResponse.json({ empty: true });
  }

  // 3. 뽑을 사람이 있음 → 이제 차감
  const svc = await createServiceClient();
  const { error: balanceError } = await svc.rpc("decrement_reroll_balance", {
    p_user_id: user.id,
  });

  if (balanceError) {
    if (balanceError.message?.includes("NO_REROLLS_LEFT")) {
      return NextResponse.json({ needTickets: true });
    }
    console.error("[feed/next] balance error:", balanceError);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }

  const candidate = data[0];

  // 4. seen으로 마킹 (가장 최근 seen = 현재 카드)
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

  return NextResponse.json({ profile: profile ?? candidate });
}
