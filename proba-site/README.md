# Proba Lab — сайт (v1, устарел)

> Дизайн и тексты v1 (парфюмерная концепция) отменены. Актуальная версия — `../proba-site-v2/`. Из этого проекта переиспользуется серверная часть формы заявок (`app/api/lead`, `lib/`), её нужно перенести под v2.

Лендинг бюро доказательной коммерциализации health-продуктов. Концепция — «Проба» как премиальный парфюмерный дом: композиция нот, мюйетка, коллекция-этикетки, клейма. Подробнее — [DESIGN_RESEARCH.md](DESIGN_RESEARCH.md).

**Стек:** Next.js 15 (App Router) · TypeScript strict · Tailwind CSS v4 · zod · nodemailer · Vitest · Playwright.
Шрифты Cormorant Garamond и Inter подключены локально через `@fontsource`: без запросов к Google, что удобно для хостинга в РФ.

## Быстрый старт

```bash
npm install
cp .env.example .env.local     # заполните то, что знаете
npm run dev                    # http://localhost:3000
```

Без настроенных каналов заявки в dev-режиме выводятся в консоль сервера. В production сервер отвечает 503 и **никогда не изображает успешную отправку**.

## Команды

| Команда | Что делает |
|---|---|
| `npm run dev` | Режим разработки |
| `npm run build` | Проверка плейсхолдеров и production-сборка |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm test` | Юнит-тесты: схема заявки, антиспам, rate limit, каналы, мюйетка |
| `npm run test:e2e` | Playwright (desktop и mobile): навигация, меню, ноты, мюйетка, форма, правовые страницы, API |
| `npm run check:placeholders` | Ищет незаполненные `[[ЗАПОЛНИТЬ…]]` и env; с `STRICT_PLACEHOLDERS=true` — ошибка |
| `node scripts/screenshots.mjs [url]` | Скриншоты главной (390 и 1440 px) в `tests/screenshots/` |

Если Playwright не находит браузер, укажите путь: `PW_CHROMIUM_PATH=/путь/к/chromium npm run test:e2e`.

## Структура

```
app/                 страницы: главная, /privacy, /consent, /legal, 404, sitemap, robots, API /api/lead
components/
  sections/          Hero, Manifesto, Notes (флакон), Litmus (мюйетка), Collection, Process,
                     Expertise (клейма), Projects (по флагу), Team, Faq, Contact
  layout/            Header (мобильное меню с focus-trap), Footer, CookieBanner, LegalPage
  forms/LeadForm     форма заявки (zod-валидация на клиенте и сервере)
  brand/Logo         эмблема и словесный знак
content/site.ts      ВЕСЬ текст сайта, цены, FAQ, команда
config/site.config.ts контакты, реквизиты, флаги (из env), плейсхолдеры
lib/                 схема заявки, обработчик, антиспам, rate limit, каналы уведомлений, мюйетка, JSON-LD
public/brand/        логотип: emblem.png, logo-full.png, wordmark.png, иконки, исходник logo-source.png
```

## Как менять

- **Тексты и цены** — `content/site.ts`.
- **Контакты и реквизиты** — переменные `NEXT_PUBLIC_*` (см. `.env.example`). `NEXT_PUBLIC_*` встраиваются при сборке, поэтому после изменения нужна пересборка.
- **Логотип** — `public/brand/emblem.png` вырезан из присланного изображения (фон сделан прозрачным). Для максимальной чёткости положите векторный `emblem.svg` и замените `src` в `components/brand/Logo.tsx`.
- **Правила мюйетки** — `lib/litmus.ts`. Каждое правило: шаблон, уровень, объяснение и альтернатива. Покрыто тестами.
- **Блок проектов** — добавьте элементы с `consent: true` в `content/site.ts` и включите `NEXT_PUBLIC_SHOW_PROJECTS=true`.

## Заявки: каналы доставки

Каналы включаются заполнением переменных. Заявка уходит во все включённые каналы параллельно и считается доставленной, если дошла хотя бы до одного.

| Канал | Переменные | Как настроить |
|---|---|---|
| Email (SMTP) | `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `LEAD_EMAIL_FROM`, `LEAD_EMAIL_TO` | Яндекс 360: `smtp.yandex.ru`, порт 465, SSL, пароль приложения. `replyTo` — email клиента |
| Telegram | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | Создайте бота у @BotFather, добавьте в чат, напишите сообщение и возьмите `chat.id` из `https://api.telegram.org/bot<TOKEN>/getUpdates` |
| Webhook (любая CRM) | `CRM_WEBHOOK_URL`, `CRM_WEBHOOK_SECRET` | POST JSON: `{leadId, createdAt, source, utm, name, company, position, email, contact, topic, category, productUrl, message, consent}`. Если задан секрет — заголовок `X-Signature: sha256=<HMAC-SHA256(тело)>` |
| Bitrix24 | `BITRIX24_WEBHOOK_URL` | Приложения → Вебхуки → Входящий вебхук с правами CRM. Создаётся лид через `crm.lead.add` с UTM |

**amoCRM:** проще всего подключить через универсальный webhook и сервис-посредник (Albato, n8n, Make), который вызывает `POST /api/v4/leads/complex`. Прямую интеграцию по OAuth в этом проекте не делали.

**Защита от спама:** скрытое поле-ловушка; отсечка отправок быстрее 3 секунд; лимит 5 заявок за 10 минут с одного IP (в памяти; для нескольких инстансов замените на Redis, интерфейс `lib/rate-limit.ts`); по желанию Yandex SmartCaptcha (`NEXT_PUBLIC_SMARTCAPTCHA_CLIENT_KEY` и `SMARTCAPTCHA_SERVER_KEY`).

## Аналитика

Яндекс Метрика (`NEXT_PUBLIC_YM_ID`) загружается **только после согласия** в cookie-баннере. Цели: `cta_hero_click`, `cta_offer_click`, `service_select`, `litmus_check`, `lead_submit`, `lead_error`.

## Развёртывание

### Рекомендуется: сервер в РФ (Yandex Cloud, Selectel, Timeweb Cloud)

Данные заявок — персональные данные граждан РФ. По 152-ФЗ их первичная запись и хранение должны быть на территории РФ.

```bash
cp .env.example .env.production    # заполнить
# в Caddyfile указать свой домен
docker compose up -d --build       # сборка со STRICT_PLACEHOLDERS=true, HTTPS через Caddy
```

Без Docker: `npm ci && STRICT_PLACEHOLDERS=true npm run build`, затем скопировать `public` и `.next/static` внутрь `.next/standalone` и запустить `node .next/standalone/server.js` (через systemd или pm2) за Nginx или Caddy.

### Альтернатива: Vercel

Технически работает. Но заявки обрабатываются на зарубежных серверах, и это может противоречить требованию локализации персональных данных. Решение принимать с юристом.

## Проверено

На момент сдачи:
- `npm run lint`, `npm run typecheck`, `npm run build` — без ошибок;
- 18 юнит-тестов и 24 e2e-сценария (desktop и mobile) — зелёные;
- реальная доставка заявки в webhook с HMAC-подписью проверена на локальном приёмнике;
- без каналов production-сервер отвечает 503.

См. также [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md) и [MISSING_DATA.md](MISSING_DATA.md).

