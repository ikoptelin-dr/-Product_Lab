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
  { id: "promo", label: "Подготовить продукт к продвижению" },
  { id: "partners", label: "Подготовить материалы для партнёров" },
  { id: "automation", label: "Упростить заявки и работу команды" },
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
