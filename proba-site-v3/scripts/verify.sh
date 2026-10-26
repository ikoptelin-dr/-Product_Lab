#!/bin/bash
# Поднимает http.server на dist/, запускает scripts/verify.mjs и гасит сервер по PID (не pkill).
# Использование: scripts/verify.sh [папка-для-скриншотов] [порт]
ROOT=$(cd "$(dirname "$0")/.." && pwd)
SHOTS=${1:-$ROOT/shots}; PORT=${2:-8931}
mkdir -p "$SHOTS"
if (echo > /dev/tcp/127.0.0.1/$PORT) 2>/dev/null; then echo "Порт $PORT занят"; exit 2; fi
python3 -m http.server "$PORT" --bind 127.0.0.1 --directory "$ROOT/dist" > /dev/null 2>&1 &
SRV=$!
for i in $(seq 1 50); do (echo > /dev/tcp/127.0.0.1/$PORT) 2>/dev/null && break; sleep 0.1; done
node "$ROOT/scripts/verify.mjs" "http://127.0.0.1:$PORT" "$ROOT/dist" "$SHOTS"; RC=$?
kill $SRV; wait $SRV 2>/dev/null
exit $RC
