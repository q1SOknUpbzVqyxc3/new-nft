import { describe, expect, it } from "vitest";
import { isNavigationItemActive, navigationItems } from "./navigation";

const byKey = (labelKey: string) => navigationItems.find((item) => item.labelKey === labelKey)!;

describe("navigation", () => {
  it("keeps the market highlighted on collection and item pages", () => {
    expect(isNavigationItemActive(byKey("nav_market"), "/client/collection/12")).toBe(true);
    expect(isNavigationItemActive(byKey("nav_market"), "/client/collectible/5")).toBe(true);
    expect(isNavigationItemActive(byKey("nav_market"), "/client/owns")).toBe(false);
  });

  it("has a section for platform auctions", () => {
    expect(isNavigationItemActive(byKey("nav_auctions"), "/client/auctions")).toBe(true);
    expect(isNavigationItemActive(byKey("nav_market"), "/client/auctions")).toBe(false);
  });

  it("highlights settings for every profile sub-page and never for a prefix lookalike", () => {
    expect(isNavigationItemActive(byKey("nav_settings"), "/client/profile/security")).toBe(true);
    expect(isNavigationItemActive(byKey("nav_settings"), "/client/profiles")).toBe(false);
  });
});
