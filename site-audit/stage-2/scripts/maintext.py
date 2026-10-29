# Текст <main> страницы: заголовки, абзацы, пункты — для чтения и цитат. python3 -I maintext.py <html> 
import sys, re, html
h = open(sys.argv[1], encoding='utf-8').read()
m = h[h.find('<main'):h.find('</main>')]
m = re.sub(r'<(script|style|svg)[\s\S]*?</\1>', ' ', m)
m = re.sub(r'<(h[1-4])[^>]*>', lambda x: '\n\n' + '#' * int(x.group(1)[1]) + ' ', m)
m = re.sub(r'<(p|li|tr|summary|dt|dd|figcaption|label|legend|button|option)[^>]*>', '\n', m)
m = re.sub(r'<a [^>]*href="([^"]*)"[^>]*>', r'[', m); m = re.sub(r'</a>', ']', m)
m = re.sub(r'<[^>]+>', ' ', m)
t = html.unescape(m).replace(' ', ' ')
t = re.sub(r'[ \t]+', ' ', t); t = re.sub(r'\n\s*\n\s*\n+', '\n\n', t)
print(t.strip())
