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
let body = read("src/body.html")
  .replace(/(\d) (\d{3})/g, "$1\u00a0$2")
  .replace(/ ₽/g, "\u00a0₽")
  .replaceAll("{{EMBLEM}}", png("assets/emblem-light.png"))
  .replaceAll("{{EMBLEM_INK}}", png("assets/emblem-ink.png"))
  .replace("{{HERO_ART}}", read("assets/hero.svg"))
  .replace("{{CTA_ART}}", read("assets/cta.svg"))
  .replace("{{PRICING_NOTE}}", "Налоговый режим и НДС указываются в договоре.")
  .replace("{{FOUNDER_NAME}}", ph("Имя Фамилия"))
  .replace("{{LEGAL_LINE}}", `© 2026 Proba Lab. ${ph("ИП / ООО, ИНН, ОГРН — заполнить")}`);

const page = `<title>Proba Lab</title>
<meta name="description" content="Аудит доказательной базы и формулировок для производителей БАД, космецевтики и медизделий">
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
