import { describe, expect, it } from "vitest";
import { calculateLevel } from "./levels";

const thresholds = [0, 100, 300];

describe("calculateLevel", () => {
  it("starts at level 1 with progress towards the next threshold", () => {
    expect(calculateLevel(50, thresholds)).toMatchObject({ level: 1, progress: 0.5, nextThreshold: 100, remaining: 50, isMax: false });
  });

  it("promotes exactly at a threshold", () => {
    expect(calculateLevel(100, thresholds)).toMatchObject({ level: 2, progress: 0 });
  });

  it("caps at the maximum level", () => {
    expect(calculateLevel(10_000, thresholds)).toMatchObject({ level: 3, isMax: true, progress: 1, nextThreshold: null, remaining: 0 });
  });

  it("treats invalid turnover as zero", () => {
    expect(calculateLevel(Number.NaN, thresholds).level).toBe(1);
    expect(calculateLevel(-5, thresholds).level).toBe(1);
  });
});
