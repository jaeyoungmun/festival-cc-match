"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Profile = {
  instagram_id: string;
  department: string | null;
  gender: string;
  email: string;
  is_visible: boolean;
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

  // 편집 폼 상태
  const [editInsta, setEditInsta] = useState("");
  const [editDept, setEditDept] = useState("");

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
      }
      if (balanceRes.ok) {
        const b = await balanceRes.json();
        setBalance(b.balance ?? 0);
      }
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleToggleVisible() {
    if (!profile) return;
    const next = !profile.is_visible;
    setProfile((p) => (p ? { ...p, is_visible: next } : p));
    await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_visible: next }),
    });
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editInsta.trim()) {
      setError("인스타 ID를 입력해주세요");
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
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("저장에 실패했습니다");
      return;
    }
    setProfile((p) =>
      p ? { ...p, instagram_id: editInsta, department: editDept || null } : p,
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
    <main className="min-h-screen t-page relative overflow-hidden">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, var(--accent-glow), transparent 60%)",
        }}
      />

      <div
        className="relative"
        style={{ maxWidth: 480, margin: "0 auto", padding: "0 20px 40px" }}
      >
        {/* 헤더 */}
        <header className="flex items-center gap-3 pt-10 pb-6">
          <button
            onClick={() =>
              section === "main" ? router.push("/feed") : setSection("main")
            }
            className="w-9 h-9 rounded-full flex items-center justify-center t-badge transition-all active:scale-95"
            style={{ border: "1px solid var(--border)" }}
          >
            <span style={{ fontSize: 16 }}>←</span>
          </button>
          <h1
            className="font-bold t-text"
            style={{ fontFamily: "'Gaegu', cursive", fontSize: "1.5rem" }}
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
          <div className="space-y-3 anim-fade-up">
            {/* 프로필 카드 */}
            <div className="t-card t-card-shadow rounded-3xl overflow-hidden">
              {/* 상단 accent 라인 */}
              <div className="h-1 t-accent-bg" />
              <div className="p-6">
                <div className="flex items-center gap-4 mb-5">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                    style={{
                      background: "var(--accent-soft)",
                      border: "1px solid var(--border-accent)",
                    }}
                  >
                    {profile.gender === "male" ? "🙋‍♂️" : "🙋‍♀️"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-bold t-accent-text truncate"
                      style={{
                        fontFamily: "'Gaegu', cursive",
                        fontSize: "1.4rem",
                      }}
                    >
                      @{profile.instagram_id}
                    </p>
                    <p className="text-sm t-sub mt-0.5 truncate">
                      {profile.department ?? "학과 미입력"} · {profile.email}
                    </p>
                  </div>
                </div>

                {/* 리롤 잔여 */}
                <div
                  className="flex items-center justify-between p-3 rounded-2xl mb-4"
                  style={{
                    background: "var(--accent-soft)",
                    border: "1px solid var(--border-accent)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span>✨</span>
                    <span className="text-sm font-medium t-text">
                      리롤 잔여
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="font-bold t-accent-text"
                      style={{
                        fontSize: "1.1rem",
                        fontFamily: "'Gaegu', cursive",
                      }}
                    >
                      {balance}회
                    </span>
                    <button
                      onClick={() => router.push("/payment/select")}
                      className="text-xs px-3 py-1 rounded-full font-medium"
                      style={{
                        background:
                          "linear-gradient(135deg, var(--accent-from), var(--accent-to))",
                        color: "var(--accent-text)",
                      }}
                    >
                      충전
                    </button>
                  </div>
                </div>

                {/* 공개 토글 */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium t-text">피드 공개</p>
                    <p className="text-xs t-muted mt-0.5">
                      {profile.is_visible
                        ? "이성에게 내 계정이 보여요"
                        : "내 계정이 숨겨진 상태예요"}
                    </p>
                  </div>
                  {/* 토글 스위치 */}
                  <button
                    onClick={handleToggleVisible}
                    className="relative transition-all active:scale-95"
                    style={{
                      width: 52,
                      height: 28,
                      borderRadius: 14,
                      background: profile.is_visible
                        ? "linear-gradient(135deg, var(--accent-from), var(--accent-to))"
                        : "var(--bg-card-hover)",
                      border: `1px solid ${profile.is_visible ? "transparent" : "var(--border)"}`,
                      boxShadow: profile.is_visible
                        ? "var(--shadow-btn)"
                        : "none",
                    }}
                  >
                    <span
                      className="absolute top-1 transition-all"
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        background: "white",
                        left: profile.is_visible ? 28 : 4,
                        boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                      }}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* 메뉴 목록 */}
            {[
              {
                icon: "✏️",
                label: "프로필 수정",
                sub: "인스타 ID, 학과 변경",
                action: () => setSection("edit"),
              },
              {
                icon: "💳",
                label: "리롤 충전",
                sub: "패키지 구매하기",
                action: () => router.push("/payment/select"),
              },
            ].map((item, i) => (
              <button
                key={i}
                onClick={item.action}
                className="w-full flex items-center gap-4 t-card t-card-shadow rounded-2xl transition-all active:scale-[0.99]"
                style={{ padding: "16px 20px" }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: "var(--accent-soft)" }}
                >
                  {item.icon}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold t-text">{item.label}</p>
                  <p className="text-xs t-muted mt-0.5">{item.sub}</p>
                </div>
                <span className="t-muted" style={{ fontSize: 18 }}>
                  ›
                </span>
              </button>
            ))}

            {/* 로그아웃 / 탈퇴 */}
            <div className="t-card t-card-shadow rounded-2xl overflow-hidden">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-4 transition-all active:scale-[0.99]"
                style={{ padding: "16px 20px" }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: "var(--bg-card-hover)" }}
                >
                  🚪
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold t-text">로그아웃</p>
                </div>
                <span className="t-muted" style={{ fontSize: 18 }}>
                  ›
                </span>
              </button>
              <div
                style={{
                  height: 1,
                  background: "var(--border)",
                  margin: "0 20px",
                }}
              />
              <button
                onClick={() => setSection("delete-confirm")}
                className="w-full flex items-center gap-4 transition-all active:scale-[0.99]"
                style={{ padding: "16px 20px" }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: "rgba(239,68,68,0.08)" }}
                >
                  🗑️
                </div>
                <div className="flex-1 text-left">
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "#ef4444" }}
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
              </button>
            </div>
          </div>
        )}

        {/* ── 프로필 수정 섹션 ── */}
        {section === "edit" && (
          <form onSubmit={handleSaveEdit} className="space-y-4 anim-fade-up">
            <div className="t-card t-card-shadow rounded-3xl p-6 space-y-5">
              <div className="space-y-1.5">
                <Label
                  htmlFor="edit-insta"
                  className="t-text text-sm font-medium"
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
                    className="pl-7 rounded-xl bg-transparent t-text"
                    style={{ borderColor: "var(--border)" }}
                  />
                </div>
                <p className="text-xs t-muted">
                  반드시{" "}
                  <span
                    className="font-medium"
                    style={{ color: "var(--accent-from)" }}
                  >
                    공개 계정
                  </span>
                  으로 설정해주세요
                </p>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="edit-dept"
                  className="t-text text-sm font-medium"
                >
                  학과{" "}
                  <span className="t-muted font-normal text-xs">(선택)</span>
                </Label>
                <Input
                  id="edit-dept"
                  type="text"
                  placeholder="ex. 경영학과"
                  value={editDept}
                  onChange={(e) => setEditDept(e.target.value)}
                  className="rounded-xl bg-transparent t-text"
                  style={{ borderColor: "var(--border)" }}
                />
              </div>

              {error && (
                <p className="text-xs text-red-400 text-center">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full font-semibold transition-all active:scale-95"
              style={{
                padding: "14px 0",
                borderRadius: 16,
                background:
                  "linear-gradient(135deg, var(--accent-from), var(--accent-to))",
                color: "var(--accent-text)",
                boxShadow: "var(--shadow-btn)",
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? "저장 중..." : "저장하기"}
            </button>
          </form>
        )}

        {/* ── 탈퇴 확인 섹션 ── */}
        {section === "delete-confirm" && (
          <div className="anim-fade-up space-y-4">
            <div className="t-card t-card-shadow rounded-3xl p-6 text-center space-y-3">
              <div className="text-5xl mb-2">⚠️</div>
              <p
                className="font-bold t-text"
                style={{ fontFamily: "'Gaegu', cursive", fontSize: "1.2rem" }}
              >
                정말 탈퇴하시겠어요?
              </p>
              <p className="text-sm t-sub leading-relaxed">
                탈퇴하면 내 계정이 피드에서 즉시 제거돼요.
                <br />
                잔여 리롤은 환불되지 않아요.
              </p>
            </div>
            <button
              onClick={handleDelete}
              className="w-full font-semibold transition-all active:scale-95"
              style={{
                padding: "14px 0",
                borderRadius: 16,
                background: "#ef4444",
                color: "white",
                fontSize: 15,
              }}
            >
              탈퇴하기
            </button>
            <button
              onClick={() => setSection("main")}
              className="w-full font-medium t-sub transition-all"
              style={{ padding: "12px 0" }}
            >
              취소
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
