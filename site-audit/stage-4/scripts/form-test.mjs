// Локальная проверка доставки заявок: сборка с FORM_ENDPOINT=/lead + приёмник deploy/form-endpoint.mjs + тестовый получатель вместо Telegram.
// Всё только на 127.0.0.1. Реальный Telegram и реальные заявки не используются. Это НЕ проверка боевой доставки.
// node form-test.mjs <endpoint.mjs> <dist-form> <out.json> <work-dir>
import { chromium } from "/home/user/-Product_Lab/proba-site/node_modules/@playwright/test/index.mjs";
import { createServer, request } from "node:http";
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, rmSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const [ENDPOINT, DIST, OUT, WORK, MODE] = process.argv.slice(2);
const NO_TG = MODE === "no-tg"; // старый приёмник не умеет TG_API — токен не передаём, чтобы запросы не уходили во внешний Telegram
const P_TG = 8792, P_EP = 8791, P_EP_BAD = 8794, P_SITE = 8793;
const results = [];
const ok = (name, pass, info) => { results.push({ name, pass: !!pass, info }); console.log(pass ? "✓" : "✗", name); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 1. Тестовый получатель вместо api.telegram.org: записывает запросы, по флагу отвечает ошибкой
const tg = { calls: [], fail: false, failDoc: false, hang: false };
const tgSrv = createServer((req, res) => {
  const chunks = [];
  req.on("data", (c) => chunks.push(c));
  req.on("end", () => {
    const body = Buffer.concat(chunks);
    const method = req.url.split("/").pop();
    const rec = { method, type: req.headers["content-type"] };
    if (method === "sendMessage") rec.text = JSON.parse(body.toString("utf8")).text;
    else { const s = body.toString("latin1"); rec.filename = Buffer.from((s.match(/filename="([^"]*)"/) || [])[1] || "", "latin1").toString("utf8"); rec.bytes = body.length; }
    tg.calls.push(rec);
    if (tg.hang) return; // не отвечаем: проверка тайм-аута приёмника
    const bad = tg.fail || (tg.failDoc && method === "sendDocument");
    res.writeHead(bad ? 500 : 200, { "content-type": "application/json" }).end(JSON.stringify({ ok: !tg.fail }));
  });
}).listen(P_TG, "127.0.0.1");

// 2. Приёмник: обычный (журнал пишется) и «без журнала» (путь, куда записать нельзя)
const LOG = join(WORK, "leads-test.jsonl");
rmSync(LOG, { force: true });
const startEp = (port, log) => {
  const p = spawn(process.execPath, [ENDPOINT], { env: { PATH: process.env.PATH, PORT: String(port), ...(NO_TG ? {} : { TG_TOKEN: "test-token", TG_CHAT: "1", TG_API: `http://127.0.0.1:${P_TG}` }), LEAD_LOG: log }, stdio: ["ignore", "pipe", "pipe"] });
  p.stderr.on("data", (d) => (p.err = (p.err || "") + d));
  return p;
};
let ep = startEp(P_EP, LOG);
const epBad = startEp(P_EP_BAD, "/proc/proba-no-such-dir/leads.jsonl");
const P_EP_NOTG = 8795;
const LOG_NOTG = join(WORK, "leads-notg.jsonl"); rmSync(LOG_NOTG, { force: true });
const epNoTg = spawn(process.execPath, [ENDPOINT], { env: { PATH: process.env.PATH, PORT: String(P_EP_NOTG), LEAD_LOG: LOG_NOTG }, stdio: ["ignore", "pipe", "pipe"] });
let upstream = P_EP;

// 3. Мини-nginx: статика dist + POST /lead → приёмник; если приёмник недоступен — 502, как у nginx
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".png": "image/png", ".woff2": "font/woff2", ".xml": "application/xml" };
const siteSrv = createServer((req, res) => {
  if (req.method === "POST" && req.url.startsWith("/lead")) {
    // как client_max_body_size 6m в deploy/nginx.conf
    if (Number(req.headers["content-length"] || 0) > 6 * 1024 * 1024) { res.writeHead(413, { "content-type": "text/html" }).end("<html><body><h1>413 Request Entity Too Large</h1></body></html>"); req.resume(); return; }
    const up = request({ host: "127.0.0.1", port: upstream, method: "POST", path: req.url, headers: req.headers }, (r) => { res.writeHead(r.statusCode, r.headers); r.pipe(res); });
    up.on("error", () => res.writeHead(502, { "content-type": "text/html" }).end("<html><body><h1>502 Bad Gateway</h1></body></html>"));
    req.pipe(up);
    return;
  }
  let p = decodeURIComponent(req.url.split("?")[0]); if (p.endsWith("/")) p += "index.html";
  const f = join(DIST, p);
  if (!f.startsWith(DIST) || !existsSync(f) || statSync(f).isDirectory()) { res.writeHead(404).end(); return; }
  res.writeHead(200, { "content-type": TYPES[extname(f)] || "application/octet-stream" }).end(readFileSync(f));
}).listen(P_SITE, "127.0.0.1");
await sleep(600);

const BASE = `http://127.0.0.1:${P_SITE}/`;
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, locale: "ru-RU" });
await ctx.route("**/*", (r) => (r.request().url().startsWith(BASE) ? r.continue() : r.abort()));
const p = await ctx.newPage();

async function fillKarta(contact, { file } = {}) {
  await p.goto(BASE + "dokumenty/karta-dokumentov.html");
  const f = p.locator("#kf-form");
  await f.locator('[name="product"]').fill("Магний B6, капсулы");
  await f.locator('[name="composition"]').fill("Магния цитрат 400 мг, витамин B6 2 мг — «тест кириллицы»");
  // Файл передаём из буфера: путь с кириллицей в имени Playwright 1.56 молча не прикрепляет (особенность инструмента, не сайта)
  if (file) await f.locator('[name="compositionFile"]').setInputFiles({ name: file.split("/").pop(), mimeType: "application/pdf", buffer: readFileSync(file) });
  await f.locator('[name="contact"]').fill(contact);
  await f.locator('[name="consent"]').check({ force: true });
  return f;
}
const submitAndWait = async (f) => { await Promise.all([p.waitForLoadState("load").catch(() => {}), f.locator('button[type="submit"]').click()]); await sleep(800); };
const pageState = async () => ({ url: p.url().replace(BASE, ""), title: await p.title().catch(() => ""), charset: await p.evaluate(() => document.characterSet).catch(() => ""), h1: await p.locator("h1").first().textContent().catch(() => ""), body: (await p.locator("body").textContent().catch(() => "")).replace(/\s+/g, " ").trim().slice(0, 300) });

// A. Карта документов без файла (multipart, т. к. в форме есть поле файла)
tg.calls = [];
let f = await fillKarta("test@example.com");
await submitAndWait(f);
let st = await pageState();
ok("A. «Карта документов» без файла: заявка принята (→ spasibo.html)", st.url === "spasibo.html", st);
ok("A. кириллица дошла до получателя без искажений", tg.calls.some((c) => c.method === "sendMessage" && c.text.includes("Магния цитрат 400 мг") && c.text.includes("«тест кириллицы»")), tg.calls.map((c) => c.text?.slice(0, 160)));

// B. Карта документов с файлом (имя файла кириллицей)
const tmpFile = join(WORK, "состав-тест.pdf");
writeFileSync(tmpFile, Buffer.concat([Buffer.from("%PDF-1.4\n"), Buffer.alloc(200 * 1024, 65)])); // 200 КБ — больше прежнего предела nginx 64k
tg.calls = [];
f = await fillKarta("+7 900 000-00-00", { file: tmpFile });
await submitAndWait(f);
st = await pageState();
ok("B. «Карта документов» с файлом: заявка принята", st.url === "spasibo.html", st);
const doc = tg.calls.find((c) => c.method === "sendDocument");
ok("B. файл передан получателю документом, имя без искажений", doc && doc.filename === "состав-тест.pdf", tg.calls);
const logTxt = existsSync(LOG) ? readFileSync(LOG, "utf8") : "";
ok("B. в журнале — только имя и размер файла, без содержимого", /состав-тест\.pdf \(\d+ байт\)/.test(logTxt) && !logTxt.includes("AAAAAAAAAA"), logTxt.slice(-300));

// C. Обычная форма (urlencoded) — регрессия
tg.calls = [];
await p.goto(BASE + "kontakty.html");
const pf = p.locator("#pf-form");
await pf.locator('input[name="task"]').first().check({ force: true });
await pf.locator('[name="contact"]').fill("@proba_test");
await pf.locator('[name="consent"]').check({ force: true });
await submitAndWait(pf);
st = await pageState();
ok("C. форма «Обсудить задачу» (urlencoded): заявка принята", st.url === "spasibo.html" && tg.calls.some((c) => c.method === "sendMessage"), st);

// D. Неверные данные мимо проверки в браузере (нативная отправка): понятное сообщение в UTF-8
for (const [label, contact, consent] of [["без согласия", "test@example.com", false], ["неверный контакт", "abc", true]]) {
  f = await fillKarta(contact);
  if (!consent) await f.locator('[name="consent"]').uncheck({ force: true });
  await Promise.all([p.waitForLoadState("load").catch(() => {}), p.evaluate(() => { const fm = document.querySelector("#kf-form"); fm.action = "/lead"; fm.method = "post"; fm.enctype = "multipart/form-data"; HTMLFormElement.prototype.submit.call(fm); })]);
  await sleep(600);
  st = await pageState();
  const readable = /Нужно согласие|Проверьте контакт/.test(st.h1 || "") && !/Ð|Ñ/.test(st.body);
  ok(`D. ${label}: отклонено с понятным сообщением, кириллица читается`, st.url.startsWith("lead") && readable && /utf-8/i.test(st.charset), st);
  if (label === "без согласия") await p.screenshot({ path: join(WORK, "D-error-page.png") });
}

// E. Приёмник недоступен (ошибка сети): посетитель не видит успеха; после «Назад» не висит «Отправляем…»
upstream = 1; // закрытый порт → прокси отвечает 502, как nginx без upstream
f = await fillKarta("test@example.com");
await submitAndWait(f);
st = await pageState();
ok("E. приёмник недоступен: страницы «Заявка отправлена» нет", st.url !== "spasibo.html" && !/Заявка отправлена/.test(st.body), st);
await p.goBack().catch(() => {}); await sleep(600);
const statusAfterBack = await p.locator("#kf-form .form-status").textContent().catch(() => null);
ok("E. после «Назад» статус не выдаёт заявку за отправленную", statusAfterBack !== "Отправляем…", { statusAfterBack });
upstream = P_EP;

// F. Получатель (Telegram) недоступен и журнал не пишется → 502 «Заявка не отправлена», не успех
upstream = P_EP_BAD; tg.fail = true;
f = await fillKarta("test@example.com");
await submitAndWait(f);
st = await pageState();
ok("F. заявка нигде не сохранилась → ошибка, не успех", st.url !== "spasibo.html" && /не отправлена/i.test(st.h1 || ""), st);
// G. Telegram недоступен, но журнал пишется → заявка сохранена, успех (журнал — резервная копия)
upstream = P_EP;
f = await fillKarta("test@example.com");
await submitAndWait(f);
st = await pageState();
ok("G. Telegram недоступен, журнал записан → 303 spasibo (заявка сохранена в журнале)", st.url === "spasibo.html", st);
tg.fail = false;

// J. Telegram не отвечает: приёмник не держит посетителя бесконечно (тайм-аут 10 с), заявка в журнале → успех
upstream = P_EP; tg.hang = true;
f = await fillKarta("test@example.com");
const t0 = Date.now();
await Promise.all([p.waitForURL(/spasibo|lead/, { timeout: 30000 }).catch(() => {}), f.locator('button[type="submit"]').click()]);
await sleep(500);
st = await pageState(); const waited = Date.now() - t0;
ok("J. Telegram завис: ответ за ≤ 15 с, заявка сохранена в журнале → spasibo", st.url === "spasibo.html" && waited < 15000, { ...st, waitedMs: waited });
tg.hang = false;

// L. Текст дошёл в Telegram, файл — нет, журнал не пишется → заявка считается сохранённой (текст доставлен)
upstream = P_EP_BAD; tg.failDoc = true;
f = await fillKarta("test@example.com", { file: tmpFile });
await submitAndWait(f);
st = await pageState();
ok("L. текст доставлен, файл нет, журнала нет → не полный успех: страница про недоставленный файл", st.url !== "spasibo.html" && /файл/i.test(st.body) && !/не отправлена/i.test(st.h1 || ""), st);
tg.failDoc = false; upstream = P_EP;

// M. Telegram недоступен, журнал пишется, к заявке приложен файл: файл никуда не доставлен (на диск не пишется)
const logLines = () => (existsSync(LOG) ? readFileSync(LOG, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l)) : []);
const before = logLines().length;
upstream = P_EP; tg.fail = true;
f = await fillKarta("+7 900 111-22-33", { file: tmpFile });
await submitAndWait(f);
st = await pageState();
ok("M. файл не доставлен (Telegram недоступен): посетитель НЕ видит безоговорочного «Заявка отправлена»", st.url !== "spasibo.html" && !/Заявка отправлена/.test(st.h1 || ""), st);
ok("M. страница говорит, что принято (заявка, контакт) и что не доставлено (файл), и как отправить файл", /файл/i.test(st.body) && /состав-тест\.pdf/.test(st.body) && /(контакт|ответим)/i.test(st.body) && /utf-8/i.test(st.charset), st);
const newLines = logLines().slice(before);
const leadRec = newLines.find((x) => x.contact === "+7 900 111-22-33");
ok("M. журнал: контакт и поля заявки сохранены, файл — только имя и размер", leadRec && leadRec.product && leadRec.composition && /состав-тест\.pdf \(\d+ байт\)/.test(JSON.stringify(leadRec.files || "")), newLines);
ok("M. журнал: отмечено, что Telegram и файл не доставлены", newLines.some((x) => x.status && x.ref === leadRec?.id && x.telegram === false && x.filesDelivered === false), newLines);
if (st.url !== "spasibo.html") await p.screenshot({ path: join(WORK, "M-partial-page.png"), fullPage: true });
tg.fail = false;

// N. Бот Telegram не настроен (нет токена), файл приложен → файл некуда доставить: не полный успех
upstream = P_EP_NOTG;
f = await fillKarta("test@example.com", { file: tmpFile });
await submitAndWait(f);
st = await pageState();
ok("N. Telegram не настроен, файл приложен: не «Заявка отправлена», есть объяснение про файл", st.url !== "spasibo.html" && /файл/i.test(st.body), st);
// N2. Бот не настроен, файла нет → заявка сохранена в журнале: обычный успех
f = await fillKarta("test@example.com");
await submitAndWait(f);
st = await pageState();
ok("N2. Telegram не настроен, без файла: заявка в журнале → spasibo", st.url === "spasibo.html", st);
upstream = P_EP;

// O. Текст дошёл в Telegram, файл — нет, журнал пишется → не полный успех; в Telegram уходит предупреждение о файле
tg.calls = []; tg.failDoc = true;
f = await fillKarta("test@example.com", { file: tmpFile });
await submitAndWait(f);
st = await pageState();
ok("O. текст доставлен, файл нет: посетитель видит, что файл не дошёл", st.url !== "spasibo.html" && /файл/i.test(st.body), st);
ok("O. в Telegram ушло предупреждение «файл не доставлен»", tg.calls.filter((c) => c.method === "sendMessage").some((c) => /файл/i.test(c.text) && /не доставлен/i.test(c.text)), tg.calls.map((c) => (c.text || c.filename || "").slice(0, 80)));
tg.failDoc = false;

// H. Файл больше 5 МБ: браузер останавливает до отправки
const big = join(WORK, "big.pdf");
writeFileSync(big, Buffer.alloc(5 * 1024 * 1024 + 10, 66));
tg.calls = [];
f = await fillKarta("test@example.com", { file: big });
await f.locator('button[type="submit"]').click(); await sleep(400);
const err = await f.locator(".field-error").allTextContents();
ok("H. файл > 5 МБ: понятная ошибка в форме, запрос не отправлен", err.some((e) => /5 МБ/.test(e)) && p.url().endsWith("karta-dokumentov.html") && tg.calls.length === 0, { err, url: p.url() });

await b.close();
// I. Слишком большой запрос мимо браузера → 413 с текстом в UTF-8
const bigBody = await new Promise((resolve) => {
  const boundary = "----t";
  const head = Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="consent"\r\n\r\non\r\n--${boundary}\r\nContent-Disposition: form-data; name="compositionFile"; filename="x.pdf"\r\nContent-Type: application/pdf\r\n\r\n`);
  const body = Buffer.concat([head, Buffer.alloc(6 * 1024 * 1024, 67), Buffer.from(`\r\n--${boundary}--\r\n`)]);
  const r = request({ host: "127.0.0.1", port: P_EP, method: "POST", path: "/lead", headers: { "content-type": `multipart/form-data; boundary=${boundary}`, "content-length": body.length } }, (res) => { let t = ""; res.setEncoding("utf8"); res.on("data", (c) => (t += c)); res.on("end", () => resolve({ code: res.statusCode, ct: res.headers["content-type"], t })); });
  r.on("error", (e) => resolve({ err: String(e) }));
  r.end(body);
});
const longForm = await new Promise((resolve) => {
  const body = Buffer.from("consent=on&contact=test%40example.com&details=" + "я".repeat(40000));
  const r = request({ host: "127.0.0.1", port: P_EP, method: "POST", path: "/lead", headers: { "content-type": "application/x-www-form-urlencoded", "content-length": body.length } }, (res) => { let t = ""; res.setEncoding("utf8"); res.on("data", (c) => (t += c)); res.on("end", () => resolve({ code: res.statusCode, t })); });
  r.on("error", (e) => resolve({ err: String(e) })); r.end(body);
});
ok("K. слишком длинная заявка без файла → 413 «Слишком длинная заявка»", longForm.code === 413 && /Слишком длинная заявка/.test(longForm.t || ""), { code: longForm.code, err: longForm.err });
ok("I. запрос больше предела → 413, сообщение в UTF-8", bigBody.code === 413 && /charset=utf-8/.test(bigBody.ct || "") && /Слишком большой файл/.test(bigBody.t || ""), { code: bigBody.code, ct: bigBody.ct, err: bigBody.err });

ep.kill(); epBad.kill(); epNoTg.kill(); tgSrv.close(); siteSrv.close(); rmSync(LOG_NOTG, { force: true });
rmSync(LOG, { force: true }); rmSync(tmpFile, { force: true }); rmSync(big, { force: true });
writeFileSync(OUT, JSON.stringify({ endpoint: ENDPOINT, results, endpointStderr: (ep.err || "") + (epBad.err || "") }, null, 1));
const failed = results.filter((r) => !r.pass).length;
console.log(`${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
