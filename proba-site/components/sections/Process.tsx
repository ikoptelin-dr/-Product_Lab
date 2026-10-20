import { Heading, Section } from "@/components/ui/Section";
import { Octagon } from "@/components/ui/Octagon";
import { process } from "@/content/site";

export function Process() {
  return (
    <Section id="process" tone="paper" labelledBy="process-title">
      <Heading id="process-title" kicker={process.kicker} title={process.title} tone="light" />
      <ol className="relative grid gap-10 lg:grid-cols-6 lg:gap-6">
        <span aria-hidden="true" className="absolute top-[11px] bottom-0 left-[11px] w-px bg-gold/50 lg:top-[11px] lg:right-0 lg:bottom-auto lg:h-px lg:w-auto" />
        {process.steps.map((s, i) => (
          <li key={s.title} className="reveal relative pl-12 lg:pt-12 lg:pl-0" style={{ transitionDelay: `${i * 90}ms` }}>
            <Octagon filled={i === 0} className="absolute top-0 left-0 h-6 w-6 bg-paper text-gold" />
            <p className="kicker tnum text-[0.62rem] text-gold">{s.mark}</p>
            <h3 className="display mt-2 text-[1.5rem] leading-tight">{s.title}</h3>
            <p className="mt-3 text-[0.92rem] leading-relaxed text-ink/75">{s.text}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
