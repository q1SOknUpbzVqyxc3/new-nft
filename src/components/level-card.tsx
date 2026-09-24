import { useMemo } from "react";
import { formatMoney } from "@/lib/formatters";
import { currencyToRub, rubToCurrency } from "@/lib/currency";
import { calculateLevel, LEVEL_THRESHOLDS_RUB } from "@/lib/levels";
import type { User } from "@/lib/api/schemas";

export function LevelCard({ user }: { user: User }) {
  const progress = useMemo(() => calculateLevel(currencyToRub(user.turnover, user.currency)), [user.turnover, user.currency]);
  // A level supplied by the backend wins over the locally derived one; progress is still computed locally.
  const level = user.level !== undefined ? Math.min(Math.max(1, Math.round(user.level)), progress.maxLevel) : progress.level;

  return (
    <div className="level-card">
      <div className="level-card__head">
        <span className="level-card__badge">Уровень {level}</span>
      </div>
      <div className="progress" role="progressbar" aria-label="Прогресс до следующего уровня" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress.progress * 100)}>
        <div className="progress__fill" style={{ width: `${Math.round(progress.progress * 100)}%` }} />
      </div>
      <p className="profile-muted">{progress.isMax || progress.nextThreshold === null ? "Достигнут максимальный уровень" : `До уровня ${level + 1} осталось ${formatMoney(rubToCurrency(progress.remaining, user.currency), user.currency)}`}</p>
      <ol className="level-ladder">
        {LEVEL_THRESHOLDS_RUB.map((threshold, index) => {
          const number = index + 1;
          const state = number === level ? " level-ladder__row--current" : number < level ? " level-ladder__row--done" : "";
          return <li className={`level-ladder__row${state}`} key={threshold}><span>Уровень {number}{number === level ? <strong>Ваш уровень</strong> : null}</span><span>{formatMoney(rubToCurrency(threshold, user.currency), user.currency)}</span></li>;
        })}
      </ol>
    </div>
  );
}
