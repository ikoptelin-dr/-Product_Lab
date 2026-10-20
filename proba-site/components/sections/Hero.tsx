import { Emblem } from "@/components/brand/Logo";
import { TopicButton } from "@/components/interactive/TopicButton";
import { Rays } from "@/components/ui/Octagon";
import { hero } from "@/content/site";

export function Hero() {
  return (
    <section id="top" aria-labelledby="hero-title" className="grain relative isolate overflow-hidden bg-ink">
      {/* Сияж: свечение и лучи за эмблемой */}
      <div aria-hidden="true" className="pointer-events-none absolute top-[90px] left-1/2 -z-10 h-[720px] w-[720px] -translate-x-1/2 md:top-[40px]">
        <div className="sillage absolute inset-0 rounded-full bg-[radial-gradient(closest-side,rgba(176,141,87,0.22),rgba(176,141,87,0.06)_55%,transparent)]" />
        <Rays className="slow-turn absolute inset-0 h-full w-full text-gold/25" />
      </div>

      <div className="mx-auto flex min-h-[100svh] max-w-[1200px] flex-col items-center px-4 pt-[104px] pb-14 text-center sm:px-6 md:pt-[112px]">
        <div className="reveal is-visible">
          <Emblem size={132} priority className="mx-auto h-auto w-[88px] md:w-[112px]" />
        </div>
        <p className="kicker mt-7 text-gold-soft">{hero.eyebrow}</p>
        <h1 id="hero-title" className="display mt-6 text-[clamp(2.3rem,5.4vw,4.6rem)] text-ivory">
          {hero.title.map((line, i) => (
            <span key={line} className={`block text-balance ${i === hero.title.length - 1 ? "text-gold-pale italic" : ""}`}>
              {line}
            </span>
          ))}
        </h1>
        <p className="mt-7 max-w-[62ch] text-[1.02rem] leading-relaxed text-smoke md:text-[1.1rem]">{hero.lead}</p>

        <div className="mt-9 flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:items-center">
          <TopicButton
            topic={hero.primary.topic}
            goal="cta_hero_click"
            className="min-h-12 bg-gold px-5 text-[0.76rem] tracking-[0.1em] sm:px-7 sm:text-[0.8rem] sm:tracking-[0.14em] text-ink uppercase transition-colors hover:bg-gold-pale"
          >
            {hero.primary.label}
          </TopicButton>
          <a
            href={hero.secondary.href}
            className="inline-flex min-h-12 items-center justify-center border border-line-dark px-7 text-[0.8rem] tracking-[0.14em] text-ivory uppercase transition-colors hover:border-gold"
          >
            {hero.secondary.label}
          </a>
        </div>

        {/* Этикетка флакона */}
        <dl className="mt-auto grid w-full max-w-3xl grid-cols-1 border-y border-line-dark pt-0 text-left sm:grid-cols-3 md:mt-20">
          {hero.label.map((row, i) => (
            <div key={row.k} className={`flex items-baseline justify-between gap-4 py-4 sm:block sm:px-5 ${i > 0 ? "border-t border-line-dark sm:border-t-0 sm:border-l" : ""}`}>
              <dt className="kicker text-[0.62rem] text-smoke">{row.k}</dt>
              <dd className="display text-lg text-ivory sm:mt-1">{row.v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-5 text-[0.78rem] text-smoke">{hero.trust}</p>
      </div>
    </section>
  );
}
