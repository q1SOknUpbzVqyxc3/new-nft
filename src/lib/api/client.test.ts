import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "./services";

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: { "Content-Type": "application/json" } });
}

describe("API client", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("maps browser network failures to a stable error code", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(api.getCollections()).rejects.toMatchObject({ status: 0, code: "network_error" });
  });

  it("rejects incompatible response payloads", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ unexpected: true })));
    await expect(api.getCollections()).rejects.toMatchObject({ status: 502, code: "invalid_api_response" });
  });

  it("preserves backend error codes", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse("not_have_money", 400)));
    await expect(api.buyNft("12")).rejects.toMatchObject({ status: 400, code: "not_have_money" });
  });
});
