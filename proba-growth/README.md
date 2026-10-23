# PROBA LAB — Growth Infrastructure Research (октябрь 2026)

Исследование и проект органического B2B-лидогенератора: регуляторные услуги партнёра как вход, затем услуги PROBA LAB.
**Только исследование:** сайты не создавались, домены не покупались, аккаунты не регистрировались, расходов не было.

**Начать с:** [`PROBA-GROWTH-MASTERPLAN.md`](PROBA-GROWTH-MASTERPLAN.md) — итоговый документ: 15 разделов, 90 дней, 12 месяцев, 10 первых действий, решения владельца.

## Материалы

| Файл | Что внутри |
|---|---|
| [`research/competitor-landscape.md`](research/competitor-landscape.md) | 24 конкурента: сегменты, практики лидогенерации с частотой, мультидоменные сети, цены, доказательства за и против cross-sell, пробелы рынка |
| [`research/competitors.csv`](research/competitors.csv) | Таблица конкурентов: URL, офферы, CTA, цены, сигналы экспертизы, источники, дата, уверенность |
| [`research/seo-network-strategy.md`](research/seo-network-strategy.md) | Сравнение архитектур A/B/C, официальные правила Яндекса и Google, ссылки (стоимость и риски), структура сайта, критерии 2-го и 3-го сайта |
| [`research/marketplace-leadgen.md`](research/marketplace-leadgen.md) | Авито, Яндекс Бизнес, Яндекс Исполнители (бывшие Яндекс Услуги), Профи.ру, 2ГИС, ассоциации, выставки; матрица каналов; структура объявлений; причины банов; последовательность тестов |
| [`research/semantic-map.csv`](research/semantic-map.csv) | 248 запросов, 20 кластеров по намерению; частоты не выдумывались — «проверить в Wordstat» |
| [`research/landing-page-map.md`](research/landing-page-map.md) | Посадочная, оффер, CTA и следующий продукт PROBA для каждого кластера; комплаенс-правила текстов; как собрать частоты |
| [`research/market-and-crosssell-evidence.md`](research/market-and-crosssell-evidence.md) | Рынок БАД и маркетплейсов, регуляторные изменения 2025–2027, кто покупает СГР, этикетка в досье СГР, партнёрские комиссии, контрактные производители |
| [`strategy/cross-sell-funnel.md`](strategy/cross-sell-funnel.md) | Сегменты S1–S6, Модели 1–4 (скрипты, момент, чек и конверсия как гипотезы, эксперименты), прозрачность ролей, роботы CRM |
| [`strategy/client-qualification.md`](strategy/client-qualification.md) | Скрипт квалификации, скоринг 0–10, дисквалификация, стоп-лист, поля CRM |
| [`architecture/lead-generation-system.md`](architecture/lead-generation-system.md) | CRM (Битрикс24 vs amoCRM), API площадок, UTM и коллтрекинг, воронки, SLA, атрибуция без двойного счёта, формулы метрик, 152-ФЗ и реклама, чек-лист |
| [`financial/leadgen-unit-economics.md`](financial/leadgen-unit-economics.md) | Unit-экономика: 3 сценария, 4 режима, безубыточность, чувствительность к cross-sell и доле партнёра |
| [`financial/model.py`](financial/model.py) / [`financial/model-output.md`](financial/model-output.md) | Исполняемая модель (`python3 financial/model.py > financial/model-output.md`) и её вывод |

## Как читать метки

- **[Факт] / Verified Fact** — подтверждено источником с URL.
- **[Наблюдение] / Observation** — видно на сайте или в выдаче. Часто взято из поискового индекса, а не из открытой страницы.
- **[Гипотеза] / Hypothesis** — нужно проверить.
- **[Рекомендация] / Recommendation** — вывод аналитика.

Все URL проверялись 2026-10-23.

## Ограничения

- Из среды исследования не открывались официальные российские домены: Яндекс, Авито, Профи.ру, Битрикс24, pravo.gov.ru, реестры ЕАЭС и ФСА, сайты конкурентов.
- Лимит поиска был исчерпан.
- Данных Wordstat и платных SEO-сервисов нет.
- Перед решениями с деньгами вручную проверить список из `PROBA-GROWTH-MASTERPLAN.md` §14.

## Связанные материалы

- `../proba-lab/` — стратегия 2026–2027, исследование рынка, founder-market fit (стоп-лист категорий).
- `../proba-site-v2/` — текущий прототип сайта v6.
