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

/** Legal document links are per-site: configure VITE_TERMS_URL / VITE_PRIVACY_URL / VITE_COOKIE_URL. Unset links are not rendered. */
export const legalLinks = {
  terms: () => envUrl("VITE_TERMS_URL") ?? "https://monvravex.com/license/agreement.pdf",
  privacy: () => envUrl("VITE_PRIVACY_URL"),
  cookies: () => envUrl("VITE_COOKIE_URL")
};
