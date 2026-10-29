# Independent QA: re-checking critical audit claims (stage 2)

Date: 2026-10-28. Build: site-audit/stage-2/evidence/build/dist-fresh, served at http://127.0.0.1:8850/.
Scripts and screenshots: /tmp/claude-0/-home-user/6b2e492d-6545-5324-a5ad-78acbdbfab62/scratchpad/qa/ (forms.mjs, reflow.mjs, mob.mjs, karta.mjs).
Nothing under -Product_Lab was modified except this file. Chromium ran with background networking off. Every request went to 127.0.0.1.

## ISS-001: forms deliver nothing. CONFIRMED. P0 for launch is justified.
- `grep -rl proba-form-endpoint dist-fresh` finds only assets/site.js (the reader code). No HTML page has the meta. 52 pages have `form[data-form]`.
- forms.mjs: valid input, consent ticked, submit clicked:
  - kontakty #pf-form: status "Форма заполнена. Отправка пока не подключена.", 0 errors, 0 requests, URL unchanged
  - index #pf-form: same result
  - index #review-form: same result
- src/site.ts:341-346 has the comment "Прототип: адрес приёма заявок не задан…". DEPLOY.md:38/41 says to build with FORM_ENDPOINT=/lead.
- Caveat: kontakty.html still has mailto: and tel: links, so a visitor can still reach the owner. "No **form** delivers a lead" is accurate.
- Side note (UX, not part of the claim): the message says "Форма заполнена". It does not tell the visitor to use the phone or email instead.

## ISS-002: 75 sources unverified vs «Нормы — со специалистом». CONFIRMED. P1 is fair.
- sources.ts has 76 entries: `grep -o 'status[^,]*' | uniq -c` gives 75 × `status: CHECK` (CHECK = "проверить у партнёра") plus 1 `proba-price`. proba-price is "утверждено владельцем", and it is a price, not a regulatory fact.
- index.html contains `Нормы\xa0— со\xa0специалистом` (non-breaking spaces, so a plain grep with normal spaces misses it). It is followed by "цифры, даты и требования идут с источником."
- REGULATORY_VERIFY.md says the fact bases were "собраны по поисковой выдаче: первоисточники не открывались".
- Nuance: the card says norms are handled "with a specialist" and does not literally say "checked". Some pages do disclose the pending state (11 blog pages: "Проверка: … — дата после сверки"; novosti: "Проверяется"). The homepage card has no such disclaimer. The audit's paraphrase ("checked with a specialist") is a fair reading, though a little strong.

## ISS-003: reflow at 320 px. CONFIRMED at 320. Not a blocker at 360. P1 is acceptable.
reflow.mjs checked 6 pages: index, kontakty, ceny, dokumenty/karta-dokumentov, o-nas, blog/markirovka-kosmetiki. All 6 gave identical results:

| context | innerWidth | scrollWidth | .menu-toggle left–right |
|---|---|---|---|
| desktop 320 | 320 | 363 | 319–363 |
| desktop 320 @ DPR4 (≈1280 at 400%) | 320 | 363 | 319–363 |
| mobile emulation 320 | 363 (layout viewport grows; visualViewport 320, scale 1) | 363 | 319–363 |
| desktop 360 | 360 | 363 | 319–363 (3 px clipped) |
| mobile emulation 360 | 363 | 363 | 319–363 |

- The elements that overflow are DIV.header-actions and BUTTON.menu-toggle. At 360 an I.a1 also overflows, and on index the marquee-track does too.
- At 320 the toggle starts at x=319, so only 1 px of it is inside the viewport. Mobile 320: Playwright `tap()` on the toggle timed out because the tap point landed on the header CTA `a.btn-primary` (dokumenty/index.html#quiz). The menu could not be opened without panning (mob.mjs).
- Desktop 320: `click()` did open the menu (aria-expanded=true). That is only because Playwright scrolls the element into view first, which is the same horizontal scroll a user would have to do. It agrees with the claim.
- At 360 the overflow is only 3 px. The toggle is about 93% visible and opens normally (tap ok at mobile 360). Read as "also broken at 360", the claim would be overstated. At 360 this is a cosmetic 3 px horizontal scroll.
- Caveat: real mobile browsers can zoom out to fit overflowing content. Emulation did not (scale 1). The 400% desktop zoom case (WCAG 1.4.10) fails regardless.

## ISS-005: multipart form rejected by the endpoint. CONFIRMED. P1, latent until ISS-001 is fixed, is fair.
- I ran a copy at scratchpad/qa/ep.mjs with `env -i PATH=… PORT=8899 LEAD_LOG=<scratchpad>/leads.jsonl node ep.mjs` (no TG_*, bound to 127.0.0.1).
  - `curl -F consent=on -F product=… -F compositionFile=@comp.txt …/lead` → `HTTP/1.1 400`, body "Нужно согласие на обработку данных"
  - `curl -F consent=on -F contact=a@b.cd …/lead` (multipart, no file) → 400
  - `curl --data 'consent=on&contact=a@b.cd&form=project' …/lead` → `303 Location: /spasibo.html` (control). Only this request was logged.
- End to end (karta.mjs): I loaded the real karta-dokumentov.html and added the meta in the page only, pointing at :8899, then submitted #kf-form validly. The browser sent `multipart/form-data` and got status 400, both with a file and with no file selected. The form contains input[type=file], so site.ts:356 always switches it to multipart.
- Additional: the 400 body has no charset, so the browser shows it as mojibake ("ÐÑƒÐ¶Ð½Ð¾…"). The visitor sees garbage and the lead is lost silently: no log line and no Telegram message.
- Cleanup: the endpoint was stopped (no process left, port 8899 refuses connections). leads.jsonl and comp.txt were deleted.

## ISS-011: release configuration (canonical, sitemap, noindex). MOSTLY CONFIRMED. One detail is overstated. P1 before production is fair.
- og:url: 0 of 85 HTML files have it.
- canonical: 81 of 85 pages have none. The claim says "no canonical", but 4 noindex alias pages do have a relative canonical: blog/ekonomika-sku-marketplejs, dokumenty/kak-my-rabotaem, dokumenty/sanpin, kalkulyator-sku. The claim should say "no canonical on indexable pages".
- robots.txt has `Sitemap: https://proba-lab.ru/sitemap.xml` with the comment "# TODO: заменить адрес после выбора домена".
- sitemap.xml has all 80 `<loc>` entries on https://proba-lab.ru and a TODO comment calling it a placeholder. build.mjs:19 says "домен по почте владельца — подтвердить".
- deploy/nginx.conf has `server_name _;` (line 6, with a TODO) and `X-Robots-Tag "noindex, nofollow" always` (lines 27 and 60).
- build.mjs:18 makes the build throw when PROD=1 and SITE_URL is empty, so there is a guard. This is release configuration and not a preview defect, which agrees with the auditor's framing.

## Verdict
| claim | result | priority |
|---|---|---|
| ISS-001 | CONFIRMED | P0 for launch: justified (phone and email links remain as a fallback) |
| ISS-002 | CONFIRMED (75/76; the remaining one is non-regulatory) | P1: fair |
| ISS-003 | CONFIRMED at 320 / 400% zoom; at 360 only a 3 px overflow, still operable | P1: fair for 1.4.10; do not cite 360 as a failure |
| ISS-005 | CONFIRMED by curl and by a real browser | P1 (latent): fair |
| ISS-011 | MOSTLY CONFIRMED; "no canonical" should be "none on indexable pages" | P1 before production: fair |

Worded more strongly than the evidence supports:
- ISS-011: "no canonical" (4 alias pages have one).
- ISS-002: "checked" paraphrases "со специалистом".
- ISS-003: any reading that 360 px is blocked.

None of the priorities looks inflated.
