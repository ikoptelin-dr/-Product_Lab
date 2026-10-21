"""Генерирует оригинальную иллюстрацию hero (SVG) и тёмную версию эмблемы логотипа."""
import random, sys
from pathlib import Path
from PIL import Image
import numpy as np

root = Path(__file__).resolve().parent.parent
assets = root / "assets"

# --- Эмблема: светлая (исходная) и тёмная (для кремовой шапки) ---
src = Image.open(root.parent / "proba-site/public/brand/emblem.png").convert("RGBA")
a = np.asarray(src).astype(float)
alpha = a[..., 3]
lum = a[..., :3].max(axis=2) / 255.0
ink = np.zeros_like(a)
ink[..., 0], ink[..., 1], ink[..., 2] = 0x13, 0x20, 0x1F
ink[..., 3] = alpha * (0.35 + 0.65 * lum)
# золотая сердцевина остаётся золотой
gold = (a[..., 0] > a[..., 2] + 40) & (alpha > 30)
ink[gold, 0], ink[gold, 1], ink[gold, 2] = 0xB9, 0x76, 0x1C
Image.fromarray(ink.astype(np.uint8), "RGBA").save(assets / "emblem-ink.png")
src.save(assets / "emblem-light.png")

# --- Пейзаж ---
def ridge(y, amp, seed, waves=3, w=1600, h=900):
    rnd = random.Random(seed)
    pts = []
    n = waves * 2 + 1
    for i in range(n + 1):
        x = -80 + i * (w + 160) / n
        dy = (-1 if i % 2 else 1) * amp * (0.6 + 0.4 * rnd.random())
        pts.append((x, y + dy))
    d = f"M{pts[0][0]:.0f},{pts[0][1]:.0f} "
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        cx = (x0 + x1) / 2
        d += f"C{cx:.0f},{y0:.0f} {cx:.0f},{y1:.0f} {x1:.0f},{y1:.0f} "
    d += f"L{w+80},{h+20} L-80,{h+20} Z"
    return d

R = [  # y, amp, top, bottom, blur, seed, waves
    (560, 14, "#A9C7C1", "#8FB5AF", 3, 1, 4),
    (600, 22, "#86ADA8", "#6E9A96", 2, 2, 3),
    (655, 30, "#5F8E8C", "#467A79", 1, 3, 3),
    (725, 38, "#3B6E70", "#2A5A5E", .5, 4, 2),
    (805, 34, "#1F4E54", "#143E44", 0, 5, 2),
]

def landscape(id_, calm=False, flowers=True):
    rnd = random.Random(7)
    out = [f'<svg class="art" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false"><defs>']
    out.append(f'<linearGradient id="{id_}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8FB8B6"/><stop offset=".55" stop-color="#CFE0D9"/><stop offset=".68" stop-color="#F1E4C8"/></linearGradient>')
    out.append(f'<radialGradient id="{id_}glow"><stop offset="0" stop-color="rgb(242,196,120)" stop-opacity=".55"/><stop offset="1" stop-color="rgb(242,196,120)" stop-opacity="0"/></radialGradient>')
    out.append(f'<linearGradient id="{id_}haze" x1="0" y1="0" x2="0" y2="1"><stop offset=".5" stop-color="rgb(236,232,214)" stop-opacity="0"/><stop offset=".64" stop-color="rgb(236,232,214)" stop-opacity=".38"/><stop offset=".78" stop-color="rgb(236,232,214)" stop-opacity="0"/></linearGradient>')
    for i, (y, amp, t, b, bl, s, wv) in enumerate(R):
        out.append(f'<linearGradient id="{id_}r{i}" x1="0" y1="0" x2="0" y2="1"><stop offset="{y/900-.03:.3f}" stop-color="{t}"/><stop offset="1" stop-color="{b}"/></linearGradient>')
        if bl: out.append(f'<filter id="{id_}b{i}" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="{bl}"/></filter>')
    out.append(f'<filter id="{id_}cloud" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="18"/></filter>')
    out.append(f'<filter id="{id_}soft"><feGaussianBlur stdDeviation="1.4"/></filter>')
    out.append(f'<filter id="{id_}grain"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 .5  0 0 0 0 .35  0 0 0 0 .3  0 0 0 .55 0"/></filter>')
    out.append('</defs>')
    out.append(f'<rect width="1600" height="900" fill="url(#{id_}sky)"/>')
    out.append(f'<circle class="sun-glow" cx="1060" cy="548" r="230" fill="url(#{id_}glow)"/>')
    out.append(f'<circle cx="1060" cy="548" r="26" fill="#EDB458"/>')
    if not calm:
        out.append(f'<g class="clouds" filter="url(#{id_}cloud)" opacity=".85">' + "".join(
            f'<ellipse cx="{1180+rnd.random()*420:.0f}" cy="{430+rnd.random()*120:.0f}" rx="{90+rnd.random()*120:.0f}" ry="{40+rnd.random()*40:.0f}" fill="#F1E6D2" opacity="{.4+rnd.random()*.2:.2f}"/>' for _ in range(7)) + '</g>')
    for i, (y, amp, t, b, bl, s, wv) in enumerate(R):
        if calm and i < 2: continue
        f = f' filter="url(#{id_}b{i})"' if bl else ""
        out.append(f'<path d="{ridge(y, amp, s, wv)}" fill="url(#{id_}r{i})"{f}/>')
        if i == 2:
            out.append(f'<rect width="1600" height="900" fill="url(#{id_}haze)"/>')
        if i >= 2:
            out.append(f'<path d="{ridge(y, amp, s, wv)}" fill="#E8D6B0" opacity=".14" transform="translate(-18,-6)" clip-path="inset(0 0 {max(0,900-y-40)}px 0)"/>')
    if flowers and not calm:
        dots = []
        for (x0, x1) in ((0, 520), (1120, 1600)):
            for _ in range(320):
                x = x0 + rnd.random() * (x1 - x0)
                yy = 900 - (rnd.random() ** 1.6) * 170
                r = 1.4 + rnd.random() * 3.6
                c = rnd.choice(["#E0A54A", "#C98A1B", "#F3E7CF", "#E0A54A", "#7FB0AC"])
                dots.append(f'<circle cx="{x:.0f}" cy="{yy:.0f}" r="{r:.1f}" fill="{c}"/>')
        out.append(f'<rect x="0" y="860" width="1600" height="40" fill="#0E3439" opacity=".6"/>')
        out.append(f'<g filter="url(#{id_}soft)">' + "".join(dots) + '</g>')
    out.append(f'<rect width="1600" height="900" filter="url(#{id_}grain)" opacity=".09" style="mix-blend-mode:overlay"/>')
    out.append('</svg>')
    return "".join(out)

(assets / "hero.svg").write_text(landscape("h"))
(assets / "cta.svg").write_text(landscape("c", calm=True, flowers=False))
print("ok", (assets / "hero.svg").stat().st_size // 1024, "KB")
