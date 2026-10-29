# Stage 4: independent QA of the final build

Date: 2026-10-28. Final build: `proba-site-v3/dist`, served at :8882 (`cmp` byte-identical on index/404/ceny). Baseline: `dist-base4`, served at :8880.
Scripts and raw output: `/tmp/claude-0/-home-user/6b2e492d-6545-5324-a5ad-78acbdbfab62/scratchpad/qa4/`
(ovf.mjs, split.mjs, desk.mjs+pix.py, p404.mjs, leads.mjs+stub.mjs+proxy.mjs, con.mjs/gscan.mjs/hl.mjs, axe.mjs).
The pages: 85 HTML files in dist, minus 4 meta-refresh stubs, leaves **81 pages**. Text was measured only after `document.fonts.ready`.
Nothing under the project was modified (only this file was added). No dist file changed while I worked.

## 1. Horizontal overflow and clipped text at 320/360/390. Verdict: CONFIRMED (with a residual issue, see 1b)
Method (`ovf.mjs`): checks every text node's client rects. Text fails if it goes past the viewport or past any ancestor
with overflow other than visible. `.table-wrap` (local scroll) and the aria-hidden `.marquee` are excluded. The script also records `scrollWidth - clientWidth`.
Modes: m320/m360/m390 (isMobile, DPR 2) and d320 (plain desktop context at 320 px). 4 x 81 = 324 checks.
```
baseline  m320 bad 36 | m360 12 | m390 3 | d320 36 ; doc overflow: blagotvoritelnost +16, ceny +24, karta-dokumentov +9 (m320 and d320)
final     m320 0 | m360 0 | m390 0 | d320 0 ; doc overflow: none ; .table-wrap local scroll on 36 page/mode runs (allowed, max 312 px)
```
- Baseline clipping is reproduced: marketing/pozicionirovanie-brenda.html at m390. The H1 runs 79 px past the edge, and the screenshot
  (`b-poz-390.png`) shows «…и функционального пи». The final version (`f-poz-390.png`) wraps the H1 onto 5 lines, with «питания» on its own line.
- The 3 baseline doc overflows are confirmed (ceny «Как складывается итог» +24, blagotvoritelnost H1/H2, karta `dd` «СГР — …» +9). All are 0 in the final build.
- The only flag in the first final run was the index `.marquee` (an intentional ticker: aria-hidden duplicate, overflow:hidden), so I excluded it.

### 1b. Residual issue: words broken mid-word (side effect of `overflow-wrap:break-word`)
`split.mjs` finds words in h1/h2/h3/.h2 whose glyphs land on two lines (final build, isMobile):
```
320: analiz-konkurentov «рынк|а», cjm «покупателей», etiketka-bad «этикетку», kak-poluchit-sgr «бесплатно»,
     programma-pk-obrazec / sistema-haccp «производство», unikalnoe-tp «Сформулировать», registraciya-produkcii «питание»,
     pozicionirovanie-brenda «позиционировани|е»; ceny «(6–7» is just a break after the en dash, so not a defect
360: blog/analiz-konkurentov.html «Заказать исследование рынк|а» (screenshot s-analiz-360.png), ceny «(6–7» (after the dash, fine)
```
At 360 the baseline overflowed («рынка» ran past the edge). It now breaks inside the word. The cause: the `&nbsp;` in «исследование&nbsp;рынка»
is kept (an 18-char pair, under the 18-char threshold), so the unit is wider than the 270 px CTA card at 28 px. The author's ISS-025 / handoff lists only
«позиционирование» and «Сформулировать» at 320, so the list is incomplete, and 360 is not mentioned at all. Severity: low (readable, nothing clipped).
Note: the new verify check «Текст 320 px» only runs at 320 mobile. It does not check 360/390, where pozicionirovanie was clipped, or mid-word breaks.

## 2. Desktop look preserved (1440, 768). Verdict: CONFIRMED (one small inaccuracy in the attribution)
Line breaks in every h1/h2/h3/.h2 on all 81 pages, baseline vs final (`desk.mjs`, animations off):
```
1440: 2 changed — blog/kak-proverit-akkreditaciyu-laboratorii.html H1; ceny.html «Как складывается итог» → «Как складывается ⏎ итог»
768 (desktop and isMobile): 1 changed — the same akkreditaciya H1
```
This matches the author's claim exactly. Full-page 1440 pixel diff (`pix.py`, threshold 8/255, step-n/.grad/mark boxes masked out): 38 pages identical, 36 pages
differ only inside .step-n / .grad / mark.hl boxes. Unexplained pixels remain on: 404 (expected, redesigned page),
akkreditaciya + ceny (the two re-wrapped headings), and **dokumenty/deklaracii.html and dokumenty/laboratorii.html**. On those two the last word of the H1 shifts
about 2 px horizontally (first ink at x=456 → 454; `zoom-dekl.png`). It is not a line-break change: a regular space replaced an nbsp, and the two have different widths.
The author's compare-attribution.csv labels these "заголовок (переносы)". Invisible to the eye, but strictly the claim that everything else is colour-only is off by these two 2 px shifts.

## 3. 404.html. Verdict: CONFIRMED
- axe color-contrast: baseline **5** violations (H1 rgb(39,39,42) on black); final **0** violations, 0 incomplete at both 1440 and m360.
- Keyboard: Tab reaches all 3 links in main. Each focused link has `outline: solid 2px rgb(4,120,87)`, offset 3px, on a light card (`f404-focus.png`).
- Links: /index.html, /dokumenty/index.html, /blog/index.html all exist in dist. Asset paths are root-absolute, so the page works at any URL depth.
  No document overflow at 320/360/390 (part of the 81-page run). Mobile screenshot `final-404-m360.png` is readable.
- Cosmetic: the page has no site header/footer, and the light card sits on a black remainder of the viewport (same structure as baseline).
- NOT verifiable here: that nginx returns real HTTP 404 status with this page (`error_page`). Only the static file was tested.

## 4. Lead and file delivery. Verdict: CONFIRMED
Setup: `mkiso.sh` isolated copy (src diff vs real = identical), built with `FORM_ENDPOINT=/lead DIST=qa4/dist-lead`. Node proxy :9703 serves static files
and forwards POST /lead to the real `deploy/form-endpoint.mjs` on :9702. The Telegram stub :9701 is set through TG_API. The form `dokumenty/karta-dokumentov.html`
was filled in Playwright, with the file attached as a buffer (Cyrillic name «состав-тест <1>.pdf», synthetic content). All logs were deleted after each scenario.
```
A TG ok + file              → 303 /spasibo.html «Заявка отправлена»; stub: sendMessage + sendDocument; log telegram:true filesDelivered:true
B TG down + file            → 200 «Заявка принята, файл не дошёл»; log OK; delivery line telegram:false filesDelivered:false
C TG unconfigured + file    → 200 same page; stub received nothing
D sendDocument 500 + file   → 200 same page; stub: sendMessage, sendDocument, then «Внимание: файл к заявке qa-test@example.com не доставлен (состав-тест <1>.pdf)…»
E log unwritable + TG down  → 502 «Заявка не отправлена» (no success page)   E2 same, no file, TG unconfigured → 502
F TG down, no file, log OK  → 303 /spasibo.html
```
Page text (B/C/D): «Заявку и контакт (qa-test@example.com) мы сохранили и ответим по нему. Файл «…» передать не удалось — заполнять форму
заново не нужно: пришлите файл в ответ на наше сообщение или напишите нам через страницу «Контакты».» It says what was saved and how to send the file.
Log: 2 lines per lead (`id` + `{status:"delivery",ref}`), with all fields and `files:["name (67 байт)"]`. The marker string inside the file
(`SYNTHETIC-FILE-CONTENT`) is **never** in the log. All responses are `text/html; charset=utf-8`, document.characterSet is UTF-8, and Cyrillic in the log and stub is intact.
My own edge cases:
- G: sendDocument hangs. Result: the 200 page after **10.2 s** (TG_TIMEOUT), then the warning. In the worst case (hanging sendMessage + document + warning) the wait can reach about 30 s.
- H: sendMessage returns 500, plus a file, with contact `<b>qa</b>@example.com`. Result: 200 page. The contact is HTML-escaped (`&lt;b&gt;`, no raw markup in the DOM), and so is the filename with `<`.
- I: log unwritable, text delivered, document fails. Result: 200 page plus the warning. Correct, because the text reached Telegram.
- curl: multipart filename «Состав № 2.pdf» reaches sendDocument as UTF-8. An empty file field (`filename=`) is ignored and gives 303.
- Note (low): the 200 page is a POST response, not a redirect (no PRG). Reloading it triggers the browser's "resubmit?" prompt, which would create a duplicate lead.

## 5. Contrast (own computation: WCAG relative luminance on computed gradient stops vs nearest opaque background; sitewide scan of 81 pages at 1440)
Verdict: CONFIRMED
```
                         baseline min CR        final min CR
.step-n light (default)  1.81 (#34d399/#22d3ee)  5.36 (#047857/#0e7490)   160 nodes / 25 pages
.step-n light (.dir-mkt) 2.14                    5.93 (#6d28d9/#0369a1)   52 / 10
.step-n light (.dir-ana) 1.92                    5.48 (#0369a1/#047857)   19 / 3
index «в одной команде»  1.64 on #f4f4f5         4.87                     (46.8px/700, large text → ≥3:1 met)
dark .grad (hero titles) 10.92 / 7.72            10.92 / 7.72 — identical stops (#34d399→#22d3ee, #a78bfa→#38bdf8)
```
Hero `mark.hl` (index, 20px/600, so not large text, needs 4.5): text vs the green highlight band (rgba(52,211,153,.35) over #060607 ≈ #164e3a).
Baseline #a1a1aa: **3.76** (fail). Final #e4e4e7: **7.60** (vs plain bg 15.96). Pass.
CSS diff baseline→final has only: ≤374px rules, `--grad-ink` (+ .dir-mkt/.dir-ana), `.light .grad/.step-n`, an exception that keeps `--grad` for `.light .dark-card/.bento .grad`, and the hero/dark-card mark colour. site.js is unchanged.

## 6. axe-core (violations / incomplete, node counts). Verdict: CONFIRMED
```
final 1440 all 81 pages: violations 0 ; incomplete 4587 (all color-contrast: text over gradients/images that axe cannot resolve)
final m360 17 pages:     violations 0 ; incomplete 804 (all color-contrast)
base  1440 all 81 pages: violations 6 (color-contrast 5 = 404, landmark-unique 1 = novosti) ; incomplete 4591 (+aria-prohibited-attr 4 = karta dash)
```
Sample (17 pages: index, novosti, dokumenty/karta-dokumentov, 404, ceny, blagotvoritelnost, kontakty, o-nas, partneram, kejsy, kak-my-rabotaem, spasibo,
oferta, pozicionirovanie-brenda, akkreditaciya, deklaracii, kalkulyator-yunit-ekonomiki): 0 violations each, at 1440 and m360.
novosti: `aria-label="Список новостей"` (landmark-unique fixed). karta: `<span aria-hidden="true">—</span><span class="visually-hidden">сумма…</span>`,
so the aria-prohibited-attr incomplete is gone. The about 4.6k color-contrast "incomplete" results were not reviewed by hand (they are the same count as baseline).

## Regressions and open points
1. (low) Words now break mid-word in headings or CTA titles at 320 (about 9 pages) and at 360 (blog/analiz-konkurentov «рынк|а»). The author's ISS-025 is incomplete (see 1b).
2. (cosmetic) dokumenty/deklaracii and dokumenty/laboratorii: the last word of the H1 shifts about 2 px at 1440 (nbsp→space). Not colour-only, but invisible.
3. (low) The "file not delivered" page is a direct 200 POST response, so a reload resubmits the lead. A hanging Telegram can hold the visitor for up to about 30 s.
4. (gap) verify «Текст 320 px» covers only 320 mobile. It does not cover 360/390 or mid-word breaks.
Not verified: the real nginx 404 status; real Telegram API behaviour (stub only); Safari/Firefox rendering (Chromium only); the
4.6k axe "incomplete" contrast items; vertical clipping (only horizontal clipping was checked).
