import { useEffect, useRef, useState } from "react";
import { useAuthenticatedUser } from "@/auth/auth-context";
import { api } from "@/lib/api/services";
import type { Notice } from "@/lib/notices";
import { notices } from "@/lib/notices";
import { describePopup, getPopupKind, getRestrictionKind } from "@/lib/popup-notices";
import { NoticeModal } from "./notice-modal";

type QueuedNotice = { key: string; notice: Notice; restriction: boolean };

/**
 * Blocking system notices: backend popups (fetched once, marked read) plus withdrawal-restriction
 * notices recognised from newly arrived notifications. Restrictions can only be closed explicitly.
 */
export function PopupNotices() {
  const { user } = useAuthenticatedUser();
  const [queue, setQueue] = useState<QueuedNotice[]>([]);
  const userId = String(user.id);
  const unreadPopups = user.unread_popup_notifications_count;
  const unreadNotifications = user.unread_notifications_count ?? 0;
  const previousNotifications = useRef<number | null>(null);

  useEffect(() => {
    if (unreadPopups !== undefined && unreadPopups <= 0) return;
    const controller = new AbortController();
    api.getPopupNotifications(controller.signal).then(
      (items) => {
        if (controller.signal.aborted) return;
        const next = items
          .map((popup, index): QueuedNotice => ({ key: `popup:${String(popup.id ?? index)}`, notice: describePopup(popup), restriction: getPopupKind(popup) !== "generic" }))
          .filter((item) => item.restriction || item.notice.paragraphs.length > 0);
        setQueue((current) => [...current, ...next.filter((item) => !current.some((existing) => existing.key === item.key))]);
      },
      () => undefined
    );
    return () => controller.abort();
  }, [userId, unreadPopups]);

  // A newly arrived "withdrawal declined" notification opens the matching restriction notice without opening the bell.
  useEffect(() => {
    const previous = previousNotifications.current;
    previousNotifications.current = unreadNotifications;
    if (unreadNotifications <= 0 || previous === unreadNotifications || (previous !== null && unreadNotifications < previous)) return;
    const controller = new AbortController();
    api.getNotifications(false, controller.signal).then(
      (rows) => {
        if (controller.signal.aborted) return;
        const kind = rows.slice(0, unreadNotifications).map((row) => getRestrictionKind(row.title)).find(Boolean);
        if (!kind) return;
        setQueue((current) => current.some((item) => item.key === `notification:${kind}`) ? current : [...current, { key: `notification:${kind}`, notice: notices[kind], restriction: true }]);
      },
      () => undefined
    );
    return () => controller.abort();
  }, [userId, unreadNotifications]);

  const current = queue[0];
  if (!current) return null;
  const remaining = queue.length - 1;

  return <NoticeModal key={current.key} notice={current.notice} dismissible={!current.restriction} closeLabel={remaining > 0 ? `Далее (${remaining})` : "Понятно"} onClose={() => setQueue((items) => items.slice(1))} />;
}
