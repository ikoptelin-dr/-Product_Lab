# Окружение этапа 2 (фактические версии и команды)

| Компонент | Версия / путь | Как подтверждено |
|---|---|---|
| ОС | Linux 6.18 (контейнер) | — |
| Node | v22.22.0, `/opt/node22/bin/node`; `/usr/local/bin/node` — ссылка на него | `node -v`, `ls -l` |
| Python (статический сервер) | 3.13.16 | `python3 --version` |
| pandoc | 3.1.3 | `pandoc -v` |
| esbuild | 0.28.2 (`proba-site/node_modules`) | package.json |
| Playwright | `@playwright/test` и `playwright-core` 1.56.0 (`proba-site/node_modules`) | `require(...).version` в скрипте пилота — `evidence/pilot/pilot-results.json → meta` |
| Chromium | 141.0.7390.37, `/opt/pw-browsers/chromium` (`executablePath` задан явно) | `chromium --version`, `browser.version()` |
| axe-core | 4.14.0, `proba-site/node_modules/axe-core/axe.min.js`, вставляется через `page.addScriptTag` | `meta.axe` в результатах |
| Lighthouse | 13.6.0, ставился отдельно в `scratchpad/lh` (`npm install --save-exact lighthouse@13.6.0`, 119 пакетов). Зависимости приложения не менялись | `lighthouseVersion` в отчётах |

## Сервер

```
python3 -m http.server 8850 --bind 127.0.0.1 --directory site-audit/stage-2/evidence/build/dist-fresh
```

- Адрес: `http://127.0.0.1:8850/`, только loopback.
- `SimpleHTTP/0.6`: HTTP/1.0, без gzip/brotli, без кеш-заголовков, `Content-type: text/html` без charset (кодировку задаёт `<meta charset>` в HTML). Заголовков безопасности и CSP из `deploy/nginx.conf` нет.
- Поведение боевого nginx (сжатие, HTTP/2, кеш на год, CSP, 301, `X-Robots-Tag`) на этом этапе **не проверялось**.

## Команды

| Шаг | Команда |
|---|---|
| Сборка в копии | см. `baseline.md` |
| Существующие тесты | `cd scratchpad/iso/proba-site-v3 && bash scripts/verify.sh site-audit/stage-2/evidence/verify/shots 8851` — свой сервер на 127.0.0.1:8851 поверх копии `dist` (совпадает со свежей сборкой). Полный журнал: `evidence/verify/verify.log`. RC=0, 11 мин 32 с, «✓ ВСЁ ПРОШЛО» |
| Пилот | `node site-audit/stage-2/scripts/pilot.mjs http://127.0.0.1:8850/ <dist-fresh> evidence/pilot` |
| Точечные проверки | `scripts/probe320.mjs` (переполнение), `scripts/repro-header-contrast.mjs` (контраст шапки) |
| Lighthouse | `scripts/lh-run.sh`: `CHROME_PATH=/opt/pw-browsers/chromium node .../lighthouse/cli/index.js <url> --quiet --chrome-flags="--headless=new --no-sandbox" --output=json --output=html` |
| Приёмник заявок (повтор) | `env -i PORT=8790 LEAD_LOG=scratchpad/leads-test.jsonl node <копия deploy/form-endpoint.mjs>`. Только loopback, без `TG_TOKEN` и `TG_CHAT` — в Telegram ничего не уходит. Тестовые POST через curl, журнал и сервер удалены после проверки |

**Lighthouse** запускался с мобильным пресетом по умолчанию: эмуляция мобильного устройства и simulated throttling. Пробный запуск на `index.html` прошёл (`evidence/lighthouse/trial/`). Все 24 прогона шли строго последовательно, другие браузерные задачи в это время не запускались.

## Что пилот делает с сетью

- Все запросы не на `127.0.0.1:8850` и все не-GET запросы перехватываются и отменяются (`context.route`), список сохраняется. Таких запросов не было.
- Формы отправляются только в режиме прототипа: в сборке нет `meta[name="proba-form-endpoint"]`, поэтому `site.ts` не делает submit. Это подтверждено: 0 запросов после отправки.
