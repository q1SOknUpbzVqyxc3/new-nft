import { useSearchParams } from "react-router-dom";
import { useAuthenticatedUser } from "@/auth/auth-context";
import { AuctionCard } from "@/components/auction-card";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/page-state";
import { UnavailableNote } from "@/components/unavailable-note";
import { getUserFacingError } from "@/lib/api/errors";
import { api } from "@/lib/api/services";
import { useOptionalResource } from "@/lib/hooks/use-optional-resource";

const STATUSES = [
  { id: "active", label: "Идут сейчас", empty: "Активных аукционов сейчас нет." },
  { id: "upcoming", label: "Скоро", empty: "Ближайших аукционов пока нет." },
  { id: "ended", label: "Завершённые", empty: "Завершённых аукционов пока нет." }
] as const;
type Status = (typeof STATUSES)[number]["id"];

function parseStatus(value: string | null): Status {
  return STATUSES.find((item) => item.id === value)?.id ?? "active";
}

/** Platform auctions: only the platform creates lots; users bid or buy out. */
export function AuctionsPage() {
  const { user } = useAuthenticatedUser();
  const [params, setParams] = useSearchParams();
  const status = parseStatus(params.get("status"));
  const auctions = useOptionalResource(`auctions:${status}`, (signal) => api.getAuctions(status, { limit: 60 }, signal));
  const current = STATUSES.find((item) => item.id === status);

  return (
    <main className="container page auctions">
      <header className="page-header"><div><span className="eyebrow">Auctions</span><h1>Аукционы</h1><p>Делайте ставки на лоты платформы или выкупайте их сразу</p></div></header>
      <div className="tabs" role="tablist" aria-label="Статус аукционов">{STATUSES.map((item) => <button key={item.id} type="button" role="tab" aria-selected={status === item.id} className={status === item.id ? "active" : ""} onClick={() => setParams({ status: item.id }, { replace: true })}>{item.label}</button>)}</div>
      {auctions.state === "loading" ? <LoadingState label="Загружаем аукционы" /> : auctions.state === "unavailable" ? <UnavailableNote>Аукционы появятся, когда сервер начнёт их отдавать.</UnavailableNote> : auctions.state === "error" ? <ErrorState message={getUserFacingError(auctions.error)} onRetry={auctions.refresh} /> : auctions.data.length === 0 ? <EmptyState title="Пусто" description={current?.empty ?? ""} /> : (
        <div className="auction-grid">{auctions.data.map((lot, index) => <AuctionCard key={String(lot.id ?? lot.image_id ?? index)} auction={lot} currency={user.currency} />)}</div>
      )}
    </main>
  );
}
