"use client";

import { useId, useState } from "react";
import { Heading } from "@/components/ui/Section";
import { SafeLink } from "@/components/ui/Ph";
import { notes } from "@/content/site";

type LayerId = (typeof notes.layers)[number]["id"];

// Полосы флакона сверху вниз: верхние ноты, сердце, база.
const BANDS: Record<LayerId, { y: number; h: number }> = {
  top: { y: 128, h: 74 },
  heart: { y: 202, h: 96 },
  base: { y: 298, h: 118 },
};

function Flacon({ active, onPick }: { active: LayerId; onPick: (id: LayerId) => void }) {
  return (
    <svg viewBox="0 0 260 440" className="h-auto w-full max-w-[260px]" role="img" aria-label="Флакон из трёх уровней нот">
      <defs>
        <linearGradient id="liquid" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#e6d3ad" stopOpacity="0.55" />
          <stop offset="1" stopColor="#b08d57" stopOpacity="0.85" />
        </linearGradient>
        <clipPath id="bottle">
          <path d="M40 120 Q40 108 52 108 L208 108 Q220 108 220 120 L220 404 Q220 420 204 420 L56 420 Q40 420 40 404 Z" />
        </clipPath>
      </defs>
      {/* крышка и горлышко */}
      <rect x="92" y="18" width="76" height="58" fill="none" stroke="#b08d57" strokeWidth="1" />
      <line x1="92" y1="47" x2="168" y2="47" stroke="#b08d57" strokeWidth="0.5" opacity="0.6" />
      <rect x="108" y="76" width="44" height="32" fill="none" stroke="#b08d57" strokeWidth="1" />
      {/* жидкость по уровням */}
      <g clipPath="url(#bottle)">
        {(Object.keys(BANDS) as LayerId[]).map((id) => {
          const b = BANDS[id];
          const on = id === active;
          return (
            <rect
              key={id}
              x="40"
              y={b.y}
              width="180"
              height={b.h}
              fill="url(#liquid)"
              opacity={on ? 1 : 0.14}
              className="cursor-pointer transition-opacity duration-700"
              onClick={() => onPick(id)}
            />
          );
        })}
        {[202, 298].map((y) => (
          <line key={y} x1="40" x2="220" y1={y} y2={y} stroke="#0b0b0b" strokeWidth="1" strokeDasharray="2 4" />
        ))}
      </g>
      <path
        d="M40 120 Q40 108 52 108 L208 108 Q220 108 220 120 L220 404 Q220 420 204 420 L56 420 Q40 420 40 404 Z"
        fill="none"
        stroke="#c9a96e"
        strokeWidth="1.2"
      />
      {/* этикетка */}
      <rect x="70" y="236" width="120" height="40" fill="#0b0b0b" opacity="0.72" />
      <text x="130" y="254" textAnchor="middle" fill="#f6f3ec" fontSize="11" letterSpacing="3" fontFamily="var(--font-display)">
        PROBA
      </text>
      <text x="130" y="268" textAnchor="middle" fill="#c9a96e" fontSize="6" letterSpacing="2.4">
        ВАШ ПРОДУКТ
      </text>
    </svg>
  );
}

export function Notes() {
  const [active, setActive] = useState<LayerId>("base");
  const baseId = useId();
  const layer = notes.layers.find((l) => l.id === active)!;

  return (
    <section id="notes" aria-labelledby="notes-title" className="relative bg-ink text-ivory">
      <div className="mx-auto max-w-[1200px] px-4 py-20 sm:px-6 md:py-32">
        <Heading id="notes-title" kicker={notes.kicker} title={notes.title} lead={notes.lead} />

        <div className="grid items-start gap-12 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-16">
          <div className="reveal flex justify-center md:sticky md:top-28">
            <Flacon active={active} onPick={setActive} />
          </div>

          <div className="reveal">
            <div role="tablist" aria-label="Уровни нот" className="grid grid-cols-3 border-b border-line-dark">
              {notes.layers.map((l) => {
                const selected = l.id === active;
                return (
                  <button
                    key={l.id}
                    role="tab"
                    id={`${baseId}-tab-${l.id}`}
                    aria-selected={selected}
                    aria-controls={`${baseId}-panel`}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => setActive(l.id)}
                    onKeyDown={(e) => {
                      const ids = notes.layers.map((x) => x.id);
                      const i = ids.indexOf(l.id);
                      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                        e.preventDefault();
                        const next = ids[(i + (e.key === "ArrowRight" ? 1 : ids.length - 1)) % ids.length]!;
                        setActive(next);
                        document.getElementById(`${baseId}-tab-${next}`)?.focus();
                      }
                    }}
                    className={`-mb-px min-h-14 border-b px-1 pb-4 text-left transition-colors ${
                      selected ? "border-gold text-ivory" : "border-transparent text-smoke hover:text-ivory"
                    }`}
                  >
                    <span className="display block text-[1.15rem] sm:text-2xl">{l.name}</span>
                    <span className="mt-1 hidden text-[0.75rem] tracking-wide sm:block">{l.tagline}</span>
                  </button>
                );
              })}
            </div>

            <div id={`${baseId}-panel`} role="tabpanel" aria-labelledby={`${baseId}-tab-${active}`} key={active} className="soak pt-10">
              <p className="kicker text-gold-soft">{layer.tagline}</p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {layer.elements.map((el) => (
                  <li key={el} className="border border-line-dark px-3 py-1.5 text-[0.85rem] text-ivory/90">
                    {el}
                  </li>
                ))}
              </ul>
              <dl className="mt-10 grid gap-8 sm:grid-cols-2">
                <div>
                  <dt className="kicker text-[0.65rem] text-smoke">Что изменилось</dt>
                  <dd className="mt-3 leading-relaxed text-ivory/90">{layer.change}</dd>
                </div>
                <div>
                  <dt className="kicker text-[0.65rem] text-smoke">Что делаем мы</dt>
                  <dd className="display mt-3 text-[1.45rem] leading-snug text-gold-pale">{layer.work}</dd>
                </div>
              </dl>
            </div>

            <p className="mt-14 text-[0.75rem] leading-relaxed text-smoke">
              Источники:{" "}
              {notes.sources.map((s, i) => (
                <span key={s.label}>
                  <SafeLink href={s.url} className="underline decoration-line-dark underline-offset-4 hover:text-ivory">
                    {s.label}
                  </SafeLink>
                  {i < notes.sources.length - 1 ? "; " : "."}
                </span>
              ))}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
