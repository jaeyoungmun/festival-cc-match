"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const FLOATERS = [
  { emoji: "🌸", x: 8, y: 12, size: 22, delay: 0, dur: 7 },
  { emoji: "💫", x: 88, y: 8, size: 18, delay: 1.2, dur: 9 },
  { emoji: "🎪", x: 5, y: 55, size: 26, delay: 2.5, dur: 8 },
  { emoji: "✨", x: 92, y: 40, size: 16, delay: 0.8, dur: 6 },
  { emoji: "💌", x: 78, y: 75, size: 24, delay: 3.1, dur: 10 },
  { emoji: "🌟", x: 15, y: 80, size: 20, delay: 1.8, dur: 7 },
  { emoji: "🎉", x: 50, y: 5, size: 18, delay: 4.0, dur: 8 },
  { emoji: "💕", x: 62, y: 88, size: 22, delay: 2.2, dur: 9 },
];

const STEPS = [
  { icon: "📧", title: "학교 이메일 인증", desc: "재학생만 가입 가능해요" },
  { icon: "📸", title: "인스타 ID 등록", desc: "공개 계정으로 설정해주세요" },
  { icon: "💘", title: "인연 찾기", desc: "이성의 인스타를 만나보세요" },
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
    <main className="min-h-screen t-page relative overflow-hidden flex flex-col">
      {/* 배경 플로팅 이모지 */}
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
        {/* 배경 글로우 블롭 */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, var(--accent-glow), transparent 70%)",
          }}
        />
      </div>

      {/* 헤더 */}
      <header className="relative flex items-center justify-between px-6 pt-7 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎪</span>
          <span
            className="font-bold t-text"
            style={{ fontFamily: "'Gaegu', cursive", fontSize: 20 }}
          >
            축제 인연
          </span>
        </div>
        <button
          onClick={() => router.push("/auth/signup")}
          className="font-semibold transition-all active:scale-95"
          style={{
            fontSize: 14,
            padding: "10px 20px",
            borderRadius: 50,
            color: "var(--accent-text)",
            background:
              "linear-gradient(135deg, var(--accent-from), var(--accent-to))",
            boxShadow: "var(--shadow-btn)",
          }}
        >
          로그인
        </button>
      </header>

      {/* 히어로 */}
      <section className="relative flex-1 flex flex-col items-center px-6 pt-10 pb-10 text-center">
        {/* 뱃지 */}
        <div
          className="anim-fade-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-7 text-xs font-medium t-badge t-sub"
          style={{ border: "1px solid var(--border)" }}
        >
          <span>🎊</span>
          <span>축제 기간 한정 서비스</span>
        </div>

        {/* 메인 타이틀 */}
        <h1
          className="anim-fade-up anim-delay-1 font-bold leading-tight mb-5"
          style={{
            fontFamily: "'Gaegu', cursive",
            fontSize: "clamp(2.2rem, 7vw, 3.6rem)",
          }}
        >
          <span className="t-text">축제에서</span>
          <br />
          <span className="t-accent-text">인연</span>
          <span className="t-text">을 만나요</span>
        </h1>

        {/* 서브 */}
        <p
          className="anim-fade-up anim-delay-2 t-sub text-base leading-relaxed mb-9"
          style={{ maxWidth: 280 }}
        >
          같은 학교 이성의 인스타를 확인하고
          <br />
          직접 DM을 보내보세요
        </p>

        {/* CTA 버튼 */}
        <div
          className="anim-fade-up anim-delay-3 flex flex-col items-center gap-3"
          style={{ width: "100%", maxWidth: 320 }}
        >
          <button
            onClick={() => router.push("/auth/signup")}
            className="w-full font-semibold text-base transition-all active:scale-95"
            style={{
              padding: "16px 0",
              borderRadius: 16,
              background:
                "linear-gradient(135deg, var(--accent-from), var(--accent-to))",
              color: "var(--accent-text)",
              boxShadow: "var(--shadow-btn)",
            }}
          >
            지금 시작하기 →
          </button>
          <p className="text-xs t-muted">
            학교 이메일(.ac.kr)로만 가입 가능해요
          </p>
        </div>

        {/* 구분선 */}
        <div
          className="anim-fade-up anim-delay-4 mt-12 mb-8"
          style={{
            height: 1,
            background: "var(--border)",
            width: "100%",
            maxWidth: 380,
          }}
        />

        {/* 3단계 설명 */}
        <div
          className="anim-fade-up anim-delay-4 space-y-3"
          style={{ width: "100%", maxWidth: 380 }}
        >
          <p
            className="text-xs font-medium t-muted mb-5"
            style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}
          >
            이렇게 사용해요
          </p>
          {STEPS.map((step, i) => (
            <div
              key={i}
              className="flex items-center gap-4 t-card"
              style={{
                padding: "14px 16px",
                borderRadius: 16,
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div
                className="flex-shrink-0 flex items-center justify-center text-xl"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "var(--accent-soft)",
                }}
              >
                {step.icon}
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-semibold t-text mb-0.5">
                  {step.title}
                </p>
                <p className="text-xs t-sub">{step.desc}</p>
              </div>
              <span className="text-xs font-bold t-muted flex-shrink-0">
                0{i + 1}
              </span>
            </div>
          ))}
        </div>

        {/* 가격 안내 */}
        <div
          className="mt-6 t-card"
          style={{
            width: "100%",
            maxWidth: 380,
            padding: "20px",
            borderRadius: 20,
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold t-text">💰 리롤 패키지</p>
            <span
              className="text-xs px-2 py-1 rounded-full t-badge t-sub"
              style={{ border: "1px solid var(--border)" }}
            >
              가입 시 3회 무료
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "5회", price: "1,500원", per: "회당 300원" },
              { label: "7회", price: "2,500원", per: "회당 357원", hot: true },
            ].map((pkg, i) => (
              <div
                key={i}
                className="text-center"
                style={{
                  padding: "14px 12px",
                  borderRadius: 12,
                  background: pkg.hot
                    ? "var(--accent-soft)"
                    : "var(--bg-card-hover)",
                  border: `1px solid ${pkg.hot ? "var(--border-accent)" : "var(--border)"}`,
                }}
              >
                {pkg.hot && (
                  <p
                    className="font-bold mb-1 t-accent-text"
                    style={{ fontSize: 10 }}
                  >
                    인기
                  </p>
                )}
                <p
                  className="font-bold t-text"
                  style={{ fontFamily: "'Gaegu', cursive", fontSize: 15 }}
                >
                  {pkg.label}
                </p>
                <p
                  className="font-semibold t-accent-text"
                  style={{ fontSize: 17 }}
                >
                  {pkg.price}
                </p>
                <p className="t-muted mt-0.5" style={{ fontSize: 11 }}>
                  {pkg.per}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="relative px-8 py-6 text-center">
        <p
          className="text-xs t-muted"
          style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
        >
          © 2025 축제 인연 찾기 · 재학생 전용 서비스
        </p>
      </footer>
    </main>
  );
}
