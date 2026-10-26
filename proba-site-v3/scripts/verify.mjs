// Проверка Proba Lab v3 (Playwright). Запуск: scripts/verify.sh [папка-для-скриншотов]
import { chromium } from "/home/user/-Product_Lab/proba-site/node_modules/@playwright/test/index.mjs";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const [BASE, SITE, SHOTS] = process.argv.slice(2);
const pages = [...readdirSync(SITE).filter((f) => f.endsWith(".html")), ...readdirSync(join(SITE, "dokumenty")).filter((f) => f.endsWith(".html")).map((f) => "dokumenty/" + f)].sort();
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const log = (...a) => console.log(...a);
const fails = [];
const stats = {};
const ok = (cond, msg, group = "misc") => { stats[group] = stats[group] || { pass: 0, fail: 0 }; cond ? stats[group].pass++ : stats[group].fail++; if (!cond) { fails.push(msg); log("  ✗ " + msg); } return cond; };
const VPS = [
  { name: "1440", viewport: { width: 1440, height: 900 } },
  { name: "768", viewport: { width: 768, height: 1024 } },
  { name: "390", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
];
const isFont = (u) => /fonts\.(googleapis|gstatic)\.com/.test(u);
const isLocal = (u) => u.startsWith(BASE) || u.startsWith("data:");
const norm = (s) => (s || "").replace(/ /g, " ");

async function open(url, vp, extra = {}) {
  const ctx = await b.newContext({ viewport: vp.viewport, isMobile: vp.isMobile, hasTouch: vp.hasTouch, deviceScaleFactor: vp.deviceScaleFactor, ...extra });
  await ctx.addInitScript(() => {
    window.__storage = 0;
    for (const k of ["getItem", "setItem", "removeItem", "clear", "key"]) {
      const orig = Storage.prototype[k];
      Storage.prototype[k] = function (...a) { window.__storage++; return orig.apply(this, a); };
    }
  });
  const p = await ctx.newPage();
  const errs = [], ext = [];
  p.on("pageerror", (e) => errs.push(e.message));
  p.on("console", (m) => m.type() === "error" && !/fonts\.(googleapis|gstatic)/.test(m.location()?.url || "") && errs.push(m.text()));
  p.on("request", (r) => { const u = r.url(); if (!isLocal(u) && !isFont(u)) ext.push(u); });
  await p.goto(url, { waitUntil: "load" });
  await p.waitForTimeout(350);
  return { ctx, p, errs, ext };
}
const overflow = (p) => p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

/* 1. Все страницы × 3 ширины */
log(`\n== Страницы (${pages.length}) × ширины`);
const meta = {};
for (const vp of VPS) {
  for (const f of pages) {
    const { ctx, p, errs, ext } = await open(`${BASE}/${f}`, vp);
    const ov = await overflow(p);
    ok(ov === 0, `${f}@${vp.name}: горизонтальное переполнение ${ov}px`, "layout");
    ok((await p.locator("h1").count()) === 1, `${f}@${vp.name}: h1 ≠ 1`, "layout");
    if (vp.name === "390") {
      const r = await p.evaluate(() => { const e = document.querySelector("[data-primary-cta]").getBoundingClientRect(); return { bottom: Math.round(e.bottom), h: Math.round(e.height) }; });
      ok(r.bottom <= 844 && r.h > 0, `${f}@390: CTA ниже первого экрана (bottom=${r.bottom})`, "cta390");
      const small = await p.evaluate(() => [...document.querySelectorAll("a, button, summary, .choice span")].filter((el) => { const s = getComputedStyle(el); if (s.display === "none" || s.visibility === "hidden" || el.closest("[hidden], .crumbs li span, .skip-link")) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.height < 40 && !el.closest("p, li:not(.svc-grid li):not(.dir-grid li):not(.next-grid li), dd, .quiz-list"); }).map((el) => `${el.tagName}.${el.className}:${Math.round(el.getBoundingClientRect().height)}`));
      ok(small.length === 0, `${f}@390: мелкие цели касания ${JSON.stringify(small.slice(0, 5))}`, "touch");
      log(`  ${f.padEnd(32)} 390: overflow ${ov}, CTA bottom ${r.bottom}px`);
    }
    const visHidden = await p.evaluate(() => [...document.querySelectorAll("[hidden]")].filter((e) => { const r = e.getBoundingClientRect(); return r.width * r.height > 0; }).length);
    ok(visHidden === 0, `${f}@${vp.name}: видимые [hidden] = ${visHidden}`, "layout");
    ok(errs.length === 0, `${f}@${vp.name}: ошибки консоли ${JSON.stringify(errs)}`, "console");
    ok(ext.length === 0, `${f}@${vp.name}: внешние запросы ${JSON.stringify(ext)}`, "network");
    ok((await p.evaluate(() => window.__storage)) === 0, `${f}@${vp.name}: обращения к хранилищу`, "storage");
    if (vp.name === "1440") {
      meta[f] = await p.evaluate(() => ({
        title: document.title,
        desc: document.querySelector('meta[name="description"]')?.content,
        lang: document.documentElement.lang,
        charset: document.characterSet,
        viewport: !!document.querySelector('meta[name="viewport"]'),
        og: [...document.querySelectorAll('meta[property^="og:"]')].map((m) => m.getAttribute("property")),
        ld: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => s.textContent),
        doctype: document.doctype?.name,
        headings: [...document.querySelectorAll("h1,h2,h3")].map((h) => h.tagName),
        unlabeled: [...document.querySelectorAll("input,select,textarea")].filter((el) => el.type !== "hidden" && !el.labels?.length && !el.closest("label") && !el.getAttribute("aria-label")).map((el) => el.name),
        skip: !!document.querySelector('.skip-link[href="#main"]') && !!document.getElementById("main"),
        details: document.querySelectorAll(".faq-list details").length,
        quizCta: !!document.querySelector('.site-header a.header-cta[href$="dokumenty/index.html#quiz"]'),
        nav: [...document.querySelectorAll(".main-nav a")].map((a) => a.textContent.trim()),
        live: [...document.querySelectorAll(".form-status")].every((s) => s.getAttribute("aria-live") === "polite"),
      }));
    }
    await ctx.close();
  }
}

/* 2. Метаданные и JSON-LD */
log("\n== Метаданные и JSON-LD");
const titles = new Set(), descs = new Set();
const SERVICE = ["marketing.html", "prodvizhenie.html", "analitika.html", "audit-prodazh.html", "avtomatizaciya.html", ...pages.filter((f) => f.startsWith("dokumenty/") && !/index|kak-my/.test(f))];
for (const [f, m] of Object.entries(meta)) {
  ok(m.doctype === "html" && m.lang === "ru" && m.charset === "UTF-8" && m.viewport, `${f}: doctype/lang/charset/viewport`, "meta");
  ok(!titles.has(m.title), `${f}: повтор title`, "meta"); titles.add(m.title);
  ok(m.desc && !descs.has(m.desc), `${f}: description пустой или повтор`, "meta"); descs.add(m.desc);
  ok(["og:type", "og:title", "og:description", "og:locale", "og:site_name"].every((k) => m.og.includes(k)), `${f}: Open Graph`, "meta");
  const types = [];
  for (const s of m.ld) { try { const j = JSON.parse(s); types.push(j["@type"]); if (j["@type"] === "Service") ok(!/price|offers|address|telephone/i.test(s), `${f}: Service с ценой/адресом/телефоном`, "ld"); } catch (e) { ok(false, `${f}: JSON-LD не парсится ${e.message}`, "ld"); } }
  if (f === "index.html") ok(types.includes("Organization") && !types.includes("BreadcrumbList"), `${f}: Organization`, "ld");
  else ok(types.includes("BreadcrumbList"), `${f}: нет BreadcrumbList`, "ld");
  ok(types.includes("Service") === SERVICE.includes(f), `${f}: Service ${types.includes("Service")}`, "ld");
  ok(types.includes("FAQPage") === m.details > 0, `${f}: FAQPage ${types.includes("FAQPage")} при ${m.details} вопросах`, "ld");
  let prev = 1, jump = false;
  for (const h of m.headings.slice(1)) { const lv = +h[1]; if (lv > prev + 1) jump = true; prev = lv; }
  ok(m.headings[0] === "H1" && !jump, `${f}: порядок заголовков ${m.headings.join(",")}`, "a11y");
  ok(m.unlabeled.length === 0, `${f}: поля без подписи ${m.unlabeled}`, "a11y");
  ok(m.skip && m.live, `${f}: skip-link / aria-live`, "a11y");
  ok(m.quizCta && m.nav.join("·") === "Документы·Маркетинг·Продвижение·Аналитика·Аудит продаж·Автоматизация", `${f}: меню ${m.nav}`, "meta");
  log(`  ${f.padEnd(32)} title ${String(m.title.length).padStart(2)} · desc ${String(m.desc.length).padStart(3)} · LD ${types.join("+")}`);
}

/* 3. Ссылки и якоря */
log("\n== Ссылки");
{
  const ctx = await b.newContext(); const p = await ctx.newPage();
  const links = new Map();
  for (const f of pages) {
    await p.goto(`${BASE}/${f}`);
    for (const h of await p.$$eval("a[href]", (as) => as.map((a) => a.getAttribute("href")))) {
      if (/^(https?:|mailto:|tel:)/.test(h)) { ok(false, `${f}: внешняя ссылка ${h}`, "links"); continue; }
      ok(!h.startsWith("/"), `${f}: абсолютный путь ${h}`, "links");
      links.set(new URL(h, `${BASE}/${f}`).href, f);
    }
  }
  const ids = new Map();
  let checked = 0, anchors = 0;
  for (const [u, from] of links) {
    const [path, hash] = u.split("#");
    const res = await p.request.get(path);
    checked++;
    ok(res.status() === 200, `ссылка ${u} (со страницы ${from}) → ${res.status()}`, "links");
    if (hash) {
      anchors++;
      if (!ids.has(path)) { await p.goto(path); ids.set(path, new Set(await p.$$eval("[id]", (els) => els.map((e) => e.id)))); }
      ok(ids.get(path).has(hash), `якорь #${hash} отсутствует на ${path} (со страницы ${from})`, "links");
    }
  }
  for (const extra of ["sitemap.xml", "robots.txt", "assets/site.css", "assets/site.js"]) ok((await p.request.get(`${BASE}/${extra}`)).status() === 200, `${extra} не отдаётся`, "links");
  log(`  уникальных ссылок: ${checked}, с якорем: ${anchors}`);
  await ctx.close();
}

/* 4. Квиз (ожидания v2) */
log("\n== Квиз");
{
  const { ctx, p, errs } = await open(`${BASE}/dokumenty/index.html`, VPS[0]);
  const cases = [
    { type: "bad", production: "contract", channels: ["marketplace"], expect: { code: "bad-contract+mp", docs: ["Свидетельство о госрегистрации (СГР)"], obl: ["Маркировка «Честный знак»", "Карточка на маркетплейсе совпадает с СГР", "Схема «Честного знака» с контрактником"] } },
    { type: "bad", production: "own", channels: ["pharmacy", "site"], expect: { code: "bad-own+ph+st", docs: ["Свидетельство о госрегистрации (СГР)"], obl: ["Процедуры ХАССП на производстве", "Программа производственного контроля", "Тексты сайта и реклама"] } },
    { type: "cosm", cosmGroup: "yes", production: "import", channels: ["marketplace"], expect: { code: "cosm-yes-import+mp", docs: ["СГР на косметику"], obl: ["Документы иностранного производителя"] } },
    { type: "cosm", cosmGroup: "no", production: "own", channels: ["retail"], expect: { code: "cosm-no-own+rt", docs: ["Декларация о соответствии ТР ТС 009/2011"], obl: ["Программа производственного контроля", "GMP — по желанию", "Требования торговых сетей"] } },
    { type: "cosm", cosmGroup: "unsure", production: "contract", channels: [], expect: { code: "cosm-unsure-contract", docs: ["Декларация или СГР — определим по составу"], obl: ["Маркировка «Честный знак»"] } },
    { type: "food", production: "own", channels: ["retail", "marketplace"], expect: { code: "food-own+mp+rt", docs: ["Декларация о соответствии ТР ТС 021/2011"], obl: ["Процедуры ХАССП на производстве"] } },
    { type: "sport", production: "import", channels: ["site"], expect: { code: "sport-import+st", docs: ["СГР или декларация — зависит от назначения"], obl: ["Заявитель — компания в России"] } },
    { type: "other", production: "own", channels: [], expect: { code: "other-own", docs: ["Определим по составу и назначению"], obl: [] } },
  ];
  await p.click('#quiz-form button[type="submit"]');
  ok((await p.textContent("#quiz-form .form-status")).includes("Выберите"), "квиз: пустая отправка без подсказки", "quiz");
  for (const c of cases) {
    await p.evaluate(() => { for (const i of document.querySelectorAll("#quiz-form input")) i.checked = false; });
    await p.click(`#quiz-form label.choice:has(input[name="type"][value="${c.type}"])`);
    ok((await p.isVisible("[data-cosm]")) === (c.type === "cosm"), `квиз: вопрос о группах косметики`, "quiz");
    if (c.cosmGroup) await p.click(`#quiz-form label.choice:has(input[name="cosmGroup"][value="${c.cosmGroup}"])`);
    await p.click(`#quiz-form label.choice:has(input[name="production"][value="${c.production}"])`);
    for (const ch of c.channels) await p.click(`#quiz-form label.choice:has(input[name="channels"][value="${ch}"])`);
    await p.click('#quiz-form button[type="submit"]');
    await p.waitForTimeout(150);
    const r = await p.evaluate(() => {
      const out = document.querySelector("#quiz-result");
      const lists = out.querySelectorAll(".quiz-list");
      return { code: out.dataset.code, docs: [...lists[0].querySelectorAll("a")].map((a) => a.textContent), obl: [...lists[1].querySelectorAll("a")].map((a) => a.textContent), caveat: out.querySelector(".quiz-caveat")?.textContent, live: out.getAttribute("aria-live"), markers: /⟪|⟫/.test(out.innerHTML) };
    });
    const pass = r.code === c.expect.code && c.expect.docs.every((d) => r.docs.includes(d)) && c.expect.obl.every((d) => r.obl.includes(d)) && r.caveat === "Предварительно. Точно определим по составу." && r.live === "polite" && !r.markers;
    ok(pass, `квиз ${JSON.stringify(c)} → ${JSON.stringify(r)}`, "quiz");
    log(`  ${pass ? "✓" : "✗"} ${c.type}${c.cosmGroup ? "/" + c.cosmGroup : ""} · ${c.production} · [${c.channels.join(",")}] → ${r.code}`);
  }
  await p.click("#quiz-result [data-need]");
  await p.waitForTimeout(700);
  const st = await p.evaluate(() => ({ cat: document.querySelector('#reg-form input[name="category"]:checked')?.value, need: document.querySelector("#rf-need").value, focus: document.activeElement?.id }));
  ok(st.cat === "Другое" && st.need === "Определить, какой документ нужен" && st.focus === "form-title", `квиз → форма: ${JSON.stringify(st)}`, "quiz");
  log(`  CTA результата → форма: ${JSON.stringify(st)}`);
  // ссылки из результата ведут на существующие страницы раздела
  ok(errs.length === 0, `квиз: ошибки ${errs}`, "quiz");
  await ctx.close();
}

/* 5. Формы: прототип, без сети и хранилища */
log("\n== Формы");
const STATUS = "Форма заполнена. Отправка пока не подключена.";
async function formRun(page, sel, fill) {
  const { ctx, p, errs, ext } = await open(`${BASE}/${page}`, VPS[2]);
  const reqs = [];
  p.on("request", (r) => { if (!isFont(r.url())) reqs.push(r.url()); });
  await p.click(`${sel} button[type="submit"]`);
  const e1 = await p.locator(`${sel} .field-error`).count();
  const s1 = await p.textContent(`${sel} .form-status`);
  await fill(p);
  await p.click(`${sel} button[type="submit"]`);
  const status = await p.textContent(`${sel} .form-status`);
  const store = await p.evaluate(() => ({ calls: window.__storage, ls: localStorage.length, ss: sessionStorage.length }));
  const good = e1 >= 1 && s1 === "Проверьте отмеченные поля." && status === STATUS && reqs.length === 0 && store.ls === 0 && store.ss === 0 && errs.length === 0 && ext.length === 0;
  ok(good, `${page} ${sel}: ${JSON.stringify({ e1, s1, status, reqs, store, errs })}`, "forms");
  log(`  ${good ? "✓" : "✗"} ${page} ${sel}: пустая → ${e1} ошибок; статус «${status}»; запросов ${reqs.length}`);
  await ctx.close();
}
const contactConsent = (sel) => async (p) => { await p.fill(`${sel} [name="contact"]`, "@proba_test"); await p.check(`${sel} input[name="consent"]`); };
await formRun("index.html", "#review-form", async (p) => { await p.fill("#rv-url", "example.com/product"); await p.click('#review-form label.choice:has(input[value="БАД"])'); await contactConsent("#review-form")(p); });
await formRun("index.html", "#pf-form", async (p) => { await p.click('#pf-form label.choice:has(input[value="docs"])'); await contactConsent("#pf-form")(p); });
for (const pg of ["marketing.html", "prodvizhenie.html", "analitika.html", "audit-prodazh.html"]) await formRun(pg, "#pf-form", contactConsent("#pf-form"));
await formRun("kak-my-rabotaem.html", "#pf-form", async (p) => { await p.click('#pf-form label.choice:has(input[value="audit"])'); await contactConsent("#pf-form")(p); });
await formRun("avtomatizaciya.html", "#af-form", async (p) => { await p.fill("#af-process", "Заказы аптек приходят в мессенджер"); await contactConsent("#af-form")(p); });
for (const pg of ["dokumenty/registraciya-bad.html", "dokumenty/index.html", "dokumenty/kak-my-rabotaem.html"]) await formRun(pg, "#reg-form", async (p) => { await p.click('#reg-form label.choice:has(input[value="БАД"])'); await p.fill("#rf-url", "example.com/product"); await contactConsent("#reg-form")(p); });
// нормализация адреса
{
  const { ctx, p } = await open(`${BASE}/index.html`, VPS[0]);
  await p.fill("#rv-url", "не адрес"); await p.click('#review-form button[type="submit"]');
  const bad = await p.locator("#review-form .field-error").allTextContents();
  await p.fill("#rv-url", "ozon.ru/product/1"); await p.click('#review-form button[type="submit"]');
  ok(bad.some((x) => x.includes("адрес")) && (await p.inputValue("#rv-url")) === "https://ozon.ru/product/1", "нормализация адреса", "forms");
  // порядок задач: «Документы и регистрация» первым
  const first = await p.evaluate(() => document.querySelector('#pf-form input[name="task"]').value);
  const firstLabel = await p.evaluate(() => document.querySelector('#pf-form .choice span').textContent);
  ok(first === "docs" && norm(firstLabel) === "Документы и регистрация", `главная: первая задача ${first} ${firstLabel}`, "forms");
  await ctx.close();
}
// предвыбор задачи и кнопки data-task
const PRESET = { "index.html": null, "marketing.html": "promo", "prodvizhenie.html": "promo", "analitika.html": "analytics", "audit-prodazh.html": "audit", "kak-my-rabotaem.html": null };
for (const [pg, want] of Object.entries(PRESET)) {
  const { ctx, p } = await open(`${BASE}/${pg}`, VPS[0]);
  const got = await p.evaluate(() => document.querySelector('#pf-form input[name="task"]:checked')?.value ?? null);
  ok(got === want, `${pg}: предвыбрана задача ${got}, ожидалась ${want}`, "forms");
  log(`  ${pg}: задача по умолчанию ${got}`);
  if (pg === "marketing.html") {
    await p.click('[data-task="package"]'); await p.waitForTimeout(700);
    const st = await p.evaluate(() => ({ task: document.querySelector('#pf-form input[name="task"]:checked')?.value, title: document.querySelector("#pf-title").textContent, focus: document.activeElement?.id, top: Math.round(document.getElementById("project-form").getBoundingClientRect().top) }));
    ok(st.task === "package" && st.title.startsWith("Заявка на пакет") && st.focus === "pf-title", `marketing: кнопка пакета ${JSON.stringify(st)}`, "forms");
    log(`  marketing: кнопка пакета → ${JSON.stringify(st)}`);
  }
  await ctx.close();
}

/* 6. Мобильное меню */
log("\n== Мобильное меню");
for (const f of ["index.html", "marketing.html", "dokumenty/registraciya-bad.html", "avtomatizaciya.html"]) {
  const { ctx, p } = await open(`${BASE}/${f}`, VPS[2]);
  await p.locator(".menu-toggle").tap();
  await p.waitForTimeout(150);
  const opened = (await p.isVisible("#mobile-menu")) && (await p.evaluate(() => document.getElementById("mobile-menu").getBoundingClientRect().height)) > 600;
  const inside = [];
  for (let i = 0; i < 12; i++) { await p.keyboard.press("Tab"); inside.push(await p.evaluate(() => !!document.activeElement.closest("#mobile-menu, .menu-toggle"))); }
  for (let i = 0; i < 4; i++) { await p.keyboard.press("Shift+Tab"); inside.push(await p.evaluate(() => !!document.activeElement.closest("#mobile-menu, .menu-toggle"))); }
  const ov = await overflow(p);
  await p.keyboard.press("Escape");
  const closed = await p.isHidden("#mobile-menu");
  const focusBack = await p.evaluate(() => document.activeElement.classList.contains("menu-toggle"));
  const good = opened && inside.every(Boolean) && closed && focusBack && ov === 0;
  ok(good, `${f}: меню ${JSON.stringify({ opened, inside, closed, focusBack, ov })}`, "menu");
  log(`  ${good ? "✓" : "✗"} ${f}: открыто ${opened}, фокус в меню ${inside.every(Boolean)} (${inside.length} нажатий), Escape ${closed}, фокус на кнопке ${focusBack}`);
  if (f === "index.html") await p.locator(".menu-toggle").tap().then(() => p.waitForTimeout(150)).then(() => p.screenshot({ path: `${SHOTS}/menu-390.png` }));
  await ctx.close();
}

/* 7. prefers-reduced-motion */
log("\n== prefers-reduced-motion");
for (const f of ["index.html", "marketing.html", "dokumenty/index.html", "dokumenty/registraciya-bad.html", "avtomatizaciya.html"]) {
  const { ctx, p } = await open(`${BASE}/${f}`, VPS[0], { reducedMotion: "reduce" });
  const a0 = await p.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").length);
  await p.evaluate(() => scrollTo(0, document.body.scrollHeight / 2)); await p.waitForTimeout(200);
  await p.locator(".faq-list summary").first().click().catch(() => {});
  await p.locator(".dir-card, .next-card").first().hover().catch(() => {});
  if (f === "dokumenty/index.html") { await p.click('#quiz-form label.choice:has(input[value="bad"])'); await p.click('#quiz-form label.choice:has(input[value="own"])'); await p.click('#quiz-form button[type="submit"]'); }
  await p.evaluate(() => scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(200);
  const a1 = await p.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").length);
  ok(a0 === 0 && a1 === 0, `${f}: идущие анимации при reduce ${a0}/${a1}`, "motion");
  log(`  ${f}: идущих анимаций ${a0} → ${a1}`);
  await ctx.close();
}
{
  const { ctx, p } = await open(`${BASE}/index.html`, VPS[0]);
  await p.goto(`${BASE}/index.html`); await p.waitForTimeout(30);
  const n = await p.evaluate(() => document.getAnimations().length);
  const cta = await p.evaluate(() => [...document.querySelectorAll(".btn")].reduce((s, b) => s + b.getAnimations().length, 0));
  const ctaOpacity = await p.evaluate(() => getComputedStyle(document.querySelector("[data-primary-cta]")).opacity);
  ok(cta === 0 && ctaOpacity === "1", `CTA анимируется (${cta}) или скрыт (${ctaOpacity})`, "motion");
  log(`  без reduce: анимаций при загрузке ${n}, на кнопках ${cta}, CTA opacity ${ctaOpacity}`);
  await ctx.close();
}
// без JS всё видно
{
  const ctx = await b.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage();
  await p.goto(`${BASE}/index.html`);
  const hidden = await p.evaluate(() => [...document.querySelectorAll(".reveal")].filter((e) => getComputedStyle(e).opacity !== "1").length);
  ok(hidden === 0, `без JS скрыто .reveal: ${hidden}`, "motion");
  await ctx.close();
}

/* 8. Текст */
log("\n== Текст");
const FORBIDDEN = [/инновационн/i, /уникальн/i, /комплексн\S* подход/i, /синерги/i, /эффективн\S* решени/i, /команда профессионалов/i, /лучш(?:ий|ая|ее|ие)(?! момент)/i, /(?<!не )гарантируем/i, /рост продаж в \d/i, /(?![©®™])\p{Extended_Pictographic}/u, /\{\{|⟪|⟫/];
let hits = 0;
for (const f of pages) {
  const html = readFileSync(join(SITE, f), "utf8");
  const body = html.slice(html.indexOf("<body")).replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<s>[\s\S]*?<\/s>/g, " ").replace(/<[^>]+>/g, " ").replace(/ /g, " ");
  for (const re of FORBIDDEN) if (re.test(body)) { hits++; ok(false, `${f}: ${re} «${body.match(re)[0]}»`, "text"); }
  if (/(?<!«)под ключ(?!»)/i.test(body)) { hits++; ok(false, `${f}: «под ключ» в тексте`, "text"); }
  ok(true, "", "text");
}
const js = readFileSync(join(SITE, "assets/site.js"), "utf8");
ok(!/fetch\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage/.test(js), "site.js: сеть или хранилище", "text");
log(`  запрещённых слов и «{{»: ${hits}`);

/* 9. Скриншоты */
const shots = [["index.html", 0, "top"], ["index.html", 0, "full"], ["index.html", 2, "top"], ["index.html", 2, "full"], ["marketing.html", 0, "full"], ["marketing.html", 2, "full"], ["audit-prodazh.html", 2, "full"], ["dokumenty/registraciya-bad.html", 2, "full"]];
for (const [f, vi, mode] of shots) {
  const vp = VPS[vi];
  const { ctx, p } = await open(`${BASE}/${f}`, vp, { reducedMotion: "reduce" });
  await p.screenshot({ path: `${SHOTS}/${f.replace(/\//g, "-").replace(".html", "")}-${vp.name}-${mode}.png`, fullPage: mode === "full" });
  await ctx.close();
}

await b.close();
log("\n== Итог по группам");
for (const [g, s] of Object.entries(stats)) log(`  ${g.padEnd(10)} ${s.pass} ok, ${s.fail} fail`);
log(`\n${fails.length ? `✗ ПРОВАЛЕНО: ${fails.length}` : "✓ ВСЁ ПРОШЛО"}`);
process.exit(fails.length ? 1 : 0);
