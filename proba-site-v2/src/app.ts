// Лендинг Proba Lab: навигация между главной и «Автоматизацией», выбор задачи в форме,
// локальная проверка форм (прототип: без отправки и без сохранения контактов) и движение.
import { PRICES } from "./data";

const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => Array.from(r.querySelectorAll<T>(s));
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const EASE = "cubic-bezier(.2,.8,.2,1)";

/* ---------------- Шапка и мобильное меню ---------------- */
function header() {
  const h = $(".site-header")!;
  const paint = () => h.classList.toggle("is-solid", scrollY > 8);
  addEventListener("scroll", paint, { passive: true });
  paint();
  const btn = $<HTMLButtonElement>(".menu-toggle")!;
  const menu = $("#mobile-menu")!;
  const set = (open: boolean) => {
    menu.hidden = !open;
    btn.setAttribute("aria-expanded", String(open));
    btn.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
    document.body.style.overflow = open ? "hidden" : "";
    if (open) $<HTMLElement>("a", menu)?.focus();
  };
  btn.addEventListener("click", () => set(menu.hidden));
  menu.addEventListener("click", (e) => (e.target as HTMLElement).closest("a") && set(false));
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
      else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); items[0]!.focus(); }
    }
  });
}

/* ---------------- Представления: главная и «Автоматизация» ---------------- */
let currentView = "home";
let navigating = false; // во время перехода по якорю не проигрываем появление блоков — без мигания
function viewOf(id: string) {
  const el = id ? document.getElementById(id) : null;
  return el?.closest<HTMLElement>("[data-view]")?.dataset.view ?? (id === "automation" ? "automation" : "home");
}
function showView(view: string) {
  for (const v of $$<HTMLElement>("[data-view]")) v.hidden = v.dataset.view !== view;
  for (const a of $$('[data-nav="automation"]')) a.toggleAttribute("aria-current", view === "automation");
  if (view === "automation") $('[data-nav="automation"]')?.setAttribute("aria-current", "page");
  document.title = view === "automation" ? "Автоматизация — Proba Lab" : "Proba Lab";
  if (view === "automation" && currentView !== "automation") playFlow();
  currentView = view;
}
function go(hash: string, opts: { focus?: boolean } = {}) {
  const id = hash.replace(/^#/, "");
  const view = viewOf(id);
  const changed = $<HTMLElement>(`[data-view="${view}"]`)!.hidden;
  showView(view);
  navigating = true;
  setTimeout(() => (navigating = false), 900);
  const target = id === "automation" ? $<HTMLElement>("#auto-title") : document.getElementById(id);
  if (id === "automation" || (changed && id === "top")) scrollTo({ top: 0, behavior: "auto" });
  else target?.scrollIntoView({ behavior: reduced() || changed ? "auto" : "smooth", block: "start" });
  if (opts.focus && target) {
    if (!target.hasAttribute("tabindex") && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(target.tagName)) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  }
}
function router() {
  document.addEventListener("click", (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
    if (!a || a.getAttribute("href") === "#main") return;
    e.preventDefault();
    const href = a.getAttribute("href")!;
    try { history.pushState(null, "", href); } catch { /* в некоторых окружениях адрес не меняется — не критично */ }
    go(href, { focus: viewOf(href.slice(1)) === "automation" || a.classList.contains("back-link") });
  });
  addEventListener("popstate", () => go(location.hash || "#top"));
  if (location.hash && location.hash !== "#top") go(location.hash);
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
    const task = (form.querySelector<HTMLInputElement>('input[name="task"]:checked'))?.value ?? "";
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

  // Кнопки задач: выбрать задачу, показать главную, прокрутить к форме
  document.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-task]");
    if (!btn) return;
    const radio = form.querySelector<HTMLInputElement>(`input[name="task"][value="${btn.dataset.task}"]`);
    if (radio) radio.checked = true;
    sync();
    clearErrors(form);
    go("#project-form");
    const heading = $<HTMLElement>("#pf-title")!;
    heading.setAttribute("tabindex", "-1");
    heading.focus({ preventScroll: true });
  });
  sync();
}

/* ---------------- Проверка форм (локально, без отправки) ---------------- */
/** «example.com/x» → «https://example.com/x». Возвращает null, если это не похоже на адрес. */
export function normalizeUrl(raw: string): string | null {
  let v = raw.trim();
  if (!v) return "";
  if (!/^https?:\/\//i.test(v)) v = `https://${v.replace(/^\/+/, "")}`;
  try {
    const u = new URL(v);
    return /\.[a-zа-яё]{2,}$/i.test(u.hostname) ? u.toString() : null;
  } catch {
    return null;
  }
}

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

      const urlInput = $<HTMLInputElement>('[name="productUrl"]', form);
      if (urlInput) {
        const norm = normalizeUrl(urlInput.value);
        if (kind === "review" && !urlInput.value.trim()) errors.push({ name: "productUrl", msg: "Добавьте ссылку на продукт" });
        else if (norm === null) errors.push({ name: "productUrl", msg: "Проверьте адрес — например, ozon.ru/product/…" });
        else urlInput.value = norm;
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

function heroMotion() {
  if (reduced() || location.hash === "#automation") return;
  // Кнопки и подпись не анимируются — доступны сразу.
  $$(".hero-copy .eyebrow, .hero-copy h1, .hero-copy .hero-lead").forEach((el, i) =>
    el.animate([{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }], { duration: 450, delay: 40 * i, easing: EASE, fill: "backwards" }),
  );
  $(".sample")?.animate([{ opacity: 0, transform: "translateY(16px)" }, { opacity: 1, transform: "none" }], { duration: 500, delay: 80, easing: EASE, fill: "backwards" });
  $$(".compare tbody tr").forEach((tr, i) => tr.animate([{ opacity: 0, transform: "translateX(-6px)" }, { opacity: 1, transform: "none" }], { duration: 400, delay: 300 + i * 90, easing: EASE, fill: "backwards" }));
  setTimeout(playEdit, 650);
}

/** Схема пути заявки: шаги проявляются по очереди при открытии «Автоматизации». */
function playFlow() {
  if (reduced()) return;
  $$(".flow-steps li").forEach((li, i) => li.animate([{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], { duration: 420, delay: 120 + i * 160, easing: EASE, fill: "backwards" }));
}

/** Появление заголовков разделов и карточек. Запускается до того, как блок входит в экран, — без мигания. */
function reveal() {
  if (reduced() || !("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        io.unobserve(en.target);
        const r = en.boundingClientRect;
        if (navigating || r.top < innerHeight) continue; // уже на экране — не трогаем
        (en.target as HTMLElement).animate([{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "none" }], { duration: 500, easing: EASE });
      }
    },
    { rootMargin: "0px 0px 30% 0px" },
  );
  $$(".reveal").filter((el) => el.getBoundingClientRect().top > innerHeight * 1.3).forEach((el) => io.observe(el));
}

function init() {
  header();
  router();
  smoothDetails();
  projectForm();
  forms();
  $("[data-edit-replay]")?.addEventListener("click", playEdit);
  heroMotion();
  reveal();
}
document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", init) : init();
