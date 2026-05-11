import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// 로그인 없이 접근 가능한 경로
const PUBLIC_PATHS = [
  "/",
  "/auth/signup",
  "/auth/verify",
  "/auth/profile",
  "/auth/callback",
];

// character 없어도 접근 가능한 (로그인된) 경로 — 이 외엔 /auth/character로 강제
const CHARACTER_EXEMPT_PATHS = [
  "/auth/character",
  "/auth/profile",
  "/mypage",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next({ request });

  // Supabase 세션 갱신
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );

  // 미인증 유저가 보호 경로 접근 → 로그인 페이지로
  if (!user && !isPublic) {
    return NextResponse.redirect(new URL("/auth/signup", request.url));
  }

  // 인증된 유저가 auth 페이지 재접근 → 피드로
  // /auth/profile, /auth/character는 신규/기존 유저가 올 수 있으므로 허용
  if (
    user &&
    pathname.startsWith("/auth/") &&
    pathname !== "/auth/profile" &&
    pathname !== "/auth/character"
  ) {
    return NextResponse.redirect(new URL("/feed", request.url));
  }

  // 로그인 유저인데 character 없음 → /auth/character로 강제 (보호 경로에서만)
  if (user && !isPublic) {
    const exempt = CHARACTER_EXEMPT_PATHS.some(
      (p) => pathname === p || pathname.startsWith(p + "/"),
    );
    if (!exempt) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("character")
        .eq("id", user.id)
        .maybeSingle();
      if (profile && !profile.character) {
        return NextResponse.redirect(new URL("/auth/character", request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
