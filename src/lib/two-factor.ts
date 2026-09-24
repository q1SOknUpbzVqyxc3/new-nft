import type { User } from "./api/schemas";

const key = (userId: string | number) => `2fa:${String(userId)}`;

export function readTwoFactorFlag(userId: string | number) {
  try { return window.localStorage.getItem(key(userId)) === "1"; } catch { return false; }
}

export function writeTwoFactorFlag(userId: string | number, enabled: boolean) {
  try {
    if (enabled) window.localStorage.setItem(key(userId), "1");
    else window.localStorage.removeItem(key(userId));
  } catch { /* storage may be unavailable; the flag is only a UI hint */ }
}

/** Backend flag when exposed, otherwise the last state this browser saw (a UI hint only). */
export function hasTwoFactor(user: User) {
  return user.has_2fa ?? readTwoFactorFlag(user.id);
}
