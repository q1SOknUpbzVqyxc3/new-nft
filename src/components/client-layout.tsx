import { CircleDollarSign, LogOut, Menu, Moon, UserRound, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/auth-context";
import { navigationItems } from "@/lib/navigation";
import { formatMoney } from "@/lib/formatters";
import { ActivationGate } from "./activation-gate";
import { Brand } from "./brand";
import { MarketplaceSearch } from "./marketplace-search";
import { NotificationsMenu } from "./notifications-menu";

export function ClientLayout() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => window.localStorage.getItem("theme") ?? "dark");
  const mobileMenuRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!menuOpen) return;
    document.body.style.overflow = "hidden";
    const triggerButton = menuButtonRef.current;
    const focusable = mobileMenuRef.current ? Array.from(mobileMenuRef.current.querySelectorAll<HTMLElement>("a, button")) : [];
    focusable[0]?.focus();

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeydown);
      triggerButton?.focus();
    };
  }, [menuOpen]);

  async function logout() {
    await auth.logout();
    await navigate("/auth/login", { replace: true });
  }

  function toggleTheme() {
    setTheme((value) => (value === "dark" ? "light" : "dark"));
  }

  if (auth.status !== "authenticated") return null;
  if (!auth.user.active) return <ActivationGate />;
  const currentUser = auth.user;

  return (
    <div className="app-shell">
      <aside className="side-rail">
        <Brand />
        <nav className="side-rail__nav" aria-label="Основная навигация">
          {navigationItems.map((item) => <NavLink to={item.to} key={item.to} aria-label={item.label} title={item.label}><item.icon size={19} aria-hidden="true" /></NavLink>)}
        </nav>
        <div className="side-rail__foot">
          <button type="button" aria-label="Сменить тему" title="Сменить тему" onClick={toggleTheme}><Moon size={19} /></button>
          <button type="button" aria-label="Выйти" title="Выйти" onClick={() => void logout()}><LogOut size={19} /></button>
        </div>
      </aside>
      <div className="app-shell__main">
      <header className="app-header">
        <div className="app-header__inner">
          <span className="mobile-brand"><Brand /></span>
          <MarketplaceSearch />
          <div className="header-actions">
            <Link to="/client/topup" className="balance-chip"><CircleDollarSign size={16} /><span>{formatMoney(currentUser.balance, currentUser.currency)}</span></Link>
            <Link to="/client/profile" className="icon-button" aria-label="Профиль"><UserRound size={19} /></Link>
            <NotificationsMenu />
            <button ref={menuButtonRef} className="menu-button" type="button" aria-expanded={menuOpen} aria-controls="mobile-nav" aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"} onClick={() => setMenuOpen((value) => !value)}>{menuOpen ? <X /> : <Menu />}</button>
          </div>
        </div>
        {menuOpen ? (
          <nav id="mobile-nav" className="mobile-menu container" aria-label="Мобильная навигация" ref={mobileMenuRef}>
            {navigationItems.map((item) => <NavLink to={item.to} key={item.to} onClick={() => setMenuOpen(false)}><item.icon size={18} aria-hidden="true" /> {item.label}</NavLink>)}
            <button type="button" onClick={toggleTheme}><Moon size={18} aria-hidden="true" /> Сменить тему</button>
            <button type="button" onClick={() => void logout()}><LogOut size={18} aria-hidden="true" /> Выйти</button>
          </nav>
        ) : null}
      </header>
      <Outlet />
      </div>
    </div>
  );
}
