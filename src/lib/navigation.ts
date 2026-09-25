import { Gavel, Images, LayoutDashboard, Settings, Store, TrendingUp, WalletCards, type LucideIcon } from "lucide-react";
import type { TranslationKey } from "./i18n";

export type NavigationItem = {
  labelKey: TranslationKey;
  to: string;
  icon: LucideIcon;
  /** Path prefixes that keep this item highlighted (detail pages belong to their section). */
  matches: string[];
};

export const DEFAULT_CLIENT_ROUTE = "/client/dashboard";

export const navigationItems: NavigationItem[] = [
  { labelKey: "nav_dashboard", to: "/client/dashboard", icon: LayoutDashboard, matches: ["/client/dashboard"] },
  { labelKey: "nav_market", to: "/client/main", icon: Store, matches: ["/client/main", "/client/collection", "/client/collectible"] },
  { labelKey: "nav_auctions", to: "/client/auctions", icon: Gavel, matches: ["/client/auctions"] },
  { labelKey: "nav_rankings", to: "/client/rankings", icon: TrendingUp, matches: ["/client/rankings"] },
  { labelKey: "nav_owns", to: "/client/owns", icon: Images, matches: ["/client/owns"] },
  { labelKey: "nav_finance", to: "/client/finance", icon: WalletCards, matches: ["/client/finance"] },
  { labelKey: "nav_settings", to: "/client/profile", icon: Settings, matches: ["/client/profile"] }
];

export function isNavigationItemActive(item: NavigationItem, pathname: string) {
  return item.matches.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
