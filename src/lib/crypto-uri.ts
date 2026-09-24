/** Payload for a deposit QR code: a wallet URI for well-known chains, otherwise the bare address. */
export function buildDepositQrPayload({ address, symbol, network, memo }: { address: string; symbol?: string; network?: string; memo?: string }) {
  if (!address) return null;
  const ticker = (symbol ?? "").toLowerCase();
  const chain = (network ?? "").toLowerCase();
  if (/bitcoin|^btc$/.test(ticker)) return `bitcoin:${address}`;
  if (/\bton\b|gram/.test(ticker) || /\bton\b/.test(chain)) return `ton://transfer/${address}${memo ? `?text=${encodeURIComponent(memo)}` : ""}`;
  if (/monero|^xmr$/.test(ticker)) return `monero:${address}`;
  return address;
}
