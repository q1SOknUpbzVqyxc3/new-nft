import type { CollectionDetails, CollectionStats, OwnedNft, SeriesPoint, User } from "./api/schemas";
import { currencyToRub, rubToCurrency } from "./currency";
import { formatMoney } from "./formatters";
import { calculateLevel } from "./levels";

export const PORTFOLIO_PERIODS = ["1D", "7D", "30D", "1Y", "ALL"] as const;
export type PortfolioPeriod = (typeof PORTFOLIO_PERIODS)[number];

export const RANKING_PERIODS = ["1H", "6H", "24H", "7D", "30D"] as const;
export type RankingPeriod = (typeof RANKING_PERIODS)[number];

export const RANKING_CATEGORIES = [
  { id: "trending", label: "В тренде" },
  { id: "volume", label: "Топ по объёму" },
  { id: "gainers", label: "Растущие" },
  { id: "new", label: "Новые" }
] as const;
export type RankingCategory = (typeof RANKING_CATEGORIES)[number]["id"];

/** Remaining time as "11ч 24м" / "3д 4ч"; "истекло" once the deadline has passed. */
export function timeLeft(expires: string | null | undefined, now = Date.now()) {
  if (!expires) return null;
  const end = new Date(expires).getTime();
  if (Number.isNaN(end)) return null;
  const ms = end - now;
  if (ms <= 0) return "истекло";
  const minutes = Math.floor(ms / 60_000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  if (days > 0) return `${days}д ${hours}ч`;
  if (hours > 0) return `${hours}ч ${mins}м`;
  return mins > 0 ? `${mins}м` : "меньше минуты";
}

export type PortfolioPerformer = { name: string; pnl: number };
export type PortfolioSnapshot = { value: number; count: number; listed: number; unrealized: number | undefined; best: PortfolioPerformer | undefined; worst: PortfolioPerformer | undefined };

function currentValue(item: OwnedNft) {
  return item.status && item.sale_price > 0 ? item.sale_price : item.pic.price;
}

/**
 * Portfolio from the owned-NFT list alone. `my_nfts` carries `buy_price`, so unrealized P&L and the best/worst
 * holdings can be derived; realized P&L and totals across sold NFTs still need the backend.
 */
export function derivePortfolio(owned: OwnedNft[]): PortfolioSnapshot {
  const withCost = owned
    .filter((item) => typeof item.buy_price === "number" && item.buy_price > 0)
    .map((item) => ({ name: `${item.pic.collection.name} #${String(item.pic.number)}`, pnl: currentValue(item) - (item.buy_price ?? 0) }));
  const sorted = [...withCost].sort((a, b) => b.pnl - a.pnl);
  return {
    value: owned.reduce((sum, item) => sum + currentValue(item), 0),
    count: owned.length,
    listed: owned.filter((item) => item.status).length,
    unrealized: withCost.length ? withCost.reduce((sum, item) => sum + item.pnl, 0) : undefined,
    best: sorted[0],
    worst: sorted.length > 1 ? sorted[sorted.length - 1] : undefined
  };
}

export type CollectionStatsView = {
  floor: number | undefined; ceiling: number | undefined; supply: number | undefined; volume: number | undefined; owners: number | undefined;
  listedPercent: number | undefined; description: string | undefined;
};

/** Backend stats win; the collection payload fills what it can (floor, ceiling, supply). */
export function mergeCollectionStats(details: CollectionDetails, stats: CollectionStats | null): CollectionStatsView {
  const listedPercent = stats?.listed_percent ?? (stats?.listed !== undefined && stats.supply ? (stats.listed / stats.supply) * 100 : undefined);
  return {
    floor: stats?.floor_price ?? (details.min_price > 0 ? details.min_price : undefined),
    ceiling: details.max_price > 0 ? details.max_price : undefined,
    supply: stats?.supply ?? (details.nfts.length || undefined),
    volume: stats?.total_volume,
    owners: stats?.owners,
    listedPercent,
    description: stats?.description ?? undefined
  };
}

export function seriesToPoints(series: SeriesPoint[] | undefined) {
  return (series ?? [])
    .map((point) => ({ t: typeof point.time === "number" ? (point.time < 1e12 ? point.time * 1000 : point.time) : new Date(point.time).getTime(), v: point.value }))
    .filter((point) => Number.isFinite(point.t))
    .sort((a, b) => a.t - b.t);
}

export function getRarityTier(rank: number | undefined, supply: number | undefined) {
  if (!rank || !supply || supply <= 0) return null;
  const share = rank / supply;
  if (share <= 0.01) return { id: "legendary", label: "Легендарный" };
  if (share <= 0.05) return { id: "epic", label: "Эпический" };
  if (share <= 0.2) return { id: "rare", label: "Редкий" };
  if (share <= 0.5) return { id: "uncommon", label: "Необычный" };
  return { id: "common", label: "Обычный" };
}

export type Achievement = { id: string; title: string; description: string; current: number; target: number; done: boolean; progress: number };

/** Achievements are derived from data the frontend already has, so they work without a dedicated backend endpoint. */
export function evaluateAchievements(input: { user: User; ownedCount: number; hasTwoFactor: boolean }): Achievement[] {
  const { user, ownedCount, hasTwoFactor } = input;
  const turnoverRub = currencyToRub(user.turnover, user.currency);
  const level = user.level !== undefined ? Math.round(user.level) : calculateLevel(turnoverRub).level;
  const TRADER_TARGET_RUB = 5_000;
  const WHALE_TARGET_RUB = 100_000;
  const defs: Array<Omit<Achievement, "done" | "progress">> = [
    { id: "first-nft", title: "Первый NFT", description: "Купите свой первый NFT", current: ownedCount, target: 1 },
    { id: "collector", title: "Коллекционер", description: "Соберите 10 NFT в портфеле", current: ownedCount, target: 10 },
    { id: "curator", title: "Куратор", description: "Соберите 50 NFT в портфеле", current: ownedCount, target: 50 },
    { id: "trader", title: "Трейдер", description: `Достигните оборота ${formatMoney(rubToCurrency(TRADER_TARGET_RUB, user.currency), user.currency)}`, current: turnoverRub, target: TRADER_TARGET_RUB },
    { id: "whale", title: "Кит", description: `Достигните оборота ${formatMoney(rubToCurrency(WHALE_TARGET_RUB, user.currency), user.currency)}`, current: turnoverRub, target: WHALE_TARGET_RUB },
    { id: "level-5", title: "Уровень 5", description: "Поднимитесь до 5 уровня", current: level, target: 5 },
    { id: "verified", title: "Проверенный", description: "Пройдите верификацию аккаунта", current: user.verificated ? 1 : 0, target: 1 },
    { id: "secure", title: "Под защитой", description: "Включите двухфакторную защиту", current: hasTwoFactor ? 1 : 0, target: 1 }
  ];
  return defs.map((item) => ({ ...item, done: item.current >= item.target, progress: Math.min(1, Math.max(0, item.current / item.target)) }));
}

export type AuctionPhase = { id: "upcoming" | "active" | "ended"; label: string };

/** Phase from the server status when present, otherwise from the start/end times. */
export function getAuctionPhase(lot: { status?: "active" | "upcoming" | "ended" | undefined; starts?: string | null | undefined; ends: string }, now = Date.now()): AuctionPhase {
  const ended = timeLeft(lot.ends, now) === "истекло";
  const starts = lot.starts ? new Date(lot.starts).getTime() : NaN;
  const upcoming = !Number.isNaN(starts) && starts > now;
  if (lot.status === "ended" || (!lot.status && ended) || (lot.status === "active" && ended)) return { id: "ended", label: "аукцион завершён" };
  if (lot.status === "upcoming" || (!lot.status && upcoming)) return { id: "upcoming", label: upcoming ? `начнётся через ${timeLeft(lot.starts, now) ?? "—"}` : "скоро начнётся" };
  return { id: "active", label: `осталось ${timeLeft(lot.ends, now) ?? "—"}` };
}
