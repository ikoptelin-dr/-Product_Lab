// Страницы подвала «Компания» и «Клиентам»: О нас, Оплата, Контакты, Партнёрам, Благотворительность, Новости.
// Тексты — content/footer-pages.md (дословно). Заметки «>» и «[решение владельца]» на сайт не выводятся — они в README.
import { COMPANY } from "../data";
import { partnerSection, probonoSection, projectSection } from "../forms";
import { breadcrumbLd, companyLd, esc, keepLast, pageHero, QUIZ_HREF, section, type PageDoc } from "../layout";
import { f } from "../regulatory/mark";
import { factText } from "../regulatory/render";

const crumbs = (name: string) => [{ name: "Proba Lab", href: "index.html" }, { name }];
const ldCrumbs = (name: string, path: string) => breadcrumbLd([{ name: "Proba Lab", path: "index.html" }, { name, path }]);
const wrap = (hero: string, body: string) => `${hero}\n<div class="light">\n${body}\n</div>`;

/** Реквизиты COMPANY: для «Оплаты» — платёжные, для «Контактов» — полностью. */
export function requisites(full: boolean) {
  const rows: [string, string][] = [
    ["Получатель", COMPANY.fullName],
    ["ИНН", COMPANY.inn],
    ["ОГРНИП", COMPANY.ogrnip],
    ...(full ? ([["Дата регистрации", COMPANY.registered]] as [string, string][]) : []),
    ["Адрес", COMPANY.address.full],
    ["Расчётный счёт", COMPANY.bank.account],
    ["Банк", COMPANY.bank.name],
    ["БИК", COMPANY.bank.bik],
    ["Корр. счёт", COMPANY.bank.corr],
  ];
  return `<dl class="req-list">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>`;
}

/* ================================================================ О нас */
export const oNas: PageDoc = {
  path: "o-nas.html",
  title: "О Proba Lab — кто мы и почему так работаем",
  description: "Proba Lab основал врач с опытом научной работы и B2B-продаж медицинской продукции. Помогаем брендам БАД и косметики выйти на рынок законно и понятно для покупателя.",
  nav: "none",
  ld: [ldCrumbs("О нас", "o-nas.html")],
  body: wrap(
    pageHero({
      crumbs: crumbs("О нас"),
      h1: "Проба — это проверка, прежде чем продавать",
      lead: "Proba Lab помогает производителям и брендам БАД и косметики выпустить продукт на рынок: подготовить документы, этикетку, карточки и материалы, которые объясняют покупателю, почему стоит выбрать именно этот продукт.",
      ctas: [
        { label: "Обсудить задачу", href: "#project-form" },
        { label: "Проверить состав бесплатно", href: QUIZ_HREF },
      ],
    }),
    [
      `<section id="istoriya" class="section" aria-labelledby="istoriya-title">
  <div class="container two-col">
    <h2 id="istoriya-title" class="h2 reveal">${keepLast("Как появилась Proba Lab")}</h2>
    <div class="team-text">
      <p><b>Основатель — Илья Коптелин,</b> врач (СЗГМУ им. И. И. Мечникова, 2024). Около шести лет занимался научной работой, работал в реанимации, затем — в B2B-продажах медицинской продукции в международной компании.</p>
      <p>Этот опыт показал две стороны одного рынка:</p>
      <ul class="sides">
        <li class="card glass-light"><h3>Наука</h3><p>Хорошее исследование ингредиента ещё не доказывает, что работает готовый продукт. Обещания на упаковке часто опираются на чужие данные.</p></li>
        <li class="card glass-light"><h3>Продажи</h3><p>Сильный продукт проигрывает, если его преимущества не объяснены. А слабая этикетка или неточная карточка могут стоить блокировки на маркетплейсе.</p></li>
      </ul>
      <p class="problem-accent">Proba Lab соединяет эти стороны: сначала проверяем, что можно честно сказать о продукте и какие документы для этого нужны, потом превращаем это в упаковку, карточки и продажи.</p>
    </div>
  </div>
</section>`,
      `<section id="pochemu" class="section" aria-labelledby="pochemu-title">
  <div class="container two-col">
    <h2 id="pochemu-title" class="h2 reveal">Почему «Проба»</h2>
    <p class="statement-text reveal">Проба — это проверка до решения: проба состава, проба формулировки, проба нового канала продаж. Мы предлагаем сначала проверить — на небольшом шаге, с понятным результатом, — и только потом вкладываться в производство, дизайн или продвижение.</p>
  </div>
</section>`,
      section({
        id: "kak",
        title: "Как мы работаем",
        body: `<ul class="reg-mistakes">
      <li class="reveal"><h3>Смета до начала работ.</h3><p>Работа, внешние расходы и сроки — отдельными строками.</p></li>
      <li class="reveal"><h3>Честные сроки.</h3><p>Срок рассмотрения в ведомстве отдельно от срока проекта.</p></li>
      <li class="reveal"><h3>Без обещаний, которые нельзя проверить.</h3><p>Не гарантируем регистрацию и рост продаж. Договариваемся, как замерим результат.</p></li>
      <li class="reveal"><h3>Одна ответственность</h3><p>За документы, этикетку и карточку: они не должны противоречить друг другу.</p></li>
    </ul>
    <p class="how-foot"><a class="arrow-link" href="kak-my-rabotaem.html">Подробнее о ролях и договорах<span class="arrow" aria-hidden="true"></span></a></p>`,
      }),
      section({
        id: "kto",
        title: "Кто работает",
        body: `<ul class="principles">
      <li class="reveal"><h3>Основатель</h3><p>Научная проверка заявлений, стратегия, ключевые решения в каждом проекте.</p></li>
      <li class="reveal"><h3>Дизайнеры и разработчики</h3><p>Упаковка, карточки, сайты, интеграции.</p></li>
      <li class="reveal"><h3>Специалисты-партнёры</h3><p>Регистрация, декларации, требования к производству. Испытания — в лабораториях, аккредитованных в национальной системе аккредитации.</p></li>
    </ul>`,
      }),
      `<section id="gde" class="section" aria-labelledby="gde-title">
  <div class="container two-col">
    <h2 id="gde-title" class="h2 reveal">Где мы</h2>
    <p class="statement-text reveal">Новосибирская область. С производствами Сибири можем работать очно. С клиентами по всей России — онлайн, документы через ЭДО и почту.</p>
  </div>
</section>`,
      projectSection(""),
    ].join("\n"),
  ),
};

/* ================================================================ Оплата */
export const oplata: PageDoc = {
  path: "oplata.html",
  title: "Оплата услуг Proba Lab",
  description: "Как оплатить услуги Proba Lab: по счёту для компаний и ИП, порядок предоплаты, закрывающие документы.",
  nav: "none",
  ld: [ldCrumbs("Оплата", "oplata.html")],
  body: wrap(
    pageHero({
      crumbs: crumbs("Оплата"),
      h1: "Оплата",
      lead: "Как оплатить услуги Proba Lab: по счёту для компаний и ИП, порядок предоплаты, закрывающие документы.",
      ctas: [
        { label: "Обсудить задачу", href: "kontakty.html#project-form" },
        { label: "Публичная оферта", href: "oferta.html" },
      ],
    }),
    [
      section({
        id: "schet",
        title: "Как мы выставляем счёт",
        body: `<ol class="card-grid is-numbered">
      <li class="card glass-light reveal"><span class="card-n" aria-hidden="true">01</span><p>Вы оставляете заявку, мы уточняем задачу.</p></li>
      <li class="card glass-light reveal"><span class="card-n" aria-hidden="true">02</span><p>Согласуем объём, стоимость и срок — письменно, до начала работ.</p></li>
      <li class="card glass-light reveal"><span class="card-n" aria-hidden="true">03</span><p>Выставляем счёт. Оплата счёта означает согласие с <a class="text-link" href="oferta.html">публичной офертой</a>, если отдельный договор не заключался.</p></li>
    </ol>`,
      }),
      section({
        id: "poryadok",
        title: "Порядок оплаты",
        body: `<ul class="rows">
      <li class="reveal"><h3>Фиксированные пакеты</h3><p>Например, «Предложение для одного продукта», разбор процесса, проверка этикетки — 100% предоплата.</p></li>
      <li class="reveal"><h3>Проекты</h3><p>50% аванс до начала работ, 50% после подписания акта. Для длинных проектов возможна оплата по этапам.</p></li>
      <li class="reveal"><h3>Сопровождение</h3><p>Ежемесячно, предоплата за месяц.</p></li>
      <li class="reveal"><h3>Внешние расходы</h3><p>Госпошлины, лабораторные испытания, экспертиза, лицензии сервисов указываются в смете отдельными строками. Оплачиваются по факту или по счетам третьих лиц — как согласуем в смете.</p></li>
    </ul>`,
      }),
      `<section id="sposoby" class="section info-section" aria-label="Способы оплаты и закрывающие документы">
  <div class="container">
    <div class="info-panel glass-light reveal" style="--cols:2">
      <div class="info-block"><h2 class="info-title">Способы оплаты</h2><ul class="check-list">
        <li>Безналичный перевод по счёту для организаций и индивидуальных предпринимателей.</li>
        <li>Для физических лиц — по счёту после подключения онлайн-кассы.</li>
      </ul></div>
      <div class="info-block"><h2 class="info-title">Закрывающие документы</h2><p>Счёт, акт об оказании услуг. Обмен документами — по электронной почте или через ЭДО.</p></div>
    </div>
  </div>
</section>`,
      `<section id="rekvizity" class="section" aria-labelledby="rekvizity-title">
  <div class="container two-col">
    <h2 id="rekvizity-title" class="h2 reveal">Реквизиты для оплаты</h2>
    <div class="req-card glass-light">${requisites(false)}</div>
  </div>
</section>`,
      `<section id="vozvrat" class="section" aria-labelledby="vozvrat-title">
  <div class="container two-col">
    <h2 id="vozvrat-title" class="h2 reveal">Возврат</h2>
    <p class="statement-text statement-sm reveal">Если работа по предоплате не начата, возвращаем оплату полностью. Если начата — за вычетом стоимости выполненной части и понесённых внешних расходов (см. <a class="text-link" href="oferta.html#p7">оферту, раздел 7</a>).</p>
  </div>
</section>`,
    ].join("\n"),
  ),
};

/* ================================================================ Контакты */
export const kontakty: PageDoc = {
  path: "kontakty.html",
  title: "Контакты Proba Lab",
  description: "Телефон, почта и адрес Proba Lab. Новосибирская область, работаем онлайн по всей России.",
  nav: "none",
  ld: [
    ldCrumbs("Контакты", "kontakty.html"),
    { "@context": "https://schema.org", "@type": "LocalBusiness", name: "Proba Lab", ...companyLd(), areaServed: "RU" },
  ],
  body: wrap(
    pageHero({
      crumbs: crumbs("Контакты"),
      h1: "Контакты",
      lead: "Как быстрее: оставьте заявку на сайте — мы ответим на почту или в мессенджер, который вы укажете.",
      ctas: [
        { label: "Оставить заявку", href: "#project-form" },
        { label: COMPANY.phone, href: COMPANY.phoneHref },
      ],
    }),
    [
      `<section id="svyaz" class="section" aria-labelledby="svyaz-title">
  <div class="container two-col">
    <h2 id="svyaz-title" class="h2 reveal">Связаться</h2>
    <dl class="contact-list">
      <div><dt>Телефон</dt><dd><a href="${COMPANY.phoneHref}">${COMPANY.phone}</a></dd></div>
      <div><dt>Почта</dt><dd><a href="mailto:${COMPANY.email}">${COMPANY.email}</a></dd></div>
      <div><dt>Адрес</dt><dd>${COMPANY.address.full}</dd></div>
      <div><dt>География</dt><dd>Новосибирская область — очно, вся Россия — онлайн.</dd></div>
    </dl>
  </div>
</section>`,
      `<section id="rekvizity" class="section" aria-labelledby="rekvizity-title">
  <div class="container two-col">
    <h2 id="rekvizity-title" class="h2 reveal">Реквизиты</h2>
    <div class="req-card glass-light">${requisites(true)}</div>
  </div>
</section>`,
      projectSection(""),
    ].join("\n"),
  ),
};

/* ================================================================ Партнёрам */
export const partneram: PageDoc = {
  path: "partneram.html",
  title: "Партнёрам Proba Lab: контрактным производствам, лабораториям, дизайнерам",
  description: "Работаем с контрактными производствами, лабораториями и специалистами, которые помогают брендам БАД и косметики. Условия — по договору.",
  nav: "none",
  ld: [ldCrumbs("Партнёрам", "partneram.html")],
  body: wrap(
    pageHero({
      crumbs: crumbs("Партнёрам"),
      h1: "Партнёрам",
      lead: "Новому бренду нужно сразу многое: производство, документы, упаковка, продажи. Ни одна компания не делает всё сама. Мы ищем партнёров, с которыми клиент получает понятный путь — без лишних передач и противоречий.",
      ctas: [{ label: "Предложить партнёрство", href: "#partner-form" }],
    }),
    [
      section({
        id: "s-kem",
        title: "С кем работаем",
        body: `<ul class="rows">
      <li class="reveal"><h3>Контрактные производства БАД и косметики</h3><p>Вашему клиенту нужны позиционирование, упаковка с проверкой формулировок, карточки, сайт. Мы делаем то, чего нет в вашем пакете, и не забираем производство.</p></li>
      <li class="reveal"><h3>Лаборатории</h3><p>Аккредитованные в национальной системе аккредитации. Подбираем лабораторию по области аккредитации под программу испытаний клиента.</p></li>
      <li class="reveal"><h3>Регистраторы и центры сертификации</h3><p>Вашим клиентам после регистрации нужны этикетка и карточка, совпадающие с документами.</p></li>
      <li class="reveal"><h3>Дизайнеры, фотографы, разработчики</h3><p>С опытом в БАД, косметике или e-commerce.</p></li>
    </ul>`,
      }),
      section({
        id: "kak-ustroeno",
        title: "Как устроено",
        body: `<ol class="reg-steps">
      <li><span class="reg-step-n" aria-hidden="true">01</span><span class="reg-step-text">Знакомимся и договариваемся, какие задачи передаём друг другу.</span></li>
      <li><span class="reg-step-n" aria-hidden="true">02</span><span class="reg-step-text">Клиент сам решает, работать ли с партнёром. Контакты передаём только с его согласия.</span></li>
      <li><span class="reg-step-n" aria-hidden="true">03</span><span class="reg-step-text">Роли и договоры — прозрачны для клиента: он знает, кто что делает.</span></li>
      <li><span class="reg-step-n" aria-hidden="true">04</span><span class="reg-step-text">Вознаграждение за рекомендацию — по договору.</span></li>
    </ol>`,
      }),
      `<section id="ne-delaem" class="section" aria-labelledby="ne-delaem-title">
  <div class="container two-col">
    <h2 id="ne-delaem-title" class="h2 reveal">Чего не делаем</h2>
    <p class="statement-text reveal">Не продаём базы клиентов, не размещаем скрытую рекламу, не рекомендуем партнёров, в которых не уверены.</p>
  </div>
</section>`,
      partnerSection(),
    ].join("\n"),
  ),
};

/* ================================================================ Благотворительность */
export const blagotvoritelnost: PageDoc = {
  path: "blagotvoritelnost.html",
  title: "Благотворительность и pro bono — Proba Lab",
  description: "Бесплатно помогаем некоммерческим организациям и социальным проектам разобраться с документами и понятно рассказать о своей работе.",
  nav: "none",
  ld: [ldCrumbs("Благотворительность", "blagotvoritelnost.html")],
  body: wrap(
    pageHero({
      crumbs: crumbs("Благотворительность"),
      h1: "Pro bono: помогаем бесплатно, когда это важно",
      lead: "Мы врачи и маркетологи по опыту, и часть нашего времени отдаём проектам, которые помогают людям, а не зарабатывают.",
      ctas: [{ label: "Подать заявку", href: "#probono-form" }],
    }),
    [
      section({
        id: "predlagaem",
        title: "Что предлагаем",
        body: `<ul class="rows">
      <li class="reveal"><h3>Некоммерческим организациям пациентов и социальным проектам</h3><p>Бесплатная консультация — как понятно и честно рассказать о проекте, как оформить материалы для сбора средств или партнёров.</p></li>
      <li class="reveal"><h3>Социальным предприятиям</h3><p>Выпускающим пищевую продукцию или косметику: бесплатная проверка состава и этикетки.</p></li>
      <li class="reveal"><h3>Объём</h3><p>До одного проекта в месяц — чтобы делать хорошо, а не обещать много.</p></li>
    </ul>`,
      }),
      `<section id="ne-delaem" class="section" aria-labelledby="ne-delaem-title">
  <div class="container two-col">
    <h2 id="ne-delaem-title" class="h2 reveal">Чего не делаем</h2>
    <p class="statement-text reveal">Не берём проекты, которые обещают лечение или собирают деньги без прозрачной отчётности.</p>
  </div>
</section>`,
      probonoSection(),
    ].join("\n"),
  ),
};

/* ================================================================ Новости */
const NEWS_PAGE = "novosti";
interface News {
  date: string;
  iso: string;
  title: string;
  text: string;
  /** Регуляторная новость: метки источников, пометка «Проверяется» до сверки партнёром. */
  reg?: boolean;
}
const NEWS: News[] = [
  {
    date: "Октябрь 2026",
    iso: "2026-10",
    title: "Запустили раздел «Документы и соответствие».",
    text: 'Регистрация БАД, декларации, требования к производству и лабораторные испытания — вместе с этикеткой и карточкой. <a class="text-link" href="dokumenty/index.html#quiz">Квиз «Какой документ нужен вашему продукту»</a> помогает понять порядок шагов до разговора с нами.',
  },
  {
    date: "Октябрь 2026",
    iso: "2026-10",
    title: f("tr009-74", "Изменения для косметики с 28 октября 2026 года."),
    text: f("tr009-74", "Решением Совета ЕЭК № 74 изменены перечни запрещённых и ограниченных веществ в техрегламенте на косметику (ТР ТС 009).") + " Если вы выпускаете косметику, проверьте состав.",
    reg: true,
  },
  {
    date: "Октябрь 2026",
    iso: "2026-10",
    title: f("law-290", "Продажа БАД на маркетплейсах с 1 октября 2026 года."),
    text: f("law-290", "Вступили в силу нормы, запрещающие предлагать к продаже БАД без государственной регистрации (ст. 11.1 закона о торговле в редакции 290-ФЗ).") + " Карточка должна совпадать со свидетельством о регистрации.",
    reg: true,
  },
  {
    date: "14 мая 2026",
    iso: "2026-05-14",
    title: "Зарегистрировано ИП Коптелин И. А.",
    text: "Юридическое лицо, через которое работает Proba Lab.",
  },
];

export const novosti: PageDoc = {
  path: "novosti.html",
  title: "Новости Proba Lab и изменения для рынка БАД и косметики",
  description: "Новости Proba Lab и важные изменения в требованиях к БАД и косметике.",
  nav: "none",
  ld: [ldCrumbs("Новости", "novosti.html")],
  get body() {
    const item = (n: News, i: number) => {
      const title = n.reg ? factText(NEWS_PAGE, n.title, "news") : n.title;
      const text = n.reg ? factText(NEWS_PAGE, n.text, "news") : n.text;
      return `<li class="news-item reveal">
        <p class="news-meta"><time datetime="${n.iso}">${n.date}</time>${n.reg ? '<span class="tag">Проверяется</span>' : ""}</p>
        <h2 class="news-title" id="n${i + 1}">${title}</h2>
        <p class="news-text">${text}</p>
      </li>`;
    };
    return wrap(
      pageHero({
        crumbs: crumbs("Новости"),
        h1: "Новости",
        lead: "Новости Proba Lab и важные изменения в требованиях к БАД и косметике.",
        ctas: [
          { label: "Проверить состав бесплатно", href: QUIZ_HREF },
          { label: "Блог", href: "blog/index.html" },
        ],
      }),
      `<section class="section" aria-label="Новости">
  <div class="container">
    <ol class="news-list">${NEWS.map(item).join("")}</ol>
    <p class="note">Регуляторные новости отмечены «Проверяется», пока их не сверил специалист-партнёр.</p>
  </div>
</section>`,
    );
  },
};

export const COMPANY_PAGES = [oNas, oplata, kontakty, partneram, blagotvoritelnost, novosti];
