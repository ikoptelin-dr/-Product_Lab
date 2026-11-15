#!/usr/bin/env bash
# Собирает MED-SERVER.zip в корне репозитория — пакет второго сайта (product-laboratory.ru) для сервера на Windows.
# Внутри одна папка med/: site/ (копия dist/), server.mjs + form-endpoint.mjs, файлы из deploy/windows/ (в т. ч. OBSHCHIJ-CADDY.txt), INSTRUKCIYA.txt.
# Запускать после боевой сборки: SITE_URL=https://product-laboratory.ru FORM_ENDPOINT=/lead PROD=1 node scripts/build.mjs
set -euo pipefail
cd "$(dirname "$0")/.."
grep -q 'name="proba-form-endpoint"' dist/index.html || { echo "dist — не боевая сборка (нет FORM_ENDPOINT=/lead)"; exit 1; }
grep -q 'rel="canonical" href="https://product-laboratory.ru/' dist/index.html || { echo "dist собран без SITE_URL=https://product-laboratory.ru"; exit 1; }
OUT="$(cd ../.. && pwd)/MED-SERVER.zip"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir "$TMP/med"
cp -r dist "$TMP/med/site"
cp deploy/server.mjs deploy/form-endpoint.mjs "$TMP/med/"
find deploy/windows -maxdepth 1 -type f ! -name '.gitattributes' -exec cp {} "$TMP/med/" \;
{ printf '\xef\xbb\xbf'; sed 's/$/\r/' ../INSTRUKCIYA-VTOROJ-SAJT.md; } > "$TMP/med/INSTRUKCIYA.txt"
find "$TMP/med" -name '.*' -print -delete
rm -f "$OUT"
(cd "$TMP" && zip -qrX "$OUT" med)
echo "✓ $(basename "$OUT"): $(du -h "$OUT" | cut -f1), файлов: $(unzip -Z1 "$OUT" | grep -vc '/$')"
