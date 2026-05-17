"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RedeemPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    rolls: number;
    balance: number;
  } | null>(null);

  // 입력 시 4-4 형식으로 자동 정렬 (ABCD-EFGH)
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const cleaned = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const trimmed = cleaned.slice(0, 8);
    const formatted =
      trimmed.length > 4
        ? `${trimmed.slice(0, 4)}-${trimmed.slice(4)}`
        : trimmed;
    setCode(formatted);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.replace(/-/g, "").length !== 8) {
      setError("코드 8자리를 모두 입력해주세요");
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch("/api/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "충전에 실패했습니다");
      return;
    }
    setResult({ rolls: data.rolls, balance: data.balance });
  }

  return (
    <main className="min-h-screen t-page relative overflow-hidden chosun-body">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, var(--accent-glow), transparent 60%)",
        }}
      />

      <div
        className="relative w-full mx-auto flex flex-col"
        style={{ maxWidth: 480 }}
      >
        {/* 헤더 */}
        <header className="flex items-center gap-3 px-6 pt-9 pb-5">
          <button
            onClick={() => router.back()}
            className="chosun-btn-outline flex items-center justify-center"
            style={{
              width: 40,
              height: 40,
              borderRadius: 999,
              fontSize: 15,
            }}
          >
            <span>←</span>
          </button>
          <h1
            className="font-bold t-text chosun-title"
            style={{ fontSize: "1.4rem", letterSpacing: "-0.01em" }}
          >
            뽑기권 충전
          </h1>
        </header>

        {!result && (
          <div className="px-6 pb-10 anim-fade-up">
            {/* 안내 */}
            <div className="text-center mb-7">
              <div
                className="chosun-seal mx-auto mb-4 chosun-han"
                style={{ width: 56, height: 56, fontSize: 28 }}
              >
                券
              </div>
              <p
                className="font-bold t-text mb-2 chosun-title"
                style={{ fontSize: "1.3rem", letterSpacing: "-0.01em" }}
              >
                부스에서 받은 코드 입력
              </p>
              <p className="text-sm t-sub leading-relaxed">
                현장 부스에서 결제 후 받은
                <br />
                8자리 코드를 입력해주세요
              </p>
            </div>

            {/* 폼 */}
            <form
              onSubmit={handleSubmit}
              className="chosun-bordered"
              style={{ padding: 22, borderRadius: 18 }}
            >
              <label
                htmlFor="code"
                className="block text-sm font-medium t-text mb-2 chosun-title"
              >
                코드
              </label>
              <input
                id="code"
                type="text"
                inputMode="text"
                autoComplete="off"
                placeholder="ABCD-EFGH"
                value={code}
                onChange={handleChange}
                className="w-full rounded-xl bg-transparent t-text chosun-title text-center"
                style={{
                  height: 56,
                  border: "1.5px solid var(--border-accent)",
                  fontSize: 22,
                  letterSpacing: "0.15em",
                }}
                autoFocus
              />
              <p className="text-xs t-muted mt-2">
                대소문자 구분 없이 입력 가능해요. 하이픈(-)은 자동으로
                들어갑니다.
              </p>

              {error && (
                <p
                  className="text-xs text-center mt-4"
                  style={{ color: "var(--chosun-vermillion)" }}
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || code.replace(/-/g, "").length !== 8}
                className="chosun-btn chosun-title w-full mt-5"
                style={{
                  padding: "14px 0",
                  borderRadius: 12,
                  fontSize: 15,
                  letterSpacing: "0.04em",
                }}
              >
                {loading ? "확인 중..." : "코드 등록하기"}
              </button>
            </form>

            {/* 결제 안내 */}
            <div
              className="chosun-bordered mt-5"
              style={{ padding: 18, borderRadius: 14 }}
            >
              <p className="text-xs t-muted leading-relaxed">
                💡 코드는 축제 부스에서 현금/계좌이체로 결제하시면 받으실 수
                있어요.
                <br />
                위치: 에컬가는길목 컴퓨터과학전공 부스
              </p>
            </div>
          </div>
        )}

        {/* 성공 화면 */}
        {result && (
          <div className="px-6 pb-10 anim-fade-up text-center">
            <div className="flex flex-col items-center gap-3 mb-7">
              <div
                className="chosun-seal chosun-han"
                style={{ width: 72, height: 72, fontSize: 40 }}
              >
                縁
              </div>
              <h2
                className="font-bold t-text chosun-title"
                style={{ fontSize: "1.7rem", letterSpacing: "-0.01em" }}
              >
                충전 완료!
              </h2>
              <p className="text-sm t-sub">뽑기권이 충전되었어요</p>
            </div>

            <div
              className="chosun-bordered mb-6"
              style={{ padding: 22, borderRadius: 16 }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm t-sub">충전된 뽑기권</p>
                <p
                  className="font-bold t-accent-text chosun-title"
                  style={{ fontSize: "1.4rem" }}
                >
                  +{result.rolls}장
                </p>
              </div>
              <div className="chosun-divider my-3" />
              <div className="flex items-center justify-between">
                <p className="text-sm t-sub">총 잔여</p>
                <p
                  className="font-bold t-text chosun-title"
                  style={{ fontSize: "1.2rem" }}
                >
                  {result.balance}장
                </p>
              </div>
            </div>

            <button
              onClick={() => router.replace("/feed")}
              className="chosun-btn chosun-title w-full"
              style={{
                padding: "16px 0",
                borderRadius: 12,
                fontSize: 16,
                letterSpacing: "0.04em",
              }}
            >
              인연 찾으러 가기 →
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
