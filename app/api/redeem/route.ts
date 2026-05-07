import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { normalizePinCode } from "@/lib/admin";

// POST /api/redeem
// Body: { code: string }
// Response: { rolls: number, balance: number } | { error, code }
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
  const rawCode = body?.code as string | undefined;
  const code = rawCode ? normalizePinCode(rawCode) : null;
  if (!code) {
    return NextResponse.json(
      { error: "코드 형식이 올바르지 않아요", code: "BAD_FORMAT" },
      { status: 400 },
    );
  }

  const svc = await createServiceClient();

  // 1) 코드를 atomic하게 used로 마크 (used_by IS NULL 조건이라 race 안전)
  const { data: redeemed, error: updError } = await svc
    .from("redemption_codes")
    .update({ used_by: user.id, used_at: new Date().toISOString() })
    .eq("code", code)
    .is("used_by", null)
    .select("rolls")
    .maybeSingle();

  if (updError) {
    console.error("[redeem] update error:", updError);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }

  if (!redeemed) {
    // 코드가 없거나 이미 사용됨 — 구분해서 반환
    const { data: existing } = await svc
      .from("redemption_codes")
      .select("used_by")
      .eq("code", code)
      .maybeSingle();
    if (!existing) {
      return NextResponse.json(
        { error: "유효하지 않은 코드예요", code: "NOT_FOUND" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "이미 사용된 코드예요", code: "ALREADY_USED" },
      { status: 400 },
    );
  }

  // 2) 잔액 적립
  const { error: incError } = await svc.rpc("increment_reroll_balance", {
    p_user_id: user.id,
    p_amount: redeemed.rolls,
  });

  if (incError) {
    console.error("[redeem] increment error:", incError);
    // 적립 실패 시 코드를 다시 풀어줌 (보상 트랜잭션)
    await svc
      .from("redemption_codes")
      .update({ used_by: null, used_at: null })
      .eq("code", code);
    return NextResponse.json(
      { error: "충전에 실패했습니다. 잠시 후 다시 시도해주세요" },
      { status: 500 },
    );
  }

  // 3) 새 잔액 조회해서 반환
  const { data: balanceRow } = await svc
    .from("reroll_balance")
    .select("balance")
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.json({
    rolls: redeemed.rolls,
    balance: balanceRow?.balance ?? 0,
  });
}
