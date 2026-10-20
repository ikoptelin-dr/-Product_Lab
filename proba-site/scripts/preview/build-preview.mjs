// Собирает самодостаточный HTML-файл превью из production-сборки: CSS, шрифты и картинки встроены,
// React-рантайм заменён лёгким скриптом (scripts/preview/preview-entry.ts). Форма в превью заявки не отправляет.
// Запуск: npm run build && node scripts/preview/build-preview.mjs [выходной файл]
import { build } from "esbuild";
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const out = process.argv[2] || join(root, "preview", "proba-lab-preview.html");
const read = (p, enc) => readFileSync(join(root, p), enc);
const dataUri = (buf, mime) => `data:${mime};base64,${buf.toString("base64")}`;

const html = read(".next/server/app/index.html", "utf8");

// CSS + шрифты
const cssHrefs = [...html.matchAll(/href="(\/_next\/static\/css\/[^"]+\.css)"/g)].map((m) => m[1]);
let css = cssHrefs.map((h) => read(".next" + h.replace("/_next", ""), "utf8")).join("\n");
css = css.replace(/url\((?:\.\.\/media|\/_next\/static\/media)\/([^)]+?\.woff2?)\)/g, (_, f) =>
  `url(${dataUri(read(`.next/static/media/${f}`), f.endsWith("woff2") ? "font/woff2" : "font/woff")})`,
);

// Тело страницы без скриптов Next
let body = html.slice(html.indexOf("<body"), html.lastIndexOf("</body>"));
body = body.replace(/^<body[^>]*>/, "");
body = body.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "");
body = body.replace(/<link\b[^>]*>/g, "");

// Картинки next/image → data URI
body = body.replace(/<img\b([^>]*)>/g, (tag, attrs) => {
  const src = attrs.match(/src="([^"]+)"/)?.[1] ?? "";
  const m = src.match(/url=([^&]+)/);
  const file = decodeURIComponent(m ? m[1] : src).replace(/&amp;.*/, "");
  if (!file.startsWith("/")) return tag;
  const mime = file.endsWith(".png") ? "image/png" : file.endsWith(".svg") ? "image/svg+xml" : "image/jpeg";
  const cleaned = attrs
    .replace(/\s(srcSet|srcset|sizes|fetchPriority|fetchpriority|decoding|data-nimg|loading)="[^"]*"/g, "")
    .replace(/src="[^"]+"/, `src="${dataUri(read("public" + file), mime)}"`);
  return `<img${cleaned}>`;
});

// Правовые страницы в превью не публикуются
body = body.replace(/href="\/(privacy|consent|legal)"/g, 'href="#contact" title="Правовые страницы — на рабочем сайте"');
body = body.replace(/\s(target="_blank"|rel="noopener")/g, "");

const js = await build({
  entryPoints: [join(root, "scripts/preview/preview-entry.ts")],
  bundle: true,
  minify: true,
  format: "iife",
  write: false,
  target: "es2020",
  alias: { "@": root },
  logLevel: "silent",
});

const overrides = `
:root{color-scheme:dark}
html,body{background:#0b0b0b}
.reveal{opacity:1;transform:none}
header.fixed{top:env(safe-area-inset-top,0px)}
body::before{content:"";position:fixed;inset:0 0 auto;height:env(safe-area-inset-top,0px);z-index:60;background:#0b0b0b}
`;

const page = `<title>Proba Lab</title>
<meta name="description" content="Бюро доказательной коммерциализации health-продуктов">
<style>${css}\n${overrides}</style>
${body}
<script>${js.outputFiles[0].text.replace(/<\/script/gi, "<\\/script")}</script>
`;
writeFileSync(out, page);
console.log(`✓ ${out} — ${(page.length / 1024).toFixed(0)} КБ`);
