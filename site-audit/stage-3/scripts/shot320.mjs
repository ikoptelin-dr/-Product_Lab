import { chromium } from "/home/user/-Product_Lab/proba-site/node_modules/@playwright/test/index.mjs";
const [BASE, OUT] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await b.newContext({ viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
await ctx.route("**/*", (r) => (r.request().url().startsWith(BASE) ? r.continue() : r.abort()));
const p = await ctx.newPage();
for (const pg of ["index.html", "kontakty.html"]) { await p.goto(BASE + pg); await p.waitForTimeout(300); await p.screenshot({ path: `${OUT}/${pg.replace(/\W/g, "_")}-320-full.png`, fullPage: true }); }
await b.close();
