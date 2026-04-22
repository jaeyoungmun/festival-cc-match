import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CC-Campus Connection",
  description: "축제에서 스친 인연, 다시 볼 수 있을지 궁금하다면?",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    /*
     *     "light"    — 화이트 / 깔끔
     *     "dark"     — 다크모드
     *     "festival" — 핑크·보라 그라디언트
     */
    <html lang="ko" data-theme="light">
      <body>{children}</body>
    </html>
  );
}
