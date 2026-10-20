import { escapeHtml, leadRows, postJson, type NotifyChannel } from "./types";

export const telegramChannel: NotifyChannel = {
  name: "telegram",
  enabled: () => Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
  async send(e) {
    const text =
      `<b>Новая заявка Proba Lab</b>\n` +
      leadRows(e)
        .map(([k, v]) => `<b>${escapeHtml(k)}:</b> ${escapeHtml(v)}`)
        .join("\n");
    await postJson(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text: text.slice(0, 4000),
      parse_mode: "HTML",
      disable_web_page_preview: true,
    });
  },
};
