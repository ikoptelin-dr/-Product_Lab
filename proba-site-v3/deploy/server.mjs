// Сервер сайта Proba Lab для Windows (работает и на Linux): отдаёт статику и принимает заявки POST /lead — в одном процессе.
// Без зависимостей, Node 18+. Снаружи стоит Caddy (deploy/windows/Caddyfile): HTTPS-сертификат и переадресация сюда.
// Запуск: node server.mjs → http://127.0.0.1:8080
// Рядом с файлом: site/ — содержимое dist/, nastrojki.txt — TG_TOKEN/TG_CHAT (Telegram) и SMTP_USER/SMTP_PASS/MAIL_TO (почта); в репозиторий не коммитить.
// node server.mjs --test-mail — отправить тестовое письмо по настройкам и выйти.
// Правила адресов те же, что в deploy/nginx.conf: переехавшие страницы, разделы со слэшем, $uri и $uri.html, 404.html.
import { createServer } from "node:http";
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

// nastrojki.txt: строки КЛЮЧ=значение; # — комментарий. Блокнот может сохранить файл с BOM — убираем.
const SETTINGS = join(HERE, "nastrojki.txt");
if (existsSync(SETTINGS)) {
  for (const line of readFileSync(SETTINGS, "utf8").replace(/^﻿/, "").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && !line.trim().startsWith("#") && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^(["'])(.*)\1$/, "$2");
  }
}

const found = process.env.SITE_DIR || [join(HERE, "site"), join(HERE, "..", "dist")].find((d) => existsSync(join(d, "index.html")));
if (!found) { console.error(`Не найдена папка сайта: положите содержимое dist в ${join(HERE, "site")}`); process.exit(1); }
const SITE = resolve(found);
const PORT = Number(process.env.SITE_PORT || 8080);
if (!process.env.LEAD_LOG) {
  mkdirSync(join(HERE, "zayavki"), { recursive: true });
  process.env.LEAD_LOG = join(HERE, "zayavki", "zayavki.jsonl");
}
// Приёмник читает TG_TOKEN, TG_CHAT, SMTP_* и LEAD_LOG при загрузке — импортируем после настроек
const { leadHandler, sendMail } = await import("./form-endpoint.mjs");

if (process.argv.includes("--test-mail")) {
  const { SMTP_USER, SMTP_PASS, MAIL_TO } = process.env;
  if (!SMTP_USER || !SMTP_PASS) { console.error("Почта не настроена: впишите SMTP_USER и SMTP_PASS в nastrojki.txt"); process.exit(1); }
  try {
    await sendMail({ subject: "Проверка почты сайта Proba Lab", text: "Это тестовое письмо с сервера сайта. Если вы его видите — заявки будут приходить на эту почту." });
    console.log(`Готово: тестовое письмо отправлено на ${MAIL_TO || SMTP_USER}. Проверьте почту (и папку «Спам»).`);
    process.exit(0);
  } catch (e) { console.error(`Письмо не отправлено: ${e.message}`); process.exit(1); }
}

const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json", ".xml": "application/xml; charset=utf-8", ".txt": "text/plain; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".avif": "image/avif", ".gif": "image/gif", ".ico": "image/x-icon", ".woff2": "font/woff2", ".woff": "font/woff", ".mp4": "video/mp4", ".webm": "video/webm", ".pdf": "application/pdf", ".webmanifest": "application/manifest+json" };
// mc.yandex.ru — Яндекс Метрика (загружается только после согласия на cookie, если сайт собран с YM_ID)
const CSP = "default-src 'self'; script-src 'self' https://mc.yandex.ru https://yastatic.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://mc.yandex.ru; font-src 'self'; connect-src 'self' https://mc.yandex.ru; frame-src https://mc.yandex.ru; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'";
const MOVED = { "/kalkulyator-sku.html": "/analitika/kalkulyator-yunit-ekonomiki.html", "/dokumenty/sanpin.html": "/dokumenty/proverki-rospotrebnadzora.html", "/blog/ekonomika-sku-marketplejs.html": "/blog/yunit-ekonomika-prostymi-slovami.html", "/dokumenty/kak-my-rabotaem.html": "/kak-my-rabotaem.html" };

const isFile = (p) => { try { return statSync(p).isFile(); } catch { return false; } };

function headers(req, extra) {
  const h = { "Content-Security-Policy": CSP, "X-Content-Type-Options": "nosniff", "Referrer-Policy": "strict-origin-when-cross-origin", "Permissions-Policy": "camera=(), microphone=(), geolocation=()", ...extra };
  if (req.headers["x-forwarded-proto"] === "https") h["Strict-Transport-Security"] = "max-age=31536000";
  return h;
}

function send(req, res, code, file, extra = {}) {
  const h = headers(req, { "Content-Type": TYPES[extname(file).toLowerCase()] || "application/octet-stream", "Content-Length": statSync(file).size, ...extra });
  res.writeHead(code, h);
  if (req.method === "HEAD") { res.end(); return; }
  createReadStream(file).on("error", () => res.destroy()).pipe(res);
}

function notFound(req, res) {
  const page = join(SITE, "404.html");
  if (isFile(page)) send(req, res, 404, page, { "Cache-Control": "no-cache" });
  else res.writeHead(404, headers(req, { "Content-Type": "text/plain; charset=utf-8" })).end("Страница не найдена");
}

const redirect = (req, res, to) => res.writeHead(301, headers(req, { Location: to })).end();

createServer((req, res) => {
  const [rawPath, query = ""] = (req.url || "/").split("?");
  const qs = query ? `?${query}` : "";
  if (rawPath === "/lead") {
    if (req.method === "POST") return leadHandler(req, res);
    res.writeHead(405, { Allow: "POST" }).end(); return;
  }
  if (req.method !== "GET" && req.method !== "HEAD") { res.writeHead(405, { Allow: "GET, HEAD" }).end(); return; }
  let path;
  try { path = decodeURIComponent(rawPath); } catch { res.writeHead(400).end(); return; }
  if (path.includes("\0") || path.includes("\\") || path.split("/").some((s) => s.startsWith("."))) return notFound(req, res);
  if (MOVED[path]) return redirect(req, res, MOVED[path]);
  const section = path.match(/^\/(dokumenty|blog)\/?$/);
  if (section) return redirect(req, res, `/${section[1]}/index.html${qs}`);

  const base = normalize(join(SITE, path));
  if (base !== SITE && !base.startsWith(SITE + sep)) return notFound(req, res);
  const cache = path.startsWith("/assets/") ? { "Cache-Control": "public, max-age=31536000, immutable" } : { "Cache-Control": "no-cache" };
  if (isFile(base)) return send(req, res, 200, base, cache);
  if (isFile(base + ".html")) return send(req, res, 200, base + ".html", cache);
  if (isFile(join(base, "index.html"))) {
    if (!path.endsWith("/")) return redirect(req, res, `${path}/${qs}`);
    return send(req, res, 200, join(base, "index.html"), cache);
  }
  notFound(req, res);
}).listen(PORT, "127.0.0.1", () => {
  console.log(`[${new Date().toLocaleString("ru-RU")}] Сайт работает: http://localhost:${PORT}  (папка сайта: ${SITE})`);
  const ways = [process.env.TG_TOKEN && process.env.TG_CHAT && "Telegram", process.env.SMTP_USER && process.env.SMTP_PASS && `почта ${process.env.MAIL_TO || process.env.SMTP_USER}`].filter(Boolean);
  console.log(ways.length ? `Заявки: ${ways.join(" + ")}; копия — ${process.env.LEAD_LOG}` : `Telegram и почта не настроены (nastrojki.txt): заявки сохраняются только в ${process.env.LEAD_LOG}`);
}).on("error", (e) => {
  console.error(e.code === "EADDRINUSE" ? `Порт ${PORT} занят: сайт уже запущен или порт занят другой программой.` : e.message);
  process.exit(1);
});
