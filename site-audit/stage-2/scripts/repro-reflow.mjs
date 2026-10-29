import { chromium } from "/home/user/-Product_Lab/proba-site/node_modules/@playwright/test/index.mjs";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const out = [];
for (const [label, opts] of [["desktop-320 (zoom 400% эквивалент)", { viewport: { width: 320, height: 720 } }], ["mobile-360", { viewport: { width: 360, height: 760 }, isMobile: true, hasTouch: true }], ["mobile-320", { viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true }]]) {
  const ctx = await b.newContext(opts);
  await ctx.route("**/*", (r) => (r.request().url().startsWith("http://127.0.0.1:8850/") ? r.continue() : r.abort()));
  const p = await ctx.newPage();
  for (const pg of ["index.html", "kontakty.html", "blog/jobs-to-be-done.html"]) {
    await p.goto("http://127.0.0.1:8850/" + pg); await p.waitForTimeout(300);
    const r = await p.evaluate(() => { const t = document.querySelector(".menu-toggle").getBoundingClientRect(); return { clientW: document.documentElement.clientWidth, scrollW: document.documentElement.scrollWidth, toggleLeft: Math.round(t.left), toggleRight: Math.round(t.right), toggleFullyVisible: t.right <= document.documentElement.clientWidth }; });
    out.push(`${label} ${pg} ${JSON.stringify(r)}`);
    if (pg === "index.html") await p.screenshot({ path: `/home/user/-Product_Lab/site-audit/stage-2/evidence/pilot/reflow-${label.split(" ")[0]}.png` });
  }
  await ctx.close();
}
console.log(out.join("\n"));
await b.close();
