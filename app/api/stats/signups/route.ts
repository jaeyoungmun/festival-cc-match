import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { describeProgress } from "@/lib/milestones";

// GET /api/stats/signups
// 공개 API — 가입자 수와 다음 마일스톤 반환
// Response: { count, milestones: [{threshold, rolls, achieved}], next }
export async function GET() {
  const svc = await createServiceClient();
  const { count, error } = await svc
    .from("profiles")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("[stats/signups] error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }

  return NextResponse.json(describeProgress(count ?? 0), {
    // 카운터 폴링용 — 짧게 캐시해서 부하 분산
    headers: { "Cache-Control": "public, max-age=10, s-maxage=10" },
  });
}
