import { Clock, Gavel, Hand, ShoppingBag, Trophy } from "lucide-react";
import { type FormEvent, useState } from "react";
import { ApiError, isEndpointUnavailable } from "@/lib/api/client";
import { getUserFacingError } from "@/lib/api/errors";
import type { Auction, NftDetails, NftExtra } from "@/lib/api/schemas";
import { api } from "@/lib/api/services";
import { getFormString } from "@/lib/form-data";
import { formatAddress, formatMoney } from "@/lib/formatters";
import { useNow } from "@/lib/hooks/use-now";
import { useOptionalResource } from "@/lib/hooks/use-optional-resource";
import { getAuctionPhase, getRarityTier } from "@/lib/market";
import { ConfirmModal } from "./notice-modal";
import { StatGrid } from "./stat-grid";
import { Button } from "./ui/button";
import { TextField } from "./ui/text-field";
import { UnavailableNote } from "./unavailable-note";

/** Token, chain, contract, rarity and traits. Owners are not shown: NFTs are not traded between users. */
export function NftFacts({ item, extra, unavailable }: { item: NftDetails; extra: NftExtra | null; unavailable: boolean }) {
  const tier = getRarityTier(extra?.rarity_rank, extra?.supply);
  const traits = extra?.traits ?? [];
  return (
    <>
      <StatGrid className="nft-facts" items={[
        { label: "Token ID", value: String(item.number) },
        { label: "Blockchain", value: item.blockchain || undefined },
        { label: "Contract address", value: extra?.contract_address ? <span className="break-value" title={extra.contract_address}>{formatAddress(extra.contract_address, 6)}</span> : undefined },
        { label: "Rarity rank", value: extra?.rarity_rank === undefined ? undefined : `#${extra.rarity_rank}${extra.supply ? ` из ${extra.supply}` : ""}` },
        { label: "Rarity score", value: extra?.rarity_score === undefined ? undefined : extra.rarity_score.toLocaleString("ru-RU", { maximumFractionDigits: 2 }) }
      ]} />
      {tier ? <span className={`rarity-badge rarity-badge--${tier.id}`}>{tier.label}</span> : null}
      {unavailable ? <UnavailableNote>Атрибуты, редкость и адрес контракта появятся, когда сервер начнёт отдавать их.</UnavailableNote> : null}
      {traits.length ? (
        <section className="nft-traits" aria-label="Атрибуты">
          <h2>Traits</h2>
          <div className="nft-traits__grid">{traits.map((trait, index) => <div key={`${trait.trait_type ?? trait.name}-${index}`}><span>{trait.trait_type ?? trait.name ?? "Атрибут"}</span><strong>{String(trait.value)}</strong>{trait.rarity_percent !== undefined ? <small>{trait.rarity_percent}% имеют этот атрибут</small> : null}</div>)}</div>
        </section>
      ) : null}
    </>
  );
}

type Feedback = { type: "success" | "error"; text: string } | null;

/** Where the auction stands for this user, for the badge on lots and on the NFT page. */
export function AuctionStanding({ auction, currency }: { auction: Auction; currency: string }) {
  if (auction.is_leading) return <span className="auction-standing auction-standing--lead"><Trophy size={13} aria-hidden="true" /> Ваша ставка лидирует{auction.my_bid ? ` · ${formatMoney(auction.my_bid, currency)}` : ""}</span>;
  if (auction.my_bid && auction.status !== "ended") return <span className="auction-standing auction-standing--outbid">Вашу ставку перебили · {formatMoney(auction.my_bid, currency)}</span>;
  return null;
}

/**
 * Platform-run auction of this NFT: current bid, minimum bid, your standing, bid form and "buy now".
 * A 404 means "no auction for this NFT" and simply renders nothing.
 */
export function NftAuction({ nftId, item, onChanged, onBlocked }: { nftId: string; item: NftDetails; onChanged: () => void; onBlocked: () => void }) {
  const now = useNow();
  const auction = useOptionalResource(`nft-auction:${nftId}`, (signal) => api.getAuction(nftId, signal));
  const [busy, setBusy] = useState<"bid" | "buy" | null>(null);
  const [confirmingBuyNow, setConfirmingBuyNow] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  if (auction.state === "loading" || auction.state === "unavailable") return null;
  if (auction.state === "error") return <section className="surface nft-trading"><div className="inline-alert" role="alert">{getUserFacingError(auction.error)}</div></section>;

  const lot = auction.data;
  const currency = lot.currency ?? item.currency;
  const phase = getAuctionPhase(lot, now);
  const minBid = lot.min_bid ?? lot.start_price ?? 0;

  async function run(kind: "bid" | "buy", action: () => Promise<unknown>, success: string) {
    if (busy) return false;
    setBusy(kind); setFeedback(null);
    try {
      await action();
      setFeedback({ type: "success", text: success });
      auction.refresh();
      onChanged();
      return true;
    } catch (error) {
      if (error instanceof ApiError && error.code === "u_cant_buy") onBlocked();
      else setFeedback({ type: "error", text: isEndpointUnavailable(error) ? "Аукционы пока недоступны на сервере." : getUserFacingError(error) });
      if (error instanceof ApiError && (error.code === "bid_too_low" || error.code === "auction_ended")) auction.refresh();
      return false;
    } finally { setBusy(null); setConfirmingBuyNow(false); }
  }

  function bid(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const amount = Number(getFormString(new FormData(form), "amount"));
    if (!Number.isFinite(amount) || amount <= 0) { setFeedback({ type: "error", text: "Укажите сумму ставки." }); return; }
    if (amount < minBid) { setFeedback({ type: "error", text: `Минимальная ставка — ${formatMoney(minBid, currency)}.` }); return; }
    void run("bid", () => api.placeBid(nftId, amount), `Ставка ${formatMoney(amount, currency)} принята.`).then((ok) => { if (ok) form.reset(); });
  }

  return (
    <section className="surface nft-trading" aria-label="Аукцион">
      <div className="nft-trading__head">
        <h2><Gavel size={18} aria-hidden="true" /> Аукцион</h2>
        <span className={`auction-phase auction-phase--${phase.id}`}><Clock size={13} aria-hidden="true" /> {phase.label}</span>
      </div>
      <StatGrid items={[
        { label: lot.bids ? "Текущая ставка" : "Стартовая цена", value: (lot.bids ? lot.current_bid : lot.start_price ?? lot.current_bid) === undefined ? undefined : formatMoney((lot.bids ? lot.current_bid : lot.start_price ?? lot.current_bid) ?? 0, currency) },
        { label: "Мин. ставка", value: lot.min_bid === undefined ? undefined : formatMoney(lot.min_bid, currency) },
        { label: "Ставок", value: lot.bids },
        { label: "Выкуп сразу", value: lot.buy_now_price === undefined ? undefined : formatMoney(lot.buy_now_price, currency) }
      ]} />
      <AuctionStanding auction={lot} currency={currency} />

      {phase.id === "active" ? (
        <>
          <form className="inline-form" noValidate onSubmit={bid}>
            <TextField label={`Ваша ставка, ${currency}`} name="amount" type="number" min={minBid || 0.01} step="0.01" hint={minBid ? `Минимум ${formatMoney(minBid, currency)}` : undefined} disabled={busy !== null} required />
            <Button type="submit" disabled={busy !== null}><Hand size={16} aria-hidden="true" /> {busy === "bid" ? "…" : "Сделать ставку"}</Button>
          </form>
          {lot.buy_now_price ? <Button variant="secondary" disabled={busy !== null} onClick={() => setConfirmingBuyNow(true)}><ShoppingBag size={16} aria-hidden="true" /> Выкупить сразу за {formatMoney(lot.buy_now_price, currency)}</Button> : null}
        </>
      ) : null}

      {feedback ? <div className={feedback.type === "success" ? "inline-alert inline-alert--success" : "inline-alert"} role="status">{feedback.text}</div> : null}
      {confirmingBuyNow && lot.buy_now_price ? <ConfirmModal title="Выкупить лот сразу?" description={`С баланса будет списано ${formatMoney(lot.buy_now_price, currency)}, аукцион завершится, а NFT станет вашим.`} confirmLabel="Выкупить" pending={busy === "buy"} onConfirm={() => void run("buy", () => api.buyNowAuction(nftId), "Лот выкуплен.")} onCancel={() => setConfirmingBuyNow(false)} /> : null}
    </section>
  );
}
