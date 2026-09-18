import { describe, expect, it } from "vitest";
import { formatAddress, formatCompactNumber, formatMoney, getCurrencySymbol } from "./formatters";

describe("formatters", () => {
  it("uses the configured currency symbol", () => {
    expect(getCurrencySymbol("USD")).toBe("$");
    expect(getCurrencySymbol(0)).toBe("₽");
  });

  it("keeps an unknown currency visible", () => {
    expect(formatMoney(12.5, "ETH")).toContain("ETH");
  });

  it("formats large values compactly", () => {
    expect(formatCompactNumber(1_200_000)).toMatch(/1,2\s*млн/i);
  });

  it("shortens long addresses without changing short values", () => {
    expect(formatAddress("0x1234567890abcdef")).toBe("0x1234…abcdef");
    expect(formatAddress("short")).toBe("short");
  });
});
