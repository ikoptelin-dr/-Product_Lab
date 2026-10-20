import { postJson, type NotifyChannel } from "./types";

/** Bitrix24: входящий вебхук с правами CRM, метод crm.lead.add. */
export const bitrix24Channel: NotifyChannel = {
  name: "bitrix24",
  enabled: () => Boolean(process.env.BITRIX24_WEBHOOK_URL),
  async send(e) {
    const base = process.env.BITRIX24_WEBHOOK_URL!.replace(/\/+$/, "");
    const l = e.lead;
    const utm = e.utm ?? {};
    const comments = [
      `Что нужно: ${l.topic}`,
      l.category && `Категория: ${l.category}`,
      l.productUrl && `Продукт: ${l.productUrl}`,
      l.message,
      `ID заявки: ${e.leadId}`,
    ]
      .filter(Boolean)
      .join("\n");
    const res = await postJson(`${base}/crm.lead.add.json`, {
      fields: {
        TITLE: `Proba Lab: ${l.topic} — ${l.company}`,
        NAME: l.name,
        COMPANY_TITLE: l.company,
        POST: l.position,
        EMAIL: [{ VALUE: l.email, VALUE_TYPE: "WORK" }],
        PHONE: l.contact ? [{ VALUE: l.contact, VALUE_TYPE: "WORK" }] : undefined,
        COMMENTS: comments,
        SOURCE_ID: "WEB",
        UTM_SOURCE: utm.utm_source,
        UTM_MEDIUM: utm.utm_medium,
        UTM_CAMPAIGN: utm.utm_campaign,
        UTM_CONTENT: utm.utm_content,
        UTM_TERM: utm.utm_term,
      },
    });
    const data = (await res.json()) as { error?: string };
    if (data.error) throw new Error(`Bitrix24: ${data.error}`);
  },
};
