import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { initializeDesign, readDesign, setDesign } from "./design";
import { readCookie } from "./cookie";

function clearDesignCookies() {
  document.cookie = "selected_theme=; path=/; max-age=0";
  document.cookie = "design=; path=/; max-age=0";
  delete document.documentElement.dataset.design;
}

describe("design cookie", () => {
  beforeEach(clearDesignCookies);
  afterEach(clearDesignCookies);

  it("creates the default selected_theme cookie on a first visit", () => {
    initializeDesign();
    expect(readCookie("selected_theme")).toBe("0");
    expect(readDesign()).toBe("default");
  });

  it("uses selected_theme values to restore the full designs", () => {
    document.cookie = "selected_theme=2; path=/";
    initializeDesign();
    expect(readDesign()).toBe("dala");
    expect(document.documentElement.dataset.design).toBe("dala");
  });

  it("migrates the older design cookie without changing the selected design", () => {
    document.cookie = "design=3; path=/";
    initializeDesign();
    expect(readCookie("selected_theme")).toBe("3");
    expect(readDesign()).toBe("factory");
  });

  it("keeps both cookie names in sync when the design changes", () => {
    setDesign("resend");
    expect(readCookie("selected_theme")).toBe("1");
    expect(readCookie("design")).toBe("1");
  });
});
