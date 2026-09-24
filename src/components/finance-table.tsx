import { useMemo } from "react";
import type { FinanceHistory, PaymentMethod } from "@/lib/api/schemas";
import { getFinanceStatusLabel, getFinanceStatusTone, getFinanceTypeLabel, isExpiredPending } from "@/lib/finance";
import { formatDateTime, formatMoney } from "@/lib/formatters";
import { maskDetails } from "@/lib/mask-details";

export function buildMethodLabels(...lists: Array<PaymentMethod[] | null | undefined>) {
  const labels = new Map<number, string>();
  for (const list of lists) for (const method of list ?? []) if (!labels.has(method.api_id)) labels.set(method.api_id, method.label);
  return labels;
}

/** Transaction history: date, type, method, masked details, signed amount and status. Collapses into cards on phones. */
export function FinanceTable({ rows, defaultCurrency, methodLabels }: { rows: FinanceHistory[]; defaultCurrency: string; methodLabels?: Map<number, string> }) {
  const sorted = useMemo(() => [...rows].sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()), [rows]);
  return (
    <div className="tx-table-wrap">
      <table className="tx-table">
        <thead><tr><th>Дата</th><th>Тип</th><th>Способ</th><th>Реквизиты</th><th>Сумма</th><th>Статус</th></tr></thead>
        <tbody>
          {sorted.map((item, index) => {
            const expired = isExpiredPending(item);
            const method = methodLabels?.get(item.method) ?? "—";
            const details = item.details ? maskDetails(item.details, method) : "—";
            const outgoing = item.type === 1;
            return (
              <tr key={String(item.id ?? index)}>
                <td data-label="Дата">{formatDateTime(item.created)}</td>
                <td data-label="Тип">{getFinanceTypeLabel(item.type)}</td>
                <td data-label="Способ">{method}</td>
                <td data-label="Реквизиты" className="tx-table__details">{item.bank ? <><span className="tx-table__bank">{item.bank}</span>{details}</> : details}</td>
                <td data-label="Сумма" className={outgoing ? "tx-table__amount tx-table__amount--out" : "tx-table__amount tx-table__amount--in"}>{outgoing ? "−" : "+"}{formatMoney(Math.abs(item.amount), item.currency || defaultCurrency)}</td>
                <td data-label="Статус"><span className={`status-pill status-pill--${getFinanceStatusTone(item.status, expired)}`}>{getFinanceStatusLabel(item.status, expired)}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
