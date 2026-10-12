// Генератор предложения «Школа ИММТ НГУ „Защита и заживление“» для ООО «Б. Браун Медикал».
// Пересборка:
//   python3 build/prepare_images.py
//   node build/build_docx.js
//   soffice --headless --convert-to pdf --outdir . NGU_IMMT_BBraun_Shkola_ginekologii_2026.docx

const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell,
  WidthType, BorderStyle, ShadingType, AlignmentType, VerticalAlign, Header, Footer,
  PageNumber, LevelFormat, LineRuleType, HeightRule, TableLayoutType, PageBreak, TabStopType,
} = require("docx");

const ROOT = path.resolve(__dirname, "..");
const IMG = path.join(__dirname, "img");
const OUT = path.join(ROOT, "NGU_IMMT_BBraun_Shkola_ginekologii_2026.docx");

// ---------- Бренд ----------
const GREEN = "5BB031";
const DARK = "1E3A1E";
const TEXT = "3C3C3C";
const MUTED = "6E6E6E";
const LIGHT = "EDEDED";
const PALE = "F4F8F0";
const WHITE = "FFFFFF";
const FONT = "Arial";

const SCHOOL = "Защита и заживление";
const SCHOOL_FULL = "Школа ИММТ НГУ «Защита и заживление»";

// A4
const PAGE_W = 11906;
const PAGE_H = 16838;
const MARGIN = 1134; // 20 мм
const CONTENT_W = PAGE_W - 2 * MARGIN; // 9638

const logo = fs.readFileSync(path.join(IMG, "logo_n.png"));
const campus = fs.readFileSync(path.join(IMG, "campus.jpg"));
const LOGO_RATIO = 596 / 748;

// ---------- Хелперы ----------
const NONE = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: NONE, bottom: NONE, left: NONE, right: NONE };
const tableNoBorders = { ...noBorders, insideHorizontal: NONE, insideVertical: NONE };

function run(text, o = {}) {
  return new TextRun({ text, font: FONT, color: o.color || TEXT, size: o.size || 21, bold: o.bold, italics: o.italics, characterSpacing: o.spacing });
}

// runs: строка или массив [текст | {t, bold, color}]
function runs(content, o = {}) {
  const arr = Array.isArray(content) ? content : [content];
  return arr.map((c) => (typeof c === "string" ? run(c, o) : run(c.t, { ...o, ...c })));
}

function p(content, o = {}) {
  return new Paragraph({
    children: runs(content, o),
    alignment: o.align || AlignmentType.LEFT,
    spacing: { before: o.before ?? 0, after: o.after ?? 120, line: o.line ?? 276, lineRule: LineRuleType.AUTO },
    keepNext: o.keepNext,
    keepLines: true,
    indent: o.indent,
    border: o.border,
    shading: o.shading,
    pageBreakBefore: o.pageBreakBefore,
  });
}

function bullet(content, o = {}) {
  return new Paragraph({
    children: runs(content, o),
    numbering: { reference: o.ref || "dash", level: 0 },
    spacing: { before: 0, after: o.after ?? 60, line: 264, lineRule: LineRuleType.AUTO },
    keepLines: true,
    keepNext: o.keepNext,
  });
}

// Заголовок раздела: зелёный номер + тёмный текст, зелёная линия снизу
function h1(num, text, o = {}) {
  return new Paragraph({
    children: [
      run(num ? `${num}  ` : "", { color: GREEN, size: 30, bold: true }),
      run(text, { color: DARK, size: 30, bold: true }),
    ],
    spacing: { before: o.before ?? 120, after: 200 },
    keepNext: true,
    keepLines: true,
    pageBreakBefore: o.pageBreak,
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: GREEN, space: 6 } },
  });
}

function h2(text, o = {}) {
  return new Paragraph({
    children: [run(text, { color: o.color || DARK, size: o.size || 23, bold: true })],
    spacing: { before: o.before ?? 200, after: o.after ?? 80 },
    keepNext: true,
    keepLines: true,
  });
}

function label(text, o = {}) {
  return new Paragraph({
    children: [run(text.toUpperCase(), { color: o.color || GREEN, size: 16, bold: true, spacing: 20 })],
    spacing: { before: o.before ?? 140, after: 60 },
    keepNext: true,
  });
}

function cell(children, o = {}) {
  return new TableCell({
    children: Array.isArray(children) ? children : [children],
    width: { size: o.w, type: WidthType.DXA },
    shading: o.fill ? { type: ShadingType.CLEAR, color: "auto", fill: o.fill } : undefined,
    margins: o.margins || { top: 90, bottom: 90, left: 140, right: 140 },
    verticalAlign: o.valign || VerticalAlign.TOP,
    borders: o.borders,
    columnSpan: o.span,
  });
}

// Таблица с зелёной шапкой
function dataTable(widths, header, rows, o = {}) {
  const total = widths.reduce((a, b) => a + b, 0);
  const lineB = { style: BorderStyle.SINGLE, size: 4, color: "D5D5D5" };
  const hdr = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: header.map((h, i) =>
      cell(p(h, { color: WHITE, bold: true, size: 18, after: 0, align: o.alignCols?.[i] }), {
        w: widths[i], fill: GREEN, borders: { top: NONE, left: NONE, right: NONE, bottom: NONE },
      })),
  });
  const body = rows.map((r, ri) => {
    const isTotal = r.total;
    const isGroup = r.group;
    const cells = r.cells || r;
    if (isGroup) {
      return new TableRow({
        cantSplit: true,
        children: [cell(p(cells[0], { bold: true, color: DARK, size: 19, after: 0, keepNext: true }), {
          w: total, span: widths.length, fill: PALE,
          borders: { top: NONE, left: NONE, right: NONE, bottom: lineB },
          margins: { top: 70, bottom: 70, left: 140, right: 140 },
        })],
      });
    }
    return new TableRow({
      cantSplit: true,
      children: cells.map((c, i) => {
        const content = Array.isArray(c) && c.length && c[0] instanceof Paragraph ? c
          : p(c, {
            size: isTotal ? 20 : (o.size || 19),
            bold: isTotal || (o.boldFirst && i === 0),
            color: isTotal ? WHITE : TEXT,
            after: 0,
            line: 252,
            align: o.alignCols?.[i],
          });
        return cell(content, {
          w: widths[i],
          fill: isTotal ? DARK : (o.zebra && ri % 2 === 1 ? "F7F7F7" : undefined),
          borders: { top: NONE, left: NONE, right: NONE, bottom: lineB },
          valign: o.valign,
        });
      }),
    });
  });
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: widths,
    layout: TableLayoutType.FIXED,
    borders: tableNoBorders,
    rows: [hdr, ...body],
  });
}

// Однострочная «плашка» (box) из одной ячейки
function box(children, o = {}) {
  const w = o.w || (o.accent ? CONTENT_W - 60 : CONTENT_W);
  return new Table({
    width: { size: w, type: WidthType.DXA },
    columnWidths: [w],
    layout: TableLayoutType.FIXED,
    borders: tableNoBorders,
    rows: [new TableRow({
      cantSplit: true,
      children: [cell(children, {
        w,
        fill: o.fill || LIGHT,
        margins: o.margins || { top: 140, bottom: 140, left: 220, right: 220 },
        borders: { top: NONE, right: NONE, bottom: NONE, left: o.accent ? { style: BorderStyle.SINGLE, size: 36, color: o.accent } : NONE },
      })],
    })],
  });
}

function spacer(after = 120) {
  return new Paragraph({ children: [], spacing: { before: 0, after, line: 240, lineRule: LineRuleType.AUTO } });
}

// ---------- Обложка ----------
function cover() {
  const coverW = PAGE_W;
  const photoH = Math.round(coverW * (980 / 1838));
  const pad = 1134;
  const children = [];
  children.push(new Paragraph({
    spacing: { before: 0, after: 0, line: 240, lineRule: LineRuleType.AUTO },
    children: [new ImageRun({ type: "jpg", data: campus, transformation: { width: Math.round(coverW / 15), height: Math.round(photoH / 15) } })],
  }));

  // Белая полоса с логотипом
  const logoH = 52;
  const logoRow = new Table({
    width: { size: coverW, type: WidthType.DXA },
    columnWidths: [pad + 1100, coverW - pad - 1100],
    layout: TableLayoutType.FIXED,
    borders: tableNoBorders,
    rows: [new TableRow({
      children: [
        cell(new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { before: 0, after: 0 },
          children: [new ImageRun({ type: "png", data: logo, transformation: { width: Math.round(logoH / LOGO_RATIO), height: logoH } })],
        }), { w: pad + 1100, margins: { top: 420, bottom: 360, left: pad, right: 0 }, valign: VerticalAlign.CENTER }),
        cell([
          p("Новосибирский государственный университет", { size: 22, bold: true, color: TEXT, after: 20 }),
          p("Институт медицины и медицинских технологий", { size: 20, color: TEXT, after: 40 }),
          p([{ t: "*", color: GREEN, bold: true }, { t: "НАСТОЯЩАЯ НАУКА", bold: true, spacing: 30 }], { size: 18, after: 0 }),
        ], { w: coverW - pad - 1100, margins: { top: 420, bottom: 360, left: 120, right: pad }, valign: VerticalAlign.CENTER }),
      ],
    })],
  });
  children.push(logoRow);

  // Тёмно-зелёная плашка с названием
  const plaque = new Table({
    width: { size: coverW, type: WidthType.DXA },
    columnWidths: [coverW],
    layout: TableLayoutType.FIXED,
    borders: tableNoBorders,
    rows: [new TableRow({
      height: { value: PAGE_H - Math.round(photoH) - 1900 + 260, rule: HeightRule.ATLEAST },
      children: [cell([
        p("ШКОЛА ПОСТДИПЛОМНОГО ОБРАЗОВАНИЯ ИММТ НГУ  ·  ГИНЕКОЛОГИЯ", { size: 17, bold: true, color: GREEN, spacing: 20, after: 160 }),
        p("Школа", { size: 30, color: WHITE, after: 0, line: 240 }),
        p(`«${SCHOOL}»`, { size: 60, bold: true, color: WHITE, after: 160, line: 240 }),
        p("Модуль 1. Антисептика и заживление ран", { size: 28, color: WHITE, after: 0 }),
        p("в акушерстве и гинекологии", { size: 28, color: WHITE, after: 260 }),
        new Paragraph({
          spacing: { before: 0, after: 240 },
          border: { top: { style: BorderStyle.SINGLE, size: 8, color: GREEN, space: 10 } },
          children: [run("Очная школа  ·  4 часа  ·  40 врачей  ·  Новосибирск, кампус НГУ", { size: 21, color: "CFE3C4" })],
        }),
        p("Предложение для ООО «Б. Браун Медикал»", { size: 26, bold: true, color: WHITE, after: 60 }),
        p("12 октября 2026 года", { size: 21, color: "CFE3C4", after: 0 }),
      ], { w: coverW, fill: DARK, margins: { top: 560, bottom: 400, left: pad, right: pad } })],
    })],
  });
  children.push(plaque);
  return children;
}

// ---------- Колонтитулы ----------
function header() {
  return new Header({
    children: [new Paragraph({
      spacing: { before: 0, after: 0 },
      tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_W }],
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "D5D5D5", space: 6 } },
      children: [
        new ImageRun({ type: "png", data: logo, transformation: { width: Math.round(20 / LOGO_RATIO), height: 20 } }),
        run("\t"),
        run("ИММТ НГУ  ·  Центр постдипломного медицинского образования", { size: 16, color: MUTED }),
      ],
    })],
  });
}

function footer() {
  return new Footer({
    children: [new Paragraph({
      spacing: { before: 0, after: 0 },
      tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_W }],
      children: [
        run(`${SCHOOL_FULL}  ·  Предложение для ООО «Б. Браун Медикал»`, { size: 15, color: MUTED }),
        run("\t"),
        new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 17, bold: true, color: GREEN }),
      ],
    })],
  });
}

// ---------- Ключевые цифры ----------
function keyFigures(items) {
  const w = Math.floor(CONTENT_W / items.length);
  const widths = items.map((_, i) => (i === items.length - 1 ? CONTENT_W - w * (items.length - 1) : w));
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: widths,
    layout: TableLayoutType.FIXED,
    borders: tableNoBorders,
    rows: [new TableRow({
      cantSplit: true,
      children: items.map(([num, cap, dark], i) => cell([
        p(num, { size: dark ? 34 : 44, bold: true, color: dark ? WHITE : GREEN, after: 0, line: 240 }),
        p(cap, { size: 17, color: dark ? "CFE3C4" : TEXT, after: 0, line: 240 }),
      ], {
        w: widths[i], fill: dark ? DARK : LIGHT,
        margins: { top: 160, bottom: 160, left: 200, right: 120 },
        borders: { top: NONE, bottom: NONE, left: NONE, right: i < items.length - 1 ? { style: BorderStyle.SINGLE, size: 24, color: WHITE } : NONE },
        valign: VerticalAlign.TOP,
      })),
    })],
  });
}

// ---------- Блок спикера ----------
function speaker(s) {
  const out = [];
  // Шапка: номер доклада и время
  out.push(box([
    p([{ t: `ДОКЛАД ${s.n}`, bold: true, color: GREEN, spacing: 20 }, { t: `   ·   ${s.time}`, color: "CFE3C4" }], { size: 17, after: 60, keepNext: true }),
    p(s.title, { size: 25, bold: true, color: WHITE, after: 0, line: 252, keepNext: true }),
  ], { fill: DARK, margins: { top: 180, bottom: 180, left: 240, right: 240 } }));
  out.push(new Paragraph({
    spacing: { before: 160, after: 30 }, keepNext: true,
    children: [run(s.name, { size: 24, bold: true, color: DARK })],
  }));
  out.push(p(s.regalia, { size: 19, color: MUTED, after: 60, keepNext: true }));
  out.push(label("Содержание доклада"));
  s.points.forEach((pt, i) => out.push(bullet(pt, { keepNext: i < s.points.length - 1 })));
  if (s.cases) {
    out.push(label("Клинические случаи"));
    out.push(p(s.cases, { after: 60 }));
  }
  out.push(label("Что получает врач"));
  out.push(p(s.doctor, { after: 60 }));
  out.push(label("Почему этот эксперт"));
  out.push(p(s.why, { after: 60 }));
  out.push(label("В методическом пособии"));
  out.push(p(s.guide, { after: 160 }));
  out.push(box([
    p([{ t: "Точка B. Braun", bold: true, color: DARK }], { size: 20, after: 60, keepNext: true }),
    ...s.bbraun.map((b) => p(b, { size: 19, after: 50, line: 264 })),
  ], { fill: PALE, accent: GREEN, margins: { top: 140, bottom: 100, left: 240, right: 220 } }));
  return out;
}

// ---------- Контент ----------
const content = [];

// 1. Обращение
content.push(h1("", "Уважаемые коллеги!", { before: 0 }));
content.push(p("Институт медицины и медицинских технологий НГУ приглашает компанию «Б. Браун Медикал» стать партнёром новой школы постдипломного образования для акушеров и гинекологов. Первый модуль посвящён тому, с чем врачи сталкиваются каждый день: антисептике, профилактике инфекционных осложнений и заживлению ран. От санации влагалища перед кесаревым сечением до ухода за швом промежности и послеоперационной раной."));
content.push(p("Тему ведут три эксперта, и каждый смотрит на неё со своей стороны: акушер-гинеколог, дерматовенеролог и хирург. Школу целиком готовит и проводит наш институт. Мы отвечаем за программу, площадку в кампусе НГУ, методическое пособие, видео, набор врачей и итоговый отчёт. От вашей команды нужны согласование темы и продуктовые материалы."));
content.push(p("Пронтосан и Браунодин входят в те клинические алгоритмы, которые разбирают наши спикеры. Поэтому школа будет полезна врачам, а у компании появится сильный экспертный контекст для дальнейшей работы. Ниже программа, состав материалов и смета. Буду рада обсудить детали при встрече."));
content.push(p([{ t: "Ирина Геннадьевна Сергеева", bold: true }], { before: 120, after: 0 }));
content.push(p("директор Центра постдипломного медицинского образования ИММТ НГУ, д.м.н., профессор", { size: 19, color: MUTED, after: 320 }));

content.push(keyFigures([
  ["40", "врачей: акушеры и гинекологи"],
  ["4 часа", "очной работы, 240 минут"],
  ["3", "эксперта: гинеколог, дерматолог, хирург"],
  ["800 000 ₽", "пакет под ключ", true],
]));
content.push(spacer(240));

content.push(h2("Школа в одной таблице", { before: 120, after: 120 }));
content.push(dataTable([2600, CONTENT_W - 2600], ["Параметр", "Значение"], [
  ["Название", `${SCHOOL_FULL}. Модуль 1: антисептика и заживление ран в акушерстве и гинекологии`],
  ["Формат", "Очная школа постдипломного медицинского образования НГУ"],
  ["Аудитория", "Акушеры и гинекологи: врачи роддомов и перинатальных центров, гинекологи амбулаторного звена и стационаров, оперирующие гинекологи. Смежные специалисты: дерматовенерологи"],
  ["Участники", "40 врачей"],
  ["Продолжительность", "4 часа (240 минут), один день"],
  ["Место", "Новосибирск, кампус НГУ, ул. Пирогова, 1"],
  ["Дата", "По согласованию; подготовка занимает 6 недель"],
  ["Документ участнику", "Сертификат ИММТ НГУ о прохождении школы; возможна подача на аккредитацию в системе НМО"],
  ["Организатор", "ИММТ НГУ, Центр постдипломного медицинского образования"],
  ["Партнёр", "ООО «Б. Браун Медикал»"],
], { boldFirst: true }));

// 2. О школе
content.push(h1("01", "Зачем эта школа", { pageBreak: true, before: 0 }));
content.push(p("Инфекционные осложнения после родов и гинекологических вмешательств по-прежнему дают повторные визиты, повторные госпитализации и недовольство пациенток. Многие из них предупреждаются простыми действиями: правильно подготовить влагалище и операционное поле, грамотно вести шов, вовремя увидеть, что рана заживает не так."));
content.push(p("На практике алгоритмы в разных учреждениях отличаются. А вопросы на стыке специальностей часто остаются без хозяина. Вульва и промежность лежат между гинекологом и дерматологом. Послеоперационная рана лежит между гинекологом и хирургом. Школа закрывает этот разрыв: за четыре часа врач получает согласованный взгляд трёх специалистов и готовые алгоритмы для своего кабинета или операционной."));
content.push(p([{ t: "Почему «Защита и заживление». ", bold: true, color: DARK }, "Название описывает две половины одной задачи: защитить от инфекции до и во время вмешательства, затем помочь ране зажить. Название рассчитано на цикл. Следующие модули могут быть посвящены, например, урогинекологии или ведению пациенток после онкогинекологических операций."]));

content.push(h2("Для кого", { before: 220 }));
content.push(dataTable([3300, CONTENT_W - 3300], ["Группа", "Что для них главное в школе"], [
  ["Акушеры: врачи родильных домов и перинатальных центров", "Подготовка к кесареву сечению, ведение промежности после разрывов и эпизиотомии, ранние раневые осложнения"],
  ["Гинекологи амбулаторного звена", "Женские консультации и частные клиники: заболевания вульвы, уход за швом после выписки, амбулаторные манипуляции"],
  ["Гинекологи стационаров и оперирующие гинекологи", "Профилактика инфекций в области операции, осложнённая послеоперационная рана, подготовка операционного поля"],
  ["Смежные специалисты", "Дерматовенерологи, которые ведут пациенток с патологией вульвы совместно с гинекологом"],
], { boldFirst: true }));
content.push(p("Группу набирает НГУ: через слушателей и выпускников программ ИММТ, клинические базы института и профессиональные сообщества региона. B. Braun может рекомендовать врачей из своей базы, решение о составе группы остаётся за организатором.", { before: 160, size: 19, color: MUTED, after: 240 }));
content.push(box([
  p([{ t: "Почему на площадке НГУ", bold: true, color: DARK }], { size: 21, after: 80, keepNext: true }),
  bullet("Школа входит в систему постдипломного медицинского образования университета, а не проходит как разовое мероприятие.", { keepNext: true }),
  bullet("Материалы проходят научную рецензию профессоров НГУ. Врачам это важно, и это заметно отличает школу от продуктовой презентации.", { keepNext: true }),
  bullet("Участник получает сертификат ИММТ НГУ. Для врача это повод прийти, для компании это доверие к содержанию.", { after: 0 }),
], { fill: PALE, accent: GREEN, margins: { top: 160, bottom: 160, left: 240, right: 220 } }));

// 3. Программа
content.push(h1("02", "Программа на 4 часа", { pageBreak: true, before: 0 }));
content.push(p("Время ориентировочное: начало подстроим под удобный для врачей слот.", { size: 19, color: MUTED, keepNext: true }));
const programme = [
  ["10:00–10:15", "15 мин", "Открытие школы", "Приветствие ИММТ НГУ, цели дня, входной тест (5 вопросов)"],
  ["10:15–11:05", "50 мин", "Доклад 1. Н. М. Пасман", "Инфекции нижних отделов генитального тракта и профилактика осложнений в родах и после вмешательств"],
  ["11:05–11:50", "45 мин", "Доклад 2. И. Г. Сергеева", "Интимная дерматология: кожа и слизистая вульвы на приёме у гинеколога"],
  ["11:50–12:10", "20 мин", "Кофе-брейк", "Общение со спикерами, стенд партнёра"],
  ["12:10–13:00", "50 мин", "Доклад 3. С. Г. Штофин", "Послеоперационная рана в акушерстве и гинекологии: от профилактики инфекции до заживления. Клинические случаи"],
  ["13:00–13:35", "35 мин", "Практикум", "Междисциплинарный разбор трёх кейсов, ведут все три эксперта, аудитория голосует за тактику"],
  ["13:35–13:50", "15 мин", "Дискуссия", "Вопросы врачей, итоговые выводы"],
  ["13:50–14:00", "10 мин", "Завершение", "Выходной тест, анкета обратной связи, вручение сертификатов"],
];
const progSum = programme.reduce((a, r) => a + parseInt(r[1], 10), 0);
if (progSum !== 240) throw new Error(`Программа: ${progSum} мин вместо 240`);
content.push(dataTable([1500, 1000, 2350, CONTENT_W - 4850], ["Время", "Мин", "Блок", "Содержание"], [
  ...programme,
  { total: true, cells: ["Итого", "240", "4 часа", "3 доклада, практикум, дискуссия, тестирование"] },
], { boldFirst: false, zebra: true }));
content.push(h2("Практикум: междисциплинарный разбор", { before: 400 }));
content.push(p("Тридцать пять минут работы с аудиторией. Каждый кейс ведут все три эксперта, врачи голосуют за тактику, затем спикеры объясняют свой выбор.", { keepNext: true }));
content.push(bullet([{ t: "Кейс 1. ", bold: true }, "Пациентка после кесарева сечения, инфильтрат в области шва на пятые сутки."], { ref: "dash", keepNext: true }));
content.push(bullet([{ t: "Кейс 2. ", bold: true }, "Расхождение шва промежности на фоне мацерации кожи."], { ref: "dash", keepNext: true }));
content.push(bullet([{ t: "Кейс 3. ", bold: true }, "Хронические эрозии вульвы с вторичной инфекцией."], { ref: "dash", after: 280 }));
content.push(box([
  p([{ t: "С чем врач уходит со школы", bold: true, color: DARK }], { size: 21, after: 80, keepNext: true }),
  bullet("Печатное методическое пособие ИММТ НГУ.", { keepNext: true }),
  bullet("Три алгоритма: антисептическая подготовка перед родоразрешением и вмешательствами; уход за кожей и слизистой вульвы; ведение послеоперационной раны по принципу TIME.", { keepNext: true }),
  bullet("Разобранные клинические случаи из практики трёх специальностей.", { keepNext: true }),
  bullet("Сертификат ИММТ НГУ о прохождении школы.", { after: 0 }),
], { fill: LIGHT, accent: DARK, margins: { top: 160, bottom: 160, left: 240, right: 220 } }));

// 4. Эксперты
content.push(h1("03", "Эксперты и доклады", { pageBreak: true, before: 0 }));
content.push(p("Каждый доклад построен вокруг клинического алгоритма. Продукты B. Braun появляются там, где они действительно применяются: в антисептике и уходе за раной, в пределах зарегистрированных показаний. Спикеры отвечают за клиническое содержание, доклады остаются экспертными."));
content.push(spacer(80));

const speakers = [
  {
    n: 1, time: "50 минут",
    title: "Инфекции нижних отделов генитального тракта: как предупредить осложнения в родах и после гинекологических вмешательств",
    name: "Пасман Наталья Михайловна",
    regalia: "Заслуженный врач РФ, д.м.н., профессор. Акушер-гинеколог, основательница одной из ведущих многопрофильных клиник репродуктивного здоровья Новосибирска.",
    points: [
      "Вагинит, цервицит, бактериальный вагиноз: что нужно выявить и пролечить до родоразрешения и планового вмешательства.",
      "Санация влагалища перед кесаревым сечением и гинекологическими операциями: кому, когда, чем и как. Что говорит доказательная база, включая обзор Cochrane о вагинальной подготовке антисептиком перед кесаревым сечением и снижении частоты эндометрита.",
      "Ведение промежности после разрывов и эпизиотомии: обработка шва, гигиена, сроки осмотра, что объяснить пациентке при выписке.",
      "Ранние признаки раневых осложнений после родов: отёк, инфильтрат, расхождение шва, нагноение. Тактика врача роддома и врача женской консультации.",
      "Антисептическая подготовка к внутриматочным вмешательствам и амбулаторным манипуляциям.",
    ],
    why: "Большой клинический опыт в акушерстве и гинекологии и работа во главе клиники репродуктивного здоровья. Наталья Михайловна знает, как алгоритмы работают в реальном потоке пациенток, а не только в рекомендациях.",
    guide: "Глава 1. Антисептическая подготовка перед родоразрешением и гинекологическими вмешательствами. Ведение шва промежности.",
    doctor: "Пошаговый алгоритм антисептической подготовки перед родоразрешением и вмешательствами. Схему ведения шва промежности от родильного зала до контрольного визита после выписки.",
    bbraun: [
      [{ t: "Браунодин (повидон-йод). ", bold: true }, "Антисептик в алгоритме санации влагалища и обработки слизистых перед кесаревым сечением и гинекологическими вмешательствами."],
      [{ t: "Пронтосан (раствор и гель с полигексанидом и бетаином). ", bold: true }, "Очищение раны промежности и шва при раневых осложнениях после родов, работа с биоплёнкой."],
    ],
  },
  {
    n: 2, time: "45 минут",
    title: "Интимная дерматология: кожа и слизистая вульвы на приёме у гинеколога",
    name: "Сергеева Ирина Геннадьевна",
    regalia: "Д.м.н., профессор кафедры фундаментальной медицины ИММТ НГУ. Дерматовенеролог, онкодерматолог. Директор Центра постдипломного медицинского образования ИММТ НГУ.",
    points: [
      "Дерматозы вульвы, которые гинеколог видит чаще всего: склероатрофический лихен, красный плоский лишай, контактный и атопический дерматит, псориаз.",
      "Эрозии, трещины, мацерация: как отличить дерматоз от инфекции и когда нужна биопсия.",
      "Вторичное инфицирование повреждённой кожи и слизистой: на что смотреть и что делать.",
      "Онкологическая настороженность: какие изменения вульвы нельзя просто наблюдать.",
      "Барьер кожи и слизистой: почему агрессивная обработка мешает заживлению и как выбрать бережную антисептику.",
      "Когда направлять к дерматовенерологу и как выстроить совместное ведение пациентки.",
    ],
    why: "Дерматовенеролог и онкодерматолог. Видит тех пациенток, которых гинеколог направляет на консультацию, и знает, где проходит граница двух специальностей.",
    guide: "Глава 2. Кожа и слизистая вульвы: дифференциальная диагностика и бережный уход.",
    doctor: "Алгоритм дифференциальной диагностики изменений кожи и слизистой вульвы. Схему бережного ухода за повреждённой кожей и слизистой интимной зоны.",
    bbraun: [
      [{ t: "Пронтосан. ", bold: true }, "Бережное очищение эрозий, трещин и мелких раневых дефектов вульвы с сохранением условий для заживления."],
      [{ t: "Браунодин. ", bold: true }, "Антисептика слизистой при риске вторичного инфицирования и перед малыми вмешательствами, включая биопсию вульвы."],
    ],
  },
  {
    n: 3, time: "50 минут, с клиническими случаями",
    title: "Послеоперационная рана в акушерстве и гинекологии: от профилактики инфекции до заживления",
    name: "Штофин Сергей Григорьевич",
    regalia: "Хирург, д.м.н., профессор.",
    points: [
      "Инфекции области хирургического вмешательства после кесарева сечения и гинекологических операций: факторы риска (ожирение, сахарный диабет, анемия, длительный безводный промежуток).",
      "Подготовка операционного поля: антисептика кожи, время экспозиции, типичные ошибки.",
      "Серома, гематома, расхождение швов, нагноение: ранние признаки и тактика.",
      "Биоплёнка: почему рана перестаёт заживать и как с этим работать.",
      "Принцип TIME и подготовка раневого ложа: очищение, контроль инфекции, баланс влажности, состояние краёв раны.",
      "Промывание и очищение раны на перевязке: чем, как часто и чем заменить привычные растворы.",
    ],
    cases: "Три-четыре разбора из практики: нагноение раны после кесарева сечения, расхождение шва передней брюшной стенки, длительно незаживающая рана у пациентки с ожирением.",
    why: "Хирург смотрит на послеоперационную рану с позиций раневой хирургии. Принципы подготовки раневого ложа, которые он разбирает, в гинекологии применяют реже, чем стоило бы.",
    guide: "Глава 3. Послеоперационная рана: профилактика инфекций в области операции и ведение по принципу TIME. Разборы клинических случаев.",
    doctor: "Чек-лист профилактики инфекций в области операции. Алгоритм ведения осложнённой послеоперационной раны по принципу TIME.",
    bbraun: [
      [{ t: "Браунодин. ", bold: true }, "Подготовка операционного поля перед кесаревым сечением и гинекологическими операциями."],
      [{ t: "Пронтосан. ", bold: true }, "Промывание и очищение послеоперационной раны, работа с биоплёнкой на этапе подготовки раневого ложа. Гель наносится на раневое ложе после очищения."],
    ],
  },
];
speakers.forEach((s, i) => {
  if (i > 0) content.push(new Paragraph({ children: [new PageBreak()], spacing: { before: 0, after: 0 } }));
  content.push(...speaker(s));
});


// 5. Что получает B. Braun
content.push(h1("04", "Что получает B. Braun, кроме очной школы", { pageBreak: true, before: 0 }));
content.push(p("Коротко о том, что остаётся у компании после школы."));
const gets = [
  ["Очная школа", "40 врачей вашей целевой аудитории в кампусе НГУ. Четыре часа живой работы с экспертами, стенд и присутствие команды B. Braun на площадке."],
  ["Методическое пособие", "24–32 страницы под научной рецензией профессоров НГУ. Отдельные разделы о Пронтосане и Браунодине в клинических алгоритмах. B. Braun может использовать пособие в своей работе: тиражировать, раздавать врачам, рассылать в электронном виде."],
  ["Презентации спикеров", "Подготовлены в едином стиле и передаются компании для дальнейшей работы медицинских представителей."],
  ["Видеоматериалы", "Профессиональная съёмка на две камеры и монтаж: полная запись школы и 6–8 коротких роликов. Передаются B. Braun в собственность для продвижения."],
  ["Аналитика", "Регистрация, явка, анкеты, входной и выходной тест по антисептике и уходу за ранами, включая вопросы о Пронтосане и Браунодине. Итоговый отчёт с цифрами."],
  ["База контактов участников", "Передаётся только с согласием врачей на обработку персональных данных и на получение информации от B. Braun (152-ФЗ). Согласие собираем при регистрации."],
  ["Статус университета", "Всё проходит в рамках постдипломного медицинского образования НГУ. Участники получают сертификат ИММТ НГУ о прохождении школы. Возможна подача на аккредитацию в системе НМО."],
];
content.push(dataTable([2700, CONTENT_W - 2700], ["Что", "Что именно вы получаете"], gets, { boldFirst: true }));

// 6. Ответственность сторон
content.push(h1("05", "Ответственность сторон", { before: 420 }));
const half = Math.floor(CONTENT_W / 2);
content.push(dataTable([half, CONTENT_W - half], ["ИММТ НГУ", "B. Braun"], [
  [
    [
      bullet("Программа и эксперты", { size: 19 }),
      bullet("Площадка в кампусе НГУ и техника", { size: 19 }),
      bullet("Методическое пособие, рецензия, печать", { size: 19 }),
      bullet("Презентации в едином стиле", { size: 19 }),
      bullet("Набор и регистрация врачей, согласия", { size: 19 }),
      bullet("Видеосъёмка и монтаж", { size: 19 }),
      bullet("Тестирование, анкеты, итоговый отчёт", { size: 19 }),
      bullet("Сертификаты участникам", { after: 0, size: 19 }),
    ],
    [
      bullet("Согласует тематику с медицинским отделом и комплаенсом", { size: 19 }),
      bullet("Передаёт продуктовые материалы для методического пособия", { size: 19 }),
      bullet("Утверждает дату школы", { size: 19 }),
      bullet("При желании рекомендует врачей и присутствует на площадке", { after: 0, size: 19 }),
    ],
  ],
]));

// 8. Смета
content.push(h1("06", "Смета", { pageBreak: true, before: 0 }));
content.push(p("Пакет под ключ. Все работы и расходы на стороне НГУ.", { keepNext: true }));
const budget = [
  { group: "Эксперты и научное содержание" },
  ["Гонорар: Пасман Н. М.", "Подготовка и доклад, участие в практикуме", 85000],
  ["Гонорар: Сергеева И. Г.", "Доклад, участие в практикуме, научная редакция методического пособия", 100000],
  ["Гонорар: Штофин С. Г.", "Доклад с клиническими случаями, ведение практикума", 85000],
  ["Научное рецензирование пособия", "Два рецензента, профессора НГУ", 40000],
  { group: "Материалы" },
  ["Методическое пособие", "Разработка, литературная редактура, вёрстка, 24–32 страницы", 70000],
  ["Печать пособия", "Тираж 100 экземпляров, полноцвет", 35000],
  ["Презентации", "Подготовка и дизайн трёх докладов и практикума в едином стиле", 35000],
  { group: "Проведение школы" },
  ["Аудитория кампуса НГУ", "Аренда, звук, проектор, техническая поддержка, возможность трансляции", 45000],
  ["Кофе-брейк", "На 50 человек", 30000],
  ["Участники", "Привлечение и регистрация врачей, коммуникация, бейджи, раздаточные материалы, сертификаты", 40000],
  { group: "Видео и аналитика" },
  ["Видеопроизводство", "Съёмка на две камеры, монтаж полной записи и 6–8 роликов, передача прав", 80000],
  ["Аналитика", "Входной и выходной тест, анкеты, итоговый отчёт, база контактов с согласиями", 30000],
  { group: "Управление" },
  ["Проектное управление ИММТ НГУ", "Координация экспертов, подрядчиков и партнёра, контроль сроков", 45000],
  ["Административные расходы НГУ", "Накладные расходы университета (10%)", 80000],
];
const total = budget.filter((r) => Array.isArray(r)).reduce((a, r) => a + r[2], 0);
if (total !== 800000) throw new Error(`Смета: ${total} вместо 800000`);
const fmt = (n) => n.toLocaleString("ru-RU").replace(/ | /g, " ").replace(/ /g, " ") + " ₽";
content.push(dataTable([2900, CONTENT_W - 2900 - 1600, 1600], ["Статья", "Состав / комментарий", "Сумма"], [
  ...budget.map((r) => (Array.isArray(r) ? [r[0], r[1], fmt(r[2])] : { group: true, cells: [r.group] })),
  { total: true, cells: ["Итого, пакет", "Очная школа и все материалы", fmt(total)] },
], { boldFirst: false, alignCols: [AlignmentType.LEFT, AlignmentType.LEFT, AlignmentType.RIGHT] }));
content.push(p("НДС, налоговый режим и окончательные условия фиксируются договором с НГУ.", { before: 120, size: 18, color: MUTED, after: 0 }));

content.push(new Paragraph({ children: [new PageBreak()], spacing: { before: 0, after: 0 } }));
content.push(h2("Опционально, по отдельной смете", { before: 0, after: 120 }));
content.push(dataTable([3600, CONTENT_W - 3600], ["Опция", "Комментарий"], [
  ["Дополнительный тираж пособия", "Любой объём, для раздачи медицинскими представителями"],
  ["Трансфер и проживание", "Для иногородних участников или спикеров"],
  ["Аккредитация в системе НМО", "Подготовка и подача документов, баллы участникам"],
  ["Онлайн-трансляция на регионы", "Трансляция с регистрацией и аналитикой подключений"],
  ["Повтор школы в другом городе", "Тот же модуль на площадке партнёрского вуза или клиники"],
], { boldFirst: true }));

// 7. Сроки
content.push(h1("07", "Сроки подготовки", { before: 360 }));
content.push(p("Шесть недель от подписания договора до школы. Материалы передаём в течение трёх недель после неё.", { keepNext: true }));
content.push(dataTable([1700, CONTENT_W - 1700], ["Неделя", "Что происходит"], [
  ["1", "Договор, утверждение даты, согласование темы с медицинским отделом B. Braun"],
  ["2", "Тезисы докладов, структура пособия, получение продуктовых материалов; открываем регистрацию"],
  ["3–4", "Текст пособия, презентации спикеров, набор группы"],
  ["5", "Научное рецензирование и вёрстка пособия, согласование с B. Braun, печать; подготовка тестов"],
  ["6", "Проведение школы, видеосъёмка"],
  ["+3 недели", "Монтаж видео, итоговый отчёт, передача всех материалов"],
], { boldFirst: true }));

// 9. Следующие шаги и подпись
content.push(h1("08", "Следующие шаги", { before: 360 }));
const steps = [
  ["1", "Согласование темы и даты", "Встреча или звонок с вашей командой и медицинским отделом"],
  ["2", "Договор с НГУ", "Подписываем договор, фиксируем состав пакета и сроки"],
  ["3", "Старт подготовки", "Через шесть недель проводим школу"],
];
const sw = Math.floor(CONTENT_W / 3);
const swidths = [sw, sw, CONTENT_W - 2 * sw];
content.push(new Table({
  width: { size: CONTENT_W, type: WidthType.DXA },
  columnWidths: swidths,
  layout: TableLayoutType.FIXED,
  borders: tableNoBorders,
  rows: [new TableRow({
    cantSplit: true,
    children: steps.map(([n, t, d], i) => cell([
      p(n, { size: 44, bold: true, color: GREEN, after: 40, line: 240 }),
      p(t, { size: 21, bold: true, color: DARK, after: 40 }),
      p(d, { size: 18, color: TEXT, after: 0 }),
    ], {
      w: swidths[i], fill: LIGHT, margins: { top: 160, bottom: 180, left: 200, right: 160 },
      borders: { top: NONE, bottom: NONE, left: NONE, right: i < 2 ? { style: BorderStyle.SINGLE, size: 24, color: WHITE } : NONE },
    })),
  })],
}));

content.push(spacer(360));
content.push(p("С уважением,", { keepNext: true, after: 200 }));
content.push(new Table({
  width: { size: CONTENT_W, type: WidthType.DXA },
  columnWidths: [5600, CONTENT_W - 5600],
  layout: TableLayoutType.FIXED,
  borders: tableNoBorders,
  rows: [new TableRow({
    cantSplit: true,
    children: [
      cell([
        p("Директор Центра постдипломного", { size: 19, after: 0 }),
        p("медицинского образования ИММТ НГУ,", { size: 19, after: 0 }),
        p("д.м.н., профессор", { size: 19, after: 200 }),
        p("тел.: ____________________", { size: 19, color: MUTED, after: 40 }),
        p("e-mail: __________________", { size: 19, color: MUTED, after: 0 }),
      ], { w: 5600, margins: { top: 0, bottom: 0, left: 0, right: 200 } }),
      cell([
        p(" ", { size: 19, after: 260 }),
        new Paragraph({
          spacing: { before: 0, after: 40 },
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: TEXT, space: 4 } },
          alignment: AlignmentType.RIGHT,
          children: [run("И. Г. Сергеева", { size: 22, bold: true, color: DARK })],
        }),
        p("подпись", { size: 15, color: MUTED, align: AlignmentType.RIGHT, after: 0 }),
      ], { w: CONTENT_W - 5600, margins: { top: 0, bottom: 0, left: 200, right: 0 }, valign: VerticalAlign.BOTTOM }),
    ],
  })],
}));

// ---------- Документ ----------
const doc = new Document({
  creator: "ИММТ НГУ",
  title: `${SCHOOL_FULL}: предложение для ООО «Б. Браун Медикал»`,
  description: "Школа постдипломного медицинского образования ИММТ НГУ для акушеров и гинекологов",
  styles: {
    default: { document: { run: { font: FONT, size: 21, color: TEXT } } },
  },
  numbering: {
    config: [{
      reference: "dash",
      levels: [{
        level: 0, format: LevelFormat.BULLET, text: "■", alignment: AlignmentType.LEFT,
        style: {
          paragraph: { indent: { left: 340, hanging: 280 } },
          run: { color: GREEN, size: 14, font: FONT },
        },
      }],
    }],
  },
  sections: [
    {
      properties: {
        page: { size: { width: PAGE_W, height: PAGE_H }, margin: { top: 0, bottom: 0, left: 0, right: 0, header: 0, footer: 0 } },
      },
      children: cover(),
    },
    {
      properties: {
        page: { size: { width: PAGE_W, height: PAGE_H }, margin: { top: 1300, bottom: 1100, left: MARGIN, right: MARGIN, header: 560, footer: 520 } },
      },
      headers: { default: header() },
      footers: { default: footer() },
      children: content,
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUT, buf);
  console.log("written", OUT, "budget", total, "programme", progSum);
});
