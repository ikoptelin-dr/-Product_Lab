import { Heading, Section } from "@/components/ui/Section";
import { faq } from "@/content/site";

export function Faq() {
  return (
    <Section id="faq" tone="ink" labelledBy="faq-title">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
        <Heading id="faq-title" kicker={faq.kicker} title={faq.title} />
        <div className="reveal border-t border-line-dark">
          {faq.items.map((item) => (
            <details key={item.q} className="group border-b border-line-dark">
              <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 py-5 text-left [&::-webkit-details-marker]:hidden">
                <span className="display text-[1.3rem] leading-snug md:text-[1.45rem]">{item.q}</span>
                <span aria-hidden="true" className="relative h-4 w-4 shrink-0">
                  <span className="absolute top-1/2 left-0 h-px w-4 bg-gold" />
                  <span className="absolute top-0 left-1/2 h-4 w-px bg-gold transition-transform duration-300 group-open:scale-y-0" />
                </span>
              </summary>
              <p className="max-w-[62ch] pb-6 leading-relaxed text-smoke">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </Section>
  );
}
