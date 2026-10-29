# Попиксельное сравнение скриншотов до/после: доля отличающихся пикселей и рамка отличий. python3 -I compare.py <before> <after> <diffdir>
import sys, os
from PIL import Image, ImageChops
B, A, D = sys.argv[1:4]; os.makedirs(D, exist_ok=True)
for n in sorted(os.listdir(B)):
    if not n.endswith('.png') or not os.path.exists(os.path.join(A, n)): continue
    a, b = Image.open(os.path.join(B, n)).convert('RGB'), Image.open(os.path.join(A, n)).convert('RGB')
    if a.size != b.size:
        print(f"{n}\tРАЗМЕР {a.size} → {b.size}"); continue
    diff = ImageChops.difference(a, b); bbox = diff.getbbox()
    if not bbox: print(f"{n}\tидентично"); continue
    px = sum(1 for p in diff.getdata() if max(p) > 16)
    print(f"{n}\tотличий {px} px ({100*px/(a.size[0]*a.size[1]):.3f}%), рамка {bbox}")
    if px: Image.blend(a, b, .5).crop(bbox).save(os.path.join(D, n))
