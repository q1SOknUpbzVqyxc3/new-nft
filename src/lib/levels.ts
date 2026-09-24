/** Default turnover thresholds (account currency). Replace when the backend exposes its own level table. */
export const DEFAULT_LEVEL_THRESHOLDS = [0, 1_000, 2_500, 5_000, 10_000, 25_000, 50_000, 100_000, 250_000, 500_000] as const;

export type LevelProgress = {
  level: number;
  maxLevel: number;
  isMax: boolean;
  progress: number;
  nextThreshold: number | null;
  remaining: number;
};

export function calculateLevel(turnover: number, thresholds: readonly number[] = DEFAULT_LEVEL_THRESHOLDS): LevelProgress {
  const value = Number.isFinite(turnover) && turnover > 0 ? turnover : 0;
  const maxLevel = thresholds.length;
  let level = 1;
  for (let index = maxLevel - 1; index >= 0; index -= 1) {
    if (value >= (thresholds[index] ?? 0)) {
      level = index + 1;
      break;
    }
  }
  const isMax = level >= maxLevel;
  const floor = thresholds[level - 1] ?? 0;
  const nextThreshold = isMax ? null : (thresholds[level] ?? null);
  const span = nextThreshold === null ? 0 : nextThreshold - floor;
  const progress = nextThreshold === null || span <= 0 ? 1 : Math.min(1, Math.max(0, (value - floor) / span));
  return { level, maxLevel, isMax, progress, nextThreshold, remaining: nextThreshold === null ? 0 : Math.max(0, nextThreshold - value) };
}
