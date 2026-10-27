// Сборка Proba Lab v3 → dist/: все страницы (полные HTML-документы), assets/site.css, assets/site.js, логотипы,
// sitemap.xml, robots.txt и REGULATORY_VERIFY.md (сверка фактов раздела «Документы» — механизм меток v2).
// Запуск: node scripts/build.mjs
import { build } from "/home/user/-Product_Lab/proba-site/node_modules/esbuild/lib/main.js";
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dist = join(root, "dist");
const read = (p) => readFileSync(join(root, p), "utf8");

/** Базовый адрес сайта для sitemap.xml. TODO: домен не выбран — заменить перед публикацией (см. README). */
const SITEMAP_BASE = process.env.SITE_URL || "https://proba-lab.ru"; // домен по почте владельца — подтвердить

// 0. Юридические документы: proba-legal/*.md → HTML (pandoc gfm: списки без пустой строки перед ними, таблицы; текст без изменений, без «умных» кавычек, переносы строк сохраняются)
const LEGAL_DIR = resolve(root, "../proba-legal");
const legal = {};
for (const slug of ["oferta", "politika-pd", "soglasie-pd", "pravovaya-informaciya"]) {
  let html = execFileSync("/usr/bin/pandoc", ["-f", "gfm-smart+hard_line_breaks", "-t", "html", "--wrap=none", join(LEGAL_DIR, `${slug}.md`)], { encoding: "utf8" });
  // Якоря разделов: «## 7. …» → id="p7" (ссылка «см. оферту, раздел 7»), остальные — латиницей по порядку
  let n = 0;
  html = html.replace(/<h([2-6]) id="[^"]*">(\d+)?/g, (_, lv, num) => `<h${lv} id="${num ? `p${num}` : `r${++n}`}">${num ?? ""}`);
  // Таблицы — в прокручиваемой обёртке (на 390 без горизонтального переполнения страницы)
  html = html.replace(/<table>/g, '<div class="table-wrap" role="region" aria-label="Таблица" tabindex="0"><table>').replace(/<\/table>/g, "</table></div>").replace(/<ol type="1">/g, "<ol>");
  legal[slug] = html;
}


// 0b. Тексты волн 1–4: proba-growth/content/pages/**/*.md → HTML (pandoc gfm). Служебная часть (самопроверка, факты для партнёра)
// на сайт не идёт. Метки ⟪ключ|фраза⟫, формы, CTA и калькулятор заменяются токенами @@T{n}@@ — их обрабатывает src/pages/content.ts.
const CONTENT_DIR = resolve(root, "../proba-growth/content/pages");
/** Страницы, которые не публикуем (нет исполнителя и т. п.) — по пометке в тексте. */
const HOLD = /НЕ ПУБЛИКОВАТЬ/;
const walk = (d) => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : n.endsWith(".md") ? [join(d, n)] : []));
/** Адрес из текста (/dokumenty/x/, dokumenty/x.html, #якорь) → файл в dist. */
const HUB_FILES = { "": "index.html", dokumenty: "dokumenty/index.html", blog: "blog/index.html" };
const MOVED_SRC = { "kalkulyator-sku": "analitika/kalkulyator-yunit-ekonomiki", "dokumenty/sanpin": "dokumenty/proverki-rospotrebnadzora", "blog/ekonomika-sku-marketplejs": "blog/yunit-ekonomika-prostymi-slovami" };
const fileOf = (url) => {
  let p = url.replace(/^\/+/, "").replace(/\.html$/, "").replace(/\/index$/, "").replace(/\/$/, "");
  if (p in HUB_FILES) return HUB_FILES[p];
  if (p in MOVED_SRC) p = MOVED_SRC[p];
  return `${p}.html`;
};
const relHref = (href, from) => {
  if (/^(https?:|mailto:|tel:)/.test(href)) return href;
  const [path, hash] = href.split("#");
  const h = hash ? `#${hash === "forma" ? "project-form" : hash}` : "";
  if (!path) return h;
  return (from.includes("/") ? "../" : "") + fileOf(path) + h;
};
const content = [];
const held = [];
const contentWarnings = [];
for (const fpath of walk(CONTENT_DIR).sort()) {
  const raw = readFileSync(fpath, "utf8");
  const fm = raw.match(/^---\n([\s\S]*?)\n---\n/);
  if (!fm) throw new Error(`${fpath}: нет frontmatter`);
  const front = Object.fromEntries([...fm[1].matchAll(/^(\w+):\s*"(.*)"\s*$/gm)].map((m) => [m[1], m[2]]));
  let body = raw.slice(fm[0].length).split(/\n---\s*\n+## Служебное/)[0];
  if (HOLD.test(raw.slice(0, raw.search(/## Служебное/) > 0 ? raw.search(/## Служебное/) : raw.length)) && /НЕ ПУБЛИКОВАТЬ/.test(body)) { held.push(front.url); continue; }
  const file = fileOf(front.url || "");
  body = body.replace(/^# .*\n/m, "");
  const tokens = [];
  const T = (t) => `@@T${tokens.push(t) - 1}@@`;
  // FAQ для JSON-LD: «**Вопрос?**» + ответ до пустой строки — в разделе «Вопросы»
  const faq = [];
  const qs = body.split(/^## /m).find((x) => /^Вопросы/.test(x));
  if (qs) for (const m of qs.matchAll(/^\*\*(.+?)\*\*\n([^\n]+(?:\n[^\n#*][^\n]*)*)/gm)) faq.push({ q: m[1].replace(/⟪[\w-]+\|([^⟫]*)⟫/g, "$1"), a: m[2].replace(/⟪[\w-]+\|([^⟫]*)⟫/g, "$1").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\*\*/g, "").trim() });
  // Метки фактов — до pandoc (в ячейках таблиц знак | ломает разметку)
  body = body.replace(/⟪[\w-]+\|[^⟫]*⟫/g, (m) => T({ type: "fact", raw: m }));
  // Первый экран: текст до первого «## »
  const cut = body.search(/^## /m);
  let intro = cut >= 0 ? body.slice(0, cut) : body;
  let rest = cut >= 0 ? body.slice(cut) : "";
  const heroCtas = [];
  let price;
  intro = intro.replace(/^\*\*\[([^\]]+)\]\*\*(.*)$/gm, (_, label, tail) => {
    if (/^(Форма|CTA|Калькулятор)/.test(label)) return _;
    heroCtas.push({ label, href: "#project-form" });
    const sec = tail.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (sec) heroCtas.push({ label: sec[1], href: relHref(sec[2], file) });
    return "";
  });
  intro = intro.replace(/^(\*\*от [^\n]+|\*\*бесплатно[^\n]+)$/m, (m) => { price = m; return ""; });
  // Блоки
  const blocks = (s) =>
    s
      .replace(/^\*\*\[Форма[^\]]*?задача «([^»]+)»(?:, комментарий «([^»]+)»)?\]\*\*\s*$/gm, (_, task, comment) => `\n${T({ type: "form", task, comment: comment ?? "" })}\n`)
      .replace(/^\*\*\[CTA: «([^»]+)» → (\S+?)(?: · второй: (?:«([^»]+)»|[^→]+?) → (\S+?))?\]\*\*\s*$/gm, (_, label, href, l2, h2) => `\n${T({ type: "cta", label, href: relHref(href, file), second: h2 ? { label: l2 ?? "Подробнее", href: relHref(h2, file) } : undefined })}\n`)
      .replace(/^\*\*\[CTA: «([^»]+)» → ([^\]]+?)\]\*\*\s*$/gm, (_, label, href) => `\n${T({ type: "cta", label, href: relHref(href.split(/\s/)[0], file) })}\n`)
      .replace(/^\*\*\[Калькулятор[^\]]*\]\*\*\s*$/gm, () => `\n${T({ type: "calc" })}\n`)
      .replace(/^\*\*\[([^\]]+)\]\*\*\s*$/gm, (_, label) => `\n${T({ type: "button", label })}\n`)
      .replace(/\]\(([^)\s]+)\)/g, (_, h) => `](${relHref(h, file)})`);
  // Заголовки с якорем {#id}
  const ids = {};
  const withIds = (s) => s.replace(/^(#{2,6} )(.*?)\s*\{#([\w-]+)\}\s*$/gm, (_, h, text, id) => { ids[text.trim()] = id; return h + text; });
  const md = (s) => {
    let html = execFileSync("/usr/bin/pandoc", ["-f", "gfm-smart", "-t", "html", "--wrap=none"], { input: s, encoding: "utf8" });
    html = html.replace(/<h([2-6]) id="[^"]*">([\s\S]*?)<\/h\1>/g, (m, lv, text) => {
      const plain = text.replace(/<[^>]+>/g, "").trim();
      return ids[plain] ? `<h${lv} id="${ids[plain]}">${text}</h${lv}>` : `<h${lv}>${text}</h${lv}>`;
    });
    html = html.replace(/<table>/g, '<div class="table-wrap" role="region" aria-label="Таблица" tabindex="0"><table>').replace(/<\/table>/g, "</table></div>");
    // Токен, оставшийся отдельным абзацем, — без <p>
    return html.replace(/<p>(@@T\d+@@)<\/p>/g, "$1").trim();
  };
  // Раздел «Вопросы» → раскрывающийся список (<details>), как на страницах-шаблонах
  rest = rest.replace(/^## Вопросы[^\n]*\n([\s\S]*?)(?=^## |(?![\s\S]))/m, (_, block) => {
    const items = [];
    for (const m of block.matchAll(/^\*\*(.+?)\*\*\s*\n([\s\S]*?)(?=^\*\*.+?\*\*\s*\n|(?![\s\S]))/gm)) {
      const a = m[2].trim();
      if (!a || /^\[?Форма|^\*\*\[/.test(a)) continue;
      items.push({ q: md(blocks(m[1])).replace(/^<p>|<\/p>$/g, ""), a: md(blocks(a)) });
    }
    return items.length ? `\n${T({ type: "faq", items })}\n\n` : "";
  });
  // Подпись автора статьи: «*Автор: …*» в конце
  let author;
  rest = rest.replace(/^---\s*\n+\*Автор: ([^*]+)\*\s*$/m, (_, a) => { author = a.trim(); return ""; }).replace(/^\*Автор: ([^*]+)\*\s*$/m, (_, a) => { author = a.trim(); return ""; });
  // Строгая проверка для регуляторных страниц: цифры и номера НПА вне меток (кроме цен) — ошибка сборки
  const strict = file.startsWith("dokumenty/") || file === "novosibirsk.html" || (file.startsWith("blog/") && /^(0\d|1[0-1])\b/.test(front.cluster ?? ""));
  if (strict) {
    for (const line of (intro + "\n" + rest).split("\n")) {
      const t = line
        .replace(/@@T\d+@@/g, " ")
        .replace(/\]\([^)]*\)/g, "]")
        .replace(/\{#[\w-]+\}/g, "")
        .replace(/(от\s+)?\d[\d\s\u00a0]*₽(\s*(за|в)\s+[а-яё]+)?/gi, " ")
        .replace(/^\s*\d+\.\s/, "")
        .replace(/\b(1 SKU|SKU)\b/g, " ");
      const law = /№\s?\d|\d{1,2}\.\d{2}\.\d{4}|\d{1,2}\s(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)|ГОСТ\s?(Р\s|ISO\s|ИСО\s)*[\d]|СанПиН\s[\d]|СП\s\d|МР\s\d|ТР ТС \d|\d+-ФЗ|\b(ст|ч|п|пп)\.\s?\d|\d\s?%|\d+\s(дн|рабоч|календ|суток|месяц|лет\b)|КоАП|НК РФ|ПП РФ/;
      if (law.test(t)) contentWarnings.push(`${file}: непомеченная цифра или норма — «${line.trim().slice(0, 140)}»`);
    }
  }
  const introParts = intro.trim().split(/\n{2,}/).filter(Boolean);
  const lead = introParts.length ? md(blocks(introParts[0])).replace(/^<p>|<\/p>$/g, "") : "";
  const introRest = introParts.slice(1).join("\n\n");
  content.push({
    url: front.url ?? "", file, title: front.title, description: front.description, h1: front.h1, cluster: front.cluster ?? "", type: front.type ?? "service",
    lead, price: price ? md(price).replace(/^<p>|<\/p>$/g, "") : undefined, heroCtas,
    html: md(withIds(blocks(introRest + "\n\n" + rest))), tokens, faq, author,
  });
}

// 1. Страницы: TypeScript-шаблоны → модуль в памяти
const pagesJs = await build({ entryPoints: [join(root, "src/site-pages.ts")], bundle: true, format: "esm", platform: "neutral", write: false, logLevel: "silent" });
const mod = await import(`data:text/javascript;base64,${Buffer.from(pagesJs.outputFiles[0].text).toString("base64")}`);
const { files, facts, warnings, sources, moved } = mod.renderSite(legal, content);

warnings.push(...contentWarnings);
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
const FORBIDDEN = [/инновационн/i, /уникальн(?!ое торговое предложение|ого торгового предложения|ым торговым предложением|ом торговом предложении|ая формула»)/i, /комплексн\S* подход/i, QUERY_RULE, /синерги/i, /эффективн\S* решени/i, /команда профессионалов/i, /лучш(?:ий|ая|ее|ие)(?! момент)/i, /(?<!не )гарантируем/i, /рост продаж в \d/i, /(?![©®™])\p{Extended_Pictographic}/u];
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


// 2b. Хабы: ссылки на новые страницы волн 1–4, которых в хабе ещё нет
const byPath = new Map(files.map((f) => [f.path, f]));
const HUB_OF = (path) => (path.startsWith("dokumenty/") ? "dokumenty/index.html" : path.startsWith("blog/") ? "blog/index.html" : path.includes("/") ? `${path.split("/")[0]}.html` : null);
const hubLinks = new Map();
for (const c of content) {
  const hub = HUB_OF(c.file);
  if (!hub || hub === c.file || !byPath.has(hub)) continue;
  if (!hubLinks.has(hub)) hubLinks.set(hub, []);
  hubLinks.get(hub).push(c);
}
const escH = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
for (const [hub, list] of hubLinks) {
  const f = byPath.get(hub);
  const rel = (to) => (hub.includes("/") ? (to.startsWith(hub.split("/")[0] + "/") ? to.slice(hub.indexOf("/") + 1) : `../${to}`) : to);
  const fresh = list.filter((c) => !f.html.includes(`href="${rel(c.file)}"`));
  if (!fresh.length) continue;
  const isBlog = hub === "blog/index.html";
  const cards = fresh
    .map((c) => `<li class="reveal"><a class="next-card glass-light${isBlog ? " blog-card" : ""}" href="${rel(c.file)}"><span class="next-label${isBlog ? " blog-card-title" : ""}">${escH(c.h1)}</span><span class="next-text">${escH(c.description)}</span><span class="arrow" aria-hidden="true"></span></a></li>`)
    .join("");
  const block = `<section class="section next" aria-labelledby="more-title"><div class="container"><h2 id="more-title" class="next-title">${isBlog ? "Новые статьи" : "Все услуги направления"}</h2><ul class="${isBlog ? "blog-list" : "next-grid"}">${cards}</ul></div></section>\n`;
  const at = f.html.indexOf('<section id="project-form"');
  f.html = at > 0 ? f.html.slice(0, at) + block + f.html.slice(at) : f.html.replace("</main>", `${block}</main>`);
}

// 2c. Ссылки: каждая внутренняя ссылка ведёт на существующую страницу (или на старый адрес с переадресацией)
const known = new Set([...files.map((f) => f.path), ...Object.keys(moved)]);
const broken = [];
for (const f of files) {
  for (const m of f.html.matchAll(/href="([^"#?]+\.html)(#[^"]*)?"/g)) {
    if (/^https?:/.test(m[1])) continue;
    const target = join(dirname(f.path), m[1]).replace(/\\/g, "/");
    if (!known.has(target)) broken.push(`${f.path} → ${m[1]}`);
  }
}
if (broken.length) {
  console.error("✗ Ссылки на несуществующие страницы:");
  for (const b of [...new Set(broken)]) console.error("  - " + b);
  process.exit(1);
}

// 3. Запись страниц
rmSync(dist, { recursive: true, force: true });
for (const f of files) {
  const out = join(dist, f.path);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, f.html);
}

// 3b. Переадресации со старых адресов (на сервере — 301, см. deploy/nginx.conf)
for (const [from, to] of Object.entries(moved)) {
  const href = (from.includes("/") ? "../" : "") + to;
  const out = join(dist, from);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, `<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>Страница переехала — Proba Lab</title><meta name="robots" content="noindex"><link rel="canonical" href="${href}"><meta http-equiv="refresh" content="0; url=${href}"></head><body><p>Страница переехала: <a href="${href}">${href}</a></p></body></html>\n`);
}
if (held.length) console.log(`• не публикуются (пометка «НЕ ПУБЛИКОВАТЬ»): ${held.join(", ")}`);

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
- Вне раздела помечены также регуляторные новости (\`novosti.html\`, на сайте — с пометкой «Проверяется») и статьи блога (\`blog/*.html\`). Цены Proba Lab на страницах раздела (\`proba-price\`) — из \`proba-growth/pricing/site-prices.json\`, статус «партнёр подтверждает».
- Всего фраз: **${facts.length}** на ${byPage.size} страницах. Дата сборки: ${today}.

`;
for (const f of files) {
  const list = byPage.get(f.slug) || [];
  const article = f.path.startsWith("blog/") && f.path !== "blog/index.html";
  if (!list.length && !article) continue;
  md += `## ${f.title} — \`${f.path}\`\n\n${f.path.startsWith("blog/") ? "Автор: Илья Коптелин, врач, основатель Proba Lab. Опубликовано: 2026-10-26. **Проверено специалистом-партнёром: ожидает сверки.**\n\n" : ""}| № | Фраза на странице | Источник (URL) | Метка фактбазы | Статус |\n|---|---|---|---|---|\n`;
  if (!list.length) md += "| — | Фраз с цифрами, датами и номерами НПА нет | — | — | — |\n";
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
