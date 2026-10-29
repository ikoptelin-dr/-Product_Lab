import { chromium } from "/home/user/-Product_Lab/proba-site/node_modules/@playwright/test/index.mjs";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
for (const w of [320, 340, 360, 375]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 640 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await ctx.route("**/*", (r) => (r.request().url().startsWith("http://127.0.0.1:8850/") ? r.continue() : r.abort()));
  const p = await ctx.newPage();
  await p.goto("http://127.0.0.1:8850/" + (process.argv[2] || "kontakty.html"));
  await p.waitForTimeout(500);
  const r = await p.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const all = [...document.querySelectorAll("body *")].map((el) => ({ el, r: el.getBoundingClientRect() })).filter((x) => x.r.right > vw + 0.5 && x.r.width > 0);
    const top = all.filter((x) => !all.some((y) => y.el !== x.el && y.el.contains(x.el))).slice(0, 8);
    return { vw, scrollW: document.documentElement.scrollWidth, bodyScroll: document.body.scrollWidth, innerW: innerWidth, vv: visualViewport?.width, list: top.map((x) => `${x.el.tagName.toLowerCase()}.${[...x.el.classList].join(".")} L${Math.round(x.r.left)} R${Math.round(x.r.right)} W${Math.round(x.r.width)} pos=${getComputedStyle(x.el).position}`) };
  });
  console.log(w, JSON.stringify(r));
  if (w === 320) await p.screenshot({ path: "/home/user/-Product_Lab/site-audit/stage-2/evidence/pilot/probe-320-header.png", clip: { x: 0, y: 0, width: 363, height: 120 } }).catch(e=>console.log(String(e)));
  await ctx.close();
}
await b.close();
