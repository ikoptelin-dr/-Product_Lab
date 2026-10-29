// Общий каркас страниц v3: <head>, шапка, подвал, хлебные крошки, JSON-LD, типографика.
// Выполняется при сборке (scripts/build.mjs), в браузер не попадает.
import { COMPANY } from "./data";
import { SITE_URL } from "./regulatory/config";

/** Версия ассетов для сброса кеша (подставляет scripts/build.mjs: хеш site.css + site.js). */
declare const __ASSET_V__: string;
const ASSET_V = typeof __ASSET_V__ === "string" ? __ASSET_V__ : "dev";
/** Приём заявок и Яндекс Метрика — задаются при сборке (FORM_ENDPOINT, YM_ID). Пусто — формы в режиме прототипа, счётчика нет. */
declare const __FORM_ENDPOINT__: string;
declare const __YM_ID__: string;
const FORM_ENDPOINT = typeof __FORM_ENDPOINT__ === "string" ? __FORM_ENDPOINT__ : "";
const YM_ID = typeof __YM_ID__ === "string" ? __YM_ID__ : "";

/* ---------------- Текст ---------------- */
export const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Неразрывные пробелы в числах и перед ₽ — «29 000 ₽» не разрывается. */
export const nb = (s: string) => s.replace(/(\d) (\d{3})/g, "$1\u00a0$2").replace(/ (₽|%|МЕ|мес\.)/g, "\u00a0$1");

const SHORT = "в|во|и|с|со|к|ко|о|об|у|а|но|на|по|от|до|за|не|ни|из|без|для|что|как|или|это|их|то";
const SHORT_RE = new RegExp(`(^|[\\s(«—])(${SHORT}) `, "gi");
/** Типографика текстовых узлов: короткие слова не висят в конце строки, тире не начинает строку. */
export function typo(html: string): string {
  return html.replace(/(<script[\s\S]*?<\/script>)|>([^<]+)</g, (m, script, text) => {
    if (script) return script;
    let t = text.replace(/ — /g, "\u00a0— ");
    t = t.replace(SHORT_RE, "$1$2\u00a0").replace(SHORT_RE, "$1$2\u00a0");
    return `>${t}<`;
  });
}
/**
 * Заголовки на узких экранах (аудит, этап 4): склейки «короткое слово + слово» и keepLast вместе давали неразрывные куски
 * из 3–4 слов («это помогает людям», «как проверить аккредитацию»). На 320–390 px такой кусок шире строки и обрезался
 * первым экраном. Если склеенный кусок длиннее порога (HEAD_CHUNK для цепочки, HEAD_PAIR для пары), снимаем только «склейку последних слов» между двумя
 * обычными словами. Предлог или союз остаётся прижат к следующему слову, тире не начинает строку, числа не разрываются.
 */
const HEAD_CHUNK = 14; // цепочка из 3+ слов длиннее этого — разбирается
const HEAD_PAIR = 18; // пара слов — только если длиннее (пары до 18 символов помещаются даже на 320 px и не меняют вид на десктопе)
const SHORT_WORD = new RegExp(`^[(«—]?(${SHORT})$`, "i");
const unglueChunk = (chunk: string) => {
  const parts = chunk.split("\u00a0");
  if (parts.length < 2 || chunk.length <= (parts.length === 2 ? HEAD_PAIR : HEAD_CHUNK)) return chunk;
  let out = parts[0]!;
  for (let i = 1; i < parts.length; i++) {
    const prev = parts[i - 1]!, cur = parts[i]!;
    const keep = SHORT_WORD.test(prev) || cur.startsWith("—") || /\d$/.test(prev) || /^(\d|₽|%|МЕ|мес\.)/.test(cur);
    out += (keep ? "\u00a0" : " ") + cur;
  }
  return out;
};
const unglueText = (t: string) => t.split(" ").map(unglueChunk).join(" ");
/** Применяется к готовому HTML: текст внутри h1–h3 и p.h2 (подпись CTA-полосы). */
export const unglueHeadings = (html: string) =>
  html.replace(/(<(h[1-3])\b[^>]*>|<p class="h2"[^>]*>)([\s\S]*?)(<\/(?:h[1-3]|p)>)/g, (_, open, _t, inner, close) =>
    open + inner.replace(/(^|>)([^<]+)/g, (_m: string, gt: string, x: string) => gt + unglueText(x)) + close);

/** Последние два слова заголовка — неразрывно (без висячего слова в последней строке). */
export const keepLast = (s: string) => s.replace(/ ([^\s<>]{1,14})$/, "\u00a0$1");

/* ---------------- Навигация ---------------- */
export type NavKey = "cases" | "blog" | "docs" | "marketing" | "promo" | "analytics" | "audit" | "automation" | "how" | "home" | "prices" | "none";

export const NAV: { key: NavKey; href: string; label: string }[] = [
  { key: "docs", href: "dokumenty/index.html", label: "Документы" },
  { key: "marketing", href: "marketing.html", label: "Маркетинг" },
  { key: "promo", href: "prodvizhenie.html", label: "Продвижение" },
  { key: "analytics", href: "analitika.html", label: "Аналитика" },
  { key: "audit", href: "audit-prodazh.html", label: "Аудит продаж" },
  { key: "automation", href: "avtomatizaciya.html", label: "Автоматизация" },
];

/** Шапка: направления + «Цены» (в подвале «Цены» — в группе «Клиентам», не среди направлений). */
/** Шапка — фокус на запуске продукта (стратегия правок 2026-10-27): документы, маркетинг, аналитика, кейсы, блог, цены.
 *  Продвижение, аудит продаж и автоматизация — в подвале («Направления») и в хабах, не в шапке. */
export const HEADER_NAV: { key: NavKey; href: string; label: string }[] = [
  { key: "docs", href: "dokumenty/index.html", label: "Документы" },
  { key: "marketing", href: "marketing.html", label: "Маркетинг" },
  { key: "analytics", href: "analitika.html", label: "Аналитика" },
  { key: "cases", href: "kejsy.html", label: "Кейсы" },
  { key: "blog", href: "blog/index.html", label: "Блог" },
  { key: "prices", href: "ceny.html", label: "Цены" },
];

export const QUIZ_HREF = "dokumenty/index.html#quiz";

function header(base: string, active: NavKey) {
  const link = (n: (typeof HEADER_NAV)[number]) =>
    `<a href="${base}${n.href}"${n.key === active ? ' aria-current="page"' : ""}>${n.label}</a>`;
  return `<a class="skip-link" href="#main">Перейти к содержанию</a>
<header class="site-header">
  <div class="container header-row">
    <a class="brand" href="${base}index.html" aria-label="Proba Lab — на главную"${active === "home" ? ' aria-current="page"' : ""}>
      <img class="brand-mark" src="${base}assets/emblem-ink.png" alt="" width="34" height="34">
      <span class="brand-name">Proba Lab</span>
    </a>
    <nav class="main-nav" aria-label="Основная навигация">
      ${HEADER_NAV.map(link).join("\n      ")}
    </nav>
    <div class="header-actions">
      <a class="btn btn-primary btn-sm header-cta" href="${base}${QUIZ_HREF}">Проверить состав</a>
      <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-menu" aria-label="Открыть меню"><span></span><span></span></button>
    </div>
  </div>
  <div id="mobile-menu" class="mobile-menu" hidden>
    <nav aria-label="Мобильная навигация" class="container">
      ${HEADER_NAV.map(link).join("\n      ")}
      <a href="${base}kak-my-rabotaem.html"${active === "how" ? ' aria-current="page"' : ""}>Как мы работаем</a>
      <a class="btn btn-primary btn-lg" href="${base}${QUIZ_HREF}">Проверить состав</a>
    </nav>
  </div>
</header>`;
}

/** Подвал: группы «Компания» и «Клиентам» (страницы подвала и юридические документы). */
export const FOOTER_COMPANY = [
  ["o-nas.html", "О нас"],
  ["kontakty.html", "Контакты"],
  ["partneram.html", "Партнёрам"],
  ["blagotvoritelnost.html", "Благотворительность"],
  ["novosti.html", "Новости"],
  ["blog/index.html", "Блог"],
] as const;
export const FOOTER_CLIENTS = [
  ["ceny.html", "Цены"],
  ["oplata.html", "Оплата"],
  ["oferta.html", "Публичная оферта"],
  ["politika-pd.html", "Политика обработки ПДн"],
  ["pravovaya-informaciya.html", "Правовая информация"],
] as const;

function footer(base: string) {
  const year = new Date().getFullYear();
  const list = (items: readonly (readonly [string, string])[]) => items.map(([h, l]) => `<li><a href="${base}${h}">${l}</a></li>`).join("");
  return `<footer class="site-footer grain">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <a class="brand" href="${base}index.html"><img class="brand-mark" src="${base}assets/emblem-ink.png" alt="" width="34" height="34"><span class="brand-name">Proba Lab</span></a>
        <p>Для производителей и брендов БАД и косметики</p>
        <p class="footer-contacts"><a href="${COMPANY.phoneHref}">${COMPANY.phone}</a><br><a href="mailto:${COMPANY.email}">${COMPANY.email}</a></p>
      </div>
      <nav class="footer-nav" aria-label="Направления">
        <p class="footer-label">Направления</p>
        <ul>${NAV.map((n) => `<li><a href="${base}${n.href}">${n.label}</a></li>`).join("")}</ul>
      </nav>
      <nav class="footer-nav" aria-label="О работе">
        <p class="footer-label">О работе</p>
        <ul>
          <li><a href="${base}kak-my-rabotaem.html">Как мы работаем</a></li>
          <li><a href="${base}${QUIZ_HREF}">Какой документ нужен</a></li>
          <li><a href="${base}index.html#review">Бесплатный разбор</a></li>
          <li><a href="${base}analitika/kalkulyator-yunit-ekonomiki.html">Калькулятор юнит-экономики</a></li>
          <li><a href="${base}dokumenty/karta-dokumentov.html">Карта документов</a></li>
        </ul>
      </nav>
      <nav class="footer-nav" aria-label="Компания">
        <p class="footer-label">Компания</p>
        <ul>${list(FOOTER_COMPANY)}</ul>
      </nav>
      <nav class="footer-nav" aria-label="Клиентам">
        <p class="footer-label">Клиентам</p>
        <ul>${list(FOOTER_CLIENTS)}</ul>
      </nav>
    </div>
    <div class="footer-bottom">
      <p class="footer-legal">${COMPANY.legalName} · ИНН ${COMPANY.inn} · ОГРНИП ${COMPANY.ogrnip}</p>
      <p class="footer-copy">© ${year} Proba Lab</p>
    </div>
  </div>
</footer>`;
}

/* ---------------- Хлебные крошки ---------------- */
export type Crumb = { name: string; href?: string };

export function crumbsHtml(items: Crumb[]) {
  return `<nav class="crumbs" aria-label="Хлебные крошки"><ol>${items
    .map((c) => (c.href ? `<li><a href="${c.href}">${esc(c.name)}</a></li>` : `<li><span aria-current="page">${esc(c.name)}</span></li>`))
    .join("")}</ol></nav>`;
}

/** Адрес для JSON-LD: абсолютный, когда задан SITE_URL, иначе — путь от корня сайта. */
export const absUrl = (path: string) => (SITE_URL ? `${SITE_URL}/${path.replace(/index\.html$/, "")}` : path);

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: absUrl(c.path) })),
  };
}

export function faqLd(items: { q: string; a: string }[]) {
  const strip = (s: string) => s.replace(/<[^>]+>/g, "").replace(/\u00a0/g, " ");
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((x) => ({ "@type": "Question", name: strip(x.q), acceptedAnswer: { "@type": "Answer", text: strip(x.a) } })),
  };
}

/** Адрес и контакты компании для JSON-LD. */
export function companyLd() {
  return {
    legalName: COMPANY.legalName,
    taxID: COMPANY.inn,
    telephone: COMPANY.phoneHref.replace("tel:", ""),
    email: COMPANY.email,
    address: {
      "@type": "PostalAddress",
      addressRegion: COMPANY.address.region,
      addressLocality: COMPANY.address.locality,
      streetAddress: COMPANY.address.street,
      addressCountry: "RU",
    },
  };
}

export function serviceLd(name: string, serviceType: string, description: string, path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    serviceType,
    description,
    ...(SITE_URL ? { url: absUrl(path) } : {}),
    areaServed: "RU",
    provider: { "@type": "Organization", name: "Proba Lab" },
  };
}

/* ---------------- Документ ---------------- */
export interface PageDoc {
  /** Путь файла относительно dist, например "marketing.html" или "dokumenty/gmp.html". */
  path: string;
  title: string;
  description: string;
  nav: NavKey;
  ld: object[];
  body: string;
  bodyClass?: string;
}

export function renderDoc(p: PageDoc): string {
  const base = p.path.includes("/") ? "../" : "";
  // 75: title «Партнёрам…» из footer-pages.md — 72 символа, оставлен дословно
  if (p.title.length > 75) throw new Error(`${p.path}: title длиннее 75 символов (${p.title.length})`);
  if (p.description.length > 170) throw new Error(`${p.path}: description длиннее 170 символов (${p.description.length})`);
  const canonical = SITE_URL ? `\n<link rel="canonical" href="${absUrl(p.path)}">\n<meta property="og:url" content="${absUrl(p.path)}">` : "";
  const ld = p.ld.map((b) => `<script type="application/ld+json">${JSON.stringify(b).replace(/</g, "\\u003c")}</script>`).join("\n");
  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#000000">
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.description)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="ru_RU">
<meta property="og:site_name" content="Proba Lab">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.description)}">${canonical}
<link rel="icon" type="image/png" href="${base}assets/emblem-ink.png">${FORM_ENDPOINT ? `\n<meta name="proba-form-endpoint" content="${esc(FORM_ENDPOINT)}">` : ""}${YM_ID ? `\n<meta name="proba-ym" content="${esc(YM_ID)}">` : ""}
<link rel="preload" href="${base}assets/fonts/inter-cyrillic-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${base}assets/site.css?v=${ASSET_V}">
${ld}
</head>
<body class="${p.bodyClass ?? "page"}">
${header(base, p.nav)}
<main id="main">
${unglueHeadings(typo(p.body))}
</main>
${footer(base)}
<script src="${base}assets/site.js?v=${ASSET_V}" defer></script>
</body>
</html>
`;
}

/* ---------------- Общие блоки ---------------- */
export interface Cta {
  label: string;
  href: string;
  /** data-task: выбрать задачу в форме на странице. */
  task?: string;
}

const ctaAttrs = (c: Cta) => (c.task ? ` data-task="${c.task}"` : "");

/** Тёмная полоса первого экрана внутренних страниц: крошки, h1, лид, кнопки. */
export function pageHero(o: { crumbs: Crumb[]; eyebrow?: string; h1: string; lead: string; ctas: Cta[]; aside?: string; extra?: string }) {
  const [a, b] = o.ctas;
  return `<section class="page-hero grain" aria-labelledby="page-title">
  <div class="ambient" aria-hidden="true"><i class="a1"></i><i class="a2"></i><i class="a3"></i><b class="g1"></b><b class="g2"></b></div>
  <div class="container">
    ${crumbsHtml(o.crumbs)}
    <div class="page-hero-grid${o.aside ? " has-aside" : ""}">
      <div class="page-hero-copy">
        ${o.eyebrow ? `<p class="eyebrow">${o.eyebrow}</p>` : ""}
        <h1 id="page-title" class="h1-page">${keepLast(o.h1)}</h1>
        <p class="hero-lead">${o.lead}</p>
        <div class="hero-actions">
          <a class="btn btn-primary btn-lg" href="${a!.href}"${ctaAttrs(a!)} data-primary-cta>${a!.label}</a>
          ${b ? `<a class="btn btn-ghost btn-lg" href="${b.href}"${ctaAttrs(b)}>${b.label}</a>` : ""}
        </div>
        ${o.extra ?? ""}
      </div>
      ${o.aside ?? ""}
    </div>
  </div>
</section>`;
}

let secN = 0;
/** Раздел светлой части. */
export function section(o: { id?: string; title: string; lead?: string; body: string; cls?: string; split?: boolean }) {
  const id = o.id ?? `s${++secN}`;
  return `<section id="${id}" class="section${o.cls ? ` ${o.cls}` : ""}" aria-labelledby="${id}-title">
  <div class="container">
    <div class="section-head${o.split ? " is-split" : ""} reveal"><h2 id="${id}-title" class="h2">${keepLast(o.title)}</h2>${o.lead ? `<p class="lead">${o.lead}</p>` : ""}</div>
    ${o.body}
  </div>
</section>`;
}

/** Вопросы: <details> + данные для FAQPage. */
export function faqSection(items: { q: string; a: string }[], id = "faq") {
  return `<section id="${id}" class="section faq" aria-labelledby="${id}-title">
  <div class="container faq-grid">
    <h2 id="${id}-title" class="h2 reveal">Вопросы</h2>
    <div class="faq-list">
      ${items.map((x) => `<details><summary>${x.q}</summary><div class="details-body"><p>${x.a}</p></div></details>`).join("\n      ")}
    </div>
  </div>
</section>`;
}

/** «Дальше» — ссылки на следующий шаг пути. */
export function nextSection(links: { href: string; label: string; text: string }[]) {
  return `<section class="section next" aria-labelledby="next-title">
  <div class="container">
    <h2 id="next-title" class="next-title">Дальше</h2>
    <ul class="next-grid">${links
      .map((l) => `<li><a class="next-card glass-light" href="${l.href}"><span class="next-label">${l.label}</span><span class="next-text">${l.text}</span><span class="arrow" aria-hidden="true"></span></a></li>`)
      .join("")}</ul>
  </div>
</section>`;
}
