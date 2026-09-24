import { ArrowDownToLine, ArrowUpFromLine, LifeBuoy, Snowflake } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuthenticatedUser } from "@/auth/auth-context";
import { CashflowChart } from "@/components/cashflow-chart";
import { buildMethodLabels, FinanceTable } from "@/components/finance-table";
import { Modal } from "@/components/modal";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/page-state";
import { getUserFacingError } from "@/lib/api/errors";
import { api } from "@/lib/api/services";
import { buildCashflowSeries, pendingWithdrawalTotal, summarizeFlow } from "@/lib/finance";
import { formatMoney } from "@/lib/formatters";
import { useApiResource } from "@/lib/hooks/use-api-resource";
import { getSupportUrl } from "@/lib/support";
import { PaymentsPage } from "./payments-page";

type Period = "30" | "90" | "all";
type Flow = "topup" | "withdraw";

const periods: Array<{ id: Period; label: string; days: number | null }> = [
  { id: "30", label: "30 дней", days: 30 },
  { id: "90", label: "90 дней", days: 90 },
  { id: "all", label: "Всё время", days: null }
];

/** Older links use ?tab=topup|withdraw and newer ones ?open=…; both open the matching modal. */
function readFlow(params: URLSearchParams): Flow | null {
  const value = params.get("open") ?? params.get("tab");
  return value === "topup" || value === "withdraw" ? value : null;
}

export function FinancePage() {
  const { user } = useAuthenticatedUser();
  const [params, setParams] = useSearchParams();
  const flow = readFlow(params);
  const [period, setPeriod] = useState<Period>("30");
  const history = useApiResource("finance-history", (signal) => api.getFinanceHistory(signal));
  const owned = useApiResource("finance-owned", (signal) => api.getOwnedNfts(signal));
  const depositMethods = useApiResource("finance-deposit-methods", (signal) => api.getPaymentMethods(signal));
  const withdrawMethods = useApiResource("finance-withdraw-methods", (signal) => api.getWithdrawMethods(signal));
  const methodLabels = useMemo(() => buildMethodLabels(depositMethods.data, withdrawMethods.data), [depositMethods.data, withdrawMethods.data]);
  const rows = history.status === "success" ? history.data : null;
  const days = periods.find((item) => item.id === period)?.days ?? null;
  const supportUrl = getSupportUrl();

  const summary = useMemo(() => rows ? {
    pending: pendingWithdrawalTotal(rows, user.currency),
    flow: summarizeFlow(rows, user.currency, days),
    series: buildCashflowSeries(rows, user.currency, days)
  } : null, [rows, user.currency, days]);

  function openFlow(next: Flow) { setParams({ open: next }, { replace: true }); }
  function closeFlow() { setParams({}, { replace: true }); history.refresh(); }

  return (
    <main className="container page finance-screen">
      <header className="page-header"><div><span className="eyebrow">Finance</span><h1>Финансы</h1><p>Баланс, пополнения, выводы и история операций</p></div></header>

      <div className="kpi-row">
        <div className="kpi-card kpi-card--balance">
          <span>Доступный баланс {!user.can_withdraw ? <span className="restricted-hint" title="Вывод средств ограничен. Обратитесь в поддержку."><Snowflake size={14} aria-label="Вывод ограничен" /></span> : null}</span>
          <strong>{formatMoney(user.balance, user.currency)}</strong>
          <div className="kpi-card__actions">
            <button type="button" className="button button--primary button--small" onClick={() => openFlow("topup")}><ArrowDownToLine size={15} aria-hidden="true" /> Пополнить</button>
            <button type="button" className="button button--secondary button--small" onClick={() => openFlow("withdraw")}><ArrowUpFromLine size={15} aria-hidden="true" /> Вывести</button>
          </div>
        </div>
        <div className="kpi-card">
          <span>Вывод в обработке</span>
          <strong>{summary ? formatMoney(summary.pending, user.currency) : "—"}</strong>
          {summary && summary.pending > 0 && supportUrl ? <div className="kpi-card__actions"><a className="button button--secondary button--small" href={supportUrl} target="_blank" rel="noopener noreferrer"><LifeBuoy size={15} aria-hidden="true" /> Написать в поддержку</a></div> : null}
        </div>
        <div className="kpi-card">
          <span>NFT в портфеле</span>
          <strong>{owned.status === "success" ? owned.data.length : "—"}</strong>
          <div className="kpi-card__actions"><Link to="/client/owns" className="button button--secondary button--small">Показать</Link></div>
        </div>
        <div className="kpi-card"><span>Оборот</span><strong>{formatMoney(user.turnover, user.currency)}</strong></div>
      </div>

      <section className="surface finance-dynamics" aria-label="Динамика">
        <div className="finance-dynamics__head">
          <h2>Динамика операций</h2>
          <div className="chip-row" role="group" aria-label="Период">{periods.map((item) => <button key={item.id} type="button" className={period === item.id ? "chip chip--active" : "chip"} onClick={() => setPeriod(item.id)}>{item.label}</button>)}</div>
        </div>
        <div className="finance-dynamics__totals">
          <div><span>Выведено</span><strong>{summary ? formatMoney(summary.flow.withdrawals, user.currency) : "…"}</strong></div>
          <div><span>Пополнено</span><strong>{summary ? formatMoney(summary.flow.deposits, user.currency) : "…"}</strong></div>
        </div>
        {summary ? <CashflowChart points={summary.series.points} currency={user.currency} /> : null}
        {summary && summary.flow.skipped > 0 ? <p className="profile-muted">Операции в других валютах ({summary.flow.skipped}) не учтены: курсов валют бэкенд не предоставляет.</p> : null}
      </section>

      <section className="surface finance-history" aria-label="История операций">
        <h2>История операций</h2>
        {history.status === "loading" ? <LoadingState label="Загружаем историю" /> : history.status === "error" ? <ErrorState message={getUserFacingError(history.error)} onRetry={history.refresh} /> : history.data.length === 0 ? <EmptyState title="Операций пока нет" description="Пополнения и выводы появятся здесь." /> : <FinanceTable rows={history.data} defaultCurrency={user.currency} methodLabels={methodLabels} />}
      </section>

      {flow ? (
        <Modal title={flow === "topup" ? "Пополнение баланса" : "Вывод средств"} onClose={closeFlow} wide>
          <PaymentsPage key={flow} mode={flow} embedded />
        </Modal>
      ) : null}
    </main>
  );
}
