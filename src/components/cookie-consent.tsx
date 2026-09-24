import { useState } from "react";
import { legalLinks } from "@/lib/legal";
import { Button } from "./ui/button";

const STORAGE_KEY = "cookie_consent";

function hasConsent() {
  try { return window.localStorage.getItem(STORAGE_KEY) === "1"; } catch { return false; }
}

export function CookieConsent() {
  const [visible, setVisible] = useState(() => !hasConsent());
  if (!visible) return null;
  const policy = legalLinks.cookies();

  function accept() {
    try { window.localStorage.setItem(STORAGE_KEY, "1"); } catch { /* the banner just reappears next visit */ }
    setVisible(false);
  }

  return (
    <div className="cookie-banner" role="region" aria-label="Использование cookie">
      <p>Мы используем cookie для работы сайта и авторизации. Продолжая, вы соглашаетесь с их использованием.{policy ? <> <a href={policy} target="_blank" rel="noreferrer">Подробнее</a></> : null}</p>
      <Button size="small" onClick={accept}>Понятно</Button>
    </div>
  );
}
