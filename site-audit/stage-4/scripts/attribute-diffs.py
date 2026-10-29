# Доля отличающихся пикселей, попавших в прямоугольники намеренно изменённых элементов (с запасом 6 px).
import sys, json, os, csv
from PIL import Image, ImageChops
B, A, RECTS, CSV, OUT = sys.argv[1:6]
rects = json.load(open(RECTS))
rows = [r for r in csv.reader(open(CSV)) if r and r[2] == 'отличается']
res = []
for page, mode, *_ in rows:
    n = f'{page}--{mode}.png'
    a, b = Image.open(os.path.join(B, n)).convert('L'), Image.open(os.path.join(A, n)).convert('L')
    d = ImageChops.difference(a, b).point(lambda v: 255 if v > 24 else 0)
    W, H = d.size; px = d.load(); rs = rects.get(f'{page}--{mode}', [])
    tot = inside = 0; kinds = {}
    for y in range(0, H):
        for x in range(0, W):
            if px[x, y]:
                tot += 1
                for r in rs:
                    if r['x'] - 6 <= x <= r['x'] + r['w'] + 6 and r['y'] - 6 <= y <= r['y'] + r['h'] + 6:
                        inside += 1; kinds[r['kind']] = kinds.get(r['kind'], 0) + 1; break
    res.append([page, mode, tot, inside, f'{100*inside/max(tot,1):.1f}%', '; '.join(f'{k}: {v}' for k, v in sorted(kinds.items(), key=lambda x: -x[1]))])
with open(OUT, 'w', newline='', encoding='utf-8') as f: csv.writer(f).writerows([['page', 'mode', 'diff_px', 'in_changed_elements', 'share', 'by_kind']] + res)
low = [r for r in res if r[2] and r[3] / r[2] < 0.98]
print(f'отличающихся скриншотов {len(res)}; где < 98% отличий внутри изменённых элементов: {len(low)}')
for r in low: print('  ', r)
