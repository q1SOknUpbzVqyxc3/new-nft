import { Bell } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuthenticatedUser } from "@/auth/auth-context";
import { api } from "@/lib/api/services";
import { getUserFacingError } from "@/lib/api/errors";
import { formatDateTime, formatMoney } from "@/lib/formatters";
import { formatNotificationText, getBalanceDelta } from "@/lib/notification-text";
import { useApiResource } from "@/lib/hooks/use-api-resource";
import { EmptyState, ErrorState, LoadingState } from "./ui/page-state";

export function NotificationsMenu() {
  const { user } = useAuthenticatedUser();
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

  return <div className="notification-menu" ref={containerRef}><button type="button" className="icon-button" aria-label="Уведомления" aria-expanded={open} aria-controls="notification-panel" onClick={() => setOpen((value) => !value)}><Bell size={19} /></button>{open ? <section id="notification-panel" className="notification-panel" role="region" aria-label="Уведомления"><header><strong>Уведомления</strong><button type="button" onClick={() => setOpen(false)} aria-label="Закрыть">×</button></header><div className="notification-panel__content">{notifications.status === "loading" ? <LoadingState label="Загружаем" /> : notifications.status === "error" ? <ErrorState message={getUserFacingError(notifications.error)} onRetry={notifications.refresh} /> : notifications.data.length ? notifications.data.map((notification, index) => { const delta = getBalanceDelta(notification.balance_before, notification.balance_after); return <article className={notification.is_read === false ? "notification-item notification-item--unread" : "notification-item"} key={`${String(notification.key ?? notification.created)}-${index}`}><div><strong>{formatNotificationText(notification.title)}</strong>{notification.description !== notification.title ? <p>{formatNotificationText(notification.description)}</p> : null}{delta === null ? null : <span className={delta > 0 ? "notification-delta notification-delta--up" : "notification-delta notification-delta--down"}>{delta > 0 ? "+" : "−"}{formatMoney(Math.abs(delta), user.currency)}</span>}</div><time dateTime={notification.created}>{formatDateTime(notification.created)}</time></article>; }) : <EmptyState title="Уведомлений нет" description="Новые события аккаунта появятся здесь." />}</div></section> : null}</div>;
}
