// Приём заявок с сайта Proba Lab: POST /lead → сообщение в Telegram (и копия в журнал) → переадресация на /spasibo.html.
// Без зависимостей, Node 18+. Запуск на сервере: TG_TOKEN=… TG_CHAT=… node deploy/form-endpoint.mjs (порт 8787, за nginx).
// Сайт собирать с FORM_ENDPOINT=/lead — формы начнут отправляться сюда.
// Форматы: application/x-www-form-urlencoded (все формы) и multipart/form-data (форма «Карты документов» с полем файла).
// Файл состава не пишется на диск: уходит в Telegram документом, в журнал — только имя и размер.
// Ответы об ошибках — страницы в UTF-8 с понятным текстом. Успех (303) — только если заявка сохранилась в журнале или дошла в Telegram.
// TG_API — адрес Telegram Bot API (по умолчанию https://api.telegram.org); для локальной проверки подставляется тестовый получатель.
import { createServer } from "node:http";
import { appendFileSync } from "node:fs";

const PORT = Number(process.env.PORT || 8787);
const { TG_TOKEN = "", TG_CHAT = "" } = process.env;
const TG_API = (process.env.TG_API || "https://api.telegram.org").replace(/\/+$/, "");
const LOG = process.env.LEAD_LOG || "/var/log/proba-leads.jsonl";
const MAX = 64 * 1024; // заявка без файла
const MAX_FILE = 5 * 1024 * 1024; // файл состава (такой же предел проверяет форма в браузере)
const MAX_MULTIPART = MAX_FILE + MAX;
const TG_TIMEOUT = 10_000; // не держим посетителя дольше: заявка к этому моменту уже в журнале

const LABELS = { form: "Форма", page: "Страница", task: "Задача", contact: "Контакт", productUrl: "Ссылка", url: "Ссылка", about: "О проекте", process: "Процесс", company: "Компания", product: "Продукт", composition: "Состав", need: "Что нужно", category: "Категория", comment: "Комментарий", deadline: "Срок", term: "Срок", production: "Производство", channels: "Каналы продаж", details: "О задаче", needs: "Что может понадобиться", hasSite: "Сайт есть", what: "Что делает", where: "Где ведут заявки" };

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
/** Страница ответа в стиле сайта (assets/site.css), всегда в UTF-8. */
function reply(res, code, title, text, back, backLabel = "Вернуться к форме") {
  const html = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${esc(title)} — Proba Lab</title><link rel="stylesheet" href="/assets/site.css"></head><body class="page"><main id="main"><div class="light"><section class="section"><div class="container prose"><h1>${esc(title)}</h1><p>${esc(text)}</p><p><a href="${esc(back)}">${esc(backLabel)}</a> · <a href="/kontakty.html">Контакты</a></p></div></section></div></main></body></html>\n`;
  res.writeHead(code, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" }).end(html);
}
/** Куда вернуть посетителя: путь страницы с формой (только с того же сайта). */
function backOf(req) {
  try {
    const u = new URL(req.headers.referer || "", `http://${req.headers.host}`);
    return u.host === req.headers.host ? u.pathname + u.search : "/";
  } catch { return "/"; }
}
/** multipart/form-data → текстовые поля и файлы (Buffer). */
function parseMultipart(buf, boundary) {
  const fields = {}, files = [];
  const sep = Buffer.from(`--${boundary}`);
  let pos = buf.indexOf(sep);
  while (pos !== -1) {
    const start = pos + sep.length;
    if (buf.slice(start, start + 2).toString() === "--") break;
    const next = buf.indexOf(sep, start);
    if (next === -1) break;
    const part = buf.slice(start + 2, next - 2); // без \r\n после разделителя и перед следующим
    const headEnd = part.indexOf("\r\n\r\n");
    if (headEnd !== -1) {
      const head = part.slice(0, headEnd).toString("utf8");
      const body = part.slice(headEnd + 4);
      const name = head.match(/name="([^"]*)"/i)?.[1];
      const filename = head.match(/filename="([^"]*)"/i)?.[1];
      const type = head.match(/content-type:\s*([^\r\n]+)/i)?.[1] || "application/octet-stream";
      if (name !== undefined) {
        if (filename !== undefined) { if (filename && body.length) files.push({ name, filename, type, data: body }); }
        else fields[name] = fields[name] === undefined ? body.toString("utf8") : `${fields[name]}, ${body.toString("utf8")}`;
      }
    }
    pos = next;
  }
  return { fields, files };
}
const urlencoded = (s) => {
  const out = {};
  for (const [k, v] of new URLSearchParams(s)) out[k] = out[k] === undefined ? v : `${out[k]}, ${v}`;
  return out;
};
// Та же проверка контакта, что в форме (src/site.ts): email, телефон от 10 цифр или Telegram
const okContact = (c) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c) || c.replace(/\D/g, "").length >= 10 || /^(@|https?:\/\/t\.me\/|t\.me\/)[a-z0-9_]{4,}$/i.test(c);

/** Отправка в Telegram: { text } — дошёл ли текст заявки, { files } — дошли ли все файлы. */
async function telegram(data, files) {
  const out = { text: false, files: files.length === 0 };
  if (!TG_TOKEN || !TG_CHAT) return out;
  const text = ["Заявка с сайта Proba Lab", ...Object.entries(data).filter(([k]) => k !== "consent").map(([k, v]) => `${LABELS[k] ?? k}: ${String(v).slice(0, 500)}`)].join("\n");
  try {
    const r = await fetch(`${TG_API}/bot${TG_TOKEN}/sendMessage`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ chat_id: TG_CHAT, text }), signal: AbortSignal.timeout(TG_TIMEOUT) });
    if (!r.ok) return out;
    out.text = true;
    const warn = () => fetch(`${TG_API}/bot${TG_TOKEN}/sendMessage`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ chat_id: TG_CHAT, text: `Внимание: файл к заявке ${data.contact ?? ""} не доставлен (${files.map((f) => f.filename).join(", ")}). Запросите файл у клиента.` }), signal: AbortSignal.timeout(TG_TIMEOUT) }).catch(() => {});
    for (const f of files) {
      const fd = new FormData();
      fd.append("chat_id", TG_CHAT);
      fd.append("caption", `Файл к заявке (${data.contact ?? ""})`.slice(0, 1000));
      fd.append("document", new Blob([f.data], { type: f.type }), f.filename);
      const d = await fetch(`${TG_API}/bot${TG_TOKEN}/sendDocument`, { method: "POST", body: fd, signal: AbortSignal.timeout(TG_TIMEOUT) }).catch(() => null);
      if (!d?.ok) { await warn(); return out; }
    }
    out.files = true;
    return out;
  } catch { return out; }
}

createServer((req, res) => {
  if (req.method !== "POST" || !req.url?.startsWith("/lead")) { res.writeHead(404).end(); return; }
  const back = backOf(req);
  const type = req.headers["content-type"] || "";
  const boundary = type.match(/multipart\/form-data;.*boundary=(?:"([^"]+)"|([^;\s]+))/i);
  const isForm = type.includes("application/x-www-form-urlencoded");
  if (!isForm && !boundary) { reply(res, 415, "Не удалось принять заявку", "Форма отправила данные в неизвестном формате. Вернитесь к форме и отправьте её ещё раз.", back); req.resume(); return; }
  const limit = boundary ? MAX_MULTIPART : MAX;
  const chunks = [];
  let size = 0, tooBig = false;
  req.on("data", (c) => {
    if (tooBig) return;
    size += c.length;
    if (size > limit) {
      tooBig = true;
      if (boundary) reply(res, 413, "Слишком большой файл", "Файл больше 5 МБ. Отправьте форму без файла — состав можно вписать текстом или прислать в переписке.", back);
      else reply(res, 413, "Слишком длинная заявка", "Сократите текст заявки и отправьте форму ещё раз — подробности можно прислать в переписке.", back);
      return;
    }
    chunks.push(c);
  });
  req.on("end", async () => {
    if (tooBig) return;
    const buf = Buffer.concat(chunks);
    const { fields: data, files } = boundary ? parseMultipart(buf, boundary[1] || boundary[2]) : { fields: urlencoded(buf.toString("utf8")), files: [] };
    if (!data.consent) { reply(res, 400, "Нужно согласие на обработку данных", "Отметьте согласие на обработку персональных данных и отправьте форму ещё раз.", back); return; }
    if (!okContact(String(data.contact || "").trim())) { reply(res, 400, "Проверьте контакт", "Укажите email, телефон или Telegram (@ник), чтобы мы могли ответить.", back); return; }
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const lead = { id, at: new Date().toISOString(), ...data, ...(files.length ? { files: files.map((f) => `${f.filename} (${f.data.length} байт)`) } : {}) };
    let logged = false;
    try { appendFileSync(LOG, JSON.stringify(lead) + "\n"); logged = true; } catch (e) { console.error("журнал заявок:", e.message); }
    const sent = await telegram(data, files);
    if (TG_TOKEN && TG_CHAT && !sent.text) console.error("Telegram: заявка не доставлена", logged ? "(сохранена в журнале)" : "");
    if (files.length && !sent.files) console.error(`заявка ${id}: файл не доставлен (${files.map((f) => f.filename).join(", ")}) — запросить у клиента`);
    // Вторая строка журнала — итог доставки: оператор видит, по каким заявкам Telegram или файл не дошли
    if (logged) try { appendFileSync(LOG, JSON.stringify({ status: "delivery", ref: id, at: new Date().toISOString(), telegram: sent.text, filesDelivered: files.length ? sent.files : null }) + "\n"); } catch {}
    // Заявка не сохранилась нигде — не выдаём это за успешную отправку (текст в Telegram или запись в журнале — уже сохранена)
    if (!logged && !sent.text) { reply(res, 502, "Заявка не отправлена", "Не получилось сохранить заявку. Попробуйте ещё раз через минуту или свяжитесь с нами по телефону или почте.", back); return; }
    // Заявка сохранена, но файл не доставлен (Telegram недоступен или не настроен; на диск файлы не пишутся):
    // не показываем «Заявка отправлена» — говорим, что принято, что нет и как прислать файл, без повторного заполнения
    if (files.length && !sent.files) {
      const names = files.map((f) => `«${f.filename}»`).join(", ");
      reply(res, 200, "Заявка принята, файл не дошёл", `Заявку и контакт (${String(data.contact).trim()}) мы сохранили и ответим по нему. Файл ${names} передать не удалось — заполнять форму заново не нужно: пришлите файл в ответ на наше сообщение или напишите нам через страницу «Контакты».`, "/index.html", "На главную");
      return;
    }
    res.writeHead(303, { Location: "/spasibo.html" }).end();
  });
}).listen(PORT, "127.0.0.1", () => console.log(`proba form endpoint on 127.0.0.1:${PORT}`));
