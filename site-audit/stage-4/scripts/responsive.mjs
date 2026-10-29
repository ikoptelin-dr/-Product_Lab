// Адаптивность всех страниц: ширина документа, кнопки меню и действия в экране, выход элементов за экран,
// обрезанный текст, локальная прокрутка (таблицы). node responsive.mjs <base> <dist> <out.json>
import { chromium } from "/home/user/-Product_Lab/proba-site/node_modules/@playwright/test/index.mjs";
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
const [BASE, DIST, OUT] = process.argv.slice(2);
const walk = (d) => readdirSync(d).flatMap((n) => statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : n.endsWith(".html") ? [relative(DIST, join(d, n))] : []);
const pages = walk(DIST).filter((f) => !readFileSync(join(DIST, f), "utf8").includes('http-equiv="refresh"') && !f.startsWith("zz-")).sort();
const MODES = [["320m", 320, true], ["320d", 320, false], ["360m", 360, true], ["390m", 390, true], ["768m", 768, true], ["1440d", 1440, false]];
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const res = [];
for (const [mode, w, mobile] of MODES) {
  const ctx = await b.newContext({ viewport: { width: w, height: 800 }, isMobile: mobile, hasTouch: mobile, reducedMotion: "reduce" });
  await ctx.route("**/*", (r) => (r.request().url().startsWith(BASE) ? r.continue() : r.abort()));
  const p = await ctx.newPage();
  for (const f of pages) {
    await p.goto(BASE + f, { waitUntil: "load" });
    await p.evaluate(() => document.fonts.ready);
    const m = await p.evaluate(() => {
      const cw = document.documentElement.clientWidth;
      const clipAnc = (el) => { for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) { const o = getComputedStyle(a).overflowX; if (o !== "visible") return a; } return null; };
      const out = [];
      for (const el of document.querySelectorAll("body *")) {
        const r = el.getBoundingClientRect();
        if (!r.width || getComputedStyle(el).position === "fixed") continue;
        if ((r.right > cw + 0.5 || r.left < -0.5) && !clipAnc(el)) out.push(el);
      }
      const top = out.filter((el) => !out.some((o) => o !== el && o.contains(el)));
      const desc = (el) => `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}${el.classList.length ? "." + [...el.classList].join(".") : ""} «${(el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 50)}» R${Math.round(el.getBoundingClientRect().right)}`;
      // Обрезанный текст: текстовый узел выходит за ближайший контейнер с overflow hidden/clip (видимая часть теряется).
      // Контейнеры с прокруткой (auto/scroll) — допустимая локальная прокрутка, не обрезка. Декоративное не проверяется.
      const clipped = [], textOut = [];
      const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let n; (n = tw.nextNode()); ) {
        const el = n.parentElement;
        if (!n.textContent.trim() || el.closest(".ambient, .marquee, .reel, svg, .visually-hidden, .skip-link, [hidden], details:not([open]) > :not(summary), .mobile-menu")) continue;
        const rg = document.createRange(); rg.selectNodeContents(n);
        const rs = [...rg.getClientRects()].filter((r) => r.width > 0); if (!rs.length) continue;
        const L = Math.min(...rs.map((r) => r.left)), R = Math.max(...rs.map((r) => r.right));
        let c = null, scroll = false;
        for (let a = el; a && a !== document.body; a = a.parentElement) { const o = getComputedStyle(a).overflowX; if (o !== "visible") { c = a; scroll = /(auto|scroll)/.test(o); break; } }
        const label = `${el.tagName.toLowerCase()}${el.classList.length ? "." + [...el.classList].join(".") : ""} «${n.textContent.replace(/\s+/g, " ").trim().slice(0, 45)}»`;
        if (c && !scroll) { const cr = c.getBoundingClientRect(); if (R > cr.right + 1 || L < cr.left - 1) clipped.push(`${label} R${Math.round(R)} в ${c.tagName.toLowerCase()}.${[...c.classList].join(".")} R${Math.round(cr.right)}`); }
        else if (!c && (R > cw + 0.5 || L < -0.5)) textOut.push(`${label} R${Math.round(R)}`);
      }
      const local = [...document.querySelectorAll("main *")].filter((el) => /(auto|scroll)/.test(getComputedStyle(el).overflowX) && el.scrollWidth > el.clientWidth + 1).map((el) => desc(el).slice(0, 70)).slice(0, 5);
      const inView = (sel) => { const el = document.querySelector(sel); if (!el || getComputedStyle(el).display === "none") return null; const r = el.getBoundingClientRect(); return r.left >= -0.5 && r.right <= cw + 0.5; };
      const btnOut = [...document.querySelectorAll("main a.btn, main button")].filter((el) => { const r = el.getBoundingClientRect(); return r.width && (r.right > cw + 0.5 || r.left < -0.5) && !clipAnc(el); }).map(desc).slice(0, 3);
      return { cw, overflow: document.documentElement.scrollWidth - cw, offenders: top.slice(0, 6).map(desc), clipped: clipped.slice(0, 6), textOut: textOut.slice(0, 6), local, toggle: inView(".menu-toggle"), headerCta: inView(".header-cta"), btnOut };
    });
    res.push({ page: f, mode, ...m });
  }
  await ctx.close();
  console.log(mode, "done");
}
await b.close();
writeFileSync(OUT, JSON.stringify(res, null, 1));
const bad = res.filter((r) => r.overflow > 0 || r.toggle === false || r.headerCta === false || r.btnOut.length || r.clipped.length || r.textOut.length);
console.log(`страниц ${pages.length}, проверок ${res.length}, с проблемами ${bad.length}`);
for (const r of bad) console.log(`✗ ${r.mode} ${r.page} overflow=${r.overflow} toggle=${r.toggle} cta=${r.headerCta} ${r.offenders.join(" | ")} ${r.textOut.length ? "TEXT:" + r.textOut.join(" | ") : ""} ${r.btnOut.length ? "BTN:" + r.btnOut.join(" | ") : ""} ${r.clipped.length ? "CLIP:" + r.clipped.join(" | ") : ""}`);
const loc = res.filter((r) => r.local.length); console.log(`локальная прокрутка (допустимо): ${loc.length} проверок, напр. ${[...new Set(loc.flatMap((r) => r.local.map((x) => x.split(" «")[0])))].slice(0, 6).join(", ")}`);
