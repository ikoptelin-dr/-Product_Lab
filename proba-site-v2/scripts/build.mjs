// Собирает самодостаточную страницу dist/proba-lab.html: стили, логотип и скрипт встроены.
// Карточки конструктора, цены и отзывы генерируются из src/data.ts, поэтому страница полна и без скрипта.
// Шрифты Manrope и Golos Text — Google Fonts. Запуск: node scripts/build.mjs
import { build } from "../../proba-site/node_modules/esbuild/lib/main.js";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (p) => readFileSync(join(root, p), "utf8");
const png = (p) => `data:image/png;base64,${readFileSync(join(root, p)).toString("base64")}`;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Данные: собираем data.ts в ESM и импортируем
const dataJs = await build({ entryPoints: [join(root, "src/data.ts")], bundle: true, format: "esm", write: false, logLevel: "silent" });
const data = await import(`data:text/javascript;base64,${Buffer.from(dataJs.outputFiles[0].text).toString("base64")}`);

const constructor = () => {
  const tabs = data.GROUPS.map(
    (g, i) => `<button role="tab" id="tab-${g.id}" aria-controls="panel-${g.id}" aria-selected="${i === 0}"${i ? ' tabindex="-1"' : ""}>${esc(g.short)}</button>`,
  ).join("");
  const panels = data.GROUPS.map((g, i) => {
    const cards = data.SERVICES.filter((s) => s.group === g.id)
      .map(
        (s) => `<article class="svc" aria-labelledby="svc-${s.id}">
  <p class="svc-name">${esc(s.title)}</p>
  <h3 id="svc-${s.id}">${esc(s.result)}</h3>
  <p class="svc-explain">${esc(s.explain)}</p>
  <p class="svc-out"><b>Результат:</b> ${esc(s.deliverable)}</p>
  <button class="btn btn-outline add-btn" type="button" data-add-service="${s.id}" aria-pressed="false" aria-describedby="svc-${s.id}"><span class="add-label">Добавить в проект</span></button>
  <details><summary>Что входит</summary><div class="svc-detail"><ul class="svc-inc">${s.includes.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>${s.note ? `<p class="svc-note">${esc(s.note)}</p>` : ""}</div></details>
</article>`,
      )
      .join("");
    return `<div role="tabpanel" id="panel-${g.id}" aria-labelledby="tab-${g.id}"${i ? " hidden" : ""}><h3 class="tab-panel-title">${esc(g.title)}</h3><p class="tab-panel-lead">${esc(g.lead)}</p><div class="svc-list">${cards}</div></div>`;
  }).join("");
  return `<div class="tabs" role="tablist" aria-label="Группы услуг"><span class="tab-pill" aria-hidden="true"></span>${tabs}</div>${panels}`;
};

// Отзывы выводятся только если в data.ts есть настоящие
const reviews = () =>
  data.REVIEWS.length
    ? `<section class="section" id="reviews" aria-labelledby="reviews-title"><div class="container"><h2 id="reviews-title" class="section-head">Что говорят клиенты</h2><div class="reviews-grid">${data.REVIEWS.map(
        (r) => `<figure class="review-card"><blockquote>${esc(r.text)}</blockquote><figcaption><b>${esc(r.person)}</b>, ${esc(r.role)}, ${esc(r.company)}<br><span class="muted">${esc(r.task)}</span></figcaption></figure>`,
      ).join("")}</div></div></section>`
    : "";

const nb = (s) => s.replace(/(\d) (\d{3})/g, "$1 $2").replace(/ ₽/g, " ₽");
const body = read("src/body.html")
  .replaceAll("{{EMBLEM_INK}}", png("assets/emblem-ink.png"))
  .replace("{{PRICE_START}}", nb(data.PRICES.start))
  .replace("{{PRICE_PROMO_PREP}}", nb(data.PRICES.promoPrep))
  .replace("{{PRICE_PROMO_SUPPORT}}", nb(data.PRICES.promoSupport))
  .replace("{{CONSTRUCTOR}}", constructor())
  .replace("{{REVIEWS}}", reviews())
  .replace("{{YEAR}}", String(new Date().getFullYear()));

const js = await build({ entryPoints: [join(root, "src/app.ts")], bundle: true, minify: true, format: "iife", target: "es2020", write: false, logLevel: "silent" });

const page = `<title>Proba Lab</title>
<meta name="description" content="Proba Lab — маркетинг и дизайн для БАД и косметики: предложение продукта, сайт, карточки и материалы для партнёров.">
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;500;600&family=Manrope:wght@600;700;800&display=swap">
<style>${read("src/styles.css")}</style>
${body}
<script>${js.outputFiles[0].text.replace(/<\/script/gi, "<\\/script")}</script>
`;
mkdirSync(join(root, "dist"), { recursive: true });
writeFileSync(join(root, "dist/proba-lab.html"), page);
console.log(`✓ dist/proba-lab.html — ${(page.length / 1024).toFixed(0)} КБ`);
