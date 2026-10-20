// Проверяет, что все [[ЗАПОЛНИТЬ: ...]] заменены реальными данными.
// STRICT_PLACEHOLDERS=true (production/CI) — ошибка и остановка сборки; иначе — предупреждение.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import nextEnv from "@next/env";

// Подхватываем .env.production / .env так же, как это сделает next build.
nextEnv.loadEnvConfig(process.cwd(), false, { info: () => {}, error: console.error });

const strict = process.env.STRICT_PLACEHOLDERS === "true";
const MARK = "[[ЗАПОЛНИТЬ";
const problems = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(name)) {
      readFileSync(p, "utf8")
        .split("\n")
        .forEach((line, i) => {
          if (line.includes(MARK)) problems.push(`${p}:${i + 1}  ${line.trim().slice(0, 110)}`);
        });
    }
  }
}
// Контент и страницы. config/ проверяется через переменные окружения ниже.
["content", "app", "components"].forEach(walk);

const requiredEnv = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_CONTACT_EMAIL",
  "NEXT_PUBLIC_TELEGRAM_URL",
  "NEXT_PUBLIC_LEGAL_ENTITY_NAME",
  "NEXT_PUBLIC_INN",
  "NEXT_PUBLIC_OGRN",
  "NEXT_PUBLIC_PRICING_NOTE",
];
for (const k of requiredEnv) if (!process.env[k]) problems.push(`env: ${k} не задан`);
if (process.env.NEXT_PUBLIC_LEGAL_REVIEWED !== "true") problems.push("env: NEXT_PUBLIC_LEGAL_REVIEWED != true (тексты /privacy и /consent не проверены юристом)");

if (problems.length) {
  const head = `Найдено незаполненных данных: ${problems.length}`;
  if (strict) {
    console.error(`✖ ${head}\n  ${problems.join("\n  ")}`);
    process.exit(1);
  }
  console.warn(`⚠ ${head} (сборка продолжится; для production задайте STRICT_PLACEHOLDERS=true)\n  ${problems.join("\n  ")}`);
} else {
  console.log("✓ Плейсхолдеров не найдено");
}
