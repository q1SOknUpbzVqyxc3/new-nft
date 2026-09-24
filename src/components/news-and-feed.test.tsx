import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ActivityFeed } from "./activity-feed";
import { NftNews } from "./nft-news";

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: { "Content-Type": "application/json" } });
}

describe("NftNews", () => {
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  it("lists NFT news as external links with source and date", async () => {
    const fetchMock = vi.fn(() => Promise.resolve(jsonResponse([
      { title: "OpenSea adds Solana NFT trading", summary: "Multi-chain marketplace expands.", url: "https://example.com/a", image: "https://example.com/a.jpg", source: "Crypto News", lang: "en", published: new Date().toISOString() },
      { title: "Sales fall 15%", summary: "", url: "https://example.com/b", image: "", source: "NFT Culture", lang: "en", published: "2026-08-01T00:00:00Z" },
      { title: "Unsafe link", summary: "", url: "javascript:alert(1)", image: "", source: "X", lang: "en", published: "2026-08-01T00:00:00Z" }
    ])));
    vi.stubGlobal("fetch", fetchMock);
    render(<NftNews lang="ru" />);
    const link = await screen.findByRole("link", { name: /OpenSea adds Solana NFT trading/ });
    expect(link).toHaveAttribute("href", "https://example.com/a");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveAttribute("target", "_blank");
    expect(screen.getByText(/Crypto News · сегодня/)).toBeInTheDocument();
    expect(screen.queryByText("Unsafe link")).not.toBeInTheDocument();
    expect(String((fetchMock.mock.calls[0] as unknown as [string])[0])).toContain("/news/nft?lang=ru");
  });

  it("shows an empty and an error state", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(jsonResponse([]))));
    const { unmount } = render(<NftNews lang="en" />);
    expect(await screen.findByText("Новостей пока нет")).toBeInTheDocument();
    unmount();
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(jsonResponse({ detail: "news_unavailable" }, 502))));
    render(<NftNews lang="en" />);
    expect(await screen.findByText(/Не удалось загрузить новости/)).toBeInTheDocument();
  });
});

describe("ActivityFeed", () => {
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

  it("shows events with a tip, sending language and currency to the backend", async () => {
    const fetchMock = vi.fn(() => Promise.resolve(jsonResponse([{ id: 1, text: "Пользователь купил NFT", ts: 1_800_000_000 }])));
    vi.stubGlobal("fetch", fetchMock);
    render(<ActivityFeed alwaysVisible lang="ru" currency="RUB" />);
    expect(await screen.findByText("Пользователь купил NFT")).toBeInTheDocument();
    expect(screen.getByText(/Имена участников скрыты/)).toBeInTheDocument();
    const url = String((fetchMock.mock.calls[0] as unknown as [string])[0]);
    expect(url).toContain("lang=ru");
    expect(url).toContain("currency=RUB");
  });

  it("stays visible on the dashboard with an explanation when the endpoint is missing, and hidden elsewhere", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(jsonResponse({ detail: "Not Found" }, 404))));
    const { unmount } = render(<ActivityFeed alwaysVisible />);
    expect(await screen.findByText(/появится, когда сервер начнёт её отдавать/)).toBeInTheDocument();
    unmount();
    const { container } = render(<ActivityFeed />);
    await act(async () => { await Promise.resolve(); });
    expect(container.querySelector(".activity-feed")).toBeNull();
  });

  it("shows sample events only when the demo flag is on", async () => {
    vi.stubEnv("VITE_ACTIVITY_DEMO", "1");
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(jsonResponse({ detail: "Not Found" }, 404))));
    const { container } = render(<ActivityFeed alwaysVisible />);
    await waitFor(() => expect(container.querySelectorAll(".activity-feed__item")).toHaveLength(12));
  });
});
