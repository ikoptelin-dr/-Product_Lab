#!/bin/bash
# Lighthouse 13.6.0, мобильный пресет по умолчанию, 3 последовательных прогона: до (8880) и после (8882) на представителях.
LH=/tmp/claude-0/-home-user/6b2e492d-6545-5324-a5ad-78acbdbfab62/scratchpad/lh/node_modules/lighthouse/cli/index.js
OUT=/home/user/-Product_Lab/site-audit/stage-4/evidence/lighthouse; mkdir -p $OUT/runs
export CHROME_PATH=/opt/pw-browsers/chromium
for run in 1 2 3; do for tag in before:8880 after:8882; do for p in index.html ceny.html; do
  t=${tag%%:*}; port=${tag##*:}; s=$(echo $p | tr '/.' '__')
  node $LH "http://127.0.0.1:$port/$p" --quiet --chrome-flags="--headless=new --no-sandbox" --output=json --output-path=$OUT/runs/${t}-${s}-run${run}.json >> $OUT/runs.log 2>&1
  echo "$(date -u +%T) $t run$run $p rc=$?" >> $OUT/runs.log
done; done; done
echo DONE >> $OUT/runs.log
