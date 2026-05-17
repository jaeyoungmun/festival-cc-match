"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { charactersByGender, type CharacterName } from "@/lib/characters";

function ProfileForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [instagramId, setInstagramId] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [character, setCharacter] = useState<CharacterName | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 성별 변경 시 캐릭터 초기화 (이성 캐릭터 선택 방지)
  function handleGenderChange(g: "male" | "female") {
    setGender(g);
    setCharacter("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("이름을 입력해주세요");
      return;
    }
    if (!instagramId) {
      setError("인스타그램 ID를 입력해주세요");
      return;
    }
    if (!gender) {
      setError("성별을 선택해주세요");
      return;
    }
    if (!character) {
      setError("캐릭터를 선택해주세요");
      return;
    }

    setLoading(true);
    setError("");

    // 비밀번호는 가입 단계에서 이미 설정됨 — 여기선 프로필만 저장.
    const res = await fetch("/api/user/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        instagram_id: instagramId,
        gender,
        character,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "프로필 저장에 실패했습니다");
      return;
    }

    // 가입 직후엔 랜딩으로 보냄. /feed로 보내면 잔액 0인 신규 유저는
    // needTickets 응답을 받아 곧장 충전 화면으로 튕기게 되어 흐름이 거칠다.
    router.replace("/");
  }

  const ready =
    !!name.trim() && !!instagramId && !!gender && !!character;

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
          <div className="text-center mb-8 anim-fade-up">
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
              className="font-bold t-text chosun-title"
              style={{ fontSize: "1.6rem", letterSpacing: "-0.01em" }}
            >
              프로필 설정
            </h1>
            <p className="text-sm t-sub mt-2">
              마지막 단계예요! 거의 다 왔어요
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="chosun-bordered anim-fade-up anim-delay-1"
            style={{ padding: 22, borderRadius: 18 }}
          >
            {/* 이름 */}
            <div className="space-y-2 mb-5">
              <Label className="t-text text-sm font-medium chosun-title">
                이름{" "}
                <span style={{ color: "var(--chosun-vermillion)" }}>*</span>
              </Label>
              <Input
                type="text"
                placeholder="홍길동"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError("");
                }}
                maxLength={20}
                className="rounded-xl bg-transparent t-text h-12"
                style={{ border: "1.5px solid var(--border-accent)" }}
              />
              <p className="text-xs t-muted">
                실제 이름을 입력해주세요 (최대 20자)
              </p>
            </div>

            {/* 인스타 ID */}
            <div className="space-y-2 mb-5">
              <Label className="t-text text-sm font-medium chosun-title">
                인스타그램 ID{" "}
                <span style={{ color: "var(--chosun-vermillion)" }}>*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm t-muted">
                  @
                </span>
                <Input
                  type="text"
                  placeholder="your_instagram"
                  value={instagramId}
                  onChange={(e) =>
                    setInstagramId(e.target.value.replace(/^@/, ""))
                  }
                  className="pl-7 rounded-xl bg-transparent t-text h-12"
                  style={{ border: "1.5px solid var(--border-accent)" }}
                />
              </div>
              <p className="text-xs t-muted">
                반드시{" "}
                <span
                  className="font-medium"
                  style={{ color: "var(--chosun-vermillion)" }}
                >
                  공개 계정
                </span>
                으로 설정해주세요
              </p>
            </div>

            {/* 성별 */}
            <div className="space-y-2 mb-5">
              <Label className="t-text text-sm font-medium chosun-title">
                성별{" "}
                <span style={{ color: "var(--chosun-vermillion)" }}>*</span>
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "male", label: "남자", emoji: "🙋‍♂️" },
                  { value: "female", label: "여자", emoji: "🙋‍♀️" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      handleGenderChange(opt.value as "male" | "female")
                    }
                    className="chosun-card-hover py-4 flex flex-col items-center gap-1"
                    style={{
                      borderRadius: 12,
                      border: `2px solid ${gender === opt.value ? "var(--chosun-vermillion)" : "var(--border)"}`,
                      background:
                        gender === opt.value
                          ? "var(--accent-soft)"
                          : "var(--bg-card)",
                      cursor: "pointer",
                    }}
                  >
                    <span className="text-2xl">{opt.emoji}</span>
                    <span className="text-sm font-medium t-text chosun-title">
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 캐릭터 — 성별 선택 후 노출 */}
            {gender && (
              <div className="space-y-2 mb-5">
                <Label className="t-text text-sm font-medium chosun-title">
                  캐릭터{" "}
                  <span style={{ color: "var(--chosun-vermillion)" }}>*</span>
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {charactersByGender(gender).map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setCharacter(c.name)}
                      className="chosun-card-hover flex flex-col items-center gap-2"
                      style={{
                        padding: "14px 8px",
                        borderRadius: 12,
                        border: `2px solid ${character === c.name ? "var(--chosun-vermillion)" : "var(--border)"}`,
                        background:
                          character === c.name
                            ? "var(--accent-soft)"
                            : "var(--bg-card)",
                        cursor: "pointer",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={c.svg}
                        alt={c.name}
                        style={{ width: 72, height: 72, objectFit: "contain" }}
                      />
                      <span className="text-sm font-medium t-text chosun-title">
                        {c.name}
                      </span>
                      <span
                        className="text-xs t-sub text-center leading-snug"
                        style={{
                          fontFamily: "'Nanum Myeongjo', serif",
                          minHeight: 32,
                        }}
                      >
                        &ldquo;{c.quote}&rdquo;
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

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
              disabled={loading || !ready}
              className="chosun-btn chosun-title w-full"
              style={{
                padding: "14px 0",
                borderRadius: 12,
                fontSize: 15,
                letterSpacing: "0.04em",
              }}
            >
              {loading ? "저장 중..." : "시작하기 🏮"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

export default function ProfilePage() {
  return (
    <Suspense>
      <ProfileForm />
    </Suspense>
  );
}
