// Собирает раздел «Документы и соответствие» в dist/dokumenty/:
//   index.html и 11 страниц услуг — полные HTML-документы (SEO: отдельные индексируемые страницы);
//   section.css — src/styles.css + src/regulatory/section.css + логотип (CSS-переменная --logo, один раз на раздел);
//   section.js — src/regulatory/section.ts.
// Заодно пишет REGULATORY_VERIFY.md — все фактические фразы со ссылками на источники.
// Запуск: node scripts/build-section.mjs (или node scripts/build.mjs — соберёт всё).
import { build } from "../../proba-site/node_modules/esbuild/lib/main.js";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (p) => readFileSync(join(root, p), "utf8");
const out = join(root, "dist/dokumenty");

// 1. Тексты и шаблон (TypeScript) → модуль в памяти
const renderJs = await build({ entryPoints: [join(root, "src/regulatory/render.ts")], bundle: true, format: "esm", platform: "neutral", write: false, logLevel: "silent" });
const mod = await import(`data:text/javascript;base64,${Buffer.from(renderJs.outputFiles[0].text).toString("base64")}`);
const { files, facts, warnings, sources } = mod.renderAll();

if (warnings.length) {
  console.error("✗ Непомеченные фразы с цифрами или номерами документов (оберните в f(ключ, фраза) или перепишите):");
  for (const w of warnings) console.error("  - " + w);
  process.exit(1);
}

// 2. Проверки текста: шаблоны, стоп-слова, стоп-лист
const FORBIDDEN = [/гарантируем/i, /100\s?%/, /без отказов/i, /быстрее всех/i, /лучши[ея]/i, /наша лаборатория/i, /аккредитованная компания/i, /официальный партнёр/i, /\bлечит/i, /излечива/i];
const STOPLIST = [/антисептик/i, /раневы/i, /стомийн/i, /урологическ/i, /инфузионн/i, /хирургическ/i, /энтеральн/i, /парентеральн/i, /клиническое питание/i, /диетическ\S* лечебн/i];
const visible = (html) => html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<[^>]+>/g, " ");
for (const f of files) {
  if (/\{\{|⟪|⟫/.test(f.html)) throw new Error(`${f.file}: остался шаблон или метка факта`);
  for (const re of [...FORBIDDEN, ...STOPLIST]) if (re.test(visible(f.html)) || re.test(f.html.match(/<head>[\s\S]*<\/head>/)[0])) throw new Error(`${f.file}: запрещённое слово ${re}`);
  if ((f.html.match(/<h1[\s>]/g) || []).length !== 1) throw new Error(`${f.file}: должен быть ровно один h1`);
}

// 3. Страницы
mkdirSync(out, { recursive: true });
for (const f of files) writeFileSync(join(out, f.file), f.html);

// 4. Стили: общие + раздел; логотип — один раз
const logo = `data:image/png;base64,${readFileSync(join(root, "assets/emblem-ink.png")).toString("base64")}`;
const css = `/* Proba Lab — раздел «Документы и соответствие». Собрано из src/styles.css и src/regulatory/section.css */\n:root{--logo:url("${logo}")}\n${read("src/styles.css")}\n${read("src/regulatory/section.css")}`;
writeFileSync(join(out, "section.css"), css);

// 5. Скрипт
const js = await build({ entryPoints: [join(root, "src/regulatory/section.ts")], bundle: true, minify: true, format: "iife", target: "es2020", charset: "utf8", write: false, logLevel: "silent" });
writeFileSync(join(out, "section.js"), js.outputFiles[0].text);
if (/fetch\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage/.test(js.outputFiles[0].text))
  throw new Error("section.js: сетевые запросы или хранилище браузера запрещены");

// 6. REGULATORY_VERIFY.md — чек-лист для партнёра
const byPage = new Map();
for (const fct of facts) {
  if (!byPage.has(fct.page)) byPage.set(fct.page, []);
  byPage.get(fct.page).push(fct);
}
const cell = (s) => String(s).replace(/\|/g, "\\|").replace(/\n/g, " ");
let md = `# Сверка фактов раздела «Документы и соответствие»

Предпродакшн-чек-лист для специалиста-партнёра. **Файл генерируется сборкой** (\`node scripts/build.mjs\`) из меток \`f(ключ, фраза)\` в \`src/regulatory/pages.ts\` и \`src/regulatory/quiz.ts\` — руками не правьте.
Статус источника меняйте в \`src/regulatory/sources.ts\` (поле \`status\`) и пересоберите.

- Все факты взяты из \`proba-growth/research/regulatory-docs-factbase.md\` (R) и \`proba-growth/research/production-compliance-factbase.md\` (P), часть подтверждена \`landing-page-map.md\` (L). Обе фактбазы собраны по поисковой выдаче: первоисточники не открывались.
- Суммы госпошлины, платы за регистрацию деклараций и цены на сайте **не приводятся** — только строки сметы.
- Сборка останавливается, если на странице есть цифра или номер документа без метки источника.
- Всего фраз: **${facts.length}** на ${byPage.size} страницах. Дата сборки: ${new Date().toISOString().slice(0, 10)}.

`;
for (const f of files) {
  const list = byPage.get(f.slug) || [];
  if (!list.length) continue;
  md += `## ${f.title} — \`dokumenty/${f.file}\`\n\n| № | Фраза на странице | Источник (URL) | Метка фактбазы | Статус |\n|---|---|---|---|---|\n`;
  list.forEach((x, i) => {
    const s = sources[x.key];
    md += `| ${i + 1} | ${cell(x.sentence)} | ${cell(s.url)} | ${cell(s.label)} (\`${x.key}\`) | ${cell(s.status)} |\n`;
  });
  md += "\n";
}
md += `## Источники и их статус\n\n| Ключ | Источник (URL) | Метка фактбазы | Статус |\n|---|---|---|---|\n`;
for (const [k, s] of Object.entries(sources)) md += `| \`${k}\` | ${cell(s.url)} | ${cell(s.label)} | ${cell(s.status)} |\n`;
writeFileSync(join(root, "REGULATORY_VERIFY.md"), md);

console.log(`✓ dist/dokumenty/ — ${files.length} страниц, section.css ${(css.length / 1024).toFixed(0)} КБ, section.js ${(js.outputFiles[0].text.length / 1024).toFixed(0)} КБ`);
console.log(`✓ REGULATORY_VERIFY.md — ${facts.length} фраз`);
