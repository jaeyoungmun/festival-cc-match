import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { pickNextProfile } from "@/lib/feed";
import { isEventOpen } from "@/lib/eventGate";

// GET /api/feed/next
//
// 동작:
//   1. seen_users 중 가장 최근에 본 프로필이 있으면 → "현재 카드"로 간주하고 그대로 반환
//      (브라우저 새로고침해도 같은 카드 유지, 뽑기권 소비 없음)
//   2. 아직 본 프로필이 없으면 → 뽑기권 1장을 차감하고 새 프로필을 뽑아서 반환
//      (가입 직후 첫 진입 시. 잔액 0이면 needTickets 응답)
//
// 후보 선정은 lib/feed.ts의 pickNextProfile에 위임한다 (캐릭터 선호도 필터 포함).
//
// Response:
//   { profile: {...} }              — 카드 표시
//   { empty: true }                 — 모든 프로필을 다 봄
//   { needTickets: true }           — 잔액 부족 + 현재 카드 없음
export async function GET() {
  if (!isEventOpen()) {
    return NextResponse.json(
      { error: "본 행사 시작 전이에요", code: "BEFORE_OPEN" },
      { status: 403 },
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  // profiles 테이블 RLS가 본인 row 한정이라 다른 유저의 카드를 SELECT하려면
  // service_role이 필요. 인증은 위에서 이미 통과했으니 안전하다.
  const svc = await createServiceClient();

  // 1. 가장 최근 seen 항목 = 현재 보고 있던 카드
  const { data: lastSeen } = await supabase
    .from("seen_users")
    .select("target_id")
    .eq("viewer_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastSeen?.target_id) {
    const { data: currentProfile } = await svc
      .from("profiles")
      .select("id, instagram_id, character, name")
      .eq("id", lastSeen.target_id)
      .maybeSingle();

    if (currentProfile) {
      return NextResponse.json({ profile: currentProfile });
    }
    // 현재 카드의 프로필이 삭제된 경우 → 새로 뽑는 흐름으로 폴백
  }

  // 2. 사전체크 먼저 (차감 전에 뽑을 사람이 있는지 확인)
  let candidate;
  try {
    candidate = await pickNextProfile(svc, user.id);
  } catch (e) {
    console.error("[feed/next] pickNextProfile error:", e);
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
      return NextResponse.json({ needTickets: true });
    }
    console.error("[feed/next] balance error:", balanceError);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }

  // 4. seen으로 마킹 (가장 최근 seen = 현재 카드)
  await supabase
    .from("seen_users")
    .upsert(
      { viewer_id: user.id, target_id: candidate.id },
      { onConflict: "viewer_id,target_id" },
    );

  return NextResponse.json({ profile: candidate });
}
