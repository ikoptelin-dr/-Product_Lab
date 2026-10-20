// In-memory ограничитель по ключу (IP). Для нескольких инстансов замените на Redis — интерфейс тот же.
export interface RateLimiter {
  hit(key: string): { allowed: boolean; remaining: number };
}

export function createMemoryRateLimiter(max: number, windowMs: number, now = () => Date.now()): RateLimiter {
  const hits = new Map<string, number[]>();
  return {
    hit(key) {
      const t = now();
      const recent = (hits.get(key) ?? []).filter((ts) => t - ts < windowMs);
      if (recent.length >= max) {
        hits.set(key, recent);
        return { allowed: false, remaining: 0 };
      }
      recent.push(t);
      hits.set(key, recent);
      if (hits.size > 10_000) hits.delete(hits.keys().next().value as string);
      return { allowed: true, remaining: max - recent.length };
    },
  };
}
