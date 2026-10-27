// Главная v4: бегущая строка, бенто направлений (src/pages/content.ts вставляет их вокруг текста index.md).
// Картинки из assets/images (Ideogram) подставляются, если лежат в папке; иначе — градиентные заглушки.
import { icon } from "./blocks";

declare const __IMAGES__: string[];
const IMAGES: string[] = typeof __IMAGES__ === "undefined" ? [] : __IMAGES__;

/** Файл картинки по имени без расширения (webp/avif/png/jpg), если есть. */
export function image(name: string): string | undefined {
  for (const ext of ["webp", "avif", "jpg", "jpeg", "png"]) if (IMAGES.includes(`${name}.${ext}`)) return `assets/images/${name}.${ext}`;
  return undefined;
}

const WORDS = ["БАД", "Косметика", "Функциональное питание", "Регистрация и декларации", "Этикетка по требованиям", "3D-визуализация", "Моушн-дизайн", "Карточки Ozon и Wildberries", "Позиционирование", "JTBD и CJM", "Юнит-экономика", "Сквозная аналитика"];

export function marquee() {
  const row = WORDS.map((w) => `<span>${w}</span>`).join("");
  return `<div class="marquee" role="presentation"><div class="marquee-track"><div>${row}</div><div aria-hidden="true">${row}</div></div></div>`;
}

interface Tile { cls: string; href: string; tag: string; title: string; text: string; price: string; img: string; ic: string }
const TILES: Tile[] = [
  { cls: "b-lg b-docs", href: "dokumenty/index.html", tag: "Документы", title: "Регистрация, декларации, маркировка", text: "Проверяем состав бесплатно и говорим, какой документ нужен вашему продукту.", price: "Декларация <b>от 12 000 ₽</b>", img: "bento-docs", ic: "doc" },
  { cls: "b-md b-pack", href: "marketing/upakovka-do-registracii.html", tag: "Упаковка", title: "Продажи — пока идёт регистрация", text: "Этикетка, 3D и видео для карточки параллельно с документами.", price: "Пакет <b>от 75 000 ₽</b>", img: "bento-marketing", ic: "jar" },
  { cls: "b-third b-3d", href: "marketing/3d-vizualizaciya-upakovki.html", tag: "3D и моушн", title: "3D-визуализация упаковки", text: "Без съёмочного дня и до первой партии.", price: "<b>от 15 000 ₽</b> за SKU", img: "bento-3d", ic: "cube" },
  { cls: "b-third b-research", href: "marketing/pozicionirovanie-brenda.html", tag: "Маркетинг", title: "Позиционирование и JTBD", text: "Для кого продукт и почему его выбирают.", price: "<b>от 60 000 ₽</b>", img: "bento-research", ic: "target" },
  { cls: "b-third b-ana", href: "analitika.html", tag: "Аналитика", title: "Юнит-экономика и аналитика", text: "Считаем, сколько остаётся с продажи.", price: "Калькулятор — <b>бесплатно</b>", img: "bento-analytics", ic: "chart" },
];

export function bento(base: string) {
  const tiles = TILES.map((t) => {
    const src = image(t.img);
    const art = `<span class="b-art" aria-hidden="true">${src ? `<img src="${base}${src}" alt="" loading="lazy" decoding="async">` : ""}</span>`;
    return `<li class="${t.cls} reveal"><a href="${base}${t.href}">${art}<span class="b-tag">${t.tag}</span>${src ? "" : icon(t.ic).replace('class="ic"', 'class="b-shape"')}<span class="b-title">${t.title}</span><span class="b-text">${t.text}</span><span class="b-price">${t.price}</span></a></li>`;
  }).join("");
  return `<section class="section bento-sec" aria-labelledby="bento-title"><div class="container">
  <div class="section-head is-split reveal"><h2 id="bento-title" class="h2">Всё для запуска — <span class="grad">в одной команде</span></h2><p class="lead">Документы, упаковка, 3D, карточки и аналитика делает одна команда, поэтому они совпадают друг с другом.</p></div>
  <ul class="bento">${tiles}</ul>
</div></section>`;
}
