# Proba Lab — лендинг v2

Продукт и структура: `../proba-lab/PRODUCT_SPEC_V2.md` (агент 1). Визуальный язык: `../proba-lab/UXUI_REFERENCE_PROMPT.md` (агент 2, реверс-инжиниринг референса). Сборка: этот каталог (агент 3).

- `src/body.html` — разметка и тексты
- `src/styles.css` — стили на токенах Warm Haze (Inter, кремовый фон, акцент #CC3D10, светлая и тёмная темы)
- `src/app.ts` — меню, вкладки примера отчёта, проверка формулировок (`../proba-site/lib/litmus.ts`), демо-форма
- `scripts/make_art.py` — генерирует оригинальную SVG-иллюстрацию hero и тёмную версию эмблемы
- `scripts/build.mjs` — собирает самодостаточный `dist/proba-lab.html`

```bash
python3 scripts/make_art.py && node scripts/build.mjs
```

Опубликовано: https://claude.ai/artifact/HbLNNwLd8p6feuzjMiikMc (форма — демо, без отправки). Для рабочего сайта форму нужно подключить к API из `../proba-site`.
