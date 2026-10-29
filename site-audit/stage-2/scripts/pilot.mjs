// Этап 2: браузерный пилот на 8 страницах. Только чтение: формы не отправляются (все POST и внешние запросы перехватываются и отменяются).
// Запуск: node pilot.mjs <base-url> <dist-dir> <evidence-dir>
import { chromium } from "/home/user/-Product_Lab/proba-site/node_modules/@playwright/test/index.mjs";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname, posix } from "node:path";
import { createRequire } from "node:module";
const require = createRequire("/home/user/-Product_Lab/proba-site/");
const AXE_PATH = require.resolve("axe-core/axe.min.js");
const AXE_VER = require("axe-core/package.json").version;
const PW_VER = require("@playwright/test/package.json").version;

const [BASE, DIST, OUT] = process.argv.slice(2);
const PAGES = ["index.html", "dokumenty/registraciya-bad.html", "marketing/3d-vizualizaciya-upakovki.html", "kejsy/magnij-do-registracii.html", "kontakty.html", "blog/jobs-to-be-done.html", "blog/sgr-ili-deklaraciya.html", "dokumenty/kosmetika.html"];
const VP = { d1440: { viewport: { width: 1440, height: 900 } }, m390: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }, m320: { viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } };
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const results = { meta: { base: BASE, playwright: PW_VER, axe: AXE_VER, browser: b.version(), executablePath: "/opt/pw-browsers/chromium", date: new Date().toISOString() }, pages: {}, scenarios: {} };
const slug = (p) => p.replace(/[\/.]/g, "_");
const mk = (d) => (mkdirSync(d, { recursive: true }), d);

async function ctxFor(vpName, extra = {}) {
  const ctx = await b.newContext({ ...VP[vpName], locale: "ru-RU", ...extra });
  const log = { console: [], pageerror: [], failed: [], http4xx: [], blocked: [] };
  await ctx.route("**/*", (route) => {
    const r = route.request();
    if (!r.url().startsWith(BASE) || r.method() !== "GET") { log.blocked.push(`${r.method()} ${r.url()}`); return route.abort(); }
    return route.continue();
  });
  ctx.on("page", (p) => {
    p.on("console", (m) => { if (["error", "warning"].includes(m.type())) log.console.push(`${m.type()}: ${m.text()}`); });
    p.on("pageerror", (e) => log.pageerror.push(String(e)));
    p.on("requestfailed", (r) => log.failed.push(`${r.url()} ${r.failure()?.errorText}`));
    p.on("response", (r) => { if (r.status() >= 400) log.http4xx.push(`${r.status()} ${r.url()}`); });
  });
  return { ctx, log };
}
async function settle(p) {
  await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); } scrollTo(0, 0); });
  await p.waitForTimeout(900);
}
async function axe(p, label) {
  await p.addScriptTag({ path: AXE_PATH });
  const r = await p.evaluate(async () => {
    const res = await window.axe.run(document, { resultTypes: ["violations", "incomplete"] });
    const m = (x) => ({ id: x.id, impact: x.impact, help: x.help, tags: x.tags.filter((t) => /wcag|best/.test(t)), nodes: x.nodes.slice(0, 8).map((n) => ({ target: n.target.join(" "), summary: (n.failureSummary || "").slice(0, 300), html: n.html.slice(0, 200) })), count: x.nodes.length });
    return { violations: res.violations.map(m), incomplete: res.incomplete.map(m) };
  });
  return { state: label, ...r };
}

for (const page of PAGES) {
  const dir = mk(join(OUT, "pages", slug(page)));
  const R = { page, checks: {} };
  // исходный HTML
  writeFileSync(join(dir, "source.html"), readFileSync(join(DIST, page)));
  for (const vpName of ["d1440", "m390"]) {
    const { ctx, log } = await ctxFor(vpName);
    const p = await ctx.newPage();
    const t0 = Date.now();
    const resp = await p.goto(BASE + page, { waitUntil: "load" });
    const loadMs = Date.now() - t0;
    await settle(p);
    writeFileSync(join(dir, `dom-${vpName}.html`), await p.content());
    await p.screenshot({ path: join(dir, `shot-${vpName}-full.png`), fullPage: true });
    await p.screenshot({ path: join(dir, `shot-${vpName}-fold.png`) });
    const info = await p.evaluate(() => {
      const q = (s) => document.querySelector(s);
      const metaC = (n) => q(`meta[name="${n}"]`)?.getAttribute("content") ?? null;
      const heads = [...document.querySelectorAll("h1,h2,h3,h4")].map((h) => ({ l: +h.tagName[1], t: h.textContent.replace(/\s+/g, " ").trim().slice(0, 90) }));
      let jump = []; heads.reduce((prev, h) => { if (h.l > prev + 1) jump.push(`${prev}→${h.l} «${h.t}»`); return h.l; }, 1);
      const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => { try { const j = JSON.parse(s.textContent); return { ok: true, types: [].concat(j).map((x) => x["@type"]) }; } catch (e) { return { ok: false, err: String(e) }; } });
      const links = [...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href"));
      const vw = innerWidth;
      const fold = [...document.querySelectorAll("a.btn, button.btn, .header-cta")].filter((el) => { const r = el.getBoundingClientRect(); return r.width && r.top >= 0 && r.bottom <= innerHeight; }).map((el) => el.textContent.trim());
      return {
        title: document.title, titleLen: document.title.length, description: metaC("description"), descLen: (metaC("description") || "").length,
        canonical: q('link[rel="canonical"]')?.getAttribute("href") ?? null, robots: metaC("robots"), ogUrl: q('meta[property="og:url"]')?.content ?? null,
        lang: document.documentElement.lang, h1: heads.filter((h) => h.l === 1).map((h) => h.t), headingJumps: jump, headings: heads.length,
        ld, links, ctaInFold: fold, tel: links.filter((l) => l?.startsWith("tel:")).length, mail: links.filter((l) => l?.startsWith("mailto:")).length,
        overflowX: document.documentElement.scrollWidth - vw,
      };
    });
    const ax = await axe(p, `${vpName} initial`);
    R.checks[vpName] = { status: resp.status(), loadMs, ...info, axe: ax, log };
    await ctx.close();
  }
  // 320 px: переполнение и элементы шире экрана
  {
    const { ctx, log } = await ctxFor("m320");
    const p = await ctx.newPage();
    await p.goto(BASE + page, { waitUntil: "load" });
    await settle(p);
    const ov = await p.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const wide = [...document.querySelectorAll("body *")].filter((el) => { const r = el.getBoundingClientRect(); if (!r.width) return false; const st = getComputedStyle(el); let a = el.parentElement, clipped = false; while (a) { const s = getComputedStyle(a); if (/(auto|scroll|hidden|clip)/.test(s.overflowX)) { clipped = true; break; } a = a.parentElement; } return !clipped && (r.right > vw + 1 || r.left < -1) && st.position !== "fixed"; }).slice(0, 10).map((el) => `${el.tagName.toLowerCase()}.${[...el.classList].join(".")} right=${Math.round(el.getBoundingClientRect().right)}`);
      return { scrollW: document.documentElement.scrollWidth, vw, wide };
    });
    await p.screenshot({ path: join(dir, "shot-m320-fold.png") });
    R.checks.m320 = { ...ov, log };
    await ctx.close();
  }
  // внутренние ссылки: существование файла в dist
  const links = R.checks.d1440.links.filter((h) => h && !/^(https?:|mailto:|tel:|#)/.test(h));
  const missing = [];
  for (const h of new Set(links)) {
    const [path, hash] = h.split("#");
    const target = posix.normalize(posix.join(posix.dirname(page), path));
    if (!existsSync(join(DIST, target))) missing.push(h);
  }
  R.checks.internalLinks = { total: links.length, unique: new Set(links).size, missing };
  results.pages[page] = R;
  console.log("✓", page);
}

// Интерактивные состояния и клавиатура
const kb = {};
for (const page of PAGES) {
  const { ctx, log } = await ctxFor("d1440");
  const p = await ctx.newPage();
  await p.goto(BASE + page, { waitUntil: "load" });
  const seq = [];
  for (let i = 0; i < 14; i++) {
    await p.keyboard.press("Tab");
    seq.push(await p.evaluate(() => { const a = document.activeElement; if (!a || a === document.body) return "body"; const s = getComputedStyle(a); const r = a.getBoundingClientRect(); return `${a.tagName.toLowerCase()}${a.className ? "." + String(a.className).split(" ")[0] : ""} «${(a.textContent || a.getAttribute("aria-label") || "").trim().slice(0, 30)}» outline=${s.outlineStyle}/${s.outlineWidth} vis=${r.width > 0 && r.bottom > 0 && r.top < innerHeight}`; }));
  }
  kb[page] = { seq };
  // FAQ раскрыт
  const det = p.locator("details").first();
  if (await det.count()) { await det.locator("summary").click(); kb[page].axeDetails = await axe(p, "d1440 details open"); }
  // Форма: пустая отправка → ошибки
  const form = p.locator("form[data-form]").first();
  if (await form.count()) {
    await form.scrollIntoViewIfNeeded();
    await form.locator('button[type="submit"]').click();
    await p.waitForTimeout(300);
    kb[page].formEmpty = await form.evaluate((f) => ({ status: f.querySelector(".form-status")?.textContent?.trim(), errors: [...f.querySelectorAll(".field-error")].map((e) => e.textContent), invalid: [...f.querySelectorAll('[aria-invalid="true"]')].map((e) => e.name || e.tagName), focused: document.activeElement?.name || document.activeElement?.tagName, unlabeled: [...f.querySelectorAll("input,select,textarea")].filter((i) => i.type !== "hidden" && !(i.labels?.length || i.getAttribute("aria-label") || i.getAttribute("aria-labelledby") || i.closest("fieldset")?.querySelector("legend"))).map((i) => i.name) }));
    kb[page].axeFormErrors = await axe(p, "d1440 form errors");
  }
  kb[page].log = log;
  await ctx.close();
}
results.keyboard = kb;

// Мобильное меню
{
  const { ctx, log } = await ctxFor("m390");
  const p = await ctx.newPage();
  await p.goto(BASE + "index.html", { waitUntil: "load" });
  await p.locator(".menu-toggle").tap();
  await p.waitForTimeout(300);
  await p.screenshot({ path: join(mk(join(OUT, "scenarios")), "menu-390-open.png") });
  const items = await p.locator(".mobile-menu a").evaluateAll((as) => as.map((a) => `${a.textContent.trim()} → ${a.getAttribute("href")}`));
  const axm = await axe(p, "m390 menu open");
  const trap = [];
  for (let i = 0; i < 12; i++) { await p.keyboard.press("Tab"); trap.push(await p.evaluate(() => !!document.activeElement?.closest(".mobile-menu, .site-header"))); }
  await p.keyboard.press("Escape");
  const closed = await p.locator(".menu-toggle").getAttribute("aria-expanded");
  results.scenarios.mobileMenu = { items, contactsInMenu: items.some((x) => /Контакт/i.test(x)), focusStaysInHeader: trap.every(Boolean), escapeClosed: closed === "false", axe: axm, log };
  // путь к контактам: из меню нет — проверяем подвал
  await p.goto(BASE + "index.html");
  const footerContacts = await p.locator("footer a[href*='kontakty']").count();
  results.scenarios.mobileMenu.footerContactsLinks = footerContacts;
  await ctx.close();
}

// Сценарий: главная → услуга → доказательства → обращение
{
  const { ctx, log } = await ctxFor("d1440");
  const p = await ctx.newPage();
  const steps = [];
  await p.goto(BASE + "index.html");
  const svc = p.locator('a[href="dokumenty/registraciya-bad.html"]').first();
  steps.push(`главная: ссылок на регистрацию БАД ${await p.locator('a[href="dokumenty/registraciya-bad.html"]').count()}`);
  await svc.scrollIntoViewIfNeeded(); await Promise.all([p.waitForNavigation(), svc.click()]);
  steps.push(`перешли: ${p.url().replace(BASE, "")}`);
  const proof = await p.locator('a[href*="kejsy"]').evaluateAll((as) => as.map((a) => a.getAttribute("href") + " «" + a.textContent.trim().slice(0, 40) + "»"));
  steps.push(`ссылки на кейсы с услуги: ${proof.length ? proof.join("; ") : "нет (только меню)"}`);
  const caseLinkInBody = await p.locator('main a[href*="kejsy/"]').count();
  steps.push(`ссылок на конкретные кейсы в main: ${caseLinkInBody}`);
  await p.goto(BASE + "kejsy/magnij-do-registracii.html");
  const caseCta = await p.locator('main a.btn, main form[data-form]').evaluateAll((els) => els.map((e) => e.tagName === "FORM" ? `form#${e.id}` : `${e.textContent.trim()} → ${e.getAttribute("href")}`));
  steps.push(`кейс: действия ${caseCta.join("; ")}`);
  results.scenarios.homeServiceProofContact = { steps, log };
  await ctx.close();
}
// Сценарий: статья → услуга
{
  const { ctx } = await ctxFor("d1440");
  const p = await ctx.newPage();
  const out = {};
  for (const a of ["blog/jobs-to-be-done.html", "blog/sgr-ili-deklaraciya.html"]) {
    await p.goto(BASE + a);
    out[a] = await p.locator("main a").evaluateAll((as) => as.map((x) => x.getAttribute("href")).filter((h) => h && /^(\.\.\/)?(marketing|dokumenty|analitika|prodvizhenie)/.test(h)));
    out[a + " heroCta"] = await p.locator(".page-hero a.btn").evaluateAll((as) => as.map((x) => `${x.textContent.trim()} → ${x.getAttribute("href")}`));
  }
  results.scenarios.articleToService = out;
  await ctx.close();
}
// Сценарий: форма без реальной отправки (kontakty)
{
  const { ctx, log } = await ctxFor("m390");
  const p = await ctx.newPage();
  await p.goto(BASE + "kontakty.html");
  const f = p.locator("form[data-form]").first();
  const fields = await f.evaluate((form) => [...form.querySelectorAll("input,select,textarea")].filter((i) => i.type !== "hidden").map((i) => ({ name: i.name, type: i.type, required: i.required, label: (i.labels?.[0]?.textContent || i.closest("fieldset")?.querySelector("legend")?.textContent || "").replace(/\s+/g, " ").trim().slice(0, 60), auto: i.autocomplete })));
  const steps = [];
  await f.locator('[name="contact"]').fill("abc");
  await f.locator('button[type="submit"]').click(); await p.waitForTimeout(200);
  steps.push({ step: "контакт «abc», без согласия", status: await f.locator(".form-status").textContent(), errors: await f.locator(".field-error").allTextContents() });
  // выбрать задачу, если есть радио/селект
  const radio = f.locator('input[name="task"]'); if (await radio.count()) await radio.first().check({ force: true });
  const sel = f.locator('select[name="task"]'); if (await sel.count()) await sel.selectOption({ index: 1 });
  await f.locator('[name="contact"]').fill("test@example.com");
  await f.locator('[name="consent"]').check({ force: true });
  const req = [];
  p.on("request", (r) => req.push(`${r.method()} ${r.url()}`));
  await f.locator('button[type="submit"]').click(); await p.waitForTimeout(500);
  steps.push({ step: "валидные данные (example.com), согласие", status: await f.locator(".form-status").textContent(), errors: await f.locator(".field-error").allTextContents(), url: p.url().replace(BASE, ""), requestsAfterSubmit: req });
  await p.screenshot({ path: join(OUT, "scenarios", "form-kontakty-after-submit-390.png"), fullPage: false });
  results.scenarios.form = { fields, steps, endpointMeta: await p.locator('meta[name="proba-form-endpoint"]').count(), blocked: log.blocked };
  await ctx.close();
}
writeFileSync(join(OUT, "pilot-results.json"), JSON.stringify(results, null, 2));
await b.close();
console.log("done");
