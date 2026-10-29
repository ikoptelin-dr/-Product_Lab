import { chromium } from "/home/user/-Product_Lab/proba-site/node_modules/@playwright/test/index.mjs";
import { createRequire } from "node:module";
const require = createRequire("/home/user/-Product_Lab/proba-site/");
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.route("**/*", (r) => (r.request().url().startsWith("http://127.0.0.1:8850/") ? r.continue() : r.abort()));
const p = await ctx.newPage();
for (const page of ["dokumenty/registraciya-bad.html", "index.html"]) {
  await p.goto("http://127.0.0.1:8850/" + page);
  for (const y of [0, 1200, 2400]) {
    await p.evaluate((y) => scrollTo(0, y), y);
    await p.waitForTimeout(800);
    await p.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
    const res = await p.evaluate(async () => { const r = await axe.run(".site-header", { runOnly: ["color-contrast"] }); return { v: r.violations.flatMap((x) => x.nodes.map((n) => n.any[0]?.data && `${n.target} ${n.any[0].data.contrastRatio} fg ${n.any[0].data.fgColor} bg ${n.any[0].data.bgColor}`)), cls: document.querySelector(".site-header").className, bg: getComputedStyle(document.querySelector(".site-header")).backgroundColor, under: (() => { const h = document.querySelector(".site-header").getBoundingClientRect(); return document.elementsFromPoint(600, h.bottom + 2).slice(0, 3).map((e) => e.tagName + "." + e.className.toString().split(" ")[0] + " " + getComputedStyle(e).backgroundColor); })() }; });
    console.log(page, "y=" + y, JSON.stringify(res));
    if (page === "dokumenty/registraciya-bad.html" && y === 1200) await p.screenshot({ path: "/home/user/-Product_Lab/site-audit/stage-2/evidence/pilot/header-scrolled-1440.png", clip: { x: 0, y: 0, width: 1440, height: 120 } });
  }
}
await b.close();
