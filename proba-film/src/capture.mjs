// Шаг 1 фильма: снимает лендинг dist/proba-lab.html в headless Chromium (1440 px, DPR 2).
//  • прокручивает страницу до низа и обратно (чтобы сработали все наблюдатели),
//  • размечает «поднимающиеся» куски атрибутом data-layer (карточки, макет отчёта, чипы, кнопка),
//  • снимает страницу без них — тайлами по 2048 CSS px с перекрытием 256 px (под DOF у швов),
//  • снимает каждый кусок отдельно на прозрачном фоне с полями 28 px,
//  • пишет геометрию в capture/layout.json.
// Запуск: node src/capture.mjs   (шрифты Google отдаются из локального кэша через прокси)
import { chromium } from "/home/user/-Product_Lab/proba-site/node_modules/@playwright/test/index.mjs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const out = join(root, "capture");
const site = resolve(root, "../proba-site-v2");
mkdirSync(join(out, "pieces"), { recursive: true });
mkdirSync(join(out, "fontcache"), { recursive: true });

const DPR = 2, W = 1440, TILE = 2048, OVER = 256, PAD = 28;

// Google Fonts из кэша: Chromium сам не ходит через прокси песочницы
const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36";
const cached = (url) => {
  const f = join(out, "fontcache", createHash("sha1").update(url).digest("hex"));
  if (!existsSync(f)) execFileSync("curl", ["-sSfL", "-A", UA, "-o", f, url]);
  return readFileSync(f);
};

writeFileSync(join(out, "page.html"), `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>${readFileSync(join(site, "dist/proba-lab.html"), "utf8")}</body></html>`);

// Что поднимается и как: kind, высота подъёма z (page px), максимальный угол «вставания» (°)
const LAYERS = [
  [".hero-eyebrow", "chip", 72, 30],
  [".hero-actions .btn-ghost", "chip", 62, 30],
  [".hero-actions .btn-primary", "button", 34, 14],
  [".rw-card", "card", 40, 12],
  [".fact", "card", 26, 10],
  [".seg-tabs", "chip", 22, 18],
  ["#panel-ba-bad .ba-card", "card", 32, 12],
  [".app-frame", "report", 28, 7],
  [".levels", "card", 24, 10],
  [".checks", "card", 20, 6],
  [".samples .chip", "chip", 30, 22],
  [".check-result", "card", 30, 9],
  [".check-bridge", "chip", 38, 16],
  [".step0", "card", 26, 8],
  [".price-card", "card", 36, 11],
  [".launch-card", "card", 24, 9],
  [".person", "card", 30, 10],
  [".lead-form", "card", 30, 9],
];

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await browser.newContext({ viewport: { width: W, height: 900 }, deviceScaleFactor: DPR, reducedMotion: "reduce" });
await ctx.route(/^https?:\/\//, (r) => {
  const u = r.request().url();
  if (u.startsWith("https://fonts.googleapis.com/")) return r.fulfill({ status: 200, contentType: "text/css", body: cached(u) });
  if (u.startsWith("https://fonts.gstatic.com/")) return r.fulfill({ status: 200, contentType: "font/woff2", body: cached(u), headers: { "access-control-allow-origin": "*" } });
  return r.abort();
});
const page = await ctx.newPage();
await page.goto("file://" + join(out, "page.html"), { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
// один раз до низа и обратно
await page.evaluate(async () => {
  for (let y = 0; y < document.documentElement.scrollHeight; y += 600) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 30)); }
  scrollTo(0, 0);
});
await page.waitForTimeout(500);

const layout = await page.evaluate(({ LAYERS, PAD }) => {
  const st = document.createElement("style");
  st.textContent = `
    .cap-base [data-layer] { visibility: hidden !important; }
    [data-layer] { box-shadow: none !important; }
    .cap-piece, .cap-piece body { background: transparent !important; }
    .cap-piece body * { visibility: hidden !important; }
    .cap-piece [data-layer].cap-on, .cap-piece [data-layer].cap-on * { visibility: visible !important; }
    .cap-piece [data-layer].cap-on [data-layer], .cap-piece [data-layer].cap-on [data-layer] * { visibility: hidden !important; }
    .sticky-cta { display: none !important; }`;
  document.head.append(st);
  const pieces = [];
  let n = 0;
  for (const [sel, kind, z, stand] of LAYERS)
    for (const el of document.querySelectorAll(sel)) {
      if (el.closest("[hidden]")) continue;
      const r = el.getBoundingClientRect();
      const id = `p${String(n++).padStart(2, "0")}`;
      el.dataset.layer = id;
      // радиус скругления — чтобы тень в фильме повторяла форму
      pieces.push({ id, kind, sel, z, stand, x: r.left + scrollX - PAD, y: r.top + scrollY - PAD, w: r.width + 2 * PAD, h: r.height + 2 * PAD, pad: PAD });
    }
  const hero = document.querySelector(".hero").getBoundingClientRect();
  const btn = document.querySelector(".hero-actions .btn-primary").getBoundingClientRect();
  return { pageW: innerWidth, pageH: document.documentElement.scrollHeight, heroH: hero.height, button: { x: btn.left, y: btn.top + scrollY, w: btn.width, h: btn.height }, pieces };
}, { LAYERS, PAD });

// страница без кусков — тайлами с перекрытием
await page.evaluate(() => document.documentElement.classList.add("cap-base"));
layout.tiles = [];
for (let i = 0, y0 = 0; y0 < layout.pageH; i++, y0 += TILE) {
  // хвост короче 512 px присоединяем к последнему тайлу
  const y1 = layout.pageH - (y0 + TILE) < 512 ? layout.pageH : y0 + TILE;
  const ty0 = Math.max(0, y0 - OVER), ty1 = Math.min(layout.pageH, y1 + OVER);
  const file = `tile${i}.png`;
  await page.screenshot({ path: join(out, file), clip: { x: 0, y: ty0, width: W, height: ty1 - ty0 }, fullPage: true });
  layout.tiles.push({ file, y0, y1, ty0, ty1 });
  console.log("tile", i, y0, y1);
  if (y1 === layout.pageH) break;
}
await page.evaluate(() => document.documentElement.classList.remove("cap-base"));

// каждый кусок отдельно, прозрачный фон
await page.evaluate(() => document.documentElement.classList.add("cap-piece"));
for (const p of layout.pieces) {
  await page.evaluate((id) => { document.querySelectorAll(".cap-on").forEach((e) => e.classList.remove("cap-on")); document.querySelector(`[data-layer="${id}"]`).classList.add("cap-on"); }, p.id);
  p.file = `pieces/${p.id}.png`;
  await page.screenshot({ path: join(out, p.file), clip: { x: p.x, y: p.y, width: p.w, height: p.h }, fullPage: true, omitBackground: true });
}
console.log("pieces", layout.pieces.length);
layout.dpr = DPR; layout.tile = TILE; layout.over = OVER;
writeFileSync(join(out, "layout.json"), JSON.stringify(layout, null, 1));
await browser.close();
