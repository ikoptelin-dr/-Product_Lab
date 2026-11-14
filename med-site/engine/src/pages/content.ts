// Страницы из текстов proba-growth/content/pages/*.md (волны 1–4).
// Markdown → HTML делает scripts/build.mjs (pandoc), сюда приходит готовый HTML с токенами @@T{n}@@:
// метки фактов ⟪ключ|фраза⟫, формы, CTA и калькулятор. Здесь — каркас страницы, факты в REGULATORY_VERIFY.md и JSON-LD.
import { COMPANY, TASKS } from "../data";
import { projectSection, reviewSection } from "../forms";
import { breadcrumbLd, companyLd, esc, faqLd, keepLast, pageHero, serviceLd, type NavKey, type PageDoc } from "../layout";
import { factText } from "../regulatory/render";
import { AUTHOR, PUBLISHED } from "./blog";
import { calcSection } from "./tools";
import { parallelVisual, pathVisual } from "../visuals";
import { enhance, gradH1, inline } from "../blocks";
import { bento, marquee } from "../home";
import { reelSection } from "../showreel";

export type Token =
  | { type: "fact"; raw: string }
  | { type: "form"; task: string; comment: string }
  | { type: "cta"; label: string; href: string; second?: { label: string; href: string } }
  | { type: "button"; label: string }
  | { type: "calc" }
  | { type: "faq"; items: { q: string; a: string }[] };

export interface ContentPage {
  /** Адрес из frontmatter, например "dokumenty/otkaznoe-pismo/". */
  url: string;
  /** Файл в dist, например "dokumenty/otkaznoe-pismo.html". */
  file: string;
  title: string;
  description: string;
  h1: string;
  cluster: string;
  type: string;
  /** Лид первого экрана (HTML с токенами). */
  lead: string;
  /** Цена «от» под лидом (HTML). */
  price?: string;
  heroCtas: { label: string; href: string }[];
  /** Тело страницы (HTML с токенами). */
  html: string;
  tokens: Token[];
  faq: { q: string; a: string }[];
  author?: string;
  /** Дата из frontmatter (updated), YYYY-MM-DD. */
  updated?: string;
}

/** Хабы для хлебных крошек и меню: первая часть адреса → название, файл, пункт меню. */
const HUBS: Record<string, { name: string; file: string; nav: NavKey }> = {
  marketing: { name: "Маркетинг", file: "marketing.html", nav: "marketing" },
  blog: { name: "Блог", file: "blog/index.html", nav: "blog" },
  kejsy: { name: "Кейсы", file: "kejsy.html", nav: "cases" },
};

/** Цвет направления (v4): документы — изумруд, маркетинг — фиолетовый, аналитика — голубой. */
const DIR: Record<string, string> = { marketing: "mkt", kejsy: "mkt", blog: "mkt", metodologiya: "ana", uslugi: "ana", "o-nas": "docs" };

/** Шоурил (src/showreel.ts) — на главной и на страницах 3D и видео. */
const REEL: Record<string, { title: string; lead: string }> = {
  "": { title: "Путь пациента — <span class=\"grad\">за 15 секунд</span>", lead: "Моушн-дизайн, собранный кодом. Так же оживляем материалы врачей для пациентов клиники." },
  "marketing/3d-vizualizaciya-upakovki/": { title: "Моушн и 3D — <span class=\"grad\">в деле</span>", lead: "Ролик собран кодом: так же оживляем вашу упаковку для карточки, сайта и соцсетей." },
  "marketing/video-dlya-kartochek/": { title: "Как это может <span class=\"grad\">двигаться</span>", lead: "15 секунд — от состава до продаж. Видео для карточки строим так же: коротко, по сценам, без съёмочного дня." },
};

/** Задача формы из текста («Документы и регистрация», «Маркетинг»…) → id из TASKS. */
function taskId(label: string): string {
  const l = label.toLowerCase();
  const id = /замер/.test(l) ? "zamer" : /диагност/.test(l) ? "diag" : /исследован|jtbd|cjm|нетнограф/.test(l) ? "research" : /b2b|сырь|лпр/.test(l) ? "b2b" : /запуск|сайт|бот|позиционир|маркетинг/.test(l) ? "launch" : /аналитик|воронк/.test(l) ? "analytics" : /сопровожд/.test(l) ? "support" : "";
  if (id && !TASKS.some((t) => t.id === id)) throw new Error(`Нет задачи ${id}`);
  return id;
}

const FORM_TITLES: Record<string, string> = {
  zamer: "Заказать замер возврата",
  diag: "Записаться на диагностику",
  research: "Обсудить исследование",
  b2b: "Обсудить выход на рынок",
  launch: "Обсудить запуск",
  analytics: "Обсудить аналитику",
  support: "Обсудить сопровождение",
  "": "Обсудить задачу",
};

export function renderContent(p: ContentPage): PageDoc {
  const base = p.file.includes("/") ? "../" : "";
  const slug = p.file.replace(/\.html$/, "");
  const top = p.url.replace(/^\/+/, "").split("/")[0] ?? "";
  const hub = HUBS[top];
  const isHome = p.file === "index.html";
  const isArticle = p.type === "article";

  let formUsed = false;
  const tok = (html: string) =>
    html.replace(/@@T(\d+)@@/g, (_, n) => {
      const t = p.tokens[Number(n)]!;
      switch (t.type) {
        case "fact":
          return factText(slug, t.raw, "content");
        case "faq":
          return `</div></div></section><section id="faq" class="section faq" aria-labelledby="faq-title">
  <div class="container faq-grid">
    <h2 id="faq-title" class="h2 reveal">Вопросы</h2>
    <div class="faq-list">
      ${t.items.map((x) => `<details><summary>${tok(inline(x.q))}</summary><div class="details-body">${tok(inline(x.a))}</div></details>`).join("\n      ")}
    </div>
  </div>
</section><section class="section"><div class="container"><div class="prose">`;
        case "calc":
          return `</div></div></section>${calcSection}<section class="section"><div class="container"><div class="prose">`;
        case "button":
          return `<p><a class="btn btn-primary" href="#project-form">${esc(t.label)}</a></p>`;
        case "cta":
          return `</div></div></section><section class="section" aria-label="${esc(t.label)}"><div class="container"><div class="dark-card grain article-cta reveal">
      <div><p class="h2">${keepLast(esc(t.label))}</p></div>
      <div class="hero-actions"><a class="btn btn-primary btn-lg" href="${esc(t.href)}">${esc(t.label)}</a>${t.second ? `<a class="btn btn-ghost btn-lg" href="${esc(t.second.href)}">${esc(t.second.label)}</a>` : ""}</div>
    </div></div></section><section class="section"><div class="container"><div class="prose">`;
        case "form": {
          formUsed = true;
          const id = taskId(t.task);
          return `</div></div></section>${isHome ? reviewSection() : ""}${projectSection(id, { title: FORM_TITLES[id], lead: t.comment ? `${esc(t.comment)}: расскажите, что нужно сделать. Уточним объём и назовём смету до начала работ.` : undefined, base })}<section class="section"><div class="container"><div class="prose">`;
        }
      }
    });

  const crumbs = isHome ? [] : [{ name: "Proba-Product Laboratory", href: `${base}index.html` }, ...(hub ? [{ name: hub.name, href: base + hub.file }] : []), { name: p.h1 }];
  const ctaTok = p.tokens.find((t) => t.type === "cta") as Extract<Token, { type: "cta" }> | undefined;
  const ctas = p.heroCtas.length
    ? p.heroCtas
    : p.type === "tool"
      ? [{ label: "Посчитать", href: "#calc" }, { label: "Разбор всех SKU", href: "#project-form" }]
      : ctaTok
        ? [{ label: ctaTok.label, href: ctaTok.href }]
        : isArticle
          ? [{ label: hub ? `Все статьи` : "На главную", href: base + (hub?.file ?? "index.html") }]
          : [{ label: "Обсудить задачу", href: "#project-form" }];
  const { html: bodyHtml, toc } = enhance(p.html, { article: isArticle });
  const words = p.html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  const readMin = Math.max(2, Math.round(words / 170));
  const heroHtml = pageHero({
    crumbs,
    eyebrow: isArticle ? "Блог" : p.type === "case" ? esc(p.cluster || "Кейс") : undefined,
    h1: gradH1(esc(p.h1)),
    lead: tok(inline(p.lead)),
    ctas: ctas.map((c) => ({ label: esc(c.label), href: esc(c.href) })),
    aside: isHome ? pathVisual() : p.url === "marketing/upakovka-do-registracii/" ? parallelVisual() : undefined,
    extra: [p.price ? `<p class="hero-price">${tok(p.price)}</p>` : "", isArticle ? `<p class="byline"><span>${esc(p.author ?? `${AUTHOR.name}, ${AUTHOR.role}`)}</span><span aria-hidden="true"> · </span><time datetime="${PUBLISHED.iso}">${PUBLISHED.text}</time><span aria-hidden="true"> · </span><span>${readMin} мин чтения</span></p>` : ""].join(""),
  }).replace(/<nav class="crumbs"[^]*?<\/nav>/, isHome ? "" : "$&");

  const tocHtml = isArticle && toc.length >= 3 ? `<nav class="toc" aria-label="Содержание статьи"><p class="toc-t">В статье</p><ol>${toc.filter((x) => !/^(Вопросы|Коротко)/.test(x.t)).map((x) => `<li><a href="#${x.id}">${esc(x.t)}</a></li>`).join("")}</ol></nav>` : "";
  let body = `${isArticle ? '<div class="read-progress" aria-hidden="true"><span></span></div>' : ""}<section class="section${isArticle ? " article-body" : " blk-intro"}"><div class="container"><div class="prose">${tocHtml}${tok(bodyHtml)}</div></div></section>`;
  if (!formUsed && !isArticle) body += projectSection("", { base });
  // Пустые секции, оставшиеся после вставки блоков
  body = body.replace(/<section class="section[^"]*"(?: aria-labelledby="[^"]*")?><div class="container"><div class="prose[^"]*">\s*<\/div><\/div><\/section>/g, "");

  const pathLd = [{ name: "Proba-Product Laboratory", path: "index.html" }, ...(hub ? [{ name: hub.name, path: hub.file }] : []), { name: p.h1, path: p.file }];
  const ld: object[] = isHome
    ? [{ "@context": "https://schema.org", "@type": "Organization", name: COMPANY.brand, ...companyLd(), description: p.description, knowsAbout: ["Медицинский маркетинг", "OSINT", "Нетнография", "Исследование пути пациента (CJM)", "Jobs to be done", "B2B-продажи научного сырья", "Веб-аналитика и воронки"] }]
    : [breadcrumbLd(pathLd)];
  const plainDesc = p.description;
  if (isArticle)
    ld.push({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: p.h1,
      description: plainDesc,
      inLanguage: "ru",
      datePublished: PUBLISHED.iso,
      dateModified: p.updated || PUBLISHED.iso,
      author: { "@type": "Person", name: AUTHOR.name, jobTitle: "Врач, основатель Proba-Product Laboratory" },
      publisher: { "@type": "Organization", name: "Proba-Product Laboratory" },
    });
  else if (p.type === "service" || p.type === "tool") ld.push(serviceLd(p.h1, hub?.name ?? p.h1, plainDesc, p.file));
  if (p.faq.length) ld.push(faqLd(p.faq));

  return {
    path: p.file,
    title: p.title,
    description: p.description,
    nav: isHome ? "home" : p.url.startsWith("kejsy") ? "cases" : (hub?.nav ?? (p.url.startsWith("metodologiya") ? "method" : p.url.startsWith("o-nas") ? "about" : p.url.startsWith("uslugi") ? "prices" : "none")),
    ld,
    body: `${heroHtml}\n${isHome ? marquee() : ""}${REEL[p.url] ? reelSection(REEL[p.url]!) : ""}\n<div class="light">\n${isHome ? bento(base) : ""}${body}\n</div>`,
    bodyClass: `page ${isHome ? "page-home" : isArticle ? "page-article" : "page-service"} dir-${DIR[top] ?? "docs"}`,
  };
}
