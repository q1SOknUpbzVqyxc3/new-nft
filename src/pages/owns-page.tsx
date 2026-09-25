import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuthenticatedUser } from "@/auth/auth-context";
import { PortfolioAnalytics } from "@/components/portfolio-analytics";
import { SafeMedia } from "@/components/ui/safe-media";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/page-state";
import { api } from "@/lib/api/services";
import { getUserFacingError } from "@/lib/api/errors";
import { useApiResource } from "@/lib/hooks/use-api-resource";
import { formatDateTime, formatMoney } from "@/lib/formatters";

function pluralizeItems(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} предмет`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${count} предмета`;
  return `${count} предметов`;
}

export function OwnsPage() {
  const { user } = useAuthenticatedUser();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "history" ? "history" : "portfolio";
  const nftHistory = useApiResource(tab === "history" ? "nft-history" : null, (signal) => api.getNftHistory(signal));
  const owned = useApiResource("owned-nfts", (signal) => api.getOwnedNfts(signal));
  const [query, setQuery] = useState("");
  const items = useMemo(() => owned.status === "success" ? owned.data.filter((item) => `${item.pic.collection.name} ${item.pic.number}`.toLowerCase().includes(query.toLowerCase())) : [], [owned, query]);

  return (
    <main className="container page">
      <header className="page-header page-header--compact">
        <div><span className="eyebrow">Portfolio</span><h1>Мои NFT</h1></div>
      </header>
      <div className="tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === "portfolio"} className={tab === "portfolio" ? "active" : ""} onClick={() => setParams({}, { replace: true })}>Портфель</button>
        <button type="button" role="tab" aria-selected={tab === "history"} className={tab === "history" ? "active" : ""} onClick={() => setParams({ tab: "history" }, { replace: true })}>История</button>
      </div>
      {tab === "history" ? (
        nftHistory.status === "loading" ? <LoadingState label="Загружаем историю" /> : nftHistory.status === "error" ? <ErrorState message={getUserFacingError(nftHistory.error)} onRetry={nftHistory.refresh} /> : nftHistory.data.length ? (
          <div className="data-table" role="table">
            <div className="data-table__head" role="row"><span>Коллекция</span><span>Токен ID</span><span>Дата</span><span>Цена</span></div>
            {nftHistory.data.map((item, index) => (
              <div className="data-table__row" role="row" key={String(item.id ?? index)}>
                <span data-label="Коллекция">{item.collection_name}<small>{item.sale_date ? "Продан" : item.status === 1 ? "На продаже" : "Куплен"}</small></span>
                <span data-label="Токен ID">#{item.pic_id}</span>
                <span data-label="Дата">{item.sale_date ?? item.buy_date ? formatDateTime(item.sale_date ?? item.buy_date ?? "") : "—"}</span>
                <strong data-label="Цена">{item.sale_price > 0 ? formatMoney(item.sale_price, user.currency) : "—"}</strong>
              </div>
            ))}
          </div>
        ) : <EmptyState title="История пуста" description="Операции с NFT появятся здесь." />
      ) : <>
      {owned.status === "success" ? <PortfolioAnalytics owned={owned.data} currency={user.currency} /> : null}
      <div className="portfolio-toolbar">
        <span className="portfolio-toolbar__count">{owned.status === "success" ? pluralizeItems(owned.data.length) : ""}</span>
        <label className="search-box search-box--compact"><Search size={17} /><input className="field__input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Найти в портфеле" /></label>
      </div>
      {owned.status === "loading" ? <LoadingState label="Загружаем активы" /> : owned.status === "error" ? <ErrorState message={getUserFacingError(owned.error)} onRetry={owned.refresh} /> : items.length ? <div className="nft-grid">{items.map((item) => <article className="nft-card" key={String(item.id)}><Link to={`/client/collectible/${item.pic.id}`} className="nft-card__link"><div className="nft-card__media-wrap"><SafeMedia src={item.pic.image} alt={`${item.pic.collection.name} #${item.pic.number}`} className="nft-card__media" /></div><div className="nft-card__body"><span className="nft-card__collection">{item.pic.collection.name}</span><strong className="nft-card__name">#{item.pic.number}</strong><div className="nft-card__price"><span>{item.status ? "На продаже" : "В коллекции"}</span><strong>{formatMoney(item.status ? item.sale_price : item.pic.price, user.currency)}</strong></div></div></Link></article>)}</div> : <EmptyState title="Активов не найдено" description={query ? "Измените поисковый запрос." : "Купленные NFT появятся здесь."} />}
      </>}
    </main>
  );
}
