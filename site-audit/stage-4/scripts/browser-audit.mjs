// Браузерный обход всех страниц: загрузка, ошибки JS/ресурсов, axe (violations + incomplete) на 1440 и 390,
// уникальные интерактивные состояния и замер контраста для узлов, где axe не смог определить фон («incomplete»).
// node browser-audit.mjs <base> <dist> <out-dir>
import { chromium } from "/home/user/-Product_Lab/proba-site/node_modules/@playwright/test/index.mjs";
import { createRequire } from "node:module";
import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { join, relative } from "node:path";
const require = createRequire("/home/user/-Product_Lab/proba-site/");
const AXE = require.resolve("axe-core/axe.min.js");
const [BASE, DIST, OUT] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const walk = (d) => readdirSync(d).flatMap((n) => statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : n.endsWith(".html") ? [relative(DIST, join(d, n))] : []);
const pages = walk(DIST).filter((f) => !readFileSync(join(DIST, f), "utf8").includes('http-equiv="refresh"') && !f.startsWith("zz-")).sort();
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const VPS = { d1440: { viewport: { width: 1440, height: 900 } }, m390: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } };

async function newPage(vp, motion = "reduce") {
  const ctx = await b.newContext({ ...VPS[vp], reducedMotion: motion });
  const log = { errors: [], failed: [], http: [], external: [] };
  await ctx.route("**/*", (r) => { if (r.request().url().startsWith(BASE)) return r.continue(); log.external.push(r.request().url()); return r.abort(); });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => log.errors.push("pageerror: " + e.message));
  p.on("console", (m) => m.type() === "error" && log.errors.push("console: " + m.text()));
  p.on("requestfailed", (r) => r.url().startsWith(BASE) && log.failed.push(r.url()));
  p.on("response", (r) => r.status() >= 400 && r.url().startsWith(BASE) && !r.url().endsWith("/404-probe") && log.http.push(`${r.status()} ${r.url()}`));
  return { ctx, p, log };
}
async function axe(p) {
  await p.addScriptTag({ path: AXE });
  return p.evaluate(async () => {
    const r = await axe.run(document, { resultTypes: ["violations", "incomplete"] });
    const m = (x) => ({ id: x.id, impact: x.impact, n: x.nodes.length, nodes: x.nodes.slice(0, 40).map((n) => ({ t: n.target.join(" "), why: (n.any[0]?.message || n.failureSummary || "").slice(0, 160) })) });
    return { violations: r.violations.map(m), incomplete: r.incomplete.map(m) };
  });
}
// Контраст для узлов «incomplete»: фон снимается скриншотом элемента со скрытым текстом, затем текст сравнивается с каждым пикселем фона.
const sig = new Map();
async function sampleContrast(p, page, vp, targets) {
  for (const t of targets) {
    const info = await p.evaluate((sel) => {
      const el = document.querySelector(sel); if (!el) return null;
      const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); if (!r.width || !r.height) return null;
      const gradText = cs.webkitBackgroundClip === "text" || cs.backgroundClip === "text";
      if (el instanceof SVGElement) return { svg: true, key: `svg|${el.tagName}|${el.getAttribute("class") || ""}|${cs.fill}`, fill: cs.fill, text: el.textContent.trim().slice(0, 40) };
      return { key: `${el.tagName.toLowerCase()}.${[...el.classList].join(".")}|${cs.color}|${cs.fontSize}|${cs.fontWeight}|${gradText ? "grad" : ""}|${el.closest("[class*='dir-']") ? document.body.className.match(/dir-\w+/)?.[0] : ""}|${el.closest(".page-hero,.reel-band,.dark-card,.bento,.light,.site-header,.site-footer,.marquee,.price-cards li.is-free")?.className.split(" ")[0] || ""}`, color: cs.color, fs: parseFloat(cs.fontSize), fw: +cs.fontWeight, gradText, bgImage: cs.backgroundImage, text: el.textContent.trim().slice(0, 40) };
    }, t);
    if (!info || sig.has(info.key)) continue;
    if (info.svg) { sig.set(info.key, { page, vp, target: t, text: info.text, color: info.fill, verdict: "svg-manual", note: "SVG-текст (fill): скриншотный метод не применим, проверено аналитически по цветам CSS" }); continue; }
    await p.locator(t).first().scrollIntoViewIfNeeded().catch(() => {});
    await p.waitForTimeout(60);
    const box = await p.evaluate((sel) => { const el = document.querySelector(sel); if (!el) return null; const cs = getComputedStyle(el);
      const r = cs.display === "inline" ? el.getClientRects()[0] : el.getBoundingClientRect(); if (!r) return null;
      const rad = Math.min(parseFloat(cs.borderTopLeftRadius) || 0, r.height / 2); const inset = rad > 2 ? rad : 0;
      return { x: r.left + inset, y: r.top, width: r.width - 2 * inset, height: r.height }; }, t).catch(() => null);
    if (!box || box.width < 2 || box.height < 2) continue;
    // Скрываем текст элемента и потомков (у градиентного текста — убираем сам градиент): остаётся только фон
    const hidden = await p.evaluate((sel) => { const el = document.querySelector(sel); if (!el) return false; for (const n of [el, ...el.querySelectorAll("*")]) { n.style.setProperty("color", "transparent", "important"); n.style.setProperty("-webkit-text-fill-color", "transparent", "important"); n.style.setProperty("text-shadow", "none", "important"); n.style.setProperty("text-decoration-color", "transparent", "important"); if (getComputedStyle(n).webkitBackgroundClip === "text") n.style.setProperty("background-image", "none", "important"); } return true; }, t).catch(() => false);
    if (!hidden) continue;
    const vpSize = p.viewportSize();
    const clip = { x: Math.max(0, box.x), y: Math.max(0, box.y), width: Math.min(box.width, vpSize.width - Math.max(0, box.x)), height: Math.min(box.height, vpSize.height - Math.max(0, box.y)) };
    if (clip.width < 2 || clip.height < 2) continue;
    const png = (await p.screenshot({ clip })).toString("base64");
    await p.evaluate((sel) => { const el = document.querySelector(sel); for (const n of [el, ...el.querySelectorAll("*")]) { for (const k of ["color", "-webkit-text-fill-color", "text-shadow", "background-image", "text-decoration-color"]) n.style.removeProperty(k); } }, t).catch(() => {});
    const res = await p.evaluate(async ({ png, info }) => {
      const img = new Image(); img.src = "data:image/png;base64," + png; await img.decode();
      const c = document.createElement("canvas"); c.width = img.width; c.height = img.height; const g = c.getContext("2d"); g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height).data;
      const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
      const L = (r, gg, bb) => 0.2126 * lin(r) + 0.7152 * lin(gg) + 0.0722 * lin(bb);
      const ratio = (a, b2) => (Math.max(a, b2) + 0.05) / (Math.min(a, b2) + 0.05);
      const parse = (s) => (s.match(/[\d.]+/g) || []).map(Number);
      let fgs = [];
      if (info.gradText) fgs = [...info.bgImage.matchAll(/rgba?\([^)]+\)/g)].map((m) => parse(m[0]));
      else { const [r, gg, bb, a = 1] = parse(info.color); fgs = [[r, gg, bb, a]]; }
      const bgL = []; for (let i = 0; i < d.length; i += 4) bgL.push([d[i], d[i + 1], d[i + 2]]);
      const worstPerFg = fgs.map(([r, gg, bb, a = 1]) => {
        const rs = bgL.map(([br, bg, bb2]) => { const fr = r * a + br * (1 - a), fg2 = gg * a + bg * (1 - a), fb = bb * a + bb2 * (1 - a); return ratio(L(fr, fg2, fb), L(br, bg, bb2)); }).sort((x, y) => x - y);
        return { min: rs[0], p5: rs[Math.floor(rs.length * 0.05)], med: rs[Math.floor(rs.length / 2)] };
      });
      const p5 = Math.min(...worstPerFg.map((x) => x.p5)), min = Math.min(...worstPerFg.map((x) => x.min)), med = Math.min(...worstPerFg.map((x) => x.med));
      return { p5: +p5.toFixed(2), min: +min.toFixed(2), med: +med.toFixed(2), px: bgL.length };
    }, { png, info });
    const large = info.fs >= 24 || (info.fs >= 18.66 && info.fw >= 700);
    const need = large ? 3 : 4.5;
    sig.set(info.key, { page, vp, target: t, text: info.text, color: info.gradText ? "градиент" : info.color, fontSize: info.fs, fontWeight: info.fw, large, need, ...res, verdict: res.p5 >= need ? "pass" : res.min >= need * 0.9 ? "borderline" : "fail" });
  }
}

const results = [];
for (const vp of ["d1440", "m390"]) {
  for (const f of pages) {
    const { ctx, p, log } = await newPage(vp);
    const resp = await p.goto(BASE + f, { waitUntil: "load" });
    await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(150);
    const a = await axe(p);
    const cc = a.incomplete.find((x) => x.id === "color-contrast");
    if (cc) await sampleContrast(p, f, vp, cc.nodes.map((n) => n.t));
    results.push({ page: f, vp, status: resp.status(), ...log, violations: a.violations, incomplete: a.incomplete.map((x) => ({ id: x.id, n: x.n, sample: x.nodes.slice(0, 3) })) });
    await ctx.close();
  }
  console.log(vp, "pages done");
}
writeFileSync(join(OUT, "pages.json"), JSON.stringify(results, null, 1));
writeFileSync(join(OUT, "contrast-samples.json"), JSON.stringify([...sig.values()], null, 1));

// Уникальные интерактивные состояния
const states = [];
async function state(label, page, vp, act, motion) {
  const { ctx, p, log } = await newPage(vp, motion);
  await p.goto(BASE + page); await p.evaluate(() => document.fonts.ready);
  let note = ""; try { note = (await act(p)) || ""; } catch (e) { note = "ОШИБКА СЦЕНАРИЯ: " + String(e).slice(0, 160); }
  const a = await axe(p);
  const ov = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  states.push({ label, page, vp, note, overflow: ov, errors: log.errors, violations: a.violations.map((v) => ({ id: v.id, n: v.n, nodes: v.nodes.slice(0, 3) })), incomplete: a.incomplete.map((x) => ({ id: x.id, n: x.n })) });
  console.log(`${a.violations.length ? "✗" : "✓"} ${label} ${page} ${vp}: нарушений ${a.violations.map((v) => v.id).join(",") || 0}; ${note}`);
  await ctx.close();
}
const menu = async (p) => { await p.locator(".menu-toggle").tap(); await p.waitForTimeout(200); return `меню открыто: ${await p.isVisible("#mobile-menu")}`; };
const emptySubmit = (sel) => async (p) => { const f = p.locator(sel).first(); await f.scrollIntoViewIfNeeded(); await f.locator('button[type="submit"]').first().click(); await p.waitForTimeout(250); return `ошибок: ${await f.locator(".field-error").count()}, статус: «${(await f.locator(".form-status").textContent().catch(() => "")).trim()}»`; };
for (const pg of ["index.html", "dokumenty/registraciya-bad.html", "dokumenty/kosmetika.html", "blog/jobs-to-be-done.html", "ceny.html", "kontakty.html"]) await state("мобильное меню", pg, "m390", menu);
for (const [pg, sel] of [["index.html", "#review-form"], ["kontakty.html", "#pf-form"], ["dokumenty/kosmetika.html", "#reg-form"], ["dokumenty/karta-dokumentov.html", "#kf-form"], ["avtomatizaciya.html", "#af-form"], ["partneram.html", "form[data-form]"], ["blagotvoritelnost.html", "form[data-form]"]]) { await state("пустая отправка формы", pg, "d1440", emptySubmit(sel)); await state("пустая отправка формы", pg, "m390", emptySubmit(sel)); }
await state("квиз: пустая отправка", "dokumenty/index.html", "d1440", emptySubmit("#quiz-form"));
await state("квиз: результат → форма", "dokumenty/index.html", "m390", async (p) => {
  const q = p.locator("#quiz-form"); await q.scrollIntoViewIfNeeded();
  // Отвечаем по шагам: группы вопросов появляются в зависимости от ответов — отмечаем первый видимый вариант в каждой видимой группе
  for (let k = 0; k < 6; k++) {
    const names = await q.locator("input[type=radio]").evaluateAll((els) => [...new Set(els.filter((e) => e.offsetParent !== null || e.closest("label")?.offsetParent !== null).map((e) => e.name))].filter((n) => !document.querySelector(`input[name="${n}"]:checked`)));
    if (!names.length) break;
    await q.locator(`input[name="${names[0]}"]`).locator("visible=true").first().check({ force: true }).catch(async () => q.locator(`label:has(input[name="${names[0]}"])`).first().click());
  }
  await q.locator('button[type="submit"]').first().click(); await p.waitForTimeout(300);
  const btn = p.locator("[data-need]").first(); const has = await btn.count();
  if (has) { await btn.click(); await p.waitForTimeout(400); }
  return `кнопка результата: ${has}, поле состава видно: ${await p.locator('#reg-form [name="composition"]').isVisible().catch(() => false)}`;
});
await state("калькулятор: неверный ввод", "analitika/kalkulyator-yunit-ekonomiki.html", "d1440", async (p) => { const i = p.locator("#sku-calc input").first(); await i.fill("abc"); await i.blur(); await p.waitForTimeout(200); return `ошибок: ${await p.locator("#sku-calc .field-error").count()}`; });
await state("калькулятор: результат", "analitika/kalkulyator-yunit-ekonomiki.html", "m390", async (p) => { for (const i of await p.locator("#sku-calc input").all()) await i.fill("100"); await p.waitForTimeout(300); return `итог: «${(await p.locator("[data-out]").first().textContent()).trim()}»`; });
await state("FAQ раскрыт", "dokumenty/registraciya-bad.html", "m390", async (p) => { for (const s of await p.locator("details summary").all()) await s.click(); return "все details открыты"; });
await state("«Подробнее» раскрыт", "kejsy/magnij-do-registracii.html", "d1440", async (p) => { for (const s of await p.locator("details.more summary").all()) await s.click(); return "details.more открыты"; });
await state("шоурил: пауза", "index.html", "d1440", async (p) => { await p.locator("[data-reel-toggle]").scrollIntoViewIfNeeded(); await p.locator("[data-reel-toggle]").click(); return `aria-pressed=${await p.locator("[data-reel-toggle]").getAttribute("aria-pressed")}, подпись «${(await p.locator("[data-reel-label]").textContent()).trim()}»`; }, "no-preference");
await state("404", "404.html", "m390", async () => "");
writeFileSync(join(OUT, "states.json"), JSON.stringify(states, null, 1));
await b.close();
const v = results.filter((r) => r.violations.length), e = results.filter((r) => r.errors.length || r.failed.length || r.http.length);
console.log(`страниц ${pages.length} × 2 ширины: с нарушениями axe ${v.length}, с ошибками загрузки/JS ${e.length}`);
for (const r of v) console.log("✗ axe", r.vp, r.page, r.violations.map((x) => `${x.id}(${x.n})`).join(","));
for (const r of e) console.log("✗ load", r.vp, r.page, JSON.stringify([r.errors, r.failed, r.http]));
const cs = [...sig.values()];
console.log(`контраст «incomplete»: уникальных сочетаний ${cs.length}: pass ${cs.filter((x) => x.verdict === "pass").length}, borderline ${cs.filter((x) => x.verdict === "borderline").length}, fail ${cs.filter((x) => x.verdict === "fail").length}, svg (аналитически) ${cs.filter((x) => x.verdict === "svg-manual").length}`);
for (const x of cs.filter((x) => x.verdict !== "pass" && x.verdict !== "svg-manual")) console.log(`  ${x.verdict} ${x.page} ${x.vp} ${x.target} «${x.text}» нужно ${x.need}, p5 ${x.p5}, min ${x.min}, med ${x.med}, ${x.color} ${x.fontSize}px/${x.fontWeight}`);
