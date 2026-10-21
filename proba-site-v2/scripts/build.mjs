// Собирает самодостаточную страницу dist/proba-lab.html: стили, иллюстрации, логотип и скрипт встроены.
// Шрифт Inter подключается с Google Fonts. Запуск: node scripts/build.mjs
import { build } from "../../proba-site/node_modules/esbuild/lib/main.js";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (p) => readFileSync(join(root, p), "utf8");
const png = (p) => `data:image/png;base64,${readFileSync(join(root, p)).toString("base64")}`;

const js = await build({
  entryPoints: [join(root, "src/app.ts")],
  bundle: true, minify: true, format: "iife", target: "es2020", write: false, logLevel: "silent",
});

const ph = (t) => `<span class="placeholder">${t}</span>`;

// «10 из ~190»: сетка 19 × 10 точек, первая колонка — 10 крупнейших рекламодателей.
// Финальное состояние нарисовано в разметке; скрипт только проигрывает к нему анимацию.
const dots = () => {
  let c = "";
  for (let col = 0; col < 19; col++)
    for (let row = 0; row < 10; row++)
      c += `<circle class="${col ? "d" : "d d-top"}" cx="${5 + col * 10}" cy="${5 + row * 10}" r="2.3" style="--c:${col};--r:${row}"/>`;
  return `<svg class="dots" viewBox="0 0 190 100" aria-hidden="true" focusable="false"><rect class="dots-pool" x="0.5" y="0.5" width="9" height="99" rx="1.5"/>${c}</svg>`;
};
let body = read("src/body.html")
  .replace(/(\d) (\d{3})/g, "$1\u00a0$2")
  .replace(/ ₽/g, "\u00a0₽")
  .replaceAll("{{EMBLEM}}", png("assets/emblem-light.png"))
  .replaceAll("{{EMBLEM_INK}}", png("assets/emblem-ink.png"))
  .replace("{{HERO_ART}}", read("assets/hero.svg"))
  .replace("{{CTA_ART}}", read("assets/cta.svg"))
  .replace("{{PRICING_NOTE}}", "Налоговый режим и НДС указываются в договоре.")
  .replace("{{DOTS_190}}", dots())
  .replaceAll("{{FOUNDER_NAME}}", ph("Имя Фамилия"))
  .replace("{{SCIENCE_PROFILE}}", ph("ссылка на профиль eLibrary / ORCID"))
  .replace("{{LEGAL_LINE}}", `© 2026 Proba Lab. ${ph("ИП / ООО, ИНН, ОГРН — заполнить")}`);

const page = `<title>Proba Lab</title>
<meta name="description" content="Proba Lab — доказательная коммерциализация health-продуктов. Проверка состава по исследованиям под критерии ПП № 398, безопасные формулировки и материалы для маркетплейса, аптеки и врача.">
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400..700&display=swap">
<style>${read("src/styles.css")}</style>
${body}
<script>${js.outputFiles[0].text.replace(/<\/script/gi, "<\\/script")}</script>
`;
mkdirSync(join(root, "dist"), { recursive: true });
writeFileSync(join(root, "dist/proba-lab.html"), page);
console.log(`✓ dist/proba-lab.html — ${(page.length / 1024).toFixed(0)} КБ`);
