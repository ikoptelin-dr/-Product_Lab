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
  dokumenty: { name: "Документы", file: "dokumenty/index.html", nav: "docs" },
  marketing: { name: "Маркетинг", file: "marketing.html", nav: "marketing" },
  prodvizhenie: { name: "Продвижение", file: "prodvizhenie.html", nav: "promo" },
  analitika: { name: "Аналитика", file: "analitika.html", nav: "analytics" },
  avtomatizaciya: { name: "Автоматизация", file: "avtomatizaciya.html", nav: "automation" },
  blog: { name: "Блог", file: "blog/index.html", nav: "blog" },
  kejsy: { name: "Кейсы", file: "kejsy.html", nav: "cases" },
};

/** Задача формы из текста («Документы и регистрация», «Маркетинг»…) → id из TASKS. */
function taskId(label: string): string {
  const l = label.toLowerCase();
  const id = /документ|регистрац/.test(l) ? "docs" : /аналитик/.test(l) ? "analytics" : /автоматиз/.test(l) ? "automation" : /аудит/.test(l) ? "audit" : /маркетинг|продвижен/.test(l) ? "promo" : "";
  if (id && !TASKS.some((t) => t.id === id)) throw new Error(`Нет задачи ${id}`);
  return id;
}

const FORM_TITLES: Record<string, string> = {
  docs: "Обсудить документы",
  promo: "Обсудить задачу",
  analytics: "Обсудить аналитику",
  automation: "Обсудить автоматизацию",
  audit: "Обсудить аудит",
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
      ${t.items.map((x) => `<details><summary>${tok(x.q)}</summary><div class="details-body">${tok(x.a)}</div></details>`).join("\n      ")}
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

  const crumbs = isHome ? [] : [{ name: "Proba Lab", href: `${base}index.html` }, ...(hub ? [{ name: hub.name, href: base + hub.file }] : []), { name: p.h1 }];
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
  const heroHtml = pageHero({
    crumbs,
    eyebrow: isArticle ? "Блог" : undefined,
    h1: esc(p.h1),
    lead: tok(p.lead),
    ctas: ctas.map((c) => ({ label: esc(c.label), href: esc(c.href) })),
    aside: isHome ? pathVisual() : p.url === "marketing/upakovka-do-registracii/" ? parallelVisual() : undefined,
    extra: [p.price ? `<p class="hero-price">${tok(p.price)}</p>` : "", isArticle ? `<p class="byline"><span>${esc(p.author ?? `${AUTHOR.name}, ${AUTHOR.role}`)}</span><span aria-hidden="true"> · </span><time datetime="${PUBLISHED.iso}">${PUBLISHED.text}</time></p>` : ""].join(""),
  }).replace(/<nav class="crumbs"[^]*?<\/nav>/, isHome ? "" : "$&");

  let body = `<section class="section"><div class="container"><div class="prose">${tok(p.html)}</div></div></section>`;
  if (!formUsed && !isArticle) body += projectSection("", { base });
  // Пустые секции, оставшиеся после вставки блоков
  body = body.replace(/<section class="section"><div class="container"><div class="prose">\s*<\/div><\/div><\/section>/g, "");

  const pathLd = [{ name: "Proba Lab", path: "index.html" }, ...(hub ? [{ name: hub.name, path: hub.file }] : []), { name: p.h1, path: p.file }];
  const ld: object[] = isHome
    ? [{ "@context": "https://schema.org", "@type": "Organization", name: COMPANY.brand, ...companyLd(), description: p.description, knowsAbout: ["Регистрация БАД", "Документы на косметику", "3D-визуализация упаковки", "Позиционирование бренда", "Исследование клиентов (JTBD, CJM)", "Карточки маркетплейсов", "Веб-аналитика"] }]
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
      author: { "@type": "Person", name: AUTHOR.name, jobTitle: "Врач, основатель Proba Lab" },
      publisher: { "@type": "Organization", name: "Proba Lab" },
    });
  else if (p.type === "service" || p.type === "tool") ld.push(serviceLd(p.h1, hub?.name ?? p.h1, plainDesc, p.file));
  if (p.faq.length) ld.push(faqLd(p.faq));

  return {
    path: p.file,
    title: p.title,
    description: p.description,
    nav: isHome ? "home" : p.url.startsWith("kejsy") ? "cases" : (hub?.nav ?? (p.url.startsWith("kak-my-rabotaem") ? "how" : "none")),
    ld,
    body: `${heroHtml}\n<div class="light">\n${body}\n</div>`,
    bodyClass: isHome ? "page page-home" : isArticle ? "page page-article" : undefined,
  };
}
