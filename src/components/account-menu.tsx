import { BadgeCheck, ShieldCheck, UserRound, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import type { User } from "@/lib/api/schemas";
import { resolveAvatarUrl } from "@/lib/api/client";
import { useAvatarVersion } from "@/lib/avatar";
import { SafeMedia } from "./ui/safe-media";

function Badge({ ok, label, children }: { ok: boolean | undefined; label: string; children: React.ReactNode }) {
  const tone = ok === undefined ? "unknown" : ok ? "ok" : "bad";
  return <span className={`account-chip__badge account-chip__badge--${tone}`} title={label} role="img" aria-label={label}>{children}</span>;
}

/** Account chip in the header: avatar, name and the three trust badges (verified / withdrawals / AML). */
export function AccountChip({ user }: { user: User }) {
  const name = user.username ? `@${user.username}` : user.email;
  const version = useAvatarVersion(user.id);
  return (
    <Link to="/client/profile" className="account-chip" title={user.email}>
      <span className="account-chip__avatar">{user.avatar ? <SafeMedia src={resolveAvatarUrl(user.id, version || user.avatar)} alt="" credentials fallback={<UserRound size={18} aria-hidden="true" />} /> : <UserRound size={18} aria-hidden="true" />}</span>
      <span className="account-chip__name">{name}</span>
      <span className="account-chip__badges">
        <Badge ok={user.verificated} label={user.verificated ? "Аккаунт верифицирован" : "Аккаунт не верифицирован"}><BadgeCheck size={14} aria-hidden="true" /></Badge>
        <Badge ok={user.can_withdraw} label={user.can_withdraw ? "Вывод доступен" : "Вывод ограничен"}><Wallet size={14} aria-hidden="true" /></Badge>
        {user.aml_verified === undefined ? null : <Badge ok={user.aml_verified} label={user.aml_verified ? "AML пройден" : "AML не пройден"}><ShieldCheck size={14} aria-hidden="true" /></Badge>}
      </span>
    </Link>
  );
}
