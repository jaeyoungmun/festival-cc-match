import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "축제 인연 찾기",
  description: "축제에서 이성의 인스타를 만나보세요",
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
