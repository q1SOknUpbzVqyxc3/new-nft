import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import type { PaymentSession } from "@/lib/api/schemas";
import { sanitizeMinimum } from "@/lib/finance";
import { formatDateTime, formatMoney } from "@/lib/formatters";
import { DepositQr } from "./deposit-qr";
import { Button } from "./ui/button";

const KNOWN_KEYS = new Set(["amount", "wallet", "address", "network", "chain", "expiration_estimate", "expired", "memo", "tag", "symbol", "currency"]);

function text(value: unknown) {
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean" ? String(value) : "";
}

function humanizeKey(key: string) {
  const spaced = key.replaceAll("_", " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function formatCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

function Countdown({ until }: { until: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return until - now > 0 ? <span className="payment-countdown">осталось {formatCountdown(until - now)}</span> : <span className="payment-countdown payment-countdown--expired">время истекло</span>;
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard is unavailable (insecure context); the value stays selectable */ }
  }
  return <Button type="button" variant="ghost" size="small" aria-label={label} onClick={() => void copy()}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? "Скопировано" : "Копировать"}</Button>;
}

/** Human-readable invoice: the backend returns a loose key/value bag, so known fields get labels and the rest is shown humanized. */
export function PaymentDetails({ session, currency }: { session: PaymentSession; currency: string }) {
  const details = session.details ?? {};
  const wallet = text(details["wallet"] ?? details["address"] ?? session.wallet);
  const network = text(details["network"] ?? details["chain"] ?? session.network);
  const symbol = text(details["symbol"] ?? session.symbol);
  const amount = text(details["amount"]);
  const memo = text(details["memo"] ?? details["tag"]);
  const expiresRaw = text(details["expiration_estimate"] ?? details["expired"]);
  const expiresAt = expiresRaw ? new Date(expiresRaw).getTime() : NaN;
  const minimum = sanitizeMinimum(session.min_dep);
  const extras = Object.entries(details).filter(([key, value]) => !KNOWN_KEYS.has(key) && text(value));

  return (
    <div className="payment-details">
      <div className="payment-details__fields">
      {amount ? <div className="detail-row"><span>Сумма к оплате</span><strong className="payment-details__amount">{amount}{symbol ? ` ${symbol.toUpperCase()}` : ""}</strong></div> : null}
      {network ? <div className="detail-row"><span>Сеть</span><strong>{network.toUpperCase()}</strong></div> : null}
      {wallet ? <div className="detail-row detail-row--stack"><span>Адрес кошелька</span><strong className="break-value">{wallet}</strong><CopyButton value={wallet} label="Скопировать адрес кошелька" /></div> : null}
      {memo ? <div className="detail-row detail-row--stack"><span>Memo / тег</span><strong className="break-value">{memo}</strong><CopyButton value={memo} label="Скопировать memo" /></div> : null}
      {Number.isFinite(expiresAt) ? <div className="detail-row"><span>Оплатить до</span><strong>{formatDateTime(expiresAt)} <Countdown until={expiresAt} /></strong></div> : null}
      {minimum ? <div className="detail-row"><span>Минимальная сумма</span><strong>{formatMoney(minimum, currency)}</strong></div> : null}
      {extras.map(([key, value]) => <div className="detail-row" key={key}><span>{humanizeKey(key)}</span><strong className="break-value">{text(value)}</strong></div>)}
      {wallet ? <p className="payment-details__warning">Отправляйте средства только в указанной сети. Перевод в другой сети приведёт к потере средств.</p> : null}
      </div>
      {wallet ? <DepositQr address={wallet} symbol={symbol} network={network} /> : null}
    </div>
  );
}
