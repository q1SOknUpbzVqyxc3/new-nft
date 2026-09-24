import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { DashboardPage } from "./dashboard-page";

const { useAuthenticatedUserMock } = vi.hoisted(() => ({ useAuthenticatedUserMock: vi.fn() }));
vi.mock("@/auth/auth-context", () => ({ useAuthenticatedUser: useAuthenticatedUserMock }));

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: { "Content-Type": "application/json" } });
}

const user = { id: 1, email: "u@example.com", username: "u", avatar: "", balance: 5000, currency: "RUB", active: true, verificated: true, can_withdraw: true, turnover: 3200, created: "", minimal_deposit: 0 };
const owned = [{ id: 1, status: true, sale_price: 900, pic: { id: 11, image: "/a.png", number: 7, price: 800, collection: { name: "Aurora", blockchain: "Ethereum" } } }, { id: 2, status: false, sale_price: 0, pic: { id: 12, image: "/b.png", number: 8, price: 500, collection: { name: "Aurora", blockchain: "Ethereum" } } }];
const finance = [{ type: 1, amount: 1200, currency: "RUB", method: 2, status: 0, comment: 0, created: "2026-09-19T10:00:00Z" }, { type: 0, amount: 5000, currency: "RUB", method: 1, status: 4, comment: 0, created: "2026-09-18T10:00:00Z" }];

function routes(path: string) {
  if (path === "/api/my_nfts") return jsonResponse(owned);
  if (path === "/api/finance/history") return jsonResponse(finance);
  if (path === "/api/get_collections") return jsonResponse([]);
  if (path === "/api/payment/methods") return jsonResponse([{ api_id: 1, label: "Карта", icon: "" }]);
  if (path === "/api/withdraw/methods") return jsonResponse([{ api_id: 2, label: "СБП", icon: "" }]);
  return jsonResponse({ detail: "Not Found" }, 404);
}

describe("DashboardPage", () => {
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  it("summarises balance, pending withdrawal, portfolio and recent operations", async () => {
    vi.stubGlobal("fetch", vi.fn((input: string) => Promise.resolve(routes(new URL(input, "http://localhost").pathname))));
    useAuthenticatedUserMock.mockReturnValue({ user, refreshUser: vi.fn() });
    render(<MemoryRouter><DashboardPage /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: "Обзор" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("1 на продаже")).toBeInTheDocument());
    expect(screen.getByText("Aurora #7")).toBeInTheDocument();
    expect(screen.getByText("Обработка")).toBeInTheDocument();
    expect(screen.getByText("Успешно")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Пополнить/ })).toHaveAttribute("href", "/client/finance?tab=topup");
    expect(screen.getByRole("progressbar", { name: "Прогресс до следующего уровня" })).toBeInTheDocument();
  });
});
