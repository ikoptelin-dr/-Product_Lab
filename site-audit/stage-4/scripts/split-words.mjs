// Слова, разорванные переносом внутри слова (overflow-wrap) на узких экранах. node split-words.mjs <base> <dist> <width...>
import { chromium } from "/home/user/-Product_Lab/proba-site/node_modules/@playwright/test/index.mjs";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
const [BASE, DIST, ...W] = process.argv.slice(2);
const walk = (d) => readdirSync(d).flatMap((n) => statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : n.endsWith(".html") ? [relative(DIST, join(d, n))] : []);
const pages = walk(DIST).filter((f) => !readFileSync(join(DIST, f), "utf8").includes('http-equiv="refresh"') && !f.startsWith("zz-")).sort();
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
for (const w of W) {
  const p = await (await b.newContext({ viewport: { width: +w, height: 800 }, isMobile: true, hasTouch: true })).newPage();
  let found = 0;
  for (const f of pages) {
    await p.goto(BASE + f); await p.evaluate(() => document.fonts.ready);
    const r = await p.evaluate(() => {
      const out = [];
      for (const el of document.querySelectorAll(".h1-page, .h2, .prose .sec-title, h1, h2, h3")) {
        const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        for (let n; (n = tw.nextNode()); ) {
          const re = /[^\s ]+/g; let m;
          while ((m = re.exec(n.textContent))) {
            const rg = document.createRange(); rg.setStart(n, m.index); rg.setEnd(n, m.index + m[0].length);
            const tops = new Set([...rg.getClientRects()].filter((x) => x.width > 0).map((x) => Math.round(x.top)));
            if (tops.size > 1) out.push(m[0]);
          }
        }
      }
      return out;
    });
    if (r.length) { found++; console.log(`${w} ${f}: ${r.join(", ")}`); }
  }
  console.log(`${w}: страниц с разорванными словами ${found}`);
}
await b.close();
