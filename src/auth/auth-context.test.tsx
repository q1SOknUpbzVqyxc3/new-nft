import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "./auth-context";

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: { "Content-Type": "application/json" } });
}

function makeUser(overrides: Record<string, unknown> = {}) {
  return { id: 1, email: "user@example.com", username: null, avatar: "", balance: 0, currency: "USD", active: true, verificated: false, can_withdraw: true, turnover: 0, created: "", minimal_deposit: 0, ...overrides };
}

function AuthProbe() {
  const auth = useAuth();
  const [refreshOutcome, setRefreshOutcome] = useState("");
  return (
    <div>
      <span>{auth.status}</span>
      {auth.status === "authenticated" ? <strong>{auth.user.email}</strong> : null}
      {auth.status === "unknown" ? <em>{auth.error ? "error" : "loading"}</em> : null}
      <button type="button" onClick={() => void auth.login({ email: "user@example.com", password: "Strong1!", remember: true })}>login</button>
      <button type="button" onClick={() => { auth.refreshSession().then(() => setRefreshOutcome("refresh-ok"), () => setRefreshOutcome("refresh-failed")); }}>refresh</button>
      <span>{refreshOutcome}</span>
    </div>
  );
}

describe("AuthProvider", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("resolves an absent cookie session as unauthenticated", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ detail: "Not authenticated" }, 403)));
    render(<AuthProvider><AuthProbe /></AuthProvider>);
    await waitFor(() => expect(screen.getByText("unauthenticated")).toBeInTheDocument());
  });

  it("restores the user after successful login", async () => {
    const user = makeUser();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ detail: "Not authenticated" }, 403))
      .mockResolvedValueOnce(jsonResponse(true))
      .mockResolvedValueOnce(jsonResponse(user));
    vi.stubGlobal("fetch", fetchMock);
    render(<AuthProvider><AuthProbe /></AuthProvider>);
    await waitFor(() => expect(screen.getByText("unauthenticated")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "login" }));
    await waitFor(() => expect(screen.getByText("user@example.com")).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("keeps initial bootstrap semantics: a network failure on first load stays unknown with an error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    render(<AuthProvider><AuthProbe /></AuthProvider>);
    await waitFor(() => expect(screen.getByText("unknown")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText("error")).toBeInTheDocument());
  });

  it("keeps the authenticated session when a background refresh hits a transient network error", async () => {
    const user = makeUser({ email: "a@example.com" });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(user))
      .mockRejectedValueOnce(new Error("network down"));
    vi.stubGlobal("fetch", fetchMock);
    render(<AuthProvider><AuthProbe /></AuthProvider>);
    await waitFor(() => expect(screen.getByText("a@example.com")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "refresh" }));
    await waitFor(() => expect(screen.getByText("refresh-failed")).toBeInTheDocument());

    expect(screen.getByText("authenticated")).toBeInTheDocument();
    expect(screen.getByText("a@example.com")).toBeInTheDocument();
  });

  it("logs out when a background refresh confirms the session is invalid (401)", async () => {
    const user = makeUser({ email: "a@example.com" });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(user))
      .mockResolvedValueOnce(jsonResponse({ detail: "Not authenticated" }, 401));
    vi.stubGlobal("fetch", fetchMock);
    render(<AuthProvider><AuthProbe /></AuthProvider>);
    await waitFor(() => expect(screen.getByText("a@example.com")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "refresh" }));
    await waitFor(() => expect(screen.getByText("unauthenticated")).toBeInTheDocument());
    expect(screen.queryByText("a@example.com")).not.toBeInTheDocument();
  });

  it("replaces the user with fresh data on a successful refresh", async () => {
    const userA = makeUser({ email: "a@example.com" });
    const userB = makeUser({ email: "b@example.com" });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(userA))
      .mockResolvedValueOnce(jsonResponse(userB));
    vi.stubGlobal("fetch", fetchMock);
    render(<AuthProvider><AuthProbe /></AuthProvider>);
    await waitFor(() => expect(screen.getByText("a@example.com")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "refresh" }));
    await waitFor(() => expect(screen.getByText("b@example.com")).toBeInTheDocument());
    expect(screen.getByText("refresh-ok")).toBeInTheDocument();
  });
});
