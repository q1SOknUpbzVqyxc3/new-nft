import { Link } from "react-router-dom";
import { ArrowUpRight, Blocks } from "lucide-react";
import type { MarketplaceNft } from "@/lib/api/schemas";
import { formatMoney } from "@/lib/formatters";
import { SafeMedia } from "./ui/safe-media";

type NftCardProps = {
  nft: MarketplaceNft;
  collectionName: string;
};

export function NftCard({ nft, collectionName }: NftCardProps) {
  return (
    <article className="nft-card">
      <Link to={`/client/collectible/${nft.id}`} className="nft-card__link" aria-label={`${collectionName} #${nft.number}`}>
        <div className="nft-card__media-wrap">
          <SafeMedia src={nft.image} alt={`${collectionName} #${nft.number}`} className="nft-card__media" />
          <span className="nft-card__chain"><Blocks size={12} aria-hidden="true" />{nft.blockchain || "—"}</span>
          <span className="nft-card__open" aria-hidden="true">
            <ArrowUpRight size={14} />
          </span>
        </div>
        <div className="nft-card__body">
          <span className="nft-card__collection">{collectionName}</span>
          <strong className="nft-card__name">#{nft.number}</strong>
          <strong className="nft-card__price-value">{formatMoney(nft.price, nft.currency)}</strong>
        </div>
      </Link>
    </article>
  );
}
