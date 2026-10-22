// Собирает самодостаточную страницу dist/proba-lab.html: стили, логотип и скрипт встроены.
// Цены, варианты задач формы и отзывы берутся из src/data.ts, поэтому страница полна и без скрипта.
// Шрифты Manrope (600, 700) и Golos Text (400, 500, 600) — Google Fonts. Запуск: node scripts/build.mjs
import { build } from "../../proba-site/node_modules/esbuild/lib/main.js";
import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (p) => readFileSync(join(root, p), "utf8");
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const nb = (s) => s.replace(/(\d) (\d{3})/g, "$1 $2").replace(/ ₽/g, " ₽");

const dataJs = await build({ entryPoints: [join(root, "src/data.ts")], bundle: true, format: "esm", write: false, logLevel: "silent" });
const data = await import(`data:text/javascript;base64,${Buffer.from(dataJs.outputFiles[0].text).toString("base64")}`);

// Логотип — один раз, как CSS-переменная
const logo = `data:image/png;base64,${readFileSync(join(root, "assets/emblem-ink.png")).toString("base64")}`;

const taskOptions = data.TASKS.map(
  (t) => `<label class="choice"><input type="radio" name="task" value="${t.id}"><span>${esc(nb(t.label))}</span></label>`,
).join("");

// Отзывы выводятся только если в data.ts есть настоящие
const reviews = data.REVIEWS.length
  ? `<section class="section" id="reviews" aria-labelledby="reviews-title"><div class="container"><h2 id="reviews-title" class="section-head">Что говорят клиенты</h2><div class="reviews-grid">${data.REVIEWS.map(
      (r) => `<figure class="review-card"><blockquote>${esc(r.text)}</blockquote><figcaption><b>${esc(r.person)}</b>, ${esc(r.role)}, ${esc(r.company)}<br><span class="muted">${esc(r.task)}</span></figcaption></figure>`,
    ).join("")}</div></div></section>`
  : "";

const body = read("src/body.html")
  .replaceAll("{{PRICE_START}}", nb(data.PRICES.start))
  .replace("{{PRICE_PROMO_PREP}}", nb(data.PRICES.promoPrep))
  .replace("{{PRICE_PROMO_SUPPORT}}", nb(data.PRICES.promoSupport))
  .replace("{{TASK_OPTIONS}}", taskOptions)
  .replace("{{REVIEWS}}", reviews)
  .replace("{{YEAR}}", String(new Date().getFullYear()));
if (/\{\{[A-Z_]+\}\}/.test(body)) throw new Error("В разметке остался незаполненный шаблон: " + body.match(/\{\{[A-Z_]+\}\}/)[0]);

const js = await build({ entryPoints: [join(root, "src/app.ts")], bundle: true, minify: true, format: "iife", target: "es2020", write: false, logLevel: "silent" });

const page = `<title>Proba Lab</title>
<meta name="description" content="Proba Lab помогает производителям и брендам БАД и косметики объяснить преимущества продукта: разбор, сайты, карточки, материалы для партнёров и автоматизация заявок.">
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;500;600&family=Manrope:wght@600;700&display=swap">
<style>:root{--logo:url("${logo}")}
${read("src/styles.css")}</style>
${body}
<script>${js.outputFiles[0].text.replace(/<\/script/gi, "<\\/script")}</script>
`;
mkdirSync(join(root, "dist"), { recursive: true });
writeFileSync(join(root, "dist/proba-lab.html"), page);
// Иллюстрации — отдельными файлами рядом со страницей (img/…), загружаются лениво
cpSync(join(root, "assets/img"), join(root, "dist/img"), { recursive: true });
console.log(`✓ dist/proba-lab.html — ${(page.length / 1024).toFixed(0)} КБ`);
