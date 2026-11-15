#!/usr/bin/env bash
# Собирает zip-пакет для сервера на Windows (см. INSTRUKCIYA-WINDOWS-SERVER.md).
# Внутри одна папка <имя>/: site/ (копия dist/), server.mjs + form-endpoint.mjs, файлы из deploy/windows/, INSTRUKCIYA.txt.
# Запускать после боевой сборки: SITE_URL=https://<домен> FORM_ENDPOINT=/lead PROD=1 node scripts/build.mjs
#
# По умолчанию — сайт proba-lab.ru: ../PROBA-SERVER.zip, папка proba/, порт 8080.
# Второй сайт на том же компьютере (переменные):
#   PKG_NAME=med            папка в архиве и на сервере (D:\med); от неё имена задач автозапуска («med - sajt»)
#   PKG_DOMAIN=example.ru   домен сайта (проверка canonical, nastrojki.txt, Caddyfile)
#   PKG_PORT=8081           свой порт на компьютере (у proba-lab.ru — 8080)
#   PKG_SHARED=1            работать через уже запущенный Caddy (сайт друга): в пакет кладётся OBSHCHIJ-CADDY.txt с блоком для его Caddyfile
#   PKG_DIST=dist           папка собранного сайта (относительно proba-site-v3)
#   PKG_INSTR=../INSTRUKCIYA-WINDOWS-SERVER.md   инструкция, которая ляжет в архив как INSTRUKCIYA.txt
#   PKG_OUT=../MED-SERVER.zip                    куда положить архив
set -euo pipefail
cd "$(dirname "$0")/.."
NAME="${PKG_NAME:-proba}"
DOMAIN="${PKG_DOMAIN:-proba-lab.ru}"
PORT="${PKG_PORT:-8080}"
DIST="${PKG_DIST:-dist}"
INSTR="${PKG_INSTR:-../INSTRUKCIYA-WINDOWS-SERVER.md}"
UPPER="$(echo "$NAME" | tr '[:lower:]' '[:upper:]')"
OUT="$(cd .. && pwd)/${UPPER}-SERVER.zip"
[ -n "${PKG_OUT:-}" ] && OUT="$(cd "$(dirname "$PKG_OUT")" && pwd)/$(basename "$PKG_OUT")"
[[ "$NAME" =~ ^[a-z0-9_-]+$ ]] || { echo "PKG_NAME: только латиница, цифры, - и _ (это имя папки на сервере)"; exit 1; }
[[ "$PORT" =~ ^[0-9]+$ ]] || { echo "PKG_PORT: число"; exit 1; }

grep -q 'name="proba-form-endpoint"' "$DIST/index.html" || { echo "$DIST — не боевая сборка (нет FORM_ENDPOINT=/lead)"; exit 1; }
grep -q "rel=\"canonical\" href=\"https://$DOMAIN/" "$DIST/index.html" || { echo "$DIST собран без SITE_URL=https://$DOMAIN"; exit 1; }
[ -f "$INSTR" ] || { echo "нет инструкции $INSTR"; exit 1; }

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
P="$TMP/$NAME"
mkdir "$P"
cp -r "$DIST" "$P/site"
cp deploy/server.mjs deploy/form-endpoint.mjs "$P/"
find deploy/windows -maxdepth 1 -type f ! -name '.gitattributes' -exec cp {} "$P/" \;
# Инструкция — для Блокнота Windows: UTF-8 с BOM и переводы строк CRLF
{ printf '\xef\xbb\xbf'; sed 's/$/\r/' "$INSTR"; } > "$P/INSTRUKCIYA.txt"

# Не proba-lab.ru или не 8080 — вписываем домен и порт в шаблон настроек и в свой Caddyfile
if [ "$DOMAIN" != "proba-lab.ru" ] || [ "$PORT" != "8080" ]; then
  sed -i "s/^SITE_DOMAIN=\r\$/SITE_DOMAIN=$DOMAIN\r/; s/^SITE_PORT=\r\$/SITE_PORT=$PORT\r/" "$P/nastrojki.txt"
  grep -q "^SITE_PORT=$PORT" "$P/nastrojki.txt" || { echo "не удалось вписать SITE_PORT в nastrojki.txt"; exit 1; }
  sed -i "s/www\.proba-lab\.ru/www.$DOMAIN/g; s/https:\/\/proba-lab\.ru/https:\/\/$DOMAIN/g; s/^proba-lab\.ru {/$DOMAIN {/; s/127\.0\.0\.1:8080/127.0.0.1:$PORT/g" "$P/Caddyfile"
fi
# Через Caddy друга: сразу режим «общий Caddy» и блок для его Caddyfile
if [ "${PKG_SHARED:-}" = "1" ]; then
  { printf '\xef\xbb\xbf'; sed 's/$/\r/' <<EOF
Режим «общий Caddy». Пока этот файл лежит в папке, свой Caddy этого сайта не запускается.
Порты 80 и 443 обслуживает другой Caddy на этом компьютере. В его Caddyfile нужно ДОБАВИТЬ в конец два блока ниже
(ничего у него не удаляя, после закрывающей } последнего блока) и перезапустить тот Caddy.

$DOMAIN {
	encode zstd gzip
	request_body {
		max_size 6MB
	}
	reverse_proxy 127.0.0.1:$PORT
}

www.$DOMAIN {
	redir https://$DOMAIN{uri} permanent
}

Вернуть свой Caddy: удалите этот файл и запустите 2-VKLYUCHIT-AVTOZAPUSK.bat (другой Caddy перед этим должен освободить порты 80 и 443).
EOF
  } > "$P/OBSHCHIJ-CADDY.txt"
fi

find "$P" -name '.*' -print -delete
rm -f "$OUT"
(cd "$TMP" && zip -qrX "$OUT" "$NAME")
echo "✓ $(basename "$OUT"): $(du -h "$OUT" | cut -f1), файлов: $(unzip -Z1 "$OUT" | grep -vc '/$') — папка $NAME/, домен $DOMAIN, порт $PORT${PKG_SHARED:+, общий Caddy}"
