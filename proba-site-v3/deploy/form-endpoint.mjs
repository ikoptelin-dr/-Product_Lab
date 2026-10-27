// Приём заявок с сайта Proba Lab: POST /lead → сообщение в Telegram (и копия в журнал) → переадресация на /spasibo.html.
// Без зависимостей, Node 18+. Запуск на сервере: TG_TOKEN=… TG_CHAT=… node deploy/form-endpoint.mjs (порт 8787, за nginx).
// Сайт собирать с FORM_ENDPOINT=/lead — формы начнут отправляться сюда.
import { createServer } from "node:http";
import { appendFileSync } from "node:fs";

const PORT = Number(process.env.PORT || 8787);
const { TG_TOKEN = "", TG_CHAT = "" } = process.env;
const LOG = process.env.LEAD_LOG || "/var/log/proba-leads.jsonl";
const MAX = 64 * 1024; // заявка без файлов; файлы состава лучше просить в переписке

const LABELS = { form: "Форма", page: "Страница", task: "Задача", contact: "Контакт", productUrl: "Ссылка", url: "Ссылка", about: "О проекте", process: "Процесс", company: "Компания", product: "Продукт", composition: "Состав", need: "Что нужно", category: "Категория", comment: "Комментарий", deadline: "Срок" };

createServer((req, res) => {
  if (req.method !== "POST" || !req.url?.startsWith("/lead")) { res.writeHead(404).end(); return; }
  let body = "";
  let tooBig = false;
  req.on("data", (c) => { body += c; if (body.length > MAX) { tooBig = true; req.destroy(); } });
  req.on("end", async () => {
    if (tooBig) return;
    const type = req.headers["content-type"] || "";
    const data = type.includes("application/x-www-form-urlencoded") ? Object.fromEntries(new URLSearchParams(body)) : { raw: body.slice(0, 2000) };
    if (!data.consent) { res.writeHead(400).end("Нужно согласие на обработку данных"); return; }
    const lead = { at: new Date().toISOString(), ...data };
    try { appendFileSync(LOG, JSON.stringify(lead) + "\n"); } catch {}
    if (TG_TOKEN && TG_CHAT) {
      const text = ["Заявка с сайта Proba Lab", ...Object.entries(data).filter(([k]) => k !== "consent").map(([k, v]) => `${LABELS[k] ?? k}: ${String(v).slice(0, 500)}`)].join("\n");
      try { await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ chat_id: TG_CHAT, text }) }); } catch {}
    }
    res.writeHead(303, { Location: "/spasibo.html" }).end();
  });
}).listen(PORT, "127.0.0.1", () => console.log(`proba form endpoint on 127.0.0.1:${PORT}`));
