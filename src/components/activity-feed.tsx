import type { ActivityEvent } from "@/lib/api/schemas";
import { formatDateTime } from "@/lib/formatters";
import { type ActivityScope, useActivityFeed } from "@/lib/hooks/use-activity-feed";
import { UnavailableNote } from "./unavailable-note";

const EVENT_LIMIT = 12;
const TIP = "В ленте отображаются покупки NFT, ставки и итоги аукционов, пополнения и выводы, новые коллекции и изменения floor price. Имена участников скрыты.";

function toMillis(ts: number | undefined) {
  if (!ts || !Number.isFinite(ts)) return null;
  return ts < 1e12 ? ts * 1000 : ts;
}

function EventRow({ event }: { event: ActivityEvent }) {
  const time = toMillis(event.ts);
  return (
    <li className="activity-feed__item">
      <span className="activity-feed__dot" style={event.color ? { background: event.color } : undefined} aria-hidden="true" />
      <span className="activity-feed__text">{event.text}</span>
      {time ? <time dateTime={new Date(time).toISOString()}>{formatDateTime(time)}</time> : null}
    </li>
  );
}

/**
 * Live activity card, modelled on the arbitrage site. With `alwaysVisible` (the dashboard) it also shows loading, empty and
 * "not available yet" states; elsewhere it stays out of the way until there is something to show.
 */
export function ActivityFeed({ scope, title = "Лента действий", alwaysVisible = false, lang = "ru", currency }: { scope?: { collectionId?: string; nftId?: string }; title?: string; alwaysVisible?: boolean; lang?: string; currency?: string } = {}) {
  const feedScope: ActivityScope = { ...(scope ?? {}), lang, theme: document.documentElement.dataset["theme"] === "light" ? "light" : "dark", ...(currency ? { currency } : {}) };
  const feed = useActivityFeed(EVENT_LIMIT, feedScope);

  if (!alwaysVisible && (feed.unavailable || feed.events.length === 0)) return null;

  return (
    <section className="activity-feed" aria-label={title}>
      <h2>{title}</h2>
      {alwaysVisible ? <p className="activity-feed__tip">{TIP}</p> : null}
      {feed.loading ? <p className="profile-muted">Загружаем…</p> : feed.unavailable ? <UnavailableNote>Лента действий появится, когда сервер начнёт её отдавать.</UnavailableNote> : feed.events.length === 0 ? <p className="profile-muted">Пока нет активности</p> : (
        <ul className="activity-feed__list">{feed.events.map((event, index) => <EventRow key={String(event.id ?? `${event.ts}-${index}`)} event={event} />)}</ul>
      )}
    </section>
  );
}
