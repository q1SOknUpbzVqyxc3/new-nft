import type { ReactNode } from "react";

const RAIL_ICON_SIZE = 12;

function CardGlyph() {
  return (
    <svg width={RAIL_ICON_SIZE} height={RAIL_ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="5" width="20" height="14" rx="2.5" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  );
}

function SbpLogo() {
  return (
    <svg width={RAIL_ICON_SIZE} height={RAIL_ICON_SIZE} viewBox="0 0 97 120" aria-hidden="true">
      <path d="M0 26.12l14.532 25.975v15.844L.017 93.863 0 26.12z" fill="#5B57A2" />
      <path d="M55.797 42.643l13.617-8.346 27.868-.026-41.485 25.414V42.643z" fill="#D90751" />
      <path d="M55.72 25.967l.077 34.39-14.566-8.95V0l14.49 25.967z" fill="#FAB718" />
      <path d="M97.282 34.271l-27.869.026-13.693-8.33L41.231 0l56.05 34.271z" fill="#ED6F26" />
      <path d="M55.797 94.007V77.322l-14.566-8.78.008 51.458 14.558-25.993z" fill="#63B22F" />
      <path d="M69.38 85.737L14.531 52.095 0 26.12l97.223 59.583-27.844.034z" fill="#1487C9" />
      <path d="M41.24 120l14.556-25.993 13.583-8.27 27.843-.034L41.24 120z" fill="#017F36" />
      <path d="M.017 93.863l41.333-25.32-13.896-8.526-12.922 7.922L.017 93.863z" fill="#984995" />
    </svg>
  );
}

type CoinRule = { test: RegExp; color: string; img?: string; glyph?: ReactNode };

const COIN_RULES: CoinRule[] = [
  { test: /cryptobot/i, color: "#39A0E8", img: "/cryptobot.jpg" },
  { test: /xrocket|x rocket/i, color: "#2B8FDD", img: "/xrocket.jpg" },
  { test: /bitcoin/i, color: "#F7931A", img: "/bitcoin.jpg" },
  { test: /ethereum/i, color: "#627EEA", img: "/ethereum.jpg" },
  { test: /usdt/i, color: "#26A17B", glyph: "₮" },
  { test: /usdc/i, color: "#2775CA", glyph: "$" },
  { test: /\bton\b|gram/i, color: "#0098EA", img: "/gram.svg" },
  { test: /monero|xmr/i, color: "#FF6600", img: "/monero.jpg" },
  { test: /карта|\bcard\b/i, color: "#4C5FD5", glyph: <CardGlyph /> },
  { test: /сбп|\bsbp\b/i, color: "#fff", glyph: <SbpLogo /> }
];

export function matchCoin(label: string | undefined | null): CoinRule | null {
  if (!label) return null;
  return COIN_RULES.find((rule) => rule.test.test(label)) ?? null;
}

export function CoinBadge({ label, className = "" }: { label: string | undefined | null; className?: string }) {
  const coin = matchCoin(label);
  if (!coin) return null;
  if (coin.img) {
    return (
      <span className={`method-chip-icon method-chip-icon-coin method-chip-icon-img ${className}`} style={{ background: coin.color }} aria-hidden="true">
        <img src={coin.img} alt="" loading="lazy" decoding="async" />
      </span>
    );
  }
  return <span className={`method-chip-icon method-chip-icon-coin ${className}`} style={{ background: coin.color }} aria-hidden="true">{coin.glyph}</span>;
}
