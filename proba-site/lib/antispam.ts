export const MIN_FILL_MS = 3000;

/** Honeypot заполнен — это бот. Отвечаем «успехом», ничего не отправляя. */
export const isHoneypotTripped = (website?: string) => Boolean(website && website.trim());

/** Форму отправили быстрее, чем человек успевает её заполнить. */
export const isTooFast = (startedAt?: number, now = Date.now()) =>
  typeof startedAt !== "number" || now - startedAt < MIN_FILL_MS;

export function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? "unknown";
}

/** Серверная проверка Yandex SmartCaptcha. Включается наличием SMARTCAPTCHA_SERVER_KEY. */
export async function verifySmartCaptcha(token: string | undefined, ip: string): Promise<boolean> {
  const secret = process.env.SMARTCAPTCHA_SERVER_KEY;
  if (!secret) return true;
  if (!token) return false;
  const params = new URLSearchParams({ secret, token, ip });
  try {
    const res = await fetch(`https://smartcaptcha.yandexcloud.net/validate?${params}`, {
      signal: AbortSignal.timeout(5000),
    });
    const data = (await res.json()) as { status?: string };
    return data.status === "ok";
  } catch {
    return false;
  }
}
