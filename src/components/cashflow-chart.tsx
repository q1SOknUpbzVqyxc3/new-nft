import { useMemo } from "react";
import type { CashflowPoint } from "@/lib/finance";
import { formatMoney } from "@/lib/formatters";

const WIDTH = 640;
const HEIGHT = 180;
const PADDING = 12;

export function CashflowChart({ points, currency }: { points: CashflowPoint[]; currency: string }) {
  const chart = useMemo(() => {
    // A single point still needs a line: pad it into a flat two-point series.
    const series = points.length >= 2 ? points : points.length === 1 ? [{ t: (points[0]?.t ?? 0) - 86_400_000, v: points[0]?.v ?? 0 }, ...points] : [];
    if (series.length < 2) return null;
    const values = series.map((point) => point.v);
    const min = Math.min(...values, 0);
    const max = Math.max(...values, 0);
    const span = max - min || 1;
    const first = series[0]?.t ?? 0;
    const last = series[series.length - 1]?.t ?? 1;
    const timeSpan = last - first || 1;
    const x = (t: number) => PADDING + ((t - first) / timeSpan) * (WIDTH - PADDING * 2);
    const y = (v: number) => HEIGHT - PADDING - ((v - min) / span) * (HEIGHT - PADDING * 2);
    const line = series.map((point, index) => `${index === 0 ? "M" : "L"}${x(point.t).toFixed(1)},${y(point.v).toFixed(1)}`).join(" ");
    return { line, zeroY: y(0), latest: series[series.length - 1]?.v ?? 0 };
  }, [points]);

  if (!chart) return <p className="profile-muted">Пока нет подтверждённых операций за выбранный период.</p>;

  return (
    <figure className="cashflow-chart">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={`Динамика баланса пополнений и выводов, сейчас ${formatMoney(chart.latest, currency)}`} preserveAspectRatio="none">
        <line x1={PADDING} x2={WIDTH - PADDING} y1={chart.zeroY} y2={chart.zeroY} className="cashflow-chart__zero" />
        <path d={chart.line} className="cashflow-chart__line" fill="none" />
      </svg>
    </figure>
  );
}
