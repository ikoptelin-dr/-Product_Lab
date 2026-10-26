// Формы v6 (разметка без изменений текстов): «Заявка на разбор», «Обсудить задачу», «Опишите процесс».
// Прототип: проверка локально в assets/site.js, без отправки и без хранилища браузера.
import { PRICES, TASKS } from "./data";
import { esc, nb } from "./layout";

export const CONSENT = `<label class="consent"><input type="checkbox" name="consent"><span>Согласен на обработку персональных данных для ответа на заявку</span></label>`;
export const STATUS = `<p class="form-status" role="status" aria-live="polite"></p>`;

/** Бесплатный разбор: блок и форма v6 (без демо-иллюстраций). */
export function reviewSection() {
  return `<section id="review" class="section review" aria-labelledby="review-title">
  <div class="container two-col">
    <div class="review-copy">
      <p class="eyebrow">Бесплатно</p>
      <h2 id="review-title" class="h2">Ваш продукт глазами покупателя</h2>
      <ol class="steps-list">
        <li><b>Ваше предложение рядом с двумя сопоставимыми аналогами</b></li>
        <li><b>Вопрос покупателя,</b> на который материалы пока не отвечают</li>
        <li><b>Вариант заголовка или схема первого экрана</b> с пояснением</li>
      </ol>
      <div class="review-notes">
        <p class="muted">Если существенной проблемы не увидим — так и скажем.</p>
        <p class="muted">Три рабочих дня после подтверждения заявки. Результат пришлём без обязательного созвона.</p>
      </div>
    </div>

    <form id="review-form" class="form-card glass-light" novalidate data-form="review" aria-labelledby="review-form-title">
      <p class="form-title" id="review-form-title">Заявка на разбор</p>
      <div class="field">
        <label for="rv-url">Ссылка на продукт</label>
        <input id="rv-url" name="productUrl" inputmode="url" autocomplete="url" placeholder="ozon.ru/product/…" aria-describedby="rv-url-hint">
        <p class="hint" id="rv-url-hint">Карточка на маркетплейсе или страница сайта</p>
      </div>
      <div class="field">
        <label for="rv-contact">Контакт для ответа</label>
        <input id="rv-contact" name="contact" autocomplete="off" placeholder="Email, телефон или Telegram">
      </div>
      <fieldset class="field" data-required-group="category">
        <legend>Категория</legend>
        <div class="choice-row">
          <label class="choice"><input type="radio" name="category" value="БАД"><span>БАД</span></label>
          <label class="choice"><input type="radio" name="category" value="Косметика"><span>Косметика</span></label>
          <label class="choice"><input type="radio" name="category" value="Другое"><span>Другое</span></label>
        </div>
      </fieldset>
      ${CONSENT}
      <button class="btn btn-primary btn-lg btn-block" type="submit">Получить бесплатный разбор</button>
      ${STATUS}
    </form>
  </div>
</section>`;
}

/** «Обсудить задачу»: форма v6, задача выбрана заранее (preselect — id из TASKS). */
export function projectSection(preselect = "", o: { title?: string; lead?: string } = {}) {
  if (preselect && !TASKS.some((t) => t.id === preselect)) throw new Error(`Нет задачи ${preselect} в TASKS`);
  const options = TASKS.map(
    (t) => `<label class="choice"><input type="radio" name="task" value="${t.id}"${t.id === preselect ? " checked" : ""}><span>${esc(nb(t.label))}</span></label>`,
  ).join("");
  return `<section id="project-form" class="section project-form" aria-labelledby="pf-title">
  <div class="container two-col">
    <div class="pf-copy">
      <h2 id="pf-title" class="h2" data-pf-title>${o.title ?? "Обсудить задачу"}</h2>
      <p class="lead" data-pf-lead>${o.lead ?? "Расскажите, что нужно сделать. Уточним объём и предложим состав работ."}</p>
    </div>
    <form id="pf-form" class="form-card glass-light" novalidate data-form="project" aria-labelledby="pf-title">
      <fieldset class="field" data-required-group="task">
        <legend>Задача</legend>
        <div class="choice-col">${options}</div>
      </fieldset>
      <fieldset class="field" data-show-for="promo" hidden>
        <legend>Что может понадобиться <span class="opt">необязательно</span></legend>
        <div class="choice-row">
          <label class="choice"><input type="checkbox" name="needs" value="Предложение и аргументы"><span>Предложение и аргументы</span></label>
          <label class="choice"><input type="checkbox" name="needs" value="Сайт или лендинг" data-site><span>Сайт или лендинг</span></label>
          <label class="choice"><input type="checkbox" name="needs" value="Карточки товаров"><span>Карточки товаров</span></label>
          <label class="choice"><input type="checkbox" name="needs" value="Фото и видео"><span>Фото и видео</span></label>
          <label class="choice"><input type="checkbox" name="needs" value="SEO" data-site><span>SEO</span></label>
          <label class="choice"><input type="checkbox" name="needs" value="Материалы для размещений"><span>Материалы для размещений</span></label>
        </div>
      </fieldset>
      <fieldset class="field" data-has-site hidden>
        <legend>Сайт уже есть?</legend>
        <div class="choice-row">
          <label class="choice"><input type="radio" name="hasSite" value="Есть"><span>Есть</span></label>
          <label class="choice"><input type="radio" name="hasSite" value="Нет"><span>Нет</span></label>
        </div>
      </fieldset>
      <p class="pf-package-note" data-show-for="package" hidden>Материалы и срок согласуем до начала работы. Оплата — после согласования.</p>
      <div class="field">
        <label for="pf-details" data-details-label>Коротко о задаче <span class="opt">необязательно</span></label>
        <textarea id="pf-details" name="details" rows="3" data-details placeholder="Например: обновить карточки к запуску новой линейки"></textarea>
      </div>
      <div class="field-row">
        <div class="field">
          <label for="pf-url">Ссылка на продукт или сайт <span class="opt">необязательно</span></label>
          <input id="pf-url" name="productUrl" inputmode="url" autocomplete="url" placeholder="example.com">
        </div>
        <div class="field" data-term>
          <label for="pf-term">Желаемый срок</label>
          <select id="pf-term" name="term"><option value="">Не важно</option><option value="month">В течение месяца</option><option value="1-3">1–3 месяца</option><option value="later">Позже</option></select>
        </div>
      </div>
      <div class="field">
        <label for="pf-contact">Контакт для ответа</label>
        <input id="pf-contact" name="contact" autocomplete="off" placeholder="Email, телефон или Telegram">
      </div>
      ${CONSENT}
      <button class="btn btn-primary btn-lg btn-block" type="submit" data-pf-submit>Отправить</button>
      ${STATUS}
    </form>
  </div>
</section>`;
}

/** «Опишите процесс» — форма вида «Автоматизация» v6. */
export function automationSection() {
  return `<section id="auto-form" class="section project-form" aria-labelledby="af-title">
  <div class="container two-col">
    <div class="pf-copy">
      <h2 id="af-title" class="h2">Опишите процесс</h2>
      <p class="lead">Достаточно пары предложений — уточним детали в разговоре.</p>
    </div>
    <form id="af-form" class="form-card glass-light" novalidate data-form="automation" aria-labelledby="af-title">
      <div class="field">
        <label for="af-process">Какой процесс мешает</label>
        <textarea id="af-process" name="process" rows="3" placeholder="Например: заказы аптек приходят в мессенджер, менеджер переносит их в учётную систему"></textarea>
      </div>
      <div class="field">
        <label for="af-where">Где сейчас ведёте заявки <span class="opt">необязательно</span></label>
        <select id="af-where" name="where"><option value="">Не выбрано</option><option value="crm">CRM</option><option value="sheets">Таблицы</option><option value="messengers">Мессенджеры и почта</option><option value="erp">Учётная система</option><option value="other">Другое</option></select>
      </div>
      <div class="field">
        <label for="af-contact">Контакт для ответа</label>
        <input id="af-contact" name="contact" autocomplete="off" placeholder="Email, телефон или Telegram">
      </div>
      ${CONSENT}
      <button class="btn btn-primary btn-lg btn-block" type="submit">Описать процесс</button>
      ${STATUS}
    </form>
  </div>
</section>`;
}

export const PRICE = { start: nb(PRICES.start), prep: nb(PRICES.promoPrep), support: nb(PRICES.promoSupport) };
