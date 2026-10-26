// Цены (ceny.html) и лид-магниты: калькулятор экономики SKU (kalkulyator-sku.html), карта документов (dokumenty/karta-dokumentov.html).
// Тексты — content/footer-pages.md; цены — только proba-growth/pricing/site-prices.json (через src/prices.ts).
import { SKU_FIELDS } from "../calc";
import { kartaSection, projectSection } from "../forms";
import { breadcrumbLd, esc, keepLast, pageHero, QUIZ_HREF, type PageDoc } from "../layout";
import { blockItems, PRICE_BLOCKS, priceText, SITE_PRICES, unitText, type PriceItem } from "../prices";
import { NEEDS } from "../regulatory/pages";
import { factText } from "../regulatory/render";

/* ================================================================ Цены */
const ESTIMATE_LINES = ["Работа", "Испытания", "Экспертиза", "Госпошлина"];

function priceRow(p: PriceItem) {
  const unit = unitText(p);
  return `<li class="price-item">
        <div class="price-item-main"><h3>${esc(p.service)}</h3><p>${esc(p.includes)}</p></div>
        <p class="price-item-price"><b>${priceText(p)}</b>${unit ? `<span>${esc(unit)}</span>` : ""}</p>
      </li>`;
}

function priceBlock(b: (typeof PRICE_BLOCKS)[number]) {
  const items = blockItems(b.name);
  const estimate =
    b.id === "dokumenty"
      ? `<div class="reg-estimate glass-light price-estimate">
        <h3>Из чего складывается смета</h3>
        <ul>${ESTIMATE_LINES.map((l) => `<li><span class="reg-estimate-item">${l}</span></li>`).join("")}</ul>
        <p class="fine">Строки сметы — отдельно, суммы называем после анализа состава. Внешние расходы — по факту.</p>
      </div>`
      : "";
  return `<section id="${b.id}" class="section price-block" aria-labelledby="${b.id}-title">
  <div class="container">
    <div class="section-head is-split reveal">
      <h2 id="${b.id}-title" class="h2">${b.name}</h2>
      <p class="lead-link"><a class="arrow-link" href="${b.href}">О направлении<span class="arrow" aria-hidden="true"></span></a></p>
    </div>
    <div class="price-layout${estimate ? " has-aside" : ""}">
      <ul class="price-list">${items.map(priceRow).join("")}</ul>
      ${estimate}
    </div>
  </div>
</section>`;
}

const NOTE = "Итоговую стоимость называем после короткого разговора — до начала работ. Внешние расходы (госпошлины, испытания, экспертиза, лицензии сервисов) — отдельными строками.";

export const ceny: PageDoc = {
  path: "ceny.html",
  title: "Цены на услуги Proba Lab",
  description: "Цены «от» на документы, маркетинг, продвижение, аналитику, аудит продаж и автоматизацию для брендов БАД и косметики. Итог — до начала работ.",
  nav: "prices",
  ld: [
    breadcrumbLd([
      { name: "Proba Lab", path: "index.html" },
      { name: "Цены", path: "ceny.html" },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "OfferCatalog",
      name: "Цены Proba Lab",
      itemListElement: SITE_PRICES.map((p) => ({
        "@type": "Offer",
        name: p.service,
        category: p.block,
        price: p.from,
        priceCurrency: "RUB",
        description: p.from === 0 ? "Бесплатно" : `от ${p.from} ₽${p.unit && p.unit !== "бесплатно" ? `, ${p.unit}` : ""}`,
        itemOffered: { "@type": "Service", name: p.service, description: p.includes },
        seller: { "@type": "Organization", name: "Proba Lab" },
      })),
    },
  ],
  body: `${pageHero({
    crumbs: [{ name: "Proba Lab", href: "index.html" }, { name: "Цены" }],
    h1: "Цены",
    lead: "Цены «от» за работу. Итоговую стоимость называем после короткого разговора — до начала работ.",
    ctas: [
      { label: "Обсудить задачу", href: "#project-form" },
      { label: "Проверить состав бесплатно", href: QUIZ_HREF },
    ],
    extra: `<nav class="price-toc" aria-label="Разделы цен"><ul>${PRICE_BLOCKS.map((b) => `<li><a href="#${b.id}">${b.name}</a></li>`).join("")}</ul></nav>`,
  })}
<div class="light">
${PRICE_BLOCKS.map(priceBlock).join("\n")}
<section class="section" aria-labelledby="itog-title">
  <div class="container two-col">
    <h2 id="itog-title" class="h2 reveal">${keepLast("Как складывается итог")}</h2>
    <p class="statement-text statement-sm reveal">${NOTE}</p>
  </div>
</section>
${projectSection("")}
</div>`,
};

/* ================================================================ Калькулятор SKU */
const calcField = (fl: (typeof SKU_FIELDS)[number]) => `<div class="field calc-field">
          <label for="c-${fl.key}">${fl.label}${fl.required ? "" : ' <span class="opt">необязательно</span>'}</label>
          <div class="input-unit"><input id="c-${fl.key}" name="${fl.key}" inputmode="decimal" autocomplete="off" spellcheck="false"${fl.required ? "" : ' placeholder="0"'} data-unit="${fl.unit}"><span class="unit" aria-hidden="true">${fl.unit}</span></div>
        </div>`;

export const kalkulyator: PageDoc = {
  path: "kalkulyator-sku.html",
  title: "Калькулятор экономики SKU для маркетплейса — Proba Lab",
  description: "Посчитайте прибыль на единицу, маржу и цену безубыточности товара на маркетплейсе по своим цифрам. Данные никуда не отправляются и не сохраняются.",
  nav: "none",
  ld: [
    breadcrumbLd([
      { name: "Proba Lab", path: "index.html" },
      { name: "Калькулятор SKU", path: "kalkulyator-sku.html" },
    ]),
  ],
  body: `${pageHero({
    crumbs: [{ name: "Proba Lab", href: "index.html" }, { name: "Калькулятор SKU" }],
    eyebrow: "Бесплатно",
    h1: "Калькулятор: сколько зарабатывает ваш товар на маркетплейсе",
    lead: "Прибыль на единицу, маржа, цена безубыточности и статья, которая сильнее всего съедает маржу. Пересчёт сразу, без отправки данных. Значения не сохраняются.",
    ctas: [
      { label: "Посчитать", href: "#calc" },
      { label: "Разбор по всем SKU", href: "#project-form" },
    ],
  })}
<div class="light">
<section id="calc" class="section calc-section" aria-labelledby="calc-title">
  <div class="container">
    <div class="section-head reveal">
      <h2 id="calc-title" class="h2">Посчитайте по своим цифрам</h2>
      <p class="lead">Калькулятор считает по вашим цифрам. Ставки площадок меняются — берите их из своего кабинета.</p>
    </div>
    <div class="calc-grid">
      <form id="sku-calc" class="form-card glass-light calc-form" novalidate aria-labelledby="calc-title">
        <div class="calc-fields">
        ${SKU_FIELDS.map(calcField).join("\n        ")}
        </div>
        <p class="hint">Можно с запятой: 249,5. Пустое необязательное поле считается нулём.</p>
        <button class="btn btn-outline" type="reset">Очистить</button>
      </form>
      <div class="calc-result glass-light" id="calc-result">
        <p class="calc-status" data-calc-status aria-live="polite" aria-atomic="true">Введите цену и себестоимость — результат появится сразу.</p>
        <dl class="calc-main">
          <div class="calc-profit"><dt>Прибыль на единицу</dt><dd data-out="profit">—</dd></div>
          <div><dt>Маржа</dt><dd data-out="margin">—</dd></div>
          <div><dt>Цена безубыточности</dt><dd data-out="breakEven">—</dd></div>
          <div><dt>Сильнее всего съедает маржу</dt><dd data-out="biggest">—</dd></div>
        </dl>
        <h3 class="calc-sub">Расходы на единицу</h3>
        <ul class="calc-bars" data-out="bars"><li class="calc-empty">Появятся после расчёта</li></ul>
      </div>
    </div>
    <div class="calc-how">
      <h3>Как считаем</h3>
      <p>Прибыль на единицу = цена − себестоимость − цена × комиссия − логистика − доля возвратов × обратная логистика − реклама − цена × налог − упаковка. Маржа — прибыль, делённая на цену. Цена безубыточности — цена, при которой прибыль равна нулю: расходы в рублях, делённые на долю цены, которая остаётся после комиссии и налога.</p>
    </div>
  </div>
</section>
${projectSection("analytics", { title: "Хотите разбор по всем SKU?", lead: "Пришлите выгрузку — посчитаем и покажем, где теряется маржа." })}
</div>`,
};

/* ================================================================ Карта документов */
const KARTA = "dokumenty/karta-dokumentov";
const kt = (s: string) => factText(KARTA, s, "karta");

const GET = [
  ["Какой документ нужен", "СГР, декларация или другой путь — по составу и назначению продукта."],
  ["Риски в составе", "Что стоит проверить в составе до испытаний."],
  ["Порядок шагов", "От проверки состава до карточки на маркетплейсе — кто и что делает."],
  ["Из чего сложится смета", "Строки сметы: работа и внешние расходы отдельно."],
];
const SAMPLE_STEPS = ["Проверка состава", "Программа испытаний", "Испытания в аккредитованной лаборатории", "Подача", "Свидетельство", "«Честный знак»", "Карточка"];

export const karta: PageDoc = {
  path: "dokumenty/karta-dokumentov.html",
  title: "Карта документов для вашего продукта — Proba Lab",
  description: "Бесплатная карта документов: какой документ нужен продукту, риски в составе до испытаний, порядок шагов и из чего сложится смета.",
  nav: "docs",
  ld: [
    breadcrumbLd([
      { name: "Proba Lab", path: "index.html" },
      { name: "Документы", path: "dokumenty/index.html" },
      { name: "Карта документов", path: "dokumenty/karta-dokumentov.html" },
    ]),
  ],
  get body() {
    return `${pageHero({
      crumbs: [{ name: "Proba Lab", href: "../index.html" }, { name: "Документы", href: "index.html" }, { name: "Карта документов" }],
      eyebrow: "Бесплатно",
      h1: kt("Карта документов для вашего продукта — бесплатно"),
      lead: kt("Одна страница: какой документ нужен, риски в составе, которые стоит проверить до испытаний, порядок шагов и из чего сложится смета."),
      ctas: [
        { label: "Получить карту документов", href: "#karta-form" },
        { label: "Пройти квиз", href: "index.html#quiz" },
      ],
    })}
<div class="light">
<section id="chto" class="section" aria-labelledby="chto-title">
  <div class="container">
    <div class="section-head reveal"><h2 id="chto-title" class="h2">Что получите</h2></div>
    <ol class="card-grid card-grid-4 is-numbered">${GET.map(
      ([h, p], i) => `<li class="card glass-light reveal"><span class="card-n" aria-hidden="true">0${i + 1}</span><h3>${kt(h!)}</h3><p>${kt(p!)}</p></li>`,
    ).join("")}</ol>
  </div>
</section>
<section id="primer" class="section" aria-labelledby="primer-title">
  <div class="container two-col">
    <div class="pf-copy">
      <h2 id="primer-title" class="h2">Пример результата</h2>
      <p class="lead">${kt("Демо на условном продукте. Для вашего продукта документ, шаги и строки сметы зависят от состава.")}</p>
    </div>
    <figure class="karta-sample glass-light" aria-labelledby="karta-sample-title">
      <figcaption class="karta-head"><span class="karta-title" id="karta-sample-title">Магний B6, таблетки</span><span class="tag">Пример</span></figcaption>
      <dl class="karta-doc"><div><dt>Документ</dt><dd>${kt("СГР — свидетельство о государственной регистрации")}</dd></div></dl>
      <h3 class="karta-sub">Шаги</h3>
      <ol class="reg-flow">${SAMPLE_STEPS.map((s) => `<li><b>${kt(s)}</b></li>`).join("")}</ol>
      <h3 class="karta-sub">Смета</h3>
      <ul class="karta-estimate">${["Работа", "Испытания", "Экспертиза", "Госпошлина"].map((s) => `<li><span>${kt(s)}</span><span class="karta-dash" aria-label="сумма после анализа состава">—</span></li>`).join("")}</ul>
      <p class="fine">${kt("Суммы — после анализа состава вашего продукта.")}</p>
    </figure>
  </div>
</section>
${kartaSection(NEEDS, "Определить, какой документ нужен")}
</div>`;
  },
};

export const TOOL_PAGES = () => [ceny, kalkulyator, karta];
