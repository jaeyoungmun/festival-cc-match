"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Step = "email" | "consent";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 1단계 — 이메일 입력 후 기존 유저 여부 확인
  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) {
      setError("올바른 이메일을 입력해주세요");
      return;
    }
    setLoading(true);
    setError("");

    // 기존 유저인지 먼저 확인
    const res = await fetch("/api/auth/check-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "오류가 발생했습니다");
      return;
    }

    if (data.exists) {
      // 기존 유저 → 동의 없이 바로 OTP 발송
      await sendOtp();
    } else {
      // 신규 유저 → 동의 단계로
      setStep("consent");
    }
  }

  // 2단계 — 동의 후 OTP 발송 (신규 유저)
  async function handleConsentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed) {
      setError("동의가 필요합니다");
      return;
    }
    await sendOtp();
  }

  async function sendOtp() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "이메일 발송에 실패했습니다");
      return;
    }
    router.push(`/auth/verify?email=${encodeURIComponent(email)}`);
  }

  return (
    <main className="min-h-screen t-page flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 20%, var(--accent-glow), transparent 65%)",
        }}
      />

      <div className="relative w-full" style={{ maxWidth: 360 }}>
        {/* 로고 */}
        <div className="text-center mb-8 anim-fade-up">
          <button
            onClick={() => router.push("/")}
            className="text-4xl mb-3 block mx-auto"
          >
            🎪
          </button>
          <h1
            className="font-bold t-accent-text"
            style={{ fontFamily: "'Gaegu', cursive", fontSize: "1.9rem" }}
          >
            축제 인연 찾기
          </h1>
          <p className="text-sm t-sub mt-1">
            {step === "email"
              ? "학교 이메일로 시작해요"
              : "서비스 이용 동의가 필요해요"}
          </p>
        </div>

        {/* ── 이메일 입력 단계 ── */}
        {step === "email" && (
          <form
            onSubmit={handleEmailSubmit}
            className="t-card t-card-shadow rounded-3xl p-7 space-y-5 anim-fade-up anim-delay-1"
          >
            <div className="space-y-1.5">
              <Label htmlFor="email" className="t-text text-sm font-medium">
                학교 이메일
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="example@university.ac.kr"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                className="rounded-xl bg-transparent t-text h-12"
                style={{ borderColor: "var(--border)" }}
                autoFocus
                required
              />
              <p className="text-xs t-muted">.sangmyung.kr 이메일만 가능해요</p>
            </div>

            {error && (
              <p className="text-xs text-red-400 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full font-semibold transition-all active:scale-95"
              style={{
                height: 48,
                borderRadius: 14,
                background:
                  "linear-gradient(135deg, var(--accent-from), var(--accent-to))",
                color: "var(--accent-text)",
                opacity: !email || loading ? 0.45 : 1,
                boxShadow: email ? "var(--shadow-btn)" : "none",
                fontSize: 15,
              }}
            >
              {loading ? "확인 중..." : "계속하기 →"}
            </button>
          </form>
        )}

        {/* ── 동의 단계 (신규 유저) ── */}
        {step === "consent" && (
          <form
            onSubmit={handleConsentSubmit}
            className="t-card t-card-shadow rounded-3xl p-7 space-y-5 anim-fade-up"
          >
            {/* 신규 안내 */}
            <div
              className="flex items-center gap-3 p-3 rounded-2xl"
              style={{
                background: "var(--accent-soft)",
                border: "1px solid var(--border-accent)",
              }}
            >
              <span className="text-xl">👋</span>
              <div>
                <p className="text-xs font-semibold t-text">처음 오셨군요!</p>
                <p className="text-xs t-sub mt-0.5">
                  아래 동의 후 가입이 완료돼요
                </p>
              </div>
            </div>

            {/* 이메일 확인 */}
            <div
              className="p-3 rounded-xl t-badge"
              style={{ border: "1px solid var(--border)" }}
            >
              <p className="text-xs t-muted mb-0.5">가입 이메일</p>
              <p className="text-sm font-medium t-text">{email}</p>
            </div>

            {/* 동의 체크박스 */}
            <label
              className="flex gap-3 p-4 rounded-2xl cursor-pointer transition-colors"
              style={{
                background: agreed
                  ? "var(--accent-soft)"
                  : "var(--bg-card-hover)",
                border: `1px solid ${agreed ? "var(--border-accent)" : "var(--border)"}`,
              }}
            >
              <div className="flex-shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={agreed}
                  onChange={(e) => {
                    setAgreed(e.target.checked);
                    setError("");
                  }}
                />
                <div
                  className="w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all"
                  style={{
                    borderColor: agreed
                      ? "var(--accent-from)"
                      : "var(--border)",
                    background: agreed
                      ? "linear-gradient(135deg, var(--accent-from), var(--accent-to))"
                      : "transparent",
                  }}
                >
                  {agreed && (
                    <span
                      className="text-white font-bold"
                      style={{ fontSize: 11 }}
                    >
                      ✓
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xs t-sub leading-relaxed">
                <span
                  className="font-semibold"
                  style={{ color: "var(--accent-from)" }}
                >
                  내 인스타그램 ID가 이성 회원에게 공개
                </span>
                됩니다. 가입은 이에 동의하는 것으로 간주됩니다.{" "}
                <span className="font-medium t-text">반드시 공개 계정</span>으로
                설정해주세요.
              </p>
            </label>

            {error && (
              <p className="text-xs text-red-400 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !agreed}
              className="w-full font-semibold transition-all active:scale-95"
              style={{
                height: 48,
                borderRadius: 14,
                background:
                  "linear-gradient(135deg, var(--accent-from), var(--accent-to))",
                color: "var(--accent-text)",
                opacity: !agreed || loading ? 0.45 : 1,
                boxShadow: agreed ? "var(--shadow-btn)" : "none",
                fontSize: 15,
              }}
            >
              {loading ? "전송 중..." : "인증 메일 받기 ✉️"}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep("email");
                setError("");
              }}
              className="w-full text-sm t-muted transition-all"
              style={{ paddingTop: 4 }}
            >
              ← 이메일 다시 입력
            </button>
          </form>
        )}

        <p className="text-center text-xs t-muted mt-6">
          로그인하면{" "}
          <span style={{ color: "var(--accent-from)" }}>축제 인연 찾기</span>{" "}
          서비스 이용약관에 동의한 것으로 간주돼요
        </p>
      </div>
    </main>
  );
}
