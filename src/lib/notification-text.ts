const titles: Record<string, string> = {
  nft_bought: "NFT куплен",
  nft_sold: "NFT продан",
  outbid: "Вашу ставку на аукционе перебили",
  auction_won: "Вы выиграли аукцион",
  auction_lost: "Аукцион завершён без вашей победы",
  email_confirmed: "Email подтверждён",
  email_confirmation: "Email подтверждён",
  topup_accept: "Пополнение подтверждено",
  withdraw_created: "Заявка на вывод создана",
  withdraw_accept: "Заявка на вывод одобрена",
  withdraw_decline: "Заявка на вывод отклонена",
  withdraw_decline_by_verif: "Вывод отклонён: требуется верификация",
  withdraw_decline_by_tax: "Вывод отклонён: налоговые и комиссионные обязательства",
  verification_accept: "Верификация пройдена",
  verification_decline: "Верификация отклонена",
  aml_request: "Запрошена AML-проверка",
  aml_accept: "AML-проверка пройдена",
  balance_change: "Баланс аккаунта изменён",
  account_limited: "Аккаунт ограничен в торговле и выводе средств до прохождения процедуры",
  time_limited: "Время на прохождение процедуры — 72 часа, при нарушении срока аккаунт будет заблокирован",
  procedure_completed: "Процедура пройдена, аккаунт более не ограничен"
};

/** `notif_*` translation keys some backends send instead of the bare event code. */
const aliases: Record<string, string> = {
  notif_topup_accept: "topup_accept",
  notif_withdraw_created: "withdraw_created",
  notif_withdraw_accept: "withdraw_accept",
  notif_withdraw_declined: "withdraw_decline",
  notif_verification_accept: "verification_accept",
  notif_verification_decline: "verification_decline",
  notif_aml_request: "aml_request",
  notif_aml_accept: "aml_accept",
  notif_balance_change: "balance_change",
  notif_account_restricted: "account_limited",
  notif_time_restricted: "time_limited",
  notif_procedure_passed: "procedure_completed",
  toast_email_confirmed: "email_confirmed"
};

const reportedUnknownCodes = new Set<string>();

export function formatNotificationText(value: string) {
  const code = value.trim().toLowerCase();
  const known = titles[aliases[code] ?? code];
  if (known) return known;
  if (value.includes(" ")) return value;
  if (!reportedUnknownCodes.has(code)) {
    reportedUnknownCodes.add(code);
    console.info(`[notifications] незнакомый код события: ${JSON.stringify(value)}`);
  }
  const segment = value.split(".").at(-1) ?? value;
  return segment.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}

export function getBalanceDelta(before: number | null | undefined, after: number | null | undefined) {
  if (typeof before !== "number" || typeof after !== "number") return null;
  const delta = after - before;
  return delta === 0 ? null : delta;
}
