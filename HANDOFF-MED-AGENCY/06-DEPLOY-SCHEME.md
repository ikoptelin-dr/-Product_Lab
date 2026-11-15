# 06. Схема выкладки нового сайта на компьютер основателя

Новый сайт ставится **вторым сайтом на тот же компьютер с Windows**, рядом с proba-lab.ru, через тот же Caddy друга. Все инструменты для этого уже есть в репозитории и проверены, кроме запуска на настоящем Windows: его там никто не прогонял.

## Как это устроено

| | proba-lab.ru | новый сайт |
|---|---|---|
| Папка на сервере | `D:\proba` | `D:\med` (имя = `PKG_NAME`) |
| Порт | 8080 | 8081 |
| Задачи автозапуска | «proba - sajt» | «med - sajt» — имя берётся из имени папки |
| HTTPS | Caddy друга, блок `proba-lab.ru` | Caddy друга, новый блок `<домен>` |
| Настройки | `D:\proba\nastrojki.txt` | `D:\med\nastrojki.txt`: `SITE_DOMAIN`, `SITE_PORT` уже вписаны |

`deploy/windows/upravlenie.ps1` читает из `nastrojki.txt`:
- `SITE_DOMAIN` — по умолчанию `proba-lab.ru`;
- `SITE_PORT` — по умолчанию 8080;
- `SITE_MARK` — слово для проверки «открылся именно этот сайт».

Имена задач он строит по имени папки. Поэтому два сайта не мешают друг другу.

## Что делает новый чат

1. **Собрать сайт с его доменом** — в отдельную папку движка, если её делали (например, `med-site/`), или через `DIST=`:
   ```bash
   SITE_URL=https://<домен> FORM_ENDPOINT=/lead PROD=1 YM_ID=<новый счётчик или пусто> node scripts/build.mjs
   ```
   Если новый сайт — копия движка в другой папке, скопируйте туда же `scripts/windows-package.sh` и `deploy/`. Или запускайте пакетный скрипт из `proba-site-v3/` с `PKG_DIST=<путь к dist нового сайта>`.
2. **Подставить домен в инструкцию.** Скопировать `INSTRUKCIYA-VTOROJ-SAJT.md` → например, `INSTRUKCIYA-MED.md` и заменить `<ДОМЕН>` на домен.
3. **Собрать архив:**
   ```bash
   cd proba-site-v3
   PKG_NAME=med PKG_DOMAIN=<домен> PKG_PORT=8081 PKG_SHARED=1 \
   PKG_DIST=<путь к dist нового сайта> PKG_INSTR=../INSTRUKCIYA-MED.md PKG_OUT=../MED-SERVER.zip \
   bash scripts/windows-package.sh
   ```
   Скрипт проверит, что сборка боевая и canonical указывает на `<домен>`, и положит в архив:
   - `nastrojki.txt` с `SITE_DOMAIN` и `SITE_PORT`;
   - Caddyfile под домен;
   - `OBSHCHIJ-CADDY.txt` с двумя блоками для Caddyfile друга.
4. **Проверить архив перед отправкой:** распаковать во временную папку, запустить `node server.mjs`. Должно быть «Сайт работает: http://localhost:8081», а canonical на главной — `https://<домен>/`.
5. **Закоммитить `MED-SERVER.zip` и инструкцию** и дать основателю ссылку на архив в GitHub (ветка, кнопка Download raw file).

## Что сделает основатель (по инструкции)

1. DNS: две записи A на 178.49.193.175.
2. Распаковать в `D:\`, скопировать `node.exe` из `D:\proba`.
3. Перенести почту и Битрикс24 в `nastrojki.txt`.
4. `1-POSMOTRET-SAJT.bat` → `2-VKLYUCHIT-AVTOZAPUSK.bat`.
5. Вставить блоки из `OBSHCHIJ-CADDY.txt` в конец Caddyfile друга, проверить `caddy validate`, перезагрузить.
6. `3-PROVERIT-VSE.bat` в обеих папках.

## Важно

- **Caddy друга не останавливать и не заменять.** Наши файлы закрывают только Caddy из своей папки.
- **В Caddyfile друга глобальный блок содержит `import dynu_dns`.** Для proba-lab.ru сертификат через этот Caddy получен, поэтому мешать не должно. Если для нового домена сертификат не выдаётся, смотрите ошибки в окне или журнале Caddy друга.
- **Секреты** (почта, Битрикс24) — только в `nastrojki.txt` на сервере.
- **Метрика, Вебмастер, Search Console** — для нового домена отдельно.
