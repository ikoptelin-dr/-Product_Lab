// Изменённые страницы: скриншоты 320/390 (моб.) и 1440 (десктоп), горизонтальное переполнение и вертикальная обрезка текста.
// node check-pages.mjs <base-url> <out-dir> <page1.html> [page2.html ...]
// Вертикальная обрезка: текстовый узел выходит за нижнюю/верхнюю границу ближайшего предка с overflow ≠ visible
// или элемент с overflow hidden/clip имеет scrollHeight > clientHeight (обрезанный текст, line-clamp).
import { chromium } from "/home/user/-Product_Lab/proba-site/node_modules/@playwright/test/index.mjs";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const [BASE, OUT, ...PAGES] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const res = [];
for (const [mode, w, m] of [["320m", 320, true], ["390m", 390, true], ["1440d", 1440, false]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 }, isMobile: m, hasTouch: m, reducedMotion: "reduce" });
  await ctx.route("**/*", (r) => (r.request().url().startsWith(BASE) ? r.continue() : r.abort()));
  const p = await ctx.newPage();
  for (const f of PAGES) {
    await p.goto(BASE + f, { waitUntil: "load" });
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(150);
    const r = await p.evaluate(() => {
      const de = document.documentElement;
      const overflowX = de.scrollWidth - de.clientWidth;
      const clipped = [];
      const clipAnc = (el) => { for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) { const s = getComputedStyle(a); if (s.overflowY !== "visible" || s.overflowX !== "visible") return a; } return null; };
      const walker = document.createTreeWalker(document.querySelector("main") || document.body, NodeFilter.SHOW_TEXT);
      for (let n; (n = walker.nextNode()); ) {
        if (!n.textContent.trim()) continue;
        const el = n.parentElement;
        if (el.closest('[aria-hidden="true"], .visually-hidden, .sr-only, details:not([open]) > :not(summary), .marquee, script, style')) continue;
        const st = getComputedStyle(el); if (st.visibility === "hidden" || st.display === "none") continue;
        const rg = document.createRange(); rg.selectNodeContents(n); const rr = rg.getBoundingClientRect(); if (!rr.width || !rr.height) continue;
        const a = clipAnc(el); if (!a) continue;
        const ar = a.getBoundingClientRect(); const as = getComputedStyle(a);
        if (as.overflowX === "auto" || as.overflowX === "scroll") { if (rr.top < ar.top - 1 || rr.bottom > ar.bottom + 1) clipped.push({ t: n.textContent.trim().slice(0, 60), why: "в скролл-контейнере по вертикали" }); continue; }
        if (rr.bottom > ar.bottom + 1 || rr.top < ar.top - 1) clipped.push({ t: n.textContent.trim().slice(0, 60), why: "выходит за предка с overflow " + as.overflowY });
        if (rr.right > ar.right + 1 || rr.left < ar.left - 1) clipped.push({ t: n.textContent.trim().slice(0, 60), why: "выходит по горизонтали за предка с overflow " + as.overflowX });
      }
      for (const el of document.querySelectorAll("main *")) {
        const s = getComputedStyle(el);
        if ((s.overflowY === "hidden" || s.overflowY === "clip" || s.webkitLineClamp !== "none") && el.textContent.trim() && el.scrollHeight > el.clientHeight + 2 && !el.closest('[aria-hidden="true"], .marquee, details:not([open])')) {
          clipped.push({ t: el.textContent.trim().slice(0, 60), why: `scrollHeight ${el.scrollHeight} > clientHeight ${el.clientHeight} (${el.className || el.tagName})` });
        }
      }
      return { overflowX, clipped };
    });
    await p.screenshot({ path: join(OUT, `${f.replace(/[\/.]/g, "_")}--${mode}.png`), fullPage: true });
    res.push({ page: f, mode, ...r });
  }
  await ctx.close();
}
await b.close();
writeFileSync(join(OUT, "check.json"), JSON.stringify(res, null, 1));
const bad = res.filter((r) => r.overflowX > 0 || r.clipped.length);
console.log(`${res.length} проверок, проблем: ${bad.length}`);
for (const r of bad) console.log(r.page, r.mode, "overflowX", r.overflowX, JSON.stringify(r.clipped.slice(0, 4)));
