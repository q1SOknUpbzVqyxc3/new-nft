import { Check, Lock } from "lucide-react";
import { useMemo } from "react";
import { useAuthenticatedUser } from "@/auth/auth-context";
import { api } from "@/lib/api/services";
import { useApiResource } from "@/lib/hooks/use-api-resource";
import { evaluateAchievements } from "@/lib/market";
import { hasTwoFactor } from "@/lib/two-factor";
import { LevelCard } from "./level-card";

export function AchievementsPanel() {
  const { user } = useAuthenticatedUser();
  const owned = useApiResource("achievements-owned", (signal) => api.getOwnedNfts(signal));
  const ownedCount = owned.status === "success" ? owned.data.length : 0;
  const list = useMemo(() => evaluateAchievements({ user, ownedCount, hasTwoFactor: hasTwoFactor(user) }), [user, ownedCount]);
  const done = list.filter((item) => item.done).length;

  return (
    <div className="achievements">
      <h2>Достижения и уровни</h2>
      <p className="profile-muted">Выполнено {done} из {list.length}. Прогресс считается по вашему обороту, портфелю и настройкам аккаунта.</p>
      <LevelCard user={user} />
      <ul className="achievement-grid">
        {list.map((item) => (
          <li key={item.id} className={item.done ? "achievement achievement--done" : "achievement"}>
            <span className="achievement__icon" aria-hidden="true">{item.done ? <Check size={18} /> : <Lock size={16} />}</span>
            <div><strong>{item.title}</strong><small>{item.description}</small></div>
            <div className="progress" role="progressbar" aria-label={item.title} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(item.progress * 100)}><div className="progress__fill" style={{ width: `${Math.round(item.progress * 100)}%` }} /></div>
          </li>
        ))}
      </ul>
    </div>
  );
}
