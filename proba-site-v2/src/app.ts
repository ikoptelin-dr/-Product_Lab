// Лендинг Proba Lab: меню, конструктор проекта, формы и движение.
// Данные услуг, пакетов и цен — в data.ts; разметка карточек генерируется при сборке.
import { LEAD_ENDPOINT, PACKAGES, SERVICES } from "./data";

const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => Array.from(r.querySelectorAll<T>(s));
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const isMobile = () => matchMedia("(max-width: 1000px)").matches;

/* ---------------- Шапка и меню ---------------- */
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
    if (e.key === "Escape" && !menu.hidden) {
      set(false);
      btn.focus();
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
        body.animate([{ height: `${h}px`, opacity: 1 }, { height: "0px", opacity: 0 }], { duration: 260, easing: "cubic-bezier(.2,.8,.2,1)" }).onfinish = () => (d.open = false);
      } else {
        d.open = true;
        const h = body.offsetHeight;
        body.animate([{ height: "0px", opacity: 0 }, { height: `${h}px`, opacity: 1 }], { duration: 320, easing: "cubic-bezier(.2,.8,.2,1)" });
      }
    });
  }
}

/* ---------------- Вкладки конструктора ---------------- */
function tabs() {
  const list = $<HTMLElement>(".tabs");
  if (!list) return;
  const ts = $$<HTMLButtonElement>('[role="tab"]', list);
  const pill = $<HTMLElement>(".tab-pill", list)!;
  const movePill = (t: HTMLElement) => {
    pill.style.width = `${t.offsetWidth}px`;
    pill.style.transform = `translateX(${t.offsetLeft - 5}px)`;
  };
  const select = (i: number, focus = false) => {
    ts.forEach((t, k) => {
      const on = k === i;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(t.getAttribute("aria-controls")!)!;
      if (on && panel.hidden) {
        panel.hidden = false;
        if (!reduced()) panel.animate([{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }], { duration: 320, easing: "cubic-bezier(.2,.8,.2,1)" });
      } else if (!on) panel.hidden = true;
      if (on) {
        movePill(t);
        if (focus) t.focus();
        t.scrollIntoView({ block: "nearest", inline: "nearest" });
      }
    });
  };
  ts.forEach((t, i) => {
    t.addEventListener("click", () => select(i));
    t.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      select((i + (e.key === "ArrowRight" ? 1 : ts.length - 1)) % ts.length, true);
    });
  });
  const current = Math.max(0, ts.findIndex((t) => t.getAttribute("aria-selected") === "true"));
  requestAnimationFrame(() => movePill(ts[current]!));
  addEventListener("resize", () => movePill(ts.find((t) => t.getAttribute("aria-selected") === "true")!));
  document.fonts?.ready.then(() => movePill(ts.find((t) => t.getAttribute("aria-selected") === "true")!));
}

/* ---------------- Состояние проекта ---------------- */
// В хранилище — только состав проекта, без контактов.
const KEY = "proba_project_v1";
interface State { items: string[]; seoSite: string }
const svcById = new Map(SERVICES.map((s) => [s.id, s]));
const pkgById = new Map(PACKAGES.map((p) => [p.id, p]));
const state: State = load();

function load(): State {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "null");
    if (raw && Array.isArray(raw.items)) {
      const valid = raw.items.filter((id: string) => svcById.has(id) || pkgById.has(id.replace(/^pkg:/, "")));
      return { items: Array.from(new Set<string>(valid)), seoSite: typeof raw.seoSite === "string" ? raw.seoSite : "" };
    }
  } catch { /* хранилище недоступно — начинаем с пустого проекта */ }
  return { items: [], seoSite: "" };
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* не критично */ }
}

const label = (id: string) => (id.startsWith("pkg:") ? `${pkgById.get(id.slice(4))!.title} · ${pkgById.get(id.slice(4))!.price}` : svcById.get(id)!.title);

/** Пояснения к позициям: пересечения с пакетами и вопрос про сайт для SEO. */
function noteFor(id: string): string {
  if (id.startsWith("pkg:")) return "";
  const pkgs = state.items.filter((x) => x.startsWith("pkg:")).map((x) => pkgById.get(x.slice(4))!).filter((p) => p.covers.includes(id));
  if (pkgs.length) return `Частично входит в «${pkgs[0]!.title}» — не посчитаем дважды`;
  if (id === "seo" && !state.items.includes("site")) {
    if (state.seoSite === "Есть сайт") return "Для существующего сайта";
    if (state.seoSite === "Сайта нет") return "Сайта пока нет — обсудим при расчёте";
    return "Уточните, есть ли сайт";
  }
  return "";
}

function toggle(id: string, from?: HTMLElement) {
  const has = state.items.includes(id);
  state.items = has ? state.items.filter((x) => x !== id) : [...state.items, id];
  save();
  render(has ? undefined : id);
  if (!has && from) flyTo(from, label(id).split(" · ")[0]!);
}

function ensure(id: string, from?: HTMLElement) {
  if (!state.items.includes(id)) toggle(id, from);
}

const removeIcon = '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';

function render(added?: string) {
  const n = state.items.length;
  for (const c of $$("[data-count]")) {
    const prev = c.textContent;
    c.textContent = String(n);
    c.classList.toggle("is-zero", n === 0);
    if (prev !== String(n) && !reduced()) c.animate([{ transform: "scale(1)" }, { transform: "scale(1.35)" }, { transform: "scale(1)" }], { duration: 420, easing: "cubic-bezier(.34,1.4,.64,1)" });
  }
  for (const list of $$("[data-list]")) {
    list.innerHTML = state.items
      .map((id) => {
        const note = noteFor(id);
        return `<li data-id="${esc(id)}"><span>${esc(label(id))}</span><button class="pi-remove" type="button" data-remove="${esc(id)}" aria-label="Удалить: ${esc(label(id))}">${removeIcon}</button>${note ? `<span class="pi-note">${esc(note)}</span>` : ""}</li>`;
      })
      .join("");
    if (added && !reduced()) $(`li[data-id="${CSS.escape(added)}"]`, list)?.animate([{ opacity: 0, transform: "translateX(12px)" }, { opacity: 1, transform: "none" }], { duration: 380, easing: "cubic-bezier(.2,.8,.2,1)" });
  }
  for (const e of $$("[data-empty]")) e.hidden = n > 0;
  const seoQ = $("[data-seo-question]");
  if (seoQ) seoQ.hidden = !(state.items.includes("seo") && !state.items.includes("site"));
  for (const r of $$<HTMLInputElement>('input[name="seo-site"]')) r.checked = r.value === state.seoSite;

  // Кнопки и карточки
  for (const b of $$<HTMLButtonElement>("[data-add-service]")) setBtn(b, state.items.includes(b.dataset.addService!));
  for (const b of $$<HTMLButtonElement>(".add-btn[data-add-package]")) setBtn(b, state.items.includes(`pkg:${b.dataset.addPackage}`));

  // Форма расчёта
  const cl = $("[data-calc-list]");
  if (cl) cl.innerHTML = state.items.map((id) => `<li>${esc(label(id))}</li>`).join("");
  const ce = $("[data-calc-empty]");
  if (ce) ce.hidden = n > 0;
  mobileBar();
}

function setBtn(b: HTMLButtonElement, on: boolean) {
  b.setAttribute("aria-pressed", String(on));
  const l = $(".add-label", b);
  if (l) l.textContent = on ? "Добавлено" : "Добавить в проект";
  b.closest(".svc, .big-card")?.classList.toggle("is-added", on);
}

/** Чип «летит» от кнопки к счётчику проекта. */
function flyTo(from: HTMLElement, text: string) {
  if (reduced()) return;
  const target = isMobile() ? $(".mobile-project [data-count]") : $(".project [data-count]");
  if (!target || target.offsetParent === null) return;
  const a = from.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const chip = document.createElement("span");
  chip.className = "fly-chip";
  chip.textContent = text;
  chip.setAttribute("aria-hidden", "true");
  document.body.appendChild(chip);
  const x0 = a.left + a.width / 2 - chip.offsetWidth / 2, y0 = a.top + a.height / 2 - chip.offsetHeight / 2;
  const x1 = b.left + b.width / 2 - chip.offsetWidth / 2, y1 = b.top + b.height / 2 - chip.offsetHeight / 2;
  chip.animate(
    [
      { transform: `translate(${x0}px, ${y0}px) scale(1)`, opacity: 1 },
      { transform: `translate(${(x0 + x1) / 2}px, ${Math.min(y0, y1) - 60}px) scale(.9)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${x1}px, ${y1}px) scale(.3)`, opacity: 0 },
    ],
    { duration: 650, easing: "cubic-bezier(.5,0,.2,1)" },
  ).onfinish = () => chip.remove();
}

/* ---------------- Мобильная панель ---------------- */
let formInView = false;
function mobileBar() {
  const bar = $<HTMLElement>("[data-mobile-project]");
  if (!bar) return;
  const show = state.items.length > 0 && !formInView;
  bar.hidden = !show;
  document.body.classList.toggle("has-mobile-bar", show && isMobile());
  if (!show) {
    $("#mp-sheet")!.hidden = true;
    $(".mp-toggle")!.setAttribute("aria-expanded", "false");
  }
}

function project() {
  document.addEventListener("click", (e) => {
    const t = e.target as HTMLElement;
    const svc = t.closest<HTMLElement>("[data-add-service]");
    if (svc) return toggle(svc.dataset.addService!, svc);
    const pkg = t.closest<HTMLElement>("[data-add-package]");
    if (pkg) {
      const id = `pkg:${pkg.dataset.addPackage}`;
      if (pkg.dataset.go === "calc") {
        ensure(id, pkg);
        document.getElementById("calc")!.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
        return;
      }
      return toggle(id, pkg);
    }
    const rm = t.closest<HTMLElement>("[data-remove]");
    if (rm) {
      const li = rm.closest("li");
      const go = () => toggle(rm.dataset.remove!);
      if (li && !reduced()) li.animate([{ opacity: 1 }, { opacity: 0, transform: "translateX(12px)" }], { duration: 200, easing: "ease-in" }).onfinish = go;
      else go();
    }
  });
  for (const r of $$<HTMLInputElement>('input[name="seo-site"]'))
    r.addEventListener("change", () => {
      state.seoSite = r.value;
      save();
      render();
    });

  const mpBtn = $<HTMLButtonElement>(".mp-toggle")!;
  const sheet = $("#mp-sheet")!;
  mpBtn.addEventListener("click", () => {
    const open = sheet.hidden;
    sheet.hidden = !open;
    mpBtn.setAttribute("aria-expanded", String(open));
    if (open && !reduced()) sheet.animate([{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], { duration: 260, easing: "cubic-bezier(.2,.8,.2,1)" });
  });

  // Панель не перекрывает формы: прячем её, пока форма на экране.
  const io = new IntersectionObserver((entries) => {
    formInView = entries.some((en) => en.isIntersecting) || $$<HTMLElement>("[data-form]").some((f) => {
      const r = f.getBoundingClientRect();
      return r.top < innerHeight && r.bottom > 0;
    });
    mobileBar();
  });
  $$("[data-form]").forEach((f) => io.observe(f));
  addEventListener("resize", mobileBar);
  render();
}

/* ---------------- Формы ---------------- */
function forms() {
  for (const form of $$<HTMLFormElement>("form[data-form]")) {
    const status = $(".form-status", form)!;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      $$(".field-error", form).forEach((n) => n.remove());
      $$("[aria-invalid]", form).forEach((n) => n.removeAttribute("aria-invalid"));
      const fd = new FormData(form);
      const errors: [string, string][] = [];
      const url = String(fd.get("productUrl") || "").trim();
      const contact = String(fd.get("contact") || "").trim();
      const kind = form.dataset.form!;
      if (kind === "review" && !url) errors.push(["productUrl", "Добавьте ссылку на продукт"]);
      if (url && !/^https?:\/\/\S+\.\S+/.test(url)) errors.push(["productUrl", "Нужна ссылка вида https://…"]);
      if (contact.length < 5) errors.push(["contact", "Укажите email, телефон или Telegram"]);
      if (!fd.get("consent")) errors.push(["consent", "Нужно согласие на обработку данных"]);
      for (const [name, msg] of errors) {
        const el = $<HTMLInputElement>(`[name="${name}"]`, form)!;
        el.setAttribute("aria-invalid", "true");
        const p = document.createElement("p");
        p.className = "field-error";
        p.id = `${form.id}-${name}-err`;
        p.textContent = msg;
        (name === "consent" ? el.closest(".consent")! : el).insertAdjacentElement("afterend", p);
        el.setAttribute("aria-describedby", p.id);
      }
      if (errors.length) {
        status.className = "form-status is-error";
        status.textContent = "Проверьте отмеченные поля.";
        $<HTMLElement>(`[name="${errors[0]![0]}"]`, form)?.focus();
        return;
      }
      const payload: Record<string, unknown> = { kind, productUrl: url, contact, task: fd.get("task") || "", term: fd.get("term") || "" };
      if (kind === "calc") payload.project = state.items.map(label).concat(state.items.includes("seo") && state.seoSite ? [`SEO: ${state.seoSite}`] : []);

      if (!LEAD_ENDPOINT) {
        // Честное состояние: приём заявок ещё не подключён.
        status.className = "form-status is-pending";
        status.textContent = "Заявка не отправлена: приём заявок на сайте ещё подключается. Данные остались в форме — попробуйте позже.";
        return;
      }
      const btn = $<HTMLButtonElement>('button[type="submit"]', form)!;
      btn.disabled = true;
      status.className = "form-status is-pending";
      status.textContent = "Отправляем…";
      try {
        const res = await fetch(LEAD_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error(String(res.status));
        status.className = "form-status is-ok";
        status.textContent = kind === "review" ? "Заявка получена. Подтвердим её и пришлём разбор в течение трёх рабочих дней." : "Запрос получен. Уточним объём и пришлём расчёт.";
        form.reset();
      } catch {
        status.className = "form-status is-error";
        status.textContent = "Не удалось отправить заявку. Попробуйте ещё раз чуть позже.";
      } finally {
        btn.disabled = false;
      }
    });
  }
}

/* ---------------- Движение ---------------- */
/** Правка в образце разбора: старый заголовок зачёркивается, новый проявляется. Финальное состояние — в разметке. */
function playEdit() {
  const box = $("[data-edit]");
  if (!box || reduced()) return;
  const before = $(".edit-before", box)!, strike = $("s", before)!, after = $(".edit-after", box)!, why = $(".edit-why", box)!;
  const ease = "cubic-bezier(.2,.8,.2,1)";
  before.animate([{ color: "var(--ink)" }, { color: "var(--ink)", offset: 0.5 }, { color: "var(--muted)" }], { duration: 1100, easing: ease });
  strike.animate([{ textDecorationColor: "transparent" }, { textDecorationColor: "transparent", offset: 0.45 }, { textDecorationColor: "var(--danger)" }], { duration: 1100, easing: ease });
  after.animate([{ opacity: 0, transform: "translateY(10px)", filter: "blur(6px)" }, { opacity: 0, transform: "translateY(10px)", filter: "blur(6px)", offset: 0.55 }, { opacity: 1, transform: "none", filter: "blur(0)" }], { duration: 1500, easing: ease });
  why.animate([{ opacity: 0 }, { opacity: 0, offset: 0.7 }, { opacity: 1 }], { duration: 1800, easing: ease });
}

function heroMotion() {
  if (reduced()) return;
  const ease = "cubic-bezier(.2,.8,.2,1)";
  $$(".hero-copy > *").forEach((el, i) => el.animate([{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "none" }], { duration: 650, delay: 60 * i, easing: ease, fill: "backwards" }));
  const sample = $(".sample");
  sample?.animate([{ opacity: 0, transform: "translateY(24px) scale(.98)" }, { opacity: 1, transform: "none" }], { duration: 800, delay: 180, easing: ease, fill: "backwards" });
  $$(".compare tbody tr").forEach((tr, i) => tr.animate([{ opacity: 0, transform: "translateX(-8px)" }, { opacity: 1, transform: "none" }], { duration: 500, delay: 450 + i * 110, easing: ease, fill: "backwards" }));
  setTimeout(playEdit, 900);
  $("[data-edit-replay]")?.addEventListener("click", playEdit);
}

/** Появление блоков при прокрутке. Контент виден и без скрипта: анимация запускается чуть до входа в экран. */
function reveal() {
  if (reduced() || !("IntersectionObserver" in window)) return;
  const items = $$(".reveal").filter((el) => el.getBoundingClientRect().top > innerHeight);
  const io = new IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        io.unobserve(en.target);
        (en.target as HTMLElement).animate([{ opacity: 0, transform: "translateY(18px)" }, { opacity: 1, transform: "none" }], { duration: 600, easing: "cubic-bezier(.2,.8,.2,1)" });
      }
    },
    { rootMargin: "0px 0px 6% 0px" },
  );
  items.forEach((el) => io.observe(el));
}

function init() {
  header();
  smoothDetails();
  tabs();
  project();
  forms();
  heroMotion();
  reveal();
}
document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", init) : init();
