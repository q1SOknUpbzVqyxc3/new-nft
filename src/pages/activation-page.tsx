import { CheckCircle2, MailWarning } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/auth/auth-context";
import { ErrorState, LoadingState } from "@/components/ui/page-state";
import { api } from "@/lib/api/services";
import { getUserFacingError } from "@/lib/api/errors";
import { useApiResource } from "@/lib/hooks/use-api-resource";

export function ActivationPage() {
  const [params] = useSearchParams();
  const key = params.get("key")?.trim() ?? "";
  const auth = useAuth();
  const activation = useApiResource(key ? `activation:${key}` : null, (signal) => api.checkActivationKey(key, signal));

  if (!key) return <main className="centered-page"><MailWarning /><h1>Ссылка неполная</h1><p>В ссылке отсутствует ключ активации.</p><Link className="button button--primary" to="/auth/login">Перейти ко входу</Link></main>;
  if (activation.status === "loading") return <main className="container page"><LoadingState label="Подтверждаем email" /></main>;
  if (activation.status === "error") return <main className="container page"><ErrorState message={getUserFacingError(activation.error)} onRetry={activation.refresh} /></main>;

  return <main className="centered-page"><CheckCircle2 className="auth-card__success" /><h1>Email подтверждён</h1><p>Аккаунт активирован. Можно продолжить работу.</p><Link className="button button--primary" to={auth.status === "authenticated" ? "/client/main" : "/auth/login"} onClick={() => void auth.refreshSession().catch(() => undefined)}>Продолжить</Link></main>;
}
