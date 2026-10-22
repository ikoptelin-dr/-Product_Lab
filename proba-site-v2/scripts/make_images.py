"""Готовит иллюстрации (сгенерированы в Ideogram) для сайта: кадрирование по фокусу и WebP в двух размерах.
Исходники — в assets/src/, результат — в assets/img/<имя>-<ширина>.webp."""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parent.parent
src, out = root / "assets/src", root / "assets/img"
out.mkdir(parents=True, exist_ok=True)

# имя: (исходник, пропорция ш/в, фокус x, фокус y, ширины)
JOBS = {
    "review-compare": ("compare-three-products.webp", 4 / 3, 0.5, 0.42, [640, 1100]),
    "team-sources": ("reports-analysis.webp", 3 / 2, 0.55, 0.5, [640, 1100]),
    "task-promo": ("product-studio.webp", 16 / 10, 0.62, 0.55, [480, 800]),
    "task-partners": ("partner-discussion.webp", 16 / 10, 0.6, 0.62, [480, 800]),
    "task-automation": ("integration-modules.webp", 16 / 10, 0.52, 0.62, [480, 800]),
    "auto-integrations": ("integration-modules.webp", 21 / 9, 0.5, 0.6, [800, 1400]),
    "auto-documents": ("reports-analysis.webp", 16 / 10, 0.55, 0.5, [480, 800]),
}

def crop(im, ratio, fx, fy):
    w, h = im.size
    if w / h > ratio:
        nw, nh = round(h * ratio), h
    else:
        nw, nh = w, round(w / ratio)
    x = min(max(round(fx * w - nw / 2), 0), w - nw)
    y = min(max(round(fy * h - nh / 2), 0), h - nh)
    return im.crop((x, y, x + nw, y + nh))

for name, (file, ratio, fx, fy, widths) in JOBS.items():
    im = crop(Image.open(src / file).convert("RGB"), ratio, fx, fy)
    for wd in widths:
        r = im.resize((wd, round(wd / ratio)), Image.LANCZOS) if im.width > wd else im
        r.save(out / f"{name}-{wd}.webp", "WEBP", quality=80, method=6)
    print(name, im.size, [f"{(out / f'{name}-{wd}.webp').stat().st_size // 1024} КБ" for wd in widths])
