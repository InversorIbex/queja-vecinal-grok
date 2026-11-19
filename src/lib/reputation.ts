import { POINTS, REPUTATION_THRESHOLDS } from "./constants";
import type { ReputationLevel } from "@/types";

export function levelFromPoints(points: number): ReputationLevel {
  let level: ReputationLevel = "Novato";
  for (const t of REPUTATION_THRESHOLDS) {
    if (points >= t.min) level = t.level;
  }
  return level;
}

export function nextLevelInfo(points: number): {
  current: ReputationLevel;
  next: ReputationLevel | null;
  remaining: number;
  progress: number;
} {
  const current = levelFromPoints(points);
  const idx = REPUTATION_THRESHOLDS.findIndex((t) => t.level === current);
  const next = REPUTATION_THRESHOLDS[idx + 1];
  if (!next) {
    return { current, next: null, remaining: 0, progress: 100 };
  }
  const prevMin = REPUTATION_THRESHOLDS[idx].min;
  const span = next.min - prevMin;
  const progress = Math.min(100, ((points - prevMin) / span) * 100);
  return {
    current,
    next: next.level,
    remaining: Math.max(0, next.min - points),
    progress,
  };
}

export { POINTS };
