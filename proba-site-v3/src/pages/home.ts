// Главная. Тексты — site-v3-vision.md §4.1; блоки «Проблема», «Бесплатный разбор», демо D3, «Кто работает»,
// «Вопросы» и форма — из v6 (proba-site-v2/src/body.html) без изменений.
import { projectSection, reviewSection } from "../forms";
import { faqLd, keepLast, QUIZ_HREF, type PageDoc } from "../layout";

const FAQ = [
  { q: "Что я получу в итоге?", a: "Материалы в согласованном формате — разбор, тексты, макеты, работающую страницу или настроенный процесс — и пояснения, на чём основаны ключевые решения." },
  { q: "Какие материалы нужны от нас?", a: "Ссылка на продукт, состав и имеющиеся документы, фотографии; для партнёрских материалов — ваши условия. Доступ к кабинету продавца не нужен." },
  { q: "Как считается стоимость?", a: "Пакет для одного продукта — фиксированная цена. Остальное оцениваем после разговора о задаче и называем до начала работы." },
];

const hero = `<section id="top" class="hero grain" aria-labelledby="hero-title">
  <div class="hero-bg" aria-hidden="true"></div>
  <div class="container hero-grid">
    <div class="hero-copy">
      <p class="eyebrow">Для производителей и брендов БАД и косметики</p>
      <h1 id="hero-title" class="h1">${keepLast("Выпустим продукт на рынок — законно и так, чтобы его выбирали")}</h1>
      <p class="hero-lead">Документы, упаковка, продвижение и аналитика в одной команде. Начинаем с того, без чего продавать нельзя, и сразу делаем этикетку и карточку, которые не придётся переделывать.</p>
      <div class="hero-actions">
        <a class="btn btn-primary btn-lg" href="${QUIZ_HREF}" data-primary-cta>Проверить состав бесплатно</a>
        <a class="btn btn-ghost btn-lg" href="#review">Разбор продукта</a>
      </div>
    </div>

    <figure class="sample glass" aria-labelledby="sample-title">
      <div class="sample-head">
        <span class="sample-title" id="sample-title">Разбор · витамин D3 для взрослых</span>
        <span class="tag">Демонстрационный пример</span>
      </div>
      <div class="table-scroll">
        <table class="compare">
          <thead>
            <tr><th scope="col">Вопрос покупателя</th><th scope="col" class="is-you">Ваш продукт</th><th scope="col">Аналог А</th><th scope="col">Аналог Б</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row">Зачем мне это?</th><td class="is-you"><span class="mark mark-ok">Понятно</span></td><td><span class="mark mark-ok">Понятно</span></td><td><span class="mark mark-ok">Понятно</span></td></tr>
            <tr><th scope="row">Чем отличается?</th><td class="is-you"><span class="mark mark-q">Не видно</span></td><td><span class="mark mark-ok">Доза 2000&nbsp;МЕ</span></td><td><span class="mark mark-q">Не видно</span></td></tr>
            <tr><th scope="row">Почему такая цена?</th><td class="is-you"><span class="mark mark-q">Неясно</span></td><td><span class="mark mark-q">Неясно</span></td><td><span class="mark mark-ok">Курс на 6&nbsp;мес.</span></td></tr>
          </tbody>
        </table>
      </div>
      <div class="edit" data-edit>
        <p class="edit-label">Предлагаемая правка заголовка карточки</p>
        <p class="edit-before"><s>Витамин D3 Premium — лучшая формула для здоровья</s></p>
        <p class="edit-after">Витамин D3 2000&nbsp;МЕ — капсула в день, упаковки хватает на 4&nbsp;месяца</p>
        <p class="edit-why">Почему: дозировку уже показывает аналог А, срок курса — аналог Б. Ваш заголовок отвечает на оба вопроса и объясняет цену через длительность курса.</p>
        <button class="edit-replay" type="button" data-edit-replay>Показать правку ещё раз</button>
      </div>
    </figure>
  </div>
</section>`;

const STEPS = [
  { t: "Документы.", d: "Регистрация, декларации, требования к производству, испытания.", links: [["dokumenty/index.html", "Документы"]] },
  { t: "Предложение и упаковка.", d: "Этикетка, карточка и сайт объясняют, зачем выбирать продукт, и совпадают с документами.", links: [["marketing.html", "Маркетинг"]] },
  { t: "Продвижение.", d: "Сайт находят в поиске, карточки — на маркетплейсах, партнёры получают материалы.", links: [["prodvizhenie.html", "Продвижение"]] },
  { t: "Аналитика и аудит.", d: "Видно, откуда приходят заявки и где теряются деньги.", links: [["analitika.html", "Аналитика"], ["audit-prodazh.html", "Аудит продаж"]] },
];

const path = `<section id="put" class="section path-section" aria-labelledby="put-title">
  <div class="container">
    <div class="section-head is-split reveal">
      <h2 id="put-title" class="h2">${keepLast("Один путь от состава до продаж")}</h2>
      <p class="lead">Можно начать с любого шага. Если документы уже есть, начинаем с предложения.</p>
    </div>
    <ol class="path">
      ${STEPS.map(
        (s, i) => `<li class="path-step reveal">
        <span class="path-n" aria-hidden="true">0${i + 1}</span>
        <h3><span class="visually-hidden">${i + 1}. </span>${s.t.replace(/\.$/, "")}</h3>
        <p>${s.d}</p>
        <p class="path-links">${s.links.map(([h, l]) => `<a class="arrow-link" href="${h}">${l}<span class="arrow" aria-hidden="true"></span></a>`).join("")}</p>
      </li>`,
      ).join("\n      ")}
    </ol>
  </div>
</section>`;

const problem = `<section class="section problem" aria-labelledby="problem-title">
  <div class="container two-col">
    <h2 id="problem-title" class="h2 reveal">${keepLast("Вы знаете свой продукт. Покупатель видит его несколько секунд.")}</h2>
    <div class="problem-text">
      <p>Состав, технология и производство могут быть важны. Но сначала покупатель хочет понять, зачем ему продукт, чем он отличается и почему стоит своей цены.</p>
      <p class="problem-accent">Если отличия не объяснены, выбирают по цене, отзывам и знакомому названию. Перед новым дизайном или рекламой стоит проверить само предложение.</p>
    </div>
  </div>
</section>`;

const DIRS = [
  ["dokumenty/index.html", "Документы", "Продукт можно законно продавать"],
  ["marketing.html", "Маркетинг", "Покупатель понимает, зачем ему продукт"],
  ["prodvizhenie.html", "Продвижение", "Продукт находят там, где его ищут"],
  ["analitika.html", "Аналитика", "Видно, какие каналы приносят заявки"],
  ["audit-prodazh.html", "Аудит продаж", "Понятно, где теряются покупатели и деньги"],
  ["avtomatizaciya.html", "Автоматизация", "Меньше ручной работы с заявками и заказами"],
];

const directions = `<section id="napravleniya" class="section" aria-labelledby="napravleniya-title">
  <div class="container">
    <div class="section-head reveal"><h2 id="napravleniya-title" class="h2">Направления</h2></div>
    <ul class="dir-grid">
      ${DIRS.map(([h, t, d]) => `<li class="reveal"><a class="dir-card glass-light" href="${h}"><span class="dir-title">${t}</span><span class="dir-text">${d}</span><span class="arrow" aria-hidden="true"></span></a></li>`).join("\n      ")}
    </ul>
  </div>
</section>`;

const how = `<section id="kak" class="section" aria-labelledby="kak-title">
  <div class="container">
    <div class="section-head is-split reveal">
      <h2 id="kak-title" class="h2">Как мы работаем</h2>
      <p class="lead-link"><a class="arrow-link" href="kak-my-rabotaem.html">Подробнее о ролях и договорах<span class="arrow" aria-hidden="true"></span></a></p>
    </div>
    <ul class="principles">
      <li class="reveal"><h3>Смета до начала.</h3><p>Работа, внешние расходы и сроки — отдельными строками.</p></li>
      <li class="reveal"><h3>Честные сроки.</h3><p>Срок ведомства отдельно от срока проекта.</p></li>
      <li class="reveal"><h3>Без обещаний, которые нельзя проверить.</h3><p>Не гарантируем регистрацию и рост продаж — показываем, как замерим результат.</p></li>
    </ul>
  </div>
</section>`;

export const team = `<section id="team" class="section team" aria-labelledby="team-title">
  <div class="container two-col">
    <h2 id="team-title" class="h2 reveal">${keepLast("Кто работает над вашей задачей")}</h2>
    <div class="team-text">
      <p><b>Основатель — врач</b> с опытом научных исследований и B2B-продаж медицинской продукции. Разбирается, на что опираются заявления о продукте и где у них границы: исследования ингредиента ещё не доказывают эффективность готового продукта.</p>
      <p><b>Дизайнеры и разработчики</b> превращают выводы в карточки, сайты и презентации, а также связывают сайт и формы с системами, в которых работает ваша команда, — включая интеграции и AI-инструменты там, где они оправданы.</p>
    </div>
  </div>
</section>`;

const faq = `<section id="faq" class="section faq" aria-labelledby="faq-title">
  <div class="container faq-grid">
    <h2 id="faq-title" class="h2 reveal">Вопросы</h2>
    <div class="faq-list">
      ${FAQ.map((x) => `<details><summary>${x.q}</summary><div class="details-body"><p>${x.a}</p></div></details>`).join("\n      ")}
    </div>
  </div>
</section>`;

const DESCRIPTION = "Документы, упаковка, продвижение и аналитика в одной команде — для производителей и брендов БАД и косметики.";

export const home: PageDoc = {
  path: "index.html",
  title: "Proba Lab — вывод БАД и косметики на рынок",
  description: DESCRIPTION,
  nav: "home",
  bodyClass: "page page-home",
  ld: [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Proba Lab",
      description: DESCRIPTION,
      knowsAbout: ["Регистрация БАД", "Документы на косметику", "Маркетинг", "Продвижение", "Веб-аналитика", "Аудит продаж"],
    },
    faqLd(FAQ),
  ],
  body: `${hero}
<div class="light">
${path}
${problem}
${reviewSection()}
${directions}
${how}
${team}
${faq}
${projectSection("")}
</div>`,
};

