const IGNORED_SUBDOMAIN_PREFIXES = new Set(["www", "back", "app", "api", "m"]);
const COUNTRY_SECOND_LEVELS = new Set(["ac", "co", "com", "edu", "gov", "net", "org"]);
const FALLBACK_BRAND = "Monvravex";

export type BrandParts = { name: string; tld: string };

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function hostnameParts(domain: string) {
  const raw = domain.trim().toLowerCase();
  if (!raw) return [];
  let hostname = raw;
  try {
    hostname = new URL(raw.includes("://") ? raw : `https://${raw}`).hostname;
  } catch {
    hostname = raw.split("/")[0]?.split(":")[0] ?? "";
  }
  return hostname.replace(/^\.+|\.+$/g, "").split(".").filter(Boolean);
}

export function brandPartsFromDomain(domain: string): BrandParts {
  const parts = hostnameParts(domain);
  if (parts.length === 0) return { name: "", tld: "" };
  if (parts.length === 1 || parts.every((part) => /^\d+$/.test(part))) {
    const single = parts[0] ?? "";
    return { name: /^\d+$/.test(single) ? "Localhost" : capitalize(single), tld: "" };
  }

  while (parts.length > 2 && IGNORED_SUBDOMAIN_PREFIXES.has(parts[0] ?? "")) parts.shift();
  const last = parts[parts.length - 1] ?? "";
  const beforeLast = parts[parts.length - 2] ?? "";
  const hasCountrySecondLevel = parts.length >= 3 && last.length === 2 && COUNTRY_SECOND_LEVELS.has(beforeLast);
  const nameIndex = hasCountrySecondLevel ? parts.length - 3 : parts.length - 2;
  return {
    name: capitalize(parts[Math.max(0, nameIndex)] ?? ""),
    tld: `.${parts.slice(nameIndex + 1).join(".")}`
  };
}

function configuredBrandName() {
  const value: unknown = import.meta.env["VITE_BRAND_NAME"];
  return typeof value === "string" ? value.trim() : "";
}

/** Brand shown in the UI: explicit VITE_BRAND_NAME, else derived from the current hostname, else the default. */
export function getBrandParts(hostname = typeof window === "undefined" ? "" : window.location.hostname): BrandParts {
  const configured = configuredBrandName();
  if (configured) return { name: configured, tld: "" };
  if (hostname === "localhost" || hostname === "127.0.0.1") return { name: FALLBACK_BRAND, tld: "" };
  const derived = brandPartsFromDomain(hostname);
  return derived.name ? derived : { name: FALLBACK_BRAND, tld: "" };
}

export function getBrandName(hostname?: string) {
  return getBrandParts(hostname).name;
}
