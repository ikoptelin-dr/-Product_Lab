import { chromium } from "/home/user/-Product_Lab/proba-site/node_modules/@playwright/test/index.mjs";
const [BASE, w, ...pages] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const p = await (await b.newContext({ viewport: { width: +w, height: 900 }, isMobile: +w < 1000 })).newPage();
for (const pg of pages) { await p.goto(BASE + pg); await p.evaluate(() => document.fonts.ready);
  const r = await p.evaluate(() => [...document.querySelectorAll("h1, h2, h3, p.h2")].filter((el) => el.scrollWidth > el.clientWidth + 1).map((el) => `«${el.textContent.trim().slice(0, 50)}» текст ${el.scrollWidth}px > блок ${el.clientWidth}px`));
  console.log(w, pg, r.length ? r.join("; ") : "переполнений нет"); }
await b.close();
