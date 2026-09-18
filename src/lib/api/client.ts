import type { ZodType } from "zod";

const DEFAULT_TIMEOUT_MS = 15_000;
export const AUTH_INVALID_EVENT = "monvravex:auth-invalid";

type RequestOptions = Omit<RequestInit, "credentials"> & {
  timeoutMs?: number;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown;

  constructor(status: number, code: string, details?: unknown) {
    super(code);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function getApiBaseUrl() {
  const configuredBaseUrl: unknown = import.meta.env["VITE_API_BASE_URL"];

  if (typeof configuredBaseUrl === "string" && configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/$/, "");
  }

  return "";
}

export function resolveApiMediaUrl(value: string) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `${getApiBaseUrl()}${value.startsWith("/") ? value : `/${value}`}`;
}

async function parseResponseBody(response: Response) {
  const responseText = await response.text();

  if (!responseText) {
    return null;
  }

  try {
    return JSON.parse(responseText) as unknown;
  } catch {
    return responseText;
  }
}

function getErrorCode(payload: unknown, status: number) {
  if (typeof payload === "string" && payload.trim()) {
    return payload.trim().replace(/^"|"$/g, "");
  }

  if (payload && typeof payload === "object") {
    const errorPayload = payload as Record<string, unknown>;
    const candidate = errorPayload.code ?? errorPayload.error ?? errorPayload.detail ?? errorPayload.message;

    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  return `http_${status}`;
}

export async function apiRequest<T>(
  path: string,
  schema: ZodType<T>,
  options: RequestOptions = {}
): Promise<T> {
  const requestController = new AbortController();
  const timeoutId = globalThis.setTimeout(
    () => requestController.abort(new DOMException("Request timed out", "TimeoutError")),
    options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  );
  const abortFromCaller = () => requestController.abort(options.signal?.reason);
  options.signal?.addEventListener("abort", abortFromCaller, { once: true });

  try {
    const response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...options,
      signal: requestController.signal,
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...options.headers
      }
    });
    const payload = await parseResponseBody(response);

    if (!response.ok) {
      const code = getErrorCode(payload, response.status);
      if (response.status === 401 || (response.status === 403 && code.toLowerCase().includes("not authenticated"))) {
        window.dispatchEvent(new Event(AUTH_INVALID_EVENT));
      }
      throw new ApiError(response.status, code, payload);
    }

    const parsed = schema.safeParse(payload);

    if (!parsed.success) {
      throw new ApiError(502, "invalid_api_response", parsed.error.flatten());
    }

    return parsed.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (requestController.signal.reason instanceof DOMException && requestController.signal.reason.name === "TimeoutError") {
      throw new ApiError(0, "request_timeout");
    }
    if (options.signal?.aborted) throw error;
    throw new ApiError(0, "network_error");
  } finally {
    globalThis.clearTimeout(timeoutId);
    options.signal?.removeEventListener("abort", abortFromCaller);
  }
}

export function createFormBody(values: Record<string, string | number | boolean | null | undefined>) {
  const body = new URLSearchParams();

  for (const [key, value] of Object.entries(values)) {
    if (value !== null && value !== undefined) {
      body.set(key, String(value));
    }
  }

  return body;
}
