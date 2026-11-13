// Структура страницы раздела «Документы и соответствие».
// Тексты — обычные строки; фактические фразы помечены f(ключ, фраза) из sources.ts.

export interface Card {
  title: string;
  text: string;
}

export interface Step {
  title: string;
  text: string;
  /** Кто делает шаг. */
  who: string;
}

export interface Faq {
  q: string;
  a: string;
}

export interface EstimateLine {
  item: string;
  note: string;
}

export interface RegPage {
  slug: string;
  kind: "hub" | "service" | "about";
  /** ≤ 60 символов. */
  title: string;
  /** ≤ 160 символов. */
  description: string;
  /** Короткое имя — хлебные крошки, карточки, смежные услуги. */
  name: string;
  /** Подзаголовок карточки в хабе. */
  cardText: string;
  /** Группа в сетке хаба. */
  group?: "Документы" | "Производство" | "Испытания" | "Запуск";
  eyebrow: string;
  h1: string;
  lead: string;
  cta: { label: string; href: string };
  cta2?: { label: string; href: string };
  /** «Коротко» в первом экране: [подпись, значение]. */
  summary?: [string, string][];
  who?: { yes: string[]; no: string[] };
  includes?: Card[];
  steps?: Step[];
  timing?: { agency: string; project: string };
  fromYou?: string[];
  estimate?: EstimateLine[];
  estimateNote?: string;
  mistakes?: Card[];
  faq: Faq[];
  bridge?: { title: string; text: string; points: string[] };
  related: string[];
  /** Значение «Что нужно» в форме по умолчанию. */
  need: string;
  formTitle?: string;
  formLead?: string;
  norms: string[];
  serviceType?: string;
}
