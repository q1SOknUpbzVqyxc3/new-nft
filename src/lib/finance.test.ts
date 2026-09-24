import { describe, expect, it } from "vitest";
import type { FinanceHistory } from "./api/schemas";
import { buildCashflowSeries, getFinanceStatusLabel, pendingWithdrawalTotal, summarizeFlow } from "./finance";

const now = new Date("2026-09-20T12:00:00Z").getTime();

function row(overrides: Partial<FinanceHistory>): FinanceHistory {
  return { type: 0, amount: 100, currency: "USD", method: 1, status: 4, comment: 0, created: "2026-09-19T12:00:00Z", ...overrides };
}

describe("finance helpers", () => {
  it("builds a running cashflow from confirmed operations only", () => {
    const history = [
      row({ created: "2026-09-10T00:00:00Z", amount: 100 }),
      row({ type: 1, created: "2026-09-12T00:00:00Z", amount: 30 }),
      row({ status: 0, created: "2026-09-13T00:00:00Z", amount: 999 }),
      row({ status: 2, created: "2026-09-14T00:00:00Z", amount: 999 })
    ];
    expect(buildCashflowSeries(history, "USD", null, now).points.map((point) => point.v)).toEqual([100, 70]);
  });

  it("filters by period but keeps the running balance", () => {
    const history = [row({ created: "2026-06-01T00:00:00Z", amount: 500 }), row({ created: "2026-09-19T00:00:00Z", amount: 50 })];
    expect(buildCashflowSeries(history, "USD", 7, now).points.map((point) => point.v)).toEqual([550]);
    expect(summarizeFlow(history, "USD", 7, now)).toMatchObject({ deposits: 50, withdrawals: 0, net: 50 });
  });

  it("does not mix currencies and reports skipped rows", () => {
    const history = [row({ currency: "EUR" }), row({ currency: 4, amount: 10 })];
    expect(summarizeFlow(history, "USD", null, now)).toMatchObject({ deposits: 10, skipped: 1 });
  });

  it("totals live pending withdrawals only", () => {
    const history = [
      row({ type: 1, status: 0, amount: 40 }),
      row({ type: 1, status: 0, amount: 25, expired: "2026-09-01T00:00:00Z" }),
      row({ type: 1, status: 4, amount: 99 }),
      row({ type: 0, status: 0, amount: 7 })
    ];
    expect(pendingWithdrawalTotal(history, "USD", now)).toBe(40);
  });

  it("labels statuses", () => {
    expect(getFinanceStatusLabel(4)).toBe("Успешно");
    expect(getFinanceStatusLabel(0, true)).toBe("Истекло");
  });
});

describe("sanitizeMinimum", () => {
  it("drops sentinel and invalid minimums", async () => {
    const { sanitizeMinimum } = await import("./finance");
    expect(sanitizeMinimum(999_999_999_999)).toBe(0);
    expect(sanitizeMinimum(undefined)).toBe(0);
    expect(sanitizeMinimum(-1)).toBe(0);
    expect(sanitizeMinimum(500)).toBe(500);
  });
});

describe("large deposit rules", () => {
  it("recognises card and SBP methods", async () => {
    const { isCardOrSbpMethod } = await import("./finance");
    expect(isCardOrSbpMethod("Банковская карта")).toBe(true);
    expect(isCardOrSbpMethod("СБП")).toBe(true);
    expect(isCardOrSbpMethod("USDT TRC-20")).toBe(false);
  });

  it("has a default threshold only for RUB", async () => {
    const { getLargeDepositThreshold } = await import("./finance");
    expect(getLargeDepositThreshold("RUB")).toBe(2_000);
    expect(getLargeDepositThreshold("USD")).toBeNull();
  });
});
