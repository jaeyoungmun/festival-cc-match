import { NextResponse, NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// GET /api/cron/cleanup-orphans
//
// 매직링크로 auth.users가 먼저 생기지만 프로필 폼을 완성하지 못하고 이탈하면
// 고아 유저가 남는다. 일정 시간이 지나도 profiles 행이 없는 auth.users를 삭제한다.
//
// 보안: Vercel Cron이 `Authorization: Bearer ${CRON_SECRET}` 헤더를 자동으로 붙인다.
//       CRON_SECRET 환경변수가 설정되어 있어야 한다.
//
// 쿼리 파라미터:
//   ?hours=24  — 기본 24시간. 이보다 오래된 미완성 유저를 삭제 대상으로 본다.
//   ?dryRun=1  — 삭제하지 않고 대상만 반환.

const DEFAULT_THRESHOLD_HOURS = 24;
const LIST_USERS_PER_PAGE = 1000;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const hoursParam = Number(searchParams.get("hours"));
  const thresholdHours =
    Number.isFinite(hoursParam) && hoursParam > 0
      ? hoursParam
      : DEFAULT_THRESHOLD_HOURS;
  const dryRun = searchParams.get("dryRun") === "1";

  const svc = await createServiceClient();

  const { data: profiles, error: profileError } = await svc
    .from("profiles")
    .select("id");

  if (profileError) {
    console.error("[cron/cleanup-orphans] profiles select error:", profileError);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  const profileIds = new Set((profiles ?? []).map((p) => p.id));

  const cutoff = new Date(Date.now() - thresholdHours * 60 * 60 * 1000);
  const orphans: { id: string; email: string | undefined; created_at: string }[] = [];

  let page = 1;
  while (true) {
    const { data, error } = await svc.auth.admin.listUsers({
      page,
      perPage: LIST_USERS_PER_PAGE,
    });
    if (error) {
      console.error("[cron/cleanup-orphans] listUsers error:", error);
      return NextResponse.json({ error: "listUsers failed" }, { status: 500 });
    }

    const users = data.users ?? [];
    for (const u of users) {
      const createdAt = new Date(u.created_at);
      if (createdAt < cutoff && !profileIds.has(u.id)) {
        orphans.push({ id: u.id, email: u.email, created_at: u.created_at });
      }
    }

    if (users.length < LIST_USERS_PER_PAGE) break;
    page += 1;
  }

  if (dryRun) {
    return NextResponse.json({
      dryRun: true,
      threshold_hours: thresholdHours,
      orphan_count: orphans.length,
      orphans,
    });
  }

  const deleted: string[] = [];
  const failed: { id: string; error: string }[] = [];
  for (const orphan of orphans) {
    const { error } = await svc.auth.admin.deleteUser(orphan.id);
    if (error) {
      failed.push({ id: orphan.id, error: error.message });
    } else {
      deleted.push(orphan.id);
    }
  }

  return NextResponse.json({
    threshold_hours: thresholdHours,
    scanned_orphans: orphans.length,
    deleted: deleted.length,
    failed,
  });
}
