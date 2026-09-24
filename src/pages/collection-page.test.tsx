import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { CollectionPage } from "./collection-page";

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: { "Content-Type": "application/json" } });
}

function makeNft(id: number, overrides: Record<string, unknown> = {}) {
  return { id, image: `https://cdn.example.com/${id}.png`, number: id, blockchain: "ETH", price: 10 * id, currency: "USD", ...overrides };
}

function renderCollectionPage() {
  return render(
    <MemoryRouter initialEntries={["/client/collection/1"]}>
      <Routes>
        <Route path="/client/collection/:collectionId" element={<CollectionPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("CollectionPage", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("shows a loading skeleton, then the collection identity and grid", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ name: "Neon Foxes", author: "Studio A", in_own: 0, min_price: 0, max_price: 0, nfts: [makeNft(1), makeNft(2)] })));
    renderCollectionPage();
    await screen.findByRole("heading", { name: "Neon Foxes" });
    expect(screen.getByText("Автор: Studio A")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /#1/ })).toHaveLength(1);
    expect(screen.getAllByRole("link", { name: /#2/ })).toHaveLength(1);
  });

  it("shows an error state with retry on failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    renderCollectionPage();
    await screen.findByRole("button", { name: /Повторить/ });
  });

  it("shows an empty state when the collection has no items", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ name: "Empty Set", author: "", in_own: 0, min_price: 0, max_price: 0, nfts: [] })));
    renderCollectionPage();
    await screen.findByText("В этой коллекции пока нет объектов.");
  });

  it("filters the grid by token ID search and shows a zero-results state", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ name: "Neon Foxes", author: "Studio A", in_own: 0, min_price: 0, max_price: 0, nfts: [makeNft(1), makeNft(2)] })));
    renderCollectionPage();
    await screen.findByRole("heading", { name: "Neon Foxes" });
    fireEvent.change(screen.getByPlaceholderText("Поиск по token ID"), { target: { value: "999" } });
    await screen.findByText("Измените поисковый запрос.");
    expect(screen.queryByRole("link", { name: /#1/ })).not.toBeInTheDocument();
  });

  it("does not show fabricated stats when min/max price and in_own are zero", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ name: "Neon Foxes", author: "Studio A", in_own: 0, min_price: 0, max_price: 0, nfts: [makeNft(1)] })));
    renderCollectionPage();
    await screen.findByRole("heading", { name: "Neon Foxes" });
    expect(screen.queryByText("У вас")).not.toBeInTheDocument();
    expect(screen.queryByText("Минимальная цена")).not.toBeInTheDocument();
    expect(screen.queryByText("Максимальная цена")).not.toBeInTheDocument();
  });

  it("shows real price stats, and counts your NFTs from your portfolio instead of the backend in_own", async () => {
    const collection = { name: "Neon Foxes", author: "Studio A", in_own: 99, min_price: 10, max_price: 500, nfts: [makeNft(1)] };
    const ownedRecord = (id: number, collectionId: number) => ({ id, status: 1, sale_price: 5, pic: { id, collection_id: collectionId, image: "", number: id, price: 3, collection: { name: "Neon Foxes", blockchain: "" } } });
    vi.stubGlobal("fetch", vi.fn((input: string) => Promise.resolve(new URL(input, "http://localhost").pathname === "/api/my_nfts" ? jsonResponse([ownedRecord(1, 1), ownedRecord(2, 1), ownedRecord(3, 2)]) : jsonResponse(collection))));
    renderCollectionPage();
    await screen.findByRole("heading", { name: "Neon Foxes" });
    await waitFor(() => expect(screen.getByText("У вас").nextSibling?.textContent).toBe("2"));
    expect(screen.getByText("Минимальная цена")).toBeInTheDocument();
    expect(screen.getByText("Максимальная цена")).toBeInTheDocument();
  });
});
