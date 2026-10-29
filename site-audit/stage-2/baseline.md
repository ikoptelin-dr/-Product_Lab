# Базовая сборка этапа 2

## Исходное состояние репозитория (до работ, 2026-10-28T03:04Z)

- Ветка `claude/pensive-tesla-1hg10j`, HEAD `b040695` («Сборка dist: все страницы в блоках v4», 2026-10-27).
- `git status`: в репозитории не было изменений, кроме неотслеживаемой папки `site-audit/` (материалы этапа 1).
- Хеши: SHA-256 всех отслеживаемых файлов `proba-site-v3/`, `proba-growth/content/`, `proba-growth/pricing/`, `proba-legal/` (277 файлов) и всех 99 файлов закоммиченного `dist/` — в `evidence/baseline/`.

## Что читает, пишет и запускает сборка (`scripts/build.mjs`, изучено до запуска)

| Действие | Что |
|---|---|
| Читает | `src/**` (через esbuild), `src/site.css`, `site.ts`, `calc.ts` (хеш ассетов); `../proba-legal/{oferta,politika-pd,soglasie-pd,pravovaya-informaciya}.md`; `../proba-growth/content/pages/**/*.md`; `../proba-growth/pricing/site-prices.json` (импорт в `src/prices.ts`); `assets/emblem-ink.png`, `assets/fonts/*`, `assets/images/*` (если есть) |
| Импортирует извне проекта | `/home/user/-Product_Lab/proba-site/node_modules/esbuild` — абсолютный путь, только чтение |
| Внешние команды | `/usr/bin/pandoc` (Markdown → HTML), через stdin и файлы, без сети |
| Удаляет и пишет | `rmSync(dist)`, затем пишет весь `dist/` (или `$DIST`); **пишет `REGULATORY_VERIFY.md` в корень проекта** (отслеживаемый файл) |
| Переменные окружения | `SITE_URL`, `PROD`, `FORM_ENDPOINT`, `YM_ID`, `DIST`; все были пусты |
| Нестабильное | `today = new Date()` попадает в `<lastmod>` sitemap и в строку «Дата сборки» `REGULATORY_VERIFY.md` |

## Изолированная сборка

- **Копия:** `scratchpad/iso/` (временная, вне репозитория) с той же относительной структурой.
  - Что скопировано (`cp -a`, без ссылок):
    - `proba-site-v3/{src,scripts,assets,content}`;
    - `proba-growth/content/`;
    - `proba-growth/pricing/site-prices.json`;
    - 4 юридических `.md`.
  - Что не копировалось: `deploy/`, `rekvizity.*`, архивы и docx юридических документов, старые версии сайта.
- **Команда:** `cd iso/proba-site-v3 && env -i PATH=/usr/local/bin:/usr/bin:/bin HOME=$HOME node scripts/build.mjs`. Окружение очищено, чтобы случайные `SITE_URL` и другие переменные не попали в сборку.
- **Результат:** RC=0, «80 страниц (19 в dokumenty/)», «REGULATORY_VERIFY.md — 556 фраз». Журнал — `evidence/build/build.log`.

## Сравнение со старым `dist`

| Что | Результат |
|---|---|
| Список файлов | Совпадает: 99 файлов |
| Содержимое | Совпадает побайтно в 98 файлах из 99 |
| `sitemap.xml` | Отличаются только 80 значений `<lastmod>`: 2026-10-27 → 2026-10-28. Это дата сборки, а не изменение сайта |
| `REGULATORY_VERIFY.md` (в копии) | Отличается только строка «Дата сборки» |

Вывод: закоммиченный `dist/` соответствует исходникам на HEAD `b040695`. Различия чисто технические (дата сборки). Подробности — `evidence/build/diff-original-vs-fresh.txt`.

## Что проверялось на этапе 2

- **Свежая сборка** `evidence/build/dist-fresh/`. Старый `dist` сохранён копией в `evidence/build/dist-original/` как исходное свидетельство.
- Сборка сделана **без** `SITE_URL`, `FORM_ENDPOINT` и `YM_ID`, то есть это состояние превью или прототипа, а не прод-сборка. Поэтому:
  - нет canonical и og:url;
  - формы не отправляются;
  - Метрики нет;
  - sitemap и robots указывают на домен-заглушку `proba-lab.ru`.

  Всё это свойства конфигурации выпуска, а не дефекты локального сервера.

## Основной проект после работ

Проверка в конце этапа описана в `handoff.md`, раздел «Неизменность основного проекта».
