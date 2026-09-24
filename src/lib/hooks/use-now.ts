import { useEffect, useState } from "react";

/** Current time, refreshed on an interval (default every 30 s) so countdowns stay honest without per-second renders. */
export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}
