"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed) {
      setError("동의가 필요합니다");
      return;
    }
    if (!email.includes("@")) {
      setError("올바른 이메일을 입력해주세요");
      return;
    }

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
      setError(data.error ?? "오류가 발생했습니다");
      return;
    }

    // 이메일을 verify 페이지로 전달
    router.push(`/auth/verify?email=${encodeURIComponent(email)}`);
  }

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{
        background:
          "linear-gradient(135deg, #fdf4ff 0%, #fce7f3 50%, #ede9fe 100%)",
      }}
    >
      {/* 배경 장식 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-20 -left-20 w-72 h-72 rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, #f472b6, transparent)",
          }}
        />
        <div
          className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, #a855f7, transparent)",
          }}
        />
      </div>

      <div className="relative w-full max-w-sm">
        {/* 헤더 */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">🎪</div>
          <h1
            className="text-3xl font-bold mb-2"
            style={{
              fontFamily: "'Gaegu', cursive",
              background: "linear-gradient(135deg, #ec4899, #a855f7)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            축제 인연 찾기
          </h1>
          <p
            className="text-sm text-gray-500"
            style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
          >
            학교 이메일로 시작해요
          </p>
        </div>

        {/* 폼 카드 */}
        <form
          onSubmit={handleSubmit}
          className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl shadow-pink-100 space-y-6"
        >
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-gray-700 font-medium text-sm"
            >
              학교 이메일
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="example@university.ac.kr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border-pink-100 focus:border-pink-300 focus:ring-pink-200 bg-white/80"
              required
            />
          </div>

          {/* 동의 체크박스 */}
          <label
            className="flex gap-3 p-4 rounded-2xl cursor-pointer transition-colors"
            style={{
              background: agreed
                ? "rgba(244,114,182,0.08)"
                : "rgba(0,0,0,0.03)",
            }}
          >
            <div className="relative flex-shrink-0 mt-0.5">
              <input
                type="checkbox"
                className="sr-only"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <div
                className="w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all"
                style={{
                  borderColor: agreed ? "#ec4899" : "#d1d5db",
                  background: agreed
                    ? "linear-gradient(135deg, #ec4899, #a855f7)"
                    : "white",
                }}
              >
                {agreed && <span className="text-white text-xs">✓</span>}
              </div>
            </div>
            <p
              className="text-xs text-gray-600 leading-relaxed"
              style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
            >
              <span className="font-semibold text-pink-500">
                내 인스타그램 ID가 이성 회원에게 공개
              </span>
              됩니다. 가입은 이에 동의하는 것으로 간주됩니다. 공개 계정으로
              설정해주세요.
            </p>
          </label>

          {error && <p className="text-xs text-red-400 text-center">{error}</p>}

          <Button
            type="submit"
            disabled={loading || !agreed}
            className="w-full rounded-xl h-12 font-semibold text-white transition-all"
            style={{
              background: agreed
                ? "linear-gradient(135deg, #ec4899, #a855f7)"
                : "#e5e7eb",
              boxShadow: agreed ? "0 4px 20px rgba(168,85,247,0.3)" : "none",
            }}
          >
            {loading ? "전송 중..." : "인증 코드 받기 ✉️"}
          </Button>
        </form>

        <p
          className="text-center text-xs text-gray-400 mt-6"
          style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
        >
          이미 가입했나요?{" "}
          <button
            onClick={() => router.push("/feed")}
            className="text-pink-400 underline underline-offset-2"
          >
            피드 보러가기
          </button>
        </p>
      </div>
    </main>
  );
}
