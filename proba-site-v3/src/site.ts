// Общий скрипт всех страниц v3 (assets/site.js). Перенесён из v2: src/app.ts (меню, форма задачи, правка в демо)
// и src/regulatory/section.ts (квиз, форма раздела). Формы — прототип: проверка локально, без отправки и без хранилища.
import { PRICES } from "./data";
import { stripFacts } from "./regulatory/mark";
import { quizResult, type Channel, type CosmGroup, type Production, type ProductType, type QuizItem } from "./regulatory/quiz";
import { normalizeUrl } from "./url";

const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => Array.from(r.querySelectorAll<T>(s));
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const EASE = "cubic-bezier(.2,.8,.2,1)";
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* ---------------- Шапка и мобильное меню ---------------- */
function header() {
  const h = $(".site-header")!;
  const paint = () => h.classList.toggle("is-scrolled", scrollY > 8);
  addEventListener("scroll", paint, { passive: true });
  paint();
  const btn = $<HTMLButtonElement>(".menu-toggle")!;
  const menu = $("#mobile-menu")!;
  const set = (open: boolean) => {
    menu.hidden = !open;
    h.classList.toggle("menu-open", open);
    btn.setAttribute("aria-expanded", String(open));
    btn.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
    document.body.style.overflow = open ? "hidden" : "";
    if (open) $<HTMLElement>("a", menu)?.focus();
  };
  btn.addEventListener("click", () => set(menu.hidden));
  menu.addEventListener("click", (e) => (e.target as HTMLElement).closest("a") && set(false));
  addEventListener("resize", () => !menu.hidden && innerWidth >= 1120 && set(false));
  addEventListener("keydown", (e) => {
    if (menu.hidden) return;
    if (e.key === "Escape") {
      set(false);
      btn.focus();
    }
    if (e.key === "Tab") {
      // Удерживаем фокус внутри открытого меню (кнопка закрытия + ссылки)
      const items = [btn, ...$$<HTMLElement>("a", menu)];
      const i = items.indexOf(document.activeElement as HTMLElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); items[items.length - 1]!.focus(); }
      else if (!e.shiftKey && (i === items.length - 1 || i === -1)) { e.preventDefault(); items[0]!.focus(); }
    }
  });
}

/* ---------------- Плавное раскрытие <details> ---------------- */
function smoothDetails() {
  for (const d of $$<HTMLDetailsElement>("details")) {
    const summary = $("summary", d)!;
    const body = summary.nextElementSibling as HTMLElement | null;
    if (!body) continue;
    summary.addEventListener("click", (e) => {
      if (reduced()) return;
      e.preventDefault();
      if (d.open) {
        const h = body.offsetHeight;
        body.animate([{ height: `${h}px`, opacity: 1 }, { height: "0px", opacity: 0 }], { duration: 240, easing: EASE }).onfinish = () => (d.open = false);
      } else {
        d.open = true;
        const h = body.offsetHeight;
        body.animate([{ height: "0px", opacity: 0 }, { height: `${h}px`, opacity: 1 }], { duration: 300, easing: EASE });
      }
    });
  }
}

/** Прокрутить к блоку и перевести фокус на его заголовок. */
function focusSection(section: HTMLElement | null, heading: HTMLElement | null) {
  section?.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
  if (heading) {
    if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
    heading.focus({ preventScroll: true });
  }
}

/* ---------------- Форма задачи: выбор, условные поля, режим пакета ---------------- */
function projectForm() {
  const form = $<HTMLFormElement>("#pf-form");
  if (!form) return;
  const title = $("[data-pf-title]")!, lead = $("[data-pf-lead]")!, submit = $<HTMLButtonElement>("[data-pf-submit]", form)!;
  const details = $<HTMLTextAreaElement>("[data-details]", form)!, detailsLabel = $("[data-details-label]", form)!;
  const term = $("[data-term]", form)!;
  const texts = {
    title: title.textContent!, lead: lead.textContent!, submit: submit.textContent!,
    detailsLabel: detailsLabel.innerHTML, placeholder: details.placeholder,
  };

  const sync = () => {
    const task = form.querySelector<HTMLInputElement>('input[name="task"]:checked')?.value ?? "";
    for (const el of $$<HTMLElement>("[data-show-for]", form)) el.hidden = el.dataset.showFor !== task;
    const needsSite = task === "promo" && $$<HTMLInputElement>("input[data-site]", form).some((c) => c.checked);
    $<HTMLElement>("[data-has-site]", form)!.hidden = !needsSite;
    const pkg = task === "package";
    title.textContent = pkg ? `Заявка на пакет — ${PRICES.start}` : texts.title;
    lead.textContent = pkg ? "Расскажите о продукте. Материалы и срок согласуем до начала работы." : texts.lead;
    submit.textContent = pkg ? "Оставить заявку на пакет" : texts.submit;
    term.hidden = pkg;
    if (task === "automation") {
      detailsLabel.innerHTML = 'Какой процесс мешает <span class="opt">необязательно</span>';
      details.placeholder = "Например: заказы аптек приходят в мессенджер, менеджер переносит их вручную";
    } else if (pkg) {
      detailsLabel.innerHTML = 'Коротко о продукте <span class="opt">необязательно</span>';
      details.placeholder = "Например: витамин D3, продаём на Ozon и в аптеках";
    } else {
      detailsLabel.innerHTML = texts.detailsLabel;
      details.placeholder = texts.placeholder;
    }
  };
  form.addEventListener("change", sync);

  // Кнопки задач: выбрать задачу и прокрутить к форме
  document.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-task]");
    if (!btn) return;
    e.preventDefault();
    const radio = form.querySelector<HTMLInputElement>(`input[name="task"][value="${btn.dataset.task}"]`);
    if (radio) radio.checked = true;
    sync();
    clearErrors(form);
    focusSection($("#project-form"), $("#pf-title"));
  });
  sync();
}

/* ---------------- Раздел «Документы»: переход к форме с выбранной услугой ---------------- */
function goToForm(need?: string, category?: string) {
  const form = $<HTMLFormElement>("#reg-form");
  if (!form) return;
  if (need) {
    const sel = $<HTMLSelectElement>('[name="need"]', form)!;
    if ([...sel.options].some((o) => o.value === need)) sel.value = need;
  }
  if (category) {
    const r = $<HTMLInputElement>(`input[name="category"][value="${category}"]`, form);
    if (r) r.checked = true;
  }
  clearErrors(form);
  focusSection($("#form"), $("#form-title"));
}
function needButtons() {
  document.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>("[data-need]");
    if (!b) return;
    e.preventDefault();
    goToForm(b.dataset.need, b.dataset.category);
  });
}

/* ---------------- Квиз «Какой документ нужен» ---------------- */
function quiz() {
  const form = $<HTMLFormElement>("#quiz-form");
  const out = $("#quiz-result");
  if (!form || !out) return;
  const cosm = $("[data-cosm]", form)!;
  const status = $(".form-status", form)!;
  let shown = false;

  const item = (it: QuizItem) => `<li><a href="${esc(it.href)}">${esc(stripFacts(it.title))}</a><p>${esc(stripFacts(it.text))}</p></li>`;
  const read = () => {
    const fd = new FormData(form);
    return {
      type: (fd.get("type") as ProductType | null) ?? null,
      cosmGroup: (fd.get("cosmGroup") as CosmGroup | null) ?? undefined,
      production: (fd.get("production") as Production | null) ?? null,
      channels: fd.getAll("channels") as Channel[],
    };
  };
  const render = (focus: boolean) => {
    const a = read();
    for (const n of $$("[aria-invalid]", form)) n.removeAttribute("aria-invalid");
    if (!a.type || !a.production) {
      status.className = "form-status is-error";
      status.textContent = !a.type ? "Выберите тип продукта." : "Выберите, где производите.";
      $(`fieldset[data-required-group="${!a.type ? "type" : "production"}"]`, form)!.setAttribute("aria-invalid", "true");
      return;
    }
    status.textContent = "";
    status.className = "form-status";
    const r = quizResult({ type: a.type, cosmGroup: a.cosmGroup, production: a.production, channels: a.channels });
    out.dataset.code = r.code;
    out.classList.add("is-filled");
    out.innerHTML = `<p class="quiz-tag">Предварительно</p>
      <h3>Документы</h3><ul class="quiz-list">${r.documents.map(item).join("")}</ul>
      <h3>Связанные обязанности</h3><ul class="quiz-list">${r.obligations.map(item).join("")}</ul>
      <p class="quiz-caveat">Предварительно. Точно определим по составу.</p>
      ${r.stop ? `<p class="stop-line">${esc(r.stop)}</p>` : ""}
      <button class="btn btn-primary btn-lg btn-block" type="button" data-need="Определить, какой документ нужен" data-category="${esc(r.category)}">Проверить состав бесплатно</button>`;
    shown = true;
    if (focus) {
      const rect = out.getBoundingClientRect();
      if (rect.top < 0 || rect.top > innerHeight * 0.6) out.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
      if (!reduced()) $$("li, h3, .quiz-caveat", out).forEach((el, i) => el.animate([{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 320, delay: 30 * i, easing: EASE, fill: "backwards" }));
    }
  };
  form.addEventListener("change", (e) => {
    const t = e.target as HTMLInputElement;
    if (t.name === "type") {
      cosm.hidden = t.value !== "cosm";
      if (t.value !== "cosm") for (const r of $$<HTMLInputElement>('input[name="cosmGroup"]', form)) r.checked = false;
    }
    if (shown) render(false);
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    render(true);
  });
}

/* ---------------- Проверка форм (локально, без отправки) ---------------- */
function clearErrors(form: HTMLFormElement) {
  $$(".field-error", form).forEach((n) => n.remove());
  $$("[aria-invalid]", form).forEach((n) => n.removeAttribute("aria-invalid"));
  const status = $(".form-status", form);
  if (status) { status.textContent = ""; status.className = "form-status"; }
}

function forms() {
  for (const form of $$<HTMLFormElement>("form[data-form]")) {
    const status = $(".form-status", form)!;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      clearErrors(form);
      const fd = new FormData(form);
      const kind = form.dataset.form!;
      const errors: { name: string; msg: string }[] = [];

      if (kind === "reg" && !fd.get("category")) errors.push({ name: "category", msg: "Выберите категорию" });
      const urlInput = $<HTMLInputElement>('[name="productUrl"]', form);
      let norm: string | null = "";
      if (urlInput) {
        norm = normalizeUrl(urlInput.value);
        if (kind === "review" && !urlInput.value.trim()) errors.push({ name: "productUrl", msg: "Добавьте ссылку на продукт" });
        else if (norm === null) errors.push({ name: "productUrl", msg: "Проверьте адрес — например, ozon.ru/product/…" });
        else urlInput.value = norm;
      }
      if (kind === "reg") {
        if (String(fd.get("composition") || "").trim().length < 3 && !norm) errors.push({ name: "composition", msg: "Добавьте состав или ссылку на продукт" });
        if (!fd.get("need")) errors.push({ name: "need", msg: "Выберите, что нужно" });
      }
      if (kind === "review" && !fd.get("category")) errors.push({ name: "category", msg: "Выберите категорию" });
      if (kind === "project" && !fd.get("task")) errors.push({ name: "task", msg: "Выберите задачу" });
      if (kind === "automation" && String(fd.get("process") || "").trim().length < 10) errors.push({ name: "process", msg: "Опишите процесс в паре предложений" });
      if (String(fd.get("contact") || "").trim().length < 5) errors.push({ name: "contact", msg: "Укажите email, телефон или Telegram" });
      if (!fd.get("consent")) errors.push({ name: "consent", msg: "Нужно согласие на обработку данных" });

      for (const { name, msg } of errors) {
        const input = $<HTMLInputElement>(`[name="${name}"]`, form)!;
        const group = input.closest<HTMLElement>("fieldset[data-required-group]");
        const anchor = group ?? (input.type === "checkbox" ? input.closest(".consent")! : input);
        const p = document.createElement("p");
        p.className = "field-error";
        p.id = `${form.id}-${name}-err`;
        p.textContent = msg;
        anchor.insertAdjacentElement(group ? "beforeend" : "afterend", p);
        (group ?? input).setAttribute("aria-invalid", "true");
        input.setAttribute("aria-describedby", p.id);
      }
      if (errors.length) {
        status.className = "form-status is-error";
        status.textContent = "Проверьте отмеченные поля.";
        $<HTMLElement>(`[name="${errors[0]!.name}"]`, form)?.focus();
        return;
      }
      // Прототип: данные никуда не отправляются и не сохраняются.
      status.className = "form-status is-filled";
      status.textContent = "Форма заполнена. Отправка пока не подключена.";
    });
  }
}

/* ---------------- Движение ---------------- */
/** Правка в демо: старый заголовок зачёркивается, новый проявляется. Финальное состояние уже в разметке. */
function playEdit() {
  const box = $("[data-edit]");
  if (!box || reduced()) return;
  const strike = $(".edit-before s", box)!, after = $(".edit-after", box)!, why = $(".edit-why", box)!;
  strike.animate([{ textDecorationColor: "transparent" }, { textDecorationColor: "transparent", offset: 0.4 }, { textDecorationColor: "var(--danger)" }], { duration: 900, easing: EASE });
  after.animate([{ opacity: 0, transform: "translateY(8px)" }, { opacity: 0, transform: "translateY(8px)", offset: 0.5 }, { opacity: 1, transform: "none" }], { duration: 1200, easing: EASE });
  why.animate([{ opacity: 0 }, { opacity: 0, offset: 0.65 }, { opacity: 1 }], { duration: 1500, easing: EASE });
}

/** Первый экран: заголовок и лид мягко проявляются; кнопки не анимируются и доступны сразу. */
function heroMotion() {
  if (reduced() || location.hash) return;
  $$(".hero-copy .eyebrow, .hero-copy h1, .hero-copy .hero-lead").forEach((el, i) =>
    el.animate([{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }], { duration: 450, delay: 40 * i, easing: EASE, fill: "backwards" }),
  );
  $(".sample")?.animate([{ opacity: 0, transform: "translateY(16px)" }, { opacity: 1, transform: "none" }], { duration: 500, delay: 80, easing: EASE, fill: "backwards" });
  $$(".compare tbody tr").forEach((tr, i) => tr.animate([{ opacity: 0, transform: "translateX(-6px)" }, { opacity: 1, transform: "none" }], { duration: 400, delay: 300 + i * 90, easing: EASE, fill: "backwards" }));
  if ($("[data-edit]")) setTimeout(playEdit, 650);
  $$(".flow-steps li").forEach((li, i) => li.animate([{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], { duration: 420, delay: 120 + i * 160, easing: EASE, fill: "backwards" }));
}

/** Появление блоков ниже первого экрана. Уже видимые блоки не трогаем; без скрипта всё видно сразу. */
function reveal() {
  if (reduced() || !("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        io.unobserve(en.target);
        if (en.boundingClientRect.top < innerHeight) continue;
        (en.target as HTMLElement).animate([{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "none" }], { duration: 560, easing: EASE });
      }
    },
    { rootMargin: "0px 0px 30% 0px" },
  );
  $$(".reveal").filter((el) => el.getBoundingClientRect().top > innerHeight * 1.3).forEach((el) => io.observe(el));
}

/** Шаги процесса проявляются по очереди, когда блок подходит к экрану. */
function stepsMotion() {
  const list = $(".reg-steps");
  if (!list || reduced() || !("IntersectionObserver" in window) || list.getBoundingClientRect().top < innerHeight) return;
  const io = new IntersectionObserver(
    ([en]) => {
      if (!en?.isIntersecting) return;
      io.disconnect();
      $$("li", list).forEach((li, i) => li.animate([{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], { duration: 420, delay: 90 * i, easing: EASE, fill: "backwards" }));
    },
    { rootMargin: "0px 0px -10% 0px" },
  );
  io.observe(list);
}

function init() {
  header();
  smoothDetails();
  projectForm();
  needButtons();
  quiz();
  forms();
  $("[data-edit-replay]")?.addEventListener("click", playEdit);
  heroMotion();
  reveal();
  stepsMotion();
}
document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", init) : init();
