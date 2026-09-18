import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getUserFacingError } from "@/lib/api/errors";
import { api } from "@/lib/api/services";
import { formatMoney } from "@/lib/formatters";
import { useApiResource } from "@/lib/hooks/use-api-resource";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { LoadingState } from "./ui/page-state";
import { SafeMedia } from "./ui/safe-media";

export function MarketplaceSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebouncedValue(query.trim(), 350);
  const search = useApiResource(debouncedQuery ? `search:${debouncedQuery}` : null, (signal) => api.search(debouncedQuery, signal));
  const showResults = open && debouncedQuery.length > 0;

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) setOpen(false);
    };
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", closeWithEscape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, [open]);

  return (
    <div className="search-box market-search app-header__search" ref={containerRef}>
      <Search size={18} aria-hidden="true" />
      <input
        className="field__input"
        value={query}
        onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Поиск по NFT и коллекциям"
        aria-label="Поиск по маркетплейсу"
      />
      {query ? <button type="button" className="search-clear" aria-label="Очистить поиск" onClick={() => { setQuery(""); setOpen(false); }}><X size={16} /></button> : null}
      {showResults ? (
        <div className="search-results" role="region" aria-label="Результаты поиска">
          {search.status === "loading" ? <LoadingState label="Ищем" /> : search.status === "error" ? <div className="search-message" role="alert">{getUserFacingError(search.error)}</div> : search.data.length ? search.data.map((item) => (
            <Link to={`/client/collectible/${item.id}`} className="search-result" key={String(item.id)} onClick={() => setOpen(false)}>
              <SafeMedia src={item.image} alt={`${item.collection_name} #${item.number}`} />
              <div className="search-result__body"><strong>{item.collection_name} #{item.number}</strong><span>{item.blockchain}</span></div>
              <span className="search-result__price">{formatMoney(item.price, item.currency)}</span>
            </Link>
          )) : <div className="search-message">Ничего не найдено</div>}
        </div>
      ) : null}
    </div>
  );
}
