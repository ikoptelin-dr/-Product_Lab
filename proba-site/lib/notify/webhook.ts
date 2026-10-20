import { createHmac } from "node:crypto";
import { postJson, type NotifyChannel } from "./types";

/** Универсальный webhook для любой CRM / интеграционной платформы. */
export const webhookChannel: NotifyChannel = {
  name: "webhook",
  enabled: () => Boolean(process.env.CRM_WEBHOOK_URL),
  async send(e) {
    const body = JSON.stringify({
      leadId: e.leadId,
      createdAt: e.createdAt,
      source: e.source,
      utm: e.utm ?? {},
      ...e.lead,
    });
    const headers: Record<string, string> = {};
    if (process.env.CRM_WEBHOOK_SECRET) {
      headers["X-Signature"] =
        "sha256=" + createHmac("sha256", process.env.CRM_WEBHOOK_SECRET).update(body).digest("hex");
    }
    await postJson(process.env.CRM_WEBHOOK_URL!, body, headers);
  },
};
