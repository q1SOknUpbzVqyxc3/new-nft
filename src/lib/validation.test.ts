import { describe, expect, it } from "vitest";
import { validateEmail, validateInvite, validatePassword } from "./validation";

describe("form validation", () => {
  it("validates email format", () => {
    expect(validateEmail("user@example.com")).toBe("");
    expect(validateEmail("invalid")).not.toBe("");
  });

  it("enforces the production password policy", () => {
    expect(validatePassword("Strong1!")).toBe("");
    expect(validatePassword("lowercase1!")).toContain("заглавную");
    expect(validatePassword("NoSpecial1")).toContain("специальный");
  });

  it("accepts only positive numeric invite codes", () => {
    expect(validateInvite("2837300")).toBe("");
    expect(validateInvite("invite")).not.toBe("");
    expect(validateInvite("0")).not.toBe("");
  });
});
