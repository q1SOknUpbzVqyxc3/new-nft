const titles: Record<string, string> = {
  nft_bought: "NFT куплен",
  nft_sold: "NFT продан",
  email_confirmation: "Подтверждение email",
  aml_request: "Запрос AML-проверки",
  aml_accept: "AML-проверка пройдена",
  verification_accept: "Верификация подтверждена",
  verification_decline: "Верификация отклонена",
  account_limited: "Аккаунт ограничен"
};

export function formatNotificationText(value: string) {
  const known = titles[value];
  if (known) return known;
  if (value.includes(" ")) return value;
  const segment = value.split(".").at(-1) ?? value;
  return segment.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}

export function getBalanceDelta(before: number | null | undefined, after: number | null | undefined) {
  if (typeof before !== "number" || typeof after !== "number") return null;
  const delta = after - before;
  return delta === 0 ? null : delta;
}
