// Шоурил «Proba Lab за 15 секунд» — моушн-дизайн кодом (SVG + CSS), без видеофайла: десятки КБ, чёткий на любом экране.
// 7 сцен по 15/7 с: состав → документы → этикетка → 3D → карточка → продажи → логотип. План: SITE-REDESIGN-PLAN.md, §5.
// Тайминги — в site.css (блок «Шоурил»): у каждой сцены --s (номер), у элемента — --t (сдвиг внутри сцены).
// Играет, когда виден на экране; есть пауза. При prefers-reduced-motion — статичный финальный кадр.

const SCENES = ["Состав", "Документы", "Этикетка", "3D", "Карточка", "Продажи", "Proba Lab"];

const head = (s: number, title: string, sub: string) => `
    <text x="80" y="150" class="rl-num rl-in">${String(s + 1).padStart(2, "0")} / 07</text>
    <text x="80" y="250" class="rl-title rl-in" style="--t:.12s">${title}</text>
    <text x="80" y="292" class="rl-sub rl-in" style="--t:.3s">${sub}</text>`;

const scene = (s: number, body: string) => `<g class="rl-sc rl-sc${s + 1}" style="--s:${s}">${body}</g>`;

function hexagon() {
  const cx = 700, cy = 250, r = 92;
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    return [Math.round(cx + r * Math.cos(a)), Math.round(cy + r * Math.sin(a))] as const;
  });
  const d = `M${pts.map((p) => p.join(" ")).join(" L")} Z`;
  const from = [[-260, -140], [220, -160], [260, 40], [180, 200], [-200, 180], [-280, 20]];
  const atoms = pts
    .map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 2 ? 11 : 15}" class="rl-atom rl-fly" style="--x:${from[i]![0]}px;--y:${from[i]![1]}px;--t:${(i * 0.06).toFixed(2)}s"/>`)
    .join("");
  const bonds = [[pts[0]!, [cx, 120]], [pts[2]!, [828, 330]], [pts[4]!, [572, 330]]]
    .map(([[x1, y1], [x2, y2]]) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="rl-bond rl-draw" pathLength="1" style="--t:.5s"/>`)
    .join("");
  const ends = [[cx, 120], [828, 330], [572, 330]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="8" class="rl-atom2 rl-fly" style="--x:${(i - 1) * 140}px;--y:-120px;--t:.55s"/>`).join("");
  return `<path d="${d}" class="rl-ring rl-draw" pathLength="1" style="--t:.35s"/>${bonds}${atoms}${ends}
    <circle cx="${cx}" cy="${cy}" r="30" class="rl-core rl-pop" style="--t:.7s"/>`;
}

function doc() {
  const lines = [130, 96, 118, 84, 108].map((w, i) => `<rect x="636" y="${168 + i * 30}" width="${w}" height="8" rx="4" class="rl-line rl-sx" style="--t:${(0.25 + i * 0.09).toFixed(2)}s"/>`).join("");
  return `<rect x="608" y="112" width="190" height="256" rx="14" class="rl-sheet rl-up" style="--t:.05s"/>
    <rect x="636" y="134" width="70" height="12" rx="6" class="rl-line-acc rl-sx" style="--t:.18s"/>
    ${lines}
    <g class="rl-stamp" style="--t:.85s"><circle cx="776" cy="338" r="44"/><circle cx="776" cy="338" r="35" class="rl-stamp-in"/><path d="m758 338 12 12 22-26"/></g>`;
}

const jar = (label: string) => `<rect x="640" y="104" width="120" height="36" rx="9" class="rl-lid"/>
    <rect x="618" y="138" width="164" height="232" rx="28" class="rl-jar"/>${label}`;

function labelScene() {
  const label = `<g clip-path="url(#rlJarClip)"><g class="rl-label rl-sx" style="--t:.35s">
      <rect x="618" y="190" width="164" height="128" fill="url(#rlGrad)"/>
      <rect x="640" y="214" width="78" height="12" rx="6" class="rl-ink"/>
      <rect x="640" y="236" width="118" height="7" rx="3.5" class="rl-ink2"/>
      <rect x="640" y="252" width="96" height="7" rx="3.5" class="rl-ink2"/>
      <rect x="640" y="284" width="44" height="18" rx="9" class="rl-ink"/>
    </g></g>`;
  return `<g class="rl-up" style="--t:0s">${jar(label)}</g>
    <path d="M800 190 h44 M800 318 h44" class="rl-guide rl-draw" pathLength="1" style="--t:.9s"/>
    <text x="804" y="259" class="rl-note rl-in" style="--t:1s">по требованиям</text>`;
}

function threeD() {
  const label = `<g clip-path="url(#rlJarClip)">
      <g class="rl-spin-label"><rect x="458" y="190" width="164" height="128" fill="url(#rlGrad)"/><rect x="618" y="190" width="164" height="128" fill="url(#rlGrad2)"/><rect x="778" y="190" width="164" height="128" fill="url(#rlGrad)"/></g>
      <rect x="560" y="120" width="56" height="280" class="rl-glare"/>
      <rect x="618" y="138" width="40" height="232" fill="url(#rlShade)"/><rect x="742" y="138" width="40" height="232" fill="url(#rlShadeR)"/>
    </g>`;
  return `<ellipse cx="700" cy="378" rx="120" ry="16" class="rl-shadow"/>
    <g class="rl-orbit" style="--r:0deg"><ellipse cx="700" cy="250" rx="200" ry="52"/></g>
    <g class="rl-orbit rl-orbit2" style="--r:24deg"><ellipse cx="700" cy="250" rx="170" ry="40"/></g>
    <g class="rl-up rl-turn">${jar(label)}</g>`;
}

function card() {
  return `<rect x="622" y="64" width="156" height="318" rx="26" class="rl-phone rl-up"/>
    <rect x="684" y="76" width="32" height="6" rx="3" class="rl-notch"/>
    <rect x="636" y="96" width="128" height="120" rx="12" fill="url(#rlGrad2)" class="rl-slide" style="--t:.2s"/>
    <rect x="662" y="118" width="76" height="76" rx="14" class="rl-mini-jar rl-slide" style="--t:.3s"/>
    <rect x="636" y="228" width="110" height="10" rx="5" class="rl-line rl-slide" style="--t:.45s"/>
    <rect x="636" y="248" width="80" height="10" rx="5" class="rl-line rl-slide" style="--t:.55s"/>
    <g class="rl-slide" style="--t:.65s"><rect x="636" y="272" width="56" height="22" rx="11" class="rl-chip"/><rect x="698" y="272" width="56" height="22" rx="11" class="rl-chip"/></g>
    <rect x="636" y="330" width="128" height="34" rx="17" class="rl-buy rl-pop" style="--t:.9s"/>
    <rect x="806" y="110" width="74" height="56" rx="10" class="rl-float rl-slide" style="--t:.75s"/>
    <rect x="806" y="178" width="74" height="56" rx="10" class="rl-float rl-slide" style="--t:.85s"/>`;
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
    <text x="480" y="250" text-anchor="middle" class="rl-logo rl-in" style="--t:.1s">Proba Lab</text>
    <text x="480" y="300" text-anchor="middle" class="rl-tag rl-in" style="--t:.35s">запуск БАД и косметики — от состава до продаж</text>`;
}

export function showreel() {
  const x = (i: number) => 80 + i * (800 / 6);
  const labels = SCENES.map((s, i) => `<text x="${x(i)}" y="512" text-anchor="${i === 0 ? "start" : i === 6 ? "end" : "middle"}" class="rl-lab" style="--s:${i}">${s}</text>`).join("");
  const svg = `<svg class="reel-svg" viewBox="0 0 960 540" role="img" aria-labelledby="reel-t">
  <title id="reel-t">Путь продукта за 15 секунд: состав, документы, этикетка, 3D-визуализация, карточка маркетплейса, продажи</title>
  <defs>
    <linearGradient id="rlGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#34d399"/><stop offset="1" stop-color="#22d3ee"/></linearGradient>
    <linearGradient id="rlGrad2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a78bfa"/><stop offset="1" stop-color="#38bdf8"/></linearGradient>
    <linearGradient id="rlShade" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
    <linearGradient id="rlShadeR" x1="1" x2="0"><stop offset="0" stop-color="#000" stop-opacity=".55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
    <radialGradient id="rlGlow" cx=".72" cy=".42" r=".5"><stop offset="0" stop-color="#34d399" stop-opacity=".22"/><stop offset="1" stop-color="#34d399" stop-opacity="0"/></radialGradient>
    <pattern id="rlGrid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="rgba(255,255,255,.05)"/></pattern>
    <clipPath id="rlJarClip"><rect x="618" y="138" width="164" height="232" rx="28"/></clipPath>
  </defs>
  <rect width="960" height="540" class="rl-bg"/><rect width="960" height="540" fill="url(#rlGrid)"/><rect width="960" height="540" fill="url(#rlGlow)" class="rl-glow"/>
  ${scene(0, head(0, "Состав", "проверяем и выбираем документ") + hexagon())}
  ${scene(1, head(1, "Документы", "регистрация · декларации · маркировка") + doc())}
  ${scene(2, head(2, "Этикетка", "пока продукт на регистрации") + labelScene())}
  ${scene(3, head(3, "3D", "упаковка без съёмочного дня") + threeD())}
  ${scene(4, head(4, "Карточка", "Ozon и Wildberries") + card())}
  ${scene(5, head(5, "Продажи", "юнит-экономика и аналитика") + sales())}
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
