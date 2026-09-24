import { isEndpointUnavailable } from "@/lib/api/client";
import { useApiResource } from "./use-api-resource";

export type OptionalResource<T> =
  | { state: "loading"; data: null; refresh: () => void; error: null }
  | { state: "ready"; data: T; refresh: () => void; error: null }
  | { state: "unavailable"; data: null; refresh: () => void; error: unknown }
  | { state: "error"; data: null; refresh: () => void; error: unknown };

/** Like useApiResource, but a 404/405/501 means "the backend has not shipped this yet" rather than a failure. */
export function useOptionalResource<T>(key: string | null, load: (signal: AbortSignal) => Promise<T>): OptionalResource<T> {
  const resource = useApiResource(key, load);
  if (resource.status === "loading") return { state: "loading", data: null, refresh: resource.refresh, error: null };
  if (resource.status === "success") return { state: "ready", data: resource.data, refresh: resource.refresh, error: null };
  return { state: isEndpointUnavailable(resource.error) ? "unavailable" : "error", data: null, refresh: resource.refresh, error: resource.error };
}
