// Шоурил «Proba Lab за 15 секунд» — моушн-дизайн кодом (SVG + CSS), без видеофайла: десятки КБ, чёткий на любом экране.
// 7 сцен по 15/7 с: состав → документы → этикетка → 3D → карточка → продажи → логотип. План: SITE-REDESIGN-PLAN.md, §5.
// Тайминги — в site.css (блок «Шоурил»): у каждой сцены --s (номер), у элемента — --t (сдвиг внутри сцены).
// Играет, когда виден на экране; есть пауза. При prefers-reduced-motion — статичный финальный кадр.

const SCENES = ["Поиск", "Запись", "Визит", "Дом", "Возврат", "Цифры", "Proba-Product"];

const head = (s: number, title: string, sub: string) => `
    <text x="80" y="150" class="rl-num rl-in">${String(s + 1).padStart(2, "0")} / 07</text>
    <text x="80" y="250" class="rl-title rl-in" style="--t:.12s">${title}</text>
    <text x="80" y="292" class="rl-sub rl-in" style="--t:.3s">${sub}</text>`;

const scene = (s: number, body: string) => `<g class="rl-sc rl-sc${s + 1}" style="--s:${s}">${body}</g>`;

const phone = `<rect x="622" y="64" width="156" height="318" rx="26" class="rl-phone rl-up"/>
    <rect x="684" y="76" width="32" height="6" rx="3" class="rl-notch"/>`;

/** 1. Поиск: пациент выбирает клинику в выдаче и на картах. */
function search() {
  const results = [0, 1, 2].map((i) => `<g class="rl-slide" style="--t:${(0.3 + i * 0.15).toFixed(2)}s"><rect x="636" y="${134 + i * 62}" width="128" height="52" rx="10" class="rl-float"/><rect x="646" y="${146 + i * 62}" width="${[70, 84, 62][i]}" height="8" rx="4" class="rl-line"/><rect x="646" y="${162 + i * 62}" width="${[44, 52, 40][i]}" height="6" rx="3" class="rl-line"/></g>`).join("");
  return `${phone}
    <rect x="636" y="96" width="128" height="26" rx="13" class="rl-chip rl-slide" style="--t:.15s"/>
    ${results}
    <rect x="632" y="192" width="136" height="60" rx="12" class="rl-ring rl-draw" pathLength="1" style="--t:.9s"/>
    <rect x="636" y="330" width="128" height="34" rx="17" class="rl-buy rl-pop" style="--t:1.1s"/>`;
}

/** 2. Запись: календарь, выбранный день. */
function booking() {
  const cells = Array.from({ length: 20 }, (_, k) => { const i = k % 5, j = Math.floor(k / 5); return k === 7 ? "" : `<rect x="${612 + i * 36}" y="${176 + j * 44}" width="28" height="28" rx="8" class="rl-chip rl-slide" style="--t:${(0.2 + k * 0.025).toFixed(2)}s"/>`; }).join("");
  return `<rect x="592" y="112" width="216" height="256" rx="14" class="rl-sheet rl-up" style="--t:.05s"/>
    <rect x="612" y="134" width="84" height="12" rx="6" class="rl-line-acc rl-sx" style="--t:.18s"/>
    ${cells}
    <rect x="684" y="220" width="28" height="28" rx="8" class="rl-buy rl-pop" style="--t:.9s"/>`;
}

/** 3. Визит: зуб и отметка «приём состоялся». */
function visit() {
  return `<path d="M690 168c-26-22-74-14-74 34 0 42 15 58 21 100 4 27 11 50 25 50 15 0 13-42 28-42s13 42 28 42c14 0 21-23 25-50 6-42 21-58 21-100 0-48-48-56-74-34z" class="rl-ring rl-draw" pathLength="1" style="--t:.2s"/>
    <path d="M652 214c4-14 14-20 26-20" class="rl-guide rl-draw" pathLength="1" style="--t:.7s"/>
    <g class="rl-stamp" style="--t:.95s"><circle cx="776" cy="338" r="44"/><circle cx="776" cy="338" r="35" class="rl-stamp-in"/><path d="m758 338 12 12 22-26"/></g>`;
}

/** 4. Дом: QR после приёма, материалы врача в телефоне. */
function home() {
  const dots = [[676, 122], [700, 122], [724, 150], [700, 150], [724, 174], [676, 174]].map(([x, y]) => `<rect x="${x}" y="${y}" width="10" height="10" rx="2" class="rl-ink2"/>`).join("");
  return `${phone}
    <g class="rl-slide" style="--t:.2s"><rect x="652" y="98" width="96" height="96" rx="12" fill="url(#rlGrad)"/>
      <rect x="662" y="108" width="22" height="22" rx="4" class="rl-ink"/><rect x="716" y="108" width="22" height="22" rx="4" class="rl-ink"/><rect x="662" y="162" width="22" height="22" rx="4" class="rl-ink"/>${dots}</g>
    <rect x="636" y="210" width="118" height="10" rx="5" class="rl-line rl-slide" style="--t:.45s"/>
    <rect x="636" y="230" width="92" height="10" rx="5" class="rl-line rl-slide" style="--t:.55s"/>
    <g class="rl-slide" style="--t:.65s"><rect x="636" y="256" width="60" height="22" rx="11" class="rl-chip"/><rect x="702" y="256" width="60" height="22" rx="11" class="rl-chip"/></g>
    <rect x="636" y="330" width="128" height="34" rx="17" class="rl-buy rl-pop" style="--t:.9s"/>
    <rect x="806" y="110" width="74" height="56" rx="10" class="rl-float rl-slide" style="--t:.75s"/>
    <rect x="806" y="178" width="74" height="56" rx="10" class="rl-float rl-slide" style="--t:.85s"/>`;
}

/** 5. Возврат: петля возвращения и напоминание о контроле. */
function comeback() {
  return `<path d="M700 138a108 108 0 1 1-93 53" class="rl-trend rl-draw" pathLength="1" style="--t:.15s"/>
    <path d="M596 158l10 36 34-14" class="rl-trend rl-draw" pathLength="1" style="--t:.95s"/>
    <rect x="652" y="200" width="96" height="96" rx="14" class="rl-sheet rl-pop" style="--t:.5s"/>
    <rect x="668" y="216" width="46" height="9" rx="4.5" class="rl-line-acc rl-sx" style="--t:.7s"/>
    <rect x="668" y="238" width="64" height="7" rx="3.5" class="rl-ink2 rl-sx" style="--t:.8s"/>
    <rect x="668" y="254" width="50" height="7" rx="3.5" class="rl-ink2 rl-sx" style="--t:.9s"/>
    <circle cx="700" cy="138" r="7" class="rl-tip rl-pop" style="--t:1.1s"/>`;
}

function sales() {
  const hs = [42, 70, 96, 132, 176];
  const bars = hs.map((h, i) => `<rect x="${612 + i * 52}" y="${360 - h}" width="32" height="${h}" rx="6" class="rl-bar rl-sy" style="--t:${(0.1 + i * 0.1).toFixed(2)}s"/>`).join("");
  const line = `M628 ${360 - 42 - 24} ${hs.map((h, i) => `L${628 + i * 52} ${360 - h - 24}`).join(" ")}`;
  return `<path d="M596 362 H860" class="rl-axis"/>${bars}
    <path d="${line}" class="rl-trend rl-draw" pathLength="1" style="--t:.6s"/>
    <circle cx="836" cy="${360 - 176 - 24}" r="7" class="rl-tip rl-pop" style="--t:1.05s"/>
    <circle cx="836" cy="${360 - 176 - 24}" r="7" class="rl-tip-ring"/>`;
}

function logo() {
  return `<circle cx="480" cy="226" r="70" class="rl-burst"/><circle cx="480" cy="226" r="70" class="rl-burst" style="--t:.25s"/>
    <text x="480" y="250" text-anchor="middle" class="rl-logo rl-in" style="--t:.1s">Proba-Product</text>
    <text x="480" y="300" text-anchor="middle" class="rl-tag rl-in" style="--t:.35s">маркетинг, который не заканчивается на визите</text>`;
}

export function showreel() {
  const x = (i: number) => 80 + i * (800 / 6);
  const labels = SCENES.map((s, i) => `<text x="${x(i)}" y="512" text-anchor="${i === 0 ? "start" : i === 6 ? "end" : "middle"}" class="rl-lab" style="--s:${i}">${s}</text>`).join("");
  const svg = `<svg class="reel-svg" viewBox="0 0 960 540" role="img" aria-labelledby="reel-t">
  <title id="reel-t">Путь пациента за 15 секунд: поиск, запись, визит, дом, возврат, цифры</title>
  <defs>
    <linearGradient id="rlGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F59ACC"/><stop offset="1" stop-color="#FFD0E9"/></linearGradient>
    <linearGradient id="rlGrad2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F59ACC"/><stop offset="1" stop-color="#A9C1FF"/></linearGradient>
    <linearGradient id="rlShade" x1="0" x2="1"><stop offset="0" stop-color="#09318D" stop-opacity=".55"/><stop offset="1" stop-color="#09318D" stop-opacity="0"/></linearGradient>
    <linearGradient id="rlShadeR" x1="1" x2="0"><stop offset="0" stop-color="#09318D" stop-opacity=".55"/><stop offset="1" stop-color="#09318D" stop-opacity="0"/></linearGradient>
    <radialGradient id="rlGlow" cx=".72" cy=".42" r=".5"><stop offset="0" stop-color="#F59ACC" stop-opacity=".22"/><stop offset="1" stop-color="#F59ACC" stop-opacity="0"/></radialGradient>
    <pattern id="rlGrid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="rgba(255,255,255,.05)"/></pattern>
    <clipPath id="rlJarClip"><rect x="618" y="138" width="164" height="232" rx="28"/></clipPath>
  </defs>
  <rect width="960" height="540" class="rl-bg"/><rect width="960" height="540" fill="url(#rlGrid)"/><rect width="960" height="540" fill="url(#rlGlow)" class="rl-glow"/>
  ${scene(0, head(0, "Поиск", "пациент выбирает клинику") + search())}
  ${scene(1, head(1, "Запись", "без лишних шагов") + booking())}
  ${scene(2, head(2, "Визит", "приём состоялся") + visit())}
  ${scene(3, head(3, "Дом", "QR и материалы врача") + home())}
  ${scene(4, head(4, "Возврат", "напоминание о контроле") + comeback())}
  ${scene(5, head(5, "Цифры", "возвращаемость по когортам") + sales())}
  ${scene(6, logo())}
  <path d="M80 478 H880" class="rl-track"/><path d="M80 478 H880" class="rl-prog" pathLength="1"/>
  ${labels}
</svg>`;
  return `<figure class="reel" data-reel>
  ${svg}
  <button type="button" class="reel-toggle" data-reel-toggle aria-pressed="false"><span class="reel-ico" aria-hidden="true"></span><span data-reel-label>Пауза</span></button>
</figure>`;
}

/** Полоса шоурила для главной и страниц 3D/моушна. */
export function reelSection(o: { title: string; lead: string }) {
  return `<section class="reel-band grain" aria-labelledby="reel-title">
  <div class="ambient" aria-hidden="true"><i class="a1"></i><i class="a2"></i><i class="a3"></i></div>
  <div class="container reel-grid">
    <div class="reel-copy">
      <p class="eyebrow">Моушн-дизайн</p>
      <h2 id="reel-title" class="h2">${o.title}</h2>
      <p class="hero-lead">${o.lead}</p>
    </div>
    ${showreel()}
  </div>
</section>`;
}
