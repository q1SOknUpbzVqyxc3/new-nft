import { useSyncExternalStore } from "react";
import { readCookie, writeCookie } from "./cookie";

/**
 * TEMPORARY: design variants for side-by-side review. Remove together with DesignSwitcher and themes.css.
 * Persisted as a numeric cookie id (not localStorage) so the choice can be read server-side later if needed.
 * Cookie id → design:
 *   0 = default (стандартная тема)
 *   1 = resend
 *   2 = dala
 *   3 = factory
 */
export const DESIGNS = [
  { id: "default", label: "Стандарт" },
  { id: "resend", label: "Resend" },
  { id: "dala", label: "Dala" },
  { id: "factory", label: "Factory" }
] as const;

export type DesignId = (typeof DESIGNS)[number]["id"];

const DESIGN_COOKIE_IDS: Record<DesignId, number> = { default: 0, resend: 1, dala: 2, factory: 3 };
const COOKIE_NAME = "design";
const CHANGE_EVENT = "monvravex:design-change";

function idToDesign(id: number): DesignId {
  const entry = (Object.entries(DESIGN_COOKIE_IDS) as Array<[DesignId, number]>).find(([, value]) => value === id);
  return entry ? entry[0] : "default";
}

export function readDesign(): DesignId {
  const raw = readCookie(COOKIE_NAME);
  const id = raw === null ? NaN : Number(raw);
  return Number.isFinite(id) ? idToDesign(id) : "default";
}

export function applyDesign(design: DesignId) {
  const root = document.documentElement;
  if (design === "default") delete root.dataset["design"];
  else root.dataset["design"] = design;
  root.dataset["designSwitcher"] = "on";
}

export function setDesign(design: DesignId) {
  writeCookie(COOKIE_NAME, String(DESIGN_COOKIE_IDS[design]));
  applyDesign(design);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  return () => window.removeEventListener(CHANGE_EVENT, callback);
}

export function useDesign(): DesignId {
  return useSyncExternalStore(subscribe, readDesign, () => "default");
}
