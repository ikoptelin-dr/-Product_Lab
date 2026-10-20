import { TopicButton } from "@/components/interactive/TopicButton";
import { Heading, Section } from "@/components/ui/Section";
import { projects } from "@/content/site";

/** Показывается только при NEXT_PUBLIC_SHOW_PROJECTS=true. Публикуются лишь проекты с согласием клиента. */
export function Projects() {
  const items = projects.items.filter((p) => p.consent);
  return (
    <Section id="projects" tone="graphite" labelledBy="projects-title">
      <Heading id="projects-title" kicker={projects.kicker} title={projects.title} />
      {items.length === 0 ? (
        <div className="reveal max-w-2xl">
          <p className="text-lg leading-relaxed text-smoke">{projects.empty}</p>
          <TopicButton
            topic="Пробник — мини-разбор (бесплатно)"
            className="mt-8 min-h-12 bg-gold px-6 text-[0.78rem] tracking-[0.14em] text-ink uppercase"
          >
            Получить пробник
          </TopicButton>
        </div>
      ) : (
        <ul className="grid gap-6 md:grid-cols-2">
          {items.map((p) => (
            <li key={p.title} className="reveal border border-line-dark p-8">
              <h3 className="display text-2xl">{p.title}</h3>
              {p.clientName && <p className="mt-1 text-smoke">{p.clientName}</p>}
              <dl className="mt-6 grid gap-4 text-[0.92rem]">
                <div><dt className="kicker text-[0.6rem] text-smoke">Задача</dt><dd className="mt-1">{p.task}</dd></div>
                <div><dt className="kicker text-[0.6rem] text-smoke">Что сделали</dt><dd className="mt-1">{p.done}</dd></div>
                <div><dt className="kicker text-[0.6rem] text-smoke">Результат</dt><dd className="mt-1">{p.result}</dd></div>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
