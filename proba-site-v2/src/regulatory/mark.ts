// Метки фактических фраз: ⟪ключ|фраза⟫. Модуль без данных — его можно импортировать в клиентский код.
import type { SrcKey } from "./sources";

/** Помечает фактическую фразу. Сборка снимает метку и заносит фразу в REGULATORY_VERIFY.md. */
export const f = (key: SrcKey, text: string) => `⟪${key}|${text}⟫`;

export const FACT_RE = /⟪([\w-]+)\|([^⟫]*)⟫/g;

/** Снять метки (для клиентского кода и метаданных). */
export const stripFacts = (s: string) => s.replace(FACT_RE, "$2");
