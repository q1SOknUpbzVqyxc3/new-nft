import { describe, expect, it } from "vitest";
import { maskDetails } from "./mask-details";

describe("maskDetails", () => {
  it("masks card numbers, SBP phones and long wallet addresses", () => {
    expect(maskDetails("4276 1234 5678 9012", "Банковская карта")).toBe("42761234****9012");
    expect(maskDetails("+7 999 123-45-67", "СБП")).toBe("+79*****4567");
    expect(maskDetails("0x4c566daC2AC9456677B88537b388D3Fad960E851", "USDT")).toBe("0x4c56…E851");
  });

  it("leaves short or unrecognised values untouched", () => {
    expect(maskDetails("abc", "USDT")).toBe("abc");
    expect(maskDetails("1234", "Карта")).toBe("1234");
    expect(maskDetails("", "USDT")).toBe("");
  });
});
