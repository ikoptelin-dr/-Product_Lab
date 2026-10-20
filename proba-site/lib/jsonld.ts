import { collection, faq } from "@/content/site";
import { isPlaceholder, siteConfig } from "@/config/site.config";

const priceNumber = (p: string) => {
  const n = Number(p.replace(/[^\d]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

export function buildJsonLd() {
  const url = siteConfig.siteUrl;
  const org = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${url}/#org`,
    name: "Proba Lab",
    alternateName: "Проба",
    url,
    logo: `${url}/brand/icon-512.png`,
    image: `${url}/brand/logo-full.png`,
    description: "Бюро доказательной коммерциализации health-продуктов.",
    areaServed: "RU",
    address: { "@type": "PostalAddress", addressLocality: "Новосибирск", addressCountry: "RU" },
    ...(isPlaceholder(siteConfig.contactEmail) ? {} : { email: siteConfig.contactEmail }),
  };
  const services = collection.items
    .filter((s) => priceNumber(s.price))
    .map((s) => ({
      "@context": "https://schema.org",
      "@type": "Service",
      name: s.name,
      description: `${s.descriptor}. ${s.notes}`,
      provider: { "@id": `${url}/#org` },
      areaServed: "RU",
      offers: { "@type": "Offer", price: priceNumber(s.price), priceCurrency: "RUB" },
    }));
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.items.map((i) => ({
      "@type": "Question",
      name: i.q,
      acceptedAnswer: { "@type": "Answer", text: i.a },
    })),
  };
  return [org, ...services, faqLd];
}
