#!/usr/bin/env python3
"""Клиент Wordstat (Yandex Cloud Search API v2) с кэшем и журналом. Ключ подставляет прокси среды — в коде и файлах его нет.
Жёсткий лимит MAX_CALLS тарифицируемых вызовов за проход."""
import hashlib, json, os, time, urllib.request, urllib.error, datetime
BASE = "https://searchapi.api.cloud.yandex.net/v2/wordstat/"
FOLDER = "b1gudh4ve4s2me3b34tc"
HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, "raw"); LOG = os.path.join(HERE, "api-log.jsonl")
MAX_CALLS = int(os.environ.get("MAX_CALLS", "100"))
def _count():
    if not os.path.exists(LOG): return 0
    return sum(1 for l in open(LOG) if json.loads(l).get("billable"))
def call(method, body):
    body = dict(body, folderId=FOLDER)
    key = hashlib.sha1((method + json.dumps(body, sort_keys=True, ensure_ascii=False)).encode()).hexdigest()[:16]
    path = os.path.join(RAW, f"{method}-{key}.json")
    if os.path.exists(path): return json.load(open(path))["response"]
    if _count() >= MAX_CALLS: raise RuntimeError(f"лимит {MAX_CALLS} вызовов достигнут")
    req = urllib.request.Request(BASE + method, data=json.dumps(body).encode(), headers={"Content-Type": "application/json"})
    t = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"); status = 0; resp = None; err = None
    try:
        with urllib.request.urlopen(req, timeout=90) as r: status = r.status; resp = json.load(r)
    except urllib.error.HTTPError as e: status = e.code; err = e.read().decode()[:500]
    except Exception as e: err = str(e)[:300]
    rec = {"at": t, "method": method, "body": {k: v for k, v in body.items() if k != "folderId"}, "status": status, "error": err, "billable": status == 200, "cache": os.path.basename(path)}
    with open(LOG, "a") as f: f.write(json.dumps(rec, ensure_ascii=False) + "\n")
    if resp is not None: json.dump({"request": rec["body"], "method": method, "at": t, "response": resp}, open(path, "w"), ensure_ascii=False, indent=1)
    time.sleep(1.1)
    if resp is None: return {"_error": f"{status} {err}"}
    return resp
def top(phrase, region=None, n=2000, devices=None):
    b = {"phrase": phrase, "numPhrases": n}
    if region: b["regions"] = [str(region)]
    if devices: b["devices"] = devices
    return call("topRequests", b)
def dyn(phrase, region, frm, to):
    return call("dynamics", {"phrase": phrase, "period": "PERIOD_MONTHLY", "fromDate": frm, "toDate": to, "regions": [str(region)]})
