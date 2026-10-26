// Общая для главной и раздела «Документы» нормализация адресов в формах.
/** «example.com/x» → «https://example.com/x». Возвращает null, если это не похоже на адрес. */
export function normalizeUrl(raw: string): string | null {
  let v = raw.trim();
  if (!v) return "";
  if (!/^https?:\/\//i.test(v)) v = `https://${v.replace(/^\/+/, "")}`;
  try {
    const u = new URL(v);
    return /\.[a-zа-яё]{2,}$/i.test(u.hostname) ? u.toString() : null;
  } catch {
    return null;
  }
}
