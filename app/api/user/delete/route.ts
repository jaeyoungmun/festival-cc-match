import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// DELETE /api/user/delete
// 탈퇴: deleted_at 기록(soft delete) + is_visible=false → 피드에서 즉시 제거
// auth.users 삭제는 Supabase 대시보드 또는 별도 배치로 처리
export async function DELETE() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      is_visible: false,
      deleted_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    console.error("[user/delete]", error);
    return NextResponse.json({ error: "탈퇴 처리 실패" }, { status: 500 });
  }

  // 세션 종료
  await supabase.auth.signOut();

  return NextResponse.json({ success: true });
}
