import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin";

// POST /api/admin/grant
// Body: { student_id: string, rolls: number, note?: string }
// Response: { user_id, balance, granted: number } | error
export async function POST(request: NextRequest) {
  const check = await requireAdmin();
  if (!check.ok) {
    return NextResponse.json(
      { error: check.reason === "unauthenticated" ? "로그인 필요" : "권한 없음" },
      { status: check.reason === "unauthenticated" ? 401 : 403 },
    );
  }
  const adminId = check.adminId;

  const body = await request.json().catch(() => null);
  const studentId = String(body?.student_id ?? "").trim();
  const rolls = Number(body?.rolls);
  const note = typeof body?.note === "string" ? body.note.trim() : null;

  if (!/^\d{6,}$/.test(studentId)) {
    return NextResponse.json(
      { error: "학번 형식이 올바르지 않아요" },
      { status: 400 },
    );
  }
  if (!Number.isInteger(rolls) || rolls < 1 || rolls > 1000) {
    return NextResponse.json(
      { error: "뽑기권 수는 1~1000 사이여야 해요" },
      { status: 400 },
    );
  }

  const email = `${studentId}@sangmyung.kr`;
  const svc = await createServiceClient();

  // 학번(이메일)로 user 조회
  const { data: profileRow, error: lookupError } = await svc
    .from("profiles")
    .select("id, email, instagram_id")
    .eq("email", email)
    .maybeSingle();

  if (lookupError) {
    console.error("[admin/grant] lookup error:", lookupError);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
  if (!profileRow) {
    return NextResponse.json(
      { error: "해당 학번 가입자를 찾을 수 없어요" },
      { status: 404 },
    );
  }

  // 잔액 적립
  const { error: incError } = await svc.rpc("increment_reroll_balance", {
    p_user_id: profileRow.id,
    p_amount: rolls,
  });
  if (incError) {
    console.error("[admin/grant] increment error:", incError);
    return NextResponse.json({ error: "충전 실패" }, { status: 500 });
  }

  // 감사 로그
  await svc.from("manual_grants").insert({
    user_id: profileRow.id,
    rolls,
    note,
    granted_by: adminId,
  });

  // 새 잔액
  const { data: balanceRow } = await svc
    .from("reroll_balance")
    .select("balance")
    .eq("user_id", profileRow.id)
    .maybeSingle();

  return NextResponse.json({
    user_id: profileRow.id,
    instagram_id: profileRow.instagram_id,
    granted: rolls,
    balance: balanceRow?.balance ?? rolls,
  });
}
