import { CircleDollarSign, History, Images, Store, WalletCards, type LucideIcon } from "lucide-react";

export type NavigationItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  primary: boolean;
};

export const navigationItems: NavigationItem[] = [
  { label: "Маркет", to: "/client/main", icon: Store, primary: true },
  { label: "Мои NFT", to: "/client/owns", icon: Images, primary: true },
  { label: "История", to: "/client/profile/history", icon: History, primary: true },
  { label: "Пополнить", to: "/client/topup", icon: CircleDollarSign, primary: false },
  { label: "Вывести", to: "/client/withdraw", icon: WalletCards, primary: false }
];
