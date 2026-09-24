import { useSyncExternalStore } from "react";

/**
 * The backend's `avatar` field doesn't change value across re-uploads (always `/api/user/{id}.pic`), so it
 * can't drive cache-busting. Track a local version bumped right after a successful upload instead.
 */
const EVENT = "monvravex:avatar-change";

function versionKey(userId: number | string) {
  return `avatar_v:${userId}`;
}

function readVersion(userId: number | string) {
  try {
    return window.localStorage.getItem(versionKey(userId)) ?? "";
  } catch {
    return "";
  }
}

export function bumpAvatarVersion(userId: number | string) {
  try {
    window.localStorage.setItem(versionKey(userId), String(Date.now()));
  } catch {
    /* the avatar just won't cache-bust this session */
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  return () => window.removeEventListener(EVENT, callback);
}

export function useAvatarVersion(userId: number | string): string {
  return useSyncExternalStore(subscribe, () => readVersion(userId), () => "");
}
