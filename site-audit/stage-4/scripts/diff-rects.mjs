// Прямоугольники элементов, которые этап 4 менял намеренно (для объяснения отличий на скриншотах). node diff-rects.mjs <base> <dist> <out.json>
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
    await p.goto(BASE + f); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(100);
    out[`${f.replace(/[\/.]/g, "_")}--${mode}`] = await p.evaluate(() => {
      const R = (sel, kind) => [...document.querySelectorAll(sel)].map((el) => { const r = el.getBoundingClientRect(); return { kind, x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height }; }).filter((r) => r.w > 0);
      return [...R(".light .step-n", "номер шага (градиент на светлом)"), ...R(".light .grad", "градиентный текст на светлом"), ...R(".page-hero mark.hl, .dark-card mark.hl", "маркер на тёмном"), ...R("h1, h2, h3, p.h2", "заголовок (переносы)"), ...R(".karta-doc, .karta-dash", "карта: подпись над значением / прочерк")];
    });
  }
}
writeFileSync(OUT, JSON.stringify(out));
await b.close();
