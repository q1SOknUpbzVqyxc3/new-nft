import { ApiError } from "./client";

const errorMessages: Record<string, string> = {
  invalid_email: "Проверьте адрес электронной почты.",
  invalid_password: "Проверьте пароль.",
  unknown_user: "Пользователь с такими данными не найден.",
  exists_email: "Этот адрес электронной почты уже зарегистрирован.",
  invalid_invite_code: "Промокод не найден.",
  not_have_money: "На балансе недостаточно средств.",
  already_owned: "Этот NFT уже принадлежит вам.",
  already_saled: "NFT уже выставлен на продажу.",
  is_sold: "NFT уже продан.",
  image_not_find: "NFT не найден.",
  own_not_find: "NFT не найден среди ваших активов.",
  u_cant_buy: "Покупки для аккаунта временно недоступны. Обратитесь в поддержку.",
  u_cant_withdraw: "Вывод временно ограничен. Обратитесь в поддержку.",
  invalid_amount: "Введите корректную сумму.",
  invalid_method: "Выберите доступный метод.",
  invalid_details: "Проверьте реквизиты.",
  invalid_bank: "Проверьте выбранный банк.",
  small_balance: "На балансе недостаточно средств.",
  small_payment_amount: "Сумма меньше минимальной для этого способа.",
  unavailable_method: "Этот способ временно недоступен. Выберите другой.",
  "unavailable method": "Этот способ временно недоступен. Выберите другой.",
  invalid_code: "Неверный код подтверждения. Проверьте приложение и попробуйте снова.",
  already_verified: "Email уже подтверждён.",
  unverified: "Email ещё не подтверждён. Проверьте почту и перейдите по ссылке.",
  unauthorized: "Сессия недействительна. Войдите снова.",
  auction_not_found: "Аукцион не найден.",
  auction_not_started: "Аукцион ещё не начался.",
  auction_ended: "Аукцион уже завершён.",
  bid_too_low: "Ставка ниже минимальной. Обновите страницу и повысьте ставку.",
  buy_now_unavailable: "Выкуп сразу для этого лота недоступен.",
  blocked_by_protection: "Запрос заблокирован защитой. Отключите прокси или VPN либо обратитесь в поддержку.",
  service_temporarily_unavailable: "Сервис временно недоступен. Попробуйте позже.",
  invalid_api_response: "Сервер вернул данные в неподдерживаемом формате.",
  request_timeout: "Сервер не ответил вовремя. Попробуйте ещё раз.",
  network_error: "Не удалось связаться с сервером. Проверьте подключение к интернету."
};

export function getUserFacingError(error: unknown) {
  if (error instanceof DOMException && error.name === "AbortError") {
    return "Запрос отменён.";
  }

  if (error instanceof DOMException && error.name === "TimeoutError") {
    return "Сервер не ответил вовремя. Попробуйте ещё раз.";
  }

  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) {
      return "Сессия недействительна. Войдите снова.";
    }

    if (error.status === 429) {
      return "Слишком много запросов. Попробуйте позже.";
    }

    if (error.status === 404) return "Запрошенные данные не найдены.";
    if (error.status === 409) return "Данные уже изменились. Обновите страницу и повторите действие.";
    if (error.status === 422) return "Проверьте заполненные поля.";
    if (error.status >= 500) return "Сервис временно недоступен. Попробуйте позже.";

    return errorMessages[error.code] ?? "Не удалось выполнить запрос. Попробуйте ещё раз.";
  }

  return "Произошла непредвиденная ошибка. Попробуйте ещё раз.";
}
