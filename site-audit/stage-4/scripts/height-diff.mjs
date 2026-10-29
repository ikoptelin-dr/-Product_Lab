// Какие элементы изменили высоту при 320 px (до/после). node height-diff.mjs <page...>
import { chromium } from "/home/user/-Product_Lab/proba-site/node_modules/@playwright/test/index.mjs";
const pages = process.argv.slice(2);
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const grab = async (base, pg) => { const p = await (await b.newContext({ viewport: { width: 320, height: 900 }, isMobile: true, hasTouch: true, reducedMotion: "reduce" })).newPage(); await p.goto(base + pg); await p.evaluate(() => document.fonts.ready);
  const r = await p.evaluate(() => [...document.querySelectorAll("main h1, main h2, main h3, main p.h2, main .h1-page, main .h2, main .karta-doc, main .step-n, main .hero-lead, main .card-t")].map((el) => `${el.tagName.toLowerCase()}.${[...el.classList].join(".")} «${el.textContent.trim().slice(0, 40)}»|${Math.round(el.getBoundingClientRect().height)}`)); await p.context().close(); return r; };
for (const pg of pages) {
  const a = await grab("http://127.0.0.1:8880/", pg), c = await grab("http://127.0.0.1:8882/", pg);
  const d = a.map((x, i) => [x, c[i]]).filter(([x, y]) => x !== y).map(([x, y]) => `${x.split("|")[0]}: ${x.split("|")[1]} → ${y?.split("|")[1]}`);
  console.log(pg, d.length ? "\n  " + d.join("\n  ") : "— без изменений высоты в проверяемых элементах");
}
await b.close();
