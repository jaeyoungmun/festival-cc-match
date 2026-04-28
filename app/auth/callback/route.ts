import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const error = searchParams.get("error");
  const errorCode = searchParams.get("error_code");
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const token = searchParams.get("token");
  const type = searchParams.get("type");

  // 에러 파라미터 처리
  if (error) {
    const msg = errorCode === "otp_expired" ? "link_expired" : "auth_error";
    return NextResponse.redirect(`${origin}/auth/signup?error=${msg}`);
  }

  const supabase = await createClient();
  let user = null;

  // 형태 A — code 방식
  if (code) {
    const { data, error: err } =
      await supabase.auth.exchangeCodeForSession(code);
    if (err || !data.user) {
      console.error("[auth/callback] code error:", err);
      return NextResponse.redirect(`${origin}/auth/signup?error=invalid_code`);
    }
    user = data.user;
  }

  // 형태 B — token_hash 방식
  else if (token_hash && type) {
    const { data, error: err } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any,
    });
    if (err || !data.user) {
      console.error("[auth/callback] token_hash error:", err);
      return NextResponse.redirect(`${origin}/auth/signup?error=invalid_code`);
    }
    user = data.user;
  }

  // 형태 C — 이메일에서 오는 token + type=magiclink 방식
  else if (token && type) {
    const { data, error: err } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: type as any,
    });
    if (err || !data.user) {
      console.error("[auth/callback] token error:", err);
      return NextResponse.redirect(`${origin}/auth/signup?error=invalid_code`);
    }
    user = data.user;
  } else {
    return NextResponse.redirect(`${origin}/auth/signup?error=no_code`);
  }

  // 프로필 존재 여부 → 신규/기존 분기
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) {
    return NextResponse.redirect(`${origin}/feed`);
  } else {
    const email = encodeURIComponent(user.email ?? "");
    return NextResponse.redirect(`${origin}/auth/profile?email=${email}`);
  }
}
