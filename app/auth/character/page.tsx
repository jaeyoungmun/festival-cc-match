"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  charactersByGender,
  type CharacterName,
  type Gender,
} from "@/lib/characters";

// 기존 가입자 중 character가 아직 없는 유저용 강제 캐릭터 선택 화면.
// 콜백/proxy에서 character=null인 유저는 이 페이지로 보내짐.
export default function ChooseCharacterPage() {
  const router = useRouter();
  const [gender, setGender] = useState<Gender | null>(null);
  const [character, setCharacter] = useState<CharacterName | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    fetch("/api/user/me")
      .then(async (res) => {
        if (!res.ok) {
          router.replace("/auth/signup");
          return;
        }
        const data = await res.json();
        if (data.character) {
          // 이미 character가 있으면 피드로
          router.replace("/feed");
          return;
        }
        if (data.gender === "male" || data.gender === "female") {
          setGender(data.gender);
        }
        setBootstrapping(false);
      })
      .catch(() => router.replace("/auth/signup"));
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!character) {
      setError("캐릭터를 선택해주세요");
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ character }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "저장에 실패했습니다");
      return;
    }
    router.replace("/feed");
  }

  if (bootstrapping || !gender) {
    return (
      <div className="min-h-screen t-page flex items-center justify-center chosun-body">
        <div className="w-8 h-8 rounded-full t-accent-bg animate-pulse" />
      </div>
    );
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
          <div className="text-center mb-8 anim-fade-up">
            <div
              className="chosun-seal mx-auto mb-4 chosun-han"
              style={{ width: 56, height: 56, fontSize: 28 }}
            >
              選
            </div>
            <h1
              className="font-bold t-text chosun-title"
              style={{ fontSize: "1.6rem", letterSpacing: "-0.01em" }}
            >
              캐릭터 선택
            </h1>
            <p className="text-sm t-sub mt-2">
              이성에게 보일 내 캐릭터를 골라주세요
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="chosun-bordered anim-fade-up anim-delay-1"
            style={{ padding: 22, borderRadius: 18 }}
          >
            <div className="grid grid-cols-2 gap-3 mb-5">
              {charactersByGender(gender).map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setCharacter(c.name)}
                  className="chosun-card-hover flex flex-col items-center gap-2"
                  style={{
                    padding: "16px 8px",
                    borderRadius: 12,
                    border: `2px solid ${
                      character === c.name
                        ? "var(--chosun-vermillion)"
                        : "var(--border)"
                    }`,
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
                    style={{ width: 96, height: 96, objectFit: "contain" }}
                  />
                  <span className="text-sm font-medium t-text chosun-title">
                    {c.name}
                  </span>
                </button>
              ))}
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
              disabled={loading || !character}
              className="chosun-btn chosun-title w-full"
              style={{
                padding: "14px 0",
                borderRadius: 12,
                fontSize: 15,
                letterSpacing: "0.04em",
              }}
            >
              {loading ? "저장 중..." : "이걸로 정하기"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
