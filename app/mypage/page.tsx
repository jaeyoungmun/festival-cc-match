"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  charactersByGender,
  type CharacterName,
  type Gender,
} from "@/lib/characters";

type Profile = {
  instagram_id: string;
  department: string | null;
  gender: string;
  email: string;
  character: CharacterName | null;
};

type Section = "main" | "edit" | "delete-confirm";

export default function MyPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [balance, setBalance] = useState(0);
  const [section, setSection] = useState<Section>("main");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [editInsta, setEditInsta] = useState("");
  const [editDept, setEditDept] = useState("");
  const [editCharacter, setEditCharacter] = useState<CharacterName | "">("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/auth/signup");
        return;
      }

      const [profileRes, balanceRes] = await Promise.all([
        fetch("/api/user/me"),
        fetch("/api/user/balance"),
      ]);

      if (profileRes.ok) {
        const p = await profileRes.json();
        setProfile(p);
        setEditInsta(p.instagram_id);
        setEditDept(p.department ?? "");
        setEditCharacter(p.character ?? "");
      }
      if (balanceRes.ok) {
        const b = await balanceRes.json();
        setBalance(b.balance ?? 0);
      }
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editInsta.trim()) {
      setError("인스타 ID를 입력해주세요");
      return;
    }
    if (!editCharacter) {
      setError("캐릭터를 선택해주세요");
      return;
    }
    setSaving(true);
    setError("");
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instagram_id: editInsta,
        department: editDept || null,
        character: editCharacter,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("저장에 실패했습니다");
      return;
    }
    setProfile((p) =>
      p
        ? {
            ...p,
            instagram_id: editInsta,
            department: editDept || null,
            character: editCharacter,
          }
        : p,
    );
    setSection("main");
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/");
  }

  async function handleDelete() {
    const res = await fetch("/api/user/delete", { method: "DELETE" });
    if (res.ok) router.replace("/");
  }

  if (loading) {
    return (
      <div className="min-h-screen t-page flex items-center justify-center">
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
            onClick={() =>
              section === "main" ? router.push("/feed") : setSection("main")
            }
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
            {section === "edit"
              ? "프로필 수정"
              : section === "delete-confirm"
                ? "탈퇴 확인"
                : "마이페이지"}
          </h1>
        </header>

        {/* ── 메인 섹션 ── */}
        {section === "main" && profile && (
          <div className="px-6 pb-10 space-y-4 anim-fade-up">
            {/* 프로필 카드 */}
            <div
              className="chosun-bordered overflow-hidden"
              style={{ borderRadius: 18 }}
            >
              <div
                className="h-1"
                style={{
                  background:
                    "linear-gradient(90deg, var(--chosun-vermillion), var(--chosun-gold))",
                }}
              />
              <div style={{ padding: "22px" }}>
                <div className="flex items-center gap-4 mb-5">
                  <div
                    className="flex items-center justify-center text-3xl flex-shrink-0"
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 12,
                      background: "var(--accent-soft)",
                      border: "2px solid var(--border-accent)",
                    }}
                  >
                    {profile.gender === "male" ? "🙋‍♂️" : "🙋‍♀️"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-bold t-accent-text truncate chosun-title"
                      style={{ fontSize: "1.3rem", letterSpacing: "-0.01em" }}
                    >
                      @{profile.instagram_id}
                    </p>
                    <p className="text-sm t-sub mt-0.5 truncate">
                      {profile.department ?? "학과 미입력"} · {profile.email}
                    </p>
                  </div>
                </div>

                {/* 뽑기권 잔여 */}
                <div
                  className="flex items-center justify-between p-3"
                  style={{
                    borderRadius: 12,
                    background: "var(--accent-soft)",
                    border: "1.5px solid var(--border-accent)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span>🪙</span>
                    <span className="text-sm font-medium t-text chosun-title">
                      뽑기권 잔여
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className="font-bold t-accent-text chosun-title"
                      style={{ fontSize: "1.05rem" }}
                    >
                      {balance}장
                    </span>
                    <button
                      onClick={() => router.push("/redeem")}
                      className="chosun-btn chosun-title"
                      style={{
                        fontSize: 12,
                        padding: "5px 14px",
                        borderRadius: 999,
                        letterSpacing: "0.04em",
                      }}
                    >
                      충전
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 메뉴 */}
            {[
              {
                icon: "✏️",
                label: "프로필 수정",
                sub: "인스타 ID, 학과 변경",
                action: () => setSection("edit"),
              },
              {
                icon: "🪙",
                label: "뽑기권 충전",
                sub: "부스에서 받은 코드 입력",
                action: () => router.push("/redeem"),
              },
            ].map((item, i) => (
              <button
                key={i}
                onClick={item.action}
                className="chosun-bordered chosun-card-hover w-full flex items-center gap-4 text-left"
                style={{
                  padding: "18px 20px",
                  borderRadius: 14,
                  cursor: "pointer",
                }}
              >
                <div
                  className="flex items-center justify-center text-xl flex-shrink-0"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: "var(--accent-soft)",
                    border: "1.5px solid var(--border-accent)",
                  }}
                >
                  {item.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold t-text chosun-title">
                    {item.label}
                  </p>
                  <p className="text-xs t-muted mt-0.5">{item.sub}</p>
                </div>
                <span className="t-muted" style={{ fontSize: 18 }}>
                  ›
                </span>
              </button>
            ))}

            {/* 로그아웃 / 탈퇴 */}
            <div
              className="chosun-bordered overflow-hidden"
              style={{ borderRadius: 14 }}
            >
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-4 text-left transition-colors hover:bg-[var(--bg-card-hover)]"
                style={{ padding: "16px 20px", cursor: "pointer" }}
              >
                <div
                  className="flex items-center justify-center text-xl flex-shrink-0"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: "var(--bg-card-hover)",
                    border: "1.5px solid var(--border)",
                  }}
                >
                  🚪
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold t-text chosun-title">
                    로그아웃
                  </p>
                </div>
                <span className="t-muted" style={{ fontSize: 18 }}>
                  ›
                </span>
              </button>
              {/* <div
                style={{
                  height: 1,
                  background: "var(--border)",
                  margin: "0 20px",
                }}
              /> */}
              {/* <button
                onClick={() => setSection("delete-confirm")}
                className="w-full flex items-center gap-4 text-left transition-colors hover:bg-[var(--bg-card-hover)]"
                style={{ padding: "16px 20px", cursor: "pointer" }}
              >
                <div
                  className="flex items-center justify-center text-xl flex-shrink-0"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: "rgba(160, 33, 26, 0.1)",
                    border: "1.5px solid var(--chosun-vermillion)",
                  }}
                >
                  🗑️
                </div>
                <div className="flex-1">
                  <p
                    className="text-sm font-semibold chosun-title"
                    style={{ color: "var(--chosun-vermillion)" }}
                  >
                    회원 탈퇴
                  </p>
                  <p className="text-xs t-muted mt-0.5">
                    탈퇴 시 피드에서 즉시 제거돼요
                  </p>
                </div>
                <span className="t-muted" style={{ fontSize: 18 }}>
                  ›
                </span>
              </button> */}
            </div>
          </div>
        )}

        {/* ── 프로필 수정 섹션 ── */}
        {section === "edit" && (
          <form
            onSubmit={handleSaveEdit}
            className="px-6 pb-10 space-y-4 anim-fade-up"
          >
            <div
              className="chosun-bordered"
              style={{ padding: 22, borderRadius: 18 }}
            >
              <div className="space-y-2 mb-5">
                <Label
                  htmlFor="edit-insta"
                  className="t-text text-sm font-medium chosun-title"
                >
                  인스타그램 ID
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm t-muted">
                    @
                  </span>
                  <Input
                    id="edit-insta"
                    type="text"
                    value={editInsta}
                    onChange={(e) =>
                      setEditInsta(e.target.value.replace(/^@/, ""))
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

              <div className="space-y-2">
                <Label
                  htmlFor="edit-dept"
                  className="t-text text-sm font-medium chosun-title"
                >
                  학과{" "}
                  <span className="t-muted font-normal text-xs">(선택)</span>
                </Label>
                <Input
                  id="edit-dept"
                  type="text"
                  placeholder="ex. 컴퓨터과학과"
                  value={editDept}
                  onChange={(e) => setEditDept(e.target.value)}
                  className="rounded-xl bg-transparent t-text h-12"
                  style={{ border: "1.5px solid var(--border-accent)" }}
                />
              </div>

              {/* 캐릭터 */}
              {profile &&
                (profile.gender === "male" || profile.gender === "female") && (
                  <div className="space-y-2 mt-5">
                    <Label className="t-text text-sm font-medium chosun-title">
                      캐릭터
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      {charactersByGender(profile.gender as Gender).map((c) => (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => setEditCharacter(c.name)}
                          className="chosun-card-hover flex flex-col items-center gap-2"
                          style={{
                            padding: "12px 8px",
                            borderRadius: 12,
                            border: `2px solid ${
                              editCharacter === c.name
                                ? "var(--chosun-vermillion)"
                                : "var(--border)"
                            }`,
                            background:
                              editCharacter === c.name
                                ? "var(--accent-soft)"
                                : "var(--bg-card)",
                            cursor: "pointer",
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={c.svg}
                            alt={c.name}
                            style={{
                              width: 64,
                              height: 64,
                              objectFit: "contain",
                            }}
                          />
                          <span className="text-sm font-medium t-text chosun-title">
                            {c.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              {error && (
                <p
                  className="text-xs text-center mt-4"
                  style={{ color: "var(--chosun-vermillion)" }}
                >
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="chosun-btn chosun-title w-full"
              style={{
                padding: "14px 0",
                borderRadius: 12,
                fontSize: 15,
                letterSpacing: "0.04em",
              }}
            >
              {saving ? "저장 중..." : "저장하기"}
            </button>
          </form>
        )}

        {/* ── 탈퇴 확인 섹션 ── */}
        {section === "delete-confirm" && (
          <div className="px-6 pb-10 space-y-4 anim-fade-up">
            <div
              className="chosun-bordered text-center"
              style={{ padding: 26, borderRadius: 18 }}
            >
              <div className="text-5xl mb-3">⚠️</div>
              <p
                className="font-bold t-text chosun-title mb-3"
                style={{ fontSize: "1.2rem", letterSpacing: "-0.01em" }}
              >
                정말 탈퇴하시겠어요?
              </p>
              <p className="text-sm t-sub leading-relaxed">
                탈퇴하면 내 계정이 피드에서 즉시 제거돼요.
                <br />
                잔여 뽑기권은 환불되지 않아요.
                <br />
                특수한 경우에는 고객센터로 문의해주세요.
              </p>
              <p className="text-xs t-muted mt-3">
                고객센터: 부스 방문 / 카카오톡 오픈채팅
              </p>
            </div>
            <button
              onClick={handleDelete}
              className="chosun-title w-full"
              style={{
                padding: "14px 0",
                borderRadius: 12,
                fontSize: 15,
                background: "var(--chosun-vermillion)",
                color: "var(--accent-text)",
                border: "2px solid #6e1612",
                cursor: "pointer",
                transition: "transform 0.18s, filter 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.filter = "brightness(1.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.filter = "brightness(1)";
              }}
            >
              탈퇴하기
            </button>
            <button
              onClick={() => setSection("main")}
              className="chosun-btn-outline chosun-title w-full"
              style={{
                padding: "12px 0",
                borderRadius: 12,
                fontSize: 14,
              }}
            >
              취소
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
