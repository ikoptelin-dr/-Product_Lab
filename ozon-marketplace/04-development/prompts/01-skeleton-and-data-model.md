# 01. Каркас и модель данных

Когда: можно начинать сразу, ничего от партнёров не нужно.

```text
Шаг 01 проекта ozon-marketplace: каркас сервиса и модель данных.

Прочитай ozon-marketplace/CLAUDE.md и следуй ему. Справочник — раздел 4 отчёта ChatGPT
(02-tech-analysis/reports/chatgpt-technical-report-2026-10-14.md), особенно 4.1, 4.3, 4.4.

Сделай в ozon-marketplace/service/:
1. Проект: pyproject.toml (Python 3.12, FastAPI, SQLAlchemy 2, Alembic, psycopg, pydantic-settings, httpx, pytest, ruff),
   структура модулей: core (настройки, время, деньги), db, ozon, suppliers, catalog, pricing, availability, orders,
   finance, llm, ops (оператор и кабинет сборщика), jobs (очереди). Пустые модули — с README на 3–5 строк о назначении.
2. Модель данных по таблице 4.3 отчёта: brand/brand_alias, part, part_relation, vehicle/fitment, asset/compliance_document,
   supplier/supplier_contract/supplier_warehouse, supplier_offer, feed_snapshot/ingest_run, listing, availability/reservation,
   posting/posting_item, purchase_order/purchase_item, allocation, package/label/handover, return/return_item,
   financial_event/document/document_line/bank_line, reconciliation_issue, inbox/outbox/integration_job/audit_log.
   Деньги в копейках (BIGINT), внешние ID — TEXT, время — timestamptz. Уникальные ключи и внешние ключи продумай сам и
   объясни неочевидные решения комментариями.
3. Очередь заданий на PostgreSQL (SELECT ... FOR UPDATE SKIP LOCKED) с раздельными очередями из CLAUDE.md, приоритетами,
   числом попыток, next_run_at; transactional outbox с ключом идемпотентности.
4. Alembic-миграция, docker-compose с PostgreSQL для локального запуска, Makefile (up, migrate, test, lint).
5. Тесты: миграция накатывается и откатывается; деньги не принимают float; задание не берут два обработчика одновременно;
   повторная запись в outbox с тем же ключом не создаёт дубль.

Если в среде нет Docker или PostgreSQL — установи PostgreSQL локально или скажи, что тесты БД не запускались.

В конце: обнови STATUS.md, закоммить, запушь. Ответь: что сделано, какие решения по модели данных ты принял и почему,
что не проверено.
```
