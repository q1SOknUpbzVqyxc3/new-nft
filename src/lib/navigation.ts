import { Gavel, Images, LayoutDashboard, Settings, Store, TrendingUp, WalletCards, type LucideIcon } from "lucide-react";

export type NavigationItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  /** Path prefixes that keep this item highlighted (detail pages belong to their section). */
  matches: string[];
};

export const DEFAULT_CLIENT_ROUTE = "/client/dashboard";

export const navigationItems: NavigationItem[] = [
  { label: "Обзор", to: "/client/dashboard", icon: LayoutDashboard, matches: ["/client/dashboard"] },
  { label: "Маркет", to: "/client/main", icon: Store, matches: ["/client/main", "/client/collection", "/client/collectible"] },
  { label: "Аукционы", to: "/client/auctions", icon: Gavel, matches: ["/client/auctions"] },
  { label: "Рейтинги", to: "/client/rankings", icon: TrendingUp, matches: ["/client/rankings"] },
  { label: "Мои NFT", to: "/client/owns", icon: Images, matches: ["/client/owns"] },
  { label: "Финансы", to: "/client/finance", icon: WalletCards, matches: ["/client/finance"] },
  { label: "Настройки", to: "/client/profile", icon: Settings, matches: ["/client/profile"] }
];

export function isNavigationItemActive(item: NavigationItem, pathname: string) {
  return item.matches.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
