import { useMemo, useState } from "react";
import type { OwnedNft } from "@/lib/api/schemas";
import { api } from "@/lib/api/services";
import { formatMoney } from "@/lib/formatters";
import { useOptionalResource } from "@/lib/hooks/use-optional-resource";
import { derivePortfolio, PORTFOLIO_PERIODS, type PortfolioPeriod, seriesToPoints } from "@/lib/market";
import { StatGrid } from "./stat-grid";
import { UnavailableNote } from "./unavailable-note";
import { ValueChart } from "./value-chart";

function Pnl({ value, currency }: { value: number | undefined; currency: string }) {
  if (value === undefined) return <>—</>;
  return <span className={value > 0 ? "pnl pnl--up" : value < 0 ? "pnl pnl--down" : "pnl"}>{value > 0 ? "+" : value < 0 ? "−" : ""}{formatMoney(Math.abs(value), currency)}</span>;
}

/** Portfolio value, holdings, P&L, spend/receipts, best/worst performer and the value-over-time chart. */
export function PortfolioAnalytics({ owned, currency }: { owned: OwnedNft[]; currency: string }) {
  const [period, setPeriod] = useState<PortfolioPeriod>("30D");
  const stats = useOptionalResource("portfolio", (signal) => api.getPortfolio(signal));
  const history = useOptionalResource(`portfolio-history:${period}`, (signal) => api.getPortfolioHistory(period, signal));
  const derived = useMemo(() => derivePortfolio(owned), [owned]);
  const server = stats.state === "ready" ? stats.data : null;
  const best = server?.best ?? derived.best;
  const worst = server?.worst ?? derived.worst;
  const money = (value: number | undefined) => value === undefined ? undefined : formatMoney(value, currency);
  const points = history.state === "ready" ? seriesToPoints(history.data) : [];

  return (
    <section className="portfolio-analytics" aria-label="Аналитика портфеля">
      <StatGrid items={[
        { label: "Оценка портфеля", value: money(server?.value ?? derived.value), hint: "Оценка по текущим ценам" },
        { label: "NFT в портфеле", value: server?.count ?? derived.count },
        { label: "Нереализ. прибыль", value: <Pnl value={server?.unrealized_pnl ?? derived.unrealized} currency={currency} />, hint: "Нереализованная прибыль или убыток" },
        { label: "Реализ. прибыль", value: <Pnl value={server?.realized_pnl} currency={currency} />, hint: "Зафиксированная прибыль или убыток" },
        { label: "Потрачено", value: money(server?.total_spent) },
        { label: "Получено", value: money(server?.total_received) },
        { label: "Лучший актив", value: best ? <span className="performer">{best.name} <Pnl value={best.pnl} currency={currency} /></span> : undefined },
        { label: "Худший актив", value: worst ? <span className="performer">{worst.name} <Pnl value={worst.pnl} currency={currency} /></span> : undefined }
      ]} />
      {stats.state === "unavailable" ? <UnavailableNote>Реализованная прибыль, потраченные и полученные суммы появятся, когда сервер начнёт считать их по проданным NFT. Стоимость, число NFT и нереализованная прибыль посчитаны по вашему портфелю (цена покупки есть в списке NFT).</UnavailableNote> : null}
      <div className="surface portfolio-chart">
        <div className="portfolio-chart__head">
          <h2>Стоимость портфеля</h2>
          <div className="chip-row" role="group" aria-label="Период">{PORTFOLIO_PERIODS.map((item) => <button key={item} type="button" className={period === item ? "chip chip--active" : "chip"} onClick={() => setPeriod(item)}>{item}</button>)}</div>
        </div>
        {history.state === "unavailable" ? <UnavailableNote>График стоимости портфеля появится, когда сервер начнёт хранить историю.</UnavailableNote> : history.state === "error" ? <p className="profile-muted">Не удалось загрузить график.</p> : history.state === "loading" ? <p className="profile-muted">Загружаем…</p> : <ValueChart points={points} format={(value) => formatMoney(value, currency)} label={`Стоимость портфеля, ${period}`} />}
      </div>
    </section>
  );
}
