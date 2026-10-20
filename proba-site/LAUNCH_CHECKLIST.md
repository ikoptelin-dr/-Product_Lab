# Чек-лист запуска

- [ ] Домен куплен, DNS A-запись указывает на сервер
- [ ] `.env.production` заполнен по `.env.example`; `npm run check:placeholders` с `STRICT_PLACEHOLDERS=true` проходит
- [ ] Векторный логотип и фото команды добавлены (см. MISSING_DATA.md)
- [ ] Реквизиты указаны; подпись о налогах и ценах подтверждена бухгалтером
- [ ] Тексты /privacy и /consent проверены юристом, `NEXT_PUBLIC_LEGAL_REVIEWED=true`
- [ ] Уведомление в Роскомнадзор об обработке персональных данных подано
- [ ] Сервер и все хранилища заявок (почта, CRM) — в РФ (локализация по 152-ФЗ); с юристом обсуждён Telegram как канал уведомлений
- [ ] Тестовая заявка дошла во все включённые каналы
- [ ] SPF, DKIM, DMARC настроены для домена отправителя писем
- [ ] Яндекс Метрика: счётчик, цели `cta_hero_click`, `cta_offer_click`, `service_select`, `litmus_check`, `lead_submit`, `lead_error`
- [ ] `robots.txt` и `sitemap.xml` доступны; `NEXT_PUBLIC_ROBOTS_NOINDEX=false`
- [ ] Lighthouse (мобильный) ≥ 90 / 95 / 95 / 95
- [ ] Проверено на реальных iOS (Safari) и Android (Chrome)
- [ ] OG-превью проверено в Telegram и VK
- [ ] Страница 404 работает
- [ ] Резервная копия `.env.production` хранится в менеджере паролей
