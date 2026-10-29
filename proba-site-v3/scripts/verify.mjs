// Проверка Proba Lab v3 (Playwright). Запуск: scripts/verify.sh [папка-для-скриншотов]
import { chromium } from "/home/user/-Product_Lab/proba-site/node_modules/@playwright/test/index.mjs";
import { build } from "/home/user/-Product_Lab/proba-site/node_modules/esbuild/lib/main.js";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const [BASE, SITE, SHOTS] = process.argv.slice(2);
const sub = (d) => readdirSync(join(SITE, d)).filter((f) => f.endsWith(".html")).map((f) => `${d}/${f}`);
// Переадресации со старых адресов (meta refresh) не проверяем как страницы
const MOVED = new Set(["404.html", "kalkulyator-sku.html", "dokumenty/sanpin.html", "blog/ekonomika-sku-marketplejs.html", "dokumenty/kak-my-rabotaem.html"]);
const pages = [...readdirSync(SITE).filter((f) => f.endsWith(".html")), ...["dokumenty", "blog", "marketing", "analitika", "avtomatizaciya", "prodvizhenie", "kejsy"].flatMap(sub)].filter((f) => !MOVED.has(f)).sort();
const LEGAL = ["oferta.html", "politika-pd.html", "soglasie-pd.html", "pravovaya-informaciya.html"];
const COMPANY = { tel: "tel:+79811002848", mail: "mailto:i.koptelin@proba-lab.ru", inn: "540821689171", email: "i.koptelin@proba-lab.ru" };
const CONSENT_TEXT = "Согласен на обработку персональных данных";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const log = (...a) => console.log(...a);
const fails = [];
const stats = {};
const ok = (cond, msg, group = "misc") => { stats[group] = stats[group] || { pass: 0, fail: 0 }; cond ? stats[group].pass++ : stats[group].fail++; if (!cond) { fails.push(msg); log("  ✗ " + msg); } return cond; };
const VPS = [
  { name: "1440", viewport: { width: 1440, height: 900 } },
  { name: "768", viewport: { width: 768, height: 1024 } },
  { name: "390", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
];
// Шрифты локальные (assets/fonts): внешних запросов не должно быть совсем
const isFont = () => false;
const isLocal = (u) => u.startsWith(BASE) || u.startsWith("data:");
const norm = (s) => (s || "").replace(/ /g, " ");

async function open(url, vp, extra = {}) {
  const ctx = await b.newContext({ viewport: vp.viewport, isMobile: vp.isMobile, hasTouch: vp.hasTouch, deviceScaleFactor: vp.deviceScaleFactor, ...extra });
  await ctx.addInitScript(() => {
    window.__storage = 0;
    for (const k of ["getItem", "setItem", "removeItem", "clear", "key"]) {
      const orig = Storage.prototype[k];
      Storage.prototype[k] = function (...a) { window.__storage++; return orig.apply(this, a); };
    }
  });
  const p = await ctx.newPage();
  const errs = [], ext = [];
  p.on("pageerror", (e) => errs.push(e.message));
  p.on("console", (m) => m.type() === "error" && !/fonts\.(googleapis|gstatic)/.test(m.location()?.url || "") && errs.push(m.text()));
  p.on("request", (r) => { const u = r.url(); if (!isLocal(u) && !isFont(u)) ext.push(u); });
  await p.goto(url, { waitUntil: "load" });
  await p.waitForTimeout(350);
  return { ctx, p, errs, ext };
}
const overflow = (p) => p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

/* 1. Все страницы × 3 ширины */
log(`\n== Страницы (${pages.length}) × ширины`);
const meta = {};
for (const vp of VPS) {
  for (const f of pages) {
    const { ctx, p, errs, ext } = await open(`${BASE}/${f}`, vp);
    const ov = await overflow(p);
    ok(ov === 0, `${f}@${vp.name}: горизонтальное переполнение ${ov}px`, "layout");
    ok((await p.locator("h1").count()) === 1, `${f}@${vp.name}: h1 ≠ 1`, "layout");
    if (vp.name === "390") {
      // У юридических документов (body.page-legal) кнопки в первом экране нет — это документ, а не посадочная страница
      const r = await p.evaluate(() => { const el = document.querySelector("[data-primary-cta]"); if (!el) return { legal: document.body.classList.contains("page-legal"), bottom: 0, h: 0 }; const e = el.getBoundingClientRect(); return { bottom: Math.round(e.bottom), h: Math.round(e.height) }; });
      ok(r.legal || (r.bottom <= 844 && r.h > 0), `${f}@390: CTA ниже первого экрана (bottom=${r.bottom})`, "cta390");
      const small = await p.evaluate(() => [...document.querySelectorAll("a, button, summary, .choice span")].filter((el) => { const s = getComputedStyle(el); if (s.display === "none" || s.visibility === "hidden" || el.closest("[hidden], .crumbs li span, .skip-link")) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.height < 40 && !el.closest("p, li:not(.svc-grid li):not(.dir-grid li):not(.next-grid li):not(.blog-list li), dd, .quiz-list, .consent"); }).map((el) => `${el.tagName}.${el.className}:${Math.round(el.getBoundingClientRect().height)}`));
      ok(small.length === 0, `${f}@390: мелкие цели касания ${JSON.stringify(small.slice(0, 5))}`, "touch");
      log(`  ${f.padEnd(32)} 390: overflow ${ov}, CTA bottom ${r.bottom}px`);
    }
    const visHidden = await p.evaluate(() => [...document.querySelectorAll("[hidden]")].filter((e) => { const r = e.getBoundingClientRect(); return r.width * r.height > 0; }).length);
    ok(visHidden === 0, `${f}@${vp.name}: видимые [hidden] = ${visHidden}`, "layout");
    ok(errs.length === 0, `${f}@${vp.name}: ошибки консоли ${JSON.stringify(errs)}`, "console");
    ok(ext.length === 0, `${f}@${vp.name}: внешние запросы ${JSON.stringify(ext)}`, "network");
    ok((await p.evaluate(() => window.__storage)) === 0, `${f}@${vp.name}: обращения к хранилищу`, "storage");
    if (vp.name === "1440") {
      meta[f] = await p.evaluate(() => ({
        title: document.title,
        desc: document.querySelector('meta[name="description"]')?.content,
        lang: document.documentElement.lang,
        charset: document.characterSet,
        viewport: !!document.querySelector('meta[name="viewport"]'),
        og: [...document.querySelectorAll('meta[property^="og:"]')].map((m) => m.getAttribute("property")),
        ld: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => s.textContent),
        doctype: document.doctype?.name,
        headings: [...document.querySelectorAll("h1,h2,h3")].map((h) => h.tagName),
        unlabeled: [...document.querySelectorAll("input,select,textarea")].filter((el) => el.type !== "hidden" && !el.labels?.length && !el.closest("label") && !el.getAttribute("aria-label")).map((el) => el.name),
        skip: !!document.querySelector('.skip-link[href="#main"]') && !!document.getElementById("main"),
        details: document.querySelectorAll(".faq-list details").length,
        quizCta: !!document.querySelector('.site-header a.header-cta[href$="dokumenty/index.html#quiz"]'),
        nav: [...document.querySelectorAll(".main-nav a")].map((a) => a.textContent.trim()),
        live: [...document.querySelectorAll(".form-status")].every((s) => s.getAttribute("aria-live") === "polite"),
        consent: [...document.querySelectorAll("form[data-form]")].map((fm) => {
          const l = fm.querySelector("label.consent");
          const a = l?.querySelector("a");
          return { form: fm.id, text: (l?.textContent || "").replace(/\s+/g, " ").trim(), linkText: a?.textContent.trim(), href: a ? new URL(a.getAttribute("href"), location.href).pathname : null, target: a?.getAttribute("target") || "", input: !!l?.querySelector('input[type="checkbox"][name="consent"]') };
        }),
        footer: {
          company: [...document.querySelectorAll('.site-footer nav[aria-label="Компания"] a')].map((a) => a.textContent.trim()),
          clients: [...document.querySelectorAll('.site-footer nav[aria-label="Клиентам"] a')].map((a) => a.textContent.trim()),
          legal: document.querySelector(".footer-legal")?.textContent.replace(/\s+/g, " ").trim(),
          tel: !!document.querySelector(`.site-footer a[href="tel:+79811002848"]`),
          mail: !!document.querySelector(`.site-footer a[href="mailto:i.koptelin@proba-lab.ru"]`),
        },
      }));
      if (vp.name === "1440") {
        // «Цены» в шапке: всё меню в одну строку и не упирается в кнопку
        const hdr = await p.evaluate(() => { const links = [...document.querySelectorAll(".main-nav a")].map((a) => a.getBoundingClientRect()); const nav = document.querySelector(".main-nav").getBoundingClientRect(); const act = document.querySelector(".header-actions").getBoundingClientRect(); return { rows: new Set(links.map((r) => Math.round(r.top))).size, gap: Math.round(act.left - nav.right) }; });
        ok(hdr.rows === 1 && hdr.gap >= 8, `${f}@1440: меню в шапке ${JSON.stringify(hdr)}`, "layout");
      }
    }
    await ctx.close();
  }
}

/* 2. Метаданные и JSON-LD */
log("\n== Метаданные и JSON-LD");
const titles = new Set(), descs = new Set();
// Страницы с разметкой Service: направления, раздел «Документы» и услуги из proba-growth/content (marketing/, analitika/, avtomatizaciya/, prodvizhenie/)
const SERVICE = ["marketing.html", "prodvizhenie.html", "analitika.html", "audit-prodazh.html", "avtomatizaciya.html", ...pages.filter((f) => (f.startsWith("dokumenty/") && !/index|kak-my|karta-dokumentov/.test(f)) || /^(marketing|analitika|avtomatizaciya|prodvizhenie)\//.test(f))];
const ldOf = (f) => meta[f].ld.map((s) => { try { return JSON.parse(s); } catch { return {}; } });
for (const [f, m] of Object.entries(meta)) {
  ok(m.doctype === "html" && m.lang === "ru" && m.charset === "UTF-8" && m.viewport, `${f}: doctype/lang/charset/viewport`, "meta");
  ok(!titles.has(m.title), `${f}: повтор title`, "meta"); titles.add(m.title);
  ok(m.desc && !descs.has(m.desc), `${f}: description пустой или повтор`, "meta"); descs.add(m.desc);
  ok(["og:type", "og:title", "og:description", "og:locale", "og:site_name"].every((k) => m.og.includes(k)), `${f}: Open Graph`, "meta");
  const types = [];
  for (const s of m.ld) { try { const j = JSON.parse(s); types.push(j["@type"]); if (j["@type"] === "Service") ok(!/price|offers|address|telephone/i.test(s), `${f}: Service с ценой/адресом/телефоном`, "ld"); } catch (e) { ok(false, `${f}: JSON-LD не парсится ${e.message}`, "ld"); } }
  if (f === "index.html") ok(types.includes("Organization") && !types.includes("BreadcrumbList"), `${f}: Organization`, "ld");
  else ok(types.includes("BreadcrumbList"), `${f}: нет BreadcrumbList`, "ld");
  ok(types.includes("Service") === SERVICE.includes(f), `${f}: Service ${types.includes("Service")}`, "ld");
  ok(types.includes("FAQPage") === m.details > 0, `${f}: FAQPage ${types.includes("FAQPage")} при ${m.details} вопросах`, "ld");
  let prev = 1, jump = false;
  for (const h of m.headings.slice(1)) { const lv = +h[1]; if (lv > prev + 1) jump = true; prev = lv; }
  ok(m.headings[0] === "H1" && !jump, `${f}: порядок заголовков ${m.headings.join(",")}`, "a11y");
  ok(m.unlabeled.length === 0, `${f}: поля без подписи ${m.unlabeled}`, "a11y");
  ok(m.skip && m.live, `${f}: skip-link / aria-live`, "a11y");
  ok(m.quizCta && m.nav.join("·") === "Документы·Маркетинг·Аналитика·Кейсы·Блог·Цены", `${f}: меню ${m.nav}`, "meta");
  for (const c of m.consent) ok(c.input && c.text === CONSENT_TEXT && c.linkText === "обработку персональных данных" && c.href === "/soglasie-pd.html" && !c.target, `${f}: согласие в форме ${JSON.stringify(c)}`, "consent");
  ok(m.footer.company.join("·") === "О нас·Контакты·Партнёрам·Благотворительность·Новости·Блог" && m.footer.clients.join("·") === "Цены·Оплата·Публичная оферта·Политика обработки ПДн·Правовая информация" && m.footer.legal === "ИП Коптелин Илья Алексеевич · ИНН 540821689171 · ОГРНИП 326547600096728" && m.footer.tel && m.footer.mail, `${f}: подвал ${JSON.stringify(m.footer)}`, "footer");
  log(`  ${f.padEnd(32)} title ${String(m.title.length).padStart(2)} · desc ${String(m.desc.length).padStart(3)} · LD ${types.join("+")}`);
}

{
  const formsTotal = Object.values(meta).reduce((s, m) => s + m.consent.length, 0);
  log(`  форм с согласием: ${formsTotal} (ссылка на soglasie-pd.html в каждой)`);
  const org = ldOf("index.html").find((j) => j["@type"] === "Organization");
  ok(org && org.legalName === "ИП Коптелин Илья Алексеевич" && org.taxID === COMPANY.inn && org.telephone === "+79811002848" && org.email === COMPANY.email && org.address?.addressLocality === "Новосибирск" && !JSON.stringify(org).includes("Искитим"), `index: Organization ${JSON.stringify(org)}`, "ld");
  const lb = ldOf("kontakty.html").find((j) => j["@type"] === "LocalBusiness");
  ok(lb && lb.telephone && lb.email === COMPANY.email && lb.address?.streetAddress && !("openingHours" in lb) && !("openingHoursSpecification" in lb), `kontakty: LocalBusiness ${JSON.stringify(lb)}`, "ld");
  const cat = ldOf("ceny.html").find((j) => j["@type"] === "OfferCatalog");
  const prices = JSON.parse(readFileSync("/home/user/-Product_Lab/proba-growth/pricing/site-prices.json", "utf8"));
  ok(cat && cat.itemListElement.length === prices.length && cat.itemListElement.every((o, i) => o["@type"] === "Offer" && o.priceCurrency === "RUB" && o.price === prices[i].from && (o.price === 0 ? o.description === "Бесплатно" : prices[i].unit === "фикс" ? o.description === `${prices[i].from} ₽, фиксированная цена` : o.description.startsWith("от "))), `ceny: OfferCatalog (${cat?.itemListElement.length} из ${prices.length})`, "ld");
  for (const f of pages.filter((x) => x !== "ceny.html")) ok(!meta[f].ld.some((s) => /"Offer"|"price"/.test(s)), `${f}: Offer/price вне ceny.html`, "ld");
  for (const f of pages.filter((x) => x.startsWith("blog/") && x !== "blog/index.html")) {
    const bp = ldOf(f).find((j) => j["@type"] === "BlogPosting");
    ok(bp && bp.author?.["@type"] === "Person" && bp.author.name === "Илья Коптелин" && bp.datePublished === "2026-10-26" && bp.headline, `${f}: BlogPosting ${JSON.stringify(bp)}`, "ld");
  }
  log(`  Organization: ${org?.legalName}, ИНН ${org?.taxID}; LocalBusiness без часов: ${!!lb && !("openingHours" in lb)}; Offer на ceny: ${cat?.itemListElement.length}`);
}

/* 3. Ссылки и якоря */
log("\n== Ссылки");
{
  const ctx = await b.newContext(); const p = await ctx.newPage();
  const links = new Map();
  for (const f of pages) {
    await p.goto(`${BASE}/${f}`);
    for (const h of await p.$$eval("a[href]", (as) => as.map((a) => a.getAttribute("href")))) {
      if (h === COMPANY.tel || h === COMPANY.mail) continue; // телефон и почта компании — единственные допустимые не-HTTP ссылки
      if (/^(https?:|mailto:|tel:)/.test(h)) { ok(false, `${f}: внешняя ссылка ${h}`, "links"); continue; }
      ok(!h.startsWith("/"), `${f}: абсолютный путь ${h}`, "links");
      links.set(new URL(h, `${BASE}/${f}`).href, f);
    }
  }
  const ids = new Map();
  let checked = 0, anchors = 0;
  for (const [u, from] of links) {
    const [path, hash] = u.split("#");
    const res = await p.request.get(path);
    checked++;
    ok(res.status() === 200, `ссылка ${u} (со страницы ${from}) → ${res.status()}`, "links");
    if (hash) {
      anchors++;
      if (!ids.has(path)) { await p.goto(path); ids.set(path, new Set(await p.$$eval("[id]", (els) => els.map((e) => e.id)))); }
      ok(ids.get(path).has(hash), `якорь #${hash} отсутствует на ${path} (со страницы ${from})`, "links");
    }
  }
  for (const extra of ["sitemap.xml", "robots.txt", "assets/site.css", "assets/site.js"]) ok((await p.request.get(`${BASE}/${extra}`)).status() === 200, `${extra} не отдаётся`, "links");
  // sitemap.xml: ровно все страницы
  const sm = await (await p.request.get(`${BASE}/sitemap.xml`)).text();
  const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname.slice(1)).map((x) => (x === "" || x.endsWith("/") ? `${x}index.html` : x)).sort();
  ok(JSON.stringify(locs) === JSON.stringify(pages), `sitemap.xml: ${locs.length} адресов, страниц ${pages.length}; нет: ${pages.filter((x) => !locs.includes(x))}`, "links");
  log(`  sitemap.xml: ${locs.length} адресов из ${pages.length} страниц`);
  log(`  уникальных ссылок: ${checked}, с якорем: ${anchors}`);
  await ctx.close();
}

/* 4. Квиз (ожидания v2) */
log("\n== Квиз");
{
  const { ctx, p, errs } = await open(`${BASE}/dokumenty/index.html`, VPS[0]);
  const cases = [
    { type: "bad", production: "contract", channels: ["marketplace"], expect: { code: "bad-contract+mp", docs: ["Свидетельство о госрегистрации (СГР)"], obl: ["Маркировка «Честный знак»", "Карточка на маркетплейсе совпадает с СГР", "Схема «Честного знака» с контрактником"] } },
    { type: "bad", production: "own", channels: ["pharmacy", "site"], expect: { code: "bad-own+ph+st", docs: ["Свидетельство о госрегистрации (СГР)"], obl: ["Процедуры ХАССП на производстве", "Программа производственного контроля", "Тексты сайта и реклама"] } },
    { type: "cosm", cosmGroup: "yes", production: "import", channels: ["marketplace"], expect: { code: "cosm-yes-import+mp", docs: ["СГР на косметику"], obl: ["Документы иностранного производителя"] } },
    { type: "cosm", cosmGroup: "no", production: "own", channels: ["retail"], expect: { code: "cosm-no-own+rt", docs: ["Декларация о соответствии ТР ТС 009/2011"], obl: ["Программа производственного контроля", "GMP — по желанию", "Требования торговых сетей"] } },
    { type: "cosm", cosmGroup: "unsure", production: "contract", channels: [], expect: { code: "cosm-unsure-contract", docs: ["Декларация или СГР — определим по составу"], obl: ["Маркировка «Честный знак»"] } },
    { type: "food", production: "own", channels: ["retail", "marketplace"], expect: { code: "food-own+mp+rt", docs: ["Декларация о соответствии ТР ТС 021/2011"], obl: ["Процедуры ХАССП на производстве"] } },
    { type: "sport", production: "import", channels: ["site"], expect: { code: "sport-import+st", docs: ["СГР или декларация — зависит от назначения"], obl: ["Заявитель — компания в России"] } },
    { type: "other", production: "own", channels: [], expect: { code: "other-own", docs: ["Определим по составу и назначению"], obl: [] } },
  ];
  await p.click('#quiz-form button[type="submit"]');
  ok((await p.textContent("#quiz-form .form-status")).includes("Выберите"), "квиз: пустая отправка без подсказки", "quiz");
  for (const c of cases) {
    await p.evaluate(() => { for (const i of document.querySelectorAll("#quiz-form input")) i.checked = false; });
    await p.click(`#quiz-form label.choice:has(input[name="type"][value="${c.type}"])`);
    ok((await p.isVisible("[data-cosm]")) === (c.type === "cosm"), `квиз: вопрос о группах косметики`, "quiz");
    if (c.cosmGroup) await p.click(`#quiz-form label.choice:has(input[name="cosmGroup"][value="${c.cosmGroup}"])`);
    await p.click(`#quiz-form label.choice:has(input[name="production"][value="${c.production}"])`);
    for (const ch of c.channels) await p.click(`#quiz-form label.choice:has(input[name="channels"][value="${ch}"])`);
    await p.click('#quiz-form button[type="submit"]');
    await p.waitForTimeout(150);
    const r = await p.evaluate(() => {
      const out = document.querySelector("#quiz-result");
      const lists = out.querySelectorAll(".quiz-list");
      return { code: out.dataset.code, docs: [...lists[0].querySelectorAll("a")].map((a) => a.textContent), obl: [...lists[1].querySelectorAll("a")].map((a) => a.textContent), caveat: out.querySelector(".quiz-caveat")?.textContent, live: out.getAttribute("aria-live"), markers: /⟪|⟫/.test(out.innerHTML) };
    });
    const pass = r.code === c.expect.code && c.expect.docs.every((d) => r.docs.includes(d)) && c.expect.obl.every((d) => r.obl.includes(d)) && r.caveat === "Предварительно. Точно определим по составу." && r.live === "polite" && !r.markers;
    ok(pass, `квиз ${JSON.stringify(c)} → ${JSON.stringify(r)}`, "quiz");
    log(`  ${pass ? "✓" : "✗"} ${c.type}${c.cosmGroup ? "/" + c.cosmGroup : ""} · ${c.production} · [${c.channels.join(",")}] → ${r.code}`);
  }
  await p.click("#quiz-result [data-need]");
  await p.waitForTimeout(700);
  const st = await p.evaluate(() => ({ cat: document.querySelector('#reg-form input[name="category"]:checked')?.value, need: document.querySelector("#rf-need").value, focus: document.activeElement?.id }));
  ok(st.cat === "Другое" && st.need === "Определить, какой документ нужен" && st.focus === "form-title", `квиз → форма: ${JSON.stringify(st)}`, "quiz");
  log(`  CTA результата → форма: ${JSON.stringify(st)}`);
  // ссылки из результата ведут на существующие страницы раздела
  ok(errs.length === 0, `квиз: ошибки ${errs}`, "quiz");
  await ctx.close();
}

/* 5. Формы: прототип, без сети и хранилища */
log("\n== Формы");
const STATUS = "Форма заполнена. Отправка пока не подключена.";
// Боевая сборка (FORM_ENDPOINT): заполненная форма уходит на приёмник, поэтому здесь проверяется только проверка полей;
// отправку проверяет стенд site-audit/stage-4/scripts/form-test.mjs (приёмник + тестовый получатель вместо Telegram)
const LIVE = readFileSync(join(SITE, "index.html"), "utf8").includes('name="proba-form-endpoint"');
if (LIVE) log("  боевая сборка: отправка не проверяется здесь — см. form-test.mjs; проверяется валидация пустой формы");
async function formRun(page, sel, fill) {
  const { ctx, p, errs, ext } = await open(`${BASE}/${page}`, VPS[2]);
  const reqs = [];
  p.on("request", (r) => { if (!isFont(r.url())) reqs.push(r.url()); });
  await p.click(`${sel} button[type="submit"]`);
  const e1 = await p.locator(`${sel} .field-error`).count();
  const s1 = await p.textContent(`${sel} .form-status`);
  if (LIVE) {
    const good = e1 >= 1 && s1 === "Проверьте отмеченные поля." && reqs.length === 0 && errs.length === 0 && ext.length === 0;
    ok(good, `${page} ${sel}: пустая форма ${JSON.stringify({ e1, s1, reqs, errs })}`, "forms");
    log(`  ${good ? "✓" : "✗"} ${page} ${sel}: пустая → ${e1} ошибок, запросов ${reqs.length}`);
    await ctx.close();
    return;
  }
  await fill(p);
  await p.click(`${sel} button[type="submit"]`);
  const status = await p.textContent(`${sel} .form-status`);
  const store = await p.evaluate(() => ({ calls: window.__storage, ls: localStorage.length, ss: sessionStorage.length }));
  const good = e1 >= 1 && s1 === "Проверьте отмеченные поля." && status === STATUS && reqs.length === 0 && store.ls === 0 && store.ss === 0 && errs.length === 0 && ext.length === 0;
  ok(good, `${page} ${sel}: ${JSON.stringify({ e1, s1, status, reqs, store, errs })}`, "forms");
  log(`  ${good ? "✓" : "✗"} ${page} ${sel}: пустая → ${e1} ошибок; статус «${status}»; запросов ${reqs.length}`);
  await ctx.close();
}
const contactConsent = (sel) => async (p) => { await p.fill(`${sel} [name="contact"]`, "@proba_test"); await p.check(`${sel} input[name="consent"]`); };
await formRun("index.html", "#review-form", async (p) => { await p.fill("#rv-url", "example.com/product"); await p.click('#review-form label.choice:has(input[value="БАД"])'); await contactConsent("#review-form")(p); });
await formRun("index.html", "#pf-form", async (p) => { await p.click('#pf-form label.choice:has(input[value="docs"])'); await contactConsent("#pf-form")(p); });
for (const pg of ["marketing.html", "prodvizhenie.html", "analitika.html", "audit-prodazh.html"]) await formRun(pg, "#pf-form", contactConsent("#pf-form"));
await formRun("kak-my-rabotaem.html", "#pf-form", async (p) => { await p.click('#pf-form label.choice:has(input[value="audit"])'); await contactConsent("#pf-form")(p); });
for (const pg of ["o-nas.html", "kontakty.html", "ceny.html"]) await formRun(pg, "#pf-form", async (p) => { await p.click('#pf-form label.choice:has(input[value="docs"])'); await contactConsent("#pf-form")(p); });
await formRun("analitika/kalkulyator-yunit-ekonomiki.html", "#pf-form", contactConsent("#pf-form"));
await formRun("partneram.html", "#ptf-form", async (p) => { await p.fill("#ptf-company", "Контрактное производство"); await p.fill("#ptf-url", "example.com"); await contactConsent("#ptf-form")(p); });
await formRun("blagotvoritelnost.html", "#pbf-form", async (p) => { await p.fill("#pbf-about", "Организация пациентов, нужны материалы для партнёров"); await contactConsent("#pbf-form")(p); });
await formRun("dokumenty/karta-dokumentov.html", "#kf-form", async (p) => { await p.fill("#kf-product", "Магний, таблетки"); await p.fill("#kf-composition", "Магния цитрат, витамин B6"); await contactConsent("#kf-form")(p); });
await formRun("avtomatizaciya.html", "#af-form", async (p) => { await p.fill("#af-process", "Заказы аптек приходят в мессенджер"); await contactConsent("#af-form")(p); });
for (const pg of ["dokumenty/index.html"]) await formRun(pg, "#reg-form", async (p) => { await p.click('#reg-form label.choice:has(input[value="БАД"])'); await p.fill("#rf-url", "example.com/product"); await contactConsent("#reg-form")(p); });
// нормализация адреса
{
  const { ctx, p } = await open(`${BASE}/index.html`, VPS[0]);
  await p.fill("#rv-url", "не адрес"); await p.click('#review-form button[type="submit"]');
  const bad = await p.locator("#review-form .field-error").allTextContents();
  await p.fill("#rv-url", "ozon.ru/product/1"); await p.click('#review-form button[type="submit"]');
  ok(bad.some((x) => x.includes("адрес")) && (await p.inputValue("#rv-url")) === "https://ozon.ru/product/1", "нормализация адреса", "forms");
  // порядок задач: «Документы и регистрация» первым
  const first = await p.evaluate(() => document.querySelector('#pf-form input[name="task"]').value);
  const firstLabel = await p.evaluate(() => document.querySelector('#pf-form .choice span').textContent);
  ok(first === "docs" && norm(firstLabel) === "Документы и регистрация", `главная: первая задача ${first} ${firstLabel}`, "forms");
  await ctx.close();
}
// предвыбор задачи и кнопки data-task
const PRESET = { "index.html": null, "marketing.html": "promo", "prodvizhenie.html": "promo", "analitika.html": "analytics", "audit-prodazh.html": "audit", "kak-my-rabotaem.html": null, "analitika/kalkulyator-yunit-ekonomiki.html": "analytics", "kontakty.html": null };
{
  const { ctx, p } = await open(`${BASE}/dokumenty/karta-dokumentov.html`, VPS[0]);
  const st = await p.evaluate(() => ({ need: document.querySelector("#kf-need").value, sample: document.querySelector(".karta-sample .tag")?.textContent, file: document.querySelector('#kf-file[type="file"]') !== null }));
  ok(st.need === "Определить, какой документ нужен" && st.sample === "Пример" && st.file, `karta-dokumentov: ${JSON.stringify(st)}`, "forms");
  log(`  karta-dokumentov: «Что нужно» = ${st.need}; пример помечен «${st.sample}»`);
  await ctx.close();
}
for (const [pg, want] of Object.entries(PRESET)) {
  const { ctx, p } = await open(`${BASE}/${pg}`, VPS[0]);
  const got = await p.evaluate(() => document.querySelector('#pf-form input[name="task"]:checked')?.value ?? null);
  ok(got === want, `${pg}: предвыбрана задача ${got}, ожидалась ${want}`, "forms");
  log(`  ${pg}: задача по умолчанию ${got}`);
  if (pg === "marketing.html") {
    await p.click('[data-task="package"]'); await p.waitForTimeout(700);
    const st = await p.evaluate(() => ({ task: document.querySelector('#pf-form input[name="task"]:checked')?.value, title: document.querySelector("#pf-title").textContent, focus: document.activeElement?.id, top: Math.round(document.getElementById("project-form").getBoundingClientRect().top) }));
    ok(st.task === "package" && st.title.startsWith("Заявка на пакет") && st.focus === "pf-title", `marketing: кнопка пакета ${JSON.stringify(st)}`, "forms");
    log(`  marketing: кнопка пакета → ${JSON.stringify(st)}`);
  }
  await ctx.close();
}

/* 5б. Калькулятор SKU: формулы (src/calc.ts) и интерфейс */
log("\n== Калькулятор SKU");
{
  const out = await build({ entryPoints: [join(SITE, "../src/calc.ts")], bundle: true, format: "esm", platform: "neutral", write: false, logLevel: "silent" });
  const calc = await import(`data:text/javascript;base64,${Buffer.from(out.outputFiles[0].text).toString("base64")}`);
  const near = (a, b) => (a === null || b === null ? a === b : Math.abs(a - b) < 1e-9);
  // Ожидания посчитаны здесь вручную по формуле, независимо от calcSku
  const cases = [
    { name: "прибыльный товар", in: { price: 1000, cost: 300, commission: 15, logistics: 100, returns: 10, returnCost: 50, ads: 50, tax: 6, packaging: 20 },
      want: { profit: 1000 - 300 - 150 - 100 - 5 - 50 - 60 - 20, margin: 31.5, breakEven: (300 + 100 + 5 + 50 + 20) / (1 - 0.15 - 0.06), biggest: "cost" } },
    { name: "убыточный товар", in: { price: 500, cost: 200, commission: 20, logistics: 150, returns: 0, returnCost: 0, ads: 100, tax: 6, packaging: 0 },
      want: { profit: 500 - 200 - 100 - 150 - 0 - 100 - 30 - 0, margin: -16, breakEven: (200 + 150 + 100) / (1 - 0.2 - 0.06), biggest: "cost" } },
    { name: "комиссия + налог = 100 %", in: { price: 800, cost: 100, commission: 60, logistics: 0, returns: 0, returnCost: 0, ads: 0, tax: 40, packaging: 0 },
      want: { profit: 800 - 100 - 480 - 320, margin: -12.5, breakEven: null, biggest: "commission" } },
    { name: "возвраты — главная статья", in: { price: 2000, cost: 100, commission: 5, logistics: 50, returns: 50, returnCost: 600, ads: 0, tax: 0, packaging: 0 },
      want: { profit: 2000 - 100 - 100 - 50 - 300, margin: 72.5, breakEven: (100 + 50 + 300) / 0.95, biggest: "returns" } },
  ];
  for (const c of cases) {
    const r = calc.calcSku(c.in);
    const pass = near(r.profit, c.want.profit) && near(r.margin, c.want.margin) && near(r.breakEven, c.want.breakEven) && r.biggest === c.want.biggest;
    ok(pass, `calcSku «${c.name}»: ${JSON.stringify({ profit: r.profit, margin: r.margin, breakEven: r.breakEven, biggest: r.biggest })} ≠ ${JSON.stringify(c.want)}`, "calc");
    log(`  ${pass ? "✓" : "✗"} ${c.name}: прибыль ${r.profit}, маржа ${r.margin}%, безубыточность ${r.breakEven === null ? "нет" : r.breakEven.toFixed(2)}, главная статья ${r.biggest}`);
  }
  const parse = [["1 249,5", 1249.5], ["249.5", 249.5], ["  15 ", 15], ["", null], ["abc", NaN], ["-5", -5], ["1e999", NaN], ["99999999999999", NaN], ["1,2,3", NaN]];
  for (const [raw, want] of parse) { const got = calc.parseNum(raw); ok(Number.isNaN(want) ? Number.isNaN(got) : got === want, `parseNum(${JSON.stringify(raw)}) = ${got}, ожидалось ${want}`, "calc"); }
  ok(calc.fmt(-80) === "−80" && calc.fmt(601.2658227848101) === "601,27" && calc.fmt(31.5, 1) === "31,5" && calc.fmt(150000) === "150\u00a0000", "fmt: формат чисел", "calc");
  log(`  parseNum: ${parse.length} случаев (запятая, пробелы, пусто, текст, минус)`);

  // Интерфейс: живой пересчёт, запятая, ошибки, aria-live, без сети и хранилища
  const { ctx, p, errs, ext } = await open(`${BASE}/analitika/kalkulyator-yunit-ekonomiki.html`, VPS[2], { reducedMotion: "reduce" });
  const reqs = [];
  p.on("request", (r) => { if (!isFont(r.url())) reqs.push(r.url()); });
  const vals = { price: "1 000", cost: "300", commission: "15", logistics: "100", returns: "10", returnCost: "50", ads: "49,5", tax: "6", packaging: "20,5" };
  for (const [k, v] of Object.entries(vals)) await p.fill(`#c-${k}`, v);
  await p.waitForTimeout(450);
  const ui = await p.evaluate(() => Object.fromEntries(["profit", "margin", "breakEven", "biggest"].map((k) => [k, document.querySelector(`[data-out="${k}"]`).textContent.replace(/\u00a0/g, " ")])));
  const live = await p.evaluate(() => ({ text: document.querySelector("[data-calc-status]").textContent.replace(/\u00a0/g, " "), live: document.querySelector("[data-calc-status]").getAttribute("aria-live") }));
  // 1000 − 300 − 150 − 100 − 5 − 49,5 − 60 − 20,5 = 315; безубыточность (300+100+5+49,5+20,5)/0,79 = 601,27
  const uiPass = ui.profit === "315 ₽" && ui.margin === "31,5 %" && ui.breakEven === "601,27 ₽" && ui.biggest === "Себестоимость — 300 ₽ (30 % цены)" && live.live === "polite" && live.text.startsWith("Прибыль на единицу 315 ₽");
  ok(uiPass, `калькулятор: ${JSON.stringify({ ui, live })}`, "calc");
  log(`  ${uiPass ? "✓" : "✗"} интерфейс 390: ${JSON.stringify(ui)}`);
  await p.fill("#c-cost", "три сотни");
  await p.fill("#c-tax", "140");
  const bad = await p.evaluate(() => ({ cost: document.querySelector("#c-cost").getAttribute("aria-invalid"), costErr: document.querySelector("#c-cost-err")?.textContent, tax: document.querySelector("#c-tax-err")?.textContent, profit: document.querySelector('[data-out="profit"]').textContent }));
  ok(bad.cost === "true" && bad.costErr && bad.tax === "Не больше 100 %" && bad.profit === "—", `калькулятор: проверка ввода ${JSON.stringify(bad)}`, "calc");
  log(`  проверка ввода: ${JSON.stringify(bad)}`);
  await p.fill("#c-cost", "300"); await p.fill("#c-tax", "6"); await p.waitForTimeout(450);
  const anims = await p.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").length);
  const store = await p.evaluate(() => ({ calls: window.__storage, ls: localStorage.length, ss: sessionStorage.length }));
  ok(anims === 0 && reqs.length === 0 && store.calls === 0 && errs.length === 0 && ext.length === 0, `калькулятор: анимации ${anims}, запросы ${reqs}, хранилище ${JSON.stringify(store)}, ошибки ${errs}`, "calc");
  await p.screenshot({ path: `${SHOTS}/kalkulyator-sku-390-filled.png`, fullPage: true });
  await ctx.close();
}

/* 6. Мобильное меню */
log("\n== Мобильное меню");
for (const f of ["index.html", "marketing.html", "dokumenty/registraciya-bad.html", "avtomatizaciya.html"]) {
  const { ctx, p } = await open(`${BASE}/${f}`, VPS[2]);
  await p.locator(".menu-toggle").tap();
  await p.waitForTimeout(150);
  const opened = (await p.isVisible("#mobile-menu")) && (await p.evaluate(() => document.getElementById("mobile-menu").getBoundingClientRect().height)) > 600;
  const inside = [];
  for (let i = 0; i < 12; i++) { await p.keyboard.press("Tab"); inside.push(await p.evaluate(() => !!document.activeElement.closest("#mobile-menu, .menu-toggle"))); }
  for (let i = 0; i < 4; i++) { await p.keyboard.press("Shift+Tab"); inside.push(await p.evaluate(() => !!document.activeElement.closest("#mobile-menu, .menu-toggle"))); }
  const ov = await overflow(p);
  await p.keyboard.press("Escape");
  const closed = await p.isHidden("#mobile-menu");
  const focusBack = await p.evaluate(() => document.activeElement.classList.contains("menu-toggle"));
  const good = opened && inside.every(Boolean) && closed && focusBack && ov === 0;
  ok(good, `${f}: меню ${JSON.stringify({ opened, inside, closed, focusBack, ov })}`, "menu");
  log(`  ${good ? "✓" : "✗"} ${f}: открыто ${opened}, фокус в меню ${inside.every(Boolean)} (${inside.length} нажатий), Escape ${closed}, фокус на кнопке ${focusBack}`);
  if (f === "index.html") await p.locator(".menu-toggle").tap().then(() => p.waitForTimeout(150)).then(() => p.screenshot({ path: `${SHOTS}/menu-390.png` }));
  await ctx.close();
}

// Шапка на узких экранах (аудит, этап 3: при 320 px кнопка меню уходила за край экрана, при 360 — на 3 px).
// Проверяется только шапка: переполнение контента страниц на 320 px — отдельная задача.
log("\n== Шапка 320 / 360");
for (const w of [320, 360]) {
  const vp = { viewport: { width: w, height: 700 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };
  let bad = [];
  for (const f of pages) {
    const { ctx, p } = await open(`${BASE}/${f}`, vp);
    const m = await p.evaluate(() => { const cw = document.documentElement.clientWidth; const t = document.querySelector(".menu-toggle").getBoundingClientRect(); const row = document.querySelector(".header-row"); return { cw, toggle: Math.round(t.right), row: row.scrollWidth - row.clientWidth }; });
    if (m.toggle > m.cw || m.row > 0) bad.push(`${f} ${JSON.stringify(m)}`);
    if (f === "index.html") {
      await p.locator(".menu-toggle").tap();
      await p.waitForTimeout(150);
      const opened = await p.isVisible("#mobile-menu");
      const sx = await p.evaluate(() => scrollX);
      ok(opened && sx === 0, `${w}px: меню не открылось без прокрутки (opened ${opened}, scrollX ${sx})`, "header");
    }
    await ctx.close();
  }
  ok(bad.length === 0, `${w}px: шапка не помещается — ${bad.slice(0, 5).join("; ")}`, "header");
  log(`  ${bad.length ? "✗" : "✓"} ${w}px: шапка помещается на ${pages.length - bad.length} из ${pages.length} страниц`);
}

// Текст на 320 px (аудит, этап 4): неразрывные склейки в заголовках и узкие колонки выходили за экран или обрезались
// первым экраном (overflow: hidden). Проверяем всю страницу: документ не шире экрана, ни один текстовый узел не выходит
// за свой обрезающий контейнер. Локальная прокрутка (таблицы в .table-wrap) допустима.
log("\n== Текст 320 px");
{
  const vp = { viewport: { width: 320, height: 700 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };
  const bad = [];
  for (const f of pages) {
    const { ctx, p } = await open(`${BASE}/${f}`, vp);
    await p.evaluate(() => document.fonts.ready);
    const m = await p.evaluate(() => {
      const cw = document.documentElement.clientWidth, out = [];
      const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let n; (n = tw.nextNode()); ) {
        const el = n.parentElement;
        if (!n.textContent.trim() || el.closest(".ambient, .marquee, .reel, svg, .visually-hidden, .skip-link, [hidden], .mobile-menu")) continue;
        const rg = document.createRange(); rg.selectNodeContents(n);
        const rs = [...rg.getClientRects()].filter((r) => r.width > 0); if (!rs.length) continue;
        const R = Math.max(...rs.map((r) => r.right)), Lf = Math.min(...rs.map((r) => r.left));
        let c = null, scroll = false;
        for (let a = el; a && a !== document.body; a = a.parentElement) { const o = getComputedStyle(a).overflowX; if (o !== "visible") { c = a; scroll = /(auto|scroll)/.test(o); break; } }
        if (scroll) continue;
        const lim = c ? c.getBoundingClientRect() : { left: 0, right: cw };
        if (R > lim.right + 1 || Lf < lim.left - 1) out.push(`«${n.textContent.trim().slice(0, 40)}» R${Math.round(R)}`);
      }
      return { overflow: document.documentElement.scrollWidth - cw, out: out.slice(0, 3) };
    });
    if (m.overflow > 0 || m.out.length) bad.push(`${f} ${JSON.stringify(m)}`);
    await ctx.close();
  }
  ok(bad.length === 0, `320px: текст за пределами — ${bad.slice(0, 5).join("; ")}`, "text320");
  log(`  ${bad.length ? "✗" : "✓"} 320px: текст в пределах экрана и контейнеров на ${pages.length - bad.length} из ${pages.length} страниц`);
}
// 404 читаема (аудит, этап 4: тёмный текст на чёрном фоне, контраст 1,4:1)
{
  const { ctx, p } = await open(`${BASE}/404.html`, VPS[2]);
  await p.addScriptTag({ path: "/home/user/-Product_Lab/proba-site/node_modules/axe-core/axe.min.js" });
  const v = await p.evaluate(async () => (await axe.run(document, { runOnly: ["color-contrast"] })).violations.reduce((s, x) => s + x.nodes.length, 0));
  const links = await p.$$eval("main a[href]", (as) => as.map((a) => a.getAttribute("href")));
  ok(v === 0 && links.includes("/index.html"), `404: нарушений контраста ${v}, ссылки ${links.join(",")}`, "text320");
  log(`  ${v === 0 ? "✓" : "✗"} 404: нарушений контраста ${v}, ссылки: ${links.join(", ")}`);
  await ctx.close();
}

/* 7. prefers-reduced-motion */
log("\n== prefers-reduced-motion");
for (const f of ["index.html", "marketing.html", "dokumenty/index.html", "dokumenty/registraciya-bad.html", "avtomatizaciya.html", "o-nas.html", "ceny.html", "analitika/kalkulyator-yunit-ekonomiki.html", "blog/etiketka-bad-do-registracii.html", "dokumenty/karta-dokumentov.html", "oferta.html"]) {
  const { ctx, p } = await open(`${BASE}/${f}`, VPS[0], { reducedMotion: "reduce" });
  if (f === "analitika/kalkulyator-yunit-ekonomiki.html") { await p.fill("#c-price", "1000"); await p.fill("#c-cost", "300"); await p.fill("#c-commission", "15"); }
  const a0 = await p.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").length);
  await p.evaluate(() => scrollTo(0, document.body.scrollHeight / 2)); await p.waitForTimeout(200);
  await p.locator(".faq-list summary").first().click().catch(() => {});
  await p.locator(".dir-card, .next-card").first().hover().catch(() => {});
  if (f === "dokumenty/index.html") { await p.click('#quiz-form label.choice:has(input[value="bad"])'); await p.click('#quiz-form label.choice:has(input[value="own"])'); await p.click('#quiz-form button[type="submit"]'); }
  await p.evaluate(() => scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(200);
  const a1 = await p.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").length);
  ok(a0 === 0 && a1 === 0, `${f}: идущие анимации при reduce ${a0}/${a1}`, "motion");
  log(`  ${f}: идущих анимаций ${a0} → ${a1}`);
  await ctx.close();
}
{
  const { ctx, p } = await open(`${BASE}/index.html`, VPS[0]);
  await p.goto(`${BASE}/index.html`); await p.waitForTimeout(30);
  const n = await p.evaluate(() => document.getAnimations().length);
  const cta = await p.evaluate(() => [...document.querySelectorAll(".btn")].reduce((s, b) => s + b.getAnimations().length, 0));
  const ctaOpacity = await p.evaluate(() => getComputedStyle(document.querySelector("[data-primary-cta]")).opacity);
  ok(cta === 0 && ctaOpacity === "1", `CTA анимируется (${cta}) или скрыт (${ctaOpacity})`, "motion");
  log(`  без reduce: анимаций при загрузке ${n}, на кнопках ${cta}, CTA opacity ${ctaOpacity}`);
  await ctx.close();
}
// без JS всё видно
{
  const ctx = await b.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage();
  await p.goto(`${BASE}/index.html`);
  const hidden = await p.evaluate(() => [...document.querySelectorAll(".reveal")].filter((e) => getComputedStyle(e).opacity !== "1").length);
  ok(hidden === 0, `без JS скрыто .reveal: ${hidden}`, "motion");
  await ctx.close();
}

/* 8. Текст */
log("\n== Текст");
const FORBIDDEN = [/инновационн/i, /уникальн(?!ое торговое предложение|ого торгового предложения|ым торговым предложением|ом торговом предложении|ая формула»)/i, /комплексн\S* подход/i, /синерги/i, /эффективн\S* решени/i, /команда профессионалов/i, /лучш(?:ий|ая|ее|ие)(?! момент)/i, /(?<!не )гарантируем/i, /рост продаж в \d/i, /(?![©®™])\p{Extended_Pictographic}/u, /\{\{|⟪|⟫/];
let hits = 0;
for (const f of pages) {
  const html = readFileSync(join(SITE, f), "utf8");
  const body = html.slice(html.indexOf("<body")).replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<s>[\s\S]*?<\/s>/g, " ").replace(/<[^>]+>/g, " ").replace(/ /g, " ");
  for (const re of FORBIDDEN) if (re.test(body)) { hits++; ok(false, `${f}: ${re} «${body.match(re)[0]}»`, "text"); }
  if (/(?<!«)под ключ(?!»)/i.test(body)) { hits++; ok(false, `${f}: «под ключ» в тексте`, "text"); }
  ok(true, "", "text");
}
const js = readFileSync(join(SITE, "assets/site.js"), "utf8");
ok(!/fetch\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage/.test(js), "site.js: сеть или хранилище", "text");
log(`  запрещённых слов и «{{»: ${hits}`);

/* 9. Скриншоты */
const shots = [["index.html", 0, "top"], ["index.html", 0, "full"], ["index.html", 2, "top"], ["index.html", 2, "full"], ["marketing.html", 0, "full"], ["marketing.html", 2, "full"], ["audit-prodazh.html", 2, "full"], ["dokumenty/registraciya-bad.html", 2, "full"],
  ["o-nas.html", 0, "full"], ["o-nas.html", 2, "full"], ["ceny.html", 0, "full"], ["ceny.html", 2, "full"], ["oferta.html", 0, "full"], ["index.html", 0, "footer"], ["index.html", 2, "footer"]];
for (const [f, vi, mode] of shots) {
  const vp = VPS[vi];
  const { ctx, p } = await open(`${BASE}/${f}`, vp, { reducedMotion: "reduce" });
  const file = `${SHOTS}/${mode === "footer" ? "footer" : f.replace(/\//g, "-").replace(".html", "")}-${vp.name}-${mode}.png`;
  if (mode === "footer") { await p.addStyleTag({ content: ".site-header{display:none!important}" }); await p.locator(".site-footer").screenshot({ path: file }); }
  else await p.screenshot({ path: file, fullPage: mode === "full" });
  await ctx.close();
}

await b.close();
log("\n== Итог по группам");
for (const [g, s] of Object.entries(stats)) log(`  ${g.padEnd(10)} ${s.pass} ok, ${s.fail} fail`);
log(`\n${fails.length ? `✗ ПРОВАЛЕНО: ${fails.length}` : "✓ ВСЁ ПРОШЛО"}`);
process.exit(fails.length ? 1 : 0);
