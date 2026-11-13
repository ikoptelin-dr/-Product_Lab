// Квиз «Какой документ нужен вашему продукту»: чистая функция без DOM.
// Результат предварительный — точный список определяем по составу.
// Фактические фразы помечены ⟪ключ|…⟫ (см. sources.ts): клиент снимает метки, сборка заносит их в REGULATORY_VERIFY.md.
import { f } from "./mark";

export type ProductType = "bad" | "cosm" | "food" | "sport" | "other";
export type CosmGroup = "yes" | "no" | "unsure";
export type Production = "own" | "contract" | "import";
export type Channel = "marketplace" | "pharmacy" | "retail" | "site";

export interface QuizAnswers {
  type: ProductType;
  cosmGroup?: CosmGroup;
  production: Production;
  channels: Channel[];
}

export interface QuizItem {
  title: string;
  text: string;
  href: string;
}

export interface QuizResult {
  /** Короткий код набора документов — для проверки логики. */
  code: string;
  documents: QuizItem[];
  obligations: QuizItem[];
  /** Для категории формы на странице. */
  category: string;
  stop?: string;
}

export const TYPE_LABEL: Record<ProductType, string> = {
  bad: "БАД",
  cosm: "Косметика",
  food: "Пищевая продукция",
  sport: "Спортивное питание",
  other: "Другое",
};

/** Группы косметики, для которых обе фактбазы называют СГР. Остальное — «уточним по составу». */
export const COSM_SGR_GROUPS = "для детей, для интимной гигиены, для искусственного загара, для отбеливания (осветления) кожи, с наноматериалами";

const LABS: QuizItem = {
  title: "Протоколы испытаний аккредитованной лаборатории",
  text: "Подберём лабораторию по области аккредитации и согласуем программу под состав.",
  href: "laboratorii.html",
};

export function quizResult(a: QuizAnswers): QuizResult {
  const docs: QuizItem[] = [];
  const obl: QuizItem[] = [];
  const foodLike = a.type === "bad" || a.type === "food" || a.type === "sport";
  let code: string = a.type;
  let sgr = false; // основной документ — СГР
  let stop: string | undefined;

  if (a.type === "bad") {
    sgr = true;
    docs.push({
      title: "Свидетельство о госрегистрации (СГР)",
      text: f("bad-sgr-required", "БАД подлежат государственной регистрации, СГР выдаёт Роспотребнадзор.") + " " + f("voluntary-cert", "Декларация или добровольный сертификат его не заменяют."),
      href: "registraciya-bad.html",
    });
    docs.push({
      title: "ТУ или СТО на продукт",
      text: f("tu-docs", "Документ, по которому производится продукт, входит в пакет на СГР."),
      href: "tu.html",
    });
    docs.push(LABS);
    docs.push({
      title: "Проект этикетки",
      text: f("rpn-docs", "Этикетка или её проект входит в документы на регистрацию.") + " Делаем её сразу так, чтобы не переделывать упаковку.",
      href: "markirovka.html",
    });
  } else if (a.type === "cosm") {
    const g = a.cosmGroup ?? "unsure";
    code = `cosm-${g}`;
    if (g === "yes") {
      sgr = true;
      docs.push({
        title: "СГР на косметику",
        text: f("cosm-sgr", "Для косметики из перечня Приложения 12 к ТР ТС 009/2011 нужна госрегистрация.") + " Точную группу подтвердим по составу и назначению.",
        href: "kosmetika.html",
      });
    } else if (g === "no") {
      docs.push({
        title: "Декларация о соответствии ТР ТС 009/2011",
        text: f("cosm-sgr", "Для большей части косметики обязательная форма — декларация о соответствии.") + " Некоторые категории требуют СГР — уточним по составу.",
        href: "kosmetika.html",
      });
    } else {
      docs.push({
        title: "Декларация или СГР — определим по составу",
        text: f("cosm-sgr", "Обычно на косметику оформляют декларацию, а для отдельных групп нужен СГР.") + " Скажем точно после проверки состава и назначения.",
        href: "kosmetika.html",
      });
    }
    docs.push(LABS);
    docs.push({
      title: "Этикетка по ТР ТС 009/2011",
      text: f("cosm-label", "На этикетке косметики обязательны в том числе наименование, назначение, изготовитель, срок годности и список ингредиентов."),
      href: "markirovka.html",
    });
  } else if (a.type === "food") {
    docs.push({
      title: "Декларация о соответствии ТР ТС 021/2011",
      text: f("decl-scope", "Для пищевой продукции обычно оформляют декларацию; СГР нужен специализированной продукции и продукции нового вида.") + " Определим по составу.",
      href: "deklaracii.html",
    });
    docs.push({
      title: "ТУ или СТО — если продукт выпускается не по ГОСТ",
      text: "Техническая документация, на соответствие которой проверяют образцы.",
      href: "tu.html",
    });
    docs.push(LABS);
    docs.push({
      title: "Этикетка по ТР ТС 022/2011",
      text: f("tr022", "Требования к маркировке пищевой продукции задаёт ТР ТС 022/2011."),
      href: "markirovka.html",
    });
  } else if (a.type === "sport") {
    docs.push({
      title: "СГР или декларация — зависит от назначения",
      text: f("sport-027", "Если продукт заявлен как пищевая продукция для питания спортсменов (ТР ТС 027/2012), нужен СГР; для обычной пищевой продукции — декларация.") + " Границу определим по составу и маркировке.",
      href: "deklaracii.html",
    });
    docs.push({
      title: "ТУ или СТО на продукт",
      text: "Документ, по которому производится продукт, — основа для испытаний и документов.",
      href: "tu.html",
    });
    docs.push(LABS);
    docs.push({
      title: "Этикетка по ТР ТС 022/2011",
      text: "Состав, назначение и формулировки на этикетке должны совпадать с документами.",
      href: "markirovka.html",
    });
  } else {
    docs.push({
      title: "Определим по составу и назначению",
      text: "Пришлите состав или ссылку на продукт — скажем, какой документ нужен и нужен ли он вообще.",
      href: "#form",
    });
    stop = "Не работаем с лекарственными средствами и медицинскими изделиями.";
  }

  // Маркировка «Честный знак»
  if (a.type === "bad") {
    obl.push({
      title: "Маркировка «Честный знак»",
      text: f("chz-bad", "Маркируются БАД с действующим СГР в Едином реестре ЕАЭС и кодами ТН ВЭД из перечня ПП РФ № 886."),
      href: "markirovka.html",
    });
  } else if (a.type === "cosm") {
    obl.push({
      title: "Маркировка «Честный знак»",
      text: f("chz-cosm", "Косметику маркируют с 1 октября 2025 года (ПП РФ № 1681).") + " Проверим товарную группу.",
      href: "markirovka.html",
    });
  } else if (foodLike) {
    obl.push({
      title: "Обязательная маркировка",
      text: "Проверим, входит ли продукт в перечни обязательной маркировки.",
      href: "markirovka.html",
    });
  }

  // Производство
  if (a.production === "own") {
    code += "-own";
    if (foodLike) {
      obl.push({
        title: "Процедуры ХАССП на производстве",
        text: f("haccp-10", "Изготовитель пищевой продукции обязан разработать, внедрить и поддерживать процедуры на принципах ХАССП (ст. 10 ТР ТС 021/2011).") + (a.type === "bad" ? " " + f("haccp-bad", "БАД в актах ЕАЭС — тоже пищевая продукция.") : ""),
        href: "haccp.html",
      });
    }
    if (a.type !== "other") {
      obl.push({
        title: "Программа производственного контроля",
        text: f("ppk", "Программа производственного контроля обязательна по санитарному законодательству.") + " " + f("ppk-lab", "Лабораторный контроль — только в аккредитованных лабораториях."),
        href: "proverki-rospotrebnadzora.html",
      });
    }
    if (a.type === "bad") {
      obl.push({
        title: "GMP — по желанию",
        text: f("gmp-bad", "ГОСТ Р 56202-2014 для производства БАД — рекомендательный.") + " Пригодится как аргумент для сетей и партнёров.",
        href: "gmp.html",
      });
    } else if (a.type === "cosm") {
      obl.push({
        title: "GMP — по желанию",
        text: f("gmp-cosm", "Для косметики действует ГОСТ ISO 22716-2013 — добровольный стандарт надлежащей производственной практики."),
        href: "gmp.html",
      });
    }
  } else if (a.production === "contract") {
    code += "-contract";
    obl.push({
      title: "Проверка площадки и договор с производителем",
      text: (foodLike ? f("haccp-10", "Процедуры ХАССП обязан внедрить изготовитель.") + " " : "") + "Проверим площадку и закрепим в договоре заявителя документов, право аудита и контроль изменений.",
      href: foodLike ? "haccp.html" : "vyvod-na-rynok.html",
    });
    if (a.type === "bad") {
      obl.push({
        title: "Схема «Честного знака» с контрактником",
        text: f("chz-contract", "В классической схеме коды заказывает изготовитель, в давальческой — заказчик."),
        href: "markirovka.html",
      });
    }
  } else {
    code += "-import";
    if (sgr) {
      obl.push({
        title: "Документы иностранного производителя",
        text: f("rpn-docs", "Для СГР на импортную продукцию нужен документ компетентного органа страны производства о безопасности и переводы; заявителем может быть импортёр."),
        href: a.type === "bad" ? "registraciya-bad.html" : "kosmetika.html",
      });
    } else if (a.type !== "other") {
      obl.push({
        title: "Заявитель — компания в России",
        text: f("decl-applicant", "Заявителем декларации может быть только ИП или юрлицо, зарегистрированные в России: импортёр или уполномоченное лицо."),
        href: "deklaracii.html",
      });
    }
  }

  // Каналы продаж
  const ch = new Set(a.channels);
  if (ch.has("marketplace")) {
    code += "+mp";
    obl.push(
      a.type === "bad"
        ? {
            title: "Карточка на маркетплейсе совпадает с СГР",
            text: f("wb", "WB требует номер СГР и торговое наименование; карточка с неверным номером уходит в черновики.") + " " + f("law-290", "С 1 октября 2026 года предлагать к продаже незарегистрированные БАД запрещено (290-ФЗ)."),
            href: "registraciya-bad.html",
          }
        : {
            title: "Карточка на маркетплейсе совпадает с документом",
            text: f("ozon", "Ozon проверяет копию документа, срок действия и наличие документа в едином реестре.") + " Наименование в карточке сверим с документом.",
            href: "markirovka.html",
          },
    );
  }
  if (ch.has("pharmacy")) {
    code += "+ph";
    obl.push({
      title: "Аптеки и дистрибьюторы",
      text: a.type === "bad" ? f("bad-sgr-required", "БАД продаются через аптеки и специализированные отделы торговой сети.") + " Соберём комплект документов для закупщика." : "Соберём комплект документов под требования закупщика.",
      href: a.type === "bad" ? "registraciya-bad.html" : "kak-my-rabotaem.html",
    });
  }
  if (ch.has("retail")) {
    code += "+rt";
    obl.push({
      title: "Требования торговых сетей",
      text: f("nets", "Сети запрашивают систему контроля рисков (ХАССП, производственный контроль) и протоколы аккредитованной лаборатории.") + " Требования конкретной сети сверим по её стандарту поставщика.",
      href: "proverki-rospotrebnadzora.html",
    });
  }
  if (ch.has("site")) {
    code += "+st";
    obl.push(
      a.type === "bad"
        ? {
            title: "Тексты сайта и реклама",
            text: f("ads-25", "Реклама БАД не должна создавать впечатление, что это лекарство, и сопровождается предупреждением «не является лекарственным средством» (ст. 25 закона «О рекламе»)."),
            href: "markirovka.html",
          }
        : {
            title: "Тексты сайта",
            text: "Проверим формулировки: без медицинских обещаний и в соответствии с документами.",
            href: "markirovka.html",
          },
    );
  }

  // Мост к Proba Lab — всегда
  obl.push({
    title: "Этикетка, упаковка и карточка по документам",
    text: "Сделаем в Proba Lab: совпадают с документами и объясняют покупателю, зачем выбирать ваш продукт.",
    href: "vyvod-na-rynok.html",
  });

  return { code, documents: docs, obligations: obl, category: TYPE_LABEL[a.type], stop };
}

/** Все тексты квиза для REGULATORY_VERIFY.md: перебор всех комбинаций. */
export function allQuizTexts(): string[] {
  const out = new Set<string>();
  const types: ProductType[] = ["bad", "cosm", "food", "sport", "other"];
  const groups: CosmGroup[] = ["yes", "no", "unsure"];
  const prods: Production[] = ["own", "contract", "import"];
  for (const type of types)
    for (const cosmGroup of type === "cosm" ? groups : [undefined])
      for (const production of prods) {
        const r = quizResult({ type, cosmGroup, production, channels: ["marketplace", "pharmacy", "retail", "site"] });
        for (const it of [...r.documents, ...r.obligations]) out.add(it.text);
      }
  return [...out];
}
