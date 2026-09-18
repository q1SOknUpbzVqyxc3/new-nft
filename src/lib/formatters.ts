const currencySymbols: Record<string, string> = {
  RUB: "₽",
  UAH: "₴",
  KZT: "₸",
  BYN: "Br",
  USD: "$",
  EUR: "€"
};

export function getCurrencySymbol(currency: string | number) {
  if (typeof currency === "number") {
    return ["₽", "₴", "₸", "Br", "$", "€"][currency] ?? String(currency);
  }

  return currencySymbols[currency.toUpperCase()] ?? currency;
}

export function formatAmount(value: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits,
    minimumFractionDigits: 0
  }).format(value);
}

export function formatMoney(value: number, currency: string | number) {
  return `${formatAmount(value)} ${getCurrencySymbol(currency)}`;
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

export function formatPercent(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "percent",
    maximumFractionDigits: 1
  }).format(value / 100);
}

export function formatDateTime(value: string | number | Date) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

export function formatAddress(value: string, visibleCharacters = 6) {
  if (value.length <= visibleCharacters * 2 + 1) {
    return value;
  }

  return `${value.slice(0, visibleCharacters)}…${value.slice(-visibleCharacters)}`;
}
