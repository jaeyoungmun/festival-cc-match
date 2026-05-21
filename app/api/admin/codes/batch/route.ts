import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin, generatePinCode } from "@/lib/admin";

// POST /api/admin/codes/batch
// Body: { count: number, rolls: number, batch_id?: string }
// Response: { codes: Array<{ code, rolls }>, batch_id }
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
  const count = Number(body?.count);
  const rolls = Number(body?.rolls);
  const batch_id =
    typeof body?.batch_id === "string" && body.batch_id.trim().length > 0
      ? body.batch_id.trim()
      : `batch_${new Date()
          .toISOString()
          .slice(0, 16)
          .replace(/[-:T]/g, "")}`;

  if (!Number.isInteger(count) || count < 1 || count > 1000) {
    return NextResponse.json(
      { error: "개수는 1~1000 사이여야 해요" },
      { status: 400 },
    );
  }
  if (!Number.isInteger(rolls) || rolls < 1 || rolls > 1000) {
    return NextResponse.json(
      { error: "뽑기권 수는 1~1000 사이여야 해요" },
      { status: 400 },
    );
  }

  const svc = await createServiceClient();

  // 충돌 가능성에 대비해 약간 여유 있게 생성 후 unique 보장
  const seen = new Set<string>();
  const rows: Record<string, unknown>[] = [];
  let attempts = 0;
  while (rows.length < count && attempts < count * 3) {
    attempts++;
    const c = generatePinCode();
    if (seen.has(c)) continue;
    seen.add(c);
    rows.push({ code: c, rolls, batch_id, created_by: adminId });
  }

  // 컬럼 누락(PGRST204) 시 해당 키를 모든 row에서 제거하고 재시도
  let attemptInsert = 0;
  let lastError: unknown = null;
  while (attemptInsert < 5) {
    attemptInsert++;
    const { data, error } = await svc
      .from("redemption_codes")
      .insert(rows)
      .select("code, rolls");

    if (!error) {
      return NextResponse.json({ codes: data ?? [], batch_id });
    }
    lastError = error;

    if (error.code === "PGRST204") {
      const match = error.message?.match(/'([^']+)' column/);
      const missingCol = match?.[1];
      if (missingCol) {
        rows.forEach((r) => delete r[missingCol]);
        console.warn(
          `[admin/codes/batch] dropping missing column "${missingCol}" and retrying`,
        );
        continue;
      }
    }
    break;
  }

  console.error("[admin/codes/batch] insert error:", lastError);
  return NextResponse.json({ error: "서버 오류" }, { status: 500 });
}
