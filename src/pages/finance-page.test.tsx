import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { FinancePage } from "./finance-page";

const { useAuthenticatedUserMock } = vi.hoisted(() => ({ useAuthenticatedUserMock: vi.fn() }));
vi.mock("@/auth/auth-context", () => ({ useAuthenticatedUser: useAuthenticatedUserMock }));

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: { "Content-Type": "application/json" } });
}

const user = { id: 1, email: "u@example.com", username: "u", avatar: "", balance: 100, currency: "USD", active: true, verificated: true, can_withdraw: true, turnover: 0, created: "", minimal_deposit: 0 };

describe("FinancePage", () => {
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  it("shows pending withdrawals in the summary and lists history", async () => {
    vi.stubGlobal("fetch", vi.fn((input: string) => {
      const path = new URL(input, "http://localhost").pathname;
      if (path === "/api/finance/history") return Promise.resolve(jsonResponse([
        { type: 1, amount: 40, currency: "USD", method: 2, status: 0, comment: 0, created: "2026-09-19T10:00:00Z" },
        { type: 0, amount: 100, currency: "USD", method: 1, status: 4, comment: 0, created: "2026-09-18T10:00:00Z" }
      ]));
      return Promise.resolve(jsonResponse([]));
    }));
    useAuthenticatedUserMock.mockReturnValue({ user, refreshUser: vi.fn() });
    render(<MemoryRouter initialEntries={["/client/finance?tab=history"]}><FinancePage /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText("Обработка")).toBeTruthy());
    expect(screen.getByText("Успешно")).toBeTruthy();
    expect(screen.getAllByText(/40/).length).toBeGreaterThan(0);
  });

  it("opens the deposit and withdrawal flows in modals and closes them with Escape", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(jsonResponse([{ api_id: 1, label: "Card", icon: "" }]))));
    useAuthenticatedUserMock.mockReturnValue({ user, refreshUser: vi.fn() });
    render(<MemoryRouter initialEntries={["/client/finance"]}><FinancePage /></MemoryRouter>);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Пополнить/ }));
    expect(await screen.findByRole("dialog", { name: "Пополнение баланса" })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /Вывести/ }));
    expect(await screen.findByRole("dialog", { name: "Вывод средств" })).toBeInTheDocument();
  });

  it("opens the matching modal from legacy ?tab= links", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(jsonResponse([]))));
    useAuthenticatedUserMock.mockReturnValue({ user, refreshUser: vi.fn() });
    render(<MemoryRouter initialEntries={["/client/finance?tab=withdraw"]}><FinancePage /></MemoryRouter>);
    expect(await screen.findByRole("dialog", { name: "Вывод средств" })).toBeInTheDocument();
  });
});
