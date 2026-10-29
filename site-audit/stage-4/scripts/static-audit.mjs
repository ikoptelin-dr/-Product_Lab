// Статический обход всех HTML сборки: ссылки и якоря, sitemap ↔ сборка, переадресации ↔ nginx, meta, JSON-LD, заголовки.
// node static-audit.mjs <dist> <nginx.conf> <out.json>
import { readdirSync, readFileSync, statSync, existsSync, writeFileSync } from "node:fs";
import { join, relative, dirname, posix } from "node:path";
const [DIST, NGINX, OUT] = process.argv.slice(2);
const walk = (d) => readdirSync(d).flatMap((n) => statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : n.endsWith(".html") ? [relative(DIST, join(d, n))] : []);
const all = walk(DIST).filter((f) => !f.startsWith("zz-")).sort();
const html = Object.fromEntries(all.map((f) => [f, readFileSync(join(DIST, f), "utf8")]));
const isRedirect = (f) => html[f].includes('http-equiv="refresh"');
const ids = (f) => new Set([...html[f].matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
const pages = all.filter((f) => !isRedirect(f) && f !== "404.html");
const res = { pages: {}, sitemap: {}, redirects: [], summary: {} };
const dec = (s) => s.replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ");
for (const f of [...pages, "404.html"]) {
  const h = html[f], issues = [];
  const head = h.slice(0, h.indexOf("</head>"));
  const title = (head.match(/<title>([\s\S]*?)<\/title>/) || [])[1];
  const desc = (head.match(/<meta name="description" content="([^"]*)"/) || [])[1];
  const canon = (head.match(/<link rel="canonical" href="([^"]*)"/) || [])[1] ?? null;
  const robots = (head.match(/<meta name="robots" content="([^"]*)"/) || [])[1] ?? null;
  const lang = (h.match(/<html lang="([^"]*)"/) || [])[1];
  if (!title) issues.push("нет title"); else if (title.length > 70) issues.push(`title ${title.length} симв.`);
  if (f !== "404.html") { if (!desc) issues.push("нет description"); else if (desc.length < 50 || desc.length > 170) issues.push(`description ${desc.length} симв.`); }
  if (lang !== "ru") issues.push(`lang=${lang}`);
  const hs = [...h.matchAll(/<h([1-6])\b/g)].map((m) => +m[1]);
  const h1 = hs.filter((x) => x === 1).length;
  if (h1 !== 1) issues.push(`H1: ${h1}`);
  let prev = 0; const jumps = []; for (const l of hs) { if (prev && l > prev + 1) jumps.push(`${prev}→${l}`); prev = l; }
  if (jumps.length) issues.push(`пропуск уровней заголовков: ${[...new Set(jumps)].join(",")}`);
  const ld = [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => { try { const j = JSON.parse(m[1]); return [].concat(j).map((x) => x["@type"]).join("/"); } catch (e) { issues.push("JSON-LD не разбирается: " + e.message); return "ERR"; } });
  // ссылки
  const links = [...h.matchAll(/<a\s[^>]*href="([^"]*)"/g)].map((m) => dec(m[1]));
  const broken = [];
  for (const l of links) {
    if (/^(https?:|mailto:|tel:)/.test(l)) { if (/^https?:/.test(l)) broken.push(`внешняя: ${l}`); continue; }
    const [p, hash] = l.split("#");
    const target = p ? (p.startsWith("/") ? p.slice(1) : posix.normalize(posix.join(posix.dirname(f), p))) : f;
    const tf = target.endsWith("/") ? target + "index.html" : target;
    if (!html[tf]) { if (!existsSync(join(DIST, tf))) broken.push(`нет файла: ${l}`); continue; }
    if (isRedirect(tf)) broken.push(`ссылка на переадресацию: ${l}`);
    if (hash && !ids(tf).has(hash)) broken.push(`нет якоря: ${l}`);
  }
  if (broken.length) issues.push(...broken.map((b) => "ссылка — " + b));
  const forms = [...h.matchAll(/<form\s[^>]*id="([^"]*)"[^>]*?(?:data-form="([^"]*)")?/g)].map((m) => `${m[1]}${m[2] ? ":" + m[2] : ""}`);
  res.pages[f] = { title, titleLen: title?.length, descLen: desc?.length, canonical: canon, robots, lang, h1, headings: hs.length, ld, links: links.length, forms, bodyClass: (h.match(/<body class="([^"]*)"/) || [])[1], issues };
}
// sitemap ↔ сборка
const sm = readFileSync(join(DIST, "sitemap.xml"), "utf8");
const locs = [...sm.matchAll(/<loc>https?:\/\/[^/]+\/([^<]*)<\/loc>/g)].map((m) => (m[1] === "" || m[1].endsWith("/") ? m[1] + "index.html" : m[1]));
res.sitemap = { count: locs.length, notBuilt: locs.filter((l) => !html[l]), builtNotInSitemap: pages.filter((p) => !locs.includes(p)), redirectsInSitemap: locs.filter((l) => html[l] && isRedirect(l)), noindexInSitemap: locs.filter((l) => html[l] && /<meta name="robots" content="[^"]*noindex/.test(html[l])), base: (sm.match(/<loc>(https?:\/\/[^/]+)/) || [])[1] };
// переадресации ↔ nginx
const ng = readFileSync(NGINX, "utf8");
for (const f of all.filter(isRedirect)) {
  const to = (html[f].match(/url=([^"]+)"/) || [])[1];
  const target = posix.normalize(posix.join(posix.dirname(f), to));
  const ok = !!html[target] && !isRedirect(target);
  const noindex = /noindex/.test(html[f]);
  const nginx301 = new RegExp(`${f.replace(/[.]/g, "\\.").replace(/\//g, "\\/")}[^;]*301[^;]*${target.replace(/[.]/g, "\\.")}`).test(ng) || ng.includes(f.replace(".html", "")) && ng.includes(target.replace(".html", ""));
  res.redirects.push({ from: f, to: target, targetOk: ok, noindex, nginx301 });
}
const withIssues = Object.entries(res.pages).filter(([, v]) => v.issues.length);
res.summary = { files: all.length, pages: pages.length, redirects: res.redirects.length, pagesWithIssues: withIssues.length, canonicalPresent: Object.values(res.pages).filter((v) => v.canonical).length, robotsMeta: Object.fromEntries(Object.entries(res.pages).filter(([, v]) => v.robots).map(([k, v]) => [k, v.robots])) };
writeFileSync(OUT, JSON.stringify(res, null, 1));
console.log(JSON.stringify(res.summary, null, 1)); console.log("sitemap:", JSON.stringify(res.sitemap)); console.log("redirects:", JSON.stringify(res.redirects));
for (const [k, v] of withIssues) console.log("✗", k, v.issues.join(" | "));
