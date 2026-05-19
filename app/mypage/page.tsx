"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  charactersByGender,
  CHARACTERS,
  oppositeGender,
  type CharacterName,
  type Gender,
} from "@/lib/characters";
import { isEventOpen } from "@/lib/eventGate";

type Profile = {
  instagram_id: string;
  gender: string;
  email: string;
  character: CharacterName | null;
  character_preference: CharacterName | null;
  name: string | null;
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
  const [loadError, setLoadError] = useState("");

  const [editName, setEditName] = useState("");
  const [editInsta, setEditInsta] = useState("");
  const [editCharacter, setEditCharacter] = useState<CharacterName | "">("");
  // null = "둘다" (필터 없음).
  const [editPref, setEditPref] = useState<CharacterName | null>(null);

  // 본 행사 오픈 여부 — 마운트 후 계산해서 hydration 불일치 방지.
  // 초기 null인 동안엔 안전하게 "미오픈"으로 가정해서 충전 UI를 숨긴다.
  const [open, setOpen] = useState<boolean | null>(null);
  useEffect(() => {
    setOpen(isEventOpen());
  }, []);
  const isOpen = open === true;

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
        setEditName(p.name ?? "");
        setEditInsta(p.instagram_id);
        setEditCharacter(p.character ?? "");
        setEditPref(p.character_preference ?? null);
      } else {
        const errJson = await profileRes.json().catch(() => ({}));
        setLoadError(
          errJson?.error ?? `프로필을 불러오지 못했어요 (${profileRes.status})`,
        );
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
    const trimmedName = editName.trim();
    if (!trimmedName) {
      setError("이름을 입력해주세요");
      return;
    }
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
        name: trimmedName,
        instagram_id: editInsta,
        character: editCharacter,
        character_preference: editPref,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      setError(errJson?.error ?? `저장에 실패했습니다 (${res.status})`);
      return;
    }
    setProfile((p) =>
      p
        ? {
            ...p,
            name: trimmedName,
            instagram_id: editInsta,
            character: editCharacter,
            character_preference: editPref,
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
              section === "main"
                ? router.push(isOpen ? "/feed" : "/")
                : setSection("main")
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

        {/* 프로필 로드 실패 — 빈 화면 방지 */}
        {section === "main" && !profile && loadError && (
          <div className="px-6 pb-10 anim-fade-up">
            <div
              className="chosun-bordered text-center"
              style={{ padding: 26, borderRadius: 18 }}
            >
              <div className="text-4xl mb-3">⚠️</div>
              <p className="font-bold t-text chosun-title mb-2">
                프로필을 불러올 수 없어요
              </p>
              <p className="text-sm t-sub leading-relaxed">{loadError}</p>
              <button
                onClick={() => window.location.reload()}
                className="chosun-btn chosun-title mt-4"
                style={{
                  padding: "10px 24px",
                  borderRadius: 10,
                  fontSize: 14,
                }}
              >
                다시 시도
              </button>
            </div>
          </div>
        )}

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
                <div className="flex items-center gap-4 mb-3">
                  <div
                    className="flex items-center justify-center flex-shrink-0"
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 12,
                      background: "var(--accent-soft)",
                      border: "2px solid var(--border-accent)",
                      overflow: "hidden",
                    }}
                  >
                    {profile.character ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={CHARACTERS[profile.character].svg}
                        alt={profile.character}
                        style={{
                          width: "90%",
                          height: "90%",
                          objectFit: "contain",
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: 28 }}>
                        {profile.gender === "male" ? "🙋‍♂️" : "🙋‍♀️"}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {profile.name && (
                      <p
                        className="font-bold t-text truncate chosun-title"
                        style={{
                          fontSize: "1.3rem",
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {profile.name}
                      </p>
                    )}
                    <p
                      className="font-medium t-accent-text truncate chosun-title"
                      style={{
                        fontSize: profile.name ? "0.95rem" : "1.3rem",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      @{profile.instagram_id}
                    </p>
                    <p className="text-sm t-sub mt-0.5 truncate">
                      {profile.email}
                    </p>
                    {profile.character && (
                      <p
                        className="text-xs chosun-title mt-1"
                        style={{ color: "var(--chosun-vermillion)" }}
                      >
                        {profile.character}
                      </p>
                    )}
                  </div>
                </div>

                {/* 캐릭터 멘트 */}
                {profile.character && (
                  <p
                    className="text-xs t-sub text-center mb-4 px-2"
                    style={{
                      fontFamily: "'Nanum Myeongjo', serif",
                      lineHeight: 1.6,
                    }}
                  >
                    &ldquo;{CHARACTERS[profile.character].quote}&rdquo;
                  </p>
                )}

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
                    {isOpen && (
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
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 메뉴 — 충전은 본 행사 오픈 후에만 노출 */}
            {(
              [
                {
                  icon: "✏️",
                  label: "프로필 수정",
                  sub: "인스타 ID 변경",
                  action: () => setSection("edit"),
                },
                isOpen
                  ? {
                      icon: "🪙",
                      label: "뽑기권 충전",
                      sub: "부스에서 받은 코드 입력",
                      action: () => router.push("/redeem"),
                    }
                  : null,
              ].filter(Boolean) as {
                icon: string;
                label: string;
                sub: string;
                action: () => void;
              }[]
            ).map((item, i) => (
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

            {/* 개발자에게 문의 — 카카오톡 오픈채팅 (같은 창에서 전환) */}
            <a
              href="https://open.kakao.com/o/snfRewvi"
              className="chosun-bordered chosun-card-hover w-full flex items-center gap-4 text-left"
              style={{
                padding: "18px 20px",
                borderRadius: 14,
                cursor: "pointer",
                textDecoration: "none",
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
                💬
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold t-text chosun-title">
                  개발자에게 문의
                </p>
                <p className="text-xs t-muted mt-0.5">
                  카카오톡 오픈채팅으로 연결돼요
                </p>
              </div>
              <span className="t-muted" style={{ fontSize: 18 }}>
                ›
              </span>
            </a>

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
              {/* 이름 */}
              <div className="space-y-2 mb-5">
                <Label
                  htmlFor="edit-name"
                  className="t-text text-sm font-medium chosun-title"
                >
                  이름
                </Label>
                <Input
                  id="edit-name"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="홍길동"
                  maxLength={20}
                  className="rounded-xl bg-transparent t-text h-12"
                  style={{ border: "1.5px solid var(--border-accent)" }}
                />
                <p className="text-xs t-muted">최대 20자</p>
              </div>

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
                          <span
                            className="text-xs t-sub text-center leading-snug px-1"
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

              {/* 선호 캐릭터 (피드 필터) */}
              {profile &&
                (profile.gender === "male" || profile.gender === "female") && (
                  <div className="space-y-2 mt-5">
                    <Label className="t-text text-sm font-medium chosun-title">
                      보고 싶은 이성
                    </Label>
                    <p className="text-xs t-muted">
                      선택한 캐릭터의 이성만 피드에 보여요
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        ...charactersByGender(
                          oppositeGender(profile.gender as Gender),
                        ).map((c) => ({
                          value: c.name as CharacterName | null,
                          label: c.name,
                          svg: c.svg,
                        })),
                        { value: null, label: "둘다", svg: null },
                      ].map((opt) => {
                        const selected = editPref === opt.value;
                        return (
                          <button
                            key={opt.label}
                            type="button"
                            onClick={() => setEditPref(opt.value)}
                            className="chosun-card-hover flex flex-col items-center justify-center gap-1"
                            style={{
                              padding: "10px 6px",
                              borderRadius: 12,
                              border: `2px solid ${
                                selected
                                  ? "var(--chosun-vermillion)"
                                  : "var(--border)"
                              }`,
                              background: selected
                                ? "var(--accent-soft)"
                                : "var(--bg-card)",
                              cursor: "pointer",
                              minHeight: 88,
                            }}
                          >
                            {opt.svg ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={opt.svg}
                                alt={opt.label}
                                style={{
                                  width: 48,
                                  height: 48,
                                  objectFit: "contain",
                                }}
                              />
                            ) : (
                              <span
                                className="chosun-han"
                                style={{ fontSize: 28, lineHeight: 1 }}
                              >
                                緣
                              </span>
                            )}
                            <span className="text-xs font-medium t-text chosun-title">
                              {opt.label}
                            </span>
                          </button>
                        );
                      })}
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
