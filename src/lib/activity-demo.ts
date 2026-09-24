import type { ActivityEvent } from "./api/schemas";

/**
 * PREVIEW ONLY (VITE_ACTIVITY_DEMO=1): sample events in the anonymised style the arbitrage site's backend produces,
 * so the feed can be reviewed before the backend ships `/api/activity-feed`. Never enabled by default.
 */
export function isActivityDemoEnabled() {
  return import.meta.env["VITE_ACTIVITY_DEMO"] === "1";
}

const COLLECTIONS = ["Aurora Drift", "Neon Harbor", "Quiet Orbit", "Glass Garden", "Solar Static", "Paper Comet"];
const COLORS = ["#6c5ce7", "#24c78e", "#ffb829", "#4da3ff"];

const templates: Array<(n: number, c: string) => string> = [
  (n, c) => `Пользователь купил «${c} #${10 + (n * 7) % 90}» — ${100 + (n * 37) % 400} ₽`,
  (n, c) => `Пользователь сделал ставку на «${c} #${10 + (n * 11) % 90}» — ${90 + (n * 13) % 200} ₽`,
  (n, c) => `Пользователь выиграл аукцион — «${c} #${10 + (n * 5) % 90}» за ${150 + (n * 17) % 300} ₽`,
  (n, c) => `Начался аукцион на «${c} #${10 + (n * 3) % 90}» — старт ${80 + (n * 9) % 120} ₽`,
  (n) => `Пользователь пополнил баланс — ${(1 + (n % 5)) * 1000} ₽`,
  (n) => `Пользователь вывел средства — ${(1 + (n % 4)) * 1500} ₽`,
  (n) => `Пользователь достиг уровня ${2 + (n % 6)}`,
  (_n, c) => `В каталоге появилась коллекция «${c}» (Ethereum)`,
  (n, c) => `Floor price коллекции «${c}» вырос на ${5 + (n % 15)} % за 24 часа`,
  (n, c) => `Аукцион на «${c} #${10 + (n * 5) % 90}» завершится через 15 минут`
];

export function demoActivityEvent(n: number, now: number): ActivityEvent {
  const template = templates[n % templates.length] ?? templates[0]!;
  return { id: `demo-${n}`, text: template(n, COLLECTIONS[n % COLLECTIONS.length] ?? "Aurora Drift"), ts: Math.floor((now - (n % 7) * 240_000) / 1000), color: COLORS[n % COLORS.length] };
}

/** The first poll returns a full page; later polls append one fresh event so the staggered reveal is visible. */
export function demoActivityPage(poll: number, count: number, now = Date.now()): ActivityEvent[] {
  const total = count + poll;
  return Array.from({ length: count }, (_, index) => demoActivityEvent(total - 1 - index, now));
}
