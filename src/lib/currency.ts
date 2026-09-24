/** Fixed RUB exchange rates, matching the reference site so RUB-denominated targets (level/achievement thresholds) scale correctly into any account currency. */
export const RUB_PER_UNIT: Record<string, number> = {
  RUB: 1,
  UAH: 1.8864,
  BYN: 27.7408,
  KZT: 0.187943,
  USD: 84.3384,
  EUR: 97.2573
};

function rateFor(currency: string | number | undefined | null) {
  if (currency === undefined || currency === null) return null;
  const rate = RUB_PER_UNIT[String(currency).toUpperCase()];
  return rate && rate > 0 ? rate : null;
}

export function rubToCurrency(amountRub: number, currency: string | number | undefined | null) {
  const rate = rateFor(currency);
  return rate ? amountRub / rate : amountRub;
}

export function currencyToRub(amountInCurrency: number, currency: string | number | undefined | null) {
  const rate = rateFor(currency);
  return rate ? amountInCurrency * rate : amountInCurrency;
}
