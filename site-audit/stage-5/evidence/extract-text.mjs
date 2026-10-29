// Отрисованный текст <main> каждой страницы + ссылки с адресами (для чтения и перелинковки)
import { chromium } from '/home/user/-Product_Lab/proba-site/node_modules/@playwright/test/index.mjs';
import { readdirSync, statSync, writeFileSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
const DIST = process.argv[2], OUT = process.argv[3];
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : p.endsWith('.html') ? [p] : []; });
const files = walk(DIST).filter((f) => !/http-equiv="refresh"/i.test(readFileSync(f, 'utf8')));
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const pg = await b.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const links = {};
for (const f of files) {
  const rel = relative(DIST, f);
  await pg.goto('file://' + f);
  const r = await pg.evaluate(() => {
    const m = document.querySelector('main') || document.body;
    m.querySelectorAll('details').forEach((d) => (d.open = true));
    const ls = [...m.querySelectorAll('a[href]')].map((a) => [a.innerText.replace(/\s+/g, ' ').trim(), a.getAttribute('href')]);
    m.querySelectorAll('a[href]').forEach((a) => { a.append(document.createTextNode(` ⟨→${a.getAttribute('href')}⟩`)); });
    m.querySelectorAll('h1,h2,h3').forEach((h) => h.prepend(document.createTextNode({ H1: '# ', H2: '## ', H3: '### ' }[h.tagName])));
    return { t: document.title, d: document.querySelector('meta[name=description]')?.content || '', text: m.innerText, ls };
  });
  links[rel] = r.ls;
  writeFileSync(join(OUT, rel.replace(/\//g, '_').replace('.html', '.txt')), `FILE ${rel}\nTITLE: ${r.t}\nDESC: ${r.d}\n\n${r.text.replace(/\n{3,}/g, '\n\n')}\n`);
}
writeFileSync(join(OUT, '..', 'links.json'), JSON.stringify(links, null, 0));
await b.close();
console.log(files.length);
