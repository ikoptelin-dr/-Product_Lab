// Иллюстрации-схемы для первого экрана (SVG + CSS-анимация, без растровых картинок и без JS).
// Анимация отключается при prefers-reduced-motion (site.css). Подписи — текстом в SVG, читаются скринридером через <title>.

const STEPS = ["Состав", "Документы", "Упаковка", "Карточки", "Продажи"];

/** Главная: путь продукта от состава до продаж — линия прорисовывается, узлы загораются по очереди. */
export function pathVisual() {
  const x = (i: number) => 40 + i * 80;
  const nodes = STEPS.map(
    (s, i) => `<g class="pv-node" style="--d:${i * 0.45}s">
      <circle cx="${x(i)}" cy="110" r="15" class="pv-dot"/>
      <circle cx="${x(i)}" cy="110" r="15" class="pv-ring"/>
      <text x="${x(i)}" y="${i % 2 ? 160 : 72}" text-anchor="middle" class="pv-label">${s}</text>
    </g>`,
  ).join("");
  return `<figure class="hero-visual pv" aria-label="Путь продукта: состав, документы, упаковка, карточки, продажи">
  <svg viewBox="0 0 400 220" role="img" aria-hidden="true" focusable="false">
    <path d="M40 110 H360" class="pv-track"/>
    <path d="M40 110 H360" class="pv-line" pathLength="1"/>
    ${nodes}
  </svg>
  <figcaption class="pv-caption">От состава до продаж — одна команда</figcaption>
</figure>`;
}

/** «Упаковка до регистрации»: две дорожки идут параллельно и сходятся в запуске. */
export function parallelVisual() {
  const docs = ["Состав", "Испытания", "Регистрация"];
  const sales = ["Этикетка", "3D и видео", "Карточка"];
  const lane = (items: string[], y: number, cls: string, delay: number) =>
    items
      .map(
        (s, i) => `<g class="pl-node ${cls}" style="--d:${delay + i * 0.5}s"><rect x="${30 + i * 105}" y="${y - 17}" width="92" height="34" rx="17" class="pl-pill"/><text x="${76 + i * 105}" y="${y + 5}" text-anchor="middle" class="pl-label">${s}</text></g>`,
      )
      .join("");
  return `<figure class="hero-visual pl" aria-label="Документы и подготовка продаж идут параллельно и сходятся в запуске">
  <svg viewBox="0 0 450 230" role="img" aria-hidden="true" focusable="false">
    <text x="30" y="34" class="pl-lane">Документы</text>
    <text x="30" y="144" class="pl-lane">Продажи</text>
    <path d="M30 70 H340 Q380 70 398 115" class="pl-track"/>
    <path d="M30 180 H340 Q380 180 398 115" class="pl-track"/>
    <path d="M30 70 H340 Q380 70 398 115" class="pl-line" pathLength="1"/>
    <path d="M30 180 H340 Q380 180 398 115" class="pl-line pl-line-2" pathLength="1"/>
    ${lane(docs, 70, "pl-docs", 0)}
    ${lane(sales, 180, "pl-sales", 0.25)}
    <g class="pl-launch"><circle cx="416" cy="115" r="16" class="pv-dot"/><text x="416" y="158" text-anchor="middle" class="pl-label pl-launch-label">Запуск</text></g>
  </svg>
  <figcaption class="pv-caption">Пока идёт регистрация, продажи уже готовятся</figcaption>
</figure>`;
}
