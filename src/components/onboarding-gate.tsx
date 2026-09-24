import { type FormEvent, useState } from "react";
import { useAuthenticatedUser } from "@/auth/auth-context";
import { getUserFacingError } from "@/lib/api/errors";
import { api } from "@/lib/api/services";
import { getFormString } from "@/lib/form-data";
import { Button } from "./ui/button";
import { TextField } from "./ui/text-field";

const SKIP_KEY = "onboarding_skipped";

function readSkipped(userId: string) {
  try { return window.localStorage.getItem(`${SKIP_KEY}:${userId}`) === "1"; } catch { return false; }
}

/** First-run prompt to pick a username; shown once for active accounts that have none, and can be skipped. */
export function OnboardingGate() {
  const { user, refreshUser } = useAuthenticatedUser();
  const userId = String(user.id);
  const [skipped, setSkipped] = useState(() => readSkipped(userId));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  if (user.username || skipped) return null;

  function skip() {
    try { window.localStorage.setItem(`${SKIP_KEY}:${userId}`, "1"); } catch { /* prompt may show again next session */ }
    setSkipped(true);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const username = getFormString(new FormData(event.currentTarget), "username").trim();
    if (username.length < 3 || username.length > 20) { setError("Имя пользователя должно содержать от 3 до 20 символов."); return; }
    setPending(true); setError("");
    try {
      await api.setUsername(username);
      await refreshUser();
    } catch (requestError) {
      setError(getUserFacingError(requestError));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <form className="modal-card form-stack" onSubmit={(event) => void submit(event)}>
        <span className="eyebrow">Добро пожаловать</span>
        <h2 id="onboarding-title">Выберите имя пользователя</h2>
        <p className="profile-muted">Так вас будут видеть в профиле. Имя можно изменить позже.</p>
        <TextField label="Имя пользователя" name="username" minLength={3} maxLength={20} autoComplete="username" error={error || undefined} disabled={pending} required />
        <Button type="submit" disabled={pending}>{pending ? "Сохраняем…" : "Продолжить"}</Button>
        <Button type="button" variant="ghost" disabled={pending} onClick={skip}>Пропустить</Button>
      </form>
    </div>
  );
}
