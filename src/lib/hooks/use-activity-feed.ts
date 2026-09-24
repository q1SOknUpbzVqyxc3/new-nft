import { useEffect, useRef, useState } from "react";
import { isEndpointUnavailable } from "@/lib/api/client";
import type { ActivityEvent } from "@/lib/api/schemas";
import { api } from "@/lib/api/services";
import { demoActivityPage, isActivityDemoEnabled } from "@/lib/activity-demo";

const POLL_MS = 30_000;
const REVEAL_MIN_MS = 500;
const REVEAL_MAX_MS = 1_500;
const SEEN_ID_CAP = 300;

export type ActivityScope = { collectionId?: string; nftId?: string; lang?: string; theme?: string; currency?: string };
export type ActivityFeedState = { events: ActivityEvent[]; loading: boolean; unavailable: boolean; error: unknown };

function eventId(event: ActivityEvent, index: number) {
  return String(event.id ?? `${event.ts ?? "x"}-${index}-${event.text}`);
}

/**
 * Polls the feed like the arbitrage site: the first page shows at once, later events are queued and revealed one by one
 * after a short random delay, ids are de-duplicated, polling pauses while the tab is hidden.
 */
export function useActivityFeed(count: number, scope: ActivityScope): ActivityFeedState {
  const [state, setState] = useState<ActivityFeedState>({ events: [], loading: true, unavailable: false, error: null });
  const scopeRef = useRef(scope);
  useEffect(() => { scopeRef.current = scope; });
  const { collectionId, nftId, lang, theme, currency } = scope;

  useEffect(() => {
    const controller = new AbortController();
    const seen = new Set<string>();
    let queue: ActivityEvent[] = [];
    let revealTimer: number | undefined;
    let pollTimer: number | undefined;
    let first = true;
    let pollNumber = 0;

    const revealNext = () => {
      revealTimer = undefined;
      const next = queue.shift();
      if (next) setState((current) => ({ ...current, events: [next, ...current.events].slice(0, count) }));
      if (queue.length > 0) scheduleReveal();
    };
    const scheduleReveal = () => {
      if (revealTimer !== undefined || queue.length === 0) return;
      revealTimer = window.setTimeout(revealNext, REVEAL_MIN_MS + Math.random() * (REVEAL_MAX_MS - REVEAL_MIN_MS));
    };

    async function load(): Promise<ActivityEvent[]> {
      if (isActivityDemoEnabled()) { pollNumber += 1; return demoActivityPage(first ? 0 : pollNumber, count); }
      return api.getActivityFeed(count, controller.signal, scopeRef.current);
    }

    async function poll() {
      try {
        const page = (await load()).filter((event) => event.text);
        if (controller.signal.aborted) return;
        const ordered = page.map((event, index) => ({ event, id: eventId(event, index) }));
        if (first) {
          ordered.forEach(({ id }) => seen.add(id));
          setState({ events: ordered.map(({ event }) => event).slice(0, count), loading: false, unavailable: false, error: null });
        } else {
          const fresh = ordered.filter(({ id }) => !seen.has(id));
          if (fresh.length > 0) {
            fresh.forEach(({ id }) => seen.add(id));
            queue.push(...fresh.map(({ event }) => event).reverse());
            scheduleReveal();
          }
          setState((current) => ({ ...current, loading: false, unavailable: false, error: null }));
        }
        if (seen.size > SEEN_ID_CAP) [...seen].slice(0, seen.size - SEEN_ID_CAP).forEach((id) => seen.delete(id));
      } catch (error) {
        if (controller.signal.aborted) return;
        if (isEndpointUnavailable(error)) { setState({ events: [], loading: false, unavailable: true, error }); return; }
        setState((current) => ({ ...current, loading: false, error }));
      } finally {
        first = false;
      }
      pollTimer = window.setTimeout(() => { if (document.hidden) { pollTimer = window.setTimeout(() => void poll(), POLL_MS); } else void poll(); }, POLL_MS);
    }

    const onVisible = () => { if (!document.hidden) { window.clearTimeout(pollTimer); void poll(); } };
    void poll();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      controller.abort();
      window.clearTimeout(pollTimer);
      window.clearTimeout(revealTimer);
      document.removeEventListener("visibilitychange", onVisible);
      queue = [];
    };
  }, [count, collectionId, nftId, lang, theme, currency]);

  return state;
}
