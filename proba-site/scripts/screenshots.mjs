// Снимки главной для ревью: node scripts/screenshots.mjs [baseURL]
import { chromium } from "@playwright/test";

const base = process.argv[2] || "http://localhost:3100";
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM_PATH || undefined });
for (const [name, viewport] of [["desktop", { width: 1440, height: 900 }], ["mobile", { width: 390, height: 844 }]]) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: name === "mobile" ? 2 : 1, reducedMotion: "reduce" });
  await page.goto(base, { waitUntil: "networkidle" });
  await page.evaluate(() => document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-visible")));
  await page.screenshot({ path: `tests/screenshots/home-${name}-hero.png` });
  await page.screenshot({ path: `tests/screenshots/home-${name}-full.png`, fullPage: true });
  await page.close();
}
await browser.close();
console.log("ok");
