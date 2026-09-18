export type FieldErrors = Record<string, string>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(value: string) {
  if (!value) return "Укажите email.";
  return emailPattern.test(value) ? "" : "Введите корректный email.";
}

export function validatePassword(value: string) {
  if (value.length < 6 || value.length > 20) return "Пароль должен содержать от 6 до 20 символов.";
  if (!/[A-Z]/.test(value)) return "Добавьте хотя бы одну заглавную букву.";
  if (!/[a-z]/.test(value)) return "Добавьте хотя бы одну строчную букву.";
  if (!/[0-9]/.test(value)) return "Добавьте хотя бы одну цифру.";
  if (!/[!@#$%^&*]/.test(value)) return "Добавьте специальный символ: ! @ # $ % ^ & *.";
  return "";
}

export function validateInvite(value: string) {
  return /^\d+$/.test(value) && Number(value) > 0 ? "" : "Введите корректный код приглашения.";
}
