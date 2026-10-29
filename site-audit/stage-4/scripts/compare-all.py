# Сравнение скриншотов исходной версии этапа 4 и итоговой: доля отличий, рамка, классификация по высоте/ширине.
# python3 -I compare-all.py <before> <after> <diff-dir> <out.csv>
import sys, os, csv
from PIL import Image, ImageChops
B, A, D, OUT = sys.argv[1:5]; os.makedirs(D, exist_ok=True)
rows = []
for n in sorted(os.listdir(B)):
    if not n.endswith('.png'): continue
    a, b = Image.open(os.path.join(B, n)).convert('RGB'), Image.open(os.path.join(A, n)).convert('RGB')
    page, mode = n[:-4].split('--')
    if a.size != b.size:
        rows.append([page, mode, 'размер', f'{a.size}→{b.size}', '', '']); continue
    diff = ImageChops.difference(a, b).convert('L').point(lambda v: 255 if v > 24 else 0)
    bbox = diff.getbbox()
    if not bbox: rows.append([page, mode, 'идентично', '', '', '']); continue
    px = sum(1 for v in diff.get_flattened_data() if v) if hasattr(diff, 'get_flattened_data') else sum(1 for v in diff.getdata() if v)
    rows.append([page, mode, 'отличается', f'{px}', f'{100*px/(a.size[0]*a.size[1]):.3f}%', str(bbox)])
    if px > 30: Image.blend(a, b, .5).crop((0, max(0, bbox[1]-20), a.size[0], min(a.size[1], bbox[3]+20))).save(os.path.join(D, n))
with open(OUT, 'w', newline='', encoding='utf-8') as f: csv.writer(f).writerows([['page', 'mode', 'result', 'px', 'share', 'bbox']] + rows)
from collections import Counter
print(Counter((r[1], r[2]) for r in rows))
