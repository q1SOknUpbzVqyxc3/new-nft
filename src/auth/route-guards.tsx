import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { ErrorState, LoadingState } from "@/components/ui/page-state";
import { getUserFacingError } from "@/lib/api/errors";
import { DEFAULT_CLIENT_ROUTE } from "@/lib/navigation";
import { useAuth } from "./auth-context";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const location = useLocation();

  if (auth.status === "unknown") {
    return <main className="container page">{auth.error ? <ErrorState message={getUserFacingError(auth.error)} onRetry={() => void auth.refreshSession().catch(() => undefined)} /> : <LoadingState label="Восстанавливаем сессию" />}</main>;
  }

  if (auth.status === "unauthenticated") {
    const from = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to="/auth/login" replace state={{ from }} />;
  }

  return children;
}

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const auth = useAuth();

  if (auth.status === "unknown") {
    return <main className="container page">{auth.error ? <ErrorState message={getUserFacingError(auth.error)} onRetry={() => void auth.refreshSession().catch(() => undefined)} /> : <LoadingState label="Проверяем сессию" />}</main>;
  }

  if (auth.status === "authenticated") return <Navigate to={DEFAULT_CLIENT_ROUTE} replace />;
  return children;
}
