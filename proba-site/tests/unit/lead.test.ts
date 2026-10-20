import { describe, expect, it, vi } from "vitest";
import { handleLead, type HandleDeps } from "@/lib/handle-lead";
import { leadSchema } from "@/lib/lead-schema";
import { notifyLead } from "@/lib/notify";
import type { NotifyChannel } from "@/lib/notify/types";
import { createMemoryRateLimiter } from "@/lib/rate-limit";

const NOW = 1_800_000_000_000;
const valid = {
  name: "Анна",
  company: "ООО Тест",
  email: "anna@example.com",
  topic: "Аудит «Проба продукта»",
  consent: true,
  startedAt: NOW - 10_000,
};

const deps = (over: Partial<HandleDeps> = {}): HandleDeps => ({
  rateLimiter: createMemoryRateLimiter(5, 60_000, () => NOW),
  notify: vi.fn().mockResolvedValue({ status: "delivered", delivered: ["email"], failed: [] }),
  verifyCaptcha: async () => true,
  isProduction: true,
  now: () => NOW,
  ...over,
});

const h = new Headers({ "x-forwarded-for": "1.2.3.4" });

describe("leadSchema", () => {
  it("принимает валидную заявку и пустые необязательные поля", () => {
    const r = leadSchema.safeParse({ ...valid, position: "", productUrl: "", category: "" });
    expect(r.success).toBe(true);
  });
  it("отклоняет без согласия, с плохим email и не-http ссылкой", () => {
    const r = leadSchema.safeParse({ ...valid, consent: false, email: "x", productUrl: "javascript:alert(1)" });
    expect(r.success).toBe(false);
    const paths = r.success ? [] : r.error.issues.map((i) => i.path[0]);
    expect(paths).toEqual(expect.arrayContaining(["consent", "email", "productUrl"]));
  });
});

describe("handleLead", () => {
  it("доставляет валидную заявку", async () => {
    const d = deps();
    const r = await handleLead(valid, h, d);
    expect(r.status).toBe(200);
    expect(d.notify).toHaveBeenCalledOnce();
  });
  it("honeypot: отвечает ok и ничего не отправляет", async () => {
    const d = deps();
    const r = await handleLead({ ...valid, website: "spam.example" }, h, d);
    expect(r).toEqual({ status: 200, body: { ok: true } });
    expect(d.notify).not.toHaveBeenCalled();
  });
  it("time-trap: слишком быстрая отправка отклоняется", async () => {
    const r = await handleLead({ ...valid, startedAt: NOW - 500 }, h, deps());
    expect(r.status).toBe(400);
    expect(r.body.error).toBe("too_fast");
  });
  it("валидация: возвращает ошибки по полям", async () => {
    const r = await handleLead({ ...valid, name: "", consent: false }, h, deps());
    expect(r.status).toBe(400);
    expect(Object.keys(r.body.errors ?? {})).toEqual(expect.arrayContaining(["name", "consent"]));
  });
  it("rate limit: шестая заявка с одного IP — 429", async () => {
    const d = deps();
    for (let i = 0; i < 5; i++) expect((await handleLead(valid, h, d)).status).toBe(200);
    expect((await handleLead(valid, h, d)).status).toBe(429);
  });
  it("в production без каналов — 503, а не ложный успех", async () => {
    const r = await handleLead(valid, h, deps({ notify: async () => ({ status: "unconfigured", delivered: [], failed: [] }) }));
    expect(r.status).toBe(503);
  });
  it("все каналы упали — 502", async () => {
    const r = await handleLead(valid, h, deps({ notify: async () => ({ status: "failed", delivered: [], failed: ["email"] }) }));
    expect(r.status).toBe(502);
  });
  it("капча не прошла — 400", async () => {
    const r = await handleLead(valid, h, deps({ verifyCaptcha: async () => false }));
    expect(r.body.error).toBe("captcha");
  });
});

describe("notifyLead", () => {
  const envelope = {
    leadId: "id",
    createdAt: new Date(NOW).toISOString(),
    source: "proba-lab-site" as const,
    lead: leadSchema.parse(valid),
  };
  const ch = (name: string, ok: boolean, enabled = true): NotifyChannel => ({
    name,
    enabled: () => enabled,
    send: ok ? async () => {} : async () => Promise.reject(new Error("down")),
  });
  it("успех, если доставлен хотя бы один канал", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const r = await notifyLead(envelope, [ch("a", false), ch("b", true)]);
    expect(r).toMatchObject({ status: "delivered", delivered: ["b"], failed: ["a"] });
  });
  it("failed, если упали все", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await notifyLead(envelope, [ch("a", false)])).status).toBe("failed");
  });
  it("unconfigured, если ничего не включено", async () => {
    expect((await notifyLead(envelope, [ch("a", true, false)])).status).toBe("unconfigured");
  });
});
