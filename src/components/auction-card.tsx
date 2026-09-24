import { Clock } from "lucide-react";
import { Link } from "react-router-dom";
import type { Auction } from "@/lib/api/schemas";
import { formatMoney } from "@/lib/formatters";
import { useNow } from "@/lib/hooks/use-now";
import { getAuctionPhase } from "@/lib/market";
import { AuctionStanding } from "./nft-market";
import { SafeMedia } from "./ui/safe-media";

/** One platform auction lot in a list: picture, current bid, time left and your standing. */
export function AuctionCard({ auction, currency }: { auction: Auction; currency: string }) {
  const now = useNow();
  const money = auction.currency ?? currency;
  const phase = getAuctionPhase(auction, now);
  const price = auction.bids ? auction.current_bid : (auction.start_price ?? auction.current_bid);
  const name = `${auction.collection_name ?? "NFT"}${auction.number !== undefined ? ` #${String(auction.number)}` : ""}`;
  const target = auction.image_id === undefined ? null : `/client/collectible/${String(auction.image_id)}`;
  const body = (
    <>
      <div className="auction-card__media"><SafeMedia src={auction.image ?? ""} alt={name} /><span className={`auction-phase auction-phase--${phase.id}`}><Clock size={12} aria-hidden="true" /> {phase.label}</span></div>
      <div className="auction-card__body">
        <strong>{name}</strong>
        {auction.blockchain ? <small>{auction.blockchain}</small> : null}
        <div className="auction-card__prices">
          <span><small>{auction.bids ? "Ставка" : "Старт"}</small><b>{price === undefined ? "—" : formatMoney(price, money)}</b></span>
          {auction.buy_now_price ? <span><small>Выкуп</small><b>{formatMoney(auction.buy_now_price, money)}</b></span> : null}
          {auction.bids ? <span><small>Ставок</small><b>{auction.bids}</b></span> : null}
        </div>
        <AuctionStanding auction={auction} currency={money} />
      </div>
    </>
  );
  return <article className="auction-card">{target ? <Link to={target} className="auction-card__link">{body}</Link> : <div className="auction-card__link">{body}</div>}</article>;
}
