"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Supabase Confirm Sign Up 토큰 길이 (대시보드 설정과 일치해야 함)
const CODE_LENGTH = 8;

function VerifyForm() {
  const router = useRouter();
  const supabase = createClient();
  const email = useSearchParams().get("email") ?? "";

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [resendCool, setResendCool] = useState(60);
  const [resendDone, setResendDone] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // 진입 직후 첫 칸에 포커스
  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendCool <= 0) return;
    const t = setTimeout(() => setResendCool((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCool]);

  function setDigitAt(i: number, v: string) {
    setDigits((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
  }

  function handleInput(i: number, raw: string) {
    setError("");
    // 한 자리만 받되, 붙여넣기로 여러 자리가 들어오면 분배
    const cleaned = raw.replace(/\D/g, "");
    if (!cleaned) {
      setDigitAt(i, "");
      return;
    }
    if (cleaned.length === 1) {
      setDigitAt(i, cleaned);
      if (i < CODE_LENGTH - 1) inputsRef.current[i + 1]?.focus();
      // 마지막 칸 입력 시 자동 제출 시도
      if (i === CODE_LENGTH - 1) {
        const codeArr = [...digits];
        codeArr[i] = cleaned;
        const code = codeArr.join("");
        if (code.length === CODE_LENGTH) verify(code);
      }
      return;
    }
    // 여러 자리 입력 (붙여넣기)
    const chars = cleaned.slice(0, CODE_LENGTH - i).split("");
    setDigits((prev) => {
      const next = [...prev];
      chars.forEach((c, k) => {
        next[i + k] = c;
      });
      return next;
    });
    const lastIdx = Math.min(i + chars.length, CODE_LENGTH - 1);
    inputsRef.current[lastIdx]?.focus();
    // 전체 자리 채워졌으면 자동 제출
    const merged = [...digits];
    chars.forEach((c, k) => {
      merged[i + k] = c;
    });
    if (merged.every((d) => d !== "")) verify(merged.join(""));
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputsRef.current[i - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && i > 0) inputsRef.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < CODE_LENGTH - 1)
      inputsRef.current[i + 1]?.focus();
  }

  async function verify(code: string) {
    if (verifying) return;
    setVerifying(true);
    setError("");

    // signUp으로 생성된 미확인 유저의 Confirm Sign Up 코드 검증.
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "signup",
    });

    if (verifyError) {
      setVerifying(false);
      // 잘못된 코드 / 만료
      const msg = verifyError.message?.toLowerCase() ?? "";
      if (msg.includes("expired")) {
        setError("코드가 만료됐어요. 다시 받아주세요");
      } else {
        setError("코드가 일치하지 않아요");
      }
      // 입력 초기화 + 첫 칸 포커스
      setDigits(Array(CODE_LENGTH).fill(""));
      setTimeout(() => inputsRef.current[0]?.focus(), 50);
      return;
    }

    // 프로필 유무로 분기
    const res = await fetch("/api/user/me");
    if (res.status === 404) {
      router.replace(`/auth/profile?email=${encodeURIComponent(email)}`);
      return;
    }
    router.replace("/feed");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = digits.join("");
    if (code.length === CODE_LENGTH) verify(code);
  }

  async function handleResend() {
    if (resendCool > 0) return;
    setError("");
    // signUp으로 생성된 미확인 유저에게 Confirm Sign Up 코드 재발송.
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
    });
    if (resendError) {
      const msg = (resendError.message ?? "").toLowerCase();
      const status = (resendError as { status?: number }).status;
      console.error("[verify] resend error:", resendError);
      if (
        status === 429 ||
        msg.includes("rate limit") ||
        msg.includes("unexpected end of json")
      ) {
        setError("발송 한도를 초과했어요. 잠시 후 다시 시도해주세요");
      } else if (msg.includes("already") && msg.includes("confirmed")) {
        // 이미 인증된 유저면 코드 재발송이 불가 — 로그인 페이지로 안내
        setError("이미 인증된 계정이에요. 로그인 페이지로 이동해주세요");
      } else {
        setError("재발송에 실패했어요. 잠시 후 다시 시도해주세요");
      }
      return;
    }
    setResendCool(60);
    setResendDone(true);
    setDigits(Array(CODE_LENGTH).fill(""));
    inputsRef.current[0]?.focus();
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
            <button
              type="button"
              onClick={() => router.push("/")}
              className="chosun-seal mx-auto mb-4 chosun-han"
              style={{
                width: 56,
                height: 56,
                fontSize: 28,
                cursor: "pointer",
              }}
            >
              緣
            </button>
            <h1
              className="font-bold t-text mb-2 chosun-title"
              style={{ fontSize: "1.7rem", letterSpacing: "-0.01em" }}
            >
              인증 코드 입력
            </h1>
            <p className="text-sm t-sub leading-relaxed">
              <span
                className="font-medium"
                style={{ color: "var(--chosun-vermillion)" }}
              >
                {email}
              </span>
              <br />
              으로 8자리 코드를 보냈어요
            </p>
          </div>

          {/* 코드 입력 */}
          <form
            onSubmit={handleSubmit}
            className="chosun-bordered anim-fade-up anim-delay-1 mb-4"
            style={{ padding: 22, borderRadius: 16 }}
          >
            <div className="flex justify-between gap-1 mb-3">
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputsRef.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleInput(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onPaste={(e) => {
                    e.preventDefault();
                    handleInput(i, e.clipboardData.getData("text"));
                  }}
                  className="bg-transparent t-text chosun-title text-center min-w-0 flex-1"
                  style={{
                    height: 52,
                    borderRadius: 8,
                    border: "1.5px solid var(--border-accent)",
                    fontSize: 20,
                    letterSpacing: 0,
                    padding: 0,
                  }}
                  disabled={verifying}
                  autoComplete="one-time-code"
                />
              ))}
            </div>

            {error && (
              <p
                className="text-xs text-center mt-2"
                style={{ color: "var(--chosun-vermillion)" }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={verifying || digits.some((d) => !d)}
              className="chosun-btn chosun-title w-full mt-4"
              style={{
                padding: "14px 0",
                borderRadius: 12,
                fontSize: 15,
                letterSpacing: "0.04em",
              }}
            >
              {verifying ? "확인 중..." : "인증하기"}
            </button>
          </form>

          {/* 스팸 폴더 안내 */}
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

          {/* 재전송 / 이메일 변경 */}
          <div className="anim-fade-up anim-delay-2 space-y-3">
            {resendDone && (
              <p
                className="text-xs"
                style={{ color: "var(--chosun-vermillion)" }}
              >
                ✓ 새 코드를 보냈어요
              </p>
            )}
            <button
              onClick={handleResend}
              disabled={resendCool > 0}
              type="button"
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
                : "코드 다시 받기"}
            </button>
            <button
              type="button"
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
