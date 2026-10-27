// Дизайн-система v4: текст из Markdown → визуальные блоки (proba-growth/strategy/SITE-REDESIGN-PLAN.md, §3).
// Работает по готовому HTML из pandoc (с токенами @@T{n}@@): по заголовку раздела и форме списка выбирает компонент.
// Правила разметки для авторов — proba-growth/content/BLOCKS-GUIDE.md.

/** Иконки (24×24, линия 1.6) — без медицинских символов. */
const I: Record<string, string> = {
  doc: '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 12h5M10 16h5"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  jar: '<path d="M8 3h8v3H8zM7 6h10l1 3v11a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9z"/><path d="M6 12h12v5H6"/>',
  cube: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/>',
  phone: '<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2M9.5 7h5v6h-5z"/>',
  chart: '<path d="M4 20h16"/><path d="M7 16v-4M12 16V8M17 16v-7"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14a6.5 6.5 0 0 1 3.5 6"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
  shield: '<path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6z"/><path d="m9 12 2 2 4-4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  flask: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6A2 2 0 0 0 19 18l-5-9V3"/><path d="M7.5 15h9"/>',
  tag: '<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  play: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m10 9 5 3-5 3z"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  warn: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
};
export const icon = (k: string) => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${I[k] ?? I.spark}</svg>`;

/** Иконка по смыслу заголовка карточки. */
const ICON_BY: [RegExp, string][] = [
  [/документ|регистрац|деклар|сгр|письм|заявлен|ту\b|техническ|протокол|паспорт/i, "doc"],
  [/провер|соответств|сверк|аудит/i, "shield"],
  [/этикет|упаков|тар|банк|макет/i, "jar"],
  [/3d|визуал|рендер|модел/i, "cube"],
  [/карточ|маркетплейс|ozon|wildberries|лендинг|сайт/i, "phone"],
  [/видео|моушн|ролик/i, "play"],
  [/аналит|экономик|продаж|цифр|метрик|отч[её]т|деньг|прибыл/i, "chart"],
  [/позиционир|утп|сегмент|цель/i, "target"],
  [/исследован|интервью|конкурент|рынок|поиск/i, "search"],
  [/клиент|покупател|команд|люди|кто/i, "users"],
  [/срок|быстр|время|недел|дн/i, "clock"],
  [/состав|лаборатор|испытан|сырь/i, "flask"],
  [/цен|стоим|смет|бесплатн/i, "tag"],
  [/автоматиз|crm|бот|интеграц/i, "bolt"],
];
const iconFor = (t: string, i: number) => ICON_BY.find(([re]) => re.test(t))?.[1] ?? ["spark", "check", "target", "bolt"][i % 4]!;

const plain = (h: string) => h.replace(/<[^>]+>/g, "").replace(/@@T\d+@@/g, "").trim();

/** Слаг для якоря заголовка (оглавление статьи). */
const TR: Record<string, string> = { а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "j", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya" };
const slug = (t: string) =>
  t.toLowerCase().replace(/[а-яё]/g, (c) => TR[c] ?? "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "razdel";

/** ==маркер== → подсветка; :::подробнее … ::: → раскрывающийся блок. */
export function inline(html: string) {
  return html
    .replace(/==([^=<\n][^=\n]*?)==/g, '<mark class="hl">$1</mark>')
    .replace(/<p>:::(?:подробнее|details)\s*(.*?)<\/p>/gi, (_, t) => `<details class="more"><summary>${t || "Подробнее"}</summary><div class="more-body">`)
    .replace(/<p>:::<\/p>/g, "</div></details>");
}

/** Элемент списка «**Заголовок** — текст» → карточка с иконкой. */
function cardItems(ul: string, cls: string, iconKind?: string) {
  let i = 0;
  return ul
    .replace(/^<ul>/, `<ul class="${cls}">`)
    .replace(/<li>(?:<p>)?<strong>([\s\S]*?)<\/strong>\s*(?:[—–:.-]\s*)?([\s\S]*?)(?:<\/p>)?<\/li>/g, (_, t, rest) => {
      const k = iconKind ?? iconFor(plain(t), i);
      i++;
      const body = rest.trim().replace(/^[—–:.-]\s*/, "");
      return `<li class="reveal">${icon(k)}<b class="card-t">${t}</b>${body ? `<span class="card-d">${body}</span>` : ""}</li>`;
    });
}

/** Таблица из двух колонок «услуга — цена» → ценовые карточки. */
function priceCards(tableWrap: string) {
  const rows = [...tableWrap.matchAll(/<tr[^>]*>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<\/tr>/g)];
  const wide = [...tableWrap.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].some((r) => (r[1]!.match(/<t[dh][\s>]/g) ?? []).length > 2);
  if (rows.length < 2 || wide) return null;
  return `<ul class="price-cards">${rows
    .map(([, a, b]) => {
      const free = /бесплатно/i.test(plain(b!));
      return `<li class="reveal${free ? " is-free" : ""}"><span class="pc-name">${a}</span><b class="pc-price">${/^\s*(от|бесплатно)/i.test(plain(b!)) ? b : `от ${b}`}</b></li>`;
    })
    .join("")}</ul>`;
}

/** Нумерованный список → шаги. Короткие пункты — сетка, длинные — вертикальная шкала. */
function stepper(ol: string) {
  const items = [...ol.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => m[1]!.replace(/^<p>|<\/p>$/g, ""));
  const long = items.some((x) => plain(x).length > 170) || items.length > 6;
  return `<ol class="steps ${long ? "steps-v" : "steps-h"}">${items
    .map((x, i) => {
      const m = x.match(/^<strong>([\s\S]*?)<\/strong>\s*(?:[—–:.-]\s*)?([\s\S]*)$/);
      const inner = m ? `<b class="card-t">${m[1]}</b>${m[2] ? `<span class="card-d">${m[2].replace(/^[—–:.-]\s*/, "")}</span>` : ""}` : `<span class="card-d">${x}</span>`;
      return `<li class="reveal" style="--i:${i}"><span class="step-n">${String(i + 1).padStart(2, "0")}</span>${inner}</li>`;
    })
    .join("")}</ol>`;
}

/** Абзацы внутри раздела: первый — крупнее (вводная). */
const SECTION_KINDS: { re: RegExp; kind: string }[] = [
  { re: /^коротко|^главное|^в двух словах/i, kind: "tldr" },
  { re: /ошибк|риск|чего не делать|не стоит|подводн/i, kind: "warn" },
  { re: /не подходит|не нужн|не делаем|не заменяет|когда не/i, kind: "no" },
  { re: /для кого|кому подходит|когда (это )?нужн|когда лучше|обязател|когда пригодится|с чем к нам приходят|что нужно от вас|подойд[её]т/i, kind: "yes" },
  { re: /стоимост|сколько стоит|цен[аыи]|смета/i, kind: "price" },
  { re: /что дальше|что ещё может|из блога|читайте также|связанные|по теме/i, kind: "links" },
];

function enhanceSection(body: string, title: string) {
  const kind = SECTION_KINDS.find((k) => k.re.test(title))?.kind;
  let b = body;
  // Таблица цен
  if (kind === "price") b = b.replace(/<div class="table-wrap"[\s\S]*?<\/table><\/div>/, (t) => priceCards(t) ?? t);
  if (kind === "tldr") return `<div class="tldr">${b.replace(/<ul>/, '<ul class="checks checks-yes">')}</div>`;
  // Таблица-сравнение с ✓ — по центру, с подсветкой нашей колонки
  b = b.replace(/<table>(?=[\s\S]*?✓[\s\S]*?<\/table>)/g, '<table class="vs">');
  // Нумерованные списки → шаги
  b = b.replace(/<ol[^>]*>[\s\S]*?<\/ol>/g, (ol) => stepper(ol));
  // Маркированные списки
  b = b.replace(/<ul>[\s\S]*?<\/ul>/g, (ul) => {
    const items = [...ul.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => m[1]!.replace(/^<p>/, ""));
    const allStrong = items.length >= 2 && items.every((x) => x.startsWith("<strong>"));
    const allLinks = items.length >= 2 && items.every((x) => /^<a [^>]*>[\s\S]*?<\/a>\s*(?:[—–.:-][\s\S]*)?$/.test(x.replace(/<\/p>$/, "")) || /^<strong><a /.test(x));
    if (kind === "warn") return cardItems(allStrong ? ul : ul.replace(/<li>(?:<p>)?/g, "<li><strong>").replace(/<\/li>/g, "</strong></li>"), "cards cards-warn", "warn");
    if (kind === "no") return ul.replace(/^<ul>/, '<ul class="checks checks-no">');
    if (kind === "yes" && !allStrong) return ul.replace(/^<ul>/, '<ul class="checks checks-yes">');
    if (kind === "links" || allLinks)
      return ul
        .replace(/^<ul>/, '<ul class="link-cards">')
        .replace(/<li>(?:<p>)?([\s\S]*?)(?:<\/p>)?<\/li>/g, (_, x: string) => {
          const m = x.match(/^([\s\S]*?<\/a>(?:<\/strong>)?)\s*(?:[—–:.-]\s*)?([\s\S]*)$/);
          return `<li class="reveal">${m ? `${m[1]}${m[2] ? `<span class="card-d">${m[2]}</span>` : ""}` : x}</li>`;
        });
    const n = items.length;
    const cols = n === 4 || n === 8 ? " cards-4" : n === 2 ? " cards-2" : [3, 5, 6, 9].includes(n) ? " cards-3" : "";
    if (allStrong) return cardItems(ul, `cards${cols}${kind === "yes" ? " cards-yes" : ""}`);
    return ul.replace(/^<ul>/, '<ul class="dots">');
  });
  // Первый абзац раздела — вводная
  b = b.replace(/^\s*<p>(?!@@T)/, '<p class="sec-lead">');
  return b;
}

/**
 * Разбивает тело страницы на визуальные разделы.
 * Услуги и хабы: каждый «## раздел» — своя секция, светлые и тонированные чередуются, списки — компоненты.
 * Статьи: остаются одной колонкой, но получают якоря для оглавления и те же компоненты.
 */
export function enhance(html: string, o: { article: boolean }): { html: string; toc: { id: string; t: string }[] } {
  const toc: { id: string; t: string }[] = [];
  const used = new Set<string>();
  const parts = inline(html).split(/(?=<h2[ >])/);
  let n = 0;
  const out = parts.map((part, idx) => {
    const m = part.match(/^<h2([^>]*)>([\s\S]*?)<\/h2>/);
    if (!m) return idx === 0 ? part.replace(/^\s*<p>(?!@@T)/, '<p class="sec-lead">') : part;
    const title = plain(m[2]!);
    let id = (m[1]!.match(/id="([^"]+)"/) ?? [])[1] ?? slug(title);
    while (used.has(id)) id += "-2";
    used.add(id);
    if (title) toc.push({ id, t: title });
    const body = enhanceSection(part.slice(m[0].length), title);
    const h2 = `<h2 id="${id}" class="sec-title">${m[2]}</h2>`;
    if (o.article) return h2 + body;
    n++;
    return `</div></div></section><section class="section blk${n % 2 === 0 ? " blk-tint" : ""}" aria-labelledby="${id}"><div class="container"><div class="prose blk-body">${h2}${body}`;
  });
  return { html: out.join(""), toc };
}

/** Заголовок первого экрана: часть после «—» — градиентом. */
export function gradH1(h1: string) {
  const i = h1.indexOf(" — ");
  return i > 0 ? `${h1.slice(0, i)} — <span class="grad">${h1.slice(i + 3)}</span>` : h1;
}
