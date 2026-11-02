#!/usr/bin/env bash
# Собирает PROBA-SERVER.zip в корне репозитория — пакет для сервера на Windows (см. INSTRUKCIYA-WINDOWS-SERVER.md).
# Внутри одна папка proba/: site/ (копия dist/), server.mjs + form-endpoint.mjs, файлы из deploy/windows/, INSTRUKCIYA.txt.
# Запускать после боевой сборки: SITE_URL=https://proba-lab.ru FORM_ENDPOINT=/lead PROD=1 node scripts/build.mjs
set -euo pipefail
cd "$(dirname "$0")/.."
grep -q 'name="proba-form-endpoint"' dist/index.html || { echo "dist — не боевая сборка (нет FORM_ENDPOINT=/lead)"; exit 1; }
grep -q 'rel="canonical" href="https://proba-lab.ru/' dist/index.html || { echo "dist собран без SITE_URL=https://proba-lab.ru"; exit 1; }
OUT="$(cd .. && pwd)/PROBA-SERVER.zip"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir "$TMP/proba"
cp -r dist "$TMP/proba/site"
cp deploy/server.mjs deploy/form-endpoint.mjs "$TMP/proba/"
find deploy/windows -maxdepth 1 -type f ! -name '.gitattributes' -exec cp {} "$TMP/proba/" \;
# Инструкция — для Блокнота Windows: UTF-8 с BOM и переводы строк CRLF
{ printf '\xef\xbb\xbf'; sed 's/$/\r/' ../INSTRUKCIYA-WINDOWS-SERVER.md; } > "$TMP/proba/INSTRUKCIYA.txt"
find "$TMP/proba" -name '.*' -print -delete
rm -f "$OUT"
(cd "$TMP" && zip -qrX "$OUT" proba)
echo "✓ $(basename "$OUT"): $(du -h "$OUT" | cut -f1), файлов: $(unzip -Z1 "$OUT" | grep -vc '/$')"
