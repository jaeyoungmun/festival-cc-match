"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const FLOATERS = [
  { emoji: "🏮", x: 8, y: 12, size: 26, delay: 0, dur: 9 },
  { emoji: "🌙", x: 88, y: 8, size: 22, delay: 1.2, dur: 11 },
  { emoji: "🍶", x: 5, y: 55, size: 24, delay: 2.5, dur: 8 },
  { emoji: "🌸", x: 92, y: 40, size: 20, delay: 0.8, dur: 7 },
  { emoji: "🪭", x: 78, y: 75, size: 26, delay: 3.1, dur: 10 },
  { emoji: "🍵", x: 15, y: 80, size: 22, delay: 1.8, dur: 9 },
  { emoji: "📜", x: 50, y: 5, size: 22, delay: 4.0, dur: 8 },
  { emoji: "🌾", x: 62, y: 88, size: 24, delay: 2.2, dur: 11 },
];

const STEPS = [
  {
    icon: "📜",
    title: "학번으로 가입하기",
    desc: "재학생만 가입가능합니다",
  },
  {
    icon: "📸",
    title: "인스타 ID 입력하기",
    desc: "공개 계정으로 입력바랍니다",
  },
  {
    icon: "🏮",
    title: "새로운 인연 만나기",
    desc: "내 운명의 상대를 만나보세요",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth
      .getUser()
      .then(({ data: { user } }: { data: { user: any } }) => {
        if (user) router.replace("/feed");
        else setChecking(false);
      });
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen t-page flex items-center justify-center">
        <div className="w-8 h-8 rounded-full t-accent-bg animate-pulse" />
      </div>
    );
  }

  return (
    <main className="min-h-screen t-page relative overflow-hidden chosun-body">
      {/* 배경 플로팅 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {FLOATERS.map((f, i) => (
          <span
            key={i}
            className="floating-emoji absolute select-none"
            style={
              {
                left: `${f.x}%`,
                top: `${f.y}%`,
                fontSize: `${f.size}px`,
                "--delay": `${f.delay}s`,
                "--dur": `${f.dur}s`,
              } as React.CSSProperties
            }
          >
            {f.emoji}
          </span>
        ))}
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, var(--accent-glow), transparent 70%)",
          }}
        />
      </div>

      {/* 컨테이너 */}
      <div
        className="relative w-full mx-auto flex flex-col"
        style={{ maxWidth: 480 }}
      >
        {/* 헤더 */}
        <header className="flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏮</span>
            <span
              className="font-bold t-text chosun-title"
              style={{ fontSize: 20 }}
            >
              컴과시그널
            </span>
          </div>
          <button
            onClick={() => router.push("/auth/signup")}
            className="chosun-btn font-semibold chosun-title"
            style={{
              fontSize: 13,
              padding: "9px 22px",
              borderRadius: 999,
              letterSpacing: "0.04em",
            }}
          >
            로그인
          </button>
        </header>

        {/* 히어로 */}
        <section className="px-6 pt-8 pb-12 text-center">
          {/* 도장 한자 */}
          <div className="flex justify-center mb-7">
            <div
              className="anim-fade-up chosun-seal"
              style={{ width: 64, height: 64, fontSize: 38 }}
            ></div>
          </div>

          {/* 부제 뱃지 */}
          <div
            className="anim-fade-up anim-delay-1 inline-flex items-center gap-2 px-4 py-1.5 mb-7 t-badge t-sub"
            style={{
              border: "1.5px solid var(--border-accent)",
              borderRadius: 999,
              fontSize: 12,
              letterSpacing: "0.1em",
            }}
          >
            <span>축제 기간 한정 서비스</span>
          </div>

          {/* 메인 타이틀 */}
          <h1
            className="anim-fade-up anim-delay-1 chosun-title mb-6"
            style={{ fontSize: "clamp(2rem, 6.5vw, 3.2rem)" }}
          >
            <span className="t-text">
              축제에서
              <br />
              인연을 만나요
            </span>
          </h1>

          {/* 서브 */}
          <p className="anim-fade-up anim-delay-2 t-sub leading-relaxed mb-10 mx-auto">
            같은 학교 이성의 인스타를 확인하고
            <br />
            직접 DM을 보내보세요
          </p>

          {/* CTA */}
          <div
            className="anim-fade-up anim-delay-3 flex flex-col items-center gap-4 mx-auto"
            style={{ maxWidth: 360 }}
          >
            <button
              onClick={() => router.push("/auth/signup")}
              className="chosun-btn chosun-title w-full"
              style={{
                padding: "16px 0",
                borderRadius: 12,
                fontSize: 17,
                letterSpacing: "0.04em",
              }}
            >
              지금 시작하기 →
            </button>
            <p className="text-xs t-muted">
              학번(@sangmyung.kr)으로 가입 가능해요
            </p>
          </div>
        </section>

        {/* 구분선 */}
        <div
          className="anim-fade-up anim-delay-4 chosun-divider"
          style={{ width: "calc(100% - 48px)", margin: "16px auto" }}
        />

        {/* 3단계 안내 */}
        <section className="anim-fade-up anim-delay-4 px-6 py-10">
          <p
            className="text-xs font-medium t-muted mb-5 chosun-title text-center"
            style={{ letterSpacing: "0.18em" }}
          >
            · 이용안내 ·
          </p>
          <div className="space-y-4">
            {STEPS.map((step, i) => (
              <div
                key={i}
                className="flex items-center chosun-bordered gap-4"
                style={{
                  padding: "20px 22px",
                  borderRadius: 16,
                  margin: 8,
                }}
              >
                <div
                  className="flex-shrink-0 flex items-center justify-center text-xl"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 10,
                    background: "var(--accent-soft)",
                    border: "1.5px solid var(--border-accent)",
                  }}
                >
                  {step.icon}
                </div>
                <div className="text-left flex-1">
                  <p
                    className="text-sm font-semibold t-text mb-1 chosun-title"
                    style={{ letterSpacing: "-0.01em" }}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs t-sub">{step.desc}</p>
                </div>
                <span
                  className="font-bold t-muted flex-shrink-0 chosun-han"
                  style={{ fontSize: 20 }}
                >
                  {["一", "二", "三"][i]}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 인연패 안내 */}
        <section className="px-6 py-10 pt-0">
          <div
            className="chosun-bordered"
            style={{
              padding: "26px 22px",
              borderRadius: 18,
              margin: "8px",
            }}
          >
            <div className="flex flex-wrap items-baseline justify-between mb-5 gap-3">
              <p
                className="text-sm font-semibold t-text chosun-title"
                style={{ letterSpacing: "0.02em" }}
              >
                뽑기
              </p>
              <span
                className="text-xs t-muted text-right"
                style={{ fontFamily: "'Nanum Myeongjo', serif" }}
              >
                부스에서 뽑기권을 구매하세요
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "5장", price: "1,500원", per: "장당 300원" },
                {
                  label: "7장",
                  price: "2,500원",
                  per: "장당 357원",
                  hot: true,
                },
              ].map((pkg, i) => (
                <button
                  key={i}
                  onClick={() => router.push("/auth/signup")}
                  className="chosun-card-hover text-center"
                  style={{
                    padding: "20px 14px",
                    margin: "4px",
                    borderRadius: 12,
                    background: pkg.hot
                      ? "var(--accent-soft)"
                      : "var(--bg-card)",
                    border: `2px solid ${pkg.hot ? "var(--chosun-vermillion)" : "var(--border)"}`,
                    cursor: "pointer",
                  }}
                >
                  {pkg.hot && (
                    <p
                      className="font-bold mb-1 chosun-han"
                      style={{
                        fontSize: 11,
                        color: "var(--chosun-vermillion)",
                      }}
                    >
                      인기
                    </p>
                  )}
                  <p
                    className="font-bold t-text chosun-title"
                    style={{ fontSize: 16 }}
                  >
                    {pkg.label}
                  </p>
                  <p
                    className="font-semibold t-accent-text chosun-title"
                    style={{ fontSize: 18 }}
                  >
                    {pkg.price}
                  </p>
                  <p className="t-muted mt-0.5" style={{ fontSize: 11 }}>
                    {pkg.per}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 푸터 */}
        <footer className="px-8 py-6 text-center mt-auto">
          <p
            className="text-xs t-muted"
            style={{ fontFamily: "'Nanum Myeongjo', serif" }}
          >
            © 2026 컴과시그널 ·
          </p>
        </footer>
      </div>
    </main>
  );
}
