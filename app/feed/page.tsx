"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { CHARACTERS, type CharacterName } from "@/lib/characters";

type Profile = {
  id: string;
  instagram_id: string;
  name?: string | null;
  character?: CharacterName;
};

type FeedState = "loading" | "card" | "empty" | "error" | "no_rerolls";

// 이름은 아직 서버에서 안 내려오므로 id 해시 mock 유지 (추후 DB에 추가되면 교체)
const MOCK_NAMES = [
  "김도윤",
  "이서연",
  "박지호",
  "최민서",
  "정유진",
  "강예준",
  "윤하윤",
  "장수아",
  "한지후",
  "오나윤",
  "조태민",
  "서아린",
];
function hash(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}
function pickName(id: string) {
  return MOCK_NAMES[hash(id + "n") % MOCK_NAMES.length];
}

export default function FeedPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [state, setState] = useState<FeedState>("loading");
  const [cardKey, setCardKey] = useState(0);
  // StrictMode dev 환경에서 useEffect가 두 번 실행되며
  // /api/feed/next가 매번 seen_users를 마킹하는 부수효과 때문에
  // 프로필이 두 번 소비되는 현상을 방지하기 위한 가드.
  const initialized = useRef(false);

  const fetchBalance = useCallback(async () => {
    const res = await fetch("/api/user/balance");
    if (res.ok) {
      const d = await res.json();
      setBalance(d.balance ?? 0);
    }
  }, []);

  // 초기 로드: 현재 카드가 있으면 그대로 표시, 없으면 1장 차감 후 새 카드.
  // 잔액 부족이면 needTickets 응답 → no_rerolls 상태.
  const fetchInitial = useCallback(async () => {
    setState("loading");
    const res = await fetch("/api/feed/next");
    const data = await res.json();
    if (!res.ok) {
      setState("error");
      return;
    }
    if (data.needTickets) {
      setState("no_rerolls");
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
    if (initialized.current) return;
    initialized.current = true;
    fetchBalance();
    fetchInitial();
  }, [fetchBalance, fetchInitial]);

  // 다시 뽑기: 1장 차감 + 새 프로필 한 번에. 응답에 새 profile + remaining 모두 포함됨.
  async function handleReroll() {
    if (balance === null) return;
    if (balance <= 0) {
      setState("no_rerolls");
      return;
    }
    setState("loading");
    const res = await fetch("/api/feed/reroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current_profile_id: profile?.id }),
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
    if (data.empty) {
      // 차감 없이 empty 반환됨 — balance 그대로
      setState("empty");
      return;
    }
    setBalance(data.remaining);
    setProfile(data.profile);
    setCardKey((k) => k + 1);
    setState("card");
  }

  const character = profile
    ? (profile.character ?? null)
    : null;
  const displayName = profile ? (profile.name ?? pickName(profile.id)) : "";

  return (
    <main className="min-h-screen t-page chosun-body">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, var(--accent-glow), transparent 55%)",
        }}
      />

      {/* 컨테이너 */}
      <div
        className="relative w-full mx-auto flex flex-col"
        style={{ maxWidth: 480 }}
      >
        {/* 상단 (chosun accent 영역) */}
        <div className="chosun-layout-top px-6 pt-10 pb-9">
          {/* 헤더 */}
          <header className="flex items-center justify-between mb-7">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏮</span>
              <h1
                className="font-bold t-accent-text chosun-title"
                style={{ fontSize: "1.4rem", letterSpacing: "-0.01em" }}
              >
                오늘의 인연
              </h1>
            </div>
            <button
              onClick={() => router.push("/mypage")}
              className="chosun-btn-outline flex items-center justify-center"
              style={{
                width: 42,
                height: 42,
                borderRadius: 999,
                fontSize: 17,
              }}
            >
              <span>👤</span>
            </button>
          </header>

          {/* Toss 패턴: 흰 pill + 임베디드 카운터 */}
          <div className="flex justify-center">
            <div
              className="chosun-pill chosun-title"
              style={{ fontSize: 13, letterSpacing: "0.02em" }}
            >
              <span>남은 뽑기권</span>
              <span
                className="chosun-pill-count"
                style={{
                  background:
                    (balance ?? 0) > 0
                      ? "var(--chosun-vermillion)"
                      : "var(--text-muted)",
                }}
              >
                {balance ?? "—"}
              </span>
            </div>
          </div>
        </div>

        {/* 하단 (한지 영역) */}
        <div className="chosun-layout-bottom flex-1 px-6 pt-10 pb-12 mt-1">
          {state === "loading" && (
            <div className="flex flex-col items-center justify-center gap-4 py-20">
              <div className="w-14 h-14 rounded-full t-accent-bg animate-pulse" />
              <p
                className="text-sm t-muted chosun-title"
                style={{ letterSpacing: "0.05em" }}
              >
                인연을 부르는 중...
              </p>
            </div>
          )}

          {state === "card" && profile && character && (
            <div key={cardKey} className="anim-fade-up">
              {/* 두루마리 카드 */}
              <div className="relative">
                {/* 위 봉 */}
                <div
                  className="chosun-rod"
                  style={{ borderRadius: "2px 2px 0 0" }}
                />

                {/* 한지 본문 */}
                <div
                  className="chosun-paper relative"
                  style={{
                    padding: "32px 24px 28px",
                    borderTop: "none",
                    borderBottom: "none",
                    borderLeft: "2px solid var(--border-accent)",
                    borderRight: "2px solid var(--border-accent)",
                  }}
                >
                  {/* 도장 (오른쪽 상단) */}
                  <div
                    className="chosun-seal absolute"
                    style={{
                      top: 18,
                      right: 18,
                      width: 38,
                      height: 38,
                      fontSize: 22,
                    }}
                  >
                    緣
                  </div>

                  {/* 캐릭터 라벨 */}
                  <div className="flex flex-col items-center mb-4">
                    <p
                      className="text-xs t-muted mb-1"
                      style={{
                        fontFamily: "'Nanum Myeongjo', serif",
                        letterSpacing: "0.2em",
                      }}
                    >
                      오늘의 손님
                    </p>
                    <p
                      className="chosun-title t-text"
                      style={{
                        fontSize: "1.7rem",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {character}
                    </p>
                  </div>

                  {/* 캐릭터 이미지 */}
                  <div className="flex justify-center mb-5">
                    <div
                      className="chosun-char-frame flex items-center justify-center"
                      style={{
                        width: 160,
                        height: 160,
                        borderRadius: 6,
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={CHARACTERS[character].svg}
                        alt={character}
                        style={{
                          width: "85%",
                          height: "85%",
                          objectFit: "contain",
                        }}
                      />
                    </div>
                  </div>

                  {/* 이름 */}
                  <div className="text-center mb-2">
                    <p
                      className="t-text chosun-title"
                      style={{
                        fontSize: "1.5rem",
                        letterSpacing: "0.02em",
                      }}
                    >
                      {displayName}
                    </p>
                  </div>

                  {/* 캐릭터 멘트 */}
                  <p
                    className="text-center text-xs t-sub px-4 mb-3"
                    style={{
                      fontFamily: "'Nanum Myeongjo', serif",
                      letterSpacing: "0.02em",
                      lineHeight: 1.6,
                    }}
                  >
                    &ldquo;{CHARACTERS[character].quote}&rdquo;
                  </p>

                  {/* 점선 구분 */}
                  <div className="chosun-divider mb-4" />

                  {/* 인스타 */}
                  <div className="flex flex-col items-center gap-1 mb-5">
                    <p
                      className="text-xs t-muted"
                      style={{
                        fontFamily: "'Nanum Myeongjo', serif",
                        letterSpacing: "0.15em",
                      }}
                    >
                      INSTAGRAM
                    </p>
                    <p
                      className="font-bold t-accent-text chosun-title"
                      style={{
                        fontSize: "1.25rem",
                        wordBreak: "break-all",
                      }}
                    >
                      @{profile.instagram_id}
                    </p>
                  </div>

                  {/* 인스타 열기 버튼 */}
                  <a
                    href={`https://instagram.com/${profile.instagram_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="chosun-btn block w-full text-center chosun-title"
                    style={{
                      padding: "13px 0",
                      borderRadius: 10,
                      fontSize: 15,
                      letterSpacing: "0.04em",
                    }}
                  >
                    인스타그램 열기 →
                  </a>
                </div>

                {/* 아래 봉 */}
                <div
                  className="chosun-rod"
                  style={{ borderRadius: "0 0 2px 2px" }}
                />
              </div>

              {/* 다시 뽑기 버튼 */}
              <div className="mt-7">
                <button
                  onClick={handleReroll}
                  disabled={balance === null}
                  className="chosun-btn-outline w-full font-semibold flex items-center justify-center gap-2 chosun-title"
                  style={{
                    padding: "16px 0",
                    borderRadius: 12,
                    fontSize: 14,
                    letterSpacing: "0.04em",
                    color:
                      (balance ?? 0) > 0
                        ? "var(--chosun-btn-from)"
                        : "var(--text-muted)",
                  }}
                >
                  <span>🔀</span>
                  <span>
                    {balance === null
                      ? "..."
                      : balance > 0
                        ? "다시 뽑기"
                        : "뽑기권 충전하기"}
                  </span>
                </button>
              </div>
            </div>
          )}

          {state === "no_rerolls" && (
            <div className="w-full text-center space-y-5 py-10">
              <div className="text-6xl">🪙</div>
              <div>
                <p
                  className="font-bold t-text mb-1 chosun-title"
                  style={{ fontSize: "1.3rem" }}
                >
                  {profile
                    ? "뽑기권을 모두 사용했어요"
                    : "뽑기권을 충전해주세요"}
                </p>
                <p
                  className="text-sm t-sub"
                  style={{ fontFamily: "'Nanum Myeongjo', serif" }}
                >
                  뽑기권 1장으로 한 사람의 인스타를 확인할 수 있어요
                </p>
              </div>
              <button
                onClick={() => router.push("/redeem")}
                className="chosun-btn w-full chosun-title"
                style={{
                  padding: "16px 0",
                  borderRadius: 12,
                  fontSize: 16,
                  letterSpacing: "0.04em",
                }}
              >
                뽑기권 충전하기 →
              </button>
              {profile && (
                <button
                  onClick={() => setState("card")}
                  className="text-sm t-muted hover:t-text transition-colors"
                  style={{ fontFamily: "'Nanum Myeongjo', serif" }}
                >
                  현재 카드 다시 보기
                </button>
              )}
            </div>
          )}

          {state === "empty" && (
            <div className="text-center space-y-3 py-16">
              <div className="text-6xl">🏮</div>
              <p
                className="font-bold t-text chosun-title"
                style={{ fontSize: "1.3rem" }}
              >
                모든 인연을 만나보셨어요
              </p>
              <p
                className="text-sm t-sub"
                style={{ fontFamily: "'Nanum Myeongjo', serif" }}
              >
                축제에서 직접 만나보는 건 어떨까요
              </p>
            </div>
          )}

          {state === "error" && (
            <div className="text-center space-y-4 py-16">
              <div className="text-5xl">😥</div>
              <p
                className="text-sm t-sub"
                style={{ fontFamily: "'Nanum Myeongjo', serif" }}
              >
                오류가 발생했어요
              </p>
              <button
                onClick={fetchInitial}
                className="chosun-btn-outline px-6 py-2 chosun-title"
                style={{
                  borderRadius: 999,
                  fontSize: 13,
                }}
              >
                다시 시도
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
