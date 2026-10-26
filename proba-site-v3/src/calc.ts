// Калькулятор экономики SKU (kalkulyator-sku.html): чистые функции без DOM.
// Используется в assets/site.js и в scripts/verify.mjs (проверка формул). Значения никуда не отправляются и не сохраняются.

export interface SkuInput {
  /** Цена продажи после всех скидок, ₽. */
  price: number;
  /** Себестоимость единицы, ₽. */
  cost: number;
  /** Комиссия площадки, % от цены. */
  commission: number;
  /** Логистика и хранение на единицу, ₽. */
  logistics: number;
  /** Доля возвратов, %. */
  returns: number;
  /** Обратная логистика за один возврат, ₽. */
  returnCost: number;
  /** Реклама на единицу, ₽. */
  ads: number;
  /** Налог, % от выручки. */
  tax: number;
  /** Упаковка и маркировка, ₽. */
  packaging: number;
}

export const SKU_FIELDS: { key: keyof SkuInput; label: string; unit: "₽" | "%"; required?: boolean }[] = [
  { key: "price", label: "Цена продажи после скидок", unit: "₽", required: true },
  { key: "cost", label: "Себестоимость единицы", unit: "₽", required: true },
  { key: "commission", label: "Комиссия площадки", unit: "%" },
  { key: "logistics", label: "Логистика и хранение на единицу", unit: "₽" },
  { key: "returns", label: "Доля возвратов", unit: "%" },
  { key: "returnCost", label: "Стоимость обратной логистики", unit: "₽" },
  { key: "ads", label: "Реклама на единицу", unit: "₽" },
  { key: "tax", label: "Налог", unit: "%" },
  { key: "packaging", label: "Упаковка и маркировка", unit: "₽" },
];

/** Статьи расходов в результате. */
export const COST_LABELS = {
  cost: "Себестоимость",
  commission: "Комиссия площадки",
  logistics: "Логистика и хранение",
  returns: "Возвраты",
  ads: "Реклама",
  tax: "Налог",
  packaging: "Упаковка и маркировка",
} as const;
export type CostKey = keyof typeof COST_LABELS;

/**
 * Разбор числа из поля: «1 250,5» → 1250.5; пусто → null; не число → NaN.
 * Принимает запятую и точку как десятичный разделитель, пробелы между разрядами.
 */
export function parseNum(raw: string): number | null {
  const v = raw.replace(/[\s  ]/g, "").replace(",", ".");
  if (!v) return null;
  if (!/^\d+(\.\d+)?$/.test(v) && !/^\.\d+$/.test(v)) return NaN;
  return Number(v);
}

export interface SkuResult {
  costs: Record<CostKey, number>;
  totalCosts: number;
  profit: number;
  /** Маржа, % от цены продажи. */
  margin: number;
  /** Цена, при которой прибыль на единицу = 0; null — недостижима (комиссия + налог ≥ 100 %). */
  breakEven: number | null;
  biggest: CostKey;
}

/**
 * Прибыль на единицу = цена − себестоимость − цена × комиссия − логистика − доля возвратов × обратная логистика
 *                      − реклама − цена × налог − упаковка.
 * Цена безубыточности = (себестоимость + логистика + доля возвратов × обратная логистика + реклама + упаковка) / (1 − комиссия − налог).
 */
export function calcSku(i: SkuInput): SkuResult {
  const costs: Record<CostKey, number> = {
    cost: i.cost,
    commission: (i.price * i.commission) / 100,
    logistics: i.logistics,
    returns: (i.returns / 100) * i.returnCost,
    ads: i.ads,
    tax: (i.price * i.tax) / 100,
    packaging: i.packaging,
  };
  const totalCosts = Object.values(costs).reduce((a, b) => a + b, 0);
  const profit = i.price - totalCosts;
  const margin = i.price > 0 ? (profit / i.price) * 100 : 0;
  const fixed = costs.cost + costs.logistics + costs.returns + costs.ads + costs.packaging;
  const share = 1 - (i.commission + i.tax) / 100;
  const breakEven = share > 0 ? fixed / share : null;
  let biggest: CostKey = "cost";
  for (const k of Object.keys(costs) as CostKey[]) if (costs[k] > costs[biggest]) biggest = k;
  return { costs, totalCosts, profit, margin, breakEven, biggest };
}

/** 1234.5 → «1 234,5» (до 2 знаков, без лишних нулей). */
export function fmt(n: number, digits = 2): string {
  const sign = n < 0 ? "−" : "";
  const abs = Math.abs(n);
  const raw = abs.toFixed(digits);
  const fixed = raw.includes(".") ? raw.replace(/\.?0+$/, "") : raw;
  const [int, frac] = fixed.split(".");
  return sign + int!.replace(/\B(?=(\d{3})+(?!\d))/g, " ") + (frac ? `,${frac}` : "");
}
