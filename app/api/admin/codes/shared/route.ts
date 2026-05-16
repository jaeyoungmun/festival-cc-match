import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin, generatePinCode } from "@/lib/admin";

// POST /api/admin/codes/shared
// Body: { rolls: number, label?: string, expires_at?: string (ISO) }
// 공유 PIN 1개 발급. 모든 유저가 1회씩 사용 가능.
// Response: { code, rolls, label, expires_at }
export async function POST(request: NextRequest) {
  const check = await requireAdmin();
  if (!check.ok) {
    return NextResponse.json(
      { error: check.reason === "unauthenticated" ? "로그인 필요" : "권한 없음" },
      { status: check.reason === "unauthenticated" ? 401 : 403 },
    );
  }

  const body = await request.json().catch(() => null);
  const rolls = Number(body?.rolls);
  const label =
    typeof body?.label === "string" && body.label.trim().length > 0
      ? body.label.trim()
      : null;
  const expiresAtRaw =
    typeof body?.expires_at === "string" && body.expires_at.length > 0
      ? body.expires_at
      : null;
  const expires_at = expiresAtRaw ? new Date(expiresAtRaw).toISOString() : null;

  if (!Number.isInteger(rolls) || rolls < 1 || rolls > 1000) {
    return NextResponse.json(
      { error: "뽑기권 수는 1~1000 사이여야 해요" },
      { status: 400 },
    );
  }

  const svc = await createServiceClient();

  // 코드 충돌이 매우 드물지만 안전하게 몇 번 재시도
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generatePinCode();
    const { data, error } = await svc
      .from("redemption_codes")
      .insert({
        code,
        rolls,
        is_shared: true,
        label,
        expires_at,
        batch_id: "shared",
        created_by: check.adminId,
      })
      .select("code, rolls, label, expires_at")
      .maybeSingle();

    if (!error && data) {
      return NextResponse.json(data);
    }
    lastError = error;
    // 23505 = unique violation → 다른 PIN으로 재시도
    if (error?.code !== "23505") break;
  }

  console.error("[admin/codes/shared] insert error:", lastError);
  return NextResponse.json({ error: "서버 오류" }, { status: 500 });
}
