import { Link, useSearchParams } from "react-router-dom";
import { useAuthenticatedUser } from "@/auth/auth-context";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/page-state";
import { SafeMedia } from "@/components/ui/safe-media";
import { UnavailableNote } from "@/components/unavailable-note";
import { getUserFacingError } from "@/lib/api/errors";
import type { RankingRow } from "@/lib/api/schemas";
import { api } from "@/lib/api/services";
import { formatCompactNumber, formatMoney, formatPercent } from "@/lib/formatters";
import { useApiResource } from "@/lib/hooks/use-api-resource";
import { useOptionalResource } from "@/lib/hooks/use-optional-resource";
import { RANKING_CATEGORIES, RANKING_PERIODS, type RankingCategory, type RankingPeriod } from "@/lib/market";

function parsePeriod(value: string | null): RankingPeriod {
  return RANKING_PERIODS.find((period) => period === value) ?? "24H";
}
function parseCategory(value: string | null): RankingCategory {
  return RANKING_CATEGORIES.find((category) => category.id === value)?.id ?? "trending";
}

export function RankingsPage() {
  const { user } = useAuthenticatedUser();
  const [params, setParams] = useSearchParams();
  const period = parsePeriod(params.get("period"));
  const category = parseCategory(params.get("category"));
  const ranking = useOptionalResource(`ranking:${category}:${period}`, (signal) => api.getRankings(period, category, signal));
  // Without the rankings endpoint the plain collection list is still useful, ordered newest-first for "New".
  const fallback = useApiResource(ranking.state === "unavailable" ? "ranking-fallback" : null, (signal) => api.getCollections(signal));

  function update(next: Partial<{ period: RankingPeriod; category: RankingCategory }>) {
    setParams({ period: next.period ?? period, category: next.category ?? category }, { replace: true });
  }

  const rows: RankingRow[] = ranking.state === "ready" ? ranking.data : fallback.status === "success"
    ? [...fallback.data].sort((a, b) => category === "new" ? Number(b.id) - Number(a.id) : 0).map((item) => ({ collection_id: item.id, name: item.name, image: item.image, blockchain: item.blockchain }))
    : [];

  return (
    <main className="container page rankings">
      <header className="page-header"><div><span className="eyebrow">Stats</span><h1>Рейтинги</h1><p>Коллекции по объёму, росту и новизне за выбранный период</p></div></header>
      <div className="rankings__filters">
        <div className="tabs" role="tablist" aria-label="Категория">{RANKING_CATEGORIES.map((item) => <button key={item.id} type="button" role="tab" aria-selected={category === item.id} className={category === item.id ? "active" : ""} onClick={() => update({ category: item.id })}>{item.label}</button>)}</div>
        <div className="chip-row" role="group" aria-label="Период">{RANKING_PERIODS.map((item) => <button key={item} type="button" className={period === item ? "chip chip--active" : "chip"} onClick={() => update({ period: item })}>{item}</button>)}</div>
      </div>
      {ranking.state === "unavailable" ? <UnavailableNote>Объём, floor и динамика цен появятся, когда сервер начнёт отдавать рейтинги. Пока показан список коллекций.</UnavailableNote> : null}
      {ranking.state === "loading" || (ranking.state === "unavailable" && fallback.status === "loading") ? <LoadingState label="Загружаем рейтинг" /> : ranking.state === "error" ? <ErrorState message={getUserFacingError(ranking.error)} onRetry={ranking.refresh} /> : rows.length === 0 ? <EmptyState title="Пока пусто" description="Коллекции появятся здесь, когда на маркете начнётся активность." /> : (
        <div className="tx-table-wrap">
          <table className="tx-table rank-table">
            <thead><tr><th>#</th><th>Коллекция</th><th>Floor</th><th>Объём</th><th>Изменение</th><th>Владельцы</th><th>Items</th></tr></thead>
            <tbody>
              {rows.map((row, index) => {
                const currency = row.currency ?? user.currency;
                const change = row.change_percent;
                return (
                  <tr key={String(row.collection_id)}>
                    <td data-label="#">{index + 1}</td>
                    <td data-label="Коллекция"><Link to={`/client/collection/${row.collection_id}`} className="rank-table__name"><SafeMedia src={row.image} alt="" /><span><strong>{row.name}</strong>{row.blockchain ? <small>{row.blockchain}</small> : null}</span></Link></td>
                    <td data-label="Floor">{row.floor_price === undefined ? "—" : formatMoney(row.floor_price, currency)}</td>
                    <td data-label="Объём">{row.volume === undefined ? "—" : formatMoney(row.volume, currency)}</td>
                    <td data-label="Изменение" className={change === undefined ? "" : change >= 0 ? "tx-table__amount--in" : "tx-table__amount--out"}>{change === undefined ? "—" : `${change > 0 ? "+" : ""}${formatPercent(change)}`}</td>
                    <td data-label="Владельцы">{row.owners === undefined ? "—" : formatCompactNumber(row.owners)}</td>
                    <td data-label="Items">{row.items === undefined ? "—" : formatCompactNumber(row.items)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
