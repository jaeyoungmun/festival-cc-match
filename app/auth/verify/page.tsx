"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function VerifyForm() {
  const router = useRouter();
  const email = useSearchParams().get("email") ?? "";
  const [resendCool, setResendCool] = useState(60);
  const [resendDone, setResendDone] = useState(false);

  useEffect(() => {
    if (resendCool <= 0) return;
    const t = setTimeout(() => setResendCool((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCool]);

  async function handleResend() {
    if (resendCool > 0) return;
    await fetch("/api/auth/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setResendCool(60);
    setResendDone(true);
  }

  return (
    <main className="min-h-screen t-page relative overflow-hidden chosun-body">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 20%, var(--accent-glow), transparent 65%)",
        }}
      />

      <div
        className="relative w-full mx-auto flex flex-col items-center justify-center min-h-screen px-6 py-10"
        style={{ maxWidth: 480 }}
      >
        <div className="w-full text-center" style={{ maxWidth: 360 }}>
          {/* 아이콘 + 타이틀 */}
          <div className="anim-fade-up mb-7">
            <div
              className="text-6xl mb-4"
              style={{ animation: "float-up 3s ease-in-out infinite" }}
            >
              📨
            </div>
            <h1
              className="font-bold t-text mb-2 chosun-title"
              style={{ fontSize: "1.7rem", letterSpacing: "-0.01em" }}
            >
              이메일을 확인해주세요
            </h1>
            <p className="text-sm t-sub leading-relaxed">
              <span
                className="font-medium"
                style={{ color: "var(--chosun-vermillion)" }}
              >
                {email}
              </span>
              <br />
              으로 인증 메일을 보냈어요
            </p>
          </div>

          {/* 안내 카드 */}
          <div
            className="chosun-bordered anim-fade-up anim-delay-1 text-left mb-4"
            style={{ padding: 22, borderRadius: 16 }}
          >
            <div className="space-y-4">
              {[
                { num: "一", text: "이메일 받은 편지함을 열어주세요" },
                {
                  num: "二",
                  text: "'인연 찾기' 메일의 링크를 클릭해주세요",
                },
                { num: "三", text: "자동으로 로그인돼요" },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span
                    className="chosun-han flex-shrink-0 flex items-center justify-center"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: "var(--accent-soft)",
                      border: "1.5px solid var(--border-accent)",
                      color: "var(--chosun-vermillion)",
                      fontSize: 16,
                    }}
                  >
                    {step.num}
                  </span>
                  <p className="text-sm t-sub">{step.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 스팸 폴더 안내 — 새 도메인이라 초반엔 스팸함으로 분류되는 경우 잦음 */}
          <div
            className="anim-fade-up anim-delay-1 mb-6"
            style={{
              padding: "12px 16px",
              borderRadius: 12,
              background: "var(--accent-soft)",
              border: "1.5px solid var(--border-accent)",
            }}
          >
            <p
              className="text-xs t-sub leading-relaxed"
              style={{ fontFamily: "'Nanum Myeongjo', serif" }}
            >
              <span
                className="font-semibold"
                style={{ color: "var(--chosun-vermillion)" }}
              >
                메일이 안 보이나요?
              </span>{" "}
              <span className="font-medium t-text">스팸 폴더</span>도 꼭
              확인해주세요
            </p>
          </div>

          {/* 재전송 */}
          <div className="anim-fade-up anim-delay-2 space-y-3">
            {resendDone && (
              <p
                className="text-xs"
                style={{ color: "var(--chosun-vermillion)" }}
              >
                ✓ 다시 보냈어요! 받은 편지함을 확인해주세요
              </p>
            )}
            <button
              onClick={handleResend}
              disabled={resendCool > 0}
              className="chosun-btn-outline chosun-title w-full"
              style={{
                padding: "12px 0",
                borderRadius: 10,
                fontSize: 13,
                letterSpacing: "0.04em",
                opacity: resendCool > 0 ? 0.5 : 1,
              }}
            >
              {resendCool > 0
                ? `${resendCool}초 후 재전송 가능`
                : "이메일 다시 받기"}
            </button>
            <button
              onClick={() => router.push("/auth/signup")}
              className="text-xs t-muted underline underline-offset-2 mt-2"
              style={{ cursor: "pointer" }}
            >
              학번 다시 입력하기
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  );
}
