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

const WORDS = ["Путь пациента", "QR после визита", "Возврат пациентов", "Доказательный маркетинг", "Нетнография", "OSINT", "JTBD и CJM", "Боты MAX и Telegram", "Закон о рекламе медуслуг", "Аналитика возвратов", "Частные клиники", "Катамнез через 90 дней"];

export function marquee() {
  const row = WORDS.map((w) => `<span>${w}</span>`).join("");
  return `<div class="marquee" role="presentation"><div class="marquee-track"><div>${row}</div><div aria-hidden="true">${row}</div></div></div>`;
}

interface Tile { cls: string; href: string; tag: string; title: string; text: string; price: string; img: string; ic: string }
const TILES: Tile[] = [
  { cls: "b-lg b-docs", href: "uslugi.html#zamer", tag: "Первый шаг", title: "Замер возврата", text: "Одно число, три места потери и один следующий шаг. За пять рабочих дней, без передачи данных пациентов.", price: "<b>30 000 ₽</b> · 5 дней", img: "bento-docs", ic: "doc" },
  { cls: "b-md b-pack", href: "uslugi.html#zapusk", tag: "После визита", title: "QR, бот и возврат", text: "Материалы врача по теме визита, напоминание о контроле, запись в одно касание.", price: "<b>от 250 000 ₽</b>", img: "bento-marketing", ic: "jar" },
  { cls: "b-third b-3d", href: "metodologiya.html", tag: "Метод", title: "Доказательный маркетинг", text: "Протокол, контрольная группа, катамнез.", price: "Методология — <b>открыто</b>", img: "bento-3d", ic: "cube" },
  { cls: "b-third b-research", href: "uslugi.html#issledovanie", tag: "Исследование", title: "Голос пациента", text: "Нетнография, интервью, JTBD.", price: "<b>от 90 000 ₽</b>", img: "bento-research", ic: "target" },
  { cls: "b-third b-ana", href: "kejsy.html", tag: "Кейсы", title: "Пять проектов", text: "От бота для пациентов до B2B.", price: "Смотреть <b>кейсы</b>", img: "bento-analytics", ic: "chart" },
];

export function bento(base: string) {
  const tiles = TILES.map((t) => {
    const src = image(t.img);
    const art = `<span class="b-art" aria-hidden="true">${src ? `<img src="${base}${src}" alt="" loading="lazy" decoding="async">` : ""}</span>`;
    return `<li class="${t.cls} reveal"><a href="${base}${t.href}">${art}<span class="b-tag">${t.tag}</span>${src ? "" : icon(t.ic).replace('class="ic"', 'class="b-shape"')}<span class="b-title">${t.title}</span><span class="b-text">${t.text}</span><span class="b-price">${t.price}</span></a></li>`;
  }).join("");
  return `<section class="section bento-sec" aria-labelledby="bento-title"><div class="container">
  <div class="section-head is-split reveal"><h2 id="bento-title" class="h2">Весь путь пациента — <span class="grad">в одних руках</span></h2><p class="lead">От поиска до возвращения: исследование, инструменты и цифры делает один человек, поэтому ничего не теряется между подрядчиками.</p></div>
  <ul class="bento">${tiles}</ul>
</div></section>`;
}
