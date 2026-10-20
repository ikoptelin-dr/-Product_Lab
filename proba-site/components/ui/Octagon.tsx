/** Восьмиугольный мотив из геометрии логотипа. */
export function Octagon({ className = "", filled = false }: { className?: string; filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <polygon
        points="7,1 17,1 23,7 23,17 17,23 7,23 1,17 1,7"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** Восемь лучей — тонкая линейная композиция для фонов. */
export function Rays({ className = "" }: { className?: string }) {
  const rays = Array.from({ length: 16 }, (_, i) => i * 22.5);
  return (
    <svg viewBox="-100 -100 200 200" aria-hidden="true" className={className}>
      {[96, 72, 48].map((r, i) => (
        <polygon
          key={r}
          points={Array.from({ length: 8 }, (_, k) => {
            const a = ((k * 45 + 22.5) * Math.PI) / 180;
            return `${(r * Math.cos(a)).toFixed(2)},${(r * Math.sin(a)).toFixed(2)}`;
          }).join(" ")}
          fill="none"
          stroke="currentColor"
          strokeWidth={i === 0 ? 0.25 : 0.18}
        />
      ))}
      {rays.map((deg, i) => {
        const a = (deg * Math.PI) / 180;
        const len = i % 2 === 0 ? 99 : 60;
        return (
          <line
            key={deg}
            x1={(14 * Math.cos(a)).toFixed(2)}
            y1={(14 * Math.sin(a)).toFixed(2)}
            x2={(len * Math.cos(a)).toFixed(2)}
            y2={(len * Math.sin(a)).toFixed(2)}
            stroke="currentColor"
            strokeWidth="0.15"
          />
        );
      })}
    </svg>
  );
}
