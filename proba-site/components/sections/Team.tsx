import Image from "next/image";
import { Heading, Section } from "@/components/ui/Section";
import { Ph, SafeLink } from "@/components/ui/Ph";
import { team } from "@/content/site";

export function Team() {
  return (
    <Section id="authors" tone="paper" labelledBy="team-title">
      <Heading id="team-title" kicker={team.kicker} title={team.title} lead={team.lead} tone="light" />
      <ul className="grid gap-6 md:grid-cols-2">
        {team.people.map((p) => (
          <li key={p.role} className="reveal flex flex-col gap-6 border border-line bg-ivory p-7 sm:flex-row md:p-9">
            <div className="shrink-0">
              {p.photo ? (
                <Image src={p.photo} alt="" width={112} height={112} className="h-28 w-28 object-cover grayscale" />
              ) : (
                <span
                  aria-hidden="true"
                  className="display flex h-28 w-28 items-center justify-center bg-ink text-3xl text-gold-pale [clip-path:polygon(29%_0,71%_0,100%_29%,100%_71%,71%_100%,29%_100%,0_71%,0_29%)]"
                >
                  {p.initials}
                </span>
              )}
            </div>
            <div>
              <h3 className="display text-[1.7rem] leading-tight">
                <Ph value={p.name} />
              </h3>
              <p className="kicker mt-2 text-[0.62rem] text-gold">{p.role}</p>
              <p className="mt-5 text-[0.95rem] leading-relaxed text-ink/80">
                <Ph value={p.bio} />
              </p>
              {p.links.length > 0 && (
                <ul className="mt-5 flex flex-wrap gap-5 text-[0.85rem]">
                  {p.links.map((l) => (
                    <li key={l.label}>
                      <SafeLink href={l.href} className="underline decoration-gold underline-offset-4">
                        {l.label}
                      </SafeLink>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-[0.88rem] text-muted">{team.partners}</p>
    </Section>
  );
}
