import type { SiteLanguage } from "./language";

/** Languages the static documents under /documentation are actually published in. */
type DocLang = "en" | "ru" | "uk" | "be" | "kk" | "fr" | "es" | "de" | "pl";

export const LEGAL_DOCS = {
  terms: "TERMS-AND-CONDITIONS",
  privacy: "Privacy-Policy",
  cookies: "COOKIE-POLICY"
} as const;

/** Site language codes (profile settings) → document language codes; falls back to English when there's no matching translation. */
const SITE_TO_DOC_LANG: Record<SiteLanguage, DocLang> = { ru: "ru", en: "en", ua: "uk", bl: "be", de: "de", fr: "fr", cn: "en" };

export function legalDocUrl(language: SiteLanguage, doc: (typeof LEGAL_DOCS)[keyof typeof LEGAL_DOCS]) {
  const docLang = SITE_TO_DOC_LANG[language] ?? "en";
  return `/documentation/${docLang}-${doc}.pdf`;
}
