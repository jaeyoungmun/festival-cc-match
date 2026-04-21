import { NextResponse, NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  // 현재 보고 있던 카드 ID를 seen에 기록
  const body = await request.json().catch(() => null);
  const { current_profile_id } = body ?? {};

  if (current_profile_id) {
    await supabase
      .from("seen_users")
      .upsert(
        { viewer_id: user.id, target_id: current_profile_id },
        { onConflict: "viewer_id,target_id" },
      );
  }

  const svc = await createServiceClient();

  const { data, error } = await svc.rpc("decrement_reroll_balance", {
    p_user_id: user.id,
  });

  if (error) {
    if (error.message.includes("NO_REROLLS_LEFT")) {
      return NextResponse.json(
        { error: "리롤 횟수가 없습니다", code: "NO_REROLLS_LEFT" },
        { status: 400 },
      );
    }
    console.error("[feed/reroll]", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }

  return NextResponse.json({ remaining: data });
}
