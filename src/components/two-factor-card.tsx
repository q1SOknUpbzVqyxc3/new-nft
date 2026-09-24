import QRCode from "qrcode";
import { type FormEvent, useEffect, useState } from "react";
import { useAuthenticatedUser } from "@/auth/auth-context";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { isEndpointUnavailable } from "@/lib/api/client";
import { getUserFacingError } from "@/lib/api/errors";
import { api } from "@/lib/api/services";
import { getFormString } from "@/lib/form-data";
import { hasTwoFactor, writeTwoFactorFlag } from "@/lib/two-factor";
import { ConfirmModal } from "./notice-modal";
import { UnavailableNote } from "./unavailable-note";

type Step = "idle" | "setup";

export function TwoFactorCard() {
  const { user, refreshUser } = useAuthenticatedUser();
  // Until the backend exposes `has_2fa` on /api/user, the last known state is remembered locally as a UI hint only.
  const [enabled, setEnabled] = useState(() => hasTwoFactor(user));
  const [step, setStep] = useState<Step>("idle");
  const [secret, setSecret] = useState("");
  const [qr, setQr] = useState("");
  const [pending, setPending] = useState(false);
  const [confirmingDisable, setConfirmingDisable] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (user.has_2fa !== undefined) setEnabled(user.has_2fa);
  }, [user.has_2fa]);

  useEffect(() => {
    if (!qr.startsWith("otpauth:")) return;
    let cancelled = false;
    QRCode.toDataURL(qr, { width: 220, margin: 1 }).then((url) => { if (!cancelled) setQr(url); }, () => { if (!cancelled) setQr(""); });
    return () => { cancelled = true; };
  }, [qr]);

  function fail(error: unknown) {
    if (isEndpointUnavailable(error)) setUnavailable(true);
    else setFeedback({ type: "error", message: getUserFacingError(error) });
  }

  async function startSetup() {
    setPending(true); setFeedback(null);
    try {
      const result = await api.setupTwoFactor();
      setSecret(result.secret);
      setQr(result.url);
      setStep("setup");
    } catch (error) { fail(error); } finally { setPending(false); }
  }

  async function enable(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = getFormString(new FormData(event.currentTarget), "code").trim();
    if (!code) { setFeedback({ type: "error", message: "Введите код из приложения." }); return; }
    setPending(true); setFeedback(null);
    try {
      await api.enableTwoFactor(code);
      writeTwoFactorFlag(user.id, true);
      setEnabled(true); setStep("idle"); setSecret(""); setQr("");
      setFeedback({ type: "success", message: "Двухфакторная защита включена." });
      await refreshUser().catch(() => undefined);
    } catch (error) { fail(error); } finally { setPending(false); }
  }

  async function disable() {
    setPending(true); setFeedback(null);
    try {
      await api.disableTwoFactor();
      setConfirmingDisable(false);
      writeTwoFactorFlag(user.id, false);
      setEnabled(false);
      setFeedback({ type: "success", message: "Двухфакторная защита отключена." });
      await refreshUser().catch(() => undefined);
    } catch (error) { fail(error); } finally { setPending(false); setConfirmingDisable(false); }
  }

  if (unavailable) return <UnavailableNote>Двухфакторная защита скоро появится — сервер пока не поддерживает эту функцию.</UnavailableNote>;

  return (
    <div className="two-factor">
      <h2>Двухфакторная защита</h2>
      {step === "idle" ? (
        <>
          <p className="profile-muted">{enabled ? "Включена: при входе потребуется код из приложения-аутентификатора." : "Добавьте одноразовые коды из приложения-аутентификатора для входа в аккаунт."}</p>
          {enabled ? <Button variant="danger" disabled={pending} onClick={() => setConfirmingDisable(true)}>Отключить</Button> : <Button disabled={pending} onClick={() => void startSetup()}>{pending ? "Готовим…" : "Включить"}</Button>}
        </>
      ) : (
        <form className="form-stack" onSubmit={(event) => void enable(event)}>
          <p className="profile-muted">Отсканируйте QR-код в приложении-аутентификаторе или введите ключ вручную, затем подтвердите кодом.</p>
          {qr.startsWith("data:") ? <img className="two-factor__qr" src={qr} alt="QR-код для приложения-аутентификатора" width={220} height={220} /> : null}
          {secret ? <code className="break-value">{secret}</code> : null}
          <TextField label="Код подтверждения" name="code" inputMode="numeric" autoComplete="one-time-code" placeholder="6 цифр" disabled={pending} required />
          <div className="activation-actions"><Button type="submit" disabled={pending}>{pending ? "Проверяем…" : "Подтвердить"}</Button><Button type="button" variant="ghost" disabled={pending} onClick={() => { setStep("idle"); setSecret(""); setQr(""); }}>Отмена</Button></div>
        </form>
      )}
      {confirmingDisable ? <ConfirmModal danger title="Отключить двухфакторную защиту?" description="Это снизит безопасность аккаунта: для входа будет достаточно одного пароля." confirmLabel="Отключить" pending={pending} onConfirm={() => void disable()} onCancel={() => setConfirmingDisable(false)} /> : null}
      {feedback ? <div className={feedback.type === "error" ? "inline-alert" : "inline-alert inline-alert--success"} role="status">{feedback.message}</div> : null}
    </div>
  );
}
