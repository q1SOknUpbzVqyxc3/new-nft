import { ArrowDownToLine, ArrowUpFromLine, CheckCircle2, ExternalLink } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { useAuthenticatedUser } from "@/auth/auth-context";
import { NoticeModal } from "@/components/notice-modal";
import { PaymentDetails } from "@/components/payment-details";
import { SupportBanner } from "@/components/support-banner";
import { SupportLink } from "@/components/support-link";
import { Button } from "@/components/ui/button";
import { ErrorState, LoadingState } from "@/components/ui/page-state";
import { TextField } from "@/components/ui/text-field";
import { getUserFacingError } from "@/lib/api/errors";
import { resolveApiMediaUrl } from "@/lib/api/client";
import type { PaymentMethod, PaymentSession } from "@/lib/api/schemas";
import { api } from "@/lib/api/services";
import { CoinBadge, matchCoin } from "@/lib/coin-icons";
import { getFormString } from "@/lib/form-data";
import { getLargeDepositThreshold, isCardOrSbpMethod, isSbpMethod, sanitizeMinimum } from "@/lib/finance";
import { largeDepositNotice, type Notice, notices } from "@/lib/notices";
import { formatMoney } from "@/lib/formatters";
import { useApiResource } from "@/lib/hooks/use-api-resource";
import { SBP_BANKS } from "@/lib/sbp-banks";

function MethodChipIcon({ method }: { method: PaymentMethod }) {
  if (matchCoin(method.label)) return <CoinBadge label={method.label} />;
  if (method.icon) return <img src={resolveApiMediaUrl(method.icon)} alt="" className="method-chip-icon" />;
  return <span className="method-chip-icon method-chip-icon-fallback">{(method.label || "?")[0]}</span>;
}

function MethodPicker({ methods, value, onChange, disabled }: { methods: PaymentMethod[]; value: number | null; onChange: (id: number) => void; disabled: boolean }) {
  return (
    <div className="field">
      <span className="field__label">Способ</span>
      <div className="method-picker" role="radiogroup" aria-label="Способ">
        {methods.map((method) => (
          <button key={method.api_id} type="button" role="radio" aria-checked={value === method.api_id} className={value === method.api_id ? "method-chip active" : "method-chip"} disabled={disabled} onClick={() => onChange(method.api_id)}>
            <MethodChipIcon method={method} />
            {method.label}{method.network ? ` · ${method.network}` : ""}
          </button>
        ))}
      </div>
    </div>
  );
}

type WithdrawIntent = { amount: number; method: number; details: string; bank?: string };

function getSafePaymentUrl(session: PaymentSession) {
  const candidate = session.action_url ?? session.pay_url ?? session.url;
  if (!candidate) return null;
  try {
    const url = new URL(candidate);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function PaymentsPage({ mode, embedded = false }: { mode: "topup" | "withdraw"; embedded?: boolean }) {
  const { user, refreshUser } = useAuthenticatedUser();
  const methods = useApiResource(`${mode}-methods`, (signal) => mode === "topup" ? api.getPaymentMethods(signal) : api.getWithdrawMethods(signal));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<PaymentSession | null>(null);
  const [withdrawCreated, setWithdrawCreated] = useState(false);
  const [withdrawIntent, setWithdrawIntent] = useState<WithdrawIntent | null>(null);
  const [withdrawSyncWarning, setWithdrawSyncWarning] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [selectedMethodId, setSelectedMethodId] = useState<number | null>(null);
  const selectedMethod = useMemo(() => methods.status === "success" ? methods.data.find((method) => method.api_id === selectedMethodId) : undefined, [methods, selectedMethodId]);
  const withdrawBlocked = mode === "withdraw" && !user.can_withdraw;
  const minimumAmount = mode === "topup" ? Math.max(sanitizeMinimum(user.minimal_deposit), sanitizeMinimum(selectedMethod?.min_dep)) : sanitizeMinimum(selectedMethod?.min_dep);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    if (withdrawBlocked) return;
    setPending(true); setError(""); setWithdrawCreated(false); setWithdrawSyncWarning(false);
    const form = event.currentTarget;
    const data = new FormData(form);
    const amount = Number(data.get("amount"));
    const method = selectedMethodId;
    if (!Number.isFinite(amount) || amount <= 0 || amount < minimumAmount || method === null) {
      setError(minimumAmount ? `Минимальная сумма — ${formatMoney(minimumAmount, user.currency)}.` : "Проверьте сумму и способ операции.");
      setPending(false);
      return;
    }
    const isSbp = selectedMethod !== undefined && isSbpMethod(selectedMethod.label);
    if (mode === "withdraw" && isSbp && !getFormString(data, "bank")) {
      setError("Выберите банк для вывода через СБП.");
      setPending(false);
      return;
    }
    try {
      if (mode === "topup") {
        const session = await api.createPayment(amount, method);
        const threshold = getLargeDepositThreshold(user.currency);
        if (threshold !== null && amount > threshold && selectedMethod && isCardOrSbpMethod(selectedMethod.label)) {
          setResult(null);
          setNotice(largeDepositNotice(formatMoney(threshold, user.currency)));
        } else setResult(session);
      } else setWithdrawIntent({ amount, method, details: getFormString(data, "details"), bank: getFormString(data, "bank") || undefined });
    } catch (requestError) {
      setError(getUserFacingError(requestError));
    } finally {
      setPending(false);
    }
  }

  async function confirmWithdraw() {
    if (!withdrawIntent || pending) return;
    setPending(true); setError("");
    try {
      await api.createWithdraw(withdrawIntent.amount, withdrawIntent.method, withdrawIntent.details, withdrawIntent.bank);
    } catch (requestError) {
      setPending(false);
      if (requestError instanceof ApiError && requestError.code === "u_cant_withdraw") {
        setWithdrawIntent(null);
        setNotice(notices.withdrawBlocked);
      } else setError(getUserFacingError(requestError));
      return;
    }

    setWithdrawCreated(true);
    setWithdrawIntent(null);
    setWithdrawSyncWarning(false);
    try {
      const fresh = await refreshUser();
      if (fresh && fresh.aml_verified === false) setNotice(notices.aml);
    } catch {
      setWithdrawSyncWarning(true);
    } finally {
      setPending(false);
    }
  }

  const Shell = embedded ? "div" : "main";
  const shellClass = embedded ? "finance-embedded" : "container page";
  if (methods.status === "loading") return <Shell className={shellClass}><LoadingState label="Загружаем способы" /></Shell>;
  if (methods.status === "error") return <Shell className={shellClass}><ErrorState message={getUserFacingError(methods.error)} onRetry={methods.refresh} /></Shell>;

  const paymentUrl = result ? getSafePaymentUrl(result) : null;
  return (
    <Shell className={shellClass}>
      {embedded ? null : <header className="page-header"><div><span className="eyebrow">Finance</span><h1>{mode === "topup" ? "Пополнение" : "Вывод средств"}</h1><p>{mode === "topup" ? "Выберите доступный способ и сумму пополнения" : "Создайте запрос на вывод на ваши реквизиты"}</p></div></header>}
      <div className="finance-layout">
        <form className="surface finance-form" onSubmit={(event) => void submit(event)}>
          <MethodPicker methods={methods.data} value={selectedMethodId} onChange={setSelectedMethodId} disabled={pending} />
          <TextField label="Сумма" name="amount" type="number" min={minimumAmount || 0.01} step="0.01" hint={minimumAmount ? `Минимум ${formatMoney(minimumAmount, user.currency)}` : undefined} disabled={pending} required />
          {mode === "withdraw" ? <>
            <TextField label="Реквизиты" name="details" disabled={pending} />
            {selectedMethod && isSbpMethod(selectedMethod.label) ? (
              <label className="field"><span className="field__label">Банк</span><select className="select" name="bank" disabled={pending} required defaultValue=""><option value="" disabled>Выберите банк</option>{SBP_BANKS.map((bank) => <option key={bank} value={bank}>{bank}</option>)}</select></label>
            ) : null}
          </> : null}
          {withdrawBlocked ? <div className="inline-alert" role="alert">Вывод средств временно недоступен для вашего аккаунта. <SupportLink /></div> : null}
          {error ? <div className="inline-alert" role="alert">{error}</div> : null}
          {withdrawCreated ? <div className="inline-alert inline-alert--success"><CheckCircle2 size={17} /> Запрос на вывод создан.</div> : null}
          {withdrawCreated && withdrawSyncWarning ? <div className="inline-alert inline-alert--warning">Не удалось обновить данные аккаунта. Обновите страницу.</div> : null}
          <Button type="submit" size="large" disabled={pending || methods.data.length === 0 || withdrawBlocked}>{mode === "topup" ? <ArrowDownToLine size={18} /> : <ArrowUpFromLine size={18} />}{pending ? "Отправляем…" : mode === "topup" ? "Продолжить" : "Создать запрос"}</Button>
        </form>
        {result ? <section className="surface payment-result"><span className="eyebrow">Платёж создан</span><h2>Платёж #{String(result.id)}</h2><PaymentDetails session={result} currency={user.currency} />{paymentUrl ? <a className="button button--primary" href={paymentUrl} target="_blank" rel="noreferrer">Открыть оплату <ExternalLink size={16} /></a> : null}<SupportBanner title="Оплатили, но баланс не изменился?" description="Средства зачисляются после подтверждения платежа. Если этого не произошло, напишите в поддержку и укажите номер платежа." /></section> : null}
        {withdrawIntent ? <section className="surface payment-result transaction-confirmation"><span className="eyebrow">Confirmation</span><h2>Подтвердите вывод</h2><div className="detail-row"><span>Сумма</span><strong>{formatMoney(withdrawIntent.amount, user.currency)}</strong></div><div className="detail-row"><span>Способ</span><strong>{methods.data.find((method) => method.api_id === withdrawIntent.method)?.label ?? `#${withdrawIntent.method}`}</strong></div><div className="detail-row"><span>Реквизиты</span><strong className="break-value">{withdrawIntent.details}</strong></div>{withdrawIntent.bank ? <div className="detail-row"><span>Банк</span><strong>{withdrawIntent.bank}</strong></div> : null}<div><Button disabled={pending} onClick={() => void confirmWithdraw()}>{pending ? "Создаём запрос…" : "Подтвердить вывод"}</Button><Button variant="ghost" disabled={pending} onClick={() => setWithdrawIntent(null)}>Отмена</Button></div></section> : null}
      </div>
      {notice ? <NoticeModal notice={notice} onClose={() => setNotice(null)} /> : null}
    </Shell>
  );
}
