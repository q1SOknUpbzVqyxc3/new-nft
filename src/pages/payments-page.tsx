import { ArrowDownToLine, ArrowUpFromLine, CheckCircle2, ExternalLink, RefreshCw } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useAuthenticatedUser } from "@/auth/auth-context";
import { Button } from "@/components/ui/button";
import { ErrorState, LoadingState } from "@/components/ui/page-state";
import { TextField } from "@/components/ui/text-field";
import { getUserFacingError } from "@/lib/api/errors";
import type { PaymentSession } from "@/lib/api/schemas";
import { api } from "@/lib/api/services";
import { getFormString } from "@/lib/form-data";
import { formatMoney } from "@/lib/formatters";
import { useApiResource } from "@/lib/hooks/use-api-resource";

type PaymentStatus = "idle" | "waiting" | "confirmed" | "expired" | "check-error";
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

export function PaymentsPage({ mode }: { mode: "topup" | "withdraw" }) {
  const { user, refreshUser } = useAuthenticatedUser();
  const methods = useApiResource(`${mode}-methods`, (signal) => mode === "topup" ? api.getPaymentMethods(signal) : api.getWithdrawMethods(signal));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<PaymentSession | null>(null);
  const [withdrawCreated, setWithdrawCreated] = useState(false);
  const [withdrawIntent, setWithdrawIntent] = useState<WithdrawIntent | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("idle");
  const [balanceSyncWarning, setBalanceSyncWarning] = useState(false);
  const [withdrawSyncWarning, setWithdrawSyncWarning] = useState(false);
  const [selectedMethodId, setSelectedMethodId] = useState<number | null>(null);
  const selectedMethod = useMemo(() => methods.status === "success" ? methods.data.find((method) => method.api_id === selectedMethodId) : undefined, [methods, selectedMethodId]);
  const withdrawBlocked = mode === "withdraw" && !user.can_withdraw;
  const minimumAmount = mode === "topup" ? Math.max(user.minimal_deposit, selectedMethod?.min_dep ?? 0) : (selectedMethod?.min_dep ?? 0);

  useEffect(() => {
    if (mode !== "topup" || !result || paymentStatus !== "waiting") return;
    let stopped = false;
    let attempts = 0;
    let timer: number | undefined;

    const check = async () => {
      attempts += 1;
      try {
        const confirmed = await api.checkPayment(String(result.id));
        if (stopped) return;
        if (confirmed) {
          setPaymentStatus("confirmed");
          try {
            await refreshUser();
            if (!stopped) setBalanceSyncWarning(false);
          } catch {
            if (!stopped) setBalanceSyncWarning(true);
          }
          return;
        }
        if (attempts >= 120) {
          setPaymentStatus("expired");
          return;
        }
        timer = window.setTimeout(() => void check(), 5_000);
      } catch {
        if (!stopped) {
          setPaymentStatus("check-error");
        }
      }
    };

    timer = window.setTimeout(() => void check(), 5_000);
    return () => { stopped = true; if (timer !== undefined) window.clearTimeout(timer); };
  }, [mode, result, paymentStatus, refreshUser]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    if (withdrawBlocked) return;
    setPending(true); setError(""); setWithdrawCreated(false); setWithdrawSyncWarning(false);
    const form = event.currentTarget;
    const data = new FormData(form);
    const amount = Number(data.get("amount"));
    const method = Number(data.get("method"));
    if (!Number.isFinite(amount) || amount <= 0 || amount < minimumAmount || !Number.isInteger(method)) {
      setError(minimumAmount ? `Минимальная сумма — ${formatMoney(minimumAmount, user.currency)}.` : "Проверьте сумму и способ операции.");
      setPending(false);
      return;
    }
    try {
      if (mode === "topup") {
        const session = await api.createPayment(amount, method);
        setResult(session);
        setPaymentStatus("waiting");
        setBalanceSyncWarning(false);
      } else setWithdrawIntent({ amount, method, details: getFormString(data, "details"), bank: getFormString(data, "bank") || undefined });
    } catch (requestError) {
      setError(getUserFacingError(requestError));
    } finally {
      setPending(false);
    }
  }

  function retryStatusCheck() {
    if (!result) return;
    setPaymentStatus("waiting");
  }

  async function confirmWithdraw() {
    if (!withdrawIntent || pending) return;
    setPending(true); setError("");
    try {
      await api.createWithdraw(withdrawIntent.amount, withdrawIntent.method, withdrawIntent.details, withdrawIntent.bank);
    } catch (requestError) {
      setPending(false);
      setError(getUserFacingError(requestError));
      return;
    }

    setWithdrawCreated(true);
    setWithdrawIntent(null);
    setWithdrawSyncWarning(false);
    try {
      await refreshUser();
    } catch {
      setWithdrawSyncWarning(true);
    } finally {
      setPending(false);
    }
  }

  if (methods.status === "loading") return <main className="container page"><LoadingState label="Загружаем способы" /></main>;
  if (methods.status === "error") return <main className="container page"><ErrorState message={getUserFacingError(methods.error)} onRetry={methods.refresh} /></main>;

  const paymentUrl = result ? getSafePaymentUrl(result) : null;
  return (
    <main className="container page">
      <header className="page-header"><div><span className="eyebrow">Finance</span><h1>{mode === "topup" ? "Пополнение" : "Вывод средств"}</h1><p>{mode === "topup" ? "Выберите доступный способ и сумму пополнения" : "Создайте запрос на вывод на ваши реквизиты"}</p></div></header>
      <div className="finance-layout">
        <form className="surface finance-form" onSubmit={(event) => void submit(event)}>
          <label className="field"><span className="field__label">Способ</span><select className="select" name="method" required defaultValue="" disabled={pending} onChange={(event) => setSelectedMethodId(Number(event.target.value))}><option value="" disabled>Выберите способ</option>{methods.data.map((method) => <option key={method.api_id} value={method.api_id}>{method.label}{method.network ? ` · ${method.network}` : ""}</option>)}</select></label>
          <TextField label="Сумма" name="amount" type="number" min={minimumAmount || 0.01} step="0.01" hint={minimumAmount ? `Минимум ${formatMoney(minimumAmount, user.currency)}` : undefined} disabled={pending} required />
          {mode === "withdraw" ? <><TextField label="Реквизиты" name="details" disabled={pending} /><TextField label="Банк (если требуется)" name="bank" disabled={pending} /></> : null}
          {withdrawBlocked ? <div className="inline-alert" role="alert">Вывод средств временно недоступен для вашего аккаунта.</div> : null}
          {error ? <div className="inline-alert" role="alert">{error}</div> : null}
          {withdrawCreated ? <div className="inline-alert inline-alert--success"><CheckCircle2 size={17} /> Запрос на вывод создан.</div> : null}
          {withdrawCreated && withdrawSyncWarning ? <div className="inline-alert inline-alert--warning">Не удалось обновить данные аккаунта. Обновите страницу.</div> : null}
          <Button type="submit" size="large" disabled={pending || methods.data.length === 0 || withdrawBlocked}>{mode === "topup" ? <ArrowDownToLine size={18} /> : <ArrowUpFromLine size={18} />}{pending ? "Отправляем…" : mode === "topup" ? "Продолжить" : "Создать запрос"}</Button>
        </form>
        {result ? <section className="surface payment-result"><span className="eyebrow">Payment created</span><h2>Платёж #{String(result.id)}</h2>{result.min_dep ? <p>Минимальная сумма: {formatMoney(result.min_dep, user.currency)}</p> : null}{Object.entries(result.details ?? {}).map(([key, value]) => <div className="detail-row" key={key}><span>{key}</span><strong>{String(value ?? "—")}</strong></div>)}{result.wallet ? <div className="detail-row"><span>Кошелёк</span><strong className="break-value">{result.wallet}</strong></div> : null}{paymentUrl ? <a className="button button--primary" href={paymentUrl} target="_blank" rel="noreferrer">Открыть оплату <ExternalLink size={16} /></a> : null}<div className={`payment-status payment-status--${paymentStatus}`} role="status">{paymentStatus === "waiting" ? <><span className="spinner" /> Ожидаем подтверждение платежа</> : paymentStatus === "confirmed" ? (balanceSyncWarning ? <><CheckCircle2 /><span>Платёж подтверждён, но не удалось обновить баланс. Обновите страницу.</span><Button variant="secondary" size="small" onClick={() => void refreshUser().then(() => setBalanceSyncWarning(false)).catch(() => undefined)}><RefreshCw size={15} /> Обновить баланс</Button></> : <><CheckCircle2 /> Платёж подтверждён. Баланс обновлён.</>) : paymentStatus === "expired" ? "Время ожидания истекло. Проверьте историю операций." : paymentStatus === "check-error" ? <><span>Не удалось проверить статус.</span><Button variant="secondary" size="small" onClick={retryStatusCheck}><RefreshCw size={15} /> Проверить снова</Button></> : null}</div></section> : null}
        {withdrawIntent ? <section className="surface payment-result transaction-confirmation"><span className="eyebrow">Confirmation</span><h2>Подтвердите вывод</h2><div className="detail-row"><span>Сумма</span><strong>{formatMoney(withdrawIntent.amount, user.currency)}</strong></div><div className="detail-row"><span>Способ</span><strong>{methods.data.find((method) => method.api_id === withdrawIntent.method)?.label ?? `#${withdrawIntent.method}`}</strong></div><div className="detail-row"><span>Реквизиты</span><strong className="break-value">{withdrawIntent.details}</strong></div>{withdrawIntent.bank ? <div className="detail-row"><span>Банк</span><strong>{withdrawIntent.bank}</strong></div> : null}<div><Button disabled={pending} onClick={() => void confirmWithdraw()}>{pending ? "Создаём запрос…" : "Подтвердить вывод"}</Button><Button variant="ghost" disabled={pending} onClick={() => setWithdrawIntent(null)}>Отмена</Button></div></section> : null}
      </div>
    </main>
  );
}
