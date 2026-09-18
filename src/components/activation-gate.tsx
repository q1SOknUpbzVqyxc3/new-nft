import { LogOut, MailCheck, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/auth-context";
import { api } from "@/lib/api/services";
import { getUserFacingError } from "@/lib/api/errors";
import { Button } from "./ui/button";

export function ActivationGate() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [pending, setPending] = useState<"resend" | "refresh" | "logout" | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  async function resend() {
    setPending("resend"); setFeedback(null);
    try { await api.resendEmail(); setFeedback({ type: "success", message: "Письмо отправлено повторно." }); }
    catch (error) { setFeedback({ type: "error", message: getUserFacingError(error) }); }
    finally { setPending(null); }
  }

  async function refresh() {
    setPending("refresh"); setFeedback(null);
    try { await auth.refreshSession(); }
    catch (error) { setFeedback({ type: "error", message: getUserFacingError(error) }); }
    finally { setPending(null); }
  }

  async function logout() {
    setPending("logout");
    await auth.logout();
    await navigate("/", { replace: true });
  }

  return <main className="activation-page"><section className="activation-card"><span className="activation-card__icon"><MailCheck /></span><span className="eyebrow">Email verification</span><h1>Подтвердите электронную почту</h1><p>Мы отправили ссылку для активации на адрес вашего аккаунта. После подтверждения вернитесь сюда и обновите статус.</p>{feedback ? <div className={feedback.type === "success" ? "inline-alert inline-alert--success" : "inline-alert"} role="status">{feedback.message}</div> : null}<div className="activation-actions"><Button size="large" disabled={pending !== null} onClick={() => void refresh()}><RefreshCw size={17} />{pending === "refresh" ? "Проверяем…" : "Я подтвердил почту"}</Button><Button variant="secondary" disabled={pending !== null} onClick={() => void resend()}>{pending === "resend" ? "Отправляем…" : "Отправить письмо снова"}</Button><Button variant="ghost" disabled={pending !== null} onClick={() => void logout()}><LogOut size={17} /> Выйти</Button></div></section></main>;
}
