"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

type Profile = {
  id: string;
  instagram_id: string;
  department: string | null;
};

type FeedState = "loading" | "card" | "empty" | "error" | "no_rerolls";

export default function FeedPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [state, setState] = useState<FeedState>("loading");
  const [flipped, setFlipped] = useState(false);
  const [cardKey, setCardKey] = useState(0); // 카드 애니메이션 리셋용

  const fetchBalance = useCallback(async () => {
    const res = await fetch("/api/user/balance");
    if (res.ok) {
      const data = await res.json();
      setBalance(data.balance ?? 0);
    }
  }, []);

  const fetchNext = useCallback(async () => {
    setState("loading");
    setFlipped(false);

    const res = await fetch("/api/feed/next");
    const data = await res.json();

    if (!res.ok) {
      setState("error");
      return;
    }
    if (data.empty) {
      setState("empty");
      return;
    }

    setProfile(data.profile);
    setCardKey((k) => k + 1);
    setState("card");
  }, []);

  useEffect(() => {
    fetchBalance();
    fetchNext();
  }, [fetchBalance, fetchNext]);

  async function handleReroll() {
    if (balance <= 0) {
      setState("no_rerolls");
      return;
    }

    const res = await fetch("/api/feed/reroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current_profile_id: profile?.id }), // 추가
    });
    const data = await res.json();

    if (!res.ok) {
      if (data.code === "NO_REROLLS_LEFT") {
        setState("no_rerolls");
        return;
      }
      setState("error");
      return;
    }

    setBalance(data.remaining);
    fetchNext();
  }

  return (
    <main
      className="min-h-screen flex flex-col"
      style={{
        background:
          "linear-gradient(160deg, #0f0f0f 0%, #1a0a1e 50%, #0d0d1a 100%)",
      }}
    >
      {/* 배경 글로우 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: "radial-gradient(circle, #f472b6, #a855f7)" }}
        />
        <div
          className="absolute bottom-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl"
          style={{
            background: "radial-gradient(circle, #a855f7, transparent)",
          }}
        />
      </div>

      {/* 헤더 */}
      <header className="relative flex items-center justify-between px-6 pt-10 pb-4">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{
              fontFamily: "'Gaegu', cursive",
              background: "linear-gradient(135deg, #f472b6, #a855f7)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            축제 인연 찾기
          </h1>
          <p
            className="text-xs mt-0.5"
            style={{
              color: "rgba(255,255,255,0.3)",
              fontFamily: "'Noto Sans KR', sans-serif",
            }}
          >
            오늘 축제에서 누군가를 만나보세요 🎪
          </p>
        </div>
        <button
          onClick={() => router.push("/mypage")}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
          style={{
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <span className="text-lg">👤</span>
        </button>
      </header>

      {/* 리롤 잔여 뱃지 */}
      <div className="relative flex justify-center mb-2">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(244,114,182,0.2)",
            color: balance > 0 ? "#f9a8d4" : "rgba(255,255,255,0.3)",
            fontFamily: "'Noto Sans KR', sans-serif",
          }}
        >
          <span>✨</span>
          <span>리롤 {balance}회 남음</span>
        </div>
      </div>

      {/* 메인 카드 영역 */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-6 pb-8">
        {state === "loading" && (
          <div className="flex flex-col items-center gap-4">
            <div
              className="w-16 h-16 rounded-full animate-pulse"
              style={{
                background: "linear-gradient(135deg, #f472b6, #a855f7)",
              }}
            />
            <p
              className="text-sm"
              style={{
                color: "rgba(255,255,255,0.4)",
                fontFamily: "'Noto Sans KR', sans-serif",
              }}
            >
              인연을 찾는 중...
            </p>
          </div>
        )}

        {state === "card" && profile && (
          <div key={cardKey} className="w-full max-w-sm animate-fade-in">
            {/* 카드 */}
            <div
              className="relative rounded-3xl overflow-hidden cursor-pointer select-none"
              style={{
                background:
                  "linear-gradient(145deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02))",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow:
                  "0 25px 60px rgba(0,0,0,0.5), 0 0 40px rgba(244,114,182,0.08)",
                minHeight: "420px",
              }}
              onClick={() => setFlipped((f) => !f)}
            >
              {/* 카드 상단 장식 */}
              <div
                className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl"
                style={{
                  background: "linear-gradient(90deg, #f472b6, #a855f7)",
                }}
              />

              {/* 별 장식 */}
              <div className="absolute top-6 right-6 text-2xl opacity-20">
                ✦
              </div>
              <div className="absolute bottom-24 left-6 text-sm opacity-10">
                ✦
              </div>

              <div
                className="flex flex-col items-center justify-center p-10 h-full"
                style={{ minHeight: "420px" }}
              >
                {!flipped ? (
                  /* 앞면 — 인스타 ID */
                  <div className="flex flex-col items-center gap-6 animate-fade-in">
                    <div
                      className="w-24 h-24 rounded-full flex items-center justify-center text-4xl"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(244,114,182,0.2), rgba(168,85,247,0.2))",
                        border: "2px solid rgba(244,114,182,0.3)",
                      }}
                    >
                      🌸
                    </div>

                    <div className="text-center">
                      <p
                        className="text-xs mb-3 tracking-widest uppercase"
                        style={{
                          color: "rgba(255,255,255,0.3)",
                          fontFamily: "'Noto Sans KR', sans-serif",
                        }}
                      >
                        instagram
                      </p>
                      <p
                        className="text-3xl font-bold mb-1"
                        style={{
                          fontFamily: "'Gaegu', cursive",
                          background:
                            "linear-gradient(135deg, #f9a8d4, #d8b4fe)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          wordBreak: "break-all",
                        }}
                      >
                        @{profile.instagram_id}
                      </p>
                      {profile.department && (
                        <p
                          className="text-sm mt-2"
                          style={{
                            color: "rgba(255,255,255,0.4)",
                            fontFamily: "'Noto Sans KR', sans-serif",
                          }}
                        >
                          {profile.department}
                        </p>
                      )}
                    </div>

                    <p
                      className="text-xs"
                      style={{
                        color: "rgba(255,255,255,0.2)",
                        fontFamily: "'Noto Sans KR', sans-serif",
                      }}
                    >
                      탭해서 인스타로 이동
                    </p>
                  </div>
                ) : (
                  /* 뒷면 — 인스타 이동 버튼 */
                  <div className="flex flex-col items-center gap-6 animate-fade-in">
                    <div className="text-5xl">💌</div>
                    <div className="text-center">
                      <p
                        className="text-lg font-bold mb-2"
                        style={{
                          color: "white",
                          fontFamily: "'Gaegu', cursive",
                        }}
                      >
                        DM 보내볼까요?
                      </p>
                      <p
                        className="text-sm"
                        style={{
                          color: "rgba(255,255,255,0.4)",
                          fontFamily: "'Noto Sans KR', sans-serif",
                        }}
                      >
                        @{profile.instagram_id}
                      </p>
                    </div>
                    <a
                      href={`https://instagram.com/${profile.instagram_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-8 py-3 rounded-2xl font-semibold text-white text-sm transition-all active:scale-95"
                      style={{
                        background: "linear-gradient(135deg, #f472b6, #a855f7)",
                        boxShadow: "0 4px 20px rgba(244,114,182,0.4)",
                        fontFamily: "'Noto Sans KR', sans-serif",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      인스타그램 열기 →
                    </a>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFlipped(false);
                      }}
                      className="text-xs"
                      style={{ color: "rgba(255,255,255,0.3)" }}
                    >
                      돌아가기
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 리롤 버튼 */}
            <div className="mt-6 flex flex-col items-center gap-3">
              <button
                onClick={handleReroll}
                className="w-full py-4 rounded-2xl font-semibold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                style={{
                  background:
                    balance > 0
                      ? "linear-gradient(135deg, rgba(244,114,182,0.15), rgba(168,85,247,0.15))"
                      : "rgba(255,255,255,0.04)",
                  border: `1px solid ${balance > 0 ? "rgba(244,114,182,0.3)" : "rgba(255,255,255,0.08)"}`,
                  color: balance > 0 ? "#f9a8d4" : "rgba(255,255,255,0.2)",
                  fontFamily: "'Noto Sans KR', sans-serif",
                }}
              >
                <span>🔀</span>
                <span>{balance > 0 ? "다른 사람 보기" : "리롤 충전하기"}</span>
              </button>
            </div>
          </div>
        )}

        {state === "no_rerolls" && (
          <div className="w-full max-w-sm text-center space-y-6">
            <div className="text-6xl">🪙</div>
            <div>
              <p
                className="text-xl font-bold mb-2"
                style={{ color: "white", fontFamily: "'Gaegu', cursive" }}
              >
                리롤을 모두 사용했어요
              </p>
              <p
                className="text-sm"
                style={{
                  color: "rgba(255,255,255,0.4)",
                  fontFamily: "'Noto Sans KR', sans-serif",
                }}
              >
                패키지를 구매하고 더 많은 인연을 만나보세요
              </p>
            </div>
            <button
              onClick={() => router.push("/payment/select")}
              className="w-full py-4 rounded-2xl font-semibold text-white transition-all active:scale-95"
              style={{
                background: "linear-gradient(135deg, #f472b6, #a855f7)",
                boxShadow: "0 4px 20px rgba(244,114,182,0.3)",
                fontFamily: "'Noto Sans KR', sans-serif",
              }}
            >
              리롤 패키지 구경하기 ✨
            </button>
            <button
              onClick={() => setState("card")}
              className="text-sm"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              현재 카드 다시 보기
            </button>
          </div>
        )}

        {state === "empty" && (
          <div className="text-center space-y-4">
            <div className="text-6xl">🎪</div>
            <p
              className="text-xl font-bold"
              style={{ color: "white", fontFamily: "'Gaegu', cursive" }}
            >
              모든 인연을 확인했어요!
            </p>
            <p
              className="text-sm"
              style={{
                color: "rgba(255,255,255,0.4)",
                fontFamily: "'Noto Sans KR', sans-serif",
              }}
            >
              축제에서 직접 만나보는 건 어떨까요 😊
            </p>
          </div>
        )}

        {state === "error" && (
          <div className="text-center space-y-4">
            <div className="text-5xl">😥</div>
            <p
              className="text-sm"
              style={{
                color: "rgba(255,255,255,0.4)",
                fontFamily: "'Noto Sans KR', sans-serif",
              }}
            >
              오류가 발생했어요
            </p>
            <button
              onClick={fetchNext}
              className="px-6 py-2 rounded-xl text-sm"
              style={{
                background: "rgba(255,255,255,0.07)",
                color: "rgba(255,255,255,0.6)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              다시 시도
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        .animate-fade-in { animation: fade-in 0.35s cubic-bezier(0.16,1,0.3,1) both; }
      `}</style>
    </main>
  );
}
