import type { Lead } from "@/lib/lead-schema";

export interface LeadEnvelope {
  leadId: string;
  createdAt: string;
  source: "proba-lab-site";
  utm?: Record<string, string>;
  lead: Lead;
}

export interface NotifyChannel {
  name: string;
  enabled(): boolean;
  send(envelope: LeadEnvelope): Promise<void>;
}

export const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const leadRows = (e: LeadEnvelope): [string, string][] => {
  const l = e.lead;
  const rows: [string, string | undefined][] = [
    ["Заявка", e.leadId],
    ["Что нужно", l.topic],
    ["Имя", l.name],
    ["Компания", l.company],
    ["Должность", l.position],
    ["Email", l.email],
    ["Телефон / Telegram", l.contact],
    ["Категория", l.category],
    ["Ссылка на продукт", l.productUrl],
    ["Комментарий", l.message],
    ["UTM", e.utm && Object.keys(e.utm).length ? JSON.stringify(e.utm) : undefined],
    ["Получена", e.createdAt],
  ];
  return rows.filter((r): r is [string, string] => Boolean(r[1]));
};

export async function postJson(url: string, body: unknown, headers: Record<string, string> = {}, retries = 1) {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: typeof body === "string" ? body : JSON.stringify(body),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}
