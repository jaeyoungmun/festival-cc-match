import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { normalizePinCode } from "@/lib/admin";

// POST /api/redeem
// Body: { code: string }
// 단일 사용 PIN과 공유 PIN 모두 처리.
//   - 단일 PIN: used_by IS NULL 일 때만 사용 가능 (atomic UPDATE)
//   - 공유 PIN: redemption_code_uses(code, user_id) PK로 유저당 1회만 가능
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

  // 코드 조회
  const { data: codeRow, error: lookupError } = await svc
    .from("redemption_codes")
    .select("rolls, is_shared, expires_at, used_by")
    .eq("code", code)
    .maybeSingle();

  if (lookupError) {
    console.error("[redeem] lookup error:", lookupError);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
  if (!codeRow) {
    return NextResponse.json(
      { error: "유효하지 않은 코드예요", code: "NOT_FOUND" },
      { status: 400 },
    );
  }

  // 만료 체크
  if (codeRow.expires_at && new Date(codeRow.expires_at) < new Date()) {
    return NextResponse.json(
      { error: "만료된 코드예요", code: "EXPIRED" },
      { status: 400 },
    );
  }

  // ─── 공유 PIN ───
  if (codeRow.is_shared) {
    // 유저당 1회 제한 — PK 충돌로 중복 차단
    const { error: insError } = await svc
      .from("redemption_code_uses")
      .insert({ code, user_id: user.id });

    if (insError) {
      // PK 위반 = 이미 사용
      if (insError.code === "23505") {
        return NextResponse.json(
          { error: "이미 사용한 코드예요", code: "ALREADY_USED" },
          { status: 400 },
        );
      }
      console.error("[redeem] shared insert error:", insError);
      return NextResponse.json({ error: "서버 오류" }, { status: 500 });
    }
  } else {
    // ─── 단일 PIN ─── used_by IS NULL 일 때만 atomic 업데이트
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
      return NextResponse.json(
        { error: "이미 사용된 코드예요", code: "ALREADY_USED" },
        { status: 400 },
      );
    }
  }

  // 잔액 적립
  const { error: incError } = await svc.rpc("increment_reroll_balance", {
    p_user_id: user.id,
    p_amount: codeRow.rolls,
  });

  if (incError) {
    console.error("[redeem] increment error:", incError);
    // 보상 트랜잭션
    if (codeRow.is_shared) {
      await svc
        .from("redemption_code_uses")
        .delete()
        .eq("code", code)
        .eq("user_id", user.id);
    } else {
      await svc
        .from("redemption_codes")
        .update({ used_by: null, used_at: null })
        .eq("code", code);
    }
    return NextResponse.json(
      { error: "충전에 실패했습니다. 잠시 후 다시 시도해주세요" },
      { status: 500 },
    );
  }

  const { data: balanceRow } = await svc
    .from("reroll_balance")
    .select("balance")
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.json({
    rolls: codeRow.rolls,
    balance: balanceRow?.balance ?? 0,
  });
}
