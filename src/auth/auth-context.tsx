import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ApiError, AUTH_INVALID_EVENT } from "@/lib/api/client";
import type { User } from "@/lib/api/schemas";
import { api } from "@/lib/api/services";

type AuthState =
  | { status: "unknown"; user: null; error: unknown }
  | { status: "unauthenticated"; user: null; error: null }
  | { status: "authenticated"; user: User; error: null };

type LoginInput = { email: string; password: string; remember: boolean };
type SignupInput = { email: string; password: string; inviteCode: string; language: string; newsletter: boolean };

type AuthContextValue = AuthState & {
  login: (input: LoginInput) => Promise<User>;
  signup: (input: SignupInput) => Promise<User>;
  loginWithTwoFactor: (preAuthToken: string, code: string, remember: boolean) => Promise<User>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<User | null>;
};

/** Thrown by `login` when the account has 2FA enabled; the caller then collects a code and calls `loginWithTwoFactor`. */
export class TwoFactorRequiredError extends Error {
  readonly preAuthToken: string;

  constructor(preAuthToken: string) {
    super("two_factor_required");
    this.name = "TwoFactorRequiredError";
    this.preAuthToken = preAuthToken;
  }
}

function extractPreAuthToken(result: unknown) {
  if (!result || typeof result !== "object") return null;
  const record = result as Record<string, unknown>;
  const token = record["pre_auth_token"] ?? record["preAuthToken"];
  return typeof token === "string" && token ? token : null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function isUnauthenticatedError(error: unknown) {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "unknown", user: null, error: null });

  const restoreSession = useCallback(async (signal?: AbortSignal) => {
    try {
      const user = await api.getUser(signal);
      setState({ status: "authenticated", user, error: null });
      return user;
    } catch (error) {
      if (signal?.aborted) return null;
      if (isUnauthenticatedError(error)) {
        setState({ status: "unauthenticated", user: null, error: null });
        return null;
      }
      // A transient failure (network/timeout/5xx/invalid response) while refreshing an
      // already-authenticated session must not evict that session — only an explicit
      // 401/403 above may do that. Bootstrap (state not yet authenticated) still falls
      // back to "unknown" with the error, unchanged.
      setState((previous) => (previous.status === "authenticated" ? previous : { status: "unknown", user: null, error }));
      throw error;
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void restoreSession(controller.signal).catch(() => undefined);
    return () => controller.abort();
  }, [restoreSession]);

  useEffect(() => {
    const invalidate = () => setState({ status: "unauthenticated", user: null, error: null });
    window.addEventListener(AUTH_INVALID_EVENT, invalidate);
    return () => window.removeEventListener(AUTH_INVALID_EVENT, invalidate);
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const result = await api.login(input.email, input.password, input.remember);
    const preAuthToken = extractPreAuthToken(result);
    if (preAuthToken) throw new TwoFactorRequiredError(preAuthToken);
    const user = await api.getUser();
    setState({ status: "authenticated", user, error: null });
    return user;
  }, []);

  const loginWithTwoFactor = useCallback(async (preAuthToken: string, code: string, remember: boolean) => {
    await api.loginWithTwoFactor(preAuthToken, code, remember);
    const user = await api.getUser();
    setState({ status: "authenticated", user, error: null });
    return user;
  }, []);

  const signup = useCallback(async (input: SignupInput) => {
    await api.signup(input.email, input.password, input.inviteCode, input.language, input.newsletter);
    const user = await api.getUser();
    setState({ status: "authenticated", user, error: null });
    window.localStorage.removeItem("invite_code");
    return user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setState({ status: "unauthenticated", user: null, error: null });
    }
  }, []);

  const refreshSession = useCallback(() => restoreSession(), [restoreSession]);
  const value = useMemo<AuthContextValue>(() => ({ ...state, login, loginWithTwoFactor, signup, logout, refreshSession }), [state, login, loginWithTwoFactor, signup, logout, refreshSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("AuthProvider is missing");
  return context;
}

export function useAuthenticatedUser() {
  const auth = useAuth();
  if (auth.status !== "authenticated") throw new Error("Authenticated user is unavailable");
  return { user: auth.user, refreshUser: auth.refreshSession };
}
