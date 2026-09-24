import { describe, expect, it } from "vitest";
import { isNavigationItemActive, navigationItems } from "./navigation";

const byLabel = (label: string) => navigationItems.find((item) => item.label === label)!;

describe("navigation", () => {
  it("keeps the market highlighted on collection and item pages", () => {
    expect(isNavigationItemActive(byLabel("Маркет"), "/client/collection/12")).toBe(true);
    expect(isNavigationItemActive(byLabel("Маркет"), "/client/collectible/5")).toBe(true);
    expect(isNavigationItemActive(byLabel("Маркет"), "/client/owns")).toBe(false);
  });

  it("has a section for platform auctions", () => {
    expect(isNavigationItemActive(byLabel("Аукционы"), "/client/auctions")).toBe(true);
    expect(isNavigationItemActive(byLabel("Маркет"), "/client/auctions")).toBe(false);
  });

  it("highlights settings for every profile sub-page and never for a prefix lookalike", () => {
    expect(isNavigationItemActive(byLabel("Настройки"), "/client/profile/security")).toBe(true);
    expect(isNavigationItemActive(byLabel("Настройки"), "/client/profiles")).toBe(false);
  });
});
