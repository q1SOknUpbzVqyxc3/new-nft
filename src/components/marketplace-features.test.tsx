import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import type { NftDetails, OwnedNft } from "@/lib/api/schemas";
import { CollectionMarketStats } from "./collection-market";
import { NftAuction, NftFacts } from "./nft-market";
import { PortfolioAnalytics } from "./portfolio-analytics";

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: { "Content-Type": "application/json" } });
}
const soon = (hours: number) => new Date(Date.now() + hours * 3_600_000).toISOString();
const item = { collection_id: 1, collection_name: "Aurora", number: 7, image: "/a.png", blockchain: "Ethereum", price: 100, currency: "RUB", is_sale: true, sale_price: 100, is_own: false, prices: [] } as unknown as NftDetails;

function stubApi(routes: Record<string, () => Response>) {
  const calls: Array<{ path: string; method: string }> = [];
  vi.stubGlobal("fetch", vi.fn((input: string, init?: RequestInit) => {
    const path = new URL(input, "http://localhost").pathname;
    calls.push({ path, method: init?.method ?? "GET" });
    return Promise.resolve((routes[path] ?? (() => jsonResponse({ detail: "Not Found" }, 404)))());
  }));
  return calls;
}

describe("marketplace features", () => {
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  const lot = (overrides: Record<string, unknown> = {}) => ({ status: "active", ends: soon(6.5), start_price: 100, current_bid: 165, min_bid: 175, buy_now_price: 260, bids: 4, is_leading: false, my_bid: null, ...overrides });

  it("renders nothing when the NFT has no auction (404) and never offers owner-side auction creation", async () => {
    stubApi({});
    const { container } = render(<NftAuction nftId="5" item={{ ...item, is_own: true }} onChanged={vi.fn()} onBlocked={vi.fn()} />);
    await waitFor(() => expect(container.querySelector(".nft-trading")).toBeNull());
    expect(screen.queryByText("Запустить аукцион")).not.toBeInTheDocument();
  });

  it("shows the running lot with current bid, minimum bid, time left and a bid form", async () => {
    stubApi({ "/api/nft/auction": () => jsonResponse(lot()) });
    render(<NftAuction nftId="5" item={item} onChanged={vi.fn()} onBlocked={vi.fn()} />);
    expect(await screen.findByText("Текущая ставка")).toBeInTheDocument();
    expect(screen.getByText(/осталось 6ч/)).toBeInTheDocument();
    expect(screen.getByText("Мин. ставка").nextSibling?.textContent).toContain("175");
    expect(screen.getByRole("button", { name: /Сделать ставку/ })).toBeInTheDocument();
  });

  it("rejects a bid below the minimum without calling the backend, then places a valid bid", async () => {
    const calls = stubApi({ "/api/nft/auction": () => jsonResponse(lot()), "/api/nft/auction/bid": () => jsonResponse({}) });
    const onChanged = vi.fn();
    render(<NftAuction nftId="5" item={item} onChanged={onChanged} onBlocked={vi.fn()} />);
    const input = await screen.findByLabelText(/Ваша ставка/);
    fireEvent.change(input, { target: { value: "170" } });
    fireEvent.click(screen.getByRole("button", { name: /Сделать ставку/ }));
    expect(await screen.findByText(/Минимальная ставка/)).toBeInTheDocument();
    expect(calls.some((call) => call.path === "/api/nft/auction/bid")).toBe(false);
    fireEvent.change(input, { target: { value: "180" } });
    fireEvent.click(screen.getByRole("button", { name: /Сделать ставку/ }));
    await waitFor(() => expect(calls.some((call) => call.path === "/api/nft/auction/bid" && call.method === "POST")).toBe(true));
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
  });

  it("shows whether you lead or were outbid", async () => {
    stubApi({ "/api/nft/auction": () => jsonResponse(lot({ is_leading: true, my_bid: 165 })) });
    const { unmount } = render(<NftAuction nftId="5" item={item} onChanged={vi.fn()} onBlocked={vi.fn()} />);
    expect(await screen.findByText(/Ваша ставка лидирует/)).toBeInTheDocument();
    unmount();
    stubApi({ "/api/nft/auction": () => jsonResponse(lot({ is_leading: false, my_bid: 150 })) });
    render(<NftAuction nftId="5" item={item} onChanged={vi.fn()} onBlocked={vi.fn()} />);
    expect(await screen.findByText(/Вашу ставку перебили/)).toBeInTheDocument();
  });

  it("buys a lot out only after confirmation", async () => {
    const calls = stubApi({ "/api/nft/auction": () => jsonResponse(lot()), "/api/nft/auction/buy_now": () => jsonResponse({}) });
    render(<NftAuction nftId="5" item={item} onChanged={vi.fn()} onBlocked={vi.fn()} />);
    fireEvent.click(await screen.findByRole("button", { name: /Выкупить сразу за/ }));
    expect(calls.some((call) => call.path === "/api/nft/auction/buy_now")).toBe(false);
    fireEvent.click(await screen.findByRole("button", { name: "Выкупить" }));
    await waitFor(() => expect(calls.some((call) => call.path === "/api/nft/auction/buy_now" && call.method === "POST")).toBe(true));
  });

  it("opens the purchases-restricted notice callback when bidding is blocked", async () => {
    stubApi({ "/api/nft/auction": () => jsonResponse(lot()), "/api/nft/auction/bid": () => jsonResponse("u_cant_buy", 400) });
    const onBlocked = vi.fn();
    render(<NftAuction nftId="5" item={item} onChanged={vi.fn()} onBlocked={onBlocked} />);
    fireEvent.change(await screen.findByLabelText(/Ваша ставка/), { target: { value: "200" } });
    fireEvent.click(screen.getByRole("button", { name: /Сделать ставку/ }));
    await waitFor(() => expect(onBlocked).toHaveBeenCalled());
  });

  it("does not offer bidding on an upcoming or ended lot", async () => {
    stubApi({ "/api/nft/auction": () => jsonResponse(lot({ status: "ended", ends: new Date(Date.now() - 1000).toISOString() })) });
    render(<NftAuction nftId="5" item={item} onChanged={vi.fn()} onBlocked={vi.fn()} />);
    expect(await screen.findByText("аукцион завершён")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Сделать ставку/ })).not.toBeInTheDocument();
  });

  it("renders rarity, traits and dashes for missing facts", () => {
    render(<NftFacts item={item} unavailable={false} extra={{ rarity_rank: 5, supply: 1000, rarity_score: 88.5, traits: [{ trait_type: "Фон", value: "Синий", rarity_percent: 4 }] }} />);
    expect(screen.getByText("Легендарный")).toBeInTheDocument();
    expect(screen.getByText("Синий")).toBeInTheDocument();
    expect(screen.getByText("Contract address").nextSibling?.textContent).toBe("—");
    expect(screen.queryByText("Владелец")).not.toBeInTheDocument();
    expect(screen.queryByText("Creator")).not.toBeInTheDocument();
  });

  it("derives portfolio value from owned NFTs and flags P&L as pending backend", async () => {
    stubApi({});
    const owned = [{ id: 1, status: false, sale_price: 0, buy_price: 250, pic: { id: 1, image: "", number: 1, price: 300, collection: { name: "C", blockchain: "" } } }] as unknown as OwnedNft[];
    render(<PortfolioAnalytics owned={owned} currency="RUB" />);
    expect(await screen.findByText(/Реализованная прибыль.*появятся/)).toBeInTheDocument();
    expect(screen.getByText("Portfolio value").nextSibling?.textContent).toContain("300");
    expect(screen.getByText("Unrealized P&L").nextSibling?.textContent).toContain("+50");
    expect(screen.getByText("Best performer").nextSibling?.textContent).toContain("C #1");
    expect(screen.getByRole("button", { name: "1Y" })).toBeInTheDocument();
  });

  it("merges collection stats from the backend and hides the chart note when history exists", async () => {
    stubApi({ "/api/collection/stats": () => jsonResponse({ total_volume: 5000, owners: 42, floor_history: [{ time: "2026-09-01T00:00:00Z", value: 10 }, { time: "2026-09-02T00:00:00Z", value: 12 }] }) });
    const details = { name: "A", author: "Mira", in_own: 0, min_price: 10, max_price: 90, nfts: [{}, {}] } as never;
    render(<MemoryRouter><CollectionMarketStats collectionId="1" details={details} currency="RUB" /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText("Total volume").nextSibling?.textContent).toContain("5"));
    expect(screen.getByText("Owners").nextSibling?.textContent).toBe("42");
    expect(screen.queryByText("Royalty")).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "График floor price" })).toBeInTheDocument();
  });
});
