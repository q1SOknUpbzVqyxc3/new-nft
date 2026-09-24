import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { TwoFactorRequiredError, useAuth } from "@/auth/auth-context";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { legalLinks } from "@/lib/legal";
import { DEFAULT_CLIENT_ROUTE } from "@/lib/navigation";
import { getBrandName } from "@/lib/brand";
import { api } from "@/lib/api/services";
import { getUserFacingError } from "@/lib/api/errors";
import { getFormString } from "@/lib/form-data";
import { type FieldErrors, validateEmail, validateInvite, validatePassword } from "@/lib/validation";

type AuthMode = "login" | "signup" | "reset";

const content = {
  login: { title: "С возвращением", subtitle: "Войдите, чтобы продолжить работу с активами", submit: "Войти" },
  signup: { title: "Создать аккаунт", subtitle: "Получите доступ к коллекциям", submit: "Зарегистрироваться" },
  reset: { title: "Новый пароль", subtitle: "Укажите email и новый пароль для аккаунта", submit: "Обновить пароль" }
} satisfies Record<AuthMode, { title: string; subtitle: string; submit: string }>;

export function AuthPage({ mode }: { mode: AuthMode }) {
  const auth = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [success, setSuccess] = useState(false);
  const [twoFactor, setTwoFactor] = useState<{ preAuthToken: string; remember: boolean } | null>(null);

  function getReturnPath() {
    const routeState: unknown = location.state as unknown;
    if (!routeState || typeof routeState !== "object" || !("from" in routeState)) return DEFAULT_CLIENT_ROUTE;
    const from = routeState.from;
    return typeof from === "string" && from.startsWith("/") && !from.startsWith("//") ? from : DEFAULT_CLIENT_ROUTE;
  }

  async function handleTwoFactorSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !twoFactor) return;
    const code = getFormString(new FormData(event.currentTarget), "code").trim();
    if (!code) { setFormError("Введите код подтверждения."); return; }
    setPending(true); setFormError("");
    try {
      await auth.loginWithTwoFactor(twoFactor.preAuthToken, code, twoFactor.remember);
      await navigate(getReturnPath(), { replace: true });
    } catch (requestError) {
      setFormError(getUserFacingError(requestError));
    } finally {
      setPending(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = new FormData(event.currentTarget);
    const email = getFormString(form, "email").trim();
    const password = getFormString(form, "password");
    const repeatPassword = getFormString(form, "repeatPassword");
    const nextErrors: FieldErrors = {};
    const emailError = validateEmail(email);
    if (emailError) nextErrors.email = emailError;
    if (mode !== "login") {
      const passwordError = validatePassword(password);
      if (passwordError) nextErrors.password = passwordError;
      if (!repeatPassword) nextErrors.repeatPassword = "Повторите пароль.";
      else if (password !== repeatPassword) nextErrors.repeatPassword = "Пароли не совпадают.";
    } else if (!password) nextErrors.password = "Укажите пароль.";
    if (mode === "signup") {
      const invite = getFormString(form, "invite", window.localStorage.getItem("invite_code") ?? "").trim();
      if (invite) {
        const inviteError = validateInvite(invite);
        if (inviteError) nextErrors.invite = inviteError;
      }
      if (form.get("agreement") !== "on") nextErrors.agreement = "Необходимо принять пользовательское соглашение.";
    }
    setFieldErrors(nextErrors);
    setFormError("");
    if (Object.keys(nextErrors).length) return;
    setPending(true);

    try {
      if (mode === "login") {
        const remember = form.get("remember") === "on";
        try {
          await auth.login({ email, password, remember });
        } catch (loginError) {
          if (loginError instanceof TwoFactorRequiredError) {
            setTwoFactor({ preAuthToken: loginError.preAuthToken, remember });
            return;
          }
          throw loginError;
        }
        await navigate(getReturnPath(), { replace: true });
      } else if (mode === "signup") {
        const storedInvite = window.localStorage.getItem("invite_code") ?? "";
        const invite = getFormString(form, "invite", storedInvite).trim() || "0";
        await auth.signup({ email, password, inviteCode: invite, language: "ru", newsletter: form.get("newsletter") === "on" });
        await navigate(DEFAULT_CLIENT_ROUTE, { replace: true });
      } else {
        await api.resetPassword(email, password);
        setSuccess(true);
      }
    } catch (requestError) {
      setFormError(getUserFacingError(requestError));
    } finally {
      setPending(false);
    }
  }

  if (success) {
    return <main className="auth-layout"><section className="auth-card"><CheckCircle2 className="auth-card__success" /><h1>Пароль обновлён</h1><p>Теперь можно войти с новым паролем.</p><Link to="/auth/login" className="button button--primary">Перейти ко входу</Link></section></main>;
  }

  if (twoFactor) {
    return <main className="auth-layout"><section className="auth-card"><div className="auth-card__top"><Brand to="/" /></div><div><span className="eyebrow">Two-factor</span><h1>Подтвердите вход</h1><p>Введите код из приложения-аутентификатора.</p></div><form className="form-stack" noValidate onSubmit={(event) => void handleTwoFactorSubmit(event)}><TextField label="Код подтверждения" name="code" inputMode="numeric" autoComplete="one-time-code" placeholder="6 цифр" disabled={pending} required />{formError ? <div className="inline-alert" role="alert">{formError}</div> : null}<Button type="submit" size="large" disabled={pending}>{pending ? "Проверяем…" : "Подтвердить"}</Button><Button type="button" variant="ghost" disabled={pending} onClick={() => { setTwoFactor(null); setFormError(""); }}>Назад</Button></form></section></main>;
  }

  return (
    <main className="auth-layout">
      <section className="auth-card">
        <div className="auth-card__top"><Brand to="/" /><Link to="/" className="button button--ghost button--small"><ArrowLeft size={16} /> Назад</Link></div>
        <div><span className="eyebrow">Secure access</span><h1>{content[mode].title}</h1><p>{content[mode].subtitle}</p></div>
        <form className="form-stack" noValidate onSubmit={(event) => void handleSubmit(event)}>
          <TextField label="Email" name="email" type="email" autoComplete="email" error={fieldErrors.email} disabled={pending} required />
          <TextField label={mode === "reset" ? "Новый пароль" : "Пароль"} name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} error={fieldErrors.password} disabled={pending} required />
          {mode !== "login" ? <TextField label="Повторите пароль" name="repeatPassword" type="password" autoComplete="new-password" error={fieldErrors.repeatPassword} disabled={pending} required /> : null}
          {mode === "signup" ? <TextField label="Код приглашения (необязательно)" name="invite" inputMode="numeric" defaultValue={window.localStorage.getItem("invite_code") ?? ""} error={fieldErrors.invite} disabled={pending} /> : null}
          {mode === "login" ? <label className="check-row"><input name="remember" type="checkbox" disabled={pending} /> <span>Запомнить меня</span></label> : null}
          {mode === "signup" ? <><label className="check-row"><input name="agreement" type="checkbox" disabled={pending} /> <span>Принимаю {legalLinks.terms() ? <a href={legalLinks.terms() ?? undefined} target="_blank" rel="noreferrer">пользовательское соглашение</a> : "пользовательское соглашение"}</span></label>{fieldErrors.agreement ? <span className="field__message field__message--error">{fieldErrors.agreement}</span> : null}<label className="check-row"><input name="newsletter" type="checkbox" disabled={pending} /> <span>Получать новости продукта</span></label></> : null}
          {formError ? <div className="inline-alert" role="alert">{formError}</div> : null}
          <Button type="submit" size="large" disabled={pending}>{pending ? "Отправляем…" : content[mode].submit}</Button>
        </form>
        <div className="auth-card__links">
          {mode !== "login" ? <Link to="/auth/login">Уже есть аккаунт</Link> : <><Link to="/auth/signup">Создать аккаунт</Link><Link to="/auth/reset-password">Забыли пароль?</Link></>}
        </div>
      </section>
      <aside className="auth-art" aria-hidden="true"><div><span>{getBrandName().toUpperCase()}</span><strong>Digital ownership.<br />Clear by design.</strong></div></aside>
    </main>
  );
}
