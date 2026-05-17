import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/auth/send-code
// Body: { email: string }
//
// signUp으로 생성된 미확인 유저에게 Confirm Sign Up 메일을 재발송한다.
// Magic Link 템플릿이 아닌 Confirm Sign Up 템플릿이 트리거되어야 {{ .Token }} 6자리가 박혀 나옴.
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

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
  });

  if (error) {
    // "Unexpected end of JSON input" 같은 SDK 내부 예외도 함께 잡히도록
    // name/stack까지 한 줄 문자열로 풀어서 찍는다 (Vercel 로그 파이프라인이
    // 두 번째 인자를 잘 못 잡는 경우 대비).
    const err = error as unknown as {
      status?: number;
      code?: string;
      message?: string;
      name?: string;
      stack?: string;
    };
    console.error(
      `[send-code] status=${err.status} code=${err.code} name=${err.name} message=${err.message}`,
    );
    if (err.stack) console.error(`[send-code] stack: ${err.stack}`);

    // Supabase Auth는 이메일/IP rate limit 초과 시 429를 반환한다.
    // 외부 SMTP(Resend 등) 전환 후에도 Auth 자체의 호출 빈도 제한은 그대로 적용됨.
    //
    // 단, supabase-js v2의 일부 버전에서 429 응답 본문 파싱이 실패하면 status가
    // 유실되고 message가 "Unexpected end of JSON input"으로만 남는 케이스가 있다.
    // 그 경우 사용자에게 일반 500을 띄우면 원인 파악이 어려우므로
    // message 패턴까지 같이 봐서 rate limit으로 매핑한다.
    const isRateLimit =
      err.status === 429 ||
      err.code === "over_email_send_rate_limit" ||
      (err.message ?? "").toLowerCase().includes("rate limit") ||
      (err.message ?? "").includes("Unexpected end of JSON input");

    if (isRateLimit) {
      return NextResponse.json(
        {
          error:
            "이메일 발송 한도를 초과했어요. 1시간 후 다시 시도해주세요.",
        },
        { status: 429 },
      );
    }

    return NextResponse.json(
      { error: "이메일 발송에 실패했습니다" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
