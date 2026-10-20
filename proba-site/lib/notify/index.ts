import { bitrix24Channel } from "./bitrix24";
import { emailChannel } from "./email";
import { telegramChannel } from "./telegram";
import type { LeadEnvelope, NotifyChannel } from "./types";
import { webhookChannel } from "./webhook";

export const defaultChannels: NotifyChannel[] = [emailChannel, telegramChannel, webhookChannel, bitrix24Channel];

export type NotifyResult =
  | { status: "delivered"; delivered: string[]; failed: string[] }
  | { status: "failed"; delivered: []; failed: string[] }
  | { status: "unconfigured"; delivered: []; failed: [] };

/** Рассылает заявку во все включённые каналы. Успех — если доставлено хотя бы в один. */
export async function notifyLead(envelope: LeadEnvelope, channels = defaultChannels): Promise<NotifyResult> {
  const active = channels.filter((c) => c.enabled());
  if (active.length === 0) return { status: "unconfigured", delivered: [], failed: [] };

  const results = await Promise.allSettled(active.map((c) => c.send(envelope)));
  const delivered: string[] = [];
  const failed: string[] = [];
  results.forEach((r, i) => {
    const name = active[i]!.name;
    if (r.status === "fulfilled") delivered.push(name);
    else {
      failed.push(name);
      console.error(`[lead ${envelope.leadId}] канал ${name} не доставил:`, r.reason instanceof Error ? r.reason.message : r.reason);
    }
  });
  return delivered.length > 0
    ? { status: "delivered", delivered, failed }
    : { status: "failed", delivered: [], failed };
}

export const enabledChannelNames = () => defaultChannels.filter((c) => c.enabled()).map((c) => c.name);
