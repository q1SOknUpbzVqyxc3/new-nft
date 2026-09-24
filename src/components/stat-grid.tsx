import type { ReactNode } from "react";

export type StatItem = { label: string; value: ReactNode | undefined | null; hint?: string };

/** Label/value tiles; a missing value renders as an em dash so a partial backend never leaves holes. */
export function StatGrid({ items, className = "" }: { items: StatItem[]; className?: string }) {
  return (
    <dl className={`stat-grid ${className}`.trim()}>
      {items.map((item) => (
        <div key={item.label} title={item.hint}>
          <dt>{item.label}</dt>
          <dd>{item.value === undefined || item.value === null || item.value === "" ? "—" : item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
