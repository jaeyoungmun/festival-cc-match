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
  const isSchoolEmail = /^[a-zA-Z0-9._%+-]+@sangmyung\.kr$/i.test(email);
  if (!isSchoolEmail) {
    return NextResponse.json(
      { error: "학교 이메일(sangmyung.kr)만 사용 가능합니다" },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      // Magic Link 클릭 시 리다이렉트될 주소
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
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
