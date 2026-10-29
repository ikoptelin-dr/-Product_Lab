import os, re, sys, csv, json, html
from collections import Counter
from posixpath import normpath, join as pjoin, dirname
ROOT = '/home/user/-Product_Lab'
DIST = f'{ROOT}/proba-site-v3/dist'
CONTENT = f'{ROOT}/proba-growth/content/pages'
OUT = sys.argv[1]

# 1. dist files
dist = {}
for r, _, fs in os.walk(DIST):
    for f in fs:
        if f.endswith('.html'):
            dist[os.path.relpath(os.path.join(r, f), DIST)] = open(os.path.join(r, f), encoding='utf-8').read()

# 2. content md → file
HUB = {'': 'index.html', 'dokumenty': 'dokumenty/index.html', 'blog': 'blog/index.html'}
MOVED_SRC = {"kalkulyator-sku": "analitika/kalkulyator-yunit-ekonomiki", "dokumenty/sanpin": "dokumenty/proverki-rospotrebnadzora", "blog/ekonomika-sku-marketplejs": "blog/yunit-ekonomika-prostymi-slovami"}
def file_of(url):
    p = re.sub(r'^/+', '', url); p = re.sub(r'\.html$', '', p); p = re.sub(r'/index$', '', p); p = re.sub(r'/$', '', p)
    if p in HUB: return HUB[p]
    p = MOVED_SRC.get(p, p)
    return p + '.html'
content = {}
held = []
for r, _, fs in os.walk(CONTENT):
    for f in sorted(fs):
        if not f.endswith('.md'): continue
        fp = os.path.join(r, f); raw = open(fp, encoding='utf-8').read()
        fm = re.match(r'^---\n([\s\S]*?)\n---\n', raw)
        front = dict((m.group(1), m.group(2).strip().strip('"')) for m in re.finditer(r'^(\w+):[ \t]*(.*?)[ \t]*$', fm.group(1), re.M))
        body = raw[fm.end():]
        pre = body.split('## Служебное')[0]
        rel = os.path.relpath(fp, ROOT)
        if 'НЕ ПУБЛИКОВАТЬ' in pre:
            held.append((file_of(front.get('url', '')), rel, front.get('type', ''))); continue
        content[file_of(front.get('url', ''))] = (rel, front.get('type', ''), front.get('cluster', ''))

MOVED = {"kalkulyator-sku.html": "analitika/kalkulyator-yunit-ekonomiki.html", "dokumenty/sanpin.html": "dokumenty/proverki-rospotrebnadzora.html", "blog/ekonomika-sku-marketplejs.html": "blog/yunit-ekonomika-prostymi-slovami.html", "dokumenty/kak-my-rabotaem.html": "kak-my-rabotaem.html"}
TS = {
 'marketing.html': 'src/pages/services.ts', 'prodvizhenie.html': 'src/pages/services.ts', 'analitika.html': 'src/pages/services.ts', 'audit-prodazh.html': 'src/pages/services.ts', 'avtomatizaciya.html': 'src/pages/services.ts',
 'oplata.html': 'src/pages/company.ts', 'kontakty.html': 'src/pages/company.ts', 'partneram.html': 'src/pages/company.ts', 'blagotvoritelnost.html': 'src/pages/company.ts', 'novosti.html': 'src/pages/company.ts',
 'ceny.html': 'src/pages/tools.ts', 'dokumenty/karta-dokumentov.html': 'src/pages/tools.ts',
 'blog/index.html': 'src/pages/blog.ts', 'blog/etiketka-bad-do-registracii.html': 'src/pages/blog.ts', 'blog/sgr-ili-deklaraciya.html': 'src/pages/blog.ts',
 'oferta.html': 'src/pages/legal.ts ← proba-legal/oferta.md', 'politika-pd.html': 'src/pages/legal.ts ← proba-legal/politika-pd.md', 'soglasie-pd.html': 'src/pages/legal.ts ← proba-legal/soglasie-pd.md', 'pravovaya-informaciya.html': 'src/pages/legal.ts ← proba-legal/pravovaya-informaciya.md',
}
sitemap = set()
sm = open(f'{DIST}/sitemap.xml', encoding='utf-8').read()
for m in re.finditer(r'<loc>https?://[^/]+/([^<]*)</loc>', sm):
    p = m.group(1) or 'index.html'
    if p.endswith('/'): p += 'index.html'
    sitemap.add(p)

# 3. link graph
inl = Counter(); out_ext = Counter()
for path, h in dist.items():
    for m in re.finditer(r'href="([^"#?]*)(#[^"]*)?"', h):
        href = m.group(1)
        if not href or re.match(r'^(https?:|mailto:|tel:|data:)', href) or not href.endswith('.html'): continue
        tgt = normpath(pjoin(dirname(path), href))
        if tgt != path: inl[tgt] += 1

def purpose(path, src, ctype, body):
    if path in MOVED: return 'служебная (переадресация)'
    if path == '404.html': return 'служебная (404)'
    if path == 'index.html': return 'главная'
    if path in ('oferta.html','politika-pd.html','soglasie-pd.html','pravovaya-informaciya.html'): return 'служебная (юридическая)'
    if path in ('spasibo.html',): return 'служебная (после формы)'
    if ctype == 'case' or (path.startswith('kejsy/')): return 'кейс'
    if path == 'kejsy.html': return 'хаб кейсов'
    if path.startswith('blog/') and path != 'blog/index.html': return 'статья'
    if path == 'blog/index.html': return 'хаб блога'
    if path == 'novosibirsk.html': return 'посадочная (гео)'
    if path in ('dokumenty/index.html','marketing.html','prodvizhenie.html','analitika.html','avtomatizaciya.html'): return 'хаб направления (услуги)'
    if path in ('o-nas.html','kak-my-rabotaem.html','kontakty.html','oplata.html','partneram.html','blagotvoritelnost.html','novosti.html'): return 'компания / информация'
    if path in ('ceny.html',): return 'цены'
    if ctype == 'tool' or path in ('dokumenty/karta-dokumentov.html',): return 'инструмент / лид-магнит'
    return 'услуга'

rows = []
for path in sorted(dist):
    h = dist[path]
    is_redirect = 'http-equiv="refresh"' in h
    if path in content: src, ctype, cluster = content[path][0], content[path][1], content[path][2]; tpl = f'src/pages/content.ts (type={ctype})'
    elif path in TS: src, ctype, cluster = TS[path], '', ''; tpl = TS[path].split(' ←')[0]
    elif path in MOVED: src, ctype, cluster = 'src/site-pages.ts MOVED + scripts/build.mjs', '', ''; tpl = 'meta-refresh заглушка'
    elif path == '404.html': src, ctype, cluster = 'scripts/build.mjs (inline)', '', ''; tpl = 'inline 404'
    elif path.startswith('dokumenty/'): src, ctype, cluster = 'src/regulatory/pages.ts', '', ''; tpl = 'src/regulatory/render.ts'
    else: src, ctype, cluster = '?', '', ''; tpl = '?'
    bc = (re.search(r'<body class="([^"]*)"', h) or [None, ''])[1]
    title = html.unescape((re.search(r'<title>([\s\S]*?)</title>', h) or [None, ''])[1]).strip()
    h1 = html.unescape(re.sub(r'<[^>]+>', '', (re.search(r'<h1[^>]*>([\s\S]*?)</h1>', h) or [None, ''])[1])).replace(' ',' ').strip()
    robots = (re.search(r'<meta name="robots" content="([^"]*)"', h) or [None, ''])[1]
    forms = len(re.findall(r'<form\b', h))
    body = re.sub(r'<script[\s\S]*?</script>|<style[\s\S]*?</style>', ' ', h[h.find('<main'):h.find('</main>')] if '<main' in h else h)
    words = len(re.sub(r'<[^>]+>', ' ', body).split())
    disc = ['dist']
    if path in content or path in TS or path.startswith('dokumenty/'): disc.append('исходник')
    if path in sitemap: disc.append('sitemap')
    if inl[path]: disc.append('внутр.ссылки')
    if path in MOVED: disc.append('MOVED')
    rows.append(dict(url_path=path, status='редирект-заглушка' if is_redirect else ('служебная' if path=='404.html' else 'существует'), purpose=purpose(path, src, ctype, h), template=tpl, source=src, discovered_by='+'.join(disc), in_sitemap='да' if path in sitemap else 'нет', inlinks=inl[path], depth=path.count('/'), forms=forms, words_main=words, body_class=bc, robots=robots or '', title=title, h1=h1))
for path, rel, ctype in held:
    rows.append(dict(url_path=path, status='не публикуется (НЕ ПУБЛИКОВАТЬ)', purpose='услуга', template=f'src/pages/content.ts (type={ctype})', source=rel, discovered_by='исходник', in_sitemap='нет', inlinks=inl[path], depth=path.count('/'), forms='', words_main='', body_class='', robots='', title='', h1=''))
with open(OUT, 'w', newline='', encoding='utf-8') as fh:
    w = csv.DictWriter(fh, fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)
print('dist html', len(dist), 'sitemap', len(sitemap), 'content', len(content), 'held', len(held))
print(Counter(r['status'] for r in rows)); print(Counter(r['purpose'] for r in rows))
print('in dist not sitemap:', [r['url_path'] for r in rows if r['in_sitemap']=='нет' and r['status']=='существует'])
print('sitemap not dist:', sorted(sitemap - set(dist)))
print('orphans (0 inlinks, existing):', [r['url_path'] for r in rows if r['status']=='существует' and not r['inlinks']])
print('unknown src:', [r['url_path'] for r in rows if r['source']=='?'])
print('robots:', Counter(r['robots'] for r in rows))
