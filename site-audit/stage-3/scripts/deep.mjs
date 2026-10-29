import { chromium } from "/home/user/-Product_Lab/proba-site/node_modules/@playwright/test/index.mjs";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const p = await (await b.newContext({ viewport: { width: 320, height: 700 } })).newPage();
await p.goto("http://127.0.0.1:8871/ceny.html");
console.log(JSON.stringify(await p.evaluate(() => [...document.querySelectorAll(".two-col, .two-col *")].filter((x) => x.scrollWidth > x.clientWidth + 1 || x.getBoundingClientRect().right > 321).slice(0, 6).map((x) => `${x.tagName}.${x.className} «${x.textContent.trim().slice(0, 50)}» R${Math.round(x.getBoundingClientRect().right)} W${Math.round(x.getBoundingClientRect().width)}`)), null, 1));
await b.close();
