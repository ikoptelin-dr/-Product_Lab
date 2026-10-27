// Шаблон раздела «Документы и соответствие» в дизайне v3. Перенесён из proba-site-v2/src/regulatory/render.ts:
// тексты, факты и метки источников те же (pages.ts, quiz.ts, sources.ts — копии v2), меняются только разметка и ссылки.
// На выходе — страницы dokumenty/*.html, общая страница kak-my-rabotaem.html, список фактов для REGULATORY_VERIFY.md и предупреждения.
import { PRICES, REG_PARTNER, REG_PRICES } from "../data";
import { consent, projectSection } from "../forms";
import { docPrices, priceText, unitText } from "../prices";
import { f } from "./mark";
import { breadcrumbLd, faqLd, keepLast, nextSection, renderDoc, serviceLd, type PageDoc } from "../layout";
import { team } from "../pages/home";
import { MAIN_HREF, UPDATED } from "./config";
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
    .replace(/(\d) (\d{3})/g, "$1 $2")
    .replace(/(№|ст\.|ч\.|п\.|ПП РФ|НК РФ) /g, "$1 ")
    .replace(/ (₽|%|тыс\.)/g, " $1")
    .replace(/ — /g, " — ");

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
/** Цена «от X ₽» — коммерческое условие из прайса, а не регуляторный факт. */
const PRICE_ONLY = /^\s*(от\s+)?[\d\s\u00a0]+₽\s*$/;
function plain(s: string, where: string) {
  if (LAWISH.test(s) && !PRICE_ONLY.test(s)) warnings.push(`${current}${where ? ` [${where}]` : ""}: непомеченная фраза с цифрой или номером документа — «${s.trim()}»`);
  return esc(nb(s));
}
/** Текст для метаданных: без меток, без экранирования. */
const meta = (s: string) => {
  t(s, "meta");
  return stripFacts(s);
};

/* ---------------- Ссылки ---------------- */
const main = (hash = "") => `${MAIN_HREF}${hash}`;
/** Страницы раздела, которые заменены текстами proba-growth/content (старые адреса — переадресации). */
const MOVED_SLUG: Record<string, string> = { sanpin: "proverki-rospotrebnadzora", "kak-my-rabotaem": "../kak-my-rabotaem" };
const pageHref = (slug: string) => `${slug}.html`;
/** Ссылка на страницу раздела с учётом переездов. */
const linkHref = (slug: string) => `${MOVED_SLUG[slug] ?? slug}.html`;
const bySlug = (slug: string) => {
  const p = PAGES.find((x) => x.slug === slug);
  if (!p) throw new Error(`Нет страницы ${slug}`);
  return p;
};
const price = (slug: string) => (REG_PRICES[slug] ? String(REG_PRICES[slug]) : "");

function crumbs(p: RegPage) {
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
    ? `<aside class="reg-summary glass" aria-label="Коротко">
        <p class="reg-summary-title">${p.kind === "hub" ? "Что вы получаете" : "Коротко"}</p>
        <dl>${rows.map(([k, v]) => `<div><dt>${t(k, "summary")}</dt><dd>${t(v, "summary")}</dd></div>`).join("")}</dl>
      </aside>`
    : "";
  return `<section class="page-hero reg-hero grain" aria-labelledby="page-title">
  <div class="container">
    ${crumbs(p)}
    <div class="page-hero-grid${aside ? " has-aside" : ""}">
      <div class="page-hero-copy">
        <p class="eyebrow">${t(p.eyebrow)}</p>
        <h1 id="page-title" class="h1-page">${keepLast(t(p.h1, "h1"))}</h1>
        <p class="hero-lead">${t(p.lead, "lead")}</p>
        <div class="hero-actions">
          <a class="btn btn-primary btn-lg" href="${p.cta.href}" data-primary-cta>${esc(p.cta.label)}</a>
          ${p.cta2 ? `<a class="btn btn-ghost btn-lg" href="${p.cta2.href}">${esc(p.cta2.label)}</a>` : ""}
        </div>
        <p class="reg-updated">Обновлено: ${UPDATED} · <a href="#normy">Нормативная база</a></p>
        ${priceLine(p)}
      </div>
      ${aside}
    </div>
  </div>
</section>`;
}

/** Строка «Цены» в первом экране: позиции прайса (site-prices.json) по DOC_PRICE_MAP; без соответствия — только ссылка. */
function priceLine(p: RegPage) {
  if (p.kind === "about") return "";
  const items = docPrices(p.slug);
  const text = items.length
    ? t(f("proba-price", `Цены: ${items.map((x) => `${items.length > 1 ? `${x.service.toLowerCase().replace(/^сгр/, "СГР")} — ` : ""}${priceText(x)} ${unitText(x)}`.trim()).join("; ")}`)) + " · "
    : "";
  return `<p class="reg-updated reg-price-line">${text}<a href="../ceny.html#dokumenty">${items.length ? "Все цены" : "Цены на услуги раздела"}</a></p>`;
}

const sec = (id: string, title: string, body: string, opts: { lead?: string; cls?: string } = {}) =>
  `<section${id ? ` id="${id}"` : ""} class="section reg-section${opts.cls ? ` ${opts.cls}` : ""}" aria-labelledby="${id || "s"}-title">
  <div class="container">
    <div class="section-head reveal"><h2 id="${id || "s"}-title" class="h2">${keepLast(esc(title))}</h2>${opts.lead ? `<p class="lead">${t(opts.lead)}</p>` : ""}</div>
    ${body}
  </div>
</section>`;

function who(p: RegPage) {
  if (!p.who) return "";
  return sec(
    "komu",
    "Кому нужно и когда не нужно",
    `<div class="reg-who">
      <div class="reg-who-card glass-light is-yes"><h3>Нужно</h3><ul class="check-list">${p.who.yes.map((x) => `<li>${t(x, "who")}</li>`).join("")}</ul></div>
      <div class="reg-who-card glass-light is-no"><h3>Не нужно или не к нам</h3><ul class="cross-list">${p.who.no.map((x) => `<li>${t(x, "who")}</li>`).join("")}</ul></div>
    </div>`,
  );
}

function includes(p: RegPage) {
  if (!p.includes) return "";
  return sec("vhodit", "Что входит", `<ul class="card-grid">${p.includes.map((c) => `<li class="card glass-light reveal"><h3>${t(c.title)}</h3><p>${t(c.text, "includes")}</p></li>`).join("")}</ul>`);
}

function steps(p: RegPage) {
  if (!p.steps || !p.timing) return "";
  return sec(
    "etapy",
    "Этапы и сроки",
    `<ol class="reg-steps">${p.steps
      .map((s, i) => `<li><span class="reg-step-n" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span><b>${t(s.title)}</b><span class="reg-step-text">${t(s.text, "steps")}</span><span class="reg-step-who">${t(s.who)}</span></li>`)
      .join("")}</ol>
    <div class="reg-timing">
      <div class="reg-timing-card is-agency"><p class="reg-timing-label">Срок в ведомстве</p><p>${t(p.timing.agency, "timing")}</p></div>
      <div class="reg-timing-card is-project"><p class="reg-timing-label">Весь проект</p><p>${t(p.timing.project, "timing")}</p></div>
    </div>`,
    { lead: "Срок ведомства и срок всего проекта — разные вещи. Показываем оба." },
  );
}

function fromYouAndEstimate(p: RegPage) {
  if (!p.fromYou && !p.estimate) return "";
  const pr = price(p.slug);
  const lines = p.estimate ?? [];
  return `<section class="section reg-section" aria-labelledby="ot-vas-title">
  <div class="container reg-two">
    <div id="ot-vas">
      <h2 id="ot-vas-title" class="h2 h2-sm reveal">Что нужно от вас</h2>
      <ul class="check-list reg-list">${(p.fromYou ?? []).map((x) => `<li>${t(x, "fromYou")}</li>`).join("")}</ul>
    </div>
    <div id="smeta" class="reg-estimate glass-light">
      <h2 id="smeta-title" class="h2 h2-sm">Из чего складывается смета</h2>
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
  return sec("oshibki", "Частые ошибки", `<ul class="reg-mistakes">${p.mistakes.map((c) => `<li class="reveal"><h3>${t(c.title)}</h3><p>${t(c.text, "mistakes")}</p></li>`).join("")}</ul>`);
}

function faq(p: RegPage) {
  return `<section id="faq" class="section reg-section faq" aria-labelledby="faq-title">
  <div class="container faq-grid">
    <h2 id="faq-title" class="h2 reveal">Вопросы</h2>
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
    <div class="dark-card grain reg-bridge reveal">
      <div>
        <p class="eyebrow">Proba Lab</p>
        <h2 id="most-title" class="h2">${keepLast(esc(b.title))}</h2>
        <p class="dark-card-text">${t(b.text, "bridge")}</p>
      </div>
      <div>
        <ul class="check-list check-list-dark">${b.points.map((x) => `<li>${t(x)}</li>`).join("")}</ul>
        <p class="dark-card-fine">${t(PACKAGE_LINE)}</p>
        <div class="hero-actions">
          <a class="btn btn-primary" href="../marketing.html#ceny">Документы + этикетка + карточка</a>
          <a class="btn btn-ghost" href="${main()}">Все задачи Proba Lab</a>
        </div>
      </div>
    </div>
  </div>
</section>`;
}

function related(p: RegPage) {
  if (!p.related.length) return "";
  return sec("smezhnye", "Смежные услуги", `<ul class="svc-grid">${p.related.map((s) => svcCard(bySlug(s))).join("")}</ul>`);
}

function svcCard(q: RegPage) {
  const pr = price(q.slug);
  return `<li class="reveal"><a class="svc-card glass-light" href="${linkHref(q.slug)}"><span class="svc-kicker">${esc(q.group ?? "")}</span><span class="svc-title">${esc(q.name)}</span><span class="svc-text">${t(q.cardText, "card")}</span>${pr ? `<span class="reg-price">${esc(nb(pr))}</span>` : ""}<span class="arrow" aria-hidden="true"></span></a></li>`;
}

function form(p: RegPage) {
  const cats = ["БАД", "Косметика", "Пищевая продукция", "Спортивное питание", "Другое"];
  const opts = NEEDS.map((n) => `<option value="${esc(n)}"${n === p.need ? " selected" : ""}>${esc(n)}</option>`).join("");
  return `<section id="form" class="section reg-section project-form" aria-labelledby="form-title">
  <div class="container two-col">
    <div class="pf-copy">
      <h2 id="form-title" class="h2" tabindex="-1">${keepLast(esc(p.formTitle ?? "Проверим состав и посчитаем смету"))}</h2>
      <p class="lead">${t(p.formLead ?? "Бесплатно: скажем, какие документы нужны, и из чего сложится смета. Пришлите состав или ссылку на продукт.")}</p>
      <ul class="check-list reg-form-points">
        <li>Предварительный список документов</li>
        <li>Что повлияет на смету и сроки</li>
        <li>Риски в составе и формулировках</li>
      </ul>
    </div>
    <form id="reg-form" class="form-card glass-light" novalidate data-form="reg" aria-labelledby="form-title">
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
      ${consent("../")}
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
    <p class="fine">Номера и даты документов сверяет наш специалист по регуляторике перед каждым обновлением страницы. Решения по продукту принимают уполномоченные органы.</p>`
        : `<h2 id="normy-title" class="reg-meta-title">Нормативная база</h2><p class="fine">Документы по каждой услуге перечислены на её странице.</p>`
    }
  </div>
</section>`;
}

/* ---------------- Хаб ---------------- */
function quizSection() {
  const radio = (name: string, v: string, l: string) => `<label class="choice"><input type="radio" name="${name}" value="${v}"><span>${esc(l)}</span></label>`;
  const check = (name: string, v: string, l: string) => `<label class="choice"><input type="checkbox" name="${name}" value="${v}"><span>${esc(l)}</span></label>`;
  for (const s of allQuizTexts()) t(s, "quiz");
  return `<section id="quiz" class="section reg-section quiz-section" aria-labelledby="quiz-title">
  <div class="container">
    <div class="section-head reveal"><h2 id="quiz-title" class="h2">${keepLast("Какой документ нужен вашему продукту")}</h2><p class="lead">Три вопроса — и предварительный список документов и обязанностей. Точно определим по составу.</p></div>
    <div class="quiz-grid">
      <form id="quiz-form" class="form-card glass-light quiz-card" novalidate aria-labelledby="quiz-title">
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
    `<ul class="principles">
      <li class="reveal"><h3>Роли</h3><p>Proba Lab — единое окно: состав, формулировки, этикетка и карточка. Регуляторные работы ведут специалисты Proba Lab. Испытания — аккредитованные лаборатории.</p></li>
      <li class="reveal"><h3>Смета</h3><p>Работа, испытания, экспертиза и госпошлина — отдельными строками. Внешние расходы — по факту.</p></li>
      <li class="reveal"><h3>Сроки</h3><p>Отдельно срок рассмотрения в ведомстве и отдельно срок всего проекта. Решение ведомства не обещаем — обещаем полный и проверенный комплект.</p></li>
    </ul>
    <div class="how-foot"><a class="btn btn-outline" href="../kak-my-rabotaem.html">Подробнее о ролях и договоре</a><p class="stop-line">${esc(STOP_LINE)}</p></div>`,
  );
}

/* ---------------- «Как мы работаем»: роли, договор, смета, сроки, обещания ---------------- */
function roles() {
  const partner = REG_PARTNER.name
    ? `<p class="role-partner"><b>${esc(REG_PARTNER.name)}</b>${REG_PARTNER.inn ? `, ИНН ${esc(REG_PARTNER.inn)}` : ""}${REG_PARTNER.note ? `. ${esc(REG_PARTNER.note)}` : ""}</p>`
    : "";
  return sec(
    "roli",
    "Кто что делает",
    `<ul class="roles">
      <li class="role card glass-light reveal"><p class="role-kicker">Единое окно</p><h3>Proba Lab</h3><p>Принимаем задачу, проверяем состав и формулировки, ведём план и смету. Делаем этикетку, упаковку и карточку, которые совпадают с документами.</p></li>
      <li class="role card glass-light reveal"><p class="role-kicker">Регуляторные работы</p><h3>Специалисты по регуляторике</h3><p>СГР и декларации, ТУ и маркировка, ХАССП и санитарные требования, GMP — в одном договоре с Proba Lab.</p>${partner}</li>
      <li class="role card glass-light reveal"><p class="role-kicker">Испытания</p><h3>Аккредитованные лаборатории</h3><p>${t("Испытательные лаборатории, " + "⟪lab-scope|аккредитованные в национальной системе аккредитации. Статус и область аккредитации каждой можно проверить в реестре Росаккредитации (ФСА).⟫")} Протокол выдаёт лаборатория.</p></li>
      <li class="role card glass-light reveal"><p class="role-kicker">Решение</p><h3>Государственные органы</h3><p>${t("⟪rpn-sgr|СГР выдаёт Роспотребнадзор,⟫ ⟪decl|декларации регистрируются в реестре Росаккредитации.⟫")} Решение принимают они, а не мы.</p></li>
    </ul>`,
  );
}
function contract() {
  return `<section class="section reg-section" aria-labelledby="dogovor-title">
  <div class="container reg-two">
    <div id="dogovor">
      <h2 id="dogovor-title" class="h2 h2-sm reveal">Договор</h2>
      <ul class="check-list reg-list">
        <li>Договор заключаем до начала работ</li>
        <li>В нём — этапы, результат каждого этапа и исполнители</li>
        <li>Заранее фиксируем, что делаем, если ведомство откажет</li>
        <li>Внешние расходы — испытания, экспертиза, госпошлина — отдельными строками и по факту</li>
      </ul>
    </div>
    <div id="smeta" class="reg-estimate glass-light">
      <h2 id="smeta-title" class="h2 h2-sm">Как строится смета</h2>
      <ol class="reg-flow">
        <li><b>Анализ состава</b><span>Бесплатно определяем документы и что повлияет на цену</span></li>
        <li><b>Смета по строкам</b><span>Работа, испытания, экспертиза, госпошлина, доставка образцов</span></li>
        <li><b>Согласование</b><span>Работы начинаем после того, как вы согласовали смету</span></li>
        <li><b>Расходы по факту</b><span>Внешние платежи — с документами лаборатории, экспертной организации и банка</span></li>
      </ol>
    </div>
  </div>
</section>`;
}
function timing() {
  return sec(
    "sroki",
    "Сроки",
    `<div class="reg-timing">
      <div class="reg-timing-card is-agency"><p class="reg-timing-label">Срок в ведомстве</p><p>${t("Регламентный срок рассмотрения. Например, ⟪rpn-term|заявление на СГР Роспотребнадзор рассматривает не более 30 дней; испытания и экспертиза в этот срок не входят.⟫")}</p></div>
      <div class="reg-timing-card is-project"><p class="reg-timing-label">Весь проект</p><p>Анализ, документы, испытания, экспертиза, подача и решение. Называем после анализа состава — по каждому этапу отдельно.</p></div>
    </div>`,
  );
}
function never(lead?: string) {
  return sec(
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
    lead ? { lead } : {},
  );
}

/* ---------------- Документ ---------------- */
function jsonLd(p: RegPage) {
  const crumbsLd = [
    { name: "Proba Lab", path: "index.html" },
    { name: "Документы", path: "dokumenty/index.html" },
  ];
  if (p.kind !== "hub") crumbsLd.push({ name: p.name, path: `dokumenty/${pageHref(p.slug)}` });
  const blocks: object[] = [breadcrumbLd(crumbsLd)];
  if (p.faq.length) blocks.push(faqLd(p.faq.map((x) => ({ q: stripFacts(x.q), a: stripFacts(x.a) }))));
  if (p.kind === "service") blocks.push(serviceLd(stripFacts(p.h1), p.serviceType ?? "", stripFacts(p.description), `dokumenty/${pageHref(p.slug)}`));
  return blocks;
}

export function renderPage(p: RegPage): PageDoc {
  current = p.slug;
  let body = hero(p) + '\n<div class="light">\n';
  if (p.kind === "hub") body += quizSection() + hubServices() + hubHow() + faq(p) + bridge(p) + form(p) + norms(p);
  else if (p.kind === "about") body += roles() + contract() + timing() + never() + faq(p) + related(p) + form(p) + norms(p);
  else body += who(p) + includes(p) + steps(p) + fromYouAndEstimate(p) + mistakes(p) + faq(p) + bridge(p) + related(p) + form(p) + norms(p);
  body += "\n</div>";
  const title = meta(p.title);
  const description = meta(p.description);
  if (title.length > 60) throw new Error(`${p.slug}: title длиннее 60 символов (${title.length})`);
  if (description.length > 160) throw new Error(`${p.slug}: description длиннее 160 символов (${description.length})`);
  return { path: `dokumenty/${pageHref(p.slug)}`, title, description, nav: "docs", ld: jsonLd(p), body, bodyClass: `page reg reg-${p.kind}` };
}

/** Общая страница «Как мы работаем» (kak-my-rabotaem.html): принципы со всей главной + роли, договор, смета, сроки из раздела. */
function renderHowTop(): PageDoc {
  current = "kak-my-rabotaem-site";
  const about = bySlug("kak-my-rabotaem");
  const principles = `<section id="principy" class="section" aria-labelledby="principy-title">
  <div class="container">
    <h2 id="principy-title" class="visually-hidden">Принципы</h2>
    <ul class="principles principles-lg">
      <li class="reveal"><h3>Смета до начала.</h3><p>Работа, внешние расходы и сроки — отдельными строками.</p></li>
      <li class="reveal"><h3>Честные сроки.</h3><p>Срок ведомства отдельно от срока проекта.</p></li>
      <li class="reveal"><h3>Без обещаний, которые нельзя проверить.</h3><p>Не гарантируем регистрацию и рост продаж — показываем, как замерим результат.</p></li>
    </ul>
  </div>
</section>`;
  const heroHtml = `<section class="page-hero grain" aria-labelledby="page-title">
  <div class="container">
    <nav class="crumbs" aria-label="Хлебные крошки"><ol><li><a href="index.html">Proba Lab</a></li><li><span aria-current="page">Как мы работаем</span></li></ol></nav>
    <div class="page-hero-grid">
      <div class="page-hero-copy">
        <h1 id="page-title" class="h1-page">Как мы работаем</h1>
        <p class="hero-lead">${t(about.lead)}</p>
        <div class="hero-actions">
          <a class="btn btn-primary btn-lg" href="#project-form" data-primary-cta>Обсудить задачу</a>
          <a class="btn btn-ghost btn-lg" href="#ne-obeshchaem">Чего мы не обещаем</a>
        </div>
      </div>
    </div>
  </div>
</section>`;
  const next = nextSection([
    { href: "dokumenty/kak-my-rabotaem.html", label: "Документы", text: t(about.cardText) },
    { href: "index.html#review", label: "Бесплатный разбор", text: "Ваш продукт глазами покупателя" },
  ]);
  // Ссылки раздела в общих блоках указывают внутрь dokumenty/ — на корневой странице их нет, поэтому блоки без относительных ссылок.
  const body = `${heroHtml}
<div class="light">
${principles}
${team}
${roles()}
${contract()}
${timing()}
${never()}
${next}
${projectSection("")}
</div>`;
  return {
    path: "kak-my-rabotaem.html",
    title: "Как мы работаем — Proba Lab",
    description: "Смета до начала, честные сроки и без обещаний, которые нельзя проверить. Кто работает над задачей, договор, смета по строкам и сроки.",
    nav: "how",
    ld: [breadcrumbLd([{ name: "Proba Lab", path: "index.html" }, { name: "Как мы работаем", path: "kak-my-rabotaem.html" }])],
    body,
  };
}

/** Текст новой страницы вне раздела (блог, новости): метки f(ключ, фраза) → REGULATORY_VERIFY.md, непомеченные цифры и номера НПА → ошибка сборки. */
export function factText(page: string, raw: string, where = "") {
  const prev = current;
  current = page;
  const out = t(raw, where);
  current = prev;
  return out;
}
/** Факты и предупреждения, собранные после renderAll() и factText(). */
export function collected() {
  return { facts: [...facts], warnings: [...warnings] };
}

export function renderAll() {
  facts.length = 0;
  warnings.length = 0;
  const docs = PAGES.map(renderPage);
  const how = renderHowTop();
  const files = [...docs, how].map((d) => ({ path: d.path, slug: d.path.replace(/^dokumenty\//, "").replace(/\.html$/, "") + (d.path.startsWith("dokumenty/") ? "" : "-site"), title: d.title, html: renderDoc(d) }));
  return { files, facts: [...facts], warnings: [...warnings], sources: SOURCES, prices: PRICES };
}
