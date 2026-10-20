# Чего не хватает до публикации

Всё ниже отмечено на сайте пунктирной золотой рамкой (`[[ЗАПОЛНИТЬ…]]`). При `STRICT_PLACEHOLDERS=true` сборка без этих данных не пройдёт.

| Данные | Где задать |
|---|---|
| Имя и фамилия основателя, фото (по желанию) | `content/site.ts` → `team.people[0]`, фото в `public/team/` |
| Имя и фамилия Миши, краткое био, фото | `content/site.ts` → `team.people[1]` |
| Ссылка на публикации (eLibrary / ORCID), Telegram основателя | `content/site.ts` → `team.people[0].links` |
| Email для заявок, Telegram бюро, телефон (необязательно) | `.env.production`: `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_TELEGRAM_URL`, `NEXT_PUBLIC_PHONE` |
| Юрлицо (ИП/ООО), ИНН, ОГРН/ОГРНИП | `NEXT_PUBLIC_LEGAL_ENTITY_NAME`, `NEXT_PUBLIC_INN`, `NEXT_PUBLIC_OGRN`, `NEXT_PUBLIC_OGRN_LABEL` |
| Налоговый режим — подпись к ценам | `NEXT_PUBLIC_PRICING_NOTE` |
| Домен | `NEXT_PUBLIC_SITE_URL`, `Caddyfile` |
| Ссылки на первоисточники (ПП № 398, приказ 669н, 150-ФЗ, данные АПЭТ) | `content/site.ts` → `notes.sources` |
| Проверенные юристом тексты /privacy и /consent, сроки хранения и действия согласия | `app/privacy/page.tsx`, `app/consent/page.tsx`, затем `NEXT_PUBLIC_LEGAL_REVIEWED=true` |
| Канал заявок: SMTP, и/или Telegram-бот, и/или CRM | `.env.production` (см. README) |
| ID Яндекс Метрики, ключи SmartCaptcha (необязательно) | `.env.production` |
| **Векторный логотип** (SVG). Сейчас используется растр 264 px, вырезанный из присланного изображения — на ретина-экранах крупно может быть мягким | Положить `public/brand/emblem.svg` и поменять `src` в `components/brand/Logo.tsx` |
| Согласия клиентов на публикацию кейсов | `content/site.ts` → `projects.items`, затем `NEXT_PUBLIC_SHOW_PROJECTS=true` |
