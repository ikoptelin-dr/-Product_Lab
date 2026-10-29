// Проверки, воспроизводящие найденные ошибки этапа 2 (ISS-003, ISS-004, ISS-006, ISS-007). node checks.mjs <base> <dist> → JSON + код выхода 1 при провале.
import { chromium } from "/home/user/-Product_Lab/proba-site/node_modules/@playwright/test/index.mjs";
import { readFileSync } from "node:fs";
const [BASE, DIST] = process.argv.slice(2);
const res = []; const ok = (name, cond, info) => res.push({ name, pass: !!cond, info });
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
// ISS-003: шапка без горизонтального переполнения, кнопка меню в экране и нажимается
for (const [w, mobile] of [[320, true], [320, false], [360, true], [390, true], [768, true], [1440, false]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 700 }, isMobile: mobile, hasTouch: mobile });
  await ctx.route("**/*", (r) => (r.request().url().startsWith(BASE) ? r.continue() : r.abort()));
  const p = await ctx.newPage();
  for (const pg of ["index.html", "kontakty.html", "blog/jobs-to-be-done.html", "dokumenty/kosmetika.html", "ceny.html"]) {
    await p.goto(BASE + pg);
    const m = await p.evaluate(() => { const t = document.querySelector(".menu-toggle"), r = t.getBoundingClientRect(); return { cw: document.documentElement.clientWidth, sw: document.documentElement.scrollWidth, tR: r.right, shown: getComputedStyle(t).display !== "none" }; });
    ok(`header ${w}${mobile ? "m" : "d"} ${pg}: нет переполнения`, m.sw <= m.cw, m);
    if (m.shown) {
      ok(`header ${w}${mobile ? "m" : "d"} ${pg}: кнопка меню в экране`, m.tR <= m.cw, m);
      if (pg === "index.html") {
        mobile ? await p.locator(".menu-toggle").tap({ timeout: 3000 }).catch(() => {}) : await p.locator(".menu-toggle").click({ timeout: 3000 }).catch(() => {});
        await p.waitForTimeout(250);
        const opened = await p.locator(".menu-toggle").getAttribute("aria-expanded");
        const sx = await p.evaluate(() => scrollX);
        ok(`header ${w}${mobile ? "m" : "d"}: меню открывается без горизонтальной прокрутки`, opened === "true" && sx === 0, { opened, scrollX: sx });
      }
    }
  }
  await ctx.close();
}
await b.close();
// ISS-006 / ISS-007: адреса кнопок (по HTML сборки)
const html = (f) => readFileSync(`${DIST}/${f}`, "utf8");
const hrefOf = (f, label) => [...html(f).matchAll(/<a [^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/g)].filter((m) => m[2].replace(/ /g, " ").trim() === label).map((m) => m[1]);
for (const [f, base] of [["index.html", ""], ["dokumenty/registraciya-bad.html", "../"], ["o-nas.html", ""], ["kak-my-rabotaem.html", ""], ["blog/kak-poluchit-sgr.html", "../"]]) {
  const hs = hrefOf(f, "Проверить состав бесплатно");
  ok(`${f}: «Проверить состав бесплатно» → квиз`, hs.length && hs.every((h) => h === `${base}dokumenty/index.html#quiz`), hs);
}
for (const [f, exp] of [["index.html", "#review"], ["marketing/pozicionirovanie-brenda.html", "index.html#review"], ["blog/pozicionirovanie-brenda-eto.html", "../index.html#review"]]) {
  const hs = hrefOf(f, "Бесплатный разбор продукта").map((h) => h.replace(/^\.\.\/index\.html#/, "../index.html#"));
  const want = f.startsWith("marketing/") ? "../index.html#review" : exp;
  ok(`${f}: «Бесплатный разбор продукта» → форма разбора`, hs.length && hs.every((h) => h === want), hs);
}
ok("index.html: форма разбора #review-form на месте", /id="review-form"/.test(html("index.html")) && /<section id="review"/.test(html("index.html")));
// ISS-004: нет «Партнёр» в колонке исполнителя на двух регуляторных страницах
for (const f of ["dokumenty/kosmetika.html", "dokumenty/vyvod-na-rynok.html"]) {
  const t = html(f).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  ok(`${f}: нет «Партнёр от имени заявителя» / «Партнёр и лаборатория»`, !/Партн[её]р (от имени|и лаборатор)/.test(t));
}
const fails = res.filter((r) => !r.pass);
console.log(JSON.stringify({ total: res.length, failed: fails.length, fails, res }, null, 1));
process.exit(fails.length ? 1 : 0);
