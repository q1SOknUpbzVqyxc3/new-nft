import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CollectionCard } from "@/components/collection-card";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/page-state";
import { SafeMedia } from "@/components/ui/safe-media";
import { api } from "@/lib/api/services";
import { getUserFacingError } from "@/lib/api/errors";
import { useApiResource } from "@/lib/hooks/use-api-resource";

export function HomePage() {
  const collections = useApiResource("collections", (signal) => api.getCollections(signal));
  const [chain, setChain] = useState("");
  const chains = useMemo(() => collections.status === "success" ? Array.from(new Set(collections.data.map((item) => item.blockchain).filter(Boolean))) : [], [collections]);

  if (collections.status === "loading") return <main className="page"><LoadingState label="Загружаем коллекции" /></main>;
  if (collections.status === "error") return <main className="page"><ErrorState message={getUserFacingError(collections.error)} onRetry={collections.refresh} /></main>;

  const list = chain ? collections.data.filter((item) => item.blockchain === chain) : collections.data;
  const lead = list[0];
  const thumbs = list.slice(1, 4);

  return (
    <main className="page os-home">
      <div className="chip-row" role="group" aria-label="Сеть">
        <button type="button" className={chain ? "chip" : "chip chip--active"} onClick={() => setChain("")}>Все</button>
        {chains.map((name) => <button type="button" key={name} className={chain === name ? "chip chip--active" : "chip"} onClick={() => setChain(name)}>{name}</button>)}
      </div>
      {!lead ? <EmptyState title="Коллекций пока нет" description="Новые коллекции появятся здесь после публикации." /> : (
        <div className="os-home__layout">
          <div className="os-home__main">
            <Link to={`/client/collection/${lead.id}`} className="os-hero">
              <SafeMedia src={lead.image} alt={lead.name} className="os-hero__media" eager />
              <div className="os-hero__scrim" />
              <div className="os-hero__body">
                <h1>{lead.name}</h1>
                <span>{lead.author ? `Автор ${lead.author} · ` : ""}{lead.blockchain}</span>
              </div>
              <div className="os-hero__thumbs" aria-hidden="true">{thumbs.map((item) => <SafeMedia key={String(item.id)} src={item.image} alt="" />)}</div>
            </Link>
            <div className="section-heading section-heading--compact"><h2>Все коллекции</h2><span className="section-heading__count">{list.length}</span></div>
            <div className="collection-grid">{list.map((collection) => <CollectionCard key={String(collection.id)} collection={collection} size="grid" />)}</div>
          </div>
          <aside className="os-table" aria-label="Список коллекций">
            <div className="os-table__head"><span>Коллекция</span><span>Сеть</span></div>
            {list.slice(0, 20).map((item) => (
              <Link key={String(item.id)} to={`/client/collection/${item.id}`} className="os-table__row">
                <SafeMedia src={item.image} alt="" />
                <span className="os-table__name"><strong>{item.name}</strong>{item.author ? <em>{item.author}</em> : null}</span>
                <span className="os-table__chain">{item.blockchain}</span>
              </Link>
            ))}
          </aside>
        </div>
      )}
    </main>
  );
}
