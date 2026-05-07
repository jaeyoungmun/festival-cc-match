import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CC - Campus Connection",
  description: "축제에서 스친 인연, 다시 볼 수 있을지 궁금하다면?",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    /*
     * ✏️  테마 변경은 여기 data-theme 하나만 바꾸면 됩니다
     *     "light"    — 화이트 / 깔끔
     *     "dark"     — 다크모드
     *     "festival" — 핑크·보라 그라디언트
     *     "sm_blue"  — 상명대 스뮤시그널 스타일 (파랑 계열)
     *     "chosun"   — 조선시대 주막 컨셉 (한지·먹·단청)
     */
    <html lang="ko" data-theme="chosun">
      <body>{children}</body>
    </html>
  );
}
