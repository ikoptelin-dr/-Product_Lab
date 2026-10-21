// Движение на лендинге Proba Lab. Без библиотек: IntersectionObserver + requestAnimationFrame.
// Принципы (см. SITE_REVIEW_LPR.md, раздел 7):
//  • в покое страница показывает финальное состояние — скрипт ничего не прячет заранее;
//  • сцена запускается один раз при входе во вьюпорт и стартует из видимого состояния;
//  • prefers-reduced-motion: класс .motion не ставится, сцены не запускаются, всё статично;
//  • анимируются только transform / opacity / filter (их задаёт CSS, скрипт ставит классы и переменные).

const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => Array.from(r.querySelectorAll<T>(s));

const reduceQuery = matchMedia("(prefers-reduced-motion: reduce)");
export const motionOn = () => !reduceQuery.matches;

const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

/** Заворачивает каждое слово заголовка в <span class="w" style="--wi:n">. Неразрывные пробелы
 *  остаются внутри слова, вложенная разметка (строки h1) сохраняется. Вёрстка не меняется. */
function splitWords(root: HTMLElement) {
  let n = 0;
  const walk = (node: Node) => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        const parts = child.textContent!.split(/([ \t\n\r]+)/);
        if (parts.length === 1 && !parts[0]!.trim()) continue;
        const frag = document.createDocumentFragment();
        for (const part of parts) {
          if (!part) continue;
          if (/^[ \t\n\r]+$/.test(part)) frag.append(" ");
          else {
            const w = document.createElement("span");
            w.className = "w";
            w.style.setProperty("--wi", String(n++));
            w.textContent = part;
            frag.append(w);
          }
        }
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE && !(child as Element).classList.contains("w")) walk(child);
    }
  };
  walk(root);
  return n;
}

/** Число в русской записи: запятая в дробях, неразрывный пробел в тысячах. */
function fmt(v: number, decimals: number) {
  const s = v.toFixed(decimals).replace(".", ",");
  const [int, frac] = s.split(",");
  return int!.replace(/\B(?=(\d{3})+(?!\d))/g, " ") + (frac ? "," + frac : "");
}

/** Счётчик от 0 до data-count. Финальное значение уже стоит в разметке; сбрасывается в 0
 *  только в момент старта, т. е. когда элемент уже во вьюпорте. */
export function countUp(el: HTMLElement, dur = 1200, delay = 0, from = 0) {
  const raw = el.dataset.count!;
  const to = parseFloat(raw);
  const dec = raw.includes(".") ? raw.split(".")[1]!.length : 0;
  let t0 = 0;
  const frame = (now: number) => {
    if (!t0) t0 = now;
    const t = clamp((now - t0 - delay) / dur);
    el.textContent = fmt(from + (to - from) * easeOutExpo(t), dec);
    if (t < 1) requestAnimationFrame(frame);
  };
  el.textContent = fmt(from, dec);
  requestAnimationFrame(frame);
}

/* ------------------------------------------------------------------ hero */

/** Карточка переписывает себя (motion № 1): скан → маркеры риска → зачёркивание →
 *  строки сворачиваются, вписываются безопасные формулировки → счётчик 6 → 0.
 *  Время идёт, только пока hero виден и вкладка активна. Максимум 3 цикла, дальше — «Стало». */
function heroRewrite() {
  const rw = $(".rw");
  const card = $(".rw-card");
  const count = $(".rw-count");
  if (!rw || !card || !count) return;
  let visible = true;
  new IntersectionObserver(([e]) => (visible = e!.isIntersecting)).observe(rw);

  // «Сон», который не тикает, когда карточку не видно
  const sleep = (ms: number) =>
    new Promise<void>((done) => {
      let left = ms, last = performance.now();
      const tick = (now: number) => {
        if (visible && !document.hidden) left -= now - last;
        last = now;
        left <= 0 ? done() : requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  const set = (...cls: string[]) => {
    rw.className = ["rw", ...cls].join(" ");
  };
  const setCount = (v: number) => {
    count.textContent = String(v);
    count.classList.remove("is-tick");
    void count.offsetWidth;
    count.classList.add("is-tick");
  };

  const run = async () => {
    card.style.setProperty("--scan-h", card.offsetHeight + "px");
    set("is-reset", "is-was", "is-bad");
    count.textContent = "6";
    await sleep(1300); // даём пройти входу hero
    for (let cycle = 0; cycle < 3; cycle++) {
      if (cycle) {
        set("is-reset", "is-was", "is-bad");
        count.textContent = "6";
        await sleep(900);
      }
      set("is-was", "is-bad", "is-scan");
      await sleep(800);
      set("is-was", "is-bad", "is-mark");
      await sleep(900);
      set("is-was", "is-bad", "is-mark", "is-strike");
      await sleep(650);
      set("is-bad", "is-mark", "is-strike"); // строки сворачиваются, новые вписываются
      await sleep(800);
      for (let v = 5; v >= 0; v--) {
        setCount(v);
        await sleep(110);
      }
      set(); // финальное состояние: зелёный бейдж, подпись «у каждой фразы — источник»
      if (cycle < 2) await sleep(4000);
    }
  };
  run();
}

/** Слоистый параллакс пейзажа: дальние слои отстают от прокрутки, плюс небольшой сдвиг за курсором. */
function heroParallax() {
  const hero = $(".hero");
  const layers = $$<SVGGElement>(".hero .pl").map((g) => ({ g, d: parseFloat(g.dataset.depth || "0") }));
  const copy = $(".hero-copy");
  if (!hero || !layers.length) return;
  let mx = 0, tx = 0, raf = 0;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const paint = () => {
    raf = 0;
    const y = scrollY;
    const h = hero.offsetHeight;
    if (y > h + 100) return;
    mx += (tx - mx) * 0.08;
    for (const { g, d } of layers) g.style.transform = `translate3d(${(-mx * d * 40).toFixed(2)}px, ${(y * d).toFixed(2)}px, 0)`;
    if (copy) copy.style.transform = `translate3d(0, ${(y * -0.06).toFixed(2)}px, 0)`;
    if (Math.abs(tx - mx) > 0.001) raf = requestAnimationFrame(paint);
  };
  const req = () => (raf ||= requestAnimationFrame(paint));
  addEventListener("scroll", req, { passive: true });
  if (fine)
    hero.addEventListener("pointermove", (e) => {
      tx = (e.clientX / innerWidth) * 2 - 1;
      req();
    });
  hero.addEventListener("pointerleave", () => ((tx = 0), req()));
  req();
}

/* ------------------------------------------------------------------ сцены */

/** Лента норм: «сегодня» ставится по new Date(), остаток до 31.08.2027 считается в месяцах. */
function timelineSetup(tl: HTMLElement) {
  const list = $(".tl-list", tl)!;
  const today = $(".tl-today", tl)!;
  const now = new Date();
  const items = $$(".tl-item[data-date]", tl);
  const next = items.find((li) => new Date(li.dataset.date!) > now);
  next ? list.insertBefore(today, next) : list.append(today);
  for (const li of items) li.classList.toggle("is-past", li.classList.contains("tl-deadline") && new Date(li.dataset.date!) < now);
  const final = new Date($(".tl-final", tl)!.dataset.date!);
  const months = Math.round((final.getTime() - now.getTime()) / (30.44 * 864e5));
  const left = $(".tl-left", tl)!;
  if (months > 0) {
    const m10 = months % 10, m100 = months % 100;
    const word = m10 === 1 && m100 !== 11 ? "месяц" : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? "месяца" : "месяцев";
    $(".tl-months", tl)!.textContent = `${months} ${word}`;
  } else left.hidden = true;
  $$(".tl-item", tl).forEach((li, i) => li.style.setProperty("--i", String(i)));
  layoutTimeline(tl);
  addEventListener("resize", () => layoutTimeline(tl));
}

/** Геометрия линии: от первой точки до последней, заливка — до «сегодня». Пишется один раз
 *  (и на resize), в анимации участвуют только transform. */
function layoutTimeline(tl: HTMLElement) {
  const dots = $$(".tl-dot", tl);
  const track = $(".tl-track", tl)!, fill = $(".tl-fill", tl)!, rest = $(".tl-rest", tl)!;
  const todayDot = $(".tl-today .tl-dot", tl)!;
  const r0 = tl.getBoundingClientRect();
  const c = (d: HTMLElement) => {
    const r = d.getBoundingClientRect();
    return [r.left + r.width / 2 - r0.left, r.top + r.height / 2 - r0.top] as const;
  };
  const a = c(dots[0]!), b = c(dots[dots.length - 1]!), t = c(todayDot);
  const vertical = Math.abs(b[1] - a[1]) > Math.abs(b[0] - a[0]);
  Object.assign(track.style, vertical
    ? { left: a[0] - 1 + "px", top: a[1] + "px", height: b[1] - a[1] + "px", width: "2px", right: "auto", bottom: "auto" }
    : { left: a[0] + "px", top: a[1] - 1 + "px", width: b[0] - a[0] + "px", height: "2px", right: "auto", bottom: "auto" });
  const len = vertical ? b[1] - a[1] : b[0] - a[0];
  const at = vertical ? t[1] - a[1] : t[0] - a[0];
  const pct = (v: number) => (len > 0 ? (v / len) * 100 : 0) + "%";
  if (vertical) {
    Object.assign(fill.style, { top: "0", height: pct(at), left: "0", width: "100%" });
    Object.assign(rest.style, { top: pct(at), height: pct(len - at), left: "-1px", width: "4px" });
  } else {
    Object.assign(fill.style, { left: "0", width: pct(at), top: "0", height: "100%" });
    Object.assign(rest.style, { left: pct(at), width: pct(len - at), top: "-1px", height: "4px" });
  }
  todayDot.style.setProperty("--mx", vertical ? "0px" : a[0] - t[0] + "px");
  todayDot.style.setProperty("--my", vertical ? a[1] - t[1] + "px" : "0px");
}

/** «Как работаем»: заливка шкалы и «день N из 10» следуют за прокруткой. До первого входа
 *  секции во вьюпорт шкала остаётся заполненной (финальное состояние). */
function flowSetup(flow: HTMLElement) {
  const steps = $$(".step", flow);
  const track = $(".flow-track", flow)!;
  const day = $(".flow-day b", flow)!;
  const dayN = $(".flow-day-n", flow)!;
  let lastDay = 10, raf = 0, done = 0;
  const layout = () => {
    const r0 = flow.getBoundingClientRect();
    const a = steps[0]!.getBoundingClientRect(), b = steps[steps.length - 1]!.getBoundingClientRect();
    const vertical = b.top - a.top > b.left - a.left;
    Object.assign(track.style, vertical
      ? { left: a.left - r0.left + 15 + "px", top: a.top - r0.top + 16 + "px", width: "2px", height: b.top - a.top + "px", right: "auto", bottom: "auto" }
      : { left: a.left - r0.left + 16 + "px", top: a.top - r0.top + 15 + "px", height: "2px", width: b.left - a.left + "px", right: "auto", bottom: "auto" });
  };
  const paint = () => {
    raf = 0;
    const r = track.getBoundingClientRect();
    const vh = innerHeight;
    const vertical = r.height > r.width;
    // горизонтально: от 85% до 40% высоты окна; вертикально — по мере прохождения линии через центр
    let p = vertical ? clamp((vh * 0.62 - r.top) / Math.max(1, r.height)) : clamp((vh * 0.85 - r.top) / (vh * 0.45));
    // шкала только растёт: пройденный срок не «откатывается» при прокрутке вверх
    p = Math.max(p, done);
    done = p;
    flow.style.setProperty("--p", p.toFixed(4));
    steps.forEach((s, i) => s.classList.toggle("is-off", p < i / (steps.length - 1) - 0.001));
    const d = Math.round(clamp((p - 0.5) / 0.5) * 10);
    if (d !== lastDay) {
      lastDay = d;
      dayN.textContent = String(d);
      day.classList.remove("is-tick");
      void day.offsetWidth;
      day.classList.add("is-tick");
    }
  };
  layout();
  addEventListener("resize", () => (layout(), paint()));
  return () => {
    flow.classList.add("is-driven");
    done = 0;
    addEventListener("scroll", () => (raf ||= requestAnimationFrame(paint)), { passive: true });
    paint();
  };
}

/** Наклон карточек тарифов за курсором (до 2,5°). */
function priceTilt() {
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  for (const card of $$(".price-card")) {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      card.style.setProperty("--rx", (-y * 2.5).toFixed(2) + "deg");
      card.style.setProperty("--ry", (x * 2.5).toFixed(2) + "deg");
    });
    card.addEventListener("pointerleave", () => {
      card.style.removeProperty("--rx");
      card.style.removeProperty("--ry");
    });
  }
}

/** Индексы маркеров и объяснений результата проверки. Короткие маркеры не переносятся —
 *  их подсветку можно «протянуть» transform'ом; длинные просто проявляются. */
export function prepCheck(out: HTMLElement) {
  $$("mark", out).forEach((m, k) => {
    m.style.setProperty("--k", String(k));
    m.classList.toggle("is-short", m.textContent!.length <= 22);
  });
  $$(".check-hits li", out).forEach((li, i) => li.style.setProperty("--i", String(i)));
}

let checkTimer = 0;

/** Проверка фразы (motion № 6): скан, маркеры по очереди, объяснения, пульс CTA-мостика. */
export function animateCheck(out: HTMLElement, bridge?: HTMLElement | null) {
  prepCheck(out);
  if (!motionOn() || !document.documentElement.classList.contains("motion")) return;
  out.style.setProperty("--scan-h", out.offsetHeight + "px");
  out.classList.remove("is-anim");
  void out.offsetWidth;
  out.classList.add("is-anim");
  clearTimeout(checkTimer);
  checkTimer = setTimeout(() => (out.classList.remove("is-anim"), bridge?.classList.remove("is-pulse")), 4000);
  if (bridge) {
    const n = $$(".check-hits li", out).length;
    bridge.style.setProperty("--bd", 700 + n * 100 + 250 + "ms");
    bridge.classList.remove("is-pulse");
    void bridge.offsetWidth;
    bridge.classList.add("is-pulse");
  }
}

/** Подсказка прокрутки у таблицы сравнения на узком экране. */
function compareHint() {
  const box = $(".compare-scroll");
  const wrap = $(".compare-wrap");
  if (!box || !wrap) return;
  const paint = () => {
    box.classList.toggle("can-scroll", wrap.scrollWidth > wrap.clientWidth + 2);
    box.classList.toggle("at-end", wrap.scrollLeft + wrap.clientWidth >= wrap.scrollWidth - 4);
  };
  wrap.addEventListener("scroll", paint, { passive: true });
  addEventListener("resize", paint);
  paint();
}

/* ------------------------------------------------------------------ запуск */

export function initMotion() {
  // Разметка, нужная и без движения (порядок «сегодня», подсказка прокрутки, индексы).
  const tl = $<HTMLElement>(".tl");
  if (tl) timelineSetup(tl);
  compareHint();
  $$("[data-stagger]").forEach((ul) => Array.from(ul.children).forEach((c, i) => (c as HTMLElement).style.setProperty("--i", String(i))));
  $$(".fact").forEach((f, i) => f.style.setProperty("--i", String(i % 3)));
  $$(".price-card").forEach((f, i) => f.style.setProperty("--i", String(i)));

  if (!motionOn()) return;
  document.documentElement.classList.add("motion");
  reduceQuery.addEventListener("change", () => document.documentElement.classList.toggle("motion", motionOn()));

  // Слова заголовков; у цен — число слов, чтобы подзаголовок шёл сразу за заголовком
  $$("[data-split]").forEach((h) => {
    if (h.id === "hero-title") $$(".h1-long, .h1-short", h).forEach(splitWords);
    else splitWords(h);
  });
  $$(".price-result").forEach((h) => {
    const n = splitWords(h);
    h.closest<HTMLElement>("[data-scene]")?.style.setProperty("--words", String(n));
  });

  const hero = $(".hero");
  setTimeout(() => hero?.classList.add("intro-done"), 2600);
  heroRewrite();
  heroParallax();
  priceTilt();
  const startFlow = $(".flow") ? flowSetup($(".flow")!) : null;

  // Сцены: что запускать при входе во вьюпорт
  const scenes: Record<string, (el: HTMLElement) => void> = {
    fact: (el) => $$("[data-count]", el).forEach((n) => countUp(n, 1300, 200)),
    fees: (el) => {
      $$(".fees [data-count]", el).forEach((n, i) => countUp(n, 1200, 250 + i * 120));
      $$(".fact-num [data-count]", el).forEach((n) => countUp(n, 1300, 200));
    },
    dots: (el) => $$("[data-count]", el).forEach((n) => countUp(n, 1400, n.closest(".dots-cap") ? 700 : 200)),
    ba: (el) => $$("[data-count]", el).forEach((n) => countUp(n, 900, 250)),
    report: (el) => {
      const [a, b] = $$("[data-count]", el);
      if (a) countUp(a, 900, 700);
      if (b) countUp(b, 1500, 800);
    },
    check: (el) => animateCheck(el, $<HTMLElement>(".check-bridge")),
  };

  // После проигрыша сцена переводится в .is-done — финальное состояние без анимаций. Так ресайз,
  // поворот экрана или смена медиазапроса не перезапускают уже сыгранную сцену.
  const fire = (el: HTMLElement) => {
    el.classList.add("is-in");
    scenes[el.dataset.scene || ""]?.(el);
    setTimeout(() => el.classList.replace("is-in", "is-done"), 4500);
  };
  // Заголовки и списки — как только край элемента показался; сцены — когда видно ~40%
  const near = new IntersectionObserver(
    (es) => es.forEach((e) => e.isIntersecting && (near.unobserve(e.target), fire(e.target as HTMLElement))),
    { rootMargin: "0px 0px -8% 0px" },
  );
  const deep = new IntersectionObserver(
    (es) =>
      es.forEach((e) => {
        if (e.intersectionRatio >= 0.4 || (e.isIntersecting && e.boundingClientRect.top < innerHeight * 0.55)) {
          deep.unobserve(e.target);
          fire(e.target as HTMLElement);
        }
      }),
    { threshold: [0, 0.2, 0.4, 0.6] },
  );
  $$("[data-split]:not(#hero-title), .eyebrow, .section-lead, [data-stagger]").forEach((el) => !el.closest(".hero") && near.observe(el));
  $$("[data-scene]").forEach((el) => el.dataset.scene !== "flow" && deep.observe(el));
  // Шкалу «Как работаем» подключаем заранее, пока секция ещё ниже экрана: заливка начнётся с нуля
  const flowEl = $(".flow");
  if (flowEl && startFlow) {
    const arm = new IntersectionObserver(([e]) => e!.isIntersecting && (arm.disconnect(), startFlow()), { rootMargin: "0px 0px 30% 0px" });
    arm.observe(flowEl);
  }
  const result = $("#check-result");
  if (result) {
    result.dataset.scene = "check";
    deep.observe(result);
  }
}
