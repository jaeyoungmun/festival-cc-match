"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";

const PACKAGES = [
  {
    id: "A",
    rolls: 5,
    price: 1500,
    priceLabel: "1,500원",
    perRoll: "300원/회",
    desc: "가볍게 시작해요",
    emoji: "🌱",
    hot: false,
  },
  {
    id: "B",
    rolls: 7,
    price: 2500,
    priceLabel: "2,500원",
    perRoll: "357원/회",
    desc: "가장 인기 있어요",
    emoji: "🔥",
    hot: true,
  },
];

function generateOrderId() {
  return `order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function PaymentSelectPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<"A" | "B">("B");
  const [loading, setLoading] = useState(false);

  async function handlePayment() {
    setLoading(true);
    try {
      const toss = await loadTossPayments(
        process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!,
      );
      const pkg = PACKAGES.find((p) => p.id === selected)!;
      const orderId = generateOrderId();

      const payment = toss.payment({ customerKey: `customer_${Date.now()}` });

      await payment.requestPayment({
        method: "CARD",
        amount: { currency: "KRW", value: pkg.price },
        orderId,
        orderName: `축제 인연 리롤 ${pkg.rolls}회 패키지`,
        successUrl: `${window.location.origin}/payment/success?packageId=${pkg.id}`,
        failUrl: `${window.location.origin}/payment/fail`,
      });
    } catch (e) {
      console.error("[payment]", e);
      setLoading(false);
    }
  }

  const pkg = PACKAGES.find((p) => p.id === selected)!;

  return (
    <main className="min-h-screen t-page flex flex-col relative overflow-hidden">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, var(--accent-glow), transparent 60%)",
        }}
      />

      <div
        className="relative"
        style={{
          maxWidth: 480,
          margin: "0 auto",
          padding: "0 20px 40px",
          width: "100%",
        }}
      >
        {/* 헤더 */}
        <header className="flex items-center gap-3 pt-10 pb-6">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full flex items-center justify-center t-badge transition-all active:scale-95"
            style={{ border: "1px solid var(--border)" }}
          >
            <span style={{ fontSize: 16 }}>←</span>
          </button>
          <h1
            className="font-bold t-text"
            style={{ fontFamily: "'Gaegu', cursive", fontSize: "1.5rem" }}
          >
            리롤 충전
          </h1>
        </header>

        {/* 안내 */}
        <div className="mb-6 anim-fade-up">
          <p className="text-sm t-sub leading-relaxed">
            리롤 1회로 새로운 이성의 인스타를 확인할 수 있어요.
            <br />
            가입 시 무료 3회가 기본 제공돼요 ✨
          </p>
        </div>

        {/* 패키지 선택 */}
        <div className="space-y-3 mb-8 anim-fade-up anim-delay-1">
          {PACKAGES.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p.id as "A" | "B")}
              className="w-full text-left transition-all active:scale-[0.99]"
              style={{
                padding: "20px",
                borderRadius: 20,
                border: `2px solid ${selected === p.id ? "var(--accent-from)" : "var(--border)"}`,
                background:
                  selected === p.id ? "var(--accent-soft)" : "var(--bg-card)",
                boxShadow: selected === p.id ? "var(--shadow-card)" : "none",
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* 선택 라디오 */}
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      border: `2px solid ${selected === p.id ? "var(--accent-from)" : "var(--border)"}`,
                      background:
                        selected === p.id
                          ? "linear-gradient(135deg, var(--accent-from), var(--accent-to))"
                          : "transparent",
                    }}
                  >
                    {selected === p.id && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="font-bold t-text"
                        style={{ fontSize: 16 }}
                      >
                        {p.emoji} 리롤 {p.rolls}회
                      </span>
                      {p.hot && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{
                            background:
                              "linear-gradient(135deg, var(--accent-from), var(--accent-to))",
                            color: "var(--accent-text)",
                          }}
                        >
                          인기
                        </span>
                      )}
                    </div>
                    <p className="text-xs t-muted mt-0.5">
                      {p.desc} · {p.perRoll}
                    </p>
                  </div>
                </div>
                <p
                  className="font-bold t-accent-text"
                  style={{ fontFamily: "'Gaegu', cursive", fontSize: "1.3rem" }}
                >
                  {p.priceLabel}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* 결제 요약 */}
        <div className="t-card t-card-shadow rounded-2xl p-5 mb-6 anim-fade-up anim-delay-2">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm t-sub">선택한 패키지</p>
            <p className="text-sm font-semibold t-text">리롤 {pkg.rolls}회</p>
          </div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm t-sub">결제 금액</p>
            <p
              className="font-bold t-accent-text"
              style={{ fontFamily: "'Gaegu', cursive", fontSize: "1.2rem" }}
            >
              {pkg.priceLabel}
            </p>
          </div>
          <div
            style={{ height: 1, background: "var(--border)", margin: "12px 0" }}
          />
          <p className="text-xs t-muted">
            결제 후 즉시 리롤이 충전돼요. 환불은 미사용 시에만 가능해요.
          </p>
        </div>

        {/* 결제 버튼 */}
        <button
          onClick={handlePayment}
          disabled={loading}
          className="w-full font-semibold transition-all active:scale-95 anim-fade-up anim-delay-3"
          style={{
            height: 56,
            borderRadius: 16,
            fontSize: 16,
            background:
              "linear-gradient(135deg, var(--accent-from), var(--accent-to))",
            color: "var(--accent-text)",
            boxShadow: "var(--shadow-btn)",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "결제창 여는 중..." : `${pkg.priceLabel} 결제하기 →`}
        </button>
      </div>
    </main>
  );
}
