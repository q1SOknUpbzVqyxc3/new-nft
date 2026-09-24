import { BadgeCheck, CircleDashed, ShieldCheck, ShieldOff, UserCheck, Wallet } from "lucide-react";
import type { ReactNode } from "react";
import type { User } from "@/lib/api/schemas";

type Tone = "ok" | "neutral" | "bad";

function Row({ icon, label, value, tone }: { icon: ReactNode; label: string; value: string; tone: Tone }) {
  return <li className={`trust-row trust-row--${tone}`}><span className="trust-row__icon" aria-hidden="true">{icon}</span><span className="trust-row__label">{label}</span><strong>{value}</strong></li>;
}

export function AccountStatus({ user }: { user: User }) {
  return (
    <ul className="trust-list" aria-label="Статус аккаунта">
      {user.is_banned ? <Row icon={<UserCheck size={16} />} label="Аккаунт" value="Заблокирован" tone="bad" /> : null}
      <Row icon={user.verificated ? <BadgeCheck size={16} /> : <CircleDashed size={16} />} label="Верификация" value={user.verificated ? "Верифицирован" : "Не верифицирован"} tone={user.verificated ? "ok" : "neutral"} />
      {user.aml_verified === undefined ? null : <Row icon={<ShieldCheck size={16} />} label="AML" value={user.aml_verified ? "Пройден" : "Не пройден"} tone={user.aml_verified ? "ok" : "neutral"} />}
      <Row icon={user.can_withdraw ? <Wallet size={16} /> : <ShieldOff size={16} />} label="Вывод средств" value={user.can_withdraw ? "Доступен" : "Ограничен"} tone={user.can_withdraw ? "ok" : "bad"} />
    </ul>
  );
}
