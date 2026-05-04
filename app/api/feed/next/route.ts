import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/feed/next
// 이성 중 아직 보지 않은 유저 1명 랜덤 반환
// Response: { profile: { id, instagram_id, department } } | { empty: true }
export async function GET() {
  const supabase = await createClient();

  // 1. 현재 로그인 유저 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  // 2. DB 함수 호출 (gender 반대 + 안 본 유저 + 랜덤 1명)
  const { data, error } = await supabase.rpc("get_next_profile", {
    viewer_id: user.id,
  });

  if (error) {
    console.error("[feed/next] rpc error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }

  // 3. 더 이상 볼 유저 없음
  if (!data || data.length === 0) {
    return NextResponse.json({ empty: true });
  }

  const profile = data[0];

  // 4. seen_users에 기록 (중복은 upsert로 무시)
  await supabase
    .from("seen_users")
    .upsert(
      { viewer_id: user.id, target_id: profile.id },
      { onConflict: "viewer_id,target_id" },
    );

  return NextResponse.json({ profile });
}
