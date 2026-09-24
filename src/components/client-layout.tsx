import { Clock, CircleDollarSign, LogOut, Menu, Moon, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/auth-context";
import { DEFAULT_CLIENT_ROUTE, isNavigationItemActive, navigationItems } from "@/lib/navigation";
import { api } from "@/lib/api/services";
import { pendingWithdrawalTotal } from "@/lib/finance";
import { formatMoney } from "@/lib/formatters";
import { useApiResource } from "@/lib/hooks/use-api-resource";
import { AccountChip } from "./account-menu";
import { ActivationGate } from "./activation-gate";
import { Brand } from "./brand";
import { MarketplaceSearch } from "./marketplace-search";
import { NotificationsMenu } from "./notifications-menu";
import { OnboardingGate } from "./onboarding-gate";
import { PopupNotices } from "./popup-notices";
import { SiteFooter } from "./site-footer";

export function ClientLayout() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => window.localStorage.getItem("theme") ?? "dark");
  const mobileMenuRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const isActiveUser = auth.status === "authenticated" && auth.user.active;
  const history = useApiResource(isActiveUser ? "header-finance-history" : null, (signal) => api.getFinanceHistory(signal));

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
  const pendingWithdrawal = history.status === "success" ? pendingWithdrawalTotal(history.data, currentUser.currency) : 0;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__inner">
          <Brand to={DEFAULT_CLIENT_ROUTE} />
          <nav className="main-nav" aria-label="Основная навигация">
            {navigationItems.map((item) => <Link to={item.to} key={item.to} className={isNavigationItemActive(item, location.pathname) ? "active" : undefined} aria-current={isNavigationItemActive(item, location.pathname) ? "page" : undefined}>{item.label}</Link>)}
          </nav>
          <div className="header-right">
            <MarketplaceSearch />
            <div className="header-actions">
              <Link to="/client/finance?tab=topup" className="balance-chip" title="Доступный баланс"><CircleDollarSign size={16} /><span>{formatMoney(currentUser.balance, currentUser.currency)}</span></Link>
              {pendingWithdrawal > 0 ? <span className="balance-chip balance-chip--pending" title="Средства в обработке вывода"><Clock size={16} /><span>{formatMoney(pendingWithdrawal, currentUser.currency)}</span></span> : null}
              <button type="button" className="icon-button" aria-label="Сменить тему" title="Сменить тему" onClick={toggleTheme}><Moon size={19} /></button>
              <NotificationsMenu />
              <AccountChip user={currentUser} />
              <button type="button" className="icon-button header-logout" aria-label="Выйти" title="Выйти" onClick={() => void logout()}><LogOut size={19} /></button>
              <button ref={menuButtonRef} className="menu-button" type="button" aria-expanded={menuOpen} aria-controls="mobile-nav" aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"} onClick={() => setMenuOpen((value) => !value)}>{menuOpen ? <X /> : <Menu />}</button>
            </div>
          </div>
        </div>
        {menuOpen ? (
          <nav id="mobile-nav" className="mobile-menu container" aria-label="Мобильная навигация" ref={mobileMenuRef}>
            {navigationItems.map((item) => <Link to={item.to} key={item.to} className={isNavigationItemActive(item, location.pathname) ? "active" : undefined} onClick={() => setMenuOpen(false)}><item.icon size={18} aria-hidden="true" /> {item.label}</Link>)}
            <button type="button" onClick={toggleTheme}><Moon size={18} aria-hidden="true" /> Сменить тему</button>
            <button type="button" onClick={() => void logout()}><LogOut size={18} aria-hidden="true" /> Выйти</button>
          </nav>
        ) : null}
      </header>
      <div className="app-shell__main"><Outlet /></div>
      <SiteFooter />
      <OnboardingGate />
      <PopupNotices />
    </div>
  );
}
