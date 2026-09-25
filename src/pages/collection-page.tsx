import { ArrowLeft, Blocks, Search } from "lucide-react";
import { useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ActivityFeed } from "@/components/activity-feed";
import { CollectionMarketStats } from "@/components/collection-market";
import { NftCard } from "@/components/nft-card";
import { SafeMedia } from "@/components/ui/safe-media";
import { Button } from "@/components/ui/button";
import { CardGridSkeleton, EmptyState, ErrorState } from "@/components/ui/page-state";
import { api } from "@/lib/api/services";
import { getUserFacingError } from "@/lib/api/errors";
import { useApiResource } from "@/lib/hooks/use-api-resource";
import { formatCompactNumber, formatMoney } from "@/lib/formatters";

const SORT_OPTIONS = [
  { id: "default", label: "По умолчанию" },
  { id: "price-asc", label: "Цена: сначала дешёвые" },
  { id: "price-desc", label: "Цена: сначала дорогие" },
  { id: "number-asc", label: "Token ID: по возрастанию" },
  { id: "number-desc", label: "Token ID: по убыванию" }
] as const;
type SortOption = (typeof SORT_OPTIONS)[number]["id"];

export function CollectionPage() {
  const { collectionId = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const chain = params.get("chain") ?? "";
  const priceMin = params.get("price_min") ?? "";
  const priceMax = params.get("price_max") ?? "";
  const sort: SortOption = (SORT_OPTIONS.find((option) => option.id === params.get("sort"))?.id) ?? "default";
  const collection = useApiResource(collectionId ? `collection:${collectionId}` : null, (signal) => api.getCollection(collectionId, signal));
  // `in_own` from the backend equals the collection size, so the count of your NFTs comes from your portfolio instead.
  const owned = useApiResource("owned-nfts", (signal) => api.getOwnedNfts(signal));
  const chains = useMemo(() => collection.status === "success" ? Array.from(new Set(collection.data.nfts.map((nft) => nft.blockchain).filter(Boolean))).sort() : [], [collection]);
  const visibleNfts = useMemo(() => {
    if (collection.status !== "success") return [];
    const min = priceMin ? Number(priceMin) : null;
    const max = priceMax ? Number(priceMax) : null;
    const filtered = collection.data.nfts.filter((nft) => {
      if (!String(nft.number).toLowerCase().includes(query.toLowerCase())) return false;
      if (chain && nft.blockchain !== chain) return false;
      if (min !== null && Number.isFinite(min) && nft.price < min) return false;
      if (max !== null && Number.isFinite(max) && nft.price > max) return false;
      return true;
    });
    const sorted = [...filtered];
    if (sort === "price-asc") sorted.sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") sorted.sort((a, b) => b.price - a.price);
    else if (sort === "number-asc") sorted.sort((a, b) => Number(a.number) - Number(b.number));
    else if (sort === "number-desc") sorted.sort((a, b) => Number(b.number) - Number(a.number));
    return sorted;
  }, [collection, query, chain, priceMin, priceMax, sort]);

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next, { replace: true });
  }

  const hasActiveFilters = Boolean(query || chain || priceMin || priceMax || sort !== "default");
  function resetFilters() {
    setParams(new URLSearchParams(), { replace: true });
  }

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
        <div className="collection-toolbar"><div><strong>Объекты</strong><span>{visibleNfts.length} из {details.nfts.length}</span></div><label className="search-box collection-search"><Search size={18} /><input className="field__input" value={query} onChange={(event) => setParam("q", event.target.value)} placeholder="Поиск по token ID" /></label></div>
        <div className="collection-filters" role="group" aria-label="Фильтры">
          {chains.length > 1 ? (
            <label className="field"><span className="field__label">Блокчейн</span><select className="select" value={chain} onChange={(event) => setParam("chain", event.target.value)}><option value="">Все сети</option>{chains.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          ) : null}
          <label className="field"><span className="field__label">Цена от</span><input className="field__input" type="number" min="0" step="0.01" value={priceMin} onChange={(event) => setParam("price_min", event.target.value)} placeholder="0" /></label>
          <label className="field"><span className="field__label">Цена до</span><input className="field__input" type="number" min="0" step="0.01" value={priceMax} onChange={(event) => setParam("price_max", event.target.value)} placeholder="∞" /></label>
          <label className="field"><span className="field__label">Сортировка</span><select className="select" value={sort} onChange={(event) => setParam("sort", event.target.value)}>{SORT_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>
          {hasActiveFilters ? <Button type="button" variant="ghost" size="small" onClick={resetFilters}>Сбросить фильтры</Button> : null}
        </div>
        {visibleNfts.length ? <div className="nft-grid">{visibleNfts.map((nft) => <NftCard key={String(nft.id)} nft={nft} collectionName={details.name} />)}</div> : <EmptyState title="NFT не найдены" description={hasActiveFilters ? "Измените параметры поиска или сбросьте фильтры." : "В этой коллекции пока нет объектов."} />}
        <ActivityFeed scope={{ collectionId }} title="Активность коллекции" />
      </div>
    </main>
  );
}
