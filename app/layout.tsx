import type { Metadata } from "next";
import "./globals.css";

const SITE_NAME = "인연 찾기";
const SITE_DESCRIPTION = "컴퓨터과학전공 부스에서 운영하는 시그널 [인연 찾기]";
const SITE_URL = "https://smu-signal.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
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
