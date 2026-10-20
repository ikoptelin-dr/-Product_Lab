import { TopicButton } from "@/components/interactive/TopicButton";
import { Heading, Section } from "@/components/ui/Section";
import { Ph } from "@/components/ui/Ph";
import { collection } from "@/content/site";
import { siteConfig } from "@/config/site.config";

type Item = (typeof collection.items)[number];

function Label({ item }: { item: Item }) {
  const signature = item.tone === "signature";
  return (
    <article
      className={`reveal group relative flex h-full flex-col bg-ivory p-2 text-ink ${signature ? "ring-1 ring-gold" : ""}`}
      aria-labelledby={`svc-${item.no}`}
    >
      {/* двойная рамка аптекарской этикетки */}
      <div className={`flex h-full flex-col border p-6 md:p-7 ${signature ? "border-gold" : "border-ink/15"}`}>
        <div className="flex items-start justify-between gap-4">
          <p className="kicker tnum text-[0.65rem] text-muted">№ {item.no}</p>
          {signature && <p className="kicker text-[0.6rem] text-gold">Начать здесь</p>}
        </div>
        <h3 id={`svc-${item.no}`} className="display mt-6 text-[2rem] leading-none">
          {item.name}
        </h3>
        <p className="mt-2 text-[0.82rem] tracking-[0.06em] text-muted uppercase">{item.descriptor}</p>
        <div aria-hidden="true" className="my-6 h-px bg-ink/10" />
        <dl className="grid gap-4 text-[0.9rem]">
          <div>
            <dt className="kicker text-[0.6rem] text-muted">{collection.legend.notes}</dt>
            <dd className="mt-1 leading-relaxed">{item.notes}</dd>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <dt className="kicker text-[0.6rem] text-muted">{collection.legend.maturation}</dt>
              <dd className="mt-1">{item.maturation}</dd>
            </div>
            <div>
              <dt className="kicker text-[0.6rem] text-muted">{collection.legend.volume}</dt>
              <dd className="mt-1">{item.volume}</dd>
            </div>
          </div>
        </dl>
        <div className="mt-auto flex items-end justify-between gap-4 pt-8">
          <p className="display tnum text-[1.75rem] leading-none whitespace-nowrap">{item.price}</p>
          <TopicButton
            topic={item.topic}
            goal={signature ? "cta_offer_click" : "service_select"}
            className={`min-h-11 px-5 text-[0.72rem] tracking-[0.14em] uppercase transition-colors ${
              signature ? "bg-ink text-ivory hover:bg-gold hover:text-ink" : "border border-ink/25 hover:border-ink"
            }`}
          >
            {collection.cta}
            <span className="sr-only">: {item.name}</span>
          </TopicButton>
        </div>
      </div>
    </article>
  );
}

export function Collection() {
  const [sample, ...rest] = collection.items;
  return (
    <Section id="collection" tone="ink" labelledBy="collection-title">
      <Heading id="collection-title" kicker={collection.kicker} title={collection.title} lead={collection.lead} />

      {/* Пробник — как мюйетка во всю ширину */}
      <div className="reveal relative mb-6 flex flex-col gap-6 border border-dashed border-gold/60 p-6 md:flex-row md:items-center md:justify-between md:p-8">
        <div>
          <p className="kicker tnum text-[0.65rem] text-gold-soft">
            № {sample!.no} · {sample!.descriptor}
          </p>
          <p className="display mt-3 text-[2.2rem] leading-none">{sample!.name}</p>
          <p className="mt-3 max-w-[56ch] text-smoke">
            {sample!.notes}. {sample!.maturation}.
          </p>
        </div>
        <div className="flex items-center gap-6">
          <p className="display text-[1.9rem] text-gold-pale">{sample!.price}</p>
          <TopicButton
            topic={sample!.topic}
            goal="cta_hero_click"
            className="min-h-12 bg-gold px-6 text-[0.78rem] tracking-[0.14em] text-ink uppercase transition-colors hover:bg-gold-pale"
          >
            Получить пробник
          </TopicButton>
        </div>
      </div>

      {/* На мобильных — горизонтальная лента этикеток со снапом, на десктопе — сетка */}
      <div
        role="list"
        aria-label="Услуги"
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-3 [&::-webkit-scrollbar]:hidden"
      >
        {rest.map((item) => (
          <div role="listitem" key={item.no} className="w-[86%] shrink-0 snap-center md:w-auto">
            <Label item={item} />
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-[0.75rem] text-smoke md:hidden" aria-hidden="true">
        Листайте →
      </p>
      <p className="mt-8 text-[0.78rem] text-smoke">
        <Ph value={siteConfig.pricingNote} /> Точный объём фиксируется в договоре.
      </p>
    </Section>
  );
}
