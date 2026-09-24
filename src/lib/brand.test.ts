import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { brandPartsFromDomain, getBrandParts } from "./brand";

describe("brand from domain", () => {
  // The developer's own .env may set VITE_BRAND_NAME; these tests must not depend on it.
  beforeEach(() => vi.stubEnv("VITE_BRAND_NAME", ""));
  afterEach(() => vi.unstubAllEnvs());

  it("uses the registrable label and tld", () => {
    expect(brandPartsFromDomain("leadwim.com")).toEqual({ name: "Leadwim", tld: ".com" });
    expect(brandPartsFromDomain("https://www.roascent.digital/path")).toEqual({ name: "Roascent", tld: ".digital" });
  });

  it("ignores service subdomains and handles country second levels", () => {
    expect(brandPartsFromDomain("app.monvravex.com").name).toBe("Monvravex");
    expect(brandPartsFromDomain("shop.example.co.uk")).toEqual({ name: "Example", tld: ".co.uk" });
  });

  it("falls back to the default brand for local hosts", () => {
    expect(getBrandParts("localhost")).toEqual({ name: "Monvravex", tld: "" });
    expect(getBrandParts("")).toEqual({ name: "Monvravex", tld: "" });
  });
});

describe("configured brand name", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("wins over the hostname", () => {
    vi.stubEnv("VITE_BRAND_NAME", "Custom");
    expect(getBrandParts("leadwim.com")).toEqual({ name: "Custom", tld: "" });
  });
});
