import { BadgeCheck, Camera, KeyRound, Laptop, Settings, Trophy, UserRound } from "lucide-react";
import { type ChangeEvent, type FormEvent, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuthenticatedUser } from "@/auth/auth-context";
import { AccountStatus } from "@/components/account-status";
import { AchievementsPanel } from "@/components/achievements-panel";
import { DeviceSessionsCard } from "@/components/device-sessions-card";
import { LevelCard } from "@/components/level-card";
import { SupportLink } from "@/components/support-link";
import { Button } from "@/components/ui/button";
import { SafeMedia } from "@/components/ui/safe-media";
import { TextField } from "@/components/ui/text-field";
import { TwoFactorCard } from "@/components/two-factor-card";
import { resolveAvatarUrl } from "@/lib/api/client";
import { getUserFacingError } from "@/lib/api/errors";
import { api } from "@/lib/api/services";
import { getFormString } from "@/lib/form-data";
import { formatDateTime, formatMoney } from "@/lib/formatters";
import { setLanguage as persistLanguage, type SiteLanguage, SITE_LANGUAGES, useLanguage } from "@/lib/language";
import { validateEmail, validatePassword } from "@/lib/validation";

type Section = "general" | "security" | "devices" | "achievements" | "settings";
type Feedback = { type: "success" | "error"; message: string };

export function ProfilePage({ section = "general" }: { section?: Section }) {
  const { user, refreshUser } = useAuthenticatedUser();
  const language = useLanguage();
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  async function runUpdate(update: () => Promise<unknown>, successMessage = "Изменения сохранены.") {
    if (pending) return;
    setPending(true); setFeedback(null);
    try {
      await update();
      await refreshUser();
      setFeedback({ type: "success", message: successMessage });
    } catch (error) {
      setFeedback({ type: "error", message: getUserFacingError(error) });
    } finally {
      setPending(false);
    }
  }

  async function submitUsername(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const username = getFormString(data, "username").trim();
    if (username.length < 3 || username.length > 20) {
      setFeedback({ type: "error", message: "Имя пользователя должно содержать от 3 до 20 символов." });
      return;
    }
    if (username === (user.username ?? "")) {
      setFeedback({ type: "error", message: "Укажите новое имя пользователя." });
      return;
    }
    await runUpdate(() => api.setUsername(username));
  }

  async function submitEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = getFormString(new FormData(event.currentTarget), "email").trim();
    const emailError = validateEmail(email);
    if (emailError || email === user.email) {
      setFeedback({ type: "error", message: emailError || "Укажите новый email." });
      return;
    }
    await runUpdate(() => api.changeEmail(email));
  }

  async function submitSecurity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const oldPassword = getFormString(data, "oldPassword");
    const password = getFormString(data, "password");
    const repeatPassword = getFormString(data, "repeatPassword");
    const passwordError = validatePassword(password);
    if (!oldPassword || passwordError || password !== repeatPassword) {
      setFeedback({ type: "error", message: passwordError || (password !== repeatPassword ? "Новые пароли не совпадают." : "Укажите текущий пароль.") });
      return;
    }
    await runUpdate(() => api.changePassword(password, oldPassword), "Пароль обновлён.");
    form.reset();
  }

  async function submitSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const nextLanguage = getFormString(data, "language", language);
    await runUpdate(async () => {
      await api.setLanguage(nextLanguage);
      if (getFormString(data, "currency", user.currency) !== user.currency) await api.setCurrency(getFormString(data, "currency", user.currency));
      if (nextLanguage !== language) persistLanguage(nextLanguage as SiteLanguage);
    });
  }

  async function uploadAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!new Set(["image/jpeg", "image/png", "image/webp"]).has(file.type)) {
      setFeedback({ type: "error", message: "Используйте JPEG, PNG или WebP." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFeedback({ type: "error", message: "Размер изображения не должен превышать 5 МБ." });
      return;
    }
    await runUpdate(() => api.setAvatar(file), "Аватар обновлён.");
    event.target.value = "";
  }

  return (
    <main className="container page">
      <header className="page-header"><div><span className="eyebrow">Settings</span><h1>Настройки</h1><p>{user.email} · аккаунт с {formatDateTime(user.created)}</p></div></header>
      <div className="profile-layout">
        <aside className="profile-nav"><NavLink end to="/client/profile"><UserRound /> Профиль</NavLink><NavLink to="/client/profile/security"><KeyRound /> Безопасность</NavLink><NavLink to="/client/profile/devices"><Laptop /> Устройства</NavLink><NavLink to="/client/profile/achievements"><Trophy /> Достижения</NavLink><NavLink to="/client/profile/settings"><Settings /> Предпочтения</NavLink></aside>
        <section className="surface profile-panel">
          {section === "general" ? <>
            <AccountStatus user={user} />
            {!user.can_withdraw || user.is_banned || !user.active ? <p className="profile-muted">Часть операций временно недоступна. <SupportLink /></p> : null}
            <div className="profile-identity"><div className="profile-avatar">{user.avatar ? <SafeMedia src={resolveAvatarUrl(user.id, user.avatar)} alt="Аватар пользователя" credentials /> : <UserRound />}<label className="profile-avatar__action"><Camera /><span className="sr-only">Загрузить новый аватар</span><input type="file" accept="image/jpeg,image/png,image/webp" disabled={pending} onChange={(event) => void uploadAvatar(event)} /></label></div><div><h2>{user.username || user.email.split("@")[0]}</h2>{user.verificated ? <span className="verified-label"><BadgeCheck /> Проверенный аккаунт</span> : <span className="profile-muted">ID {String(user.id)}</span>}</div></div>
            <div className="account-metrics"><div><span>Баланс</span><strong>{formatMoney(user.balance, user.currency)}</strong></div><div><span>Оборот</span><strong>{formatMoney(user.turnover, user.currency)}</strong></div></div>
            <LevelCard user={user} />
            <form className="form-stack profile-form" onSubmit={(event) => void submitUsername(event)}><TextField label="Имя пользователя" name="username" defaultValue={user.username ?? ""} minLength={3} maxLength={20} disabled={pending} required /><Button type="submit" disabled={pending}>{pending ? "Сохраняем…" : "Изменить имя"}</Button></form>
            <form className="form-stack profile-form" onSubmit={(event) => void submitEmail(event)}><TextField label="Email" name="email" type="email" defaultValue={user.email} disabled={pending} required /><Button type="submit" disabled={pending}>{pending ? "Сохраняем…" : "Изменить email"}</Button></form>
          </> : section === "security" ? <>
            <h2>Смена пароля</h2><p className="profile-muted">Новый пароль: 6–20 символов, заглавная и строчная буквы, цифра и специальный символ.</p>
            <form className="form-stack" onSubmit={(event) => void submitSecurity(event)}><TextField label="Текущий пароль" name="oldPassword" type="password" autoComplete="current-password" disabled={pending} required /><TextField label="Новый пароль" name="password" type="password" autoComplete="new-password" disabled={pending} required /><TextField label="Повторите новый пароль" name="repeatPassword" type="password" autoComplete="new-password" disabled={pending} required /><Button type="submit" disabled={pending}>{pending ? "Обновляем…" : "Обновить пароль"}</Button></form>
            <TwoFactorCard />
          </> : section === "devices" ? <DeviceSessionsCard /> : section === "achievements" ? <AchievementsPanel /> : <>
            <h2>Язык и валюта</h2>
            <form className="form-stack" onSubmit={(event) => void submitSettings(event)}><label className="field"><span className="field__label">Язык</span><select className="select" name="language" key={language} defaultValue={language} disabled={pending}>{SITE_LANGUAGES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label><label className="field"><span className="field__label">Валюта</span><select className="select" name="currency" defaultValue={user.currency} disabled={pending}>{["RUB", "UAH", "KZT", "BYN", "USD", "EUR"].map((value) => <option key={value}>{value}</option>)}</select></label><Button type="submit" disabled={pending}>{pending ? "Сохраняем…" : "Сохранить настройки"}</Button></form>
          </>}
          {feedback ? <div className={feedback.type === "error" ? "inline-alert" : "inline-alert inline-alert--success"} role="status">{feedback.message}</div> : null}
        </section>
      </div>
    </main>
  );
}
