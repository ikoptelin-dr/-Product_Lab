// Юридические документы: oferta.html, politika-pd.html, soglasie-pd.html, pravovaya-informaciya.html.
// Источник — /home/user/-Product_Lab/proba-legal/*.md; scripts/build.mjs переводит их в HTML через pandoc
// (текст без изменений) и передаёт сюда. Первый заголовок «# …» становится h1 страницы.
import { breadcrumbLd, crumbsHtml, keepLast, type PageDoc } from "../layout";

export const LEGAL_DOCS = [
  { slug: "oferta", title: "Публичная оферта на оказание услуг — Proba Lab", description: "Публичная оферта ИП Коптелина И. А. (Proba Lab): порядок заказа, оплаты, сдачи и приёмки услуг, возврат, ответственность и реквизиты." },
  { slug: "politika-pd", title: "Политика обработки персональных данных — Proba Lab", description: "Как Proba Lab (ИП Коптелин И. А.) обрабатывает персональные данные: цели, основания, состав данных, сроки, права субъекта." },
  { slug: "soglasie-pd", title: "Согласие на обработку персональных данных — Proba Lab", description: "Текст согласия на обработку персональных данных, которое даёт посетитель, отправляя форму на сайте Proba Lab." },
  { slug: "pravovaya-informaciya", title: "Правовая информация — Proba Lab", description: "Владелец сайта Proba Lab, документы, статус информации и цен на сайте, права на материалы и контакты." },
] as const;

export type LegalHtml = Record<(typeof LEGAL_DOCS)[number]["slug"], string>;

export function renderLegal(html: LegalHtml): PageDoc[] {
  return LEGAL_DOCS.map((d) => {
    const src = html[d.slug];
    if (!src) throw new Error(`Нет HTML документа ${d.slug}`);
    const m = src.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
    if (!m) throw new Error(`${d.slug}: нет заголовка «# …»`);
    const h1 = m[1]!.trim();
    const rest = src.replace(m[0], "").trim();
    const path = `${d.slug}.html`;
    return {
      path,
      title: d.title,
      description: d.description,
      nav: "none",
      bodyClass: "page page-legal",
      ld: [breadcrumbLd([{ name: "Proba Lab", path: "index.html" }, { name: h1.replace(/<[^>]+>/g, ""), path }])],
      body: `<section class="page-hero legal-hero grain" aria-labelledby="page-title">
  <div class="container">
    ${crumbsHtml([{ name: "Proba Lab", href: "index.html" }, { name: h1.replace(/<[^>]+>/g, "") }])}
    <h1 id="page-title" class="h1-page legal-title">${keepLast(h1)}</h1>
  </div>
</section>
<div class="light">
<section class="section legal-section" aria-label="Текст документа">
  <div class="container">
    <div class="prose legal">
${rest}
    </div>
  </div>
</section>
</div>`,
    };
  });
}
