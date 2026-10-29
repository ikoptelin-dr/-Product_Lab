// Текстовые узлы, выходящие за экран (с учётом загрузки шрифтов): node probe-text.mjs <base> <page> <width>
import { chromium } from "/home/user/-Product_Lab/proba-site/node_modules/@playwright/test/index.mjs";
const [BASE, page, w] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const p = await (await b.newContext({ viewport: { width: +w, height: 800 } })).newPage();
await p.goto(BASE + page); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
console.log(page, w, JSON.stringify(await p.evaluate(() => {
  const cw = document.documentElement.clientWidth, out = [];
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n; (n = tw.nextNode()); ) {
    if (!n.textContent.trim() || n.parentElement.closest(".ambient, .marquee, svg, .visually-hidden, [hidden]")) continue;
    const r = document.createRange(); r.selectNodeContents(n);
    const right = Math.max(...[...r.getClientRects()].map((x) => x.right), 0);
    if (right > cw + 0.5) { const el = n.parentElement; out.push({ text: n.textContent.replace(/ /g, "⍽").slice(0, 80), el: el.tagName.toLowerCase() + "." + [...el.classList].join("."), right: Math.round(right), elW: Math.round(el.getBoundingClientRect().width), fs: getComputedStyle(el).fontSize }); }
  }
  return { cw, sw: document.documentElement.scrollWidth, out };
}), null, 1));
await b.close();
