type Tone = "ink" | "graphite" | "paper";

const tones: Record<Tone, string> = {
  ink: "bg-ink text-ivory",
  graphite: "bg-graphite text-ivory",
  paper: "bg-paper text-ink",
};

export function Section({
  id,
  tone = "ink",
  className = "",
  children,
  labelledBy,
}: {
  id?: string;
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
  labelledBy?: string;
}) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={`relative ${tones[tone]} ${className}`}>
      <div className="mx-auto w-full max-w-[1200px] px-4 py-20 sm:px-6 md:py-32">{children}</div>
    </section>
  );
}

export function Heading({
  id,
  kicker,
  title,
  lead,
  tone = "dark",
  align = "left",
}: {
  id: string;
  kicker: string;
  title: string;
  lead?: string;
  tone?: "dark" | "light";
  align?: "left" | "center";
}) {
  const centered = align === "center" ? "mx-auto text-center" : "";
  return (
    <header className={`reveal mb-12 max-w-3xl md:mb-16 ${centered}`}>
      <p className={`kicker mb-5 ${tone === "dark" ? "text-gold-soft" : "text-gold"}`}>
        <span aria-hidden="true" className="mr-3 inline-block h-px w-8 translate-y-[-4px] bg-current align-middle" />
        {kicker}
      </p>
      <h2 id={id} className="display text-[clamp(2.1rem,4.6vw,3.6rem)]">
        {title}
      </h2>
      {lead && (
        <p className={`mt-6 text-[1.05rem] leading-relaxed ${tone === "dark" ? "text-smoke" : "text-muted"} ${centered}`}>
          {lead}
        </p>
      )}
    </header>
  );
}
