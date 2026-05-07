import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/auth/send-code
// Body: { email: string }
// Magic Link 이메일 발송
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const { email } = body ?? {};

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "이메일이 필요합니다" }, { status: 400 });
  }

  // 학교 이메일 형식 검증
  const domain = email.split("@")[1] ?? "";
  if (domain !== "sangmyung.kr") {
    return NextResponse.json(
      { error: "상명대학교 이메일(@sangmyung.kr)만 사용 가능합니다" },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  // 요청 origin에서 자동으로 콜백 URL 생성 — dev / Vercel preview / 프로덕션 모두 동작.
  // Supabase Auth → URL Configuration → Redirect URLs 화이트리스트에
  // 사용할 도메인을 등록해두어야 함 (예: https://yourdomain.com/auth/callback).
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${request.nextUrl.origin}/auth/callback`,
    },
  });

  if (error) {
    console.error("[send-code]", error);
    return NextResponse.json(
      { error: "이메일 발송에 실패했습니다" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
