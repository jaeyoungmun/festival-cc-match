"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Tab = "generate" | "list" | "grant" | "event";

type CodeRow = {
  code: string;
  rolls: number;
  batch_id: string | null;
  created_at: string;
  used_by: string | null;
  used_at: string | null;
};

export default function AdminPage() {
  const router = useRouter();
  const [authState, setAuthState] = useState<"checking" | "ok" | "denied">(
    "checking",
  );
  const [tab, setTab] = useState<Tab>("generate");

  useEffect(() => {
    fetch("/api/admin/me")
      .then((res) => {
        if (res.ok) setAuthState("ok");
        else if (res.status === 401) {
          setAuthState("denied");
          router.replace("/auth/signup");
        } else setAuthState("denied");
      })
      .catch(() => setAuthState("denied"));
  }, [router]);

  if (authState === "checking") {
    return (
      <div className="min-h-screen t-page flex items-center justify-center chosun-body">
        <div className="w-8 h-8 rounded-full t-accent-bg animate-pulse" />
      </div>
    );
  }

  if (authState === "denied") {
    return (
      <div className="min-h-screen t-page flex items-center justify-center chosun-body">
        <div className="text-center px-6">
          <div className="text-5xl mb-4">🔒</div>
          <p className="font-bold t-text chosun-title text-lg mb-2">
            접근 권한이 없습니다
          </p>
          <p className="text-sm t-sub mb-6">운영자 계정으로 로그인해주세요</p>
          <button
            onClick={() => router.push("/")}
            className="chosun-btn-outline chosun-title px-6 py-3"
            style={{ borderRadius: 10, fontSize: 14 }}
          >
            메인으로
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen t-page chosun-body">
      <div
        className="relative w-full mx-auto flex flex-col"
        style={{ maxWidth: 720 }}
      >
        {/* 헤더 */}
        <header className="px-6 pt-9 pb-5 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="chosun-seal chosun-han"
            style={{
              width: 44,
              height: 44,
              fontSize: 22,
              cursor: "pointer",
            }}
          >
            管
          </button>
          <div>
            <h1
              className="font-bold t-text chosun-title"
              style={{ fontSize: "1.4rem", letterSpacing: "-0.01em" }}
            >
              운영자 콘솔
            </h1>
            <p className="text-xs t-muted">인연 맺기 admin</p>
          </div>
        </header>

        {/* 탭 */}
        <div className="px-6 mb-6 flex gap-2">
          {(
            [
              ["generate", "코드 발급"],
              ["list", "코드 조회"],
              ["grant", "직접 충전"],
              ["event", "이벤트 PIN"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="chosun-title flex-1 transition-colors"
              style={{
                padding: "10px 0",
                borderRadius: 10,
                fontSize: 13,
                background:
                  tab === key ? "var(--chosun-btn-from)" : "var(--bg-card)",
                color:
                  tab === key ? "var(--accent-text)" : "var(--text-secondary)",
                border: `1.5px solid ${
                  tab === key ? "var(--chosun-btn-border)" : "var(--border)"
                }`,
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="px-6 pb-10 anim-fade-up">
          {tab === "generate" && <GenerateTab />}
          {tab === "list" && <ListTab />}
          {tab === "grant" && <GrantTab />}
          {tab === "event" && <EventTab />}
        </div>
      </div>
    </main>
  );
}

// ─────────────────────────── 코드 발급 ───────────────────────────
function GenerateTab() {
  const [count, setCount] = useState(50);
  const [rolls, setRolls] = useState(5);
  const [batchId, setBatchId] = useState("");
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState<{ code: string; rolls: number }[]>(
    [],
  );
  const [batchIdReturned, setBatchIdReturned] = useState("");
  const [error, setError] = useState("");

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setGenerated([]);
    const res = await fetch("/api/admin/codes/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        count,
        rolls,
        batch_id: batchId || undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "발급 실패");
      return;
    }
    setGenerated(data.codes ?? []);
    setBatchIdReturned(data.batch_id ?? "");
  }

  function downloadCsv() {
    const header = "code,rolls\n";
    const body = generated.map((c) => `${c.code},${c.rolls}`).join("\n");
    const blob = new Blob([header + body], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `codes_${batchIdReturned || Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <form
        onSubmit={handleGenerate}
        className="chosun-bordered"
        style={{ padding: 22, borderRadius: 16 }}
      >
        <p className="text-sm font-semibold t-text mb-4 chosun-title">
          PIN 코드 일괄 발급
        </p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs t-muted mb-1">개수 (1~1000)</label>
            <input
              type="number"
              min={1}
              max={1000}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full rounded-xl t-text bg-transparent h-11 px-3 chosun-title"
              style={{ border: "1.5px solid var(--border-accent)" }}
            />
          </div>
          <div>
            <label className="block text-xs t-muted mb-1">코드당 뽑기권</label>
            <input
              type="number"
              min={1}
              max={1000}
              value={rolls}
              onChange={(e) => setRolls(Number(e.target.value))}
              className="w-full rounded-xl t-text bg-transparent h-11 px-3 chosun-title"
              style={{ border: "1.5px solid var(--border-accent)" }}
            />
          </div>
        </div>
        <label className="block text-xs t-muted mb-1">배치 ID (선택)</label>
        <input
          type="text"
          placeholder="예: 2026-spring-day1"
          value={batchId}
          onChange={(e) => setBatchId(e.target.value)}
          className="w-full rounded-xl t-text bg-transparent h-11 px-3 mb-4"
          style={{ border: "1.5px solid var(--border-accent)" }}
        />

        {error && (
          <p
            className="text-xs text-center mb-3"
            style={{ color: "var(--chosun-vermillion)" }}
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="chosun-btn chosun-title w-full"
          style={{
            padding: "12px 0",
            borderRadius: 10,
            fontSize: 14,
            letterSpacing: "0.04em",
          }}
        >
          {loading ? "생성 중..." : "발급하기"}
        </button>
      </form>

      {generated.length > 0 && (
        <div
          className="chosun-bordered mt-5"
          style={{ padding: 22, borderRadius: 16 }}
        >
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-semibold t-text chosun-title">
              {generated.length}개 발급됨 · {batchIdReturned}
            </p>
            <button
              onClick={downloadCsv}
              className="chosun-btn-outline chosun-title text-xs px-3 py-1.5"
              style={{ borderRadius: 8 }}
            >
              CSV 다운로드
            </button>
          </div>
          <div
            className="grid grid-cols-2 gap-1 chosun-title"
            style={{ fontSize: 13, maxHeight: 320, overflowY: "auto" }}
          >
            {generated.map((c) => (
              <div
                key={c.code}
                className="flex justify-between items-center py-1.5 px-2"
                style={{
                  borderRadius: 6,
                  background: "var(--bg-badge)",
                }}
              >
                <span className="t-text">{c.code}</span>
                <span className="t-muted text-xs">{c.rolls}장</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────── 코드 조회 ───────────────────────────
function ListTab() {
  const [codes, setCodes] = useState<CodeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "used" | "unused">("all");
  const [batchFilter, setBatchFilter] = useState("");

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter !== "all") params.set("status", filter);
    if (batchFilter) params.set("batch_id", batchFilter);
    params.set("limit", "100");
    const res = await fetch(`/api/admin/codes?${params}`);
    const data = await res.json();
    setLoading(false);
    if (res.ok) setCodes(data.codes ?? []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, batchFilter]);

  return (
    <div>
      <div
        className="chosun-bordered mb-4"
        style={{ padding: 16, borderRadius: 14 }}
      >
        <div className="flex gap-2 mb-3">
          {(
            [
              ["all", "전체"],
              ["unused", "미사용"],
              ["used", "사용됨"],
            ] as const
          ).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className="chosun-title text-xs px-3 py-1.5 transition-colors"
              style={{
                borderRadius: 999,
                background:
                  filter === k ? "var(--chosun-btn-from)" : "var(--bg-card)",
                color:
                  filter === k ? "var(--accent-text)" : "var(--text-secondary)",
                border: `1.5px solid ${
                  filter === k ? "var(--chosun-btn-from)" : "var(--border)"
                }`,
                cursor: "pointer",
              }}
            >
              {l}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="배치 ID로 필터 (선택)"
          value={batchFilter}
          onChange={(e) => setBatchFilter(e.target.value)}
          className="w-full rounded-lg t-text bg-transparent h-9 px-3 text-sm"
          style={{ border: "1.5px solid var(--border-accent)" }}
        />
      </div>

      <div
        className="chosun-bordered"
        style={{ padding: 16, borderRadius: 14 }}
      >
        {loading && (
          <p className="text-sm t-muted text-center py-4">불러오는 중...</p>
        )}
        {!loading && codes.length === 0 && (
          <p className="text-sm t-muted text-center py-4">코드가 없어요</p>
        )}
        {!loading && codes.length > 0 && (
          <div
            className="space-y-1 chosun-title"
            style={{ fontSize: 12, maxHeight: 480, overflowY: "auto" }}
          >
            {codes.map((c) => (
              <div
                key={c.code}
                className="flex items-center justify-between py-2 px-3"
                style={{
                  borderRadius: 8,
                  background: c.used_by
                    ? "var(--bg-card-hover)"
                    : "var(--accent-soft)",
                  opacity: c.used_by ? 0.6 : 1,
                }}
              >
                <div>
                  <span className="t-text font-medium">{c.code}</span>
                  <span className="t-muted ml-2">
                    {c.rolls}장 · {c.batch_id ?? "-"}
                  </span>
                </div>
                <span
                  className="text-xs"
                  style={{
                    color: c.used_by
                      ? "var(--text-muted)"
                      : "var(--chosun-vermillion)",
                  }}
                >
                  {c.used_by
                    ? `사용 ${c.used_at?.slice(5, 16) ?? ""}`
                    : "미사용"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────── 직접 충전 ───────────────────────────
function GrantTab() {
  const [studentId, setStudentId] = useState("");
  const [rolls, setRolls] = useState(5);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    instagram_id: string;
    granted: number;
    balance: number;
  } | null>(null);
  const [error, setError] = useState("");

  async function handleGrant(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    const res = await fetch("/api/admin/grant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_id: studentId, rolls, note }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "충전 실패");
      return;
    }
    setResult({
      instagram_id: data.instagram_id,
      granted: data.granted,
      balance: data.balance,
    });
    setNote("");
  }

  return (
    <div>
      <form
        onSubmit={handleGrant}
        className="chosun-bordered"
        style={{ padding: 22, borderRadius: 16 }}
      >
        <p className="text-sm font-semibold t-text mb-4 chosun-title">
          학번 직접 충전
        </p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs t-muted mb-1">학번</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="202012345"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value.replace(/\D/g, ""))}
              className="w-full rounded-xl t-text bg-transparent h-11 px-3 chosun-title"
              style={{ border: "1.5px solid var(--border-accent)" }}
              required
            />
          </div>
          <div>
            <label className="block text-xs t-muted mb-1">뽑기권 수</label>
            <input
              type="number"
              min={1}
              max={1000}
              value={rolls}
              onChange={(e) => setRolls(Number(e.target.value))}
              className="w-full rounded-xl t-text bg-transparent h-11 px-3 chosun-title"
              style={{ border: "1.5px solid var(--border-accent)" }}
            />
          </div>
        </div>
        <label className="block text-xs t-muted mb-1">메모 (선택)</label>
        <input
          type="text"
          placeholder="현금/계좌이체 등"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-xl t-text bg-transparent h-11 px-3 mb-4"
          style={{ border: "1.5px solid var(--border-accent)" }}
        />

        {error && (
          <p
            className="text-xs text-center mb-3"
            style={{ color: "var(--chosun-vermillion)" }}
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !studentId}
          className="chosun-btn chosun-title w-full"
          style={{
            padding: "12px 0",
            borderRadius: 10,
            fontSize: 14,
            letterSpacing: "0.04em",
          }}
        >
          {loading ? "충전 중..." : "충전하기"}
        </button>
      </form>

      {result && (
        <div
          className="chosun-bordered mt-5"
          style={{ padding: 22, borderRadius: 16 }}
        >
          <p className="text-sm t-sub mb-2">
            ✓ <span className="font-medium t-text">@{result.instagram_id}</span>
            님께 충전 완료
          </p>
          <div className="flex justify-between text-sm">
            <span className="t-sub">충전</span>
            <span className="t-text font-semibold chosun-title">
              +{result.granted}장
            </span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="t-sub">총 잔여</span>
            <span className="t-accent-text font-bold chosun-title">
              {result.balance}장
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────── 이벤트 PIN (공유) ───────────────────────────
function EventTab() {
  const [rolls, setRolls] = useState(1);
  const [label, setLabel] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [issued, setIssued] = useState<{
    code: string;
    rolls: number;
    label: string | null;
    expires_at: string | null;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<{
    count: number;
    next: { threshold: number; rolls: number; remaining: number } | null;
    milestones: { threshold: number; rolls: number; achieved: boolean }[];
  } | null>(null);

  useEffect(() => {
    fetch("/api/stats/signups")
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => {});
  }, []);

  async function handleIssue(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setIssued(null);
    setCopied(false);
    const res = await fetch("/api/admin/codes/shared", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rolls,
        label: label || undefined,
        expires_at: expiresAt || undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "발급 실패");
      return;
    }
    setIssued(data);
  }

  function handleCopy() {
    if (!issued) return;
    navigator.clipboard.writeText(issued.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div>
      {/* 마일스톤 현황 */}
      {stats && (
        <div
          className="chosun-bordered mb-4"
          style={{ padding: 16, borderRadius: 14 }}
        >
          <p className="text-xs t-muted mb-2 chosun-title">현재 가입자</p>
          <p
            className="font-bold t-accent-text chosun-title mb-3"
            style={{ fontSize: "1.5rem" }}
          >
            {stats.count}명
          </p>
          <div className="space-y-1.5">
            {stats.milestones.map((m) => (
              <div
                key={m.threshold}
                className="flex items-center justify-between text-xs"
                style={{
                  padding: "6px 10px",
                  borderRadius: 6,
                  background: m.achieved
                    ? "var(--accent-soft)"
                    : "var(--bg-card-hover)",
                  opacity: m.achieved ? 1 : 0.7,
                }}
              >
                <span className="t-text">
                  {m.achieved ? "✓ " : ""}
                  {m.threshold}명 → {m.rolls}장 보상
                </span>
                {m.achieved && (
                  <span
                    className="chosun-han"
                    style={{
                      color: "var(--chosun-vermillion)",
                      fontSize: 11,
                    }}
                  >
                    達
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <form
        onSubmit={handleIssue}
        className="chosun-bordered"
        style={{ padding: 22, borderRadius: 16 }}
      >
        <p className="text-sm font-semibold t-text mb-1 chosun-title">
          공유 PIN 발급
        </p>
        <p className="text-xs t-muted mb-4">
          모든 유저가 1회씩 사용할 수 있는 코드입니다. 카톡방·공지에서 공유.
        </p>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs t-muted mb-1">뽑기권</label>
            <input
              type="number"
              min={1}
              max={1000}
              value={rolls}
              onChange={(e) => setRolls(Number(e.target.value))}
              className="w-full rounded-xl t-text bg-transparent h-11 px-3 chosun-title"
              style={{ border: "1.5px solid var(--border-accent)" }}
            />
          </div>
          <div>
            <label className="block text-xs t-muted mb-1">만료 (선택)</label>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full rounded-xl t-text bg-transparent h-11 px-3"
              style={{ border: "1.5px solid var(--border-accent)" }}
            />
          </div>
        </div>
        <label className="block text-xs t-muted mb-1">라벨 (선택)</label>
        <input
          type="text"
          placeholder="예: 100명 돌파 보상"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="w-full rounded-xl t-text bg-transparent h-11 px-3 mb-4"
          style={{ border: "1.5px solid var(--border-accent)" }}
        />

        {error && (
          <p
            className="text-xs text-center mb-3"
            style={{ color: "var(--chosun-vermillion)" }}
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="chosun-btn chosun-title w-full"
          style={{
            padding: "12px 0",
            borderRadius: 10,
            fontSize: 14,
            letterSpacing: "0.04em",
          }}
        >
          {loading ? "발급 중..." : "공유 PIN 발급"}
        </button>
      </form>

      {issued && (
        <div
          className="chosun-bordered mt-5 text-center"
          style={{ padding: 22, borderRadius: 16 }}
        >
          <p className="text-xs t-muted mb-2">
            {issued.label ?? "공유 PIN"} · 1인 {issued.rolls}장
          </p>
          <p
            className="chosun-title t-text mb-3"
            style={{
              fontSize: "1.7rem",
              letterSpacing: "0.15em",
            }}
          >
            {issued.code}
          </p>
          {issued.expires_at && (
            <p className="text-xs t-muted mb-3">
              만료: {new Date(issued.expires_at).toLocaleString()}
            </p>
          )}
          <button
            onClick={handleCopy}
            className="chosun-btn-outline chosun-title text-xs px-5 py-2"
            style={{ borderRadius: 8 }}
          >
            {copied ? "복사됨 ✓" : "코드 복사"}
          </button>
        </div>
      )}
    </div>
  );
}
