import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { HomePage } from "./home-page";

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: { "Content-Type": "application/json" } });
}

function makeCollection(id: number, overrides: Record<string, unknown> = {}) {
  return { id, name: `Collection ${id}`, image: `https://cdn.example.com/${id}.png`, blockchain: "ETH", author: `Studio ${id}`, follow: id * 10, ...overrides };
}

function renderHome() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>
  );
}

describe("HomePage", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("does not render a large marketing hero and goes straight to marketplace content", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse([makeCollection(1, { name: "Neon Foxes" })])));
    renderHome();
    await screen.findAllByText("Neon Foxes");
    expect(screen.queryByText(/Откройте свою следующую коллекцию/)).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Neon Foxes" })).toBeInTheDocument();
  });

  it("shows a loading state while collections load", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => undefined)));
    renderHome();
    expect(screen.getByText("Загружаем коллекции")).toBeInTheDocument();
  });

  it("shows an error state with retry on failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    renderHome();
    await screen.findByRole("button", { name: /Повторить/ });
  });

  it("shows an empty state when there are no collections", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse([])));
    renderHome();
    await screen.findByText("Коллекций пока нет");
  });

  it("renders real collection data only, without fabricated metrics like a floor price", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse([makeCollection(1, { name: "Neon Foxes", author: "Studio A", follow: 999 })])));
    renderHome();
    await screen.findAllByText("Neon Foxes");
    expect(screen.getAllByRole("link", { name: /Neon Foxes/ })[0]).toHaveAttribute("href", "/client/collection/1");
    expect(screen.queryByText(/Floor/)).not.toBeInTheDocument();
    expect(screen.queryByText("999")).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByText("Studio A").length).toBeGreaterThan(0));
  });

  it("filters the catalog by real blockchain chips", async () => {
    const list = [makeCollection(1, { blockchain: "ETH" }), makeCollection(2, { blockchain: "Base" })];
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(list)));
    renderHome();
    await screen.findByRole("heading", { name: "Все коллекции" });
    fireEvent.click(screen.getByRole("button", { name: "Base" }));
    expect(screen.queryAllByRole("link", { name: /Collection 1(?!\d)/ })).toHaveLength(0);
    expect(screen.getAllByRole("link", { name: /Collection 2(?!\d)/ }).length).toBeGreaterThan(0);
  });
});
