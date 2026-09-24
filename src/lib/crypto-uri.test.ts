import { describe, expect, it } from "vitest";
import { buildDepositQrPayload } from "./crypto-uri";

describe("deposit QR payload", () => {
  it("returns null without an address", () => {
    expect(buildDepositQrPayload({ address: "" })).toBeNull();
  });

  it("wraps well-known chains in wallet URIs", () => {
    expect(buildDepositQrPayload({ address: "bc1abc", symbol: "BTC" })).toBe("bitcoin:bc1abc");
    expect(buildDepositQrPayload({ address: "EQx", network: "TON", memo: "a b" })).toBe("ton://transfer/EQx?text=a%20b");
  });

  it("falls back to the bare address", () => {
    expect(buildDepositQrPayload({ address: "0xabc", symbol: "USDT", network: "TRC-20" })).toBe("0xabc");
  });
});
