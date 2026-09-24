import { useId, useMemo, useState } from "react";
import { formatDateTime } from "@/lib/formatters";

export type ChartPoint = { t: number; v: number };

const WIDTH = 640;
const HEIGHT = 200;
const PAD_X = 8;
const PAD_Y = 16;

/** Line/area chart with min/max labels and a hover read-out. `format` renders a value; the caller owns currency. */
export function ValueChart({ points, format, label, height = 200 }: { points: ChartPoint[]; format: (value: number) => string; label: string; height?: number }) {
  const gradientId = useId();
  const [hover, setHover] = useState<number | null>(null);

  const chart = useMemo(() => {
    const series = points.length === 1 && points[0] ? [{ t: points[0].t - 86_400_000, v: points[0].v }, ...points] : points;
    if (series.length < 2) return null;
    const values = series.map((point) => point.v);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const first = series[0]?.t ?? 0;
    const timeSpan = (series[series.length - 1]?.t ?? 1) - first || 1;
    const x = (t: number) => PAD_X + ((t - first) / timeSpan) * (WIDTH - PAD_X * 2);
    const y = (v: number) => HEIGHT - PAD_Y - ((v - min) / span) * (HEIGHT - PAD_Y * 2);
    const coords = series.map((point) => ({ ...point, x: x(point.t), y: y(point.v) }));
    const line = coords.map((c, index) => `${index === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
    const last = coords[coords.length - 1];
    const firstCoord = coords[0];
    return { coords, line, area: last && firstCoord ? `${line} L${last.x.toFixed(1)},${HEIGHT - PAD_Y} L${firstCoord.x.toFixed(1)},${HEIGHT - PAD_Y} Z` : "", min, max };
  }, [points]);

  if (!chart) return <p className="profile-muted">Недостаточно данных для графика.</p>;
  const active = hover === null ? chart.coords[chart.coords.length - 1] : chart.coords[hover];

  function onMove(event: React.PointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    if (!chart || rect.width === 0) return;
    const ratio = (event.clientX - rect.left) / rect.width;
    let nearest = 0;
    let best = Infinity;
    chart.coords.forEach((c, index) => { const distance = Math.abs(c.x / WIDTH - ratio); if (distance < best) { best = distance; nearest = index; } });
    setHover(nearest);
  }

  return (
    <figure className="value-chart">
      <div className="value-chart__readout"><strong>{active ? format(active.v) : ""}</strong><span>{active ? formatDateTime(active.t) : ""}</span></div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" role="img" aria-label={label} style={{ height }} onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
        <defs><linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="currentColor" stopOpacity="0.22" /><stop offset="1" stopColor="currentColor" stopOpacity="0" /></linearGradient></defs>
        <path d={chart.area} fill={`url(#${gradientId})`} />
        <path d={chart.line} className="value-chart__line" fill="none" />
        {active ? <line x1={active.x} x2={active.x} y1={PAD_Y / 2} y2={HEIGHT - PAD_Y / 2} className="value-chart__cursor" /> : null}
      </svg>
      <div className="value-chart__range"><span>мин. {format(chart.min)}</span><span>макс. {format(chart.max)}</span></div>
    </figure>
  );
}
