import { useSyncExternalStore } from "react";
import { readCookie, writeCookie } from "./cookie";

/** Site UI/document language, matching the options in profile settings. */
export const SITE_LANGUAGES = [
  { id: "ru", label: "Русский" },
  { id: "en", label: "English" },
  { id: "ua", label: "Українська" },
  { id: "bl", label: "Беларуская" },
  { id: "de", label: "Deutsch" },
  { id: "fr", label: "Français" },
  { id: "cn", label: "中文" }
] as const;

export type SiteLanguage = (typeof SITE_LANGUAGES)[number]["id"];
const DEFAULT_LANGUAGE: SiteLanguage = "ru";
const COOKIE_NAME = "lang";
const CHANGE_EVENT = "monvravex:language-change";

function isSiteLanguage(value: string): value is SiteLanguage {
  return SITE_LANGUAGES.some((language) => language.id === value);
}

export function readLanguage(): SiteLanguage {
  const raw = readCookie(COOKIE_NAME);
  return raw !== null && isSiteLanguage(raw) ? raw : DEFAULT_LANGUAGE;
}

export function setLanguage(language: SiteLanguage) {
  writeCookie(COOKIE_NAME, language);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  return () => window.removeEventListener(CHANGE_EVENT, callback);
}

export function useLanguage(): SiteLanguage {
  return useSyncExternalStore(subscribe, readLanguage, () => DEFAULT_LANGUAGE);
}
