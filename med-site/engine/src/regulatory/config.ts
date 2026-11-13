// Настройки раздела «Документы и соответствие».

/** Адрес главной страницы относительно страниц раздела (dist/dokumenty/*.html).
 *  Якоря главной собираются как `${MAIN_HREF}#review`. */
export const MAIN_HREF = "../index.html";

/** Абсолютный адрес сайта без завершающего слэша, например "https://proba-lab.ru".
 *  Пока пусто — canonical и og:url не выводятся, ссылки в JSON-LD относительные. */
declare const __SITE_URL__: string;
export const SITE_URL = typeof __SITE_URL__ === "string" ? __SITE_URL__ : "";

/** Папка раздела на сайте. */
export const SECTION_DIR = "dokumenty";

export const UPDATED = "октябрь 2026";
