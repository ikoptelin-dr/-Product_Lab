"""Добавляет к wordstat-clustered.csv точные частоты (Россия, Новосибирская обл., Новосибирск, Сибирь)
из выгрузки по регионам. Склейка — по исходной фразе (точный запрос без «!» = фраза из выгрузки).
Частоты не суммируются; приоритет кластера = точная частота head-фразы, если она снята.
Запуск: python3 -I enrich.py
"""
import csv
from collections import defaultdict

num = lambda s: float(str(s).replace("\xa0", "").replace(" ", "").replace(",", ".") or 0)
reg = defaultdict(dict)
for x in csv.DictReader(open("wordstat-regions-exact.csv", encoding="utf-8-sig")):
    reg[x["keyword"].replace("!", "").strip()][x["region"]] = (int(num(x["frequency"])), num(x["affinity_index"]))

rows = list(csv.DictReader(open("wordstat-clustered.csv", encoding="utf-8")))
for r in rows:
    v = reg.get(r["keyword"])
    get = lambda name, i=0: (v.get(name, (0, 0))[i] if v else "")
    r["exact_russia"] = get("Россия")
    r["exact_nso"] = get("Новосибирская область")
    r["nso_affinity"] = round(get("Новосибирская область", 1)) if v else ""
    r["exact_novosibirsk"] = get("Новосибирск")
    r["exact_siberia"] = get("Сибирь")
    r["siberia_affinity"] = round(get("Сибирь", 1)) if v else ""
    ratio = (int(r["frequency"]) / r["exact_russia"]) if v and r["exact_russia"] else None
    r["base_to_exact"] = round(ratio, 1) if ratio else ""
    r["misleading_base"] = "да (база > точной в 5+ раз)" if ratio and ratio > 5 else ""
    # приоритет: точная частота, если снята; иначе базовая с пометкой
    r["demand_for_priority"] = r["exact_russia"] if v else r["frequency"]
    r["demand_source"] = "точная" if v else "базовая (завышена, уточнить)"
fields = list(rows[0].keys())
with open("wordstat-clustered.csv", "w", newline="", encoding="utf-8") as fh:
    w = csv.DictWriter(fh, fieldnames=fields); w.writeheader(); w.writerows(rows)

# Кластеры: спрос = максимум точной частоты среди фраз кластера (не сумма); если точных нет — база
cl = defaultdict(list)
for r in rows:
    if r["relevance"] == "Целевой" and not r["note"]: cl[r["cluster"]].append(r)
out = []
for c, v in cl.items():
    ex = [r for r in v if r["demand_source"] == "точная"]
    src = ex if ex else v
    h = max(src, key=lambda r: int(r["demand_for_priority"]))
    out.append(dict(cluster=c, topic=v[0]["topic"], intent=v[0]["intent"], phrases=len(v),
                    head_keyword=h["keyword"], demand=int(h["demand_for_priority"]),
                    demand_source="точная" if ex else "базовая",
                    nso=h["exact_nso"], nso_affinity=h["nso_affinity"], page=v[0]["page"],
                    top_phrases="; ".join(f"{r['keyword']} ({r['frequency']})" for r in sorted(v, key=lambda r: -int(r["frequency"]))[:8])))
out.sort(key=lambda x: (x["demand_source"] != "точная", -x["demand"]))
with open("clusters-summary.csv", "w", newline="", encoding="utf-8") as fh:
    w = csv.DictWriter(fh, fieldnames=list(out[0].keys())); w.writeheader(); w.writerows(out)
print("phrases with exact:", sum(1 for r in rows if r["demand_source"] == "точная"))
print("misleading:", [(r["keyword"], r["frequency"], r["exact_russia"]) for r in rows if r["misleading_base"]])
print("clusters:", len(out), "with exact:", sum(1 for x in out if x["demand_source"] == "точная"))
for x in out[:40]: print(x["demand"], x["demand_source"], "|", x["cluster"], "|", x["head_keyword"], "| NSO", x["nso"], x["nso_affinity"])
