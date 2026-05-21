import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin, generatePinCode } from "@/lib/admin";

// POST /api/admin/codes/shared
// Body: { rolls: number, label?: string, expires_at?: string (ISO) }
// 공유 PIN 1개 발급. 모든 유저가 1회씩 사용 가능.
// Response: { code, rolls, label?, expires_at? }
//
// DB에 일부 컬럼(label/is_shared/expires_at/batch_id/created_by)이 아직 마이그레이션
// 안 됐을 때도 동작하도록 PGRST204 발생 시 해당 컬럼을 제거하고 재시도한다.
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

  // 코드 충돌(23505) 또는 컬럼 누락(PGRST204)에 대비해 재시도
  let lastError: unknown = null;
  let payload: Record<string, unknown> = {
    rolls,
    is_shared: true,
    label,
    expires_at,
    batch_id: "shared",
    created_by: check.adminId,
  };

  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generatePinCode();
    const { data, error } = await svc
      .from("redemption_codes")
      .insert({ ...payload, code })
      .select("code, rolls")
      .maybeSingle();

    if (!error && data) {
      return NextResponse.json({
        ...data,
        // 응답에는 클라이언트가 입력한 라벨/만료를 그대로 반환 (DB에 못 들어갔어도 UI 일관성 유지)
        label,
        expires_at,
      });
    }

    lastError = error;

    // 23505 = unique violation → 다른 PIN으로 재시도 (payload 그대로)
    if (error?.code === "23505") continue;

    // PGRST204 = 컬럼 누락 → 해당 컬럼 제거 후 재시도
    if (error?.code === "PGRST204") {
      const match = error.message?.match(/'([^']+)' column/);
      const missingCol = match?.[1];
      if (missingCol && missingCol in payload) {
        const { [missingCol]: _omit, ...rest } = payload;
        void _omit;
        payload = rest;
        console.warn(
          `[admin/codes/shared] dropping missing column "${missingCol}" and retrying`,
        );
        continue;
      }
    }

    break;
  }

  console.error("[admin/codes/shared] insert error:", lastError);
  return NextResponse.json({ error: "서버 오류" }, { status: 500 });
}
