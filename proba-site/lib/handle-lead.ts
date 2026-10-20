import { randomUUID } from "node:crypto";
import { clientIp, isHoneypotTripped, isTooFast, verifySmartCaptcha } from "@/lib/antispam";
import { leadSchema, metaSchema } from "@/lib/lead-schema";
import { notifyLead, type NotifyResult } from "@/lib/notify";
import type { LeadEnvelope } from "@/lib/notify/types";
import { createMemoryRateLimiter, type RateLimiter } from "@/lib/rate-limit";

export interface LeadResponse {
  status: number;
  body: { ok: boolean; error?: string; errors?: Record<string, string> };
}

export interface HandleDeps {
  rateLimiter: RateLimiter;
  notify: (e: LeadEnvelope) => Promise<NotifyResult>;
  verifyCaptcha: (token: string | undefined, ip: string) => Promise<boolean>;
  isProduction: boolean;
  now: () => number;
}

export const defaultDeps: HandleDeps = {
  rateLimiter: createMemoryRateLimiter(
    Number(process.env.RATE_LIMIT_MAX || 5),
    Number(process.env.RATE_LIMIT_WINDOW_SEC || 600) * 1000,
  ),
  notify: notifyLead,
  verifyCaptcha: verifySmartCaptcha,
  isProduction: process.env.NODE_ENV === "production",
  now: () => Date.now(),
};

export async function handleLead(raw: unknown, headers: Headers, deps: HandleDeps = defaultDeps): Promise<LeadResponse> {
  const input = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const meta = metaSchema.safeParse(input);
  const m = meta.success ? meta.data : {};

  if (isHoneypotTripped(m.website)) return { status: 200, body: { ok: true } };

  const parsed = leadSchema.safeParse(input);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      errors[key] ??= issue.message;
    }
    return { status: 400, body: { ok: false, error: "validation", errors } };
  }

  if (isTooFast(m.startedAt, deps.now())) {
    return { status: 400, body: { ok: false, error: "too_fast" } };
  }

  const ip = clientIp(headers);
  if (!deps.rateLimiter.hit(ip).allowed) return { status: 429, body: { ok: false, error: "rate_limited" } };

  if (!(await deps.verifyCaptcha(m.captchaToken, ip))) {
    return { status: 400, body: { ok: false, error: "captcha" } };
  }

  const envelope: LeadEnvelope = {
    leadId: randomUUID(),
    createdAt: new Date(deps.now()).toISOString(),
    source: "proba-lab-site",
    utm: m.utm,
    lead: parsed.data,
  };

  const result = await deps.notify(envelope);
  if (result.status === "delivered") {
    console.info(`[lead ${envelope.leadId}] доставлено: ${result.delivered.join(", ")}`);
    return { status: 200, body: { ok: true } };
  }
  if (result.status === "unconfigured") {
    if (deps.isProduction) {
      console.error(`[lead ${envelope.leadId}] не настроен ни один канал уведомлений — заявка НЕ доставлена`);
      return { status: 503, body: { ok: false, error: "not_configured" } };
    }
    console.warn("[dev] каналы уведомлений не настроены, заявка выведена в консоль:", envelope);
    return { status: 200, body: { ok: true } };
  }
  return { status: 502, body: { ok: false, error: "delivery_failed" } };
}
