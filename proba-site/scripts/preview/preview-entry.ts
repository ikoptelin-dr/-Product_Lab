// Интерактивность статического превью (без React): меню, ноты, мюйетка, выбор услуги, форма-демо.
import { contact, hero, litmus, nav, notes } from "@/content/site";
import { checkClaim, type LitmusResult } from "@/lib/litmus";

const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(sel));
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const reduce = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function chooseTopic(topic: string) {
  const select = $<HTMLSelectElement>("#topic");
  if (select) select.value = topic;
  $("#contact")?.scrollIntoView({ behavior: reduce() ? "auto" : "smooth", block: "start" });
}

// ── Шапка: фон при скролле и мобильное меню ─────────────────────────
function initHeader() {
  const header = $("header.fixed");
  const toggle = $<HTMLButtonElement>('[aria-controls="mobile-menu"]');
  if (!header || !toggle) return;
  const scrolledCls = ["border-line-dark", "bg-ink/85", "backdrop-blur-md"];
  let open = false;
  const paint = () => {
    const on = window.scrollY > 24 || open;
    scrolledCls.forEach((c) => header.classList.toggle(c, on));
    header.classList.toggle("border-transparent", !on);
  };
  window.addEventListener("scroll", paint, { passive: true });
  paint();

  const panel = document.createElement("div");
  panel.id = "mobile-menu";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute("aria-label", "Меню");
  panel.hidden = true;
  panel.className = "h-[calc(100dvh-72px)] overflow-y-auto bg-ink px-4 pt-6 pb-10 sm:px-6 lg:hidden";
  panel.innerHTML =
    `<ul class="flex flex-col">${nav
      .map((n) => `<li class="border-b border-line-dark"><a href="${n.href}" class="display block py-5 text-3xl">${esc(n.label)}</a></li>`)
      .join("")}</ul>` +
    `<button type="button" data-topic="${esc(hero.primary.topic)}" class="mt-10 min-h-12 w-full bg-gold px-6 text-sm tracking-[0.14em] text-ink uppercase">${esc(hero.primary.label)}</button>`;
  header.appendChild(panel);

  const bars = $$("span span", toggle);
  const setOpen = (v: boolean) => {
    open = v;
    panel.hidden = !v;
    toggle.setAttribute("aria-expanded", String(v));
    toggle.setAttribute("aria-label", v ? "Закрыть меню" : "Открыть меню");
    bars[0]?.classList.toggle("top-1.5", v);
    bars[0]?.classList.toggle("rotate-45", v);
    bars[0]?.classList.toggle("top-0", !v);
    bars[1]?.classList.toggle("top-1.5", v);
    bars[1]?.classList.toggle("-rotate-45", v);
    bars[1]?.classList.toggle("top-3", !v);
    document.body.style.overflow = v ? "hidden" : "";
    paint();
    if (v) panel.querySelector<HTMLElement>("a")?.focus();
  };
  toggle.addEventListener("click", () => setOpen(!open));
  panel.addEventListener("click", (e) => {
    if ((e.target as HTMLElement).closest("a,button")) setOpen(false);
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && open) {
      setOpen(false);
      toggle.focus();
    }
  });
}

// ── Кнопки выбора темы заявки ───────────────────────────────────────
function initTopics() {
  document.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-topic]");
    if (btn?.dataset.topic) chooseTopic(btn.dataset.topic);
  });
}

// ── Композиция: вкладки нот и флакон ────────────────────────────────
function initNotes() {
  const tabs = $$<HTMLButtonElement>('#notes [role="tab"]');
  const panel = $('#notes [role="tabpanel"]');
  if (!tabs.length || !panel) return;
  const ids = notes.layers.map((l) => l.id);
  const select = (id: string, focus = false) => {
    const layer = notes.layers.find((l) => l.id === id)!;
    tabs.forEach((t, i) => {
      const on = ids[i] === id;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      t.classList.toggle("border-gold", on);
      t.classList.toggle("text-ivory", on);
      t.classList.toggle("border-transparent", !on);
      t.classList.toggle("text-smoke", !on);
      if (on && focus) t.focus();
    });
    $$<SVGRectElement>("#notes [data-layer]").forEach((r) => r.setAttribute("opacity", r.dataset.layer === id ? "1" : "0.14"));
    panel.setAttribute("aria-labelledby", tabs[ids.indexOf(layer.id)]!.id);
    panel.classList.remove("soak");
    void panel.offsetWidth;
    panel.classList.add("soak");
    panel.innerHTML = `
      <p class="kicker text-gold-soft">${esc(layer.tagline)}</p>
      <ul class="mt-5 flex flex-wrap gap-2">${layer.elements
        .map((el) => `<li class="border border-line-dark px-3 py-1.5 text-[0.85rem] text-ivory/90">${esc(el)}</li>`)
        .join("")}</ul>
      <dl class="mt-10 grid gap-8 sm:grid-cols-2">
        <div><dt class="kicker text-[0.65rem] text-smoke">Что изменилось</dt><dd class="mt-3 leading-relaxed text-ivory/90">${esc(layer.change)}</dd></div>
        <div><dt class="kicker text-[0.65rem] text-smoke">Что делаем мы</dt><dd class="display mt-3 text-[1.45rem] leading-snug text-gold-pale">${esc(layer.work)}</dd></div>
      </dl>`;
  };
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => select(ids[i]!));
    t.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      select(ids[(i + (e.key === "ArrowRight" ? 1 : ids.length - 1)) % ids.length]!, true);
    });
  });
  $$<SVGRectElement>("#notes [data-layer]").forEach((r) => r.addEventListener("click", () => select(r.dataset.layer!)));
}

// ── Мюйетка ─────────────────────────────────────────────────────────
const tint = {
  clean: { strip: "bg-gold", label: "Чисто по маркерам", text: "text-gold" },
  medium: { strip: "bg-caution", label: "Требует проверки", text: "text-caution" },
  high: { strip: "bg-risk", label: "Высокий риск", text: "text-risk" },
} as const;

function renderLitmus(out: HTMLElement, r: LitmusResult, run: number) {
  const t = tint[r.score];
  const phrase = r.segments
    .map((s) =>
      s.level
        ? `<mark class="bg-transparent underline decoration-2 underline-offset-[6px] ${s.level === "high" ? "text-risk decoration-risk" : "text-caution decoration-caution"}">${esc(s.text)}</mark>`
        : `<span>${esc(s.text)}</span>`,
    )
    .join("");
  const hits = r.hits.length
    ? `<ul class="mt-4 divide-y divide-line-dark border-y border-line-dark">${r.hits
        .map(
          (h) => `<li class="grid gap-2 py-5 sm:grid-cols-[180px_1fr] sm:gap-6">
            <p class="display text-xl"><span aria-hidden="true" class="mr-2 inline-block h-2 w-2 rotate-45 ${h.rule.level === "high" ? "bg-risk" : "bg-caution"}"></span>${esc(h.rule.title)}</p>
            <div class="text-[0.92rem] leading-relaxed"><p class="text-ivory/85">${esc(h.rule.why)}</p>
            <p class="mt-2 text-gold-pale"><span class="text-smoke">Вместо: </span>${esc(h.rule.instead)}</p></div></li>`,
        )
        .join("")}</ul>`
    : `<div class="mt-4"><p class="display text-2xl">${esc(litmus.cleanTitle)}</p><p class="mt-2 text-smoke">${esc(litmus.cleanText)}</p></div>`;
  out.innerHTML = `
    <div class="relative overflow-hidden bg-paper text-ink shadow-[0_30px_80px_-40px_rgba(0,0,0,0.8)] [clip-path:polygon(0_0,96%_0,100%_50%,96%_100%,0_100%)]">
      <div aria-hidden="true" class="soak absolute inset-y-0 left-0 w-2 ${t.strip}"></div>
      <div class="flex min-h-[148px] flex-col justify-center py-7 pr-14 pl-8">
        <p class="kicker text-[0.6rem] text-muted">Proba · мюйетка № ${String(run).padStart(3, "0")}</p>
        <p class="soak display mt-3 text-[1.55rem] leading-snug md:text-[1.8rem]">${phrase}</p>
      </div>
    </div>
    <div class="mt-8">
      <p class="kicker ${t.text}">${t.label}</p>
      ${hits}
      <button type="button" data-topic="Пробник — мини-разбор (бесплатно)" class="mt-8 min-h-12 border border-gold/70 px-6 text-[0.8rem] tracking-[0.14em] text-gold-pale uppercase transition-colors hover:bg-gold hover:text-ink">${esc(litmus.cta)}</button>
    </div>`;
}

function initLitmus() {
  const form = $<HTMLFormElement>("#litmus form");
  const area = $<HTMLTextAreaElement>("#litmus textarea");
  const out = $('#litmus [aria-live="polite"]');
  if (!form || !area || !out) return;
  let run = 0;
  const go = (text: string) => {
    if (!text.trim()) return;
    run += 1;
    renderLitmus(out, checkClaim(text), run);
  };
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    go(area.value);
  });
  $$<HTMLButtonElement>('#litmus [aria-label="Примеры"] button').forEach((b) =>
    b.addEventListener("click", () => {
      area.value = b.textContent ?? "";
      go(area.value);
    }),
  );
  // Превью открывается с заполненным примером, чтобы было видно, что делает инструмент.
  area.value = litmus.samples[0]!;
  go(area.value);
}

// ── Форма в превью: проверка полей без реальной отправки ─────────────
function initForm() {
  const form = $<HTMLFormElement>("#contact form");
  const status = $("#form-status");
  if (!form || !status) return;
  const required: [string, string][] = [
    ["name", "Укажите имя"],
    ["company", "Укажите компанию"],
    ["email", "Проверьте email"],
  ];
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    $$(".preview-error", form).forEach((n) => n.remove());
    let first: HTMLElement | null = null;
    for (const [name, msg] of required) {
      const input = $<HTMLInputElement>(`[name="${name}"]`, form)!;
      const bad = name === "email" ? !/^\S+@\S+\.\S+$/.test(input.value) : input.value.trim().length < 2;
      input.setAttribute("aria-invalid", String(bad));
      if (bad) {
        input.insertAdjacentHTML("afterend", `<p class="preview-error mt-1.5 text-[0.82rem] text-risk">${msg}</p>`);
        first ??= input;
      }
    }
    const consent = $<HTMLInputElement>("#consent", form)!;
    if (!consent.checked) {
      consent.parentElement!.insertAdjacentHTML("afterend", `<p class="preview-error mt-1.5 text-[0.82rem] text-risk">Нужно согласие на обработку данных</p>`);
      first ??= consent;
    }
    if (first) {
      status.className = "text-[0.92rem] text-risk";
      status.textContent = contact.errorValidation;
      first.focus();
      return;
    }
    status.className = "text-[0.92rem] text-ink";
    status.textContent = "Это превью: заявка не отправлена. На рабочем сайте она уйдёт на почту, в Telegram или CRM.";
  });
}

function init() {
  $$(".reveal").forEach((el) => el.classList.add("is-visible"));
  initHeader();
  initTopics();
  initNotes();
  initLitmus();
  initForm();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();
