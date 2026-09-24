import { ArrowDownToLine, ArrowUpFromLine, ArrowRight } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuthenticatedUser } from "@/auth/auth-context";
import { ActivityFeed } from "@/components/activity-feed";
import { AuctionCard } from "@/components/auction-card";
import { NftNews } from "@/components/nft-news";
import { buildMethodLabels } from "@/components/finance-table";
import { CollectionCard } from "@/components/collection-card";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/page-state";
import { SafeMedia } from "@/components/ui/safe-media";
import { getUserFacingError } from "@/lib/api/errors";
import { api } from "@/lib/api/services";
import { currencyToRub, rubToCurrency } from "@/lib/currency";
import { getFinanceStatusLabel, getFinanceStatusTone, getFinanceTypeLabel, isExpiredPending, pendingWithdrawalTotal } from "@/lib/finance";
import { formatDateTime, formatMoney } from "@/lib/formatters";
import { useApiResource } from "@/lib/hooks/use-api-resource";
import { useOptionalResource } from "@/lib/hooks/use-optional-resource";
import { calculateLevel } from "@/lib/levels";
import { isNftNewsEnabled } from "@/lib/news";

function Section({ title, to, linkLabel, children }: { title: string; to?: string; linkLabel?: string; children: React.ReactNode }) {
  return (
    <section className="dash-section">
      <div className="dash-section__head"><h2>{title}</h2>{to ? <Link to={to} className="dash-section__link">{linkLabel ?? "Все"} <ArrowRight size={15} aria-hidden="true" /></Link> : null}</div>
      {children}
    </section>
  );
}

export function DashboardPage() {
  const { user } = useAuthenticatedUser();
  const owned = useApiResource("dashboard-owned", (signal) => api.getOwnedNfts(signal));
  const history = useApiResource("dashboard-finance", (signal) => api.getFinanceHistory(signal));
  const collections = useApiResource("dashboard-collections", (signal) => api.getCollections(signal));
  const deposit = useApiResource("dashboard-deposit-methods", (signal) => api.getPaymentMethods(signal));
  const withdraw = useApiResource("dashboard-withdraw-methods", (signal) => api.getWithdrawMethods(signal));
  const auctions = useOptionalResource("dashboard-auctions", (signal) => api.getAuctions("active", { limit: 4 }, signal));
  const level = useMemo(() => calculateLevel(currencyToRub(user.turnover, user.currency)), [user.turnover, user.currency]);
  const methodLabels = useMemo(() => buildMethodLabels(deposit.data, withdraw.data), [deposit.data, withdraw.data]);
  const pending = history.status === "success" ? pendingWithdrawalTotal(history.data, user.currency) : null;
  const listed = owned.status === "success" ? owned.data.filter((item) => item.status).length : null;
  const recentOwned = owned.status === "success" ? owned.data.slice(0, 5) : [];
  const recentOps = history.status === "success" ? [...history.data].sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()).slice(0, 5) : [];
  const displayLevel = user.level !== undefined ? Math.max(1, Math.round(user.level)) : level.level;

  return (
    <main className="container page dashboard">
      <header className="page-header"><div><span className="eyebrow">Overview</span><h1>Обзор</h1><p>Баланс, портфель и последние операции</p></div></header>

      <div className="kpi-row">
        <div className="kpi-card kpi-card--balance">
          <span>Баланс</span>
          <strong>{formatMoney(user.balance, user.currency)}</strong>
          <div className="kpi-card__actions">
            <Link to="/client/finance?tab=topup" className="button button--primary button--small"><ArrowDownToLine size={15} aria-hidden="true" /> Пополнить</Link>
            <Link to="/client/finance?tab=withdraw" className="button button--secondary button--small"><ArrowUpFromLine size={15} aria-hidden="true" /> Вывести</Link>
          </div>
        </div>
        <div className="kpi-card"><span>Вывод в обработке</span><strong>{pending === null ? "—" : formatMoney(pending, user.currency)}</strong></div>
        <div className="kpi-card"><span>NFT в портфеле</span><strong>{owned.status === "success" ? owned.data.length : "—"}</strong>{listed !== null ? <small>{listed} на продаже</small> : null}</div>
        <div className="kpi-card">
          <span>Уровень</span><strong>{displayLevel}</strong>
          <div className="progress" role="progressbar" aria-label="Прогресс до следующего уровня" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(level.progress * 100)}><div className="progress__fill" style={{ width: `${Math.round(level.progress * 100)}%` }} /></div>
          <small>{level.isMax ? "Максимальный уровень" : `До следующего: ${formatMoney(rubToCurrency(level.remaining, user.currency), user.currency)}`}</small>
        </div>
      </div>

      <div className="dash-grid">
        <Section title="Мои NFT" to="/client/owns">
          {owned.status === "loading" ? <LoadingState label="Загружаем портфель" /> : owned.status === "error" ? <ErrorState message={getUserFacingError(owned.error)} onRetry={owned.refresh} /> : recentOwned.length ? (
            <ul className="dash-list">
              {recentOwned.map((item) => (
                <li key={String(item.id)}>
                  <Link to={`/client/collectible/${item.pic.id}`} className="dash-list__row">
                    <SafeMedia src={item.pic.image} alt="" />
                    <span className="dash-list__main"><strong>{item.pic.collection.name} #{item.pic.number}</strong><small>{item.status ? `На продаже · ${formatMoney(item.sale_price, user.currency)}` : "В портфеле"}</small></span>
                    <span className="dash-list__value">{formatMoney(item.pic.price, user.currency)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : <EmptyState title="Портфель пуст" description="Купленные NFT появятся здесь." />}
        </Section>

        <Section title="Последние операции" to="/client/finance?tab=history">
          {history.status === "loading" ? <LoadingState label="Загружаем операции" /> : history.status === "error" ? <ErrorState message={getUserFacingError(history.error)} onRetry={history.refresh} /> : recentOps.length ? (
            <ul className="dash-list">
              {recentOps.map((item, index) => {
                const expired = isExpiredPending(item);
                return (
                  <li className="dash-list__row dash-list__row--static" key={String(item.id ?? index)}>
                    <span className="dash-list__main"><strong>{getFinanceTypeLabel(item.type)}</strong><small>{methodLabels.get(item.method) ?? "—"} · {formatDateTime(item.created)}</small></span>
                    <span className={`status-pill status-pill--${getFinanceStatusTone(item.status, expired)}`}>{getFinanceStatusLabel(item.status, expired)}</span>
                    <span className="dash-list__value">{item.type === 1 ? "−" : "+"}{formatMoney(Math.abs(item.amount), item.currency || user.currency)}</span>
                  </li>
                );
              })}
            </ul>
          ) : <EmptyState title="Операций пока нет" description="Пополнения и выводы появятся здесь." />}
        </Section>
      </div>

      {auctions.state === "ready" && auctions.data.length > 0 ? <Section title="Аукционы" to="/client/auctions" linkLabel="Все аукционы"><div className="auction-grid">{auctions.data.slice(0, 4).map((lot, index) => <AuctionCard key={String(lot.id ?? lot.image_id ?? index)} auction={lot} currency={user.currency} />)}</div></Section> : null}

      <Section title="Популярные коллекции" to="/client/main" linkLabel="Маркет">
        {collections.status === "loading" ? <LoadingState label="Загружаем коллекции" /> : collections.status === "error" ? <ErrorState message={getUserFacingError(collections.error)} onRetry={collections.refresh} /> : collections.data.length ? (
          <div className="collection-grid">{collections.data.slice(0, 4).map((collection) => <CollectionCard key={String(collection.id)} collection={collection} size="grid" />)}</div>
        ) : <EmptyState title="Коллекций пока нет" description="Новые коллекции появятся после публикации." />}
      </Section>

      {isNftNewsEnabled() ? <Section title="Новости NFT"><div className="surface news-card"><NftNews lang={user.lang === "ru" || user.lang === "bl" || !user.lang ? "ru" : "en"} /></div></Section> : null}

      <ActivityFeed alwaysVisible lang={user.lang ?? "ru"} currency={user.currency} />
    </main>
  );
}
