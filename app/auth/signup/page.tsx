"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Step = "email" | "login" | "consent";

function LoginForm() {
  const router = useRouter();
  const supabase = createClient();
  const searchParams = useSearchParams();

  const urlError = searchParams.get("error");
  const [step, setStep] = useState<Step>("email");
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState(
    urlError === "link_expired"
      ? "링크가 만료됐어요. 다시 시도해주세요"
      : urlError === "auth_error"
        ? "인증에 실패했어요. 다시 시도해주세요"
        : "",
  );

  const email = studentId ? `${studentId}@sangmyung.kr` : "";

  async function handleEmailNext(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6,}$/.test(studentId)) {
      setError("학번을 숫자로 입력해주세요");
      return;
    }
    setLoading(true);
    setError("");
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
    setStep(data.exists ? "login" : "consent");
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!password) {
      setError("비밀번호를 입력해주세요");
      return;
    }
    setLoading(true);
    setError("");
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (signInError) {
      setError("이메일 또는 비밀번호가 올바르지 않습니다");
      return;
    }
    router.replace("/feed");
  }

  async function handleConsentNext(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed) {
      setError("동의가 필요합니다");
      return;
    }
    if (password.length < 8) {
      setError("비밀번호는 8자 이상으로 설정해주세요");
      return;
    }
    setLoading(true);
    setError("");
    // signUp → Confirm Sign Up 템플릿이 발송됨. {{ .Token }} 6자리 코드 포함 필요.
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });
    setLoading(false);
    if (signUpError) {
      const msg = (signUpError.message ?? "").toLowerCase();
      const status = (signUpError as { status?: number }).status;
      if (
        status === 429 ||
        msg.includes("rate limit") ||
        msg.includes("unexpected end of json")
      ) {
        setError("이메일 발송 한도를 초과했어요. 1시간 후 다시 시도해주세요");
        return;
      }
      if (msg.includes("already") || msg.includes("registered")) {
        setError("이미 가입된 이메일이에요. 처음으로 돌아가 로그인해주세요");
        return;
      }
      setError("가입 요청에 실패했어요. 다시 시도해주세요");
      return;
    }
    router.push(`/auth/verify?email=${encodeURIComponent(email)}`);
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
        <div className="w-full" style={{ maxWidth: 360 }}>
          {/* 헤더 */}
          <div className="text-center mb-8 anim-fade-up">
            <button
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
              className="font-bold t-text chosun-title"
              style={{ fontSize: "1.8rem", letterSpacing: "-0.01em" }}
            >
              인연 맺기
            </h1>
            <p className="text-sm t-sub mt-2">
              {step === "email" && "상명대 학번으로 시작해요"}
              {step === "login" && "비밀번호를 입력해주세요"}
              {step === "consent" && "처음 오셨군요! 동의 후 가입해요"}
            </p>
          </div>

          {/* 1단계 — 학번 */}
          {step === "email" && (
            <form
              onSubmit={handleEmailNext}
              className="chosun-bordered anim-fade-up anim-delay-1"
              style={{ padding: 24, borderRadius: 18 }}
            >
              <div className="space-y-2 mb-5">
                <Label
                  htmlFor="studentId"
                  className="t-text text-sm font-medium chosun-title"
                >
                  학번
                </Label>
                <Input
                  id="studentId"
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  placeholder="예: 202012345"
                  value={studentId}
                  onChange={(e) => {
                    setStudentId(e.target.value.replace(/\D/g, ""));
                    setError("");
                  }}
                  className="rounded-xl bg-transparent t-text h-12"
                  style={{
                    border: "1.5px solid var(--border-accent)",
                  }}
                  autoFocus
                  required
                />
                <p className="text-xs t-muted">
                  입력한 학번@sangmyung.kr 로 인증 메일이 발송돼요
                </p>
              </div>
              {error && (
                <p
                  className="text-xs text-center mb-4"
                  style={{ color: "var(--chosun-vermillion)" }}
                >
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading || !studentId}
                className="chosun-btn chosun-title w-full"
                style={{
                  padding: "14px 0",
                  borderRadius: 12,
                  fontSize: 15,
                  letterSpacing: "0.04em",
                }}
              >
                {loading ? "확인 중..." : "계속하기 →"}
              </button>
            </form>
          )}

          {/* 2a단계 — 기존 유저 비밀번호 로그인 */}
          {step === "login" && (
            <form
              onSubmit={handleLogin}
              className="chosun-bordered anim-fade-up"
              style={{ padding: 24, borderRadius: 18 }}
            >
              <div
                className="flex items-center justify-between p-3 mb-4"
                style={{
                  border: "1.5px solid var(--border)",
                  borderRadius: 10,
                  background: "var(--bg-badge)",
                }}
              >
                <p className="text-sm t-text truncate">{email}</p>
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setPassword("");
                    setError("");
                  }}
                  className="text-xs t-muted ml-2 flex-shrink-0 underline underline-offset-2"
                  style={{ cursor: "pointer" }}
                >
                  변경
                </button>
              </div>
              <div className="space-y-2 mb-5">
                <Label
                  htmlFor="password"
                  className="t-text text-sm font-medium chosun-title"
                >
                  비밀번호
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPw ? "text" : "password"}
                    placeholder="비밀번호 입력"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    className="rounded-xl bg-transparent t-text h-12 pr-12"
                    style={{
                      border: "1.5px solid var(--border-accent)",
                    }}
                    autoFocus
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-lg t-muted"
                    style={{ cursor: "pointer" }}
                  >
                    {showPw ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>
              {error && (
                <p
                  className="text-xs text-center mb-4"
                  style={{ color: "var(--chosun-vermillion)" }}
                >
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading || !password}
                className="chosun-btn chosun-title w-full"
                style={{
                  padding: "14px 0",
                  borderRadius: 12,
                  fontSize: 15,
                  letterSpacing: "0.04em",
                }}
              >
                {loading ? "로그인 중..." : "로그인"}
              </button>
            </form>
          )}

          {/* 2b단계 — 신규 유저 동의 */}
          {step === "consent" && (
            <form
              onSubmit={handleConsentNext}
              className="chosun-bordered anim-fade-up"
              style={{ padding: 24, borderRadius: 18 }}
            >
              <div
                className="flex items-center gap-3 p-3 mb-4"
                style={{
                  borderRadius: 10,
                  background: "var(--accent-soft)",
                  border: "1.5px solid var(--border-accent)",
                }}
              >
                <span className="text-xl">🏮</span>
                <div>
                  <p
                    className="text-sm font-semibold t-text chosun-title"
                    style={{ letterSpacing: "0.02em" }}
                  >
                    처음 오셨군요!
                  </p>
                  <p className="text-xs t-sub mt-0.5">
                    이메일로 8자리 인증 코드를 보내드려요
                  </p>
                </div>
              </div>

              <div
                className="p-3 mb-4"
                style={{
                  borderRadius: 10,
                  border: "1.5px solid var(--border)",
                  background: "var(--bg-badge)",
                }}
              >
                <p className="text-xs t-muted mb-1">가입 이메일</p>
                <p className="text-sm font-medium t-text">{email}</p>
              </div>

              <div className="space-y-2 mb-4">
                <Label
                  htmlFor="newPassword"
                  className="t-text text-sm font-medium chosun-title"
                >
                  비밀번호
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPw ? "text" : "password"}
                    placeholder="8자 이상"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    className="rounded-xl bg-transparent t-text h-12 pr-12"
                    style={{
                      border: "1.5px solid var(--border-accent)",
                    }}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-lg t-muted"
                    style={{ cursor: "pointer" }}
                  >
                    {showPw ? "🙈" : "👁️"}
                  </button>
                </div>
                <p className="text-xs t-muted">
                  다음 로그인 때 사용해요. 잘 기억해주세요!
                </p>
              </div>

              <label
                className="flex gap-3 p-4 mb-4 transition-colors"
                style={{
                  cursor: "pointer",
                  borderRadius: 12,
                  background: agreed
                    ? "var(--accent-soft)"
                    : "var(--bg-card-hover)",
                  border: `2px solid ${agreed ? "var(--chosun-vermillion)" : "var(--border)"}`,
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
                        ? "var(--chosun-vermillion)"
                        : "var(--border)",
                      background: agreed
                        ? "var(--chosun-vermillion)"
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
                    style={{ color: "var(--chosun-vermillion)" }}
                  >
                    내 인스타그램 ID가 이성 회원에게 공개
                  </span>
                  됩니다. 가입은 이에 동의하는 것으로 간주됩니다.{" "}
                  <span className="font-medium t-text">반드시 공개 계정</span>
                  으로 설정해주세요.
                </p>
              </label>

              {error && (
                <p
                  className="text-xs text-center mb-4"
                  style={{ color: "var(--chosun-vermillion)" }}
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !agreed || password.length < 8}
                className="chosun-btn chosun-title w-full mb-2"
                style={{
                  padding: "14px 0",
                  borderRadius: 12,
                  fontSize: 15,
                  letterSpacing: "0.04em",
                }}
              >
                {loading ? "전송 중..." : "인증 코드 받기 ✉️"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setPassword("");
                  setError("");
                }}
                className="w-full text-sm t-muted py-2"
                style={{ cursor: "pointer" }}
              >
                ← 학번 다시 입력
              </button>
            </form>
          )}

          <p className="text-center text-xs t-muted mt-6">
            로그인하면{" "}
            <span
              className="font-medium"
              style={{ color: "var(--chosun-vermillion)" }}
            >
              인연 맺기
            </span>{" "}
            이용약관에 동의한 것으로 간주돼요
          </p>
        </div>
      </div>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
