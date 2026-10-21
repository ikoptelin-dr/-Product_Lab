// Шаг 3 фильма: рендер out/render.html в headless Chromium на SwiftShader (GPU в контейнере нет).
//   node src/render.mjs stills                 — кадры 0; 1,6; 2,5; 5; 6,5; 9,3; 11 с → stills/*.png
//   node src/render.mjs probe                  — таблица камеры: скорость, дистанция, наклон (проверка тайминга)
//   node src/render.mjs video <fps> <sub> <taps> <file> [from] [to]
//        например: video 30 1 8 out/preview.mp4   и   video 60 4 24 out/proba-film.mp4
// Кадры идут PNG-потоком в ffmpeg (libx264, yuv420p, crf 16).
import { chromium } from "/home/user/-Product_Lab/proba-site/node_modules/@playwright/test/index.mjs";
import { spawn, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const [mode = "stills", ...args] = process.argv.slice(2);
const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36";
mkdirSync(join(root, "capture/fontcache"), { recursive: true });
const cached = (url) => {
  const f = join(root, "capture/fontcache", createHash("sha1").update(url).digest("hex"));
  if (!existsSync(f)) execFileSync("curl", ["-sSfL", "-A", UA, "-o", f, url]);
  return readFileSync(f);
};

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium",
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--disable-gpu-watchdog", "--disable-renderer-backgrounding"],
});
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1200 }, deviceScaleFactor: 1 });
await ctx.route(/^https?:\/\//, (r) => {
  const u = r.request().url();
  if (u.startsWith("https://fonts.googleapis.com/")) return r.fulfill({ status: 200, contentType: "text/css", body: cached(u) });
  if (u.startsWith("https://fonts.gstatic.com/")) return r.fulfill({ status: 200, contentType: "font/woff2", body: cached(u), headers: { "access-control-allow-origin": "*" } });
  return r.abort();
});
const page = await ctx.newPage();
const logs = [];
page.on("console", (m) => logs.push(m.type() + ": " + m.text()));
page.on("pageerror", (e) => logs.push("pageerror: " + e));
await page.goto("file://" + join(root, "out/render.html") + "#render");
// .stage без полей, плёнка ровно 1440×1152 в левом верхнем углу
await page.addStyleTag({ content: ".stage{padding:0!important;max-width:none!important}.film{border-radius:0!important;box-shadow:none!important}.controls{display:none!important}" });
const t0 = Date.now();
await page.evaluate(() => window.FILM.ready);
console.log(`ready in ${((Date.now() - t0) / 1000).toFixed(1)} s`, logs.join(" | "));
const film = await page.$("#film");
const shot = async (t, o) => {
  await page.evaluate(([t, o]) => window.FILM.seek(t, { ...o, sync: true }), [t, o]);
  return page.screenshot({ type: "png", clip: { x: 0, y: 0, width: 1440, height: 1152 } });
};

if (mode === "stills") {
  mkdirSync(join(root, "stills"), { recursive: true });
  const sub = +(args[0] || 4), taps = +(args[1] || 24);
  for (const t of [0, 1.6, 2.5, 5, 6.5, 9.3, 11]) {
    const s = Date.now();
    writeFileSync(join(root, "stills", `still-${t.toFixed(1).replace(".", "_")}s.png`), await shot(t, { sub, taps }));
    console.log("still", t, ((Date.now() - s) / 1000).toFixed(1) + " s");
  }
} else if (mode === "probe") {
  const rows = await page.evaluate(() => { const r = []; for (let t = 0; t <= 14.5001; t += 0.05) r.push(window.FILM.probe(t)); return r; });
  writeFileSync(join(root, "out/probe.json"), JSON.stringify(rows));
  // проверки: скорость не проседает в полёте, дистанция в полёте не уменьшается
  let dips = 0, zoomIn = 0;
  for (let i = 1; i < rows.length; i++) {
    const a = rows[i - 1], b = rows[i];
    if (b.t > 1.6 && b.t < 7.3 && (b.ty - a.ty) / 0.05 < 0.99 * b.cruise) dips++;
    if (b.t < 7.75 && b.D < a.D - 1e-6) zoomIn++;
  }
  console.log({ cruise: rows[0].cruise.toFixed(1), speedDipsInCruise: dips, zoomInDuringFlight: zoomIn });
  for (const r of rows.filter((_, i) => i % 10 === 0)) console.log(r.t.toFixed(2), "ty", r.ty.toFixed(0), "D", r.D.toFixed(0), "tilt", r.tilt.toFixed(1), "eyeY", r.eyeY.toFixed(0), "eyeZ", r.eyeZ.toFixed(0));
} else if (mode === "video") {
  const fps = +args[0], sub = +args[1], taps = +args[2], file = join(root, args[3]);
  const from = +(args[4] || 0), to = +(args[5] || 14.5);
  const n0 = Math.round(from * fps), n1 = Math.round(to * fps);
  const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(fps), "-c:v", "png", "-i", "-", "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p", "-movflags", "+faststart", file], { stdio: ["pipe", "inherit", "inherit"] });
  const s = Date.now();
  for (let n = n0; n < n1; n++) {
    // титр (≥ 10 с): камера почти стоит, смаз не нужен — один подкадр
    const png = await shot(n / fps, { sub: n / fps >= 10 ? 1 : sub, taps, fps });
    if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once("drain", r));
    if (n % 30 === 0) console.log(`frame ${n}/${n1} · ${((Date.now() - s) / 1000 / (n - n0 + 1)).toFixed(2)} s/frame`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on("close", r));
  console.log(`done ${file} in ${((Date.now() - s) / 60000).toFixed(1)} min`);
}
if (logs.length) console.log(logs.slice(0, 20).join("\n"));
await browser.close();
