#!/usr/bin/env python3
"""Частоты Вордстата через Yandex Cloud Search API.
Ключ подставляет прокси среды (сетевой секрет); в коде его нет.
Запуск: python3 wordstat.py masks.txt out.csv [регион_id ...]   (225 — Россия, 11316 — Новосибирская обл., 2 — Санкт-Петербург)
"""
import csv, json, os, sys, time, urllib.request

FOLDER = os.environ.get("YC_FOLDER_ID", "b1gudh4ve4s2me3b34tc")
URL = "https://searchapi.api.cloud.yandex.net/v2/wordstat/topRequests"

def top(phrase, region=None, n=50):
    body = {"phrase": phrase, "numPhrases": n, "folderId": FOLDER}
    if region: body["regions"] = [str(region)]
    req = urllib.request.Request(URL, data=json.dumps(body).encode(), headers={"Content-Type": "application/json"})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=60) as r: return json.load(r)
        except urllib.error.HTTPError as e:
            msg = e.read().decode()[:300]
            if e.code == 429: time.sleep(60); continue
            return {"error": f"{e.code} {msg}"}
        except Exception as e:
            time.sleep(5); err = str(e)
    return {"error": err}

if __name__ == "__main__":
    masks = [l.strip() for l in open(sys.argv[1]) if l.strip() and not l.startswith("#")]
    regions = sys.argv[3:] or [""]
    raw = {}
    with open(sys.argv[2], "w", newline="") as f:
        w = csv.writer(f); w.writerow(["group", "mask", "region", "total", "top_phrases"])
        for line in masks:
            group, mask = line.split("|", 1)
            for reg in regions:
                d = top(mask, reg or None)
                raw[f"{mask}|{reg}"] = d
                tops = "; ".join(f"{x['phrase']} ({x['count']})" for x in d.get("results", [])[:8])
                w.writerow([group, mask, reg or "all", d.get("totalCount", d.get("error", "")), tops]); f.flush()
                print(group, mask, reg, d.get("totalCount", d.get("error")), flush=True)
                time.sleep(1.2)
    json.dump(raw, open(sys.argv[2].replace(".csv", ".json"), "w"), ensure_ascii=False)
