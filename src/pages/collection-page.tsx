import { ArrowLeft, Blocks, Search } from "lucide-react";
import { useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ActivityFeed } from "@/components/activity-feed";
import { CollectionMarketStats } from "@/components/collection-market";
import { NftCard } from "@/components/nft-card";
import { SafeMedia } from "@/components/ui/safe-media";
import { CardGridSkeleton, EmptyState, ErrorState } from "@/components/ui/page-state";
import { api } from "@/lib/api/services";
import { getUserFacingError } from "@/lib/api/errors";
import { useApiResource } from "@/lib/hooks/use-api-resource";
import { formatCompactNumber, formatMoney } from "@/lib/formatters";

export function CollectionPage() {
  const { collectionId = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const collection = useApiResource(collectionId ? `collection:${collectionId}` : null, (signal) => api.getCollection(collectionId, signal));
  // `in_own` from the backend equals the collection size, so the count of your NFTs comes from your portfolio instead.
  const owned = useApiResource("owned-nfts", (signal) => api.getOwnedNfts(signal));
  const visibleNfts = useMemo(() => collection.status === "success" ? collection.data.nfts.filter((nft) => String(nft.number).toLowerCase().includes(query.toLowerCase())) : [], [collection, query]);

  if (collection.status === "loading") return <main className="page container"><div className="collection-hero skeleton" /><CardGridSkeleton /></main>;
  if (collection.status === "error") return <main className="page container"><ErrorState message={getUserFacingError(collection.error)} onRetry={collection.refresh} /></main>;

  const details = collection.data;
  const youOwn = owned.status === "success" ? owned.data.filter((record) => String(record.pic.collection_id) === collectionId).length : 0;
  const currency = details.nfts[0]?.currency ?? "USD";
  const leadImage = details.nfts[0]?.image ?? "";
  const leadBlockchain = details.nfts[0]?.blockchain || "Сеть не указана";
  const hasPriceRange = details.max_price > 0;

  return (
    <main className="page collection-page">
      <div className="collection-hero">
        <div className="container collection-hero__inner">
          <Link to="/client/main" className="back-link"><ArrowLeft size={16} /> Все коллекции</Link>
          <div className="collection-identity">
            <span className="collection-avatar">{leadImage ? <SafeMedia src={leadImage} alt={details.name} eager /> : <Blocks />}</span>
            <div>
              <span className="pill"><Blocks size={13} /> {leadBlockchain}</span>
              <h1>{details.name}</h1>
              <p>Автор: {details.author || "не указан"}</p>
            </div>
          </div>
          <dl className="collection-stats">
            <div><dt>Объектов</dt><dd>{formatCompactNumber(details.nfts.length)}</dd></div>
            {youOwn > 0 ? <div><dt>У вас</dt><dd>{formatCompactNumber(youOwn)}</dd></div> : null}
            {hasPriceRange ? <div><dt>Минимальная цена</dt><dd>{formatMoney(details.min_price, currency)}</dd></div> : null}
            {hasPriceRange ? <div><dt>Максимальная цена</dt><dd>{formatMoney(details.max_price, currency)}</dd></div> : null}
          </dl>
        </div>
      </div>
      <div className="container collection-content">
        <CollectionMarketStats collectionId={collectionId} details={details} currency={currency} />
        <div className="collection-toolbar"><div><strong>Items</strong><span>{visibleNfts.length} из {details.nfts.length}</span></div><label className="search-box collection-search"><Search size={18} /><input className="field__input" value={query} onChange={(event) => { const next = new URLSearchParams(params); const value = event.target.value; if (value) next.set("q", value); else next.delete("q"); setParams(next, { replace: true }); }} placeholder="Поиск по token ID" /></label></div>
        {visibleNfts.length ? <div className="nft-grid">{visibleNfts.map((nft) => <NftCard key={String(nft.id)} nft={nft} collectionName={details.name} />)}</div> : <EmptyState title="NFT не найдены" description={query ? "Измените поисковый запрос." : "В этой коллекции пока нет объектов."} />}
        <ActivityFeed scope={{ collectionId }} title="Активность коллекции" />
      </div>
    </main>
  );
}
