// Что выходит за экран: node probe.mjs <base> <page> <width> <m|d> [reduce]
import { chromium } from "/home/user/-Product_Lab/proba-site/node_modules/@playwright/test/index.mjs";
const [BASE, page, w, md, rm] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await b.newContext({ viewport: { width: +w, height: 800 }, isMobile: md === "m", hasTouch: md === "m", reducedMotion: rm ? "reduce" : "no-preference" });
const p = await ctx.newPage(); await p.goto(BASE + page); await p.waitForTimeout(1500);
console.log(JSON.stringify(await p.evaluate(() => {
  const cw = document.documentElement.clientWidth;
  const all = [...document.querySelectorAll("body *")].map((el) => ({ el, r: el.getBoundingClientRect() })).filter((x) => x.r.width && x.r.right > cw + 0.5);
  const leaf = all.filter((x) => !all.some((y) => y.el !== x.el && x.el.contains(y.el)));
  return { cw, sw: document.documentElement.scrollWidth, leaf: leaf.slice(0, 8).map((x) => `${x.el.tagName.toLowerCase()}.${[...x.el.classList].join(".")} «${x.el.textContent.replace(/\s+/g, " ").trim().slice(0, 60)}» L${Math.round(x.r.left)} R${Math.round(x.r.right)} W${Math.round(x.r.width)} sw=${x.el.scrollWidth} ws=${getComputedStyle(x.el).whiteSpace}`) };
}), null, 1));
await b.close();
