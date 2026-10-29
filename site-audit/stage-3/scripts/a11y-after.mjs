// axe-core на затронутых страницах и интерактивных состояниях после исправлений. node a11y-after.mjs <base> <out.json>
import { chromium } from "/home/user/-Product_Lab/proba-site/node_modules/@playwright/test/index.mjs";
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
const require = createRequire("/home/user/-Product_Lab/proba-site/");
const AXE = require.resolve("axe-core/axe.min.js");
const [BASE, OUT] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const out = [];
async function run(label, page, vp, act) {
  const ctx = await b.newContext({ viewport: { width: vp, height: 800 }, isMobile: vp < 800, hasTouch: vp < 800 });
  await ctx.route("**/*", (r) => (r.request().url().startsWith(BASE) ? r.continue() : r.abort()));
  const p = await ctx.newPage(); const errs = [];
  p.on("pageerror", (e) => errs.push(String(e))); p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
  await p.goto(BASE + page); await p.waitForTimeout(400);
  if (act) await act(p);
  await p.addScriptTag({ path: AXE });
  const r = await p.evaluate(async () => { const x = await axe.run(document, { resultTypes: ["violations"] }); return x.violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, t: v.nodes.slice(0, 3).map((n) => n.target.join(" ")) })); });
  const sx = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  out.push({ label, page, vp, violations: r, jsErrors: errs, overflowX: sx });
  console.log(`${r.length ? "✗" : "✓"} ${label} ${page} @${vp}: нарушений ${r.length}${r.length ? " " + r.map((v) => v.id).join(",") : ""}; JS-ошибок ${errs.length}; overflowX ${sx}`);
  await ctx.close();
}
const openMenu = async (p) => { await p.locator(".menu-toggle").tap(); await p.waitForTimeout(250); };
const kartaErrors = async (p) => { const f = p.locator("#kf-form"); await f.scrollIntoViewIfNeeded(); await f.locator('button[type="submit"]').click(); await p.waitForTimeout(250); };
const kartaBigFile = async (p) => { const f = p.locator("#kf-form"); await f.locator('[name="product"]').fill("Тест"); await f.locator('[name="compositionFile"]').setInputFiles({ name: "big.pdf", mimeType: "application/pdf", buffer: Buffer.alloc(5 * 1024 * 1024 + 10, 65) }); await f.locator('[name="contact"]').fill("test@example.com"); await f.locator('[name="consent"]').check({ force: true }); await f.locator('button[type="submit"]').click(); await p.waitForTimeout(250); };
for (const vp of [320, 360]) for (const pg of ["index.html", "kontakty.html", "dokumenty/kosmetika.html"]) { await run("начальный экран", pg, vp); await run("меню открыто", pg, vp, openMenu); }
for (const pg of ["index.html", "dokumenty/registraciya-bad.html", "marketing/pozicionirovanie-brenda.html", "o-nas.html", "kak-my-rabotaem.html", "blog/kak-poluchit-sgr.html", "blog/pozicionirovanie-brenda-eto.html", "dokumenty/kosmetika.html", "dokumenty/vyvod-na-rynok.html", "dokumenty/karta-dokumentov.html"]) for (const vp of [390, 1440]) await run("начальный экран", pg, vp);
for (const vp of [390, 1440]) { await run("ошибки формы «Карты»", "dokumenty/karta-dokumentov.html", vp, kartaErrors); await run("файл > 5 МБ", "dokumenty/karta-dokumentov.html", vp, kartaBigFile); }
await run("страница ошибки приёмника (копия ответа)", "zz-endpoint-error.html", 390);
await run("страница ошибки приёмника (копия ответа)", "zz-endpoint-error.html", 1440);
// Переходы кнопок: цель существует и видна после перехода
for (const [pg, label, target] of [["index.html", "Проверить состав бесплатно", "#quiz"], ["index.html", "Бесплатный разбор продукта", "#review"], ["marketing/pozicionirovanie-brenda.html", "Бесплатный разбор продукта", "#review"], ["dokumenty/registraciya-bad.html", "Проверить состав бесплатно", "#quiz"]]) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await ctx.route("**/*", (r) => (r.request().url().startsWith(BASE) ? r.continue() : r.abort()));
  const p = await ctx.newPage(); await p.goto(BASE + pg);
  await p.locator(".page-hero a.btn", { hasText: label }).first().tap();
  await p.waitForTimeout(900);
  const vis = await p.evaluate((t) => { const el = document.querySelector(t); if (!el) return "нет элемента"; const r = el.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0 ? "в экране" : `вне экрана (top ${Math.round(r.top)})`; }, target);
  const form = target === "#review" ? await p.locator("#review-form").count() : await p.locator("#quiz-form").count();
  out.push({ label: `переход «${label}»`, page: pg, url: p.url().replace(BASE, ""), target: vis, formPresent: form });
  console.log(`${vis === "в экране" && form ? "✓" : "✗"} переход «${label}» с ${pg} → ${p.url().replace(BASE, "")}: цель ${vis}, форма ${form}`);
  await ctx.close();
}
writeFileSync(OUT, JSON.stringify(out, null, 1));
await b.close();
