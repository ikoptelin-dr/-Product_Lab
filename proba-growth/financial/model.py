"""Unit-экономика лидогенератора PROBA LAB.

Все входные параметры — ГИПОТЕЗЫ (кроме цен регистрации, взятых как наблюдения
с сайтов конкурентов, см. research/competitor-landscape.md §6).
Запуск: python3 financial/model.py > financial/model-output.md
"""

MONTHS = 12

# ---------- Общие допущения ----------
COMMON = dict(
    # Входная регуляторная услуга (оказывает партнёр, договор клиента — с партнёром)
    sgr_check=110_000,          # [Наблюдение] медиана «от»-цен СГР БАД 90–135 тыс. ₽
    decl_check=15_000,          # [Наблюдение] декларация ТР ТС 009/021: 9–23 тыс. ₽
    sgr_share=0.6,              # [Гипотеза] доля СГР в регуляторных сделках (остальное — декларации)
    # Лестница PROBA (цены сайта v6)
    package_price=29_000,       # пакет «Предложение для одного продукта»
    package_margin=0.70,
    project_price=200_000,      # проект «подготовка к продвижению» от 150 000 ₽; среднее — гипотеза
    project_margin=0.50,        # подрядчики (дизайн, разработка) ~50%
    retainer_price=50_000,      # сопровождение от 40 000 ₽/мес; среднее — гипотеза
    retainer_margin=0.60,
    retainer_months=6,
    # Обработка заявок
    hour_cost=2_000,            # [Гипотеза] стоимость часа на обработку/консультацию
    hours_per_lead=1.0,
    hours_per_qualified=1.5,
    tax=0.06,                   # УСН «доходы» 6%
    # Часы основателя на поставку (для проверки ёмкости 10–15 ч/нед ≈ 55 ч/мес)
    h_package=8, h_project=30, h_retainer=8,
    # Задержки денег, мес.
    fee_delay=2,                # агентское вознаграждение — после оплаты клиента партнёру
    project_tail_delay=2,       # 50% аванс, 50% по сдаче
)

# Постоянные расходы системы, ₽/мес (одинаковы во всех сценариях, чтобы сравнивать исходы)
FIXED_LEAN = dict(content=20_000, links_pr=10_000, profi=15_000, avito=0,
                  crm_phone=5_000, misc=5_000)
FIXED_FULL = dict(content=40_000, seo_specialist=40_000, links_pr=20_000, profi=15_000,
                  avito=10_000, crm_phone=7_000, misc=5_000)
ONE_OFF = dict(reg_section_and_landings=100_000, legal_docs_consents=30_000,
               listings_cards_photos=15_000, crm_setup=15_000)

SCENARIOS = {
    "Conservative": dict(
        seo_leads_ss=4, profi_leads=3, avito_leads=2, partner_leads=0.5,
        lead_to_reg=0.15, partner_to_package=0.30,
        fee_share=0.10, xs_package=0.05, package_to_project=0.20, project_to_retainer=0.20),
    "Base": dict(
        seo_leads_ss=10, profi_leads=6, avito_leads=4, partner_leads=1.5,
        lead_to_reg=0.25, partner_to_package=0.40,
        fee_share=0.15, xs_package=0.12, package_to_project=0.30, project_to_retainer=0.30),
    "Optimistic": dict(
        seo_leads_ss=20, profi_leads=8, avito_leads=6, partner_leads=3,
        lead_to_reg=0.35, partner_to_package=0.50,
        fee_share=0.20, xs_package=0.20, package_to_project=0.40, project_to_retainer=0.40),
}
PARTNER_FEE = 0.10  # [Гипотеза] вознаграждение контрактнику за первый проект клиента


def ramp_seo(m, ss):
    """SEO: 0 в месяцы 1–3, линейный рост до steady state к 10-му месяцу."""
    if m <= 3:
        return 0.0
    return ss * min(1.0, (m - 3) / 7)


def avg_reg_check(c):
    return c["sgr_share"] * c["sgr_check"] + (1 - c["sgr_share"]) * c["decl_check"]


def unit(s, c=COMMON):
    """Ожидаемый вклад одного регуляторного клиента (без постоянных расходов)."""
    fee = s["fee_share"] * avg_reg_check(c)
    p_pkg = s["xs_package"]
    p_prj = p_pkg * s["package_to_project"]
    p_ret = p_prj * s["project_to_retainer"]
    rev = fee + p_pkg * c["package_price"] + p_prj * c["project_price"] \
        + p_ret * c["retainer_price"] * c["retainer_months"]
    margin = fee + p_pkg * c["package_price"] * c["package_margin"] \
        + p_prj * c["project_price"] * c["project_margin"] \
        + p_ret * c["retainer_price"] * c["retainer_months"] * c["retainer_margin"]
    return dict(fee=fee, revenue=rev, margin_before_tax=margin, margin=margin - rev * c["tax"])


def simulate(s, fixed, c=COMMON, xs_override=None, months=MONTHS, partner_channel=True):
    s = dict(s)
    if xs_override is not None:
        s["xs_package"] = xs_override
    fixed_total = sum(fixed.values())
    cash = -sum(ONE_OFF.values())
    rows, inflows = [], [0.0] * (months + 24)
    retainers_active = []  # month started
    for m in range(1, months + 1):
        seo = ramp_seo(m, s["seo_leads_ss"])
        profi = s["profi_leads"] if fixed.get("profi") else 0
        avito = s["avito_leads"] if (fixed.get("avito") and m >= 2) else 0
        partner = s["partner_leads"] if (partner_channel and m >= 3) else 0
        reg_leads = seo + profi + avito
        reg_clients = reg_leads * s["lead_to_reg"]
        packages = reg_clients * s["xs_package"] + partner * s["partner_to_package"]
        projects = packages * s["package_to_project"]
        new_ret = projects * s["project_to_retainer"]
        retainers_active.append(new_ret)
        active_ret = sum(retainers_active[-c["retainer_months"]:])
        # Деньги по месяцам с задержками
        fee = reg_clients * s["fee_share"] * avg_reg_check(c)
        inflows[m + c["fee_delay"]] += fee
        inflows[m] += packages * c["package_price"]
        proj_rev = projects * c["project_price"]
        inflows[m] += proj_rev / 2
        inflows[m + c["project_tail_delay"]] += proj_rev / 2
        inflows[m] += active_ret * c["retainer_price"]
        # Начисленная выручка и маржа (P&L, без задержек)
        rev = fee + packages * c["package_price"] + proj_rev + active_ret * c["retainer_price"]
        partner_payout = partner * s["partner_to_package"] * s["package_to_project"] \
            * c["project_price"] * PARTNER_FEE
        delivery_cost = packages * c["package_price"] * (1 - c["package_margin"]) \
            + proj_rev * (1 - c["project_margin"]) \
            + active_ret * c["retainer_price"] * (1 - c["retainer_margin"])
        leads = reg_leads + partner
        handling = (leads * c["hours_per_lead"]
                    + (reg_clients + packages) * c["hours_per_qualified"]) * c["hour_cost"]
        taxes = rev * c["tax"]
        profit = rev - delivery_cost - partner_payout - handling - taxes - fixed_total
        cash_in = inflows[m]
        cash += cash_in - delivery_cost - partner_payout - handling - cash_in * c["tax"] - fixed_total
        hours = leads * c["hours_per_lead"] + (reg_clients + packages) * c["hours_per_qualified"] \
            + packages * c["h_package"] + projects * c["h_project"] + active_ret * c["h_retainer"]
        rows.append(dict(m=m, leads=leads, reg_clients=reg_clients, packages=packages,
                         projects=projects, active_ret=active_ret, rev=rev, profit=profit,
                         cash=cash, hours=hours))
    return rows


def fmt(x):
    return f"{x:,.0f}".replace(",", " ")


def table(rows, keys, heads):
    out = ["| " + " | ".join(heads) + " |", "|" + "---|" * len(heads)]
    for r in rows:
        out.append("| " + " | ".join(r[k] if isinstance(r[k], str) else
                                     (f"{r[k]:.1f}" if k in ("leads", "reg_clients", "packages", "projects", "active_ret", "hours") else fmt(r[k]))
                                     for k in keys) + " |")
    return "\n".join(out)


def main():
    c = COMMON
    print("<!-- Сгенерировано financial/model.py. Не править вручную. -->\n")
    print(f"Средний чек регуляторной сделки (смесь СГР/деклараций): {fmt(avg_reg_check(c))} ₽ (gross партнёра, не выручка PROBA)\n")
    print(f"Разовые расходы запуска: {fmt(sum(ONE_OFF.values()))} ₽ — " + ", ".join(f"{k} {fmt(v)}" for k, v in ONE_OFF.items()) + "\n")
    print(f"Постоянные расходы: Lean {fmt(sum(FIXED_LEAN.values()))} ₽/мес, Full {fmt(sum(FIXED_FULL.values()))} ₽/мес\n")

    print("## A. Вклад одного регуляторного клиента (ожидаемое значение)\n")
    print("| Сценарий | Агентское вознаграждение | Выручка PROBA с клиента, вкл. cross-sell | Маржа после налога | Только регистрация, маржа после налога |")
    print("|---|---|---|---|---|")
    for n, s in SCENARIOS.items():
        u = unit(s)
        u0 = unit(dict(s, xs_package=0))
        print(f"| {n} | {fmt(u['fee'])} | {fmt(u['revenue'])} | {fmt(u['margin'])} | {fmt(u0['margin'])} |")

    for fixed_name, fixed in (("Lean", FIXED_LEAN), ("Full", FIXED_FULL)):
        print(f"\n## B. 12 месяцев, конфигурация {fixed_name} ({fmt(sum(fixed.values()))} ₽/мес)\n")
        print("| Сценарий | Лидов/мес (м12) | Рег. клиентов/мес (м12) | Пакетов/мес (м12) | Прибыль м12, ₽ | Кумулятивный кэш м12, ₽ | Мес. операционной безубыточности | Часы/мес м12 |")
        print("|---|---|---|---|---|---|---|---|")
        for n, s in SCENARIOS.items():
            rows = simulate(s, fixed)
            be = next((r["m"] for r in rows if r["profit"] >= 0), "не достигнута")
            r = rows[-1]
            print(f"| {n} | {r['leads']:.1f} | {r['reg_clients']:.1f} | {r['packages']:.1f} | {fmt(r['profit'])} | {fmt(r['cash'])} | {be} | {r['hours']:.0f} |")

    print("\n## C. Помесячно: Base, Lean\n")
    rows = simulate(SCENARIOS["Base"], FIXED_LEAN)
    print(table(rows, ["m", "leads", "reg_clients", "packages", "projects", "active_ret", "rev", "profit", "cash", "hours"],
                ["Мес", "Лиды", "Рег. клиенты", "Пакеты", "Проекты", "Активн. сопровожд.", "Выручка PROBA", "Прибыль", "Кум. кэш", "Часы"]))

    print("\n## D. Чувствительность к cross-sell (Base, Lean, месяц 12)\n")
    print("| Доля рег. клиентов, купивших пакет 29 000 ₽ | Прибыль м12, ₽ | Кум. кэш м12, ₽ |")
    print("|---|---|---|")
    for xs in (0, 0.03, 0.05, 0.08, 0.12, 0.20, 0.30):
        r = simulate(SCENARIOS["Base"], FIXED_LEAN, xs_override=xs)[-1]
        print(f"| {xs:.0%} | {fmt(r['profit'])} | {fmt(r['cash'])} |")

    print("\n## E. Четыре режима (Base, Lean, месяц 12)\n")
    b = SCENARIOS["Base"]
    modes = {
        "1. Регистрация без последующих продаж": dict(rows=simulate(b, FIXED_LEAN, xs_override=0, partner_channel=False)),
        "2. Регистрация + продажа маркетинга": dict(rows=simulate(b, FIXED_LEAN, partner_channel=False)),
        "3. Только партнёрский канал контрактников (без SEO/площадок)": dict(
            rows=simulate(dict(b, seo_leads_ss=0, profi_leads=0, avito_leads=0),
                          dict(crm_phone=5_000, misc=5_000))),
        "4. Система после накопления органики (м24: SEO ×2, платные площадки ×0,5)": dict(
            rows=simulate(dict(b, seo_leads_ss=b["seo_leads_ss"] * 2, profi_leads=b["profi_leads"] * 0.5),
                          dict(FIXED_LEAN, profi=7_500), months=24)),
    }
    print("| Режим | Выручка PROBA/мес | Прибыль/мес | Кум. кэш на конец периода |")
    print("|---|---|---|---|")
    for n, d in modes.items():
        r = d["rows"][-1]
        print(f"| {n} | {fmt(r['rev'])} | {fmt(r['profit'])} | {fmt(r['cash'])} |")

    print("\n## F. Безубыточность по числу регуляторных клиентов в месяц (Lean)\n")
    print("| Сценарий | Маржа на клиента после налога, ₽ | Обработка лидов на 1 клиента, ₽ | Клиентов/мес для покрытия постоянных расходов |")
    print("|---|---|---|---|")
    for n, s in SCENARIOS.items():
        u = unit(s)
        handle = (1 / s["lead_to_reg"] * c["hours_per_lead"] + c["hours_per_qualified"]) * c["hour_cost"]
        net = u["margin"] - handle
        need = sum(FIXED_LEAN.values()) / net if net > 0 else float("inf")
        print(f"| {n} | {fmt(u['margin'])} | {fmt(handle)} | {need:.1f} |")

    print("\n## G. Матрица: доля PROBA в регуляторной сделке × cross-sell (Base, Lean, прибыль месяца 12, ₽)\n")
    xs_list = (0, 0.05, 0.12, 0.20)
    print("| Доля PROBA \\ cross-sell в пакет | " + " | ".join(f"{x:.0%}" for x in xs_list) + " |")
    print("|---|" + "---|" * len(xs_list))
    for fs in (0.10, 0.15, 0.25, 0.35):
        vals = [simulate(dict(SCENARIOS["Base"], fee_share=fs), FIXED_LEAN, xs_override=x)[-1]["profit"] for x in xs_list]
        print(f"| {fs:.0%} | " + " | ".join(fmt(v) for v in vals) + " |")


if __name__ == "__main__":
    main()
