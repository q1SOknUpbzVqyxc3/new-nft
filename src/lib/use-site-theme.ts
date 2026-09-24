import { useEffect } from "react";

function readCookie(name: string) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

/** Lets a domain-level `selected_theme` cookie switch the colour palette via `data-site-theme` on <html>. */
export function useSiteTheme() {
  useEffect(() => {
    const value = readCookie("selected_theme");
    if (value && /^[a-z0-9_-]{1,32}$/i.test(value) && value !== "0") document.documentElement.dataset.siteTheme = value;
    else delete document.documentElement.dataset.siteTheme;
  }, []);
}
