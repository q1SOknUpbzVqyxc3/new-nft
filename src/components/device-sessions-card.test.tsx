import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DeviceSessionsCard } from "./device-sessions-card";

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: { "Content-Type": "application/json" } });
}

describe("DeviceSessionsCard", () => {
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  it("explains that sessions are not available yet when the endpoint is missing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ detail: "Not Found" }, 404)));
    render(<DeviceSessionsCard />);
    await waitFor(() => expect(screen.getByText(/скоро появится/)).toBeTruthy());
  });

  it("lists sessions and lets other ones be revoked", async () => {
    const fetchMock = vi.fn((input: string) => Promise.resolve(new URL(input, "http://localhost").pathname === "/api/sessions"
      ? jsonResponse([{ session_id: "a", ip: "1.1.1.1", current: true }, { session_id: "b", ip: "2.2.2.2" }])
      : jsonResponse({})));
    vi.stubGlobal("fetch", fetchMock);
    render(<DeviceSessionsCard />);
    await waitFor(() => expect(screen.getByText(/это устройство/)).toBeTruthy());
    expect(screen.getAllByRole("button", { name: "Завершить" })).toHaveLength(1);
    expect(screen.getByRole("button", { name: /все остальные/ })).toBeTruthy();
  });
});
