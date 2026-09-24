import { describe, expect, it } from "vitest";
import { describePopup, getPopupKind, getRestrictionKind } from "./popup-notices";

describe("popup notices", () => {
  it("maps withdrawal decline codes to restriction kinds", () => {
    expect(getPopupKind({ title: "withdraw_decline_by_verif", description: "" })).toBe("verification");
    expect(getPopupKind({ title: "", description: "", code: "withdraw_decline_by_tax" })).toBe("tax");
    expect(getPopupKind({ title: "hello", description: "" })).toBe("generic");
    expect(getRestrictionKind("WITHDRAW_DECLINE_BY_TAX")).toBe("tax");
    expect(getRestrictionKind("balance_change")).toBeNull();
  });

  it("uses the standard copy for restrictions with a support action", () => {
    const notice = describePopup({ title: "withdraw_decline_by_verif", description: "" });
    expect(notice.paragraphs).toHaveLength(3);
    expect(notice.support).toBe(true);
  });

  it("uses human text as is and hides raw translation keys", () => {
    expect(describePopup({ title: "Bonus available", description: "Claim it today" })).toEqual({ title: "Bonus available", paragraphs: ["Claim it today"], support: false });
    expect(describePopup({ title: "some.key", description: "other.key" })).toEqual({ title: "Уведомление", paragraphs: [], support: false });
  });
});
