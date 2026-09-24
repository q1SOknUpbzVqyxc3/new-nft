import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AuctionsPage } from "./auctions-page";

const { useAuthenticatedUserMock } = vi.hoisted(() => ({ useAuthenticatedUserMock: vi.fn() }));
vi.mock("@/auth/auth-context", () => ({ useAuthenticatedUser: useAuthenticatedUserMock }));

const user = { id: 1, email: "u@example.com", username: "u", avatar: "", balance: 100, currency: "USD", active: true, verificated: true, can_withdraw: true, turnover: 0, created: "", minimal_deposit: 0 };
const json = (payload: unknown, status = 200) => new Response(JSON.stringify(payload), { status, headers: { "Content-Type": "application/json" } });
const soon = (hours: number) => new Date(Date.now() + hours * 3_600_000).toISOString();

describe("AuctionsPage", () => {
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  it("lists lots for the selected status with bid, buy-out price and your standing", async () => {
    const fetchMock = vi.fn(() => Promise.resolve(json([
      { id: 1, image_id: 67, collection_name: "DSC", number: 67, image: "/a.png", status: "active", ends: soon(2), start_price: 50, current_bid: 80, min_bid: 85, buy_now_price: 200, bids: 3, is_leading: true, my_bid: 80 },
      { id: 2, image_id: 68, collection_name: "DSC", number: 68, image: "/b.png", status: "active", ends: soon(30), start_price: 40, bids: 0, is_leading: false, my_bid: null }
    ])));
    vi.stubGlobal("fetch", fetchMock);
    useAuthenticatedUserMock.mockReturnValue({ user, refreshUser: vi.fn() });
    render(<MemoryRouter initialEntries={["/client/auctions"]}><AuctionsPage /></MemoryRouter>);
    expect(await screen.findByText("DSC #67")).toBeInTheDocument();
    expect(screen.getByText(/Ваша ставка лидирует/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /DSC #67/ })).toHaveAttribute("href", "/client/collectible/67");
    expect(String((fetchMock.mock.calls[0] as unknown as [string])[0])).toContain("status=active");
    fireEvent.click(screen.getByRole("tab", { name: "Завершённые" }));
    await waitFor(() => expect(String((fetchMock.mock.calls.at(-1) as unknown as [string])[0])).toContain("status=ended"));
  });

  it("explains that auctions are not available yet, and shows an empty state", async () => {
    useAuthenticatedUserMock.mockReturnValue({ user, refreshUser: vi.fn() });
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(json({ detail: "Not Found" }, 404))));
    const { unmount } = render(<MemoryRouter><AuctionsPage /></MemoryRouter>);
    expect(await screen.findByText(/Аукционы появятся, когда сервер начнёт их отдавать/)).toBeInTheDocument();
    unmount();
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(json([]))));
    render(<MemoryRouter><AuctionsPage /></MemoryRouter>);
    expect(await screen.findByText("Активных аукционов сейчас нет.")).toBeInTheDocument();
  });
});
