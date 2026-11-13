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

const WORDS = ["Клиники", "Производители БАД", "Научное сырьё", "OSINT", "Нетнография", "Путь пациента", "JTBD и CJM", "Кастдев", "B2B и ЛПР", "Сайты и боты", "Воронки", "Сквозная аналитика"];

export function marquee() {
  const row = WORDS.map((w) => `<span>${w}</span>`).join("");
  return `<div class="marquee" role="presentation"><div class="marquee-track"><div>${row}</div><div aria-hidden="true">${row}</div></div></div>`;
}

interface Tile { cls: string; href: string; tag: string; title: string; text: string; price: string; img: string; ic: string }
const TILES: Tile[] = [
  { cls: "b-lg b-docs", href: "uslugi.html#diagnostika", tag: "Клиники", title: "Диагностика пути пациента", text: "Спрос, отзывы, сайт глазами пациента и конкуренты. Показываем, где клиника теряет людей до записи и после визита.", price: "<b>от 60 000 ₽</b> · 2 недели", img: "bento-docs", ic: "doc" },
  { cls: "b-md b-pack", href: "kejsy/lizaty-b2b.html", tag: "Наука и сырьё", title: "Выход разработки на B2B-рынок", text: "Рынки, покупатели, ЛПР и письма для научно ёмкого сырья.", price: "<b>от 180 000 ₽</b>", img: "bento-marketing", ic: "jar" },
  { cls: "b-third b-3d", href: "metodologiya.html", tag: "Метод", title: "OSINT и нетнография", text: "Решения из данных, а не из мнений.", price: "Методология — <b>открыто</b>", img: "bento-3d", ic: "cube" },
  { cls: "b-third b-research", href: "uslugi.html#issledovanie", tag: "Исследование", title: "JTBD, CJM, кастдев", text: "За что платят и где уходят.", price: "<b>от 90 000 ₽</b>", img: "bento-research", ic: "target" },
  { cls: "b-third b-ana", href: "uslugi.html#zapusk", tag: "Запуск", title: "Сайт, бот, воронка", text: "Каждый вход и возврат виден в цифрах.", price: "<b>от 250 000 ₽</b>", img: "bento-analytics", ic: "chart" },
];

export function bento(base: string) {
  const tiles = TILES.map((t) => {
    const src = image(t.img);
    const art = `<span class="b-art" aria-hidden="true">${src ? `<img src="${base}${src}" alt="" loading="lazy" decoding="async">` : ""}</span>`;
    return `<li class="${t.cls} reveal"><a href="${base}${t.href}">${art}<span class="b-tag">${t.tag}</span>${src ? "" : icon(t.ic).replace('class="ic"', 'class="b-shape"')}<span class="b-title">${t.title}</span><span class="b-text">${t.text}</span><span class="b-price">${t.price}</span></a></li>`;
  }).join("");
  return `<section class="section bento-sec" aria-labelledby="bento-title"><div class="container">
  <div class="section-head is-split reveal"><h2 id="bento-title" class="h2">Медицина, данные и продажи — <span class="grad">в одних руках</span></h2><p class="lead">Врач понимает пациента и врача, аналитик считает, продавец доводит до сделки. Один человек отвечает за весь путь.</p></div>
  <ul class="bento">${tiles}</ul>
</div></section>`;
}
