import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";

// GET /api/admin/me
// Response: { isAdmin: true } | 401/403
export async function GET() {
  const check = await requireAdmin();
  if (!check.ok) {
    return NextResponse.json(
      { error: check.reason === "unauthenticated" ? "로그인 필요" : "권한 없음" },
      { status: check.reason === "unauthenticated" ? 401 : 403 },
    );
  }
  return NextResponse.json({ isAdmin: true });
}
