// Скриншоты до/после: полные страницы 390/1440 для затронутых страниц и шапка на 5 ширинах. node shots.mjs <base> <out>
import { chromium } from "/home/user/-Product_Lab/proba-site/node_modules/@playwright/test/index.mjs";
import { mkdirSync } from "node:fs";
const [BASE, OUT] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const FULL = ["index.html", "kontakty.html", "dokumenty/registraciya-bad.html", "marketing/pozicionirovanie-brenda.html", "o-nas.html", "kak-my-rabotaem.html", "blog/kak-poluchit-sgr.html", "blog/pozicionirovanie-brenda-eto.html", "dokumenty/karta-dokumentov.html", "dokumenty/kosmetika.html", "dokumenty/vyvod-na-rynok.html", "blog/jobs-to-be-done.html"];
const HEADER = ["index.html", "kontakty.html", "blog/jobs-to-be-done.html", "dokumenty/kosmetika.html"];
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctxOf = async (w, h, mobile) => {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1, reducedMotion: "reduce" });
  await ctx.route("**/*", (r) => (r.request().url().startsWith(BASE) ? r.continue() : r.abort()));
  return ctx;
};
const slug = (p) => p.replace(/[\/.]/g, "_");
for (const [w, h, m] of [[390, 844, true], [1440, 900, false]]) {
  const ctx = await ctxOf(w, h, m); const p = await ctx.newPage();
  for (const pg of FULL) { await p.goto(BASE + pg); await p.waitForTimeout(300); await p.screenshot({ path: `${OUT}/${slug(pg)}-${w}-full.png`, fullPage: true }); }
  await ctx.close();
}
for (const w of [320, 360, 390, 768, 1440]) {
  const ctx = await ctxOf(w, 700, w < 1000); const p = await ctx.newPage();
  for (const pg of HEADER) {
    await p.goto(BASE + pg); await p.waitForTimeout(200);
    await p.screenshot({ path: `${OUT}/header-${slug(pg)}-${w}.png`, clip: { x: 0, y: 0, width: w, height: 90 } });
  }
  await ctx.close();
}
await b.close();
console.log("ok");
