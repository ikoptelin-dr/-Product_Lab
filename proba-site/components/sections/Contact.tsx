import { LeadForm } from "@/components/forms/LeadForm";
import { Emblem } from "@/components/brand/Logo";
import { contact } from "@/content/site";
import { isPlaceholder, siteConfig } from "@/config/site.config";

export function Contact() {
  const email = isPlaceholder(siteConfig.contactEmail) ? undefined : siteConfig.contactEmail;
  const tg = isPlaceholder(siteConfig.telegramUrl) ? undefined : siteConfig.telegramUrl;
  const phone = isPlaceholder(siteConfig.phone) ? undefined : siteConfig.phone;
  return (
    <section id="contact" aria-labelledby="contact-title" className="grain relative bg-ink text-ivory">
      <div className="mx-auto grid max-w-[1200px] gap-12 px-4 py-20 sm:px-6 md:py-32 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
        <div className="reveal">
          <p className="kicker text-gold-soft">{contact.kicker}</p>
          <h2 id="contact-title" className="display mt-5 text-[clamp(2.3rem,5vw,3.8rem)]">
            {contact.title}
          </h2>
          <p className="mt-6 leading-relaxed text-smoke">{contact.lead}</p>
          <Emblem size={96} className="mt-12 hidden opacity-80 lg:block" />
          {(email || tg || phone) && (
            <ul className="mt-10 space-y-2 text-[0.95rem]">
              {email && (
                <li>
                  <a href={`mailto:${email}`} className="underline decoration-gold underline-offset-4">{email}</a>
                </li>
              )}
              {tg && (
                <li>
                  <a href={tg} target="_blank" rel="noopener noreferrer" className="underline decoration-gold underline-offset-4">Telegram</a>
                </li>
              )}
              {phone && (
                <li>
                  <a href={`tel:${phone.replace(/[^\d+]/g, "")}`}>{phone}</a>
                </li>
              )}
            </ul>
          )}
        </div>
        <div className="reveal relative bg-paper p-2 text-ink">
          <div className="border border-ink/15 p-6 md:p-10">
            <div className="mb-8 flex items-baseline justify-between border-b border-ink/10 pb-5">
              <p className="kicker text-[0.62rem] text-muted">Proba · заявка</p>
              <p className="kicker text-[0.62rem] text-gold">Ответ — 1 рабочий день</p>
            </div>
            <LeadForm contactEmail={email} captchaKey={siteConfig.smartCaptchaClientKey || undefined} />
          </div>
        </div>
      </div>
    </section>
  );
}
