// Полностраничные скриншоты всех страниц (статичные: reduced-motion, шрифты загружены). node shots-all.mjs <base> <dist> <out>
import { chromium } from "/home/user/-Product_Lab/proba-site/node_modules/@playwright/test/index.mjs";
import { readdirSync, readFileSync, statSync, mkdirSync } from "node:fs";
import { join, relative } from "node:path";
const [BASE, DIST, OUT] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const walk = (d) => readdirSync(d).flatMap((n) => statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : n.endsWith(".html") ? [relative(DIST, join(d, n))] : []);
const pages = walk(DIST).filter((f) => !readFileSync(join(DIST, f), "utf8").includes('http-equiv="refresh"') && !f.startsWith("zz-")).sort();
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
for (const [mode, w, m] of [["320m", 320, true], ["390m", 390, true], ["768m", 768, true], ["1440d", 1440, false]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 }, isMobile: m, hasTouch: m, reducedMotion: "reduce" });
  await ctx.route("**/*", (r) => (r.request().url().startsWith(BASE) ? r.continue() : r.abort()));
  const p = await ctx.newPage();
  for (const f of pages) {
    await p.goto(BASE + f, { waitUntil: "load" }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(150);
    await p.screenshot({ path: join(OUT, `${f.replace(/[\/.]/g, "_")}--${mode}.png`), fullPage: true });
  }
  await ctx.close(); console.log(mode, "ok");
}
await b.close();
