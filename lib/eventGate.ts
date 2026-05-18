// 본 행사 오픈 게이트
//
// 오픈 시각 이전에는 회원가입 + 프로필 설정까지만 허용한다.
// 피드(/feed, /api/feed/*)와 충전(/redeem, /api/redeem)은 차단된다.
//
// 수동 조정:
//  1) EVENT_START_AT을 직접 수정해서 배포
//  2) 환경변수로 강제 오버라이드
//     - FORCE_EVENT_OPEN=true/false  → 서버 전용 (proxy, API 가드)
//     - NEXT_PUBLIC_FORCE_EVENT_OPEN=true/false → 클라이언트 UI 표시도 함께 강제

// 2026-05-21 09:00 Asia/Seoul (KST = UTC+9)
export const EVENT_START_AT = new Date("2026-05-21T09:00:00+09:00");

function readOverride(): boolean | null {
  const v =
    process.env.FORCE_EVENT_OPEN ?? process.env.NEXT_PUBLIC_FORCE_EVENT_OPEN;
  if (v === "true") return true;
  if (v === "false") return false;
  return null;
}

export function isEventOpen(now: Date = new Date()): boolean {
  const override = readOverride();
  if (override !== null) return override;
  return now.getTime() >= EVENT_START_AT.getTime();
}

export function timeUntilOpen(now: Date = new Date()): {
  days: number;
  hours: number;
  minutes: number;
  totalMs: number;
} | null {
  const ms = EVENT_START_AT.getTime() - now.getTime();
  if (ms <= 0) return null;
  return {
    days: Math.floor(ms / 86_400_000),
    hours: Math.floor((ms % 86_400_000) / 3_600_000),
    minutes: Math.floor((ms % 3_600_000) / 60_000),
    totalMs: ms,
  };
}
