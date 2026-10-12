"""Готовит изображения для документа: логотип N* с фирменной зелёной звёздочкой и фото кампуса в JPG.

Запуск: python3 build/prepare_images.py  (из папки школы или откуда угодно)
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"
OUT = Path(__file__).resolve().parent / "img"
OUT.mkdir(exist_ok=True)

GREEN = (0x5B, 0xB0, 0x31)

# 1. Логотип: голубая звёздочка в исходнике -> фирменный зелёный, как на nsu.ru
logo = Image.open(ASSETS / "3.png").convert("RGB")
px = logo.load()
w, h = logo.size
for y in range(h):
    for x in range(w):
        r, g, b = px[x, y]
        if b - r > 25:  # пиксели звёздочки (с антиалиасингом)
            t = min(1.0, (b - r) / (226 - 41))
            px[x, y] = tuple(int(255 * (1 - t) + c * t) for c in GREEN)
gray = logo.convert("L").point(lambda v: 255 if v < 235 else 0)
l, t_, r_, b_ = gray.getbbox()
logo = logo.crop((max(0, l - 2), max(0, t_ - 2), min(w, r_ + 2), min(h, b_ + 2)))
big = logo.resize((logo.size[0] * 4, logo.size[1] * 4), Image.LANCZOS)
print("logo", big.size)
big.save(OUT / "logo_n.png")

# 2. Фото кампуса для обложки
photo = Image.open(ASSETS / "4.webp").convert("RGB")
pw, ph = photo.size
target_ratio = 210 / 112  # ширина A4 к высоте фото-блока
new_h = int(pw / target_ratio)
top = max(0, (ph - new_h) // 2 + 10)
photo = photo.crop((0, top, pw, min(ph, top + new_h)))
photo = photo.resize((1838, int(1838 * photo.size[1] / photo.size[0])), Image.LANCZOS)
photo.save(OUT / "campus.jpg", quality=90)
print("ok", photo.size)
