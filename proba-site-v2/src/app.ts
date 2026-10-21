// Интерактивность лендинга Proba Lab v2: шапка, мобильное меню, вкладки примера отчёта,
// проверка формулировок, выбор тарифа в форме, демо-отправка формы.
import { checkClaim, type LitmusResult } from "../../proba-site/lib/litmus";

const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => Array.from(r.querySelectorAll<T>(s));
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const smooth = () => (matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth") as ScrollBehavior;

function header() {
  const h = $(".site-header");
  if (!h) return;
  const paint = () => h.classList.toggle("is-solid", scrollY > 40 || h.classList.contains("is-open"));
  addEventListener("scroll", paint, { passive: true });
  paint();
  const btn = $<HTMLButtonElement>(".menu-toggle");
  const menu = $("#mobile-menu");
  if (!btn || !menu) return;
  const set = (open: boolean) => {
    h.classList.toggle("is-open", open);
    menu.hidden = !open;
    btn.setAttribute("aria-expanded", String(open));
    btn.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
    document.body.style.overflow = open ? "hidden" : "";
    paint();
    if (open) $<HTMLElement>("a", menu)?.focus();
  };
  btn.addEventListener("click", () => set(menu.hidden));
  menu.addEventListener("click", (e) => (e.target as HTMLElement).closest("a,button") && set(false));
  addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !menu.hidden) {
      set(false);
      btn.focus();
    }
  });
}

function tabs() {
  for (const list of $$('[role="tablist"]')) {
    const ts = $$<HTMLButtonElement>('[role="tab"]', list);
    const select = (i: number, focus = false) =>
      ts.forEach((t, k) => {
        const on = k === i;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(t.getAttribute("aria-controls")!)!;
        panel.hidden = !on;
        if (on && focus) t.focus();
      });
    ts.forEach((t, i) => {
      t.addEventListener("click", () => select(i));
      t.addEventListener("keydown", (e) => {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        e.preventDefault();
        select((i + (e.key === "ArrowRight" ? 1 : ts.length - 1)) % ts.length, true);
      });
    });
  }
}

const verdict = {
  clean: { cls: "is-clean", label: "Явных маркеров риска нет" },
  medium: { cls: "is-medium", label: "Требует проверки" },
  high: { cls: "is-high", label: "Высокий риск" },
} as const;

function renderCheck(out: HTMLElement, r: LitmusResult) {
  const v = verdict[r.score];
  const phrase = r.segments
    .map((s) => (s.level ? `<mark class="hit-${s.level}">${esc(s.text)}</mark>` : esc(s.text)))
    .join("");
  const body = r.hits.length
    ? `<ul class="check-hits">${r.hits
        .map(
          (h) => `<li><p class="check-hit-title"><span class="dot dot-${h.rule.level}" aria-hidden="true"></span>${esc(h.rule.title)}</p>
          <p>${esc(h.rule.why)}</p><p class="check-instead"><span>Лучше:</span> ${esc(h.rule.instead)}</p></li>`,
        )
        .join("")}</ul>`
    : `<p class="check-clean">Это не значит, что формулировка допустима: нужно проверить, подтверждена ли она источниками для вашего состава и дозировки.</p>`;
  out.innerHTML = `<div class="check-verdict ${v.cls}"><span>${v.label}</span><span class="check-count">${r.hits.length} ${r.hits.length === 1 ? "маркер" : r.hits.length >= 2 && r.hits.length <= 4 ? "маркера" : "маркеров"}</span></div>
    <p class="check-phrase">${phrase}</p>${body}`;
}

function checker() {
  const form = $<HTMLFormElement>("#check-form");
  const input = $<HTMLTextAreaElement>("#check-input");
  const out = $("#check-result");
  if (!form || !input || !out) return;
  const run = () => input.value.trim() && renderCheck(out, checkClaim(input.value));
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    run();
  });
  $$<HTMLButtonElement>("[data-sample]").forEach((b) =>
    b.addEventListener("click", () => {
      input.value = b.dataset.sample!;
      run();
    }),
  );
  run(); // страница открывается с заполненным примером
}

function topics() {
  document.addEventListener("click", (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>("[data-topic]");
    if (!el) return;
    const select = $<HTMLSelectElement>("#lead-topic");
    if (select) select.value = el.dataset.topic!;
  });
}

function leadForm() {
  const form = $<HTMLFormElement>("#lead-form");
  const status = $("#lead-status");
  if (!form || !status) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    $$(".field-error", form).forEach((n) => n.remove());
    $$("[aria-invalid]", form).forEach((n) => n.removeAttribute("aria-invalid"));
    const checks: [string, (v: string) => boolean, string][] = [
      ["lead-name", (v) => v.trim().length >= 2, "Укажите имя"],
      ["lead-company", (v) => v.trim().length >= 2, "Укажите компанию"],
      ["lead-email", (v) => /^\S+@\S+\.\S+$/.test(v) || v.replace(/\D/g, "").length >= 10, "Укажите email или телефон"],
      ["lead-url", (v) => !v || /^https?:\/\/\S+\.\S+/.test(v), "Нужна ссылка вида https://…"],
    ];
    let first: HTMLElement | null = null;
    for (const [id, ok, msg] of checks) {
      const el = $<HTMLInputElement>("#" + id)!;
      if (!ok(el.value)) {
        el.setAttribute("aria-invalid", "true");
        el.insertAdjacentHTML("afterend", `<p class="field-error" id="${id}-err">${msg}</p>`);
        el.setAttribute("aria-describedby", `${id}-err`);
        first ??= el;
      }
    }
    const consent = $<HTMLInputElement>("#lead-consent")!;
    if (!consent.checked) {
      consent.closest(".consent")!.insertAdjacentHTML("afterend", `<p class="field-error">Нужно согласие на обработку данных</p>`);
      first ??= consent;
    }
    if (first) {
      status.className = "form-status is-error";
      status.textContent = "Проверьте поля, отмеченные выше.";
      first.focus();
      return;
    }
    status.className = "form-status is-ok";
    status.textContent = "Это демонстрационная версия сайта: заявка не отправлена. На рабочем сайте она придёт нам на почту и в CRM.";
  });
}

function stickyCta() {
  const bar = $(".sticky-cta");
  const hero = $(".hero");
  const contact = $("#contact");
  if (!bar || !hero || !contact) return;
  let pastHero = false, atContact = false;
  const paint = () => (bar.hidden = !pastHero || atContact || $(".site-header")!.classList.contains("is-open"));
  new IntersectionObserver(([e]) => { pastHero = !e!.isIntersecting; paint(); }).observe(hero);
  new IntersectionObserver(([e]) => { atContact = e!.isIntersecting; paint(); }, { rootMargin: "0px 0px -20% 0px" }).observe(contact);
}

function anchors() {
  document.addEventListener("click", (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
    if (!a) return;
    const target = document.getElementById(a.getAttribute("href")!.slice(1));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: smooth(), block: "start" });
  });
}

function init() {
  header();
  tabs();
  checker();
  topics();
  leadForm();
  anchors();
  stickyCta();
}
document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", init) : init();
