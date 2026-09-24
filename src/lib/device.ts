import type { DeviceSession } from "./api/schemas";

const BROWSERS: Array<[RegExp, string]> = [
  [/YaBrowser\//i, "Yandex Browser"],
  [/Edg(?:e|A|iOS)?\//i, "Edge"],
  [/OPR\/|Opera\//i, "Opera"],
  [/SamsungBrowser\//i, "Samsung Internet"],
  [/Firefox\//i, "Firefox"],
  [/Chrome\//i, "Chrome"],
  [/Version\/[\d.]+.*Safari/i, "Safari"]
];

const SYSTEMS: Array<[RegExp, string]> = [
  [/Windows NT 1[01]/i, "Windows"],
  [/Windows/i, "Windows"],
  [/iPhone|iPad|iPod/i, "iOS"],
  [/Android/i, "Android"],
  [/Mac OS X|Macintosh/i, "macOS"],
  [/CrOS/i, "ChromeOS"],
  [/Linux/i, "Linux"]
];

function firstMatch(table: Array<[RegExp, string]>, value: string) {
  return table.find(([pattern]) => pattern.test(value))?.[1] ?? null;
}

/** Turns a raw user agent into "Chrome · macOS"; returns the raw value when it is not a recognisable UA. */
export function formatDeviceLabel(raw: string | null | undefined) {
  const value = (raw ?? "").trim();
  if (!value) return null;
  const browser = firstMatch(BROWSERS, value);
  const system = firstMatch(SYSTEMS, value);
  if (!browser && !system) return value;
  return [browser, system].filter(Boolean).join(" · ");
}

export type NormalizedSession = { id: string; label: string | null; ip: string | null; lastActive: string | null; isCurrent: boolean };

export function normalizeSession(raw: DeviceSession, index: number): NormalizedSession {
  return {
    id: String(raw.session_id ?? raw.id ?? index),
    label: formatDeviceLabel(raw.device ?? raw.user_agent),
    ip: raw.ip ?? null,
    lastActive: raw.last_active ?? raw.created ?? null,
    isCurrent: Boolean(raw.current)
  };
}
