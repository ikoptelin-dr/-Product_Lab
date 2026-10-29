import { chromium } from "/home/user/-Product_Lab/proba-site/node_modules/@playwright/test/index.mjs";
const [BASE, page, word, w] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const p = await (await b.newContext({ viewport: { width: +w, height: 800 }, isMobile: true, hasTouch: true })).newPage();
await p.goto(BASE + page); await p.evaluate(() => document.fonts.ready);
console.log(JSON.stringify(await p.evaluate((word) => {
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n; (n = tw.nextNode()); ) { const i = n.textContent.indexOf(word); if (i < 0) continue;
    const el = n.parentElement; const rg = document.createRange(); rg.setStart(n, i); rg.setEnd(n, i + word.length);
    const r = [...rg.getClientRects()]; const box = el.getBoundingClientRect();
    return { tag: el.tagName + "." + el.className, fs: getComputedStyle(el).fontSize, box: [Math.round(box.left), Math.round(box.right)], word: r.map((x) => [Math.round(x.left), Math.round(x.right), Math.round(x.top)]) }; }
}, word)));
await b.close();
