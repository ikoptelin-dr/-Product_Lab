import nodemailer from "nodemailer";
import { escapeHtml, leadRows, type NotifyChannel } from "./types";

export const emailChannel: NotifyChannel = {
  name: "email",
  enabled: () =>
    Boolean(process.env.SMTP_HOST && process.env.LEAD_EMAIL_FROM && process.env.LEAD_EMAIL_TO),
  async send(e) {
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: (process.env.SMTP_SECURE ?? "true") === "true",
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
    const rows = leadRows(e);
    await transport.sendMail({
      from: process.env.LEAD_EMAIL_FROM,
      to: process.env.LEAD_EMAIL_TO!.split(",").map((s) => s.trim()),
      replyTo: e.lead.email,
      subject: `Новая заявка Proba Lab — ${e.lead.topic} — ${e.lead.company}`,
      text: rows.map(([k, v]) => `${k}: ${v}`).join("\n"),
      html: `<table cellpadding="6" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">${rows
        .map(
          ([k, v]) =>
            `<tr><td style="color:#6b6b6b;border-bottom:1px solid #eee">${escapeHtml(k)}</td><td style="border-bottom:1px solid #eee">${escapeHtml(v)}</td></tr>`,
        )
        .join("")}</table>`,
    });
  },
};
