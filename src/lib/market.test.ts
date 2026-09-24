import { describe, expect, it } from "vitest";
import type { CollectionDetails, OwnedNft, User } from "./api/schemas";
import { derivePortfolio, evaluateAchievements, getAuctionPhase, getRarityTier, mergeCollectionStats, seriesToPoints, timeLeft } from "./market";

const now = new Date("2026-09-20T12:00:00Z").getTime();

function owned(price: number, status = false, sale = 0): OwnedNft {
  return { id: price, status, sale_price: sale, pic: { id: price, image: "", number: 1, price, collection: { name: "C", blockchain: "" } } } as OwnedNft;
}

describe("market helpers", () => {
  it("formats the time left", () => {
    expect(timeLeft("2026-09-21T00:00:00Z", now)).toBe("12ч 0м");
    expect(timeLeft("2026-09-20T12:30:00Z", now)).toBe("30м");
    expect(timeLeft("2026-09-24T16:00:00Z", now)).toBe("4д 4ч");
    expect(timeLeft("2026-09-20T11:00:00Z", now)).toBe("истекло");
    expect(timeLeft(undefined, now)).toBeNull();
    expect(timeLeft("garbage", now)).toBeNull();
  });

  it("derives the portfolio from listed prices when an NFT is on sale", () => {
    expect(derivePortfolio([owned(100), owned(50, true, 80)])).toMatchObject({ value: 180, count: 2, listed: 1, unrealized: undefined });
  });

  it("derives unrealized P&L and best/worst holdings from buy_price", () => {
    const withCost = (price: number, buy: number, name: string) => ({ ...owned(price), buy_price: buy, pic: { ...owned(price).pic, number: 1, collection: { name, blockchain: "" } } }) as OwnedNft;
    const result = derivePortfolio([withCost(120, 100, "A"), withCost(70, 90, "B"), owned(10)]);
    expect(result.unrealized).toBe(0);
    expect(result.best).toEqual({ name: "A #1", pnl: 20 });
    expect(result.worst).toEqual({ name: "B #1", pnl: -20 });
  });

  it("merges collection stats with the collection payload", () => {
    const details = { name: "A", author: "Mira", in_own: 0, min_price: 10, max_price: 90, nfts: [{}, {}, {}] } as unknown as CollectionDetails;
    expect(mergeCollectionStats(details, null)).toMatchObject({ floor: 10, ceiling: 90, supply: 3, volume: undefined });
    expect(mergeCollectionStats(details, { floor_price: 12, total_volume: 500, listed: 3, supply: 10 })).toMatchObject({ floor: 12, volume: 500, supply: 10, listedPercent: 30 });
  });

  it("normalises series to millisecond timestamps sorted by time", () => {
    expect(seriesToPoints([{ time: 1_800_000_100, value: 2 }, { time: "2026-01-01T00:00:00Z", value: 1 }]).map((p) => p.v)).toEqual([1, 2]);
  });

  it("assigns rarity tiers by rank share", () => {
    expect(getRarityTier(5, 1000)?.id).toBe("legendary");
    expect(getRarityTier(400, 1000)?.id).toBe("uncommon");
    expect(getRarityTier(undefined, 1000)).toBeNull();
  });

  it("evaluates achievements from existing account data", () => {
    const user = { turnover: 6000, verificated: true, currency: "USD" } as User;
    const list = evaluateAchievements({ user, ownedCount: 3, hasTwoFactor: false });
    expect(list.find((a) => a.id === "first-nft")?.done).toBe(true);
    expect(list.find((a) => a.id === "trader")?.done).toBe(true);
    expect(list.find((a) => a.id === "collector")).toMatchObject({ done: false, progress: 0.3 });
    expect(list.find((a) => a.id === "secure")?.done).toBe(false);
  });

  it("derives the auction phase from the server status or from the times", () => {
    expect(getAuctionPhase({ status: "active", ends: "2026-09-21T00:00:00Z" }, now).label).toBe("осталось 12ч 0м");
    expect(getAuctionPhase({ status: "upcoming", starts: "2026-09-20T15:00:00Z", ends: "2026-09-22T00:00:00Z" }, now)).toEqual({ id: "upcoming", label: "начнётся через 3ч 0м" });
    expect(getAuctionPhase({ status: "ended", ends: "2026-09-19T00:00:00Z" }, now).id).toBe("ended");
    expect(getAuctionPhase({ ends: "2026-09-19T00:00:00Z" }, now).id).toBe("ended");
    expect(getAuctionPhase({ status: "active", ends: "2026-09-19T00:00:00Z" }, now).id).toBe("ended");
  });
});
