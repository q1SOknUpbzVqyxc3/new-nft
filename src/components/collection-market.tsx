import type { CollectionDetails } from "@/lib/api/schemas";
import { getUserFacingError } from "@/lib/api/errors";
import { api } from "@/lib/api/services";
import { formatCompactNumber, formatMoney, formatPercent } from "@/lib/formatters";
import { useOptionalResource } from "@/lib/hooks/use-optional-resource";
import { mergeCollectionStats, seriesToPoints } from "@/lib/market";
import { StatGrid } from "./stat-grid";
import { UnavailableNote } from "./unavailable-note";
import { ValueChart } from "./value-chart";

/** Floor, volume, owners, listed %, supply, description and the floor-price chart. */
export function CollectionMarketStats({ collectionId, details, currency }: { collectionId: string; details: CollectionDetails; currency: string }) {
  const stats = useOptionalResource(`collection-stats:${collectionId}`, (signal) => api.getCollectionStats(collectionId, signal));
  const view = mergeCollectionStats(details, stats.state === "ready" ? stats.data : null);
  const money = (value: number | undefined) => value === undefined ? undefined : formatMoney(value, currency);
  const points = stats.state === "ready" ? seriesToPoints(stats.data.floor_history) : [];

  return (
    <section className="collection-market" aria-label="Статистика коллекции">
      <StatGrid items={[
        { label: "Floor price", value: money(view.floor), hint: "Минимальная цена среди выставленных NFT" },
        { label: "Total volume", value: money(view.volume), hint: "Суммарный объём продаж" },
        { label: "Owners", value: view.owners === undefined ? undefined : formatCompactNumber(view.owners) },
        { label: "Listed", value: view.listedPercent === undefined ? undefined : formatPercent(view.listedPercent), hint: "Доля NFT, выставленных на продажу" },
        { label: "Supply", value: view.supply === undefined ? undefined : formatCompactNumber(view.supply) }
      ]} />
      {view.description ? <p className="collection-market__description">{view.description}</p> : null}
      <div className="surface collection-market__chart">
        <h2>График floor price</h2>
        {stats.state === "loading" ? <p className="profile-muted">Загружаем…</p> : stats.state === "unavailable" ? <UnavailableNote>Статистика коллекции и график floor price появятся, когда сервер начнёт отдавать эти данные.</UnavailableNote> : stats.state === "error" ? <div className="inline-alert" role="alert">{getUserFacingError(stats.error)}</div> : points.length ? <ValueChart points={points} format={(value) => formatMoney(value, currency)} label="График floor price" /> : <p className="profile-muted">История floor price пока не накоплена.</p>}
      </div>
    </section>
  );
}
