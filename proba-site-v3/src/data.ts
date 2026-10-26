// Копия proba-site-v2/src/data.ts (v3 — отдельный проект). Отличие: в TASKS добавлены docs, analytics, audit.
// Единый источник цен, задач формы и отзывов. Меняйте значения здесь —
// цены и отзывы подставляются в разметку при сборке (scripts/build.mjs), задачи использует скрипт формы.

/** Цены — текущая гипотеза для запуска. Меняются только здесь. */
export const PRICES = {
  start: "29 000 ₽",
  promoPrep: "от 150 000 ₽",
  promoSupport: "от 40 000 ₽ в месяц",
} as const;

/** Задачи в форме «Обсудить задачу». id используется в data-task у кнопок. */
export const TASKS = [
  { id: "docs", label: "Документы и регистрация" },
  { id: "promo", label: "Подготовить продукт к продвижению" },
  { id: "partners", label: "Подготовить материалы для партнёров" },
  { id: "automation", label: "Упростить заявки и работу команды" },
  { id: "analytics", label: "Настроить аналитику и учёт заявок" },
  { id: "audit", label: "Аудит продаж" },
  { id: "package", label: `Пакет «Предложение для одного продукта» — ${PRICES.start}` },
  { id: "support", label: "Сопровождение продвижения" },
] as const;

export type TaskId = (typeof TASKS)[number]["id"];

/** Отзывы. Публикуются только настоящие и согласованные; пока список пуст — секция не выводится. */
export interface Review {
  company: string;
  person: string;
  role: string;
  task: string;
  text: string;
}
export const REVIEWS: Review[] = [];

/** Раздел «Документы и соответствие»: юрлицо специалиста-партнёра, который ведёт регуляторные работы.
 *  Пока name пустое — на страницах ничего не выводится. Заполняет владелец после подписания договора. */
export const REG_PARTNER = { name: "", inn: "", note: "" };

/** Цены «от» за работу по услугам раздела, ключ — адрес страницы без .html
 *  (например "registraciya-bad": "от 00 000 ₽"). Пусто или null — цена не показывается. Только после утверждения владельцем. */
export const REG_PRICES: Record<string, string | null> = {};

/** Реквизиты и контакты (content/footer-pages.md, proba-legal/rekvizity.md). Подвал, «Контакты», «Оплата», JSON-LD.
 *  Почта — как в юридических документах (I.koptelin@yandex.ru, указание владельца для оферты п. 1.4);
 *  в footer-pages.md — ikoptelin@yandex.ru. Расхождение — в README, «Ждёт решения владельца». */
export const COMPANY = {
  brand: "Proba Lab",
  legalName: "ИП Коптелин Илья Алексеевич",
  fullName: "Индивидуальный предприниматель Коптелин Илья Алексеевич",
  inn: "540821689171",
  ogrnip: "326547600096728",
  registered: "14.05.2026",
  address: {
    postalCode: "633203",
    region: "Новосибирская область",
    locality: "г. Искитим",
    street: "мкр Индустриальный, 35, 36",
    full: "633203, Новосибирская область, г. Искитим, мкр Индустриальный, 35, 36",
  },
  phone: "+7 999 466-22-79",
  phoneHref: "tel:+79994662279",
  email: "I.koptelin@yandex.ru",
  bank: {
    account: "40802810523550007066",
    name: "ФИЛИАЛ «НОВОСИБИРСКИЙ» АО «АЛЬФА-БАНК»",
    bik: "045004774",
    corr: "30101810600000000774",
  },
} as const;
