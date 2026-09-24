import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { getNftActionKind, NftPage } from "./nft-page";

const { useAuthenticatedUserMock } = vi.hoisted(() => ({ useAuthenticatedUserMock: vi.fn() }));

vi.mock("@/auth/auth-context", () => ({ useAuthenticatedUser: useAuthenticatedUserMock }));

const baseUser = {
  id: 1,
  email: "user@example.com",
  username: null,
  avatar: "",
  balance: 100,
  currency: "USD",
  active: true,
  verificated: true,
  can_withdraw: true,
  turnover: 0,
  created: "",
  minimal_deposit: 0
};

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: { "Content-Type": "application/json" } });
}

function baseNft(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    collection_id: 1,
    collection_name: "Collection",
    number: 7,
    image: "https://cdn.example.com/a.png",
    blockchain: "ETH",
    price: 100,
    currency: "USD",
    is_sale: false,
    sale_price: 0,
    is_own: false,
    prices: [],
    ...overrides
  };
}

function pathOf(input: string) {
  return new URL(input, "http://localhost").pathname;
}

function makeFetch(overrides: {
  nft?: () => Response | Promise<Response>;
  buyNft?: () => Response | Promise<Response>;
  sellNft?: () => Response | Promise<Response>;
  unsellNft?: () => Response | Promise<Response>;
  owned?: () => Response | Promise<Response>;
}) {
  return vi.fn(async (input: string) => {
    const path = pathOf(input);
    if (path === "/api/get_nft") return overrides.nft ? overrides.nft() : jsonResponse(baseNft());
    if (path === "/api/get_favourites") return jsonResponse([]);
    if (path === "/api/my_nfts") return overrides.owned ? overrides.owned() : jsonResponse([]);
    if (path === "/api/buy_nft") return overrides.buyNft ? overrides.buyNft() : jsonResponse({});
    if (path === "/api/sell_nft") return overrides.sellNft ? overrides.sellNft() : jsonResponse({});
    if (path === "/api/unsell_nft") return overrides.unsellNft ? overrides.unsellNft() : jsonResponse({});
    throw new Error(`Unhandled fetch in test: ${path}`);
  });
}

function renderNftPage(fetchImpl: ReturnType<typeof makeFetch>, refreshUser: () => Promise<unknown> = vi.fn().mockResolvedValue(baseUser)) {
  vi.stubGlobal("fetch", fetchImpl);
  useAuthenticatedUserMock.mockReturnValue({ user: baseUser, refreshUser });
  return render(
    <MemoryRouter initialEntries={["/client/collectible/1"]}>
      <Routes>
        <Route path="/client/collectible/:nftId" element={<NftPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("getNftActionKind", () => {
  it("owned + not listed -> sell", () => {
    expect(getNftActionKind({ is_own: true, is_sale: false })).toBe("sell");
  });
  it("owned + listed -> unsell", () => {
    expect(getNftActionKind({ is_own: true, is_sale: true })).toBe("unsell");
  });
  it("not owned + listed -> buy", () => {
    expect(getNftActionKind({ is_own: false, is_sale: true })).toBe("buy");
  });
  it("not owned + not listed -> none", () => {
    expect(getNftActionKind({ is_own: false, is_sale: false })).toBe("none");
  });
});

describe("NftPage transaction UI", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    useAuthenticatedUserMock.mockReset();
  });

  it("buy uses the active listing price, not the base price", async () => {
    const fetchStub = makeFetch({ nft: () => jsonResponse(baseNft({ is_own: false, is_sale: true, sale_price: 42, price: 100, own_id: undefined })) });
    renderNftPage(fetchStub);
    await waitFor(() => expect(screen.getByRole("button", { name: /Купить/ })).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /Купить/ }).textContent).toContain("42");
    expect(screen.getByRole("button", { name: /Купить/ }).textContent).not.toContain("100");
  });

  it("shows a neutral state and no buy action when the NFT is not listed and not owned", async () => {
    const fetchStub = makeFetch({ nft: () => jsonResponse(baseNft({ is_own: false, is_sale: false })) });
    renderNftPage(fetchStub);
    await waitFor(() => expect(screen.getByText("NFT сейчас не выставлен на продажу.")).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: /Купить/ })).not.toBeInTheDocument();
  });

  it("shows unsell (not sell) for an owned, listed NFT and never calls sell", async () => {
    const fetchStub = makeFetch({ nft: () => jsonResponse(baseNft({ is_own: true, is_sale: true, own_id: "own-1", sale_price: 30 })) });
    renderNftPage(fetchStub);
    await waitFor(() => expect(screen.getByRole("button", { name: /Снять с продажи/ })).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: /Выставить на продажу/ })).not.toBeInTheDocument();
    expect(fetchStub.mock.calls.some((call) => pathOf(call[0]) === "/api/sell_nft")).toBe(false);
  });

  it("does not send unsell mutation and shows a safe message when own_id is missing", async () => {
    const fetchStub = makeFetch({ nft: () => jsonResponse(baseNft({ is_own: true, is_sale: true, own_id: undefined })) });
    renderNftPage(fetchStub);
    await waitFor(() => expect(screen.getByText("Не удалось получить идентификатор владения для этой операции.")).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: /Снять с продажи/ })).not.toBeInTheDocument();
    expect(fetchStub.mock.calls.some((call) => pathOf(call[0]) === "/api/unsell_nft")).toBe(false);
  });

  it("keeps the purchase successful when the post-purchase profile refresh fails", async () => {
    const fetchStub = makeFetch({ nft: () => jsonResponse(baseNft({ is_own: false, is_sale: true, sale_price: 50, price: 100 })) });
    const refreshUser = vi.fn().mockRejectedValue(new Error("network down"));
    renderNftPage(fetchStub, refreshUser);

    const buyButton = await screen.findByRole("button", { name: /Купить/ });
    fireEvent.click(buyButton);
    const confirmButton = await screen.findByRole("button", { name: "Подтвердить" });
    fireEvent.click(confirmButton);

    await waitFor(() => expect(screen.getByText(/Операция выполнена, но не удалось обновить данные профиля/)).toBeInTheDocument());
    expect(fetchStub.mock.calls.filter((call) => pathOf(call[0]) === "/api/buy_nft")).toHaveLength(1);
    expect(refreshUser).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/Не удалось выполнить запрос/)).not.toBeInTheDocument();
  });

  it("opens the purchases-restricted notice when the backend answers u_cant_buy", async () => {
    const fetchStub = makeFetch({ nft: () => jsonResponse(baseNft({ is_own: false, is_sale: true, sale_price: 42 })), buyNft: () => jsonResponse("u_cant_buy", 400) });
    renderNftPage(fetchStub);
    fireEvent.click(await screen.findByRole("button", { name: /Купить/ }));
    fireEvent.click(await screen.findByRole("button", { name: "Подтвердить" }));
    expect(await screen.findByRole("dialog", { name: "Покупки ограничены" })).toBeInTheDocument();
  });

  it("treats your own listed NFT as yours even though the backend reports is_own = false", async () => {
    const owned = [{ id: 27947, status: 1, sale_price: 120, pic: { id: 1, image: "", number: 3, price: 50, collection: { name: "C", blockchain: "" } } }];
    const fetchStub = makeFetch({ nft: () => jsonResponse(baseNft({ is_own: false, is_sale: true, sale_price: 120, own_id: 27947 })), owned: () => jsonResponse(owned) });
    renderNftPage(fetchStub);
    expect(await screen.findByRole("button", { name: /Снять с продажи/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Купить/ })).not.toBeInTheDocument();
  });
});
