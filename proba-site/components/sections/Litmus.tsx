"use client";

import { useId, useState } from "react";
import { TopicButton } from "@/components/interactive/TopicButton";
import { Heading } from "@/components/ui/Section";
import { litmus } from "@/content/site";
import { reachGoal } from "@/lib/analytics";
import { checkClaim, type LitmusResult } from "@/lib/litmus";

const tint = {
  clean: { strip: "bg-gold", label: "Чисто по маркерам", text: "text-gold" },
  medium: { strip: "bg-caution", label: "Требует проверки", text: "text-caution" },
  high: { strip: "bg-risk", label: "Высокий риск", text: "text-risk" },
} as const;

export function Litmus() {
  const [value, setValue] = useState("");
  const [result, setResult] = useState<LitmusResult | null>(null);
  const [runId, setRunId] = useState(0);
  const inputId = useId();

  const run = (text: string) => {
    if (!text.trim()) return;
    setResult(checkClaim(text));
    setRunId((n) => n + 1);
    reachGoal("litmus_check");
  };

  return (
    <section id="litmus" aria-labelledby="litmus-title" className="relative bg-graphite text-ivory">
      <div className="mx-auto max-w-[1200px] px-4 py-20 sm:px-6 md:py-32">
        <Heading id="litmus-title" kicker={litmus.kicker} title={litmus.title} lead={litmus.lead} />

        <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <form
            className="reveal"
            onSubmit={(e) => {
              e.preventDefault();
              run(value);
            }}
          >
            <label htmlFor={inputId} className="kicker text-[0.65rem] text-smoke">
              Формулировка
            </label>
            <textarea
              id={inputId}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              maxLength={600}
              rows={4}
              placeholder={litmus.placeholder}
              className="mt-3 w-full resize-none border border-line-dark bg-ink px-4 py-3 text-[1.02rem] text-ivory placeholder:text-smoke/70 focus:border-gold focus:outline-none"
            />
            <div className="mt-3 flex flex-wrap gap-2" aria-label="Примеры">
              {litmus.samples.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setValue(s);
                    run(s);
                  }}
                  className="min-h-9 border border-line-dark px-3 text-left text-[0.78rem] text-smoke transition-colors hover:border-gold hover:text-ivory"
                >
                  {s}
                </button>
              ))}
            </div>
            <button
              type="submit"
              className="mt-6 min-h-12 w-full bg-ivory px-6 text-[0.8rem] tracking-[0.14em] text-ink uppercase transition-colors hover:bg-gold sm:w-auto"
            >
              Нанести на мюйетку
            </button>
            <p className="mt-6 text-[0.75rem] leading-relaxed text-smoke">{litmus.disclaimer}</p>
          </form>

          <div className="reveal" aria-live="polite">
            {/* Полоска-мюйетка */}
            <div className="relative overflow-hidden bg-paper text-ink shadow-[0_30px_80px_-40px_rgba(0,0,0,0.8)] [clip-path:polygon(0_0,96%_0,100%_50%,96%_100%,0_100%)]">
              {result && <div key={runId} aria-hidden="true" className={`soak absolute inset-y-0 left-0 w-2 ${tint[result.score].strip}`} />}
              <div className="flex min-h-[148px] flex-col justify-center py-7 pr-14 pl-8">
                <p className="kicker text-[0.6rem] text-muted">Proba · мюйетка № {String(runId).padStart(3, "0")}</p>
                {result ? (
                  <p key={runId} className="soak display mt-3 text-[1.55rem] leading-snug md:text-[1.8rem]">
                    {result.segments.map((s, i) =>
                      s.level ? (
                        <mark
                          key={i}
                          className={`bg-transparent underline decoration-2 underline-offset-[6px] ${
                            s.level === "high" ? "text-risk decoration-risk" : "text-caution decoration-caution"
                          }`}
                        >
                          {s.text}
                        </mark>
                      ) : (
                        <span key={i}>{s.text}</span>
                      ),
                    )}
                  </p>
                ) : (
                  <p className="display mt-3 text-[1.55rem] text-muted italic">Здесь проявится формулировка</p>
                )}
              </div>
            </div>

            {result && (
              <div className="mt-8">
                <p className={`kicker ${tint[result.score].text}`}>{tint[result.score].label}</p>
                {result.hits.length === 0 ? (
                  <div className="mt-4">
                    <p className="display text-2xl">{litmus.cleanTitle}</p>
                    <p className="mt-2 text-smoke">{litmus.cleanText}</p>
                  </div>
                ) : (
                  <ul className="mt-4 divide-y divide-line-dark border-y border-line-dark">
                    {result.hits.map((h) => (
                      <li key={h.rule.id} className="grid gap-2 py-5 sm:grid-cols-[180px_1fr] sm:gap-6">
                        <p className="display text-xl">
                          <span aria-hidden="true" className={`mr-2 inline-block h-2 w-2 rotate-45 ${h.rule.level === "high" ? "bg-risk" : "bg-caution"}`} />
                          {h.rule.title}
                        </p>
                        <div className="text-[0.92rem] leading-relaxed">
                          <p className="text-ivory/85">{h.rule.why}</p>
                          <p className="mt-2 text-gold-pale">
                            <span className="text-smoke">Вместо: </span>
                            {h.rule.instead}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <TopicButton
                  topic="Пробник — мини-разбор (бесплатно)"
                  className="mt-8 min-h-12 border border-gold/70 px-6 text-[0.8rem] tracking-[0.14em] text-gold-pale uppercase transition-colors hover:bg-gold hover:text-ink"
                >
                  {litmus.cta}
                </TopicButton>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
