import { z } from "zod";

export const TOPICS = [
  "Пробник — мини-разбор (бесплатно)",
  "Аудит «Проба продукта»",
  "Аудит «Проба маржи»",
  "Доказательное досье",
  "Go-to-market",
  "Запуск под ключ",
  "Внешний продуктовый офис",
  "Другое",
] as const;

export const CATEGORIES = ["БАД", "Спецпитание", "Космецевтика", "Медизделие", "Ингредиент", "Другое"] as const;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Не более ${max} символов`)
    .optional()
    .or(z.literal("").transform(() => undefined));

export const leadSchema = z.object({
  name: z.string().trim().min(2, "Укажите имя").max(80, "Не более 80 символов"),
  company: z.string().trim().min(2, "Укажите компанию").max(120, "Не более 120 символов"),
  position: optionalText(80),
  email: z.string().trim().email("Проверьте email").max(160),
  contact: optionalText(60),
  topic: z.enum(TOPICS, { errorMap: () => ({ message: "Выберите, что нужно" }) }),
  category: z.enum(CATEGORIES).optional().or(z.literal("").transform(() => undefined)),
  productUrl: z
    .string()
    .trim()
    .max(500, "Слишком длинная ссылка")
    .url("Нужна ссылка вида https://…")
    .refine((v) => /^https?:\/\//i.test(v), "Нужна ссылка вида https://…")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  message: optionalText(2000),
  consent: z.literal(true, { errorMap: () => ({ message: "Нужно согласие на обработку данных" }) }),
});

/** Служебные поля антиспама и атрибуции — не входят в саму заявку. */
export const metaSchema = z.object({
  website: z.string().optional(), // honeypot
  startedAt: z.number().optional(), // time-trap
  captchaToken: z.string().optional(),
  utm: z.record(z.string().max(200)).optional(),
});

export type Lead = z.infer<typeof leadSchema>;
export type LeadInput = z.input<typeof leadSchema>;
