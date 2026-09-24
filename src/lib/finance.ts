import type { FinanceHistory } from "./api/schemas";

const CURRENCY_CODES = ["RUB", "UAH", "KZT", "BYN", "USD", "EUR"];
const DAY_MS = 86_400_000;

export const FinanceType = { deposit: 0, withdraw: 1 } as const;
export const FinanceStatus = { pending: 0, rejected: 2, success: 4 } as const;

export function normalizeCurrency(value: string | number) {
  return typeof value === "number" ? (CURRENCY_CODES[value] ?? String(value)) : value.toUpperCase();
}

export function getFinanceStatusLabel(status: number, expired = false) {
  if (status === FinanceStatus.pending && expired) return "Истекло";
  if (status === FinanceStatus.pending) return "Обработка";
  if (status === FinanceStatus.rejected) return "Отклонено";
  if (status === FinanceStatus.success) return "Успешно";
  return `Статус ${status}`;
}

export function getFinanceStatusTone(status: number, expired = false) {
  if (status === FinanceStatus.success) return "ok";
  if (status === FinanceStatus.rejected || (status === FinanceStatus.pending && expired)) return "bad";
  return "neutral";
}

export function getFinanceTypeLabel(type: number) {
  return type === FinanceType.deposit ? "Пополнение" : type === FinanceType.withdraw ? "Вывод" : `Операция ${type}`;
}

function timestamp(item: FinanceHistory) {
  const value = new Date(item.created).getTime();
  return Number.isNaN(value) ? null : value;
}

function signedAmount(item: FinanceHistory) {
  const amount = Math.abs(item.amount);
  return item.type === FinanceType.withdraw ? -amount : amount;
}

/** Confirmed operations in the account currency, oldest first; other currencies are counted, not converted. */
function confirmedInCurrency(history: FinanceHistory[], currency: string) {
  const rows: Array<{ item: FinanceHistory; ts: number }> = [];
  let skipped = 0;
  for (const item of history) {
    if (item.status !== FinanceStatus.success) continue;
    const ts = timestamp(item);
    if (ts === null) continue;
    if (normalizeCurrency(item.currency) !== currency.toUpperCase()) { skipped += 1; continue; }
    rows.push({ item, ts });
  }
  rows.sort((a, b) => a.ts - b.ts);
  return { rows, skipped };
}

export type CashflowPoint = { t: number; v: number };

/** Running net deposit-minus-withdrawal balance over time. */
export function buildCashflowSeries(history: FinanceHistory[], currency: string, days: number | null, now = Date.now()) {
  const { rows, skipped } = confirmedInCurrency(history, currency);
  const cutoff = days === null ? null : now - days * DAY_MS;
  let running = 0;
  const points: CashflowPoint[] = [];
  for (const { item, ts } of rows) {
    running += signedAmount(item);
    if (cutoff === null || ts >= cutoff) points.push({ t: ts, v: running });
  }
  return { points, skipped };
}

export function summarizeFlow(history: FinanceHistory[], currency: string, days: number | null, now = Date.now()) {
  const { rows, skipped } = confirmedInCurrency(history, currency);
  const cutoff = days === null ? null : now - days * DAY_MS;
  let deposits = 0;
  let withdrawals = 0;
  for (const { item, ts } of rows) {
    if (cutoff !== null && ts < cutoff) continue;
    if (item.type === FinanceType.withdraw) withdrawals += Math.abs(item.amount);
    else deposits += Math.abs(item.amount);
  }
  return { deposits, withdrawals, net: deposits - withdrawals, skipped };
}

export function isExpiredPending(item: FinanceHistory, now = Date.now()) {
  const expired = item["expired"];
  if (item.status !== FinanceStatus.pending || typeof expired !== "string") return false;
  const value = new Date(expired).getTime();
  return !Number.isNaN(value) && value < now;
}

/** Sum of withdrawals still awaiting processing, in the account currency. */
export function pendingWithdrawalTotal(history: FinanceHistory[], currency: string, now = Date.now()) {
  return history
    .filter((item) => item.type === FinanceType.withdraw && item.status === FinanceStatus.pending && !isExpiredPending(item, now) && normalizeCurrency(item.currency) === currency.toUpperCase())
    .reduce((sum, item) => sum + Math.abs(item.amount), 0);
}

/** The backend uses huge sentinel values (e.g. 999999999999) for "no minimum known"; those must not reach the UI. */
export function sanitizeMinimum(value: number | undefined | null) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 && value < 1_000_000_000 ? value : 0;
}

/** Card and SBP deposits above this amount are routed through the finance department instead of an automatic invoice. */
export function getLargeDepositThreshold(currency: string) {
  const configured = Number(import.meta.env["VITE_LARGE_DEPOSIT_THRESHOLD"]);
  if (Number.isFinite(configured) && configured > 0) return configured;
  return currency.toUpperCase() === "RUB" ? 2_000 : null;
}

export function isCardOrSbpMethod(label: string) {
  return /карта|\bcard\b|сбп|\bsbp\b/i.test(label);
}

export function isSbpMethod(label: string) {
  return /сбп|\bsbp\b/i.test(label);
}
