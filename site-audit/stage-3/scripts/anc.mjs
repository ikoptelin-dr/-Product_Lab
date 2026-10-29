import { chromium } from "/home/user/-Product_Lab/proba-site/node_modules/@playwright/test/index.mjs";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const p = await (await b.newContext({ viewport: { width: 320, height: 700 } })).newPage();
for (const pg of ["ceny.html", "kontakty.html"]) {
  await p.goto("http://127.0.0.1:8871/" + pg);
  console.log(pg, JSON.stringify(await p.evaluate(() => {
    const out = []; let e = document.querySelector(".ambient .a1");
    while (e && e !== document.documentElement) { const s = getComputedStyle(e); out.push(`${e.tagName.toLowerCase()}.${[...e.classList].join(".")} ov=${s.overflowX} pos=${s.position} sw=${e.scrollWidth}`); e = e.parentElement; }
    return { sw: document.documentElement.scrollWidth, chain: out, wide: [...document.querySelectorAll("main *")].filter((x) => x.scrollWidth > 330 && getComputedStyle(x).overflowX === "visible").slice(0, 5).map((x) => x.tagName + "." + x.className + " sw=" + x.scrollWidth) };
  })));
}
await b.close();
