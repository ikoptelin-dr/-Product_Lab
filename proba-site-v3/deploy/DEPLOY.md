# Выкладка на тестовый сервер

Сайт — статические файлы. Нужен любой сервер с nginx (Ubuntu/Debian).

## 1. Собрать

```bash
cd proba-site-v3
node scripts/build.mjs          # → dist/ (72 страницы + 404), sitemap.xml, robots.txt, REGULATORY_VERIFY.md
bash scripts/verify.sh /tmp/shots   # проверки в браузере (Playwright)
```

## 2. Скопировать на сервер

```bash
rsync -av --delete dist/ user@SERVER:/var/www/proba-lab/dist/
```

## 3. Подключить nginx (один раз)

```bash
sudo apt install nginx
sudo cp deploy/nginx.conf /etc/nginx/sites-available/proba-lab
sudo ln -s /etc/nginx/sites-available/proba-lab /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

Сайт откроется по IP сервера. Тестовая версия закрыта от индексации заголовком `X-Robots-Tag: noindex`.

## Что сделать перед продом

1. Домен и HTTPS: `server_name proba-lab.ru;` и `sudo certbot --nginx`, затем включить строку `Strict-Transport-Security` в конфиге.
2. Собирать с адресом сайта: `SITE_URL=https://proba-lab.ru PROD=1 node scripts/build.mjs` — появятся canonical, og:url и абсолютные адреса в разметке.
3. Убрать строки `X-Robots-Tag` из конфига (их две: в `server` и в `/assets/`).
4. Чистые адреса (`/dokumenty/otkaznoe-pismo/`): перевести ссылки в сборке на абсолютные от корня и включить 301 с `.html`. Делается до запуска рекламы и подачи сайта в Вебмастер.
5. **Заявки.** Создать Telegram-бота (@BotFather), узнать chat_id, запустить приём заявок как сервис:
   `TG_TOKEN=… TG_CHAT=… node deploy/form-endpoint.mjs` (лучше через systemd), собрать сайт с `FORM_ENDPOINT=/lead`. Заявки придут в Telegram и в журнал `/var/log/proba-leads.jsonl`, посетитель увидит страницу «Заявка отправлена».
6. **Яндекс Метрика.** Создать счётчик, собрать сайт с `YM_ID=номер`. Счётчик загружается только после согласия посетителя на cookie (плашка внизу), цели — `form_project`, `form_review`, `form_reg`, `form_karta` и др. по типу формы.

   Полная сборка для прода: `SITE_URL=https://proba-lab.ru FORM_ENDPOINT=/lead YM_ID=12345678 PROD=1 node scripts/build.mjs`
7. Партнёр сверяет фразы из `REGULATORY_VERIFY.md`; страницы с пометкой «публиковать после ответа» — проверить.
8. Предметная съёмка (`marketing/predmetnaya-semka`) не собирается, пока в тексте стоит «НЕ ПУБЛИКОВАТЬ».
