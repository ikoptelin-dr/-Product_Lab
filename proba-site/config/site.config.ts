// Контакты, реквизиты и флаги. Значения берутся из переменных окружения;
// незаполненные — явные плейсхолдеры, которые блокируют production-сборку (scripts/check-placeholders.mjs).

export const PLACEHOLDER_PREFIX = "[[ЗАПОЛНИТЬ";

const ph = (what: string) => `${PLACEHOLDER_PREFIX}: ${what}]]`;
const env = (value: string | undefined, what: string) => (value && value.trim() ? value.trim() : ph(what));
const flag = (value: string | undefined, fallback = false) =>
  value === undefined || value === "" ? fallback : value === "true";

export const isPlaceholder = (value: string | undefined | null) =>
  !value || value.startsWith(PLACEHOLDER_PREFIX);

export const siteConfig = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  brandName: "Proba Lab",
  city: "Новосибирск",
  contactEmail: env(process.env.NEXT_PUBLIC_CONTACT_EMAIL, "email для заявок"),
  telegramUrl: env(process.env.NEXT_PUBLIC_TELEGRAM_URL, "ссылка на Telegram"),
  phone: env(process.env.NEXT_PUBLIC_PHONE, "телефон (необязательно)"),
  legalEntityName: env(process.env.NEXT_PUBLIC_LEGAL_ENTITY_NAME, "ИП Фамилия И. О. / ООО «...»"),
  inn: env(process.env.NEXT_PUBLIC_INN, "ИНН"),
  ogrn: env(process.env.NEXT_PUBLIC_OGRN, "ОГРН/ОГРНИП"),
  ogrnLabel: process.env.NEXT_PUBLIC_OGRN_LABEL || "ОГРНИП",
  pricingNote: env(
    process.env.NEXT_PUBLIC_PRICING_NOTE,
    "Цены указаны без НДС, исполнитель применяет УСН — подтвердить",
  ),
  legalReviewed: flag(process.env.NEXT_PUBLIC_LEGAL_REVIEWED),
  ymId: process.env.NEXT_PUBLIC_YM_ID || "",
  robotsNoindex: flag(process.env.NEXT_PUBLIC_ROBOTS_NOINDEX),
  features: {
    showProjects: flag(process.env.NEXT_PUBLIC_SHOW_PROJECTS),
    smartCaptcha: Boolean(process.env.NEXT_PUBLIC_SMARTCAPTCHA_CLIENT_KEY),
  },
  smartCaptchaClientKey: process.env.NEXT_PUBLIC_SMARTCAPTCHA_CLIENT_KEY || "",
} as const;

export type SiteConfig = typeof siteConfig;
