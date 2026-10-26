// Цены «от» для сайта — единственный источник: proba-growth/pricing/site-prices.json (публикуются только эти позиции).
// Модуль используется только при сборке (в assets/site.js не попадает).
import RAW from "../../proba-growth/pricing/site-prices.json";

export interface PriceItem {
  block: string;
  service: string;
  includes: string;
  from: number;
  unit: string;
  status: string;
}

export const SITE_PRICES = RAW as PriceItem[];

/** Блоки страницы ceny.html в порядке направлений; id — якорь, href — страница направления. */
export const PRICE_BLOCKS = [
  { name: "Документы", id: "dokumenty", href: "dokumenty/index.html" },
  { name: "Маркетинг", id: "marketing", href: "marketing.html" },
  { name: "Продвижение", id: "prodvizhenie", href: "prodvizhenie.html" },
  { name: "Аналитика", id: "analitika", href: "analitika.html" },
  { name: "Аудит продаж", id: "audit-prodazh", href: "audit-prodazh.html" },
  { name: "Автоматизация", id: "avtomatizaciya", href: "avtomatizaciya.html" },
] as const;

for (const p of SITE_PRICES) {
  if (!PRICE_BLOCKS.some((b) => b.name === p.block)) throw new Error(`site-prices.json: неизвестный блок «${p.block}»`);
  if (!Number.isFinite(p.from) || p.from < 0) throw new Error(`site-prices.json: цена «${p.service}»`);
}

/** 15000 → «15 000» (неразрывный пробел). */
export const rub = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

/** «от 15 000 ₽»; 0 → «Бесплатно»; фиксированная цена — без «от». */
export const priceText = (p: PriceItem) => (p.from === 0 ? "Бесплатно" : `${p.unit === "фикс" ? "" : "от "}${rub(p.from)} ₽`);
/** Единица под ценой. «бесплатно» не повторяем. */
export const unitText = (p: PriceItem) => (p.unit === "бесплатно" ? "" : p.unit === "фикс" ? "фиксированная цена" : p.unit);

export const blockItems = (block: string) => SITE_PRICES.filter((p) => p.block === block);
/** Минимальная платная цена блока — для строки «Цены: от X ₽» на странице направления. */
export function blockFrom(block: string) {
  const paid = blockItems(block).filter((p) => p.from > 0);
  if (!paid.length) throw new Error(`Нет цен блока ${block}`);
  return Math.min(...paid.map((p) => p.from));
}

/** Страницы раздела «Документы» ↔ позиции прайса. Только однозначные соответствия; остальные страницы — ссылка на ceny.html. */
export const DOC_PRICE_MAP: Record<string, string[]> = {
  "registraciya-bad": ["Регистрация БАД (СГР)"],
  kosmetika: ["Декларация на косметику", "СГР на косметику"],
  deklaracii: ["Декларация на пищевую продукцию"],
  tu: ["Технические условия (ТУ)"],
  markirovka: ["Проверка этикетки"],
  haccp: ["ХАССП и программа производственного контроля"],
};
export function docPrices(slug: string): PriceItem[] {
  return (DOC_PRICE_MAP[slug] ?? []).map((name) => {
    const p = SITE_PRICES.find((x) => x.block === "Документы" && x.service === name);
    if (!p) throw new Error(`DOC_PRICE_MAP: нет позиции «${name}» в site-prices.json`);
    return p;
  });
}
