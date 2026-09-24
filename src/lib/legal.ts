import type { SiteLanguage } from "./language";
import { legalDocUrl, LEGAL_DOCS } from "./legal-docs";

function envUrl(name: string) {
  const value: unknown = import.meta.env[name];
  if (typeof value !== "string" || !value.trim()) return null;
  const candidate = value.trim();
  if (candidate.startsWith("/") && !candidate.startsWith("//")) return candidate;
  try {
    return new URL(candidate).protocol === "https:" ? candidate : null;
  } catch {
    return null;
  }
}

/**
 * Legal document links: an explicit VITE_*_URL override wins, otherwise the localized document for the
 * current site language under /documentation (see legal-docs.ts) is used.
 */
export const legalLinks = {
  terms: (language: SiteLanguage) => envUrl("VITE_TERMS_URL") ?? legalDocUrl(language, LEGAL_DOCS.terms),
  privacy: (language: SiteLanguage) => envUrl("VITE_PRIVACY_URL") ?? legalDocUrl(language, LEGAL_DOCS.privacy),
  cookies: (language: SiteLanguage) => envUrl("VITE_COOKIE_URL") ?? legalDocUrl(language, LEGAL_DOCS.cookies)
};
