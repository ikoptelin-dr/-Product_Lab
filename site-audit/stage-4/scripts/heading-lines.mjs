// Разбиение заголовков на строки (слово → номер строки) для сравнения до/после. node heading-lines.mjs <base> <dist> <out.json>
import { chromium } from "/home/user/-Product_Lab/proba-site/node_modules/@playwright/test/index.mjs";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
const [BASE, DIST, OUT] = process.argv.slice(2);
const walk = (d) => readdirSync(d).flatMap((n) => statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : n.endsWith(".html") ? [relative(DIST, join(d, n))] : []);
const pages = walk(DIST).filter((f) => !readFileSync(join(DIST, f), "utf8").includes('http-equiv="refresh"')).sort();
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const out = {};
for (const [mode, w, m] of [["320m", 320, true], ["390m", 390, true], ["768m", 768, true], ["1440d", 1440, false]]) {
  const p = await (await b.newContext({ viewport: { width: w, height: 900 }, isMobile: m, hasTouch: m, reducedMotion: "reduce" })).newPage();
  for (const f of pages) {
    await p.goto(BASE + f); await p.evaluate(() => document.fonts.ready);
    out[`${f}|${mode}`] = await p.evaluate(() => [...document.querySelectorAll("h1, h2, h3, p.h2")].map((el) => {
      const lines = []; let lastTop = null, cur = [];
      const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      for (let n; (n = tw.nextNode()); ) { const re = /[^\s ]+/g; let mm; while ((mm = re.exec(n.textContent))) { const rg = document.createRange(); rg.setStart(n, mm.index); rg.setEnd(n, mm.index + mm[0].length); const r = rg.getClientRects()[0]; if (!r) continue; const top = Math.round(r.top); if (lastTop !== null && Math.abs(top - lastTop) > 4) { lines.push(cur.join(" ")); cur = []; } cur.push(mm[0]); lastTop = top; } }
      if (cur.length) lines.push(cur.join(" "));
      return lines.join(" ⏎ ");
    }));
  }
}
writeFileSync(OUT, JSON.stringify(out));
await b.close();
