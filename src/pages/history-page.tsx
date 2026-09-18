import { useSearchParams } from "react-router-dom";
import { useAuthenticatedUser } from "@/auth/auth-context";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/page-state";
import { api } from "@/lib/api/services";
import { getUserFacingError } from "@/lib/api/errors";
import { useApiResource } from "@/lib/hooks/use-api-resource";
import { formatDateTime, formatMoney } from "@/lib/formatters";

export function HistoryPage() {
  const { user } = useAuthenticatedUser();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "nft" ? "nft" : "finance";
  const finance = useApiResource("finance-history", (signal) => api.getFinanceHistory(signal));
  const nfts = useApiResource("nft-history", (signal) => api.getNftHistory(signal));
  const active = tab === "finance" ? finance : nfts;

  return <main className="container page"><header className="page-header"><div><span className="eyebrow">Activity</span><h1>История операций</h1><p>Финансовые операции и действия с NFT</p></div></header><div className="tabs" role="tablist"><button role="tab" aria-selected={tab === "finance"} className={tab === "finance" ? "active" : ""} onClick={() => setParams({ tab: "finance" }, { replace: true })}>Финансы</button><button role="tab" aria-selected={tab === "nft"} className={tab === "nft" ? "active" : ""} onClick={() => setParams({ tab: "nft" }, { replace: true })}>NFT</button></div>{active.status === "loading" ? <LoadingState /> : active.status === "error" ? <ErrorState message={getUserFacingError(active.error)} onRetry={active.refresh} /> : tab === "finance" ? finance.status === "success" && finance.data.length ? <div className="data-table" role="table"><div className="data-table__head" role="row"><span>Операция</span><span>Метод</span><span>Дата</span><span>Сумма</span></div>{finance.data.map((item, index) => <div className="data-table__row" role="row" key={String(item.id ?? index)}><span data-label="Операция">{item.type === 0 ? "Пополнение" : "Вывод"}<small>Статус: {item.status}</small></span><span data-label="Метод">#{item.method}</span><span data-label="Дата">{formatDateTime(item.created)}</span><strong data-label="Сумма">{formatMoney(item.amount, item.currency)}</strong></div>)}</div> : <EmptyState title="История пуста" description="Финансовые операции появятся здесь." /> : nfts.status === "success" && nfts.data.length ? <div className="data-table" role="table"><div className="data-table__head" role="row"><span>Коллекция</span><span>Token ID</span><span>Дата</span><span>Цена</span></div>{nfts.data.map((item, index) => <div className="data-table__row" role="row" key={String(item.id ?? index)}><span data-label="Коллекция">{item.collection_name}<small>Статус: {item.status}</small></span><span data-label="Token ID">#{item.pic_id}</span><span data-label="Дата">{item.sale_date ? formatDateTime(item.sale_date) : "—"}</span><strong data-label="Цена">{formatMoney(item.sale_price, user.currency)}</strong></div>)}</div> : <EmptyState title="История пуста" description="Операции с NFT появятся здесь." />}</main>;
}
