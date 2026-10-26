// Сборка Proba Lab v3 → dist/: все страницы (полные HTML-документы), assets/site.css, assets/site.js, логотипы,
// sitemap.xml, robots.txt и REGULATORY_VERIFY.md (сверка фактов раздела «Документы» — механизм меток v2).
// Запуск: node scripts/build.mjs
import { build } from "/home/user/-Product_Lab/proba-site/node_modules/esbuild/lib/main.js";
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dist = join(root, "dist");
const read = (p) => readFileSync(join(root, p), "utf8");

/** Базовый адрес сайта для sitemap.xml. TODO: домен не выбран — заменить перед публикацией (см. README). */
const SITEMAP_BASE = process.env.SITE_URL || "https://example.com";

// 1. Страницы: TypeScript-шаблоны → модуль в памяти
const pagesJs = await build({ entryPoints: [join(root, "src/site-pages.ts")], bundle: true, format: "esm", platform: "neutral", write: false, logLevel: "silent" });
const mod = await import(`data:text/javascript;base64,${Buffer.from(pagesJs.outputFiles[0].text).toString("base64")}`);
const { files, facts, warnings, sources } = mod.renderSite();

if (warnings.length) {
  console.error("✗ Непомеченные фразы с цифрами или номерами документов (оберните в f(ключ, фраза) или перепишите):");
  for (const w of warnings) console.error("  - " + w);
  process.exit(1);
}

// 2. Проверки текста
// <s>…</s> — зачёркнутый «плохой» заголовок в демо v6 (пример того, что убираем), в проверку не входит
const visible = (html) => html.slice(html.indexOf("<body")).replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<s>[\s\S]*?<\/s>/g, " ").replace(/<[^>]+>/g, " ").replace(/ /g, " ");
const head = (html) => html.match(/<head>[\s\S]*<\/head>/)[0].replace(/<script[\s\S]*?<\/script>/g, " ").replace(/ /g, " ");
// Правила текстов v3 (site-v3-vision.md §3). Отрицания («Не гарантируем», «Сроки не обещаем») и название запроса «под ключ» в кавычках допустимы.
// «лучший момент» — дословная фраза из ответа в вопросах страницы «Маркетинг» (не эпитет продукта).
const QUERY_RULE = /(?<!«)под ключ(?!»)/i;
const FORBIDDEN = [/инновационн/i, /уникальн/i, /комплексн\S* подход/i, QUERY_RULE, /синерги/i, /эффективн\S* решени/i, /команда профессионалов/i, /лучш(?:ий|ая|ее|ие)(?! момент)/i, /(?<!не )гарантируем/i, /рост продаж в \d/i, /(?![©®™])\p{Extended_Pictographic}/u];
// Из v2 (раздел «Документы»): стоп-слова и стоп-лист категорий
const REG_FORBIDDEN = [/100\s?%/, /без отказов/i, /быстрее всех/i, /лучши[ея]/i, /наша лаборатория/i, /аккредитованная компания/i, /официальный партнёр/i, /\bлечит/i, /излечива/i];
const STOPLIST = [/антисептик/i, /раневы/i, /стомийн/i, /урологическ/i, /инфузионн/i, /хирургическ/i, /энтеральн/i, /парентеральн/i, /клиническое питание/i, /диетическ\S* лечебн/i];
const titles = new Set();
for (const f of files) {
  const text = visible(f.html) + " " + head(f.html);
  if (/\{\{|⟪|⟫/.test(f.html)) throw new Error(`${f.path}: остался шаблон или метка факта`);
  const rules = [...FORBIDDEN, ...STOPLIST, ...(f.path.startsWith("dokumenty/") ? REG_FORBIDDEN : [])];
  // «под ключ» допустим в title/description как название поискового запроса (vision §3), в тексте страницы — только в кавычках
  for (const re of rules) if (re.test(re === QUERY_RULE ? visible(f.html) : text)) throw new Error(`${f.path}: запрещённое слово ${re} — «${text.match(re)?.[0]}»`);
  if ((f.html.match(/<h1[\s>]/g) || []).length !== 1) throw new Error(`${f.path}: должен быть ровно один h1`);
  if (titles.has(f.title)) throw new Error(`${f.path}: повтор title «${f.title}»`);
  titles.add(f.title);
}

// 3. Запись страниц
rmSync(dist, { recursive: true, force: true });
for (const f of files) {
  const out = join(dist, f.path);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, f.html);
}

// 4. Стили, скрипт, логотипы
mkdirSync(join(dist, "assets"), { recursive: true });
const css = await build({ entryPoints: [join(root, "src/site.css")], bundle: true, minify: true, write: false, logLevel: "silent" });
writeFileSync(join(dist, "assets/site.css"), css.outputFiles[0].text);
const js = await build({ entryPoints: [join(root, "src/site.ts")], bundle: true, minify: true, format: "iife", target: "es2020", charset: "utf8", write: false, logLevel: "silent" });
const jsText = js.outputFiles[0].text;
if (/fetch\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|indexedDB/.test(jsText)) throw new Error("site.js: сетевые запросы или хранилище браузера запрещены");
writeFileSync(join(dist, "assets/site.js"), jsText);
for (const img of ["emblem-ink.png", "emblem-light.png"]) copyFileSync(join(root, "assets", img), join(dist, "assets", img));

// 5. sitemap.xml и robots.txt
const today = new Date().toISOString().slice(0, 10);
const loc = (p) => `${SITEMAP_BASE}/${p.replace(/(^|\/)index\.html$/, "$1")}`;
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<!-- TODO: базовый адрес ${SITEMAP_BASE} — заглушка. Пересоберите с SITE_URL=https://домен node scripts/build.mjs -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${files.map((f) => `  <url><loc>${loc(f.path)}</loc><lastmod>${today}</lastmod></url>`).join("\n")}
</urlset>
`;
writeFileSync(join(dist, "sitemap.xml"), sitemap);
writeFileSync(join(dist, "robots.txt"), `User-agent: *\nAllow: /\n\n# TODO: заменить адрес после выбора домена\nSitemap: ${SITEMAP_BASE}/sitemap.xml\n`);

// 6. REGULATORY_VERIFY.md — чек-лист для партнёра (механизм v2: метки f(ключ, фраза))
const byPage = new Map();
for (const fct of facts) {
  if (!byPage.has(fct.page)) byPage.set(fct.page, []);
  byPage.get(fct.page).push(fct);
}
const cell = (s) => String(s).replace(/\|/g, "\\|").replace(/\n/g, " ");
let md = `# Сверка фактов раздела «Документы и соответствие» (v3)

Предпродакшн-чек-лист для специалиста-партнёра. **Файл генерируется сборкой** (\`node scripts/build.mjs\`) из меток \`f(ключ, фраза)\` в \`src/regulatory/pages.ts\`, \`src/regulatory/quiz.ts\` и \`src/regulatory/render.ts\` — руками не правьте.
Статус источника меняйте в \`src/regulatory/sources.ts\` (поле \`status\`) и пересоберите.

- Тексты и факты перенесены из v2 без изменений. Факты взяты из \`proba-growth/research/regulatory-docs-factbase.md\` (R) и \`proba-growth/research/production-compliance-factbase.md\` (P), часть подтверждена \`landing-page-map.md\` (L). Обе фактбазы собраны по поисковой выдаче: первоисточники не открывались.
- Суммы госпошлины, платы за регистрацию деклараций и цены на сайте **не приводятся** — только строки сметы.
- Сборка останавливается, если на странице есть цифра или номер документа без метки источника.
- В v3 добавлена общая страница \`kak-my-rabotaem.html\` (вне раздела): её фразы с фактами идут отдельной группой.
- Всего фраз: **${facts.length}** на ${byPage.size} страницах. Дата сборки: ${today}.

`;
for (const f of files) {
  const list = byPage.get(f.slug) || [];
  if (!list.length) continue;
  md += `## ${f.title} — \`${f.path}\`\n\n| № | Фраза на странице | Источник (URL) | Метка фактбазы | Статус |\n|---|---|---|---|---|\n`;
  list.forEach((x, i) => {
    const s = sources[x.key];
    md += `| ${i + 1} | ${cell(x.sentence)} | ${cell(s.url)} | ${cell(s.label)} (\`${x.key}\`) | ${cell(s.status)} |\n`;
  });
  md += "\n";
}
md += `## Источники и их статус\n\n| Ключ | Источник (URL) | Метка фактбазы | Статус |\n|---|---|---|---|\n`;
for (const [k, s] of Object.entries(sources)) md += `| \`${k}\` | ${cell(s.url)} | ${cell(s.label)} | ${cell(s.status)} |\n`;
writeFileSync(join(root, "REGULATORY_VERIFY.md"), md);

const kb = (n) => `${(n / 1024).toFixed(0)} КБ`;
console.log(`✓ dist/ — ${files.length} страниц (${files.filter((f) => f.path.startsWith("dokumenty/")).length} в dokumenty/), site.css ${kb(css.outputFiles[0].text.length)}, site.js ${kb(jsText.length)}`);
console.log(`✓ sitemap.xml (${SITEMAP_BASE}), robots.txt`);
console.log(`✓ REGULATORY_VERIFY.md — ${facts.length} фраз`);
