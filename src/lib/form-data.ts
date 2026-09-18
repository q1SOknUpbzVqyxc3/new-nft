export function getFormString(data: FormData, key: string, fallback = "") {
  const value = data.get(key);
  return typeof value === "string" ? value : fallback;
}
