#!/bin/bash
# 3 последовательных мобильных прогона Lighthouse 13.6.0 (пресет по умолчанию: мобильная эмуляция, simulated throttling) на 8 страниц.
LH=/tmp/claude-0/-home-user/6b2e492d-6545-5324-a5ad-78acbdbfab62/scratchpad/lh/node_modules/lighthouse/cli/index.js
OUT=/home/user/-Product_Lab/site-audit/stage-2/evidence/lighthouse
BASE=http://127.0.0.1:8850/
export CHROME_PATH=/opt/pw-browsers/chromium
PAGES="index.html dokumenty/registraciya-bad.html marketing/3d-vizualizaciya-upakovki.html kejsy/magnij-do-registracii.html kontakty.html blog/jobs-to-be-done.html blog/sgr-ili-deklaraciya.html dokumenty/kosmetika.html"
mkdir -p $OUT/runs
for run in 1 2 3; do
  for p in $PAGES; do
    s=$(echo $p | tr '/.' '__')
    node $LH "$BASE$p" --quiet --chrome-flags="--headless=new --no-sandbox" --output=json --output=html --output-path=$OUT/runs/${s}-run${run} >> $OUT/runs.log 2>&1
    echo "$(date -u +%T) run$run $p rc=$?" >> $OUT/runs.log
  done
done
echo DONE >> $OUT/runs.log
