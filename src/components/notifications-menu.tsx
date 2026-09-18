import { Bell } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api/services";
import { getUserFacingError } from "@/lib/api/errors";
import { formatDateTime } from "@/lib/formatters";
import { useApiResource } from "@/lib/hooks/use-api-resource";
import { EmptyState, ErrorState, LoadingState } from "./ui/page-state";

function formatNotificationText(value: string) {
  if (value.includes(" ")) return value;
  const segment = value.split(".").at(-1) ?? value;
  return segment.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}

export function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const notifications = useApiResource(open ? "notifications:read" : null, (signal) => api.getNotifications(true, signal));

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) setOpen(false);
    };
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", closeWithEscape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, [open]);

  return <div className="notification-menu" ref={containerRef}><button type="button" className="icon-button" aria-label="Уведомления" aria-expanded={open} aria-controls="notification-panel" onClick={() => setOpen((value) => !value)}><Bell size={19} /></button>{open ? <section id="notification-panel" className="notification-panel" role="region" aria-label="Уведомления"><header><strong>Уведомления</strong><button type="button" onClick={() => setOpen(false)} aria-label="Закрыть">×</button></header><div className="notification-panel__content">{notifications.status === "loading" ? <LoadingState label="Загружаем" /> : notifications.status === "error" ? <ErrorState message={getUserFacingError(notifications.error)} onRetry={notifications.refresh} /> : notifications.data.length ? notifications.data.map((notification) => <article className="notification-item" key={String(notification.key)}><div><strong>{formatNotificationText(notification.title)}</strong><p>{formatNotificationText(notification.description)}</p></div><time dateTime={notification.created}>{formatDateTime(notification.created)}</time></article>) : <EmptyState title="Уведомлений нет" description="Новые события аккаунта появятся здесь." />}</div></section> : null}</div>;
}
