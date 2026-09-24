import type { PopupNotification } from "./api/schemas";
import { type Notice, notices } from "./notices";

export type PopupKind = "verification" | "tax" | "generic";

/** Event code carried by a popup or notification row; the backend puts it in `title` (or `code`/`type`). */
export function getPopupCode(popup: Pick<PopupNotification, "title" | "description"> & { code?: string | undefined; type?: string | undefined }) {
  return String(popup.code ?? popup.type ?? popup.title ?? popup.description ?? "").trim().toLowerCase();
}

/** Backend event codes that explain why a withdrawal was declined. */
export function getRestrictionKind(code: string): Exclude<PopupKind, "generic"> | null {
  const value = code.trim().toLowerCase();
  if (value === "withdraw_decline_by_verif") return "verification";
  if (value === "withdraw_decline_by_tax") return "tax";
  return null;
}

export function getPopupKind(popup: PopupNotification): PopupKind {
  return getRestrictionKind(getPopupCode(popup)) ?? "generic";
}

/** Restriction popups use the standard copy; anything else shows the backend's own (human-readable) text. */
export function describePopup(popup: PopupNotification): Notice {
  const kind = getPopupKind(popup);
  if (kind !== "generic") return notices[kind];
  const title = popup.title.includes(" ") ? popup.title : "";
  const text = popup.text ?? popup.description;
  return { title: title || "Уведомление", paragraphs: text.includes(" ") ? [text] : [], support: false };
}
