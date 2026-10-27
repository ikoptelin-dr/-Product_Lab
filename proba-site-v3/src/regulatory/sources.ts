// Источники фактов для раздела «Документы и соответствие».
// Каждая фактическая фраза на страницах помечена ключом из этого списка (⟪ключ|фраза⟫ в pages.ts и quiz.ts).
// Сборка выписывает все помеченные фразы в REGULATORY_VERIFY.md — с адресом, меткой фактбазы и статусом.
// Когда партнёр сверил источник, поменяйте status здесь и пересоберите.
//
// R — research/regulatory-docs-factbase.md, P — research/production-compliance-factbase.md,
// L — research/landing-page-map.md (раздел 1, проверенные факты).

export interface Source {
  /** Адреса для ручной проверки (из фактбазы). */
  url: string;
  /** Метка и раздел фактбазы. */
  label: string;
  /** Статус проверки. */
  status: string;
}

const CHECK = "проверить у партнёра";

export const SOURCES = {
  "rpn-sgr": {
    url: "http://23.rospotrebnadzor.ru/content/333/8949/",
    label: "R §1 «Госрегистрация БАД» — [Наблюдение — по выдаче, первоисточник: 23.rospotrebnadzor.ru, 44.rospotrebnadzor.ru]",
    status: CHECK,
  },
  "bad-sgr-required": {
    url: "http://23.rospotrebnadzor.ru/content/333/8949/",
    label: "R §1 «Кому обязательно» (ст. 24 ТР ТС 021/2011) — [Наблюдение — по выдаче, первоисточник]",
    status: CHECK,
  },
  "rpn-docs": {
    url: "https://44.rospotrebnadzor.ru/gosudarstvennaja_reg/939/ ; https://09.rospotrebnadzor.ru/content/perechen-dokumentov-i-obrazcy-zayavleniy-dlya-provedeniya-gosudarstvennoy-registracii",
    label: "R §1 «Этапы», «Что нужно от клиента», «Кто может быть заявителем» — [Наблюдение — по выдаче, первоисточник: памятки Роспотребнадзора]",
    status: CHECK,
  },
  annex7: {
    url: "https://44.rospotrebnadzor.ru/gosudarstvennaja_reg/939/ ; https://vitvet.com/articles/proizvodstvo_badov/",
    label: "R §1 «Этапы», п. 1 — [Наблюдение — по выдаче, первоисточник: региональные памятки Роспотребнадзора]; L F7",
    status: CHECK,
  },
  "rpn-term": {
    url: "https://77.rospotrebnadzor.ru/index.php/component/content/article/67-2010-08-20-12-42-47/660-gosreg ; https://www.garant.ru/products/ipo/prime/doc/12076765/",
    label: "R §1 «Сроки» — [Наблюдение — по выдаче, первоисточник: региональная памятка Роспотребнадзора]; L F3",
    status: CHECK,
  },
  "rpn-duty": {
    url: "https://44.rospotrebnadzor.ru/gosudarstvennaja_reg/1862/ ; https://www.consultant.ru/document/cons_doc_LAW_28165/7f6aa2a30ed6c4b39a5890e07c7494d9c278b8ea/",
    label: "R §1 «Официальные платежи» (основание — ст. 333.33 НК РФ; сумма на сайте не приводится) — [Наблюдение — по выдаче, первоисточник]",
    status: CHECK,
  },
  "rpn-unlimited": {
    url: "78.rospotrebnadzor.ru ; 09.rospotrebnadzor.ru (формулировка бланка СГР; точный URL в фактбазе не указан)",
    label: "R §1 «Срок действия» — [Наблюдение — по выдаче, первоисточник]; сверить с Положением о госрегистрации (Решение 299)",
    status: CHECK,
  },
  "rpn-change": {
    url: "https://44.rospotrebnadzor.ru/gosudarstvennaja_reg/2593/",
    label: "R §9 «Изменение состава или рецептуры — новая регистрация» — [Наблюдение — по выдаче, первоисточник]",
    status: CHECK,
  },
  "rpn-reissue": {
    url: "04.rospotrebnadzor.ru ; 39.rospotrebnadzor.ru ; 35.rospotrebnadzor.ru (точные URL в фактбазе не указаны)",
    label: "R §9 «Переоформление без новых испытаний» — [Наблюдение — по выдаче, первоисточник]",
    status: CHECK,
  },
  refusals: {
    url: "R §1 «Частые ошибки и причины отказов» (сводка выдачи, полного официального перечня нет)",
    label: "R §1 — [Наблюдение — по выдаче]",
    status: CHECK,
  },
  otkaz: {
    url: "uniseller.io ; skillbox.ru (по выдаче, официального статуса в НПА не найдено)",
    label: "R §6 «Что это» — [Наблюдение — по выдаче: uniseller.io, skillbox.ru]; «не подходит для БАД и большинства косметики» — [Рекомендация на основе разделов 1–4]",
    status: CHECK,
  },
  "otkaz-ozon": {
    url: "seller.ozon.ru (первоисточник по выдаче)",
    label: "R §6 «Отношение площадок» — [Наблюдение — по выдаче, первоисточник seller.ozon.ru]",
    status: CHECK,
  },
  "sgr-registry": {
    url: "https://nsi.eaeunion.org/portal/1995 (не подтверждено) ; раздел реестров на rospotrebnadzor.ru",
    label: "R §1 «Где проверить» — [Наблюдение — по выдаче]; точные URL реестров не подтверждены, ссылки на сайт не ставим до сверки",
    status: CHECK,
  },
  "sgr-scope": {
    url: "https://legalacts.ru/doc/pismo-rospotrebnadzora-ot-01072013-n-017420-13-32-o/",
    label: "R §3 «Что это» (специализированная пищевая продукция и продукция нового вида; письмо Роспотребнадзора № 01/7420-13-32) — [Наблюдение — по выдаче]",
    status: CHECK,
  },
  "prof-visit": {
    url: "https://www.advgazeta.ru/ag-expert/advices/moratoriy-na-proverki-prodlili-do-2030-goda/ ; https://buh.ru/news/pravitelstvo-prodlilo-ograniceniya-na-planovye-proverki-biznesa-do-2030-goda.html",
    label: "P §5 «Режим проверок в 2026 году» (профилактические визиты по поручению Президента или Правительства) — [Наблюдение, по выдаче]",
    status: CHECK,
  },
  tr005: {
    url: "https://www.ifcg.ru/news/2024-09-17/izmenen-tehniceskij-reglament-o-bezopasnosti-upakovki-tr-ts-0052011/",
    label: "R §4 «ТР ТС 005/2011 — упаковка» (Решение Совета ЕЭК № 61 от 06.09.2024, с 05.03.2025) — [Наблюдение — по выдаче: ifcg.ru]",
    status: CHECK,
  },
  "otkaz-mp": {
    url: "uniseller.io",
    label: "R §6 «Отношение площадок» (отклонение письма: коды ТН ВЭД, ссылки на пункты регламентов) — [Наблюдение — по выдаче: uniseller.io]",
    status: CHECK,
  },
  "voluntary-cert": {
    url: "https://markirovka.ru/knowledge/tovarnye-gruppy/badi/podlezhat-li-bad-sertifikatsii-dolzhny-li-bad-imet-sgr",
    label: "R §5 «Добровольная сертификация» — [Наблюдение — по выдаче: markirovka.ru, cleverence]",
    status: CHECK,
  },
  "bad-tests": {
    url: "vestnik.susu.ru (сводка выдачи; точный URL в фактбазе не указан)",
    label: "R §1 «Испытания» — [Наблюдение — по выдаче]",
    status: CHECK,
  },
  wb: {
    url: "https://seller.wildberries.ru/instructions/ru/ru/material/certificates-and-conformity-declarations ; https://seller.wildberries.ru/instructions/ru/ru/material/A-232",
    label: "R §8.5 «Wildberries» — [Наблюдение — по выдаче, первоисточник seller.wildberries.ru]",
    status: CHECK,
  },
  ozon: {
    url: "https://docs.ozon.ru/global/products/upload/vitaminy-bad/ ; https://docs.ozon.ru/partners/zagruzka-tovarov/dokumenty-na-tovar/sertifikaty-kachestva-tovarov",
    label: "R §8.5 «Ozon» — [Наблюдение — по выдаче, первоисточник docs.ozon.ru]; часть страниц Ozon старая — сверить в кабинете",
    status: CHECK,
  },
  "law-290": {
    url: "https://ppt.ru/obzory/vstupaet-v-silu/federalnyy-zakon-31-07-2025-290-fz ; сверить текст ст. 11.1 на publication.pravo.gov.ru",
    label: "R §10.1 «290-ФЗ», вывод раздела 0.3 п. 1 — [Наблюдение — по выдаче: ppt.ru, rb.ru, spmag.ru]",
    status: CHECK,
  },
  "law-289": {
    url: "https://harant.ru/blog/yuridicheskie-novosti/platformennaya-ekonomika-s-1-10-2026-goda-chto-izmenitsya-dlya-samozanyatyh-prodavczov-i-marketplejsov/",
    label: "R §10.1 «289-ФЗ»; L F11 — [Наблюдение — по выдаче: harant.ru, rb.ru, incrussia.ru, secrets.tbank.ru]",
    status: CHECK,
  },
  "law-150": {
    url: "https://gxpnews.net/2025/06/v-rossii-utverdili-zakon-ob-osobennostyah-prodazhi-bad/ ; consultant.ru hotdocs (сниппет)",
    label: "R §10.2 «150-ФЗ»; L F10 — [Наблюдение — по выдаче]",
    status: CHECK,
  },
  "ads-25": {
    url: "https://fas.gov.ru/news/2365/export_to_file.pdf",
    label: "R §10.3 «Реклама БАД»; L F9 — [Наблюдение — по выдаче, первоисточник fas.gov.ru]",
    status: CHECK,
  },
  "chz-bad": {
    url: "https://markirovka.ru/knowledge/tovarnye-gruppy/badi/kakie-tovary-podlezhat-obyazatelnoy-markirovke-bad",
    label: "R §8.4 «Честный знак — БАД» (ПП РФ № 886) — [Наблюдение — по выдаче, первоисточник markirovka.ru]",
    status: CHECK,
  },
  "chz-bad-2026": {
    url: "https://rg.ru/2026/03/01/nachali-dejstvovat-novye-pravila-prodazhi-bad.html ; https://www.retail.ru/news/pravitelstvo-rasshirilo-perechen-badov-podpadayushchikh-pod-obyazatelnuyu-markir-2-dekabrya-2025-272066/",
    label: "R §8.4 (расширение с 01.03.2026); P §6 — [Наблюдение — по выдаче]; даты для остатков на сайте не приводятся",
    status: CHECK,
  },
  "chz-contract": {
    url: "https://markirovka.ru/community/lekarstva-bady-i-antiseptiki/markirovka-bad-na-kontraktnom-proizvodstve-",
    label: "P §6 «Маркировка при контрактном производстве» — [Наблюдение, официальный сайт оператора]",
    status: CHECK,
  },
  "chz-cosm": {
    url: "markirovka.ru ; kontur.ru (раздел о косметике и бытовой химии; точный URL в фактбазе не указан)",
    label: "R §8.4 «Косметика и бытовая химия» (ПП РФ № 1681) — [Наблюдение — по выдаче, первоисточник markirovka.ru / kontur.ru]",
    status: CHECK,
  },
  eac: {
    url: "cdb.kz ; zakon.uchet.kz ; adilet.zan.kz (точные URL в фактбазе не указаны)",
    label: "R §8.3 «Знак ЕАС» (Решение КТС № 711) — [Наблюдение — по выдаче]",
    status: CHECK,
  },
  tr022: {
    url: "kodeks.karelia.ru ; novotest.ru ; https://www.roskachestvo.gov.ru/about/competence/haccp/docs/TR_TS_022_2011-marking.pdf",
    label: "R §8.1 «Этикетка БАД» — [Наблюдение — по выдаче]; P §6",
    status: CHECK,
  },
  "cosm-label": {
    url: "zakon.kz (сводка выдачи; точный URL в фактбазе не указан)",
    label: "R §8.2 «Этикетка косметики» — [Наблюдение — по выдаче]; номер статьи и полный перечень не подтверждены",
    status: CHECK,
  },
  "cosm-sgr": {
    url: "https://37.rospotrebnadzor.ru/document/2290/doc ; https://www.alta.ru/tamdoc/13kr0012/ ; https://www.novotest.ru/tr-ts/009-2011/prilozhenie-12.pdf",
    label: "R §2 «Когда нужен СГР» (Приложение 12 ТР ТС 009/2011); L F13 — [Наблюдение — по выдаче]; на сайте только группы, совпадающие в R и L",
    status: CHECK,
  },
  "cosm-ozon": {
    url: "https://docs.ozon.ru/partners/zagruzka-tovarov/dokumenty-na-tovar/sertifikaty-kachestva-tovarov ; https://seller.wildberries.ru/instructions/ru/ru/material/certificates-and-conformity-declarations",
    label: "R §2 «Когда не нужен», R §8.5 — [Наблюдение — по выдаче, первоисточник docs.ozon.ru, seller.wildberries.ru]",
    status: CHECK,
  },
  "cosm-tests": {
    url: "R §2 «Испытания» (сводка выдачи)",
    label: "R §2 — [Наблюдение — по выдаче]: ТР ТС 009 нормирует состав, физико-химические, микробиологические и токсикологические показатели",
    status: CHECK,
  },
  "tr009-base": {
    url: "zakon.uchet.kz (H11T0000799)",
    label: "R §2 «Нормативная база» — [Наблюдение — по выдаче]",
    status: CHECK,
  },
  "tr009-74": {
    url: "ifcg.ru (новость 2025-11-07) ; standard.kz ; moscowtest.ru ; sertrb.ru ; текст — eec.eaeunion.org",
    label: "R §10.4 «ТР ТС 009/2011 с 28.10.2026», вывод 0.3 п. 3 — [Наблюдение — по выдаче]; переходные положения не установлены",
    status: CHECK,
  },
  decl: {
    url: "R §4 «Декларация о соответствии» (сводка выдачи); реестр — pub.fsa.gov.ru",
    label: "R §4 «Что это», «Регистрация в ФСА» — [Наблюдение — по выдаче]",
    status: CHECK,
  },
  "decl-scope": {
    url: "R §4 «К каким регламентам относится»",
    label: "R §4 — [Наблюдение — по выдаче] (ТР ТС 021: декларация, кроме случаев СГР и ветсанэкспертизы)",
    status: CHECK,
  },
  "decl-applicant": {
    url: "glavkniga.ru (сводка выдачи) ; seller.ozon.ru (самозанятые)",
    label: "R §4 «Заявитель» — [Наблюдение — по выдаче: glavkniga.ru; первоисточник seller.ozon.ru]",
    status: CHECK,
  },
  "decl-fee": {
    url: "ppt.ru (сводка выдачи); текст приказа Минэкономразвития от 14.11.2024 № 714",
    label: "R §4 «Регистрация в ФСА» — [Наблюдение — по выдаче: ppt.ru]; суммы не найдены",
    status: CHECK,
  },
  "fsa-eaeu": {
    url: "https://www.ifcg.ru/news/2025-12-02/izmenenie-poradka-registracii-deklaracij-na-protokolah-ispytanij-drugih-stran-eaes/",
    label: "P §4 «Нормативная база» (ПП РФ № 936 в ред. от 27.10.2025); R §4 — [Наблюдение, по выдаче]",
    status: CHECK,
  },
  "fsa-reuse": {
    url: "https://www.ifcg.ru/news/2025-09-18/izmenenia-v-poradke-povtornogo-ispolzovania-protokolov-ispytanij/",
    label: "P §4 — [Наблюдение, по выдаче]",
    status: CHECK,
  },
  "lab-scope": {
    url: "https://pub.fsa.gov.ru/ral ; https://vniim.ru/files/accr-0001510650.pdf ; https://vnesenie-v-reestr.ru/kd/news/kto-vydaet-protokol-ispytanij-laboratoriya",
    label: "P §4 «Как проверить лабораторию» — [Наблюдение, по аттестатам аккредитации]",
    status: CHECK,
  },
  tu: {
    url: "kp.ru (сводка выдачи; точный URL в фактбазе не указан)",
    label: "R §7 «ТУ и СТО» (162-ФЗ, ГОСТ 2.114-2016) — [Наблюдение — по выдаче]",
    status: CHECK,
  },
  "tu-docs": {
    url: "https://44.rospotrebnadzor.ru/gosudarstvennaja_reg/939/",
    label: "R §7 «Когда нужны» — [Наблюдение — по выдаче, первоисточник: памятки Роспотребнадзора]",
    status: CHECK,
  },
  "tu-reg": {
    url: "сайт ФГБУ «Институт стандартизации»; 162-ФЗ",
    label: "R §7 «Регистрация или учёт ТУ» — обязательность в 2026 году НЕ подтверждена; на сайте сказано именно это",
    status: CHECK,
  },
  "tr021-base": {
    url: "https://www.roskachestvo.gov.ru/about/competence/haccp/docs/TR_TS_021_2011.pdf ; https://ppt.ru/art/proizvodstvennaya-bezopasnost/kak-sozdat-rabochuyu-gruppu-po-vnedreniyu-khassp-na-predpriyatii",
    label: "P §1 «Кому обязательно» (Решение КТС от 09.12.2011 № 880) — [Факт, по выдаче]",
    status: CHECK,
  },
  "haccp-10": {
    url: "https://ppt.ru/art/proizvodstvennaya-bezopasnost/kak-sozdat-rabochuyu-gruppu-po-vnedreniyu-khassp-na-predpriyatii",
    label: "P §1 (ст. 10 ТР ТС 021/2011) — [Факт, по выдаче]; «не зависит от размера бизнеса» — [Наблюдение, по выдаче]",
    status: CHECK,
  },
  "haccp-bad": {
    url: "https://eec.eaeunion.org/upload/files/depsanmer/P2_299/%D1%80%D0%B0%D0%B7%D0%B4%D0%B5%D0%BB%201%20%D0%95%D0%A1%D0%A2.pdf",
    label: "P §1 «БАД входят в понятие пищевая продукция» — [Факт, по выдаче]",
    status: CHECK,
  },
  "haccp-cert": {
    url: "https://tenchat.ru/Gkdez ; https://spark.ru/startup/tsentr-hassp/blog/387970/sertifikat-hassp-i-vnedryonnaya-sistema-za-chto-vi-platite",
    label: "P §1 «Обязательна разработка и внедрение, сертификация добровольна» — [Наблюдение, по выдаче]",
    status: CHECK,
  },
  "haccp-gost": {
    url: "https://meganorm.ru/mega_doc/norm/gost-r_gosudarstvennyj-standart/7/gost_r_51705_1-2024_natsionalnyy_standart_rossiyskoy.html ; https://meganorm.ru/mega_doc/norm/gost-r_gosudarstvennyj-standart/24/gost_r_51705_1-2001_gosudarstvennyy_standart_rossiyskoy.html",
    label: "P §1 «Нормативная база и статус» — [Факт, по выдаче]",
    status: CHECK,
  },
  iso22000: {
    url: "https://docs.cntd.ru/document/1200146128/titles/8P60LQ",
    label: "P §1 «ГОСТ Р ИСО 22000-2019» — [Факт, по выдаче]",
    status: CHECK,
  },
  "haccp-rpn": {
    url: "P §1 «Кто проверяет» (общеизвестное распределение, первоисточник не открывался)",
    label: "P §1 — [Наблюдение]; «официального срока нет» — P §1 «Сроки»",
    status: CHECK,
  },
  "haccp-cosm": {
    url: "vnesenie-v-reestr.ru (сводка выдачи)",
    label: "P §1 FAQ 7 — [Наблюдение, по выдаче]",
    status: CHECK,
  },
  "koap-1443": {
    url: "https://knd.egov66.ru/violations/chast-1-stati-1443-koap-rf ; https://sudact.ru/vsrf/doc/EnBGNK4LcvC/",
    label: "P §1 «Риски и штрафы» (ч. 1 ст. 14.43 КоАП) — [Факт, по выдаче: региональный портал КНД]; ч. 2–3 на сайте не приводятся",
    status: CHECK,
  },
  ppk: {
    url: "https://rosexperts.ru/razrabotka-tehnicheskoj-dokumentatsii/razrabotka-programmy-proizvodstvennogo-kontrolya/",
    label: "P §3 «ППК» — обязательность по 52-ФЗ [Наблюдение]; номер статьи не приводится (Гипотеза)",
    status: CHECK,
  },
  "ppk-content": {
    url: "https://spmag.ru/blanks/programma-proizvodstvennogo-kontrolya-obrazec-2025 ; https://gervig.ru/poleznaja-informacija/programma-proizvodstvennogo-kontrolja-pishhevogo-predprijatija/",
    label: "P §3 «Что обычно содержит ППК» — [Наблюдение, по образцам]",
    status: CHECK,
  },
  "ppk-lab": {
    url: "P §3 «Лабораторный контроль» (сводка выдачи)",
    label: "P §3 — [Наблюдение, по выдаче]",
    status: CHECK,
  },
  "mr-0279": {
    url: "https://sudact.ru/law/mr-230279-22-23-gigiena-pitaniia-rekomendatsii-po/",
    label: "P §3 «МР 2.3.0279-22» — [Наблюдение, по выдаче]",
    status: CHECK,
  },
  "sanpin-1290": {
    url: "https://www.normacs.info/documents/8094 ; https://www.consultant.ru/document/cons_doc_LAW_42302/",
    label: "P §3 «СанПиН 2.3.2.1290-03 не действует» — [Наблюдение, по выдаче]",
    status: CHECK,
  },
  "sp-2026": {
    url: "http://publication.pravo.gov.ru/document/0001202606020084 ; https://www.normacs.info/ntds/30741 ; https://ppt.ru/news/sanitarno-epidemiologicheskoe-blagopoluchie/rospotrebnadzor-utverdil-sanitarnye-pravila-dlya-khozyaystvuyushchikh-subektov",
    label: "P §3 «Пакет постановлений от 02.06.2026» — [Факт, по выдаче]; дата начала действия СП 2.1.4284-26 не подтверждена (на сайте не указана)",
    status: CHECK,
  },
  moratorium: {
    url: "https://www.advgazeta.ru/ag-expert/advices/moratoriy-na-proverki-prodlili-do-2030-goda/ ; https://buh.ru/news/pravitelstvo-prodlilo-ograniceniya-na-planovye-proverki-biznesa-do-2030-goda.html",
    label: "P §5 «Режим проверок в 2026 году» (ПП РФ № 336) — [Наблюдение, по выдаче]",
    status: CHECK,
  },
  nets: {
    url: "https://www.sostav.ru/blogs/286079/98613",
    label: "P §5 «Аудиты сетей и маркетплейсов» — [Наблюдение]",
    status: CHECK,
  },
  "gmp-bad": {
    url: "https://files.stroyinf.ru/Index2/1/4293768/4293768038.htm ; https://gxpnews.net/2024/10/na-konferenczii-farmliga-vstrecha-liderov-obsudili-regulirovanie-rynka-bad/",
    label: "P §2 «БАД» (ГОСТ Р 56202-2014, рекомендательный) — [Наблюдение, по выдаче]",
    status: CHECK,
  },
  "gmp-cosm": {
    url: "https://cn.gostinfo.ru/catalog/Details/?id=6143667",
    label: "P §2 «Косметика» (ГОСТ ISO 22716-2013) — [Наблюдение, по выдаче]; добровольность — [Гипотеза], сверить",
    status: CHECK,
  },
  "gmp-market": {
    url: "P §2 FAQ 5 (сводка выдачи)",
    label: "P §2 — [Наблюдение]: прямых требований площадок и сетей к GMP в выдаче не найдено",
    status: CHECK,
  },
  "sport-027": {
    url: "https://docs.ozon.ru/partners/zagruzka-tovarov/dokumenty-na-tovar/sertifikaty-kachestva-tovarov ; https://legalacts.ru/doc/pismo-rospotrebnadzora-ot-01072013-n-017420-13-32-o/",
    label: "R §3 «Спортивное питание» — [Наблюдение — по выдаче, первоисточник docs.ozon.ru]",
    status: CHECK,
  },
  "reg-299": {
    url: "https://www.alta.ru/tamdoc/10sr0299/ ; https://sudact.ru/law/reshenie-komissii-tamozhennogo-soiuza-ot-28052010-n/",
    label: "R §1 «Нормативная база» (Решение КТС от 28.05.2010 № 299) — [Наблюдение — по выдаче]",
    status: CHECK,
  },
  "law-29": {
    url: "consultant.ru (сниппет) ; ppt.ru",
    label: "R §1 «Нормативная база» (29-ФЗ, ст. 25.7 введена 150-ФЗ) — [Наблюдение — по выдаче]",
    status: CHECK,
  },
  "pp-936": {
    url: "https://www.ifcg.ru/news/2025-12-02/izmenenie-poradka-registracii-deklaracij-na-protokolah-ispytanij-drugih-stran-eaes/",
    label: "P §4 «Нормативная база» (ПП РФ от 19.07.2021 № 936) — [Наблюдение, по выдаче]",
    status: CHECK,
  },
  "proba-price": {
    url: "src/data.ts → PRICES.start",
    label: "Цена Proba Lab (не регуляторный факт)",
    status: "утверждено владельцем; менять только в data.ts",
  },
} satisfies Record<string, Source>;

export type SrcKey = keyof typeof SOURCES;
