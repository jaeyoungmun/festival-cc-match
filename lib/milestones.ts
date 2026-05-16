// 가입자 수 마일스톤 — 도달 시 운영자가 공유 PIN을 발급해 카톡방 등에 뿌리는 방식.
// 자동 지급 아님. 랜딩 카운터에 진행률 표시.

export type Milestone = {
  threshold: number;
  rolls: number;
};

export const MILESTONES: Milestone[] = [
  { threshold: 100, rolls: 1 },
  { threshold: 300, rolls: 2 },
  { threshold: 500, rolls: 3 },
];

export type MilestoneStatus = Milestone & { achieved: boolean };

export function describeProgress(count: number) {
  const status: MilestoneStatus[] = MILESTONES.map((m) => ({
    ...m,
    achieved: count >= m.threshold,
  }));
  const next = MILESTONES.find((m) => count < m.threshold);
  return {
    count,
    milestones: status,
    next: next
      ? { threshold: next.threshold, rolls: next.rolls, remaining: next.threshold - count }
      : null,
  };
}
