"""Шаг 2 фильма: собирает страницу фильма из capture/ и src/film.js.
  dist/proba-film.html — самодостаточный предпросмотр: тайлы WebP, куски WebP с альфой, всё в data URI;
  out/render.html      — то же для рендера MP4, но тайлы JPEG q95 и куски PNG (размер не важен).
Запуск: python3 src/build.py
"""
import base64, io, json, re, sys
from pathlib import Path
from PIL import Image
import numpy as np

root = Path(__file__).resolve().parent.parent
cap = root / "capture"
layout = json.loads((cap / "layout.json").read_text())
FLOOR = (245, 247, 248)

def uri(img: Image.Image, fmt: str, **kw) -> str:
    buf = io.BytesIO()
    img.save(buf, fmt, **kw)
    mime = {"WEBP": "image/webp", "JPEG": "image/jpeg", "PNG": "image/png"}[fmt]
    return f"data:{mime};base64," + base64.b64encode(buf.getvalue()).decode()

def clean_piece(path: Path) -> Image.Image:
    """Остаток альфы скриншота (<8) обнуляем, а цвет прозрачных пикселей заливаем цветом пола —
    чтобы при сжатии и мип-мапах края не темнели."""
    a = np.asarray(Image.open(path).convert("RGBA")).copy()
    alpha = a[..., 3]
    alpha[alpha < 8] = 0
    a[alpha == 0, :3] = FLOOR
    return Image.fromarray(a, "RGBA")

def build(kind: str):
    tiles, pieces = [], []
    for t in layout["tiles"]:
        im = Image.open(cap / t["file"]).convert("RGB")
        tiles.append(uri(im, "WEBP", quality=82, method=6) if kind == "preview" else uri(im, "JPEG", quality=95, subsampling=0))
    for p in layout["pieces"]:
        im = clean_piece(cap / p["file"])
        pieces.append(uri(im, "WEBP", quality=88, method=6, alpha_quality=100) if kind == "preview" else uri(im, "PNG"))
    emblem = uri(Image.open(root.parent / "proba-site-v2/assets/emblem-ink.png").convert("RGBA"), "PNG")
    assets = {"layout": layout, "tiles": tiles, "pieces": pieces, "emblem": emblem}
    js = (root / "src/film.js").read_text()
    js = re.sub(r"^export ", "", js, flags=re.M).replace("</script", "<\\/script")
    html = (root / "src/film.html").read_text().replace("{{ASSETS}}", json.dumps(assets).replace("</", "<\\/")).replace("{{FILM_JS}}", js)
    out = root / ("dist/proba-film.html" if kind == "preview" else "out/render.html")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html)
    print(f"{out.relative_to(root)} — {out.stat().st_size / 1e6:.1f} MB")

for k in (sys.argv[1:] or ["preview", "render"]):
    build(k)
