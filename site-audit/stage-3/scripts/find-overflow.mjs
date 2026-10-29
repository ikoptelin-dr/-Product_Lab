import { chromium } from "/home/user/-Product_Lab/proba-site/node_modules/@playwright/test/index.mjs";
const [BASE, page, w] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const p = await (await b.newContext({ viewport: { width: +w, height: 700 } })).newPage();
await p.goto(BASE + page);
console.log(JSON.stringify(await p.evaluate(() => {
  const vw = document.documentElement.clientWidth;
  const all = [...document.querySelectorAll("body *")].map((el) => ({ el, r: el.getBoundingClientRect() })).filter((x) => x.r.right > vw + 0.5 && x.r.width > 0);
  const top = all.filter((x) => !all.some((y) => y.el !== x.el && y.el.contains(x.el)));
  return { vw, sw: document.documentElement.scrollWidth, items: top.slice(0, 8).map((x) => `${x.el.tagName.toLowerCase()}.${[...x.el.classList].join(".")} «${(x.el.textContent || "").trim().slice(0, 40)}» R${Math.round(x.r.right)}`) };
}), null, 1));
await b.close();
