import { Heading, Section } from "@/components/ui/Section";
import { manifesto } from "@/content/site";

export function Manifesto() {
  return (
    <Section id="manifesto" tone="paper" labelledBy="manifesto-title">
      <Heading id="manifesto-title" kicker={manifesto.kicker} title={manifesto.title} tone="light" />
      <ol className="grid gap-px overflow-hidden border border-line bg-line md:grid-cols-3">
        {manifesto.items.map((item, i) => (
          <li key={item.sense} className="reveal bg-paper p-8 md:p-10" style={{ transitionDelay: `${i * 120}ms` }}>
            <p className="kicker tnum text-gold">0{i + 1}</p>
            <p className="display mt-8 text-5xl md:text-6xl">
              {item.word}
              <span className="text-gold">.</span>
            </p>
            <p className="display mt-2 text-2xl text-muted italic">{item.sense}</p>
            <p className="mt-8 text-[0.98rem] leading-relaxed text-ink/80">{item.text}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
