import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider } from "./auth-context";
import { ProtectedRoute, PublicOnlyRoute } from "./route-guards";

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: { "Content-Type": "application/json" } });
}

function LoginProbe() {
  const location = useLocation();
  const state: unknown = location.state as unknown;
  const from = state && typeof state === "object" && "from" in state && typeof state.from === "string" ? state.from : "";
  return <span>login:{from}</span>;
}

describe("auth route guards", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("redirects a protected deep link and preserves the return path", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ detail: "Not authenticated" }, 403)));
    render(<MemoryRouter initialEntries={["/client/owns?view=list"]}><AuthProvider><Routes><Route path="/client/owns" element={<ProtectedRoute><span>private</span></ProtectedRoute>} /><Route path="/auth/login" element={<LoginProbe />} /></Routes></AuthProvider></MemoryRouter>);
    await waitFor(() => expect(screen.getByText("login:/client/owns?view=list")).toBeInTheDocument());
  });

  it("redirects an authenticated user away from login", async () => {
    const user = { id: 1, email: "user@example.com", username: null, avatar: "", balance: 0, currency: "USD", active: true, verificated: false, can_withdraw: true, turnover: 0, created: "", minimal_deposit: 0 };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(user)));
    render(<MemoryRouter initialEntries={["/auth/login"]}><AuthProvider><Routes><Route path="/auth/login" element={<PublicOnlyRoute><span>login</span></PublicOnlyRoute>} /><Route path="/client/main" element={<span>market</span>} /></Routes></AuthProvider></MemoryRouter>);
    await waitFor(() => expect(screen.getByText("market")).toBeInTheDocument());
  });
});
