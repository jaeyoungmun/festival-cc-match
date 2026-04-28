import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const PACKAGES: Record<string, { amount: number; rerolls: number }> = {
  A: { amount: 1500, rerolls: 5 },
  B: { amount: 2500, rerolls: 7 },
};

// POST /api/payment/confirm
// Body: { paymentKey: string, orderId: string, amount: number, packageId: 'A' | 'B' }
// 토스 서버 검증 → 성공 시 reroll_balance 적립
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // 1. 인증 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  // 2. 요청 바디 파싱
  const body = await request.json().catch(() => null);
  const { paymentKey, orderId, amount, packageId } = body ?? {};

  if (!paymentKey || !orderId || !amount || !packageId) {
    return NextResponse.json({ error: "필수 파라미터 누락" }, { status: 400 });
  }

  // 3. 패키지 금액 서버 검증 (클라이언트 변조 방지)
  const pkg = PACKAGES[packageId];
  if (!pkg || pkg.amount !== amount) {
    return NextResponse.json(
      { error: "금액이 일치하지 않습니다" },
      { status: 400 },
    );
  }

  // 4. 토스페이먼츠 서버 승인 요청
  const tossSecretKey = process.env.TOSS_SECRET_KEY!;
  const basicToken = Buffer.from(`${tossSecretKey}:`).toString("base64");

  const tossRes = await fetch(
    "https://api.tosspayments.com/v1/payments/confirm",
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    },
  );

  const tossData = await tossRes.json();

  if (!tossRes.ok) {
    console.error("[payment/confirm] toss error:", tossData);
    // payments 테이블에 실패 기록
    const svc = await createServiceClient();
    await svc.from("payments").insert({
      user_id: user.id,
      toss_payment_key: paymentKey,
      order_id: orderId,
      amount,
      rerolls_granted: 0,
      status: "failed",
    });
    return NextResponse.json(
      { error: tossData.message ?? "결제 실패" },
      { status: 400 },
    );
  }

  // 5. service_role로 DB 업데이트 (RLS 우회 필요)
  const svc = await createServiceClient();

  // 5-1. payments 기록
  const { error: payError } = await svc.from("payments").insert({
    user_id: user.id,
    toss_payment_key: paymentKey,
    order_id: orderId,
    amount,
    rerolls_granted: pkg.rerolls,
    status: "done",
    paid_at: new Date().toISOString(),
  });

  if (payError) {
    console.error("[payment/confirm] insert error:", payError);
    return NextResponse.json({ error: "결제 기록 실패" }, { status: 500 });
  }

  // 5-2. reroll_balance 적립
  const { error: balanceError } = await svc.rpc("increment_reroll_balance", {
    p_user_id: user.id,
    p_amount: pkg.rerolls,
  });

  if (balanceError) {
    console.error("[payment/confirm] balance error:", balanceError);
    return NextResponse.json({ error: "리롤 적립 실패" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    rerollsGranted: pkg.rerolls,
  });
}
