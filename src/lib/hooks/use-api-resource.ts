import { useCallback, useEffect, useRef, useState } from "react";

type ResourceState<T> =
  | { requestKey: string; status: "success"; data: T; error: null }
  | { requestKey: string; status: "error"; data: null; error: unknown };

export function useApiResource<T>(key: string | null, load: (signal: AbortSignal) => Promise<T>) {
  const loaderRef = useRef(load);
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<ResourceState<T> | null>(null);
  const requestKey = `${key ?? "disabled"}:${revision}`;

  useEffect(() => {
    loaderRef.current = load;
  }, [load]);

  useEffect(() => {
    if (!key) {
      return;
    }

    const controller = new AbortController();
    loaderRef.current(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) {
          setState({ requestKey, status: "success", data, error: null });
        }
      },
      (error: unknown) => {
        if (!controller.signal.aborted) {
          setState({ requestKey, status: "error", data: null, error });
        }
      }
    );

    return () => controller.abort();
  }, [key, requestKey]);

  const refresh = useCallback(() => setRevision((currentRevision) => currentRevision + 1), []);

  if (!state || state.requestKey !== requestKey) {
    return { status: "loading" as const, data: null, error: null, refresh };
  }

  return { ...state, refresh };
}
