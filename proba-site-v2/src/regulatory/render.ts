// Шаблон страниц раздела «Документы и соответствие». Выполняется при сборке (scripts/build-section.mjs).
// На выходе — полные HTML-документы, список фактических фраз для REGULATORY_VERIFY.md и предупреждения.
import { PRICES, REG_PARTNER, REG_PRICES } from "../data";
import { MAIN_HREF, SECTION_DIR, SITE_URL, UPDATED } from "./config";
import { FACT_RE, stripFacts } from "./mark";
import { HUB_GROUPS, NEEDS, PACKAGE_LINE, PAGES, STOP_LINE } from "./pages";
import { allQuizTexts, COSM_SGR_GROUPS } from "./quiz";
import { SOURCES, type SrcKey } from "./sources";
import type { RegPage } from "./types";

export interface Fact {
  page: string;
  sentence: string;
  key: SrcKey;
}

const facts: Fact[] = [];
const warnings: string[] = [];
let current = "";

/* ---------------- Текст ---------------- */
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
/** Неразрывные пробелы: в числах, после «№», «ст.», «ч.», «п.», перед «₽» и «%». */
const nb = (s: string) =>
  s
    .replace(/(\d) (\d{3})/g, "$1\u00a0$2")
    .replace(/(№|ст\.|ч\.|п\.|ПП РФ|НК РФ) /g, "$1\u00a0")
    .replace(/ (₽|%|тыс\.)/g, "\u00a0$1")
    .replace(/ — /g, "\u00a0— ");

/** Слова, которые в непомеченной фразе означают регуляторное утверждение с номером документа. */
const LAWISH = /\d|ТР ТС|ФЗ|НК РФ|КоАП|Решени[еяю] (КТС|Совета|Коллегии|Комиссии)|[Пп]остановлени|[Пп]риказ [А-ЯЁ]/;

/** Обработать текст: снять метки, записать факты, проверить непомеченные цифры и номера НПА, экранировать. */
function t(raw: string, where = ""): string {
  let out = "";
  let last = 0;
  for (const m of raw.matchAll(FACT_RE)) {
    out += plain(raw.slice(last, m.index), where);
    const key = m[1] as SrcKey;
    if (!(key in SOURCES)) throw new Error(`Неизвестный источник «${key}» на странице ${current}`);
    const sentence = m[2]!.trim();
    if (!facts.some((x) => x.page === current && x.sentence === sentence && x.key === key)) facts.push({ page: current, sentence, key });
    out += esc(nb(m[2]!));
    last = m.index! + m[0].length;
  }
  out += plain(raw.slice(last), where);
  return out;
}
function plain(s: string, where: string) {
  if (LAWISH.test(s)) warnings.push(`${current}${where ? ` [${where}]` : ""}: непомеченная фраза с цифрой или номером документа — «${s.trim()}»`);
  return esc(nb(s));
}
/** Текст для метаданных: без меток, без экранирования (экранируется при вставке в атрибут). */
const meta = (s: string) => {
  t(s, "meta"); // записать факты и проверить
  return stripFacts(s);
};

/* ---------------- Ссылки ---------------- */
const main = (hash = "") => `${MAIN_HREF}${hash}`;
const pageHref = (slug: string) => `${slug}.html`;
const bySlug = (slug: string) => {
  const p = PAGES.find((x) => x.slug === slug);
  if (!p) throw new Error(`Нет страницы ${slug}`);
  return p;
};
const absUrl = (slug: string) => (SITE_URL ? `${SITE_URL}/${SECTION_DIR}/${slug === "index" ? "" : pageHref(slug)}` : pageHref(slug));
const price = (slug: string) => (REG_PRICES[slug] ? String(REG_PRICES[slug]) : "");

/* ---------------- Шапка, подвал ---------------- */
function header(p: RegPage) {
  const navLinks = [
    [main("#review"), "Бесплатный разбор"],
    [main("#tasks"), "Задачи"],
    [main("#package"), `Пакет ${nb(PRICES.start)}`],
    [main("#automation"), "Автоматизация"],
  ];
  const docs = (cls = "") => `<a class="${cls}${cls ? " " : ""}is-active" href="index.html"${p.kind === "hub" ? ' aria-current="page"' : ""}>Документы</a>`;
  const cta = p.kind === "hub" ? { href: "#quiz", label: "Какой документ нужен" } : { href: "#form", label: p.cta.label };
  return `<a class="skip-link" href="#main">Перейти к содержанию</a>
<header class="site-header">
  <div class="container header-row">
    <a class="brand" href="${main()}" aria-label="Proba Lab — на главную">
      <span class="brand-mark" aria-hidden="true"></span>
      <span class="brand-name">Proba Lab</span>
    </a>
    <nav class="main-nav" aria-label="Основная навигация">
      ${navLinks.map(([h, l]) => `<a href="${h}">${esc(l!)}</a>`).join("\n      ")}
      ${docs()}
    </nav>
    <div class="header-actions">
      <a class="btn btn-primary btn-sm header-cta" href="${cta.href}">${esc(cta.label)}</a>
      <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-menu" aria-label="Открыть меню"><span></span><span></span></button>
    </div>
  </div>
  <div id="mobile-menu" class="mobile-menu" hidden>
    <nav aria-label="Мобильная навигация" class="container">
      ${navLinks.map(([h, l]) => `<a href="${h}">${esc(l!)}</a>`).join("\n      ")}
      ${docs()}
      <a class="btn btn-primary" href="${cta.href}">${esc(cta.label)}</a>
    </nav>
  </div>
</header>`;
}

function footer() {
  return `<footer class="site-footer">
  <div class="container footer-row">
    <span class="footer-brand"><span class="brand-mark brand-mark-sm" aria-hidden="true"></span> Proba Lab · для производителей и брендов БАД и косметики</span>
    <nav class="footer-links" aria-label="Ссылки в подвале"><a href="index.html">Документы и соответствие</a><a href="kak-my-rabotaem.html">Как мы работаем</a><a href="${main()}">Главная</a></nav>
    <span>© ${new Date().getFullYear()} Proba Lab</span>
  </div>
</footer>`;
}

function breadcrumbs(p: RegPage) {
  const items = [`<li><a href="${main()}">Proba Lab</a></li>`];
  if (p.kind === "hub") items.push(`<li><span aria-current="page">Документы</span></li>`);
  else items.push(`<li><a href="index.html">Документы</a></li>`, `<li><span aria-current="page">${esc(p.name)}</span></li>`);
  return `<nav class="crumbs" aria-label="Хлебные крошки"><ol>${items.join("")}</ol></nav>`;
}

/* ---------------- Блоки ---------------- */
function hero(p: RegPage) {
  const rows = [...(p.summary ?? [])];
  const pr = price(p.slug);
  if (pr) rows.push(["Работа", pr]);
  const aside = rows.length
    ? `<aside class="reg-summary" aria-label="Коротко">
        <p class="reg-summary-title">${p.kind === "hub" ? "Что вы получаете" : "Коротко"}</p>
        <dl>${rows.map(([k, v]) => `<div><dt>${t(k, "summary")}</dt><dd>${t(v, "summary")}</dd></div>`).join("")}</dl>
      </aside>`
    : "";
  return `<section class="reg-hero" aria-labelledby="page-title">
  <div class="container">
    ${breadcrumbs(p)}
    <div class="reg-hero-grid">
      <div class="reg-hero-copy">
        <p class="eyebrow">${t(p.eyebrow)}</p>
        <h1 id="page-title">${t(p.h1, "h1")}</h1>
        <p class="hero-lead">${t(p.lead, "lead")}</p>
        <div class="hero-actions">
          <a class="btn btn-primary btn-lg" href="${p.cta.href}" data-primary-cta>${esc(p.cta.label)}</a>
          ${p.cta2 ? `<a class="btn btn-outline btn-lg" href="${p.cta2.href}">${esc(p.cta2.label)}</a>` : ""}
        </div>
        <p class="reg-updated">Обновлено: ${UPDATED} · <a href="#normy">Нормативная база</a></p>
      </div>
      ${aside}
    </div>
  </div>
</section>`;
}

const sec = (id: string, title: string, body: string, opts: { alt?: boolean; lead?: string; cls?: string } = {}) =>
  `<section${id ? ` id="${id}"` : ""} class="section reg-section${opts.alt ? " reg-alt" : ""}${opts.cls ? ` ${opts.cls}` : ""}" aria-labelledby="${id || "s"}-title">
  <div class="container">
    <div class="section-head reveal"><h2 id="${id || "s"}-title">${esc(title)}</h2>${opts.lead ? `<p class="lead">${t(opts.lead)}</p>` : ""}</div>
    ${body}
  </div>
</section>`;

function who(p: RegPage) {
  if (!p.who) return "";
  return sec(
    "komu",
    "Кому нужно и когда не нужно",
    `<div class="reg-who">
      <div class="reg-who-card is-yes"><h3>Нужно</h3><ul class="check-list check-list-ink">${p.who.yes.map((x) => `<li>${t(x, "who")}</li>`).join("")}</ul></div>
      <div class="reg-who-card is-no"><h3>Не нужно или не к нам</h3><ul class="cross-list">${p.who.no.map((x) => `<li>${t(x, "who")}</li>`).join("")}</ul></div>
    </div>`,
    { alt: true },
  );
}

function includes(p: RegPage) {
  if (!p.includes) return "";
  return sec(
    "vhodit",
    "Что входит",
    `<ul class="reg-grid">${p.includes.map((c) => `<li class="reg-card reveal"><h3>${t(c.title)}</h3><p>${t(c.text, "includes")}</p></li>`).join("")}</ul>`,
  );
}

function steps(p: RegPage) {
  if (!p.steps || !p.timing) return "";
  return sec(
    "etapy",
    "Этапы и сроки",
    `<ol class="reg-steps" style="--n:${p.steps.length}">${p.steps
      .map((s) => `<li><span class="reg-step-dot" aria-hidden="true"></span><b>${t(s.title)}</b><span class="reg-step-text">${t(s.text, "steps")}</span><span class="reg-step-who">${t(s.who)}</span></li>`)
      .join("")}</ol>
    <div class="reg-timing">
      <div class="reg-timing-card is-agency"><p class="reg-timing-label">Срок в ведомстве</p><p>${t(p.timing.agency, "timing")}</p></div>
      <div class="reg-timing-card is-project"><p class="reg-timing-label">Весь проект</p><p>${t(p.timing.project, "timing")}</p></div>
    </div>`,
    { alt: true, lead: "Срок ведомства и срок всего проекта — разные вещи. Показываем оба." },
  );
}

function fromYouAndEstimate(p: RegPage) {
  if (!p.fromYou && !p.estimate) return "";
  const pr = price(p.slug);
  const lines = p.estimate ?? [];
  return `<section class="section reg-section" aria-labelledby="ot-vas-title">
  <div class="container reg-two">
    <div id="ot-vas">
      <h2 id="ot-vas-title" class="reveal">Что нужно от вас</h2>
      <ul class="check-list check-list-ink reg-list">${(p.fromYou ?? []).map((x) => `<li>${t(x, "fromYou")}</li>`).join("")}</ul>
    </div>
    <div id="smeta" class="reg-estimate">
      <h2 id="smeta-title">Из чего складывается смета</h2>
      <ul>${lines
        .map((l, i) => `<li><span class="reg-estimate-item">${t(l.item, "estimate")}</span><span class="reg-estimate-note">${t(l.note, "estimate")}${i === 0 && pr ? ` <b class="reg-price">${esc(nb(pr))}</b>` : ""}</span></li>`)
        .join("")}</ul>
      ${p.estimateNote ? `<p class="fine">${t(p.estimateNote)}</p>` : ""}
    </div>
  </div>
</section>`;
}

function mistakes(p: RegPage) {
  if (!p.mistakes) return "";
  return sec("oshibki", "Частые ошибки", `<ul class="reg-mistakes">${p.mistakes.map((c) => `<li class="reveal"><h3>${t(c.title)}</h3><p>${t(c.text, "mistakes")}</p></li>`).join("")}</ul>`, { alt: true });
}

function faq(p: RegPage) {
  return `<section id="faq" class="section reg-section faq" aria-labelledby="faq-title">
  <div class="container faq-grid">
    <h2 id="faq-title" class="reveal">Вопросы</h2>
    <div class="faq-list">
      ${p.faq.map((x) => `<details><summary>${t(x.q, "faq")}</summary><div class="details-body"><p>${t(x.a, "faq")}</p></div></details>`).join("\n      ")}
    </div>
  </div>
</section>`;
}

function bridge(p: RegPage) {
  const b = p.bridge ?? {
    title: "Документы, этикетка и карточка говорят одно и то же",
    text: "Этикетку, упаковку и карточку товара Proba Lab делает по тем же документам. Наименование, состав и формулировки совпадают, а покупатель понимает, зачем выбирать ваш продукт.",
    points: ["Этикетка и упаковка по требованиям", "Карточка для маркетплейса, которая совпадает с документами", "Предложение и аргументы для покупателей и партнёров"],
  };
  return `<section class="section reg-section reg-bridge-wrap" aria-labelledby="most-title">
  <div class="container">
    <div class="start-card reg-bridge reveal">
      <p class="eyebrow">Proba Lab</p>
      <h2 id="most-title">${esc(b.title)}</h2>
      <p>${t(b.text, "bridge")}</p>
      <ul class="check-list">${b.points.map((x) => `<li>${t(x)}</li>`).join("")}</ul>
      <p class="start-fine">${t(PACKAGE_LINE)}</p>
      <div class="reg-bridge-actions">
        <a class="btn btn-light" href="${main("#package")}">Документы + этикетка + карточка</a>
        <a class="btn reg-btn-ghost" href="${main("#tasks")}">Все задачи Proba Lab</a>
      </div>
    </div>
  </div>
</section>`;
}

function related(p: RegPage) {
  if (!p.related.length) return "";
  return sec(
    "smezhnye",
    "Смежные услуги",
    `<ul class="svc-grid">${p.related.map((s) => svcCard(bySlug(s))).join("")}</ul>`,
    { alt: true },
  );
}

function svcCard(q: RegPage) {
  const pr = price(q.slug);
  return `<li class="svc-card reveal"><a href="${pageHref(q.slug)}"><span class="svc-kicker">${esc(q.group ?? "")}</span><span class="svc-title">${esc(q.name)}</span><span class="svc-text">${t(q.cardText, "card")}</span>${pr ? `<span class="reg-price">${esc(nb(pr))}</span>` : ""}<span class="svc-more" aria-hidden="true">Подробнее</span></a></li>`;
}

function form(p: RegPage) {
  const cats = ["БАД", "Косметика", "Пищевая продукция", "Спортивное питание", "Другое"];
  const opts = NEEDS.map((n) => `<option${n === p.need ? " selected" : ""}>${esc(n)}</option>`).join("");
  return `<section id="form" class="section reg-section project-form" aria-labelledby="form-title">
  <div class="container two-col">
    <div>
      <h2 id="form-title" tabindex="-1">${esc(p.formTitle ?? "Проверим состав и посчитаем смету")}</h2>
      <p class="lead">${t(p.formLead ?? "Бесплатно: скажем, какие документы нужны, и из чего сложится смета. Пришлите состав или ссылку на продукт.")}</p>
      <ul class="check-list check-list-ink reg-form-points">
        <li>Предварительный список документов</li>
        <li>Что повлияет на смету и сроки</li>
        <li>Риски в составе и формулировках</li>
      </ul>
    </div>
    <form id="reg-form" class="form-card" novalidate data-form="reg" aria-labelledby="form-title">
      <fieldset class="field" data-required-group="category">
        <legend>Категория</legend>
        <div class="choice-row">${cats.map((c) => `<label class="choice"><input type="radio" name="category" value="${esc(c)}"><span>${esc(c)}</span></label>`).join("")}</div>
      </fieldset>
      <div class="field">
        <label for="rf-product">Продукт <span class="opt">необязательно</span></label>
        <input id="rf-product" name="product" autocomplete="off" placeholder="Например: витамин D3, капсулы">
      </div>
      <div class="field">
        <label for="rf-composition">Состав или описание</label>
        <textarea id="rf-composition" name="composition" rows="4" placeholder="Компоненты и дозировки или коротко о продукте" aria-describedby="rf-composition-hint"></textarea>
        <p class="hint" id="rf-composition-hint">Достаточно состава или ссылки ниже</p>
      </div>
      <div class="field">
        <label for="rf-url">Ссылка на продукт или документы <span class="opt">необязательно</span></label>
        <input id="rf-url" name="productUrl" inputmode="url" autocomplete="url" placeholder="ozon.ru/product/… или ссылка на файл">
      </div>
      <div class="field">
        <label for="rf-need">Что нужно</label>
        <select id="rf-need" name="need">${opts}</select>
      </div>
      <div class="field">
        <label for="rf-contact">Контакт для ответа</label>
        <input id="rf-contact" name="contact" autocomplete="off" placeholder="Email, телефон или Telegram">
      </div>
      <label class="consent"><input type="checkbox" name="consent"><span>Согласен на обработку персональных данных для ответа на заявку</span></label>
      <button class="btn btn-primary btn-lg btn-block" type="submit">${esc(p.kind === "hub" ? "Проверить состав бесплатно" : p.cta.label)}</button>
      <p class="form-status" role="status" aria-live="polite"></p>
    </form>
  </div>
</section>`;
}

function norms(p: RegPage) {
  return `<section id="normy" class="reg-meta" aria-labelledby="normy-title">
  <div class="container">
    <p class="reg-meta-date">Обновлено: ${UPDATED}</p>
    ${
      p.norms.length
        ? `<h2 id="normy-title" class="reg-meta-title">Нормативная база</h2>
    <ul class="reg-norms">${p.norms.map((n) => `<li>${t(n, "norms")}</li>`).join("")}</ul>
    <p class="fine">Номера и даты документов сверяет специалист-партнёр перед каждым обновлением страницы. Решения по продукту принимают уполномоченные органы.</p>`
        : `<h2 id="normy-title" class="reg-meta-title">Нормативная база</h2><p class="fine">Документы по каждой услуге перечислены на её странице.</p>`
    }
  </div>
</section>`;
}

/* ---------------- Хаб ---------------- */
function quizSection() {
  const radio = (name: string, v: string, l: string) => `<label class="choice"><input type="radio" name="${name}" value="${v}"><span>${esc(l)}</span></label>`;
  const check = (name: string, v: string, l: string) => `<label class="choice"><input type="checkbox" name="${name}" value="${v}"><span>${esc(l)}</span></label>`;
  // Тексты квиза, которые появляются после ответа, — тоже в реестр фактов (страница хаба)
  for (const s of allQuizTexts()) t(s, "quiz");
  return `<section id="quiz" class="section reg-section reg-alt" aria-labelledby="quiz-title">
  <div class="container">
    <div class="section-head reveal"><h2 id="quiz-title">Какой документ нужен вашему продукту</h2><p class="lead">Три вопроса — и предварительный список документов и обязанностей. Точно определим по составу.</p></div>
    <div class="quiz-grid">
      <form id="quiz-form" class="form-card quiz-card" novalidate aria-labelledby="quiz-title">
        <fieldset class="field" data-required-group="type">
          <legend><span class="quiz-n">1</span> Что за продукт?</legend>
          <div class="choice-row">${radio("type", "bad", "БАД")}${radio("type", "cosm", "Косметика")}${radio("type", "food", "Пищевая продукция")}${radio("type", "sport", "Спортивное питание")}${radio("type", "other", "Другое")}</div>
        </fieldset>
        <fieldset class="field quiz-sub" data-cosm hidden>
          <legend>Косметика относится к одной из групп: ${t(`⟪cosm-sgr|${COSM_SGR_GROUPS}⟫`, "quiz")}?</legend>
          <div class="choice-row">${radio("cosmGroup", "yes", "Да")}${radio("cosmGroup", "no", "Нет")}${radio("cosmGroup", "unsure", "Не уверен")}</div>
          <p class="hint">Перечень не полный — некоторые категории уточним по составу.</p>
        </fieldset>
        <fieldset class="field" data-required-group="production">
          <legend><span class="quiz-n">2</span> Где производите?</legend>
          <div class="choice-row">${radio("production", "own", "Своё производство")}${radio("production", "contract", "Контрактное производство")}${radio("production", "import", "Импорт")}</div>
        </fieldset>
        <fieldset class="field">
          <legend><span class="quiz-n">3</span> Где будете продавать? <span class="opt">можно несколько</span></legend>
          <div class="choice-row">${check("channels", "marketplace", "Маркетплейсы")}${check("channels", "pharmacy", "Аптеки")}${check("channels", "retail", "Торговые сети")}${check("channels", "site", "Свой сайт")}</div>
        </fieldset>
        <button class="btn btn-primary btn-lg btn-block" type="submit">Показать документы</button>
        <p class="form-status" role="status" aria-live="polite"></p>
      </form>
      <div id="quiz-result" class="quiz-result" aria-live="polite" tabindex="-1">
        <p class="quiz-empty">Ответьте на вопросы — здесь появится предварительный список документов и связанных обязанностей.</p>
      </div>
    </div>
  </div>
</section>`;
}

function hubServices() {
  const groups = HUB_GROUPS.map((g) => {
    const items = PAGES.filter((p) => p.group === g);
    return `<div class="svc-group"><h3 class="svc-group-title">${esc(g)}</h3><ul class="svc-grid">${items.map(svcCard).join("")}</ul></div>`;
  }).join("");
  return sec("uslugi", "Что делаем", groups, { lead: "Документы, требования к производству, испытания и вывод на рынок — с одной сметой и одним планом." });
}

function hubHow() {
  return sec(
    "kak",
    "Как мы работаем",
    `<ul class="how-strip">
      <li class="reveal"><h3>Роли</h3><p>Proba Lab — единое окно: состав, формулировки, этикетка и карточка. Регуляторные работы ведут специалисты-партнёры Proba Lab по договору. Испытания — аккредитованные лаборатории.</p></li>
      <li class="reveal"><h3>Смета</h3><p>Работа, испытания, экспертиза и госпошлина — отдельными строками. Внешние расходы — по факту.</p></li>
      <li class="reveal"><h3>Сроки</h3><p>Отдельно срок рассмотрения в ведомстве и отдельно срок всего проекта. Решение ведомства не обещаем — обещаем полный и проверенный комплект.</p></li>
    </ul>
    <div class="how-foot"><a class="btn btn-outline" href="kak-my-rabotaem.html">Подробнее о ролях и договоре</a><p class="stop-line">${esc(STOP_LINE)}</p></div>`,
    { alt: true },
  );
}

/* ---------------- «Как мы работаем» ---------------- */
function aboutBody() {
  const partner = REG_PARTNER.name
    ? `<p class="role-partner"><b>${esc(REG_PARTNER.name)}</b>${REG_PARTNER.inn ? `, ИНН ${esc(REG_PARTNER.inn)}` : ""}${REG_PARTNER.note ? `. ${esc(REG_PARTNER.note)}` : ""}</p>`
    : "";
  const roles = sec(
    "roli",
    "Кто что делает",
    `<ul class="roles">
      <li class="role reveal"><p class="role-kicker">Единое окно</p><h3>Proba Lab</h3><p>Принимаем задачу, проверяем состав и формулировки, ведём план и смету. Делаем этикетку, упаковку и карточку, которые совпадают с документами.</p></li>
      <li class="role reveal"><p class="role-kicker">Регуляторные работы</p><h3>Специалисты-партнёры Proba Lab</h3><p>Работают по договору: СГР и декларации, ТУ и маркировка, ХАССП и санитарные требования, GMP. Партнёр указан в договоре.</p>${partner}</li>
      <li class="role reveal"><p class="role-kicker">Испытания</p><h3>Аккредитованные лаборатории</h3><p>${t("Испытательные лаборатории, " + "⟪lab-scope|аккредитованные в национальной системе аккредитации. Статус и область аккредитации каждой можно проверить в реестре Росаккредитации (ФСА).⟫")} Протокол выдаёт лаборатория.</p></li>
      <li class="role reveal"><p class="role-kicker">Решение</p><h3>Государственные органы</h3><p>${t("⟪rpn-sgr|СГР выдаёт Роспотребнадзор,⟫ ⟪decl|декларации регистрируются в реестре Росаккредитации.⟫")} Решение принимают они, а не мы.</p></li>
    </ul>`,
    { alt: true },
  );
  const contract = `<section class="section reg-section" aria-labelledby="dogovor-title">
  <div class="container reg-two">
    <div id="dogovor">
      <h2 id="dogovor-title" class="reveal">Договор</h2>
      <ul class="check-list check-list-ink reg-list">
        <li>Договор заключаем до начала работ</li>
        <li>В нём — этапы, результат каждого этапа и исполнители</li>
        <li>Заранее фиксируем, что делаем, если ведомство откажет</li>
        <li>Внешние расходы — испытания, экспертиза, госпошлина — отдельными строками и по факту</li>
      </ul>
    </div>
    <div id="smeta" class="reg-estimate">
      <h2 id="smeta-title">Как строится смета</h2>
      <ol class="reg-flow">
        <li><b>Анализ состава</b><span>Бесплатно определяем документы и что повлияет на цену</span></li>
        <li><b>Смета по строкам</b><span>Работа, испытания, экспертиза, госпошлина, доставка образцов</span></li>
        <li><b>Согласование</b><span>Работы начинаем после того, как вы согласовали смету</span></li>
        <li><b>Расходы по факту</b><span>Внешние платежи — с документами лаборатории, экспертной организации и банка</span></li>
      </ol>
    </div>
  </div>
</section>`;
  const timing = sec(
    "sroki",
    "Сроки",
    `<div class="reg-timing">
      <div class="reg-timing-card is-agency"><p class="reg-timing-label">Срок в ведомстве</p><p>${t("Регламентный срок рассмотрения. Например, ⟪rpn-term|заявление на СГР Роспотребнадзор рассматривает не более 30 дней; испытания и экспертиза в этот срок не входят.⟫")}</p></div>
      <div class="reg-timing-card is-project"><p class="reg-timing-label">Весь проект</p><p>Анализ, документы, испытания, экспертиза, подача и решение. Называем после анализа состава — по каждому этапу отдельно.</p></div>
    </div>`,
    { alt: true },
  );
  const never = sec(
    "ne-obeshchaem",
    "Чего мы никогда не обещаем",
    `<ul class="reg-mistakes reg-never">
      <li><h3>Регистрацию или срок «наверняка»</h3><p>Решение принимает ведомство. Мы снижаем риск отказа проверкой до подачи.</p></li>
      <li><h3>Документы «без испытаний»</h3><p>Протоколы — только по результатам испытаний в аккредитованной лаборатории.</p></li>
      <li><h3>Продажи до получения документов</h3><p>${t("⟪law-290|С 1 октября 2026 года предлагать к продаже незарегистрированные БАД запрещено.⟫")}</p></li>
      <li><h3>Лечебный эффект</h3><p>Ни на упаковке, ни в карточке, ни в рекламе.</p></li>
      <li><h3>Лаборатории «свои»</h3><p>Аккредитованы лаборатории, а не Proba Lab. Мы подбираем и проверяем их.</p></li>
    </ul>
    <p class="stop-line">${esc(STOP_LINE)}</p>`,
  );
  return roles + contract + timing + never;
}

/* ---------------- JSON-LD ---------------- */
function jsonLd(p: RegPage) {
  const crumbs = [{ name: "Proba Lab", item: SITE_URL ? `${SITE_URL}/` : main() }, { name: "Документы", item: absUrl("index") }];
  if (p.kind !== "hub") crumbs.push({ name: p.name, item: absUrl(p.slug) });
  const blocks: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: c.item })),
    },
  ];
  if (p.faq.length)
    blocks.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: p.faq.map((x) => ({ "@type": "Question", name: stripFacts(x.q), acceptedAnswer: { "@type": "Answer", text: stripFacts(x.a) } })),
    });
  if (p.kind === "service")
    blocks.push({
      "@context": "https://schema.org",
      "@type": "Service",
      name: stripFacts(p.h1),
      serviceType: p.serviceType,
      description: stripFacts(p.description),
      ...(SITE_URL ? { url: absUrl(p.slug) } : {}),
      provider: { "@type": "Organization", name: "Proba Lab" },
    });
  return blocks.map((b) => `<script type="application/ld+json">${JSON.stringify(b).replace(/</g, "\\u003c")}</script>`).join("\n");
}

/* ---------------- Документ ---------------- */
function doc(p: RegPage, body: string) {
  const title = meta(p.title);
  const description = meta(p.description);
  if (title.length > 60) throw new Error(`${p.slug}: title длиннее 60 символов (${title.length})`);
  if (description.length > 160) throw new Error(`${p.slug}: description длиннее 160 символов (${description.length})`);
  const canonical = SITE_URL ? `\n<link rel="canonical" href="${absUrl(p.slug)}">\n<meta property="og:url" content="${absUrl(p.slug)}">` : "";
  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<link rel="icon" href="data:,">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="ru_RU">
<meta property="og:site_name" content="Proba Lab">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">${canonical}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;500;600&family=Manrope:wght@600;700&display=swap">
<link rel="stylesheet" href="section.css">
${jsonLd(p)}
</head>
<body class="reg reg-${p.kind}">
${header(p)}
<main id="main">
${body}
</main>
${footer()}
<script src="section.js" defer></script>
</body>
</html>
`;
}

export function renderPage(p: RegPage): string {
  current = p.slug;
  let body = hero(p);
  if (p.kind === "hub") body += quizSection() + hubServices() + hubHow() + faq(p) + bridge(p) + form(p) + norms(p);
  else if (p.kind === "about") body += aboutBody() + faq(p) + related(p) + form(p) + norms(p);
  else body += who(p) + includes(p) + steps(p) + fromYouAndEstimate(p) + mistakes(p) + faq(p) + bridge(p) + related(p) + form(p) + norms(p);
  return doc(p, body);
}

export function renderAll() {
  facts.length = 0;
  warnings.length = 0;
  const files = PAGES.map((p) => ({ file: `${p.slug}.html`, slug: p.slug, title: stripFacts(p.title), html: renderPage(p) }));
  return { files, facts: [...facts], warnings: [...warnings], sources: SOURCES };
}
