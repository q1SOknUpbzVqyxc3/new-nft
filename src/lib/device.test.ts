import { describe, expect, it } from "vitest";
import { formatDeviceLabel, normalizeSession } from "./device";

describe("device sessions", () => {
  it("recognises browser and system from a user agent", () => {
    const ua = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
    expect(formatDeviceLabel(ua)).toBe("Chrome · macOS");
  });

  it("keeps unknown values and drops empty ones", () => {
    expect(formatDeviceLabel("My phone")).toBe("My phone");
    expect(formatDeviceLabel("  ")).toBeNull();
  });

  it("normalizes tolerant session payloads", () => {
    expect(normalizeSession({ session_id: "abc", ip: "1.1.1.1", current: true }, 0)).toMatchObject({ id: "abc", ip: "1.1.1.1", isCurrent: true });
    expect(normalizeSession({}, 3).id).toBe("3");
  });
});
