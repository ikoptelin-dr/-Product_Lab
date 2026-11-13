// Приём заявок с сайта Proba Lab: POST /lead → сообщение в Telegram и/или письмо на почту (и копия в журнал) → переадресация на /spasibo.html.
// Без зависимостей, Node 18+. Linux: TG_TOKEN=… TG_CHAT=… node deploy/form-endpoint.mjs (порт 8787, за nginx).
// Windows: подключается в deploy/server.mjs (сайт + заявки в одном процессе), см. deploy/windows/.
// Сайт собирать с FORM_ENDPOINT=/lead — формы начнут отправляться сюда.
// Форматы: application/x-www-form-urlencoded (все формы) и multipart/form-data (форма «Карты документов» с полем файла).
// Файл состава не пишется на диск: уходит в Telegram документом, в журнал — только имя и размер.
// Ответы об ошибках — страницы в UTF-8 с понятным текстом. Успех (303) — только если заявка сохранилась в журнале или дошла в Telegram.
// TG_API — адрес Telegram Bot API (по умолчанию https://api.telegram.org); для локальной проверки подставляется тестовый получатель.
import { createServer } from "node:http";
import { appendFileSync } from "node:fs";
import { connect } from "node:tls";
import { pathToFileURL } from "node:url";

const PORT = Number(process.env.PORT || 8787);
const { TG_TOKEN = "", TG_CHAT = "" } = process.env;
const TG_API = (process.env.TG_API || "https://api.telegram.org").replace(/\/+$/, "");
// LEAD_LOG=off — заявки не хранятся на сервере, только пересылаются (Telegram / почта)
const LOG = process.env.LEAD_LOG || "/var/log/proba-leads.jsonl";
const NO_LOG = LOG.toLowerCase() === "off";
const MAX = 64 * 1024; // заявка без файла
const MAX_FILE = 5 * 1024 * 1024; // файл состава (такой же предел проверяет форма в браузере)
const MAX_MULTIPART = MAX_FILE + MAX;
const TG_TIMEOUT = 10_000; // не держим посетителя дольше: заявка к этому моменту уже в журнале
// Почта: SMTP через TLS (порт 465). По умолчанию Яндекс: SMTP_USER — ящик, SMTP_PASS — пароль приложения.
const SMTP_HOST = process.env.SMTP_HOST || "smtp.yandex.ru";
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const { SMTP_USER = "", SMTP_PASS = "" } = process.env;
const MAIL_TO = (process.env.MAIL_TO || SMTP_USER).split(",").map((a) => a.trim()).filter(Boolean);
const MAIL_TIMEOUT = 20_000;
// CRM Битрикс24: адрес входящего вебхука с правом «CRM» (https://ваш-портал.bitrix24.ru/rest/1/ключ/). В нём ключ — не публиковать.
const B24 = (process.env.B24_WEBHOOK || "").trim().replace(/\/+$/, "");
const B24_TIMEOUT = 10_000;

const LABELS = { form: "Форма", page: "Страница", task: "Задача", contact: "Контакт", productUrl: "Ссылка", url: "Ссылка", about: "О проекте", process: "Процесс", company: "Компания", product: "Продукт", composition: "Состав", need: "Что нужно", category: "Категория", comment: "Комментарий", deadline: "Срок", term: "Срок", production: "Производство", channels: "Каналы продаж", details: "О задаче", needs: "Что может понадобиться", hasSite: "Сайт есть", what: "Что делает", where: "Где ведут заявки", utm_source: "UTM source", utm_medium: "UTM medium", utm_campaign: "UTM campaign", utm_content: "UTM content", utm_term: "UTM term", ref: "Пришёл с сайта", landing: "Страница входа" };

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

/** Письмо через SMTP (TLS, AUTH LOGIN). Без зависимостей. Ошибка — исключение с ответом сервера (пароль в него не попадает). */
export function sendMail({ subject, text, files = [], replyTo = "" }) {
  const oneLine = (v) => String(v).replace(/[\r\n]+/g, " ").trim();
  const enc = (v) => `=?UTF-8?B?${Buffer.from(oneLine(v)).toString("base64")}?=`;
  const b64 = (buf) => buf.toString("base64").replace(/.{1,76}/g, "$&\r\n");
  const head = [`From: ${enc("Сайт Proba Lab")} <${SMTP_USER}>`, `To: ${MAIL_TO.join(", ")}`, `Subject: ${enc(subject)}`, `Date: ${new Date().toUTCString()}`, `Message-ID: <${Date.now().toString(36)}.${Math.random().toString(36).slice(2)}@proba-lab.ru>`, "MIME-Version: 1.0"];
  if (/^[^\s@<>,]+@[^\s@<>,]+\.[^\s@<>,]{2,}$/.test(replyTo)) head.push(`Reply-To: ${replyTo}`);
  const textPart = ["Content-Type: text/plain; charset=utf-8", "Content-Transfer-Encoding: base64", "", b64(Buffer.from(text))].join("\r\n");
  let body;
  if (!files.length) body = [...head, textPart].join("\r\n");
  else {
    const bnd = `proba-${Math.random().toString(36).slice(2)}`;
    const parts = files.map((f) => [`Content-Type: ${oneLine(f.type).replace(/[^\w.+\/-]/g, "") || "application/octet-stream"}`, "Content-Transfer-Encoding: base64", `Content-Disposition: attachment; filename*=UTF-8''${encodeURIComponent(oneLine(f.filename))}`, "", b64(f.data)].join("\r\n"));
    body = [...head, `Content-Type: multipart/mixed; boundary="${bnd}"`, "", `--${bnd}`, textPart, ...parts.map((x) => `--${bnd}\r\n${x}`), `--${bnd}--`, ""].join("\r\n");
  }
  return new Promise((resolve, reject) => {
    const sock = connect({ host: SMTP_HOST, port: SMTP_PORT, servername: SMTP_HOST });
    const timer = setTimeout(() => fail(new Error(`нет ответа от ${SMTP_HOST}:${SMTP_PORT}`)), MAIL_TIMEOUT);
    let buf = "", waiter = null, done = false;
    function fail(e) { if (done) return; done = true; clearTimeout(timer); sock.destroy(); reject(e); }
    function check() {
      if (!waiter) return;
      const lines = buf.split("\r\n");
      for (let i = 0; i < lines.length - 1; i++) {
        if (/^\d{3}( |$)/.test(lines[i])) { const w = waiter; waiter = null; buf = lines.slice(i + 1).join("\r\n"); w(lines.slice(0, i + 1).join(" | ")); return; }
      }
    }
    sock.on("error", (e) => fail(new Error(`${SMTP_HOST}:${SMTP_PORT}: ${e.message}`)));
    sock.on("data", (c) => { buf += c.toString("utf8"); check(); });
    const step = async (line, ok, what) => {
      if (line !== null) sock.write(line + "\r\n");
      const resp = await new Promise((r) => { waiter = r; check(); });
      if (!ok.test(resp)) throw new Error(`${what}: ${resp.slice(0, 300)}`);
    };
    (async () => {
      await step(null, /^220/, "приветствие сервера");
      await step("EHLO proba-lab.ru", /^250/, "EHLO");
      await step("AUTH LOGIN", /^334/, "вход");
      await step(Buffer.from(SMTP_USER).toString("base64"), /^334/, "вход (логин)");
      await step(Buffer.from(SMTP_PASS).toString("base64"), /^235/, "вход (логин или пароль приложения не подошли)");
      await step(`MAIL FROM:<${SMTP_USER}>`, /^250/, "отправитель");
      for (const to of MAIL_TO) await step(`RCPT TO:<${to}>`, /^25[01]/, `получатель ${to}`);
      await step("DATA", /^354/, "DATA");
      sock.write(body + "\r\n.\r\n");
      await step(null, /^250/, "письмо не принято");
      sock.write("QUIT\r\n");
      done = true; clearTimeout(timer); sock.end(); resolve();
    })().catch(fail);
  });
}
/** Заявка на почту: true — письмо (с файлами) принято почтовым сервером. */
async function email(data, files) {
  if (!SMTP_USER || !SMTP_PASS || !MAIL_TO.length) return false;
  const text = ["Заявка с сайта Proba Lab", "", ...Object.entries(data).filter(([k]) => k !== "consent").map(([k, v]) => `${LABELS[k] ?? k}: ${String(v).slice(0, 2000)}`), ...(files.length ? ["", `Файлы во вложении: ${files.map((f) => f.filename).join(", ")}`] : [])].join("\n");
  try {
    await sendMail({ subject: `Заявка с сайта: ${String(data.contact ?? "").slice(0, 80)}`, text, files, replyTo: String(data.contact ?? "").trim() });
    return true;
  } catch (e) { console.error("почта:", e.message); return false; }
}

/** Лид в Битрикс24 (crm.lead.add): true — лид создан. Контакт раскладывается в email, телефон или мессенджер. */
async function bitrix(data) {
  if (!/^https:\/\/[^/]+\/rest\/\d+\/[^/]+$/.test(B24)) return false;
  const c = String(data.contact ?? "").trim();
  const fields = {
    TITLE: `Заявка с сайта: ${LABELS[data.form] ?? data.form ?? "форма"} — ${c}`.slice(0, 250),
    SOURCE_ID: "WEB",
    SOURCE_DESCRIPTION: `proba-lab.ru${String(data.page ?? "")}`.slice(0, 250),
    OPENED: "Y",
    COMMENTS: Object.entries(data).filter(([k]) => k !== "consent").map(([k, v]) => `${LABELS[k] ?? k}: ${String(v).slice(0, 2000)}`).join("\n"),
  };
  if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c)) fields.EMAIL = [{ VALUE: c, VALUE_TYPE: "WORK" }];
  else if (c.replace(/\D/g, "").length >= 10 && !c.startsWith("@")) fields.PHONE = [{ VALUE: c, VALUE_TYPE: "WORK" }];
  else fields.IM = [{ VALUE: c, VALUE_TYPE: "TELEGRAM" }];
  if (data.company) fields.COMPANY_TITLE = String(data.company).slice(0, 250);
  for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) if (data[k]) fields[k.toUpperCase()] = String(data[k]).slice(0, 250);
  try {
    const r = await fetch(`${B24}/crm.lead.add.json`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ fields }), signal: AbortSignal.timeout(B24_TIMEOUT) });
    const j = await r.json().catch(() => ({}));
    if (r.ok && j.result) return true;
    console.error("Битрикс24:", r.status, j.error_description || j.error || "лид не создан");
    return false;
  } catch (e) { console.error("Битрикс24:", e.message); return false; }
}
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

/** Обработчик POST /lead — его же подключает общий сервер deploy/server.mjs (Windows). */
export function leadHandler(req, res) {
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
    if (!NO_LOG) try { appendFileSync(LOG, JSON.stringify(lead) + "\n"); logged = true; } catch (e) { console.error("журнал заявок:", e.message); }
    const [tg, mailed, inCrm] = await Promise.all([telegram(data, files), email(data, files), bitrix(data)]);
    // Доставлено, если дошло хотя бы одним способом: Telegram, письмо (файлы — вложением) или лид в CRM (без файлов)
    const sent = { text: tg.text || mailed || inCrm, files: tg.files || mailed };
    if (TG_TOKEN && TG_CHAT && !tg.text) console.error("Telegram: заявка не доставлена", logged ? "(сохранена в журнале)" : "");
    if (SMTP_USER && SMTP_PASS && !mailed) console.error("почта: заявка не доставлена", logged ? "(сохранена в журнале)" : "");
    if (B24 && !inCrm) console.error("Битрикс24: лид не создан", logged ? "(заявка сохранена в журнале)" : "");
    if (files.length && !sent.files) console.error(`заявка ${id}: файл не доставлен (${files.map((f) => f.filename).join(", ")}) — запросить у клиента`);
    // Вторая строка журнала — итог доставки: оператор видит, по каким заявкам Telegram или файл не дошли
    if (logged) try { appendFileSync(LOG, JSON.stringify({ status: "delivery", ref: id, at: new Date().toISOString(), telegram: tg.text, email: mailed, crm: inCrm, filesDelivered: files.length ? sent.files : null }) + "\n"); } catch {}
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
}

// Запуск отдельным приёмником (за nginx): node deploy/form-endpoint.mjs
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  createServer(leadHandler).listen(PORT, "127.0.0.1", () => console.log(`proba form endpoint on 127.0.0.1:${PORT}`));
}
