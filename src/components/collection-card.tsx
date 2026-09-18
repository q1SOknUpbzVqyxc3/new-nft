import { Link } from "react-router-dom";
import { ArrowUpRight, Blocks } from "lucide-react";
import type { CollectionSummary } from "@/lib/api/schemas";
import { SafeMedia } from "./ui/safe-media";

type CollectionCardSize = "lead" | "rail" | "grid";

export function CollectionCard({ collection, size = "grid" }: { collection: CollectionSummary; size?: CollectionCardSize }) {
  return (
    <article className={`collection-card collection-card--${size}`}>
      <Link to={`/client/collection/${collection.id}`} className="collection-card__link">
        <div className="collection-card__media-wrap">
          <SafeMedia src={collection.image} alt={collection.name} className="collection-card__media" eager={size === "lead"} />
          <span className="collection-card__chain">
            <Blocks size={12} aria-hidden="true" />
            {collection.blockchain || "—"}
          </span>
          <span className="collection-card__arrow" aria-hidden="true">
            <ArrowUpRight size={14} />
          </span>
        </div>
        <div className="collection-card__meta">
          <strong>{collection.name}</strong>
          {collection.author ? <span>{collection.author}</span> : null}
        </div>
      </Link>
    </article>
  );
}
