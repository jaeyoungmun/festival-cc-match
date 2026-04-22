import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /auth/callback
// Supabase Magic Link 클릭 후 리다이렉트되는 엔드포인트
// 세션 교환 후 프로필 유무에 따라 분기
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  const supabase = await createClient();

  if (token_hash && type) {
    // 형태 B 처리
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any,
    });
    if (error || !data.user) {
      return NextResponse.redirect(`${origin}/auth/signup?error=invalid_token`);
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", data.user.id)
      .maybeSingle();
    return NextResponse.redirect(
      profile
        ? `${origin}/feed`
        : `${origin}/auth/profile?email=${encodeURIComponent(data.user.email ?? "")}`,
    );
  }

  if (code) {
    // 형태 A 처리
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error || !data.user) {
      return NextResponse.redirect(`${origin}/auth/signup?error=invalid_code`);
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", data.user.id)
      .maybeSingle();
    return NextResponse.redirect(
      profile
        ? `${origin}/feed`
        : `${origin}/auth/profile?email=${encodeURIComponent(data.user.email ?? "")}`,
    );
  }

  return NextResponse.redirect(`${origin}/auth/signup?error=no_code`);
}
