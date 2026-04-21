import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// 로그인 없이 접근 가능한 경로
const PUBLIC_PATHS = ["/", "/auth/signup", "/auth/verify", "/auth/profile"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next({ request });

  // Supabase 세션 갱신 (쿠키 동기화)
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

  // 미인증 유저가 보호 경로 접근 → 가입 페이지로
  //   if (!user && !isPublic) {
  //     return NextResponse.redirect(new URL("/auth/signup", request.url));
  //   }

  // 인증된 유저가 auth 페이지 재접근 → 피드로
  if (user && pathname.startsWith("/auth/")) {
    // /auth/profile은 프로필 미완성 유저가 올 수 있으므로 허용
    if (pathname !== "/auth/profile") {
      return NextResponse.redirect(new URL("/feed", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
