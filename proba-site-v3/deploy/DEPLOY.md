# Выкладка на тестовый сервер

Сайт — статические файлы. Нужен любой сервер с nginx (Ubuntu/Debian).

## 1. Собрать

```bash
cd proba-site-v3
node scripts/build.mjs          # → dist/ (73 страницы), sitemap.xml, robots.txt, REGULATORY_VERIFY.md
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

1. Домен и HTTPS: `server_name proba-lab.ru;` и `sudo certbot --nginx`.
2. Убрать строку `X-Robots-Tag` из конфига.
3. Чистые адреса (`/dokumenty/otkaznoe-pismo/`): перевести ссылки в сборке на абсолютные от корня и включить 301 с `.html`. Делается до запуска рекламы и подачи сайта в Вебмастер.
4. Формы — сейчас прототип: проверка в браузере, без отправки. Подключить отправку (почта, Telegram или CRM).
5. Партнёр сверяет фразы из `REGULATORY_VERIFY.md`; страницы с пометкой «публиковать после ответа» — проверить.
6. Предметная съёмка (`marketing/predmetnaya-semka`) не собирается, пока в тексте стоит «НЕ ПУБЛИКОВАТЬ».
