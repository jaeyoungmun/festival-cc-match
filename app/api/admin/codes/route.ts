import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin";

// GET /api/admin/codes?batch_id=...&status=used|unused&limit=50
// Response: { codes: [...] }
export async function GET(request: NextRequest) {
  const check = await requireAdmin();
  if (!check.ok) {
    return NextResponse.json(
      { error: check.reason === "unauthenticated" ? "로그인 필요" : "권한 없음" },
      { status: check.reason === "unauthenticated" ? 401 : 403 },
    );
  }

  const url = new URL(request.url);
  const batchId = url.searchParams.get("batch_id");
  const status = url.searchParams.get("status"); // used | unused | null
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 500);

  const svc = await createServiceClient();
  let q = svc
    .from("redemption_codes")
    .select("code, rolls, batch_id, created_at, used_by, used_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (batchId) q = q.eq("batch_id", batchId);
  if (status === "used") q = q.not("used_by", "is", null);
  if (status === "unused") q = q.is("used_by", null);

  const { data, error } = await q;
  if (error) {
    console.error("[admin/codes] list error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }

  return NextResponse.json({ codes: data ?? [] });
}
