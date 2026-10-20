import { Heading, Section } from "@/components/ui/Section";
import { Octagon } from "@/components/ui/Octagon";
import { expertise } from "@/content/site";

export function Expertise() {
  return (
    <Section id="expertise" tone="ink" labelledBy="expertise-title">
      <Heading id="expertise-title" kicker={expertise.kicker} title={expertise.title} />
      <div className="grid gap-px bg-line-dark md:grid-cols-3">
        {expertise.columns.map((c, i) => (
          <div key={c.title} className="reveal bg-ink py-8 md:px-8 md:first:pl-0" style={{ transitionDelay: `${i * 100}ms` }}>
            <p className="display tnum text-6xl text-gold/40">{i + 1}</p>
            <h3 className="display mt-4 text-[1.7rem]">{c.title}</h3>
            <p className="mt-4 leading-relaxed text-smoke">{c.text}</p>
          </div>
        ))}
      </div>

      <ul className="reveal mt-14 flex flex-wrap gap-2" aria-label="Отрасли">
        {expertise.industries.map((t) => (
          <li key={t} className="border border-line-dark px-4 py-2 text-[0.85rem] text-ivory/85">
            {t}
          </li>
        ))}
      </ul>

      {/* Клейма — принципы как пробирные знаки */}
      <div className="mt-20">
        <p className="kicker text-gold-soft">Клейма</p>
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {expertise.hallmarks.map((h) => (
            <li key={h.mark} className="reveal flex items-center gap-5">
              <span aria-hidden="true" className="display relative flex h-16 w-16 shrink-0 items-center justify-center text-xl text-gold-pale">
                <Octagon className="absolute inset-0 h-full w-full text-gold/80" />
                <Octagon className="absolute inset-[5px] h-[calc(100%-10px)] w-[calc(100%-10px)] text-gold/40" />
                {h.mark}
              </span>
              <span className="text-[0.92rem] leading-snug text-ivory/85">{h.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
