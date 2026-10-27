# Демо-кейсы Proba Lab: пакет визуала

**Дата:** 2026-10-27.
**Для кого:** дизайнер 3D и моушна, верстальщик раздела «Кейсы».
**Тексты кейсов:** `../pages/kejsy/*.md`. Индекс и правила использования — `README.md` в этой папке.

Все бренды вымышленные. Перед публикацией владелец проверяет названия по открытым базам товарных знаков, чтобы случайно не совпасть с реальным брендом (см. вопросы в отчёте).

---

## 0. Общие правила для всех кейсов

### 0.1. Стиль сайта

| Токен | Значение |
|---|---|
| Акцент | изумрудный `#34D399` (свечение, контур, одна деталь в кадре — не заливка всего фона) |
| Тёмная тема | фон `#0B0F0E` → `#111816` (мягкий радиальный градиент), стекло: белый 6–10 % + размытие 24–40 px, контур 1 px белый 12 % |
| Светлая тема | фон `#F4F7F6` → `#E8EEEC`, стекло: белый 55–70 % + размытие 24 px, контур 1 px `#0B0F0E` 8 % |
| Шрифт | Inter: заголовки 600, текст 400; кириллица в ролике — только Inter, не из генератора |
| Композиция | минимализм, один герой в кадре, много воздуха, мягкая тень на поверхности |
| Свет | мягкий студийный: большой софтбокс ключом, контровой с лёгким изумрудным оттенком |

Каждую сцену делаем в двух вариантах — тёмном и светлом: сайт переключает тему.

### 0.2. Что никогда не попадает в кадр

- люди, лица, руки, силуэты людей;
- медицинские символы: кресты, змеи, пульс, таблетки-блистеры, шприцы, халаты, стетоскопы, пробирки «как в аптеке»;
- реальные бренды, логотипы площадок, интерфейсы Ozon и Wildberries, реальные товарные знаки;
- любой текст, кроме названия вымышленного бренда (и предупреждения в роликах БАД — см. 0.4);
- обещания на упаковке: «лечит», «от …», проценты, «№ 1», медали и печати «рекомендовано».

**Общий негативный промпт** (добавлять к каждому промпту, где генератор его принимает):

```
people, person, face, hands, fingers, silhouette of a person, medical cross, caduceus, pill blister, syringe, stethoscope, lab coat, hospital, pharmacy, real brand logo, marketplace logo, app interface, watermark, random text, gibberish letters, cyrillic text, numbers, percentages, badges, award seals, cluttered background, oversaturated colors, cartoon style
```

### 0.3. Текст на изображениях

Генераторы плохо пишут кириллицу. Поэтому:
1. Этикетку генерируем пустой или с латинской транслитерацией названия.
2. Финальные изображения для сайта собираем в Blender с текстурой настоящего макета этикетки — генерация нужна для мудборда и обложки.
3. Подписи и заголовки поверх кадра — только вёрсткой или в моушне шрифтом Inter.

### 0.4. Ролики про БАД (кейс 1)

Предупреждение «Не является лекарственным средством» стоит в кадре весь ролик: плашка внизу, Inter 600, контраст не ниже 4,5:1. Фактбаза (ключ `ads-25`) говорит о длительности не менее 5 секунд и площади не менее 7 % кадра для видеорекламы. Считается ли ролик в карточке видеорекламой — вопрос партнёру; до ответа делаем плашку на весь ролик и площадью с запасом.

### 0.5. Форматы и вес файлов

| Где на сайте | Размер, px | Соотношение | Формат | Вес, не больше |
|---|---|---|---|---|
| Обложка кейса (первый экран страницы кейса), десктоп | 2400 × 1350 (отдаём также 1600 × 900) | 16:9 | AVIF + WebP | 220 КБ AVIF / 320 КБ WebP |
| Обложка кейса, мобильная | 1080 × 1350 | 4:5 | AVIF + WebP | 160 КБ / 240 КБ |
| Карточка в хабе «Кейсы» | 1200 × 900 (отдаём также 600 × 450) | 4:3 | AVIF + WebP | 90 КБ / 140 КБ |
| Иллюстрации внутри кейса | 1600 × 1000 | 16:10 | AVIF + WebP | 160 КБ / 240 КБ |
| Превью для соцсетей и мессенджеров (OG) | 1200 × 630 | 1,91:1 | JPEG (WebP мессенджеры читают не все) | 200 КБ |
| Ролик в кейсе, вертикальный | 1080 × 1920 | 9:16 | MP4 (H.264, CRF 23–26) + WebM (VP9) | 3 МБ |
| Ролик в кейсе, квадратный | 1080 × 1080 | 1:1 | MP4 + WebM | 2,5 МБ |
| Постер ролика | как кадр ролика | 9:16 / 1:1 | AVIF + WebP | 80 КБ |

Ролики на сайте: без звука, `autoplay muted loop playsinline`, постер — первый кадр; звук — только в версии для площадки. Требования площадок к роликам сверяем в кабинете на дату загрузки, здесь их не фиксируем.

Имена файлов: `kejs-<slug>-<назначение>-<тема>-<ширина>.avif`, например `kejs-magnij-cover-dark-2400.avif`.

---

## 1. Магний «Некрупно»: продажи до регистрации

Страница: `kejsy/magnij-do-registracii/`.
**Продукт:** банка 250 мл из матового белого полипропилена (PP), крышка с изумрудным ободком; маленькие желатиновые капсулы цвета слоновой кости. Этикетка: название «НЕКРУПНО» крупно, ниже «Магний · маленькие капсулы».

### 1.1. Промпты для изображений

**1. Обложка, тёмная тема** — 16:9, Midjourney / Flux, 2400 × 1350 (Flux: 1536 × 864, затем апскейл)
```
Minimalist product hero shot of a small matte white supplement jar with an emerald green (#34D399) rim on the lid, plain label with the brand name "NEKRUPNO" in clean sans-serif, standing on a dark glossy surface, three tiny ivory softgel capsules beside it, deep charcoal background #0B0F0E with a soft radial glow, frosted glass panel floating behind the jar, soft studio key light from the left, subtle emerald rim light, shallow depth of field, photorealistic 3D render, generous negative space on the right for headline --ar 16:9 --style raw
```

**2. Обложка, светлая тема** — 16:9
```
Minimalist product shot of a small matte white supplement jar with emerald green (#34D399) lid rim, brand name "NEKRUPNO" on a plain label, on a light frosted glass shelf, pale mint-grey background #F4F7F6, soft diffused daylight from top left, gentle contact shadow, three tiny ivory softgel capsules in a neat row, clean glassmorphism style, photorealistic, lots of empty space on the left --ar 16:9 --style raw
```

**3. Размер капсулы (иллюстрация внутри кейса)** — 16:10, Ideogram или Flux, 1600 × 1000
```
Macro shot of a single tiny ivory softgel capsule lying next to a thin millimeter ruler engraved on frosted glass, emerald green accent line, dark background, soft top light, crisp focus on the capsule, product photography, no text except ruler tick marks without numbers --ar 16:10
```

**4. Две линии работ (карточка в хабе)** — 4:3, 1200 × 900
```
Abstract minimal composition: two parallel frosted glass panels floating in dark space, the left panel holds a stack of blank documents with an emerald paper clip, the right panel holds a small white supplement jar, a thin glowing emerald line connects both panels, glassmorphism, soft volumetric light, calm and precise, no text --ar 4:3 --style raw
```

**5. Мобильная обложка** — 4:5, 1080 × 1350
```
Vertical minimalist product shot, small matte white supplement jar with emerald lid rim, opened lid lying beside it, a few tiny ivory softgels spilling softly onto dark glass surface, background #0B0F0E with faint emerald haze at the top, frosted glass card shape behind, studio lighting, photorealistic --ar 4:5 --style raw
```

### 1.2. Бриф 3D-сцены (Blender)

| Параметр | Решение |
|---|---|
| Тара | банка PP, высота 95 мм, диаметр 62 мм, крышка 38 мм с изумрудным ободком 3 мм; моделировать по чертежу от поставщика тары, если есть |
| Капсула | мягкая желатиновая, овальная, небольшая; размер — по спецификации производителя, в сцене строго 1:1 к банке |
| Материалы | банка: Principled BSDF, белый `#F2F2EE`, Roughness 0,55, лёгкий Coat 0,1; крышка: тот же пластик, ободок — `#34D399`, Roughness 0,35; этикетка: текстура из печатного PDF макета (300 dpi → 4K PNG), бумага с Roughness 0,7; капсула: Transmission 0,6, IOR 1,45, цвет слоновой кости, Subsurface 0,1 |
| Поверхность | тёмная: стекло `#0B0F0E`, Roughness 0,15; светлая: матовое молочное стекло |
| Свет | Area 1,5 × 1 м ключ слева сверху 45°; заполняющий справа −2 EV; контровой сзади с цветом `#34D399` 30 %; HDRI студийный, нейтральный, сила 0,3 |
| Камера | 85 мм для героя, 100 мм macro для капсулы; f/4 для героя, f/2,8 для макро; высота камеры — на уровне середины этикетки |
| Ракурсы | 1) фронт; 2) три четверти слева 30°; 3) открытая крышка рядом, вид сверху 35°; 4) капсулы у шкалы, макро; 5) банка + капсулы, композиция под заголовок слева |
| Рендер | Cycles, 512–1024 сэмплов, денойзер OpenImageDenoise, Filmic / AgX (Medium High Contrast), 16-bit PNG, затем AVIF/WebP; для ролика — 24 к/с, 1080 × 1920 и 1080 × 1080, 256 сэмплов + денойз |
| Отдать | .blend с упакованными текстурами, PNG 16-bit каждого ракурса в тёмной и светлой версиях, прозрачный фон (PNG с альфа) для фронта и трёх четвертей |

### 1.3. Сценарий ролика, 12 секунд

| Секунда | Кадр | Движение | Текст на экране (Inter) | Звук |
|---|---|---|---|---|
| 0–1 | Банка фронтом в темноте | Свет «включается» слева, банка проявляется | — | мягкий щелчок, тихий эмбиент |
| 1–3 | Банка, три четверти | Камера облетает на 40°, изумрудный контур бежит по ободку | «НЕКРУПНО» | лёгкий «свуш» |
| 3–5 | Крышка | Крышка откручивается и уходит вверх | — | щелчок крышки |
| 5–7 | Капсула | Одна капсула выкатывается и встаёт у миллиметровой шкалы | «Маленькие капсулы» | короткий «тик» |
| 7–9 | Капсула крупно | Медленный наезд, шкала подсвечивается | «Маленький размер» (без «легко проглотить» и других обещаний ощущений) | эмбиент |
| 9–11 | Банка + стеклянная панель с составом | Панель выезжает справа | «Магний · состав на обороте» | мягкий аккорд |
| 11–12 | Финальный кадр, банка фронтом | Статично | «НЕКРУПНО» | затухание |
| 0–12 | Плашка внизу весь ролик | Статична | «Не является лекарственным средством» | — |

**9:16:** банка в центре по вертикали, заголовки — в верхней трети, плашка-предупреждение — внизу над безопасной зоной интерфейса (отступ 12 % высоты).
**1:1:** банка смещена влево на треть, заголовки справа, плашка внизу на всю ширину.

### 1.4. Где использовать и alt-тексты

| Место | Файл | Alt |
|---|---|---|
| Обложка кейса, десктоп | промпт 1 / рендер ракурса 5, тёмная и светлая | «Банка магния вымышленного бренда „Некрупно“ с маленькими капсулами — 3D-визуализация демо-проекта» |
| Обложка кейса, мобильная | промпт 5 / рендер ракурса 3 | «Открытая банка магния „Некрупно“, рядом маленькие капсулы — демо-проект» |
| Карточка в хабе | промпт 4 | «Две параллельные линии работ: документы и продажи — иллюстрация демо-кейса» |
| Иллюстрация в шаге 5 | промпт 3 / рендер ракурса 4 | «Капсула рядом с миллиметровой шкалой: размер виден без слов» |
| Ролик в шаге 6 | 9:16 и 1:1 | «Видео для карточки: банка открывается, капсула встаёт у шкалы размера» |

---

## 2. Крем для рук «Отбой»: позиционирование по JTBD

Страница: `kejsy/krem-dlya-ruk-jtbd/`.
**Продукт:** мягкая туба 50 мл, матовая графитовая, колпачок-флиптоп изумрудный, петля под карабин. Надпись «ОТБОЙ» и «крем для рук».

### 2.1. Промпты для изображений

**1. Обложка, тёмная тема** — 16:9, 2400 × 1350
```
Minimalist product shot of a small matte graphite hand cream tube with an emerald green (#34D399) flip-top cap and a tiny metal carabiner loop, brand name "OTBOY" in clean sans-serif, lying on a dark frosted glass shelf, softly lit locker-room metal door texture blurred in the background, deep charcoal tones #0B0F0E, soft key light, subtle emerald rim light, photorealistic 3D render, empty space on the right --ar 16:9 --style raw
```

**2. Обложка, светлая тема** — 16:9
```
Small matte graphite hand cream tube with emerald flip-top cap standing upright on a light frosted glass surface, pale background #F4F7F6, soft daylight, a single soft curl of white cream texture beside it, glassmorphism panel behind, minimal, calm, photorealistic, no text except "OTBOY" --ar 16:9 --style raw
```

**3. Текстура крема (иллюстрация к слайду 3)** — 16:10, 1600 × 1000
```
Macro shot of a smooth swirl of light white cream on dark glass, soft specular highlights, emerald reflection on the edge, clean minimal product photography, shallow depth of field, no objects, no text --ar 16:10
```

**4. Карта пути клиента (карточка в хабе)** — 4:3, 1200 × 900
```
Abstract minimal infographic scene without text: six small frosted glass tiles arranged along a gently curving emerald line on a dark background, the last tile holds a tiny graphite tube with emerald cap, soft volumetric light, glassmorphism, calm and precise, no letters, no numbers --ar 4:3 --style raw
```

**5. Тюба на рюкзаке (мобильная обложка)** — 4:5, 1080 × 1350
```
Vertical close-up of a small graphite hand cream tube with emerald cap clipped by a carabiner to the strap of a dark technical backpack, no person visible, moody soft light, dark background with emerald haze, photorealistic --ar 4:5 --style raw
```

### 2.2. Бриф 3D-сцены (Blender)

| Параметр | Решение |
|---|---|
| Тара | ламинатная туба 50 мл: длина около 110 мм, диаметр 30 мм, плоский запаянный край с петлёй; колпачок флиптоп Ø 30 мм; размеры — по спецификации поставщика тубы |
| Материалы | туба: графит `#2A2F2D`, Roughness 0,6, лёгкая анизотропия на шве; колпачок: `#34D399`, Roughness 0,3, Coat 0,2; печать — текстура макета, белая краска с Roughness 0,4; крем: Subsurface 0,4, Roughness 0,2, белый с тёплым оттенком; карабин: металл, Roughness 0,25 |
| Окружение | вариант А — стеклянная полка; вариант Б — размытая дверца металлического шкафчика (тёмная тема), только как фон, без надписей и номеров |
| Свет | ключевой Area 1 × 1 м сверху-слева; заполняющий −2,5 EV; контровой изумрудный 25 %; для макро крема — узкий стрип-лайт для блика |
| Камера | 70 мм для героя, 100 мм для текстуры; f/5,6 для героя, f/2,8 для макро |
| Ракурсы | 1) туба лёжа, три четверти; 2) туба стоя на колпачке; 3) туба + завиток крема; 4) туба на ремне рюкзака (без человека); 5) набор из двух туб: «на работу и домой» |
| Деформация | лёгкая вмятина на тубе (Simple Deform + Shape Key) — туба «живая», не новая на складе |
| Рендер | Cycles, 512–1024 сэмплов, AgX, 16-bit PNG; ролик — 24 к/с, 256 сэмплов + денойз |
| Отдать | .blend, PNG тёмная и светлая версии, прозрачный фон для ракурсов 1 и 2 |

### 2.3. Сценарий ролика, 12 секунд

Ролик — иллюстрация к слайдам карточки, без обещаний эффекта.

| Секунда | Кадр | Движение | Текст на экране | Звук |
|---|---|---|---|---|
| 0–2 | Тёмный кадр, размытая дверца шкафчика | Медленный наезд, свет как в конце дня | «Смена закончилась» | приглушённый гул, щелчок замка |
| 2–4 | Туба на полке | Туба поворачивается к камере, колпачок ловит изумрудный блик | «ОТБОЙ» | мягкий «свуш» |
| 4–6 | Колпачок | Флиптоп открывается | — | щелчок |
| 6–8 | Завиток крема на стекле | Камера облетает макро | «Для рук после смены» | тихий эмбиент |
| 8–10 | Туба на петле рюкзака | Лёгкое покачивание | «Карманный тюбик» | позвякивание карабина |
| 10–12 | Две тубы рядом | Статично, свет мягко гаснет по краям | «ОТБОЙ · крем для рук» | затухание |

**9:16:** туба по центру, текст в верхней трети, кадр 8–10 — вертикальный, ремень по диагонали.
**1:1:** туба слева, текст справа; кадр 8–10 кадрируем крупнее, чтобы рюкзак не читался как предмет из другого ролика.

### 2.4. Где использовать и alt-тексты

| Место | Файл | Alt |
|---|---|---|
| Обложка кейса, десктоп | промпт 1 / ракурс 1 | «Туба крема для рук вымышленного бренда „Отбой“ на полке шкафчика — демо-проект» |
| Обложка кейса, мобильная | промпт 5 / ракурс 4 | «Туба крема „Отбой“ на карабине рюкзака — иллюстрация ситуации покупателя» |
| Карточка в хабе | промпт 4 | «Шесть этапов пути покупателя на одной линии — иллюстрация карты пути клиента» |
| Иллюстрация к шагу 4 (CJM) | вёрстка таблицы + промпт 4 как фон | «Карта пути клиента: от конца смены до повторной покупки» |
| Иллюстрация к шагу 6 | макеты 3 слайдов (вёрстка поверх рендеров 1, 3, 5) | «Первые три слайда карточки: ситуация, ритуал, состав простыми словами» |
| Ролик | 9:16 и 1:1 | «Видео: туба крема „Отбой“ — от шкафчика до рюкзака» |

---

## 3. Аудит ассортимента 120 SKU

Страница: `kejsy/audit-assortimenta-120-sku/`.
**Герой:** не упаковка, а таблица и «полка» из условных безымянных упаковок разных форм. Никаких логотипов, никаких интерфейсов площадок.

### 3.1. Промпты для изображений

**1. Обложка, тёмная тема** — 16:9, 2400 × 1350
```
Isometric minimal 3D scene: a long dark glass shelf with many small blank product packages of different shapes (jars, tubes, boxes) in muted grey tones, a few of them highlighted with a soft emerald (#34D399) glow, a large frosted glass panel in front showing an abstract table grid without any text, dark background #0B0F0E, soft studio lighting, glassmorphism, clean and orderly, no logos, no letters --ar 16:9 --style raw
```

**2. Обложка, светлая тема** — 16:9
```
Isometric minimal 3D scene on a pale background #F4F7F6: rows of small blank product packages (jars, tubes, boxes) on light frosted glass shelves, a semi-transparent glass scanner line in emerald (#34D399) passing across the rows, some packages outlined in emerald, soft daylight, calm, precise, no text, no logos --ar 16:9 --style raw
```

**3. Три списка плана (иллюстрация к шагу 5)** — 16:10, 1600 × 1000
```
Three floating frosted glass trays side by side on a dark background: the left tray holds packages with small circular arrow icons, the middle tray holds packages being gently lifted away, the right tray holds packages with a small pencil icon, emerald accent glow on edges, minimal 3D icons, no text, soft volumetric light --ar 16:10 --style raw
```

**4. Карточка в хабе** — 4:3, 1200 × 900
```
Top-down minimal composition: a grid of 120 tiny blank package tiles on dark glass, most in neutral grey, a handful glowing emerald, one tile lifted above the grid casting a soft shadow, glassmorphism, abstract and orderly, no text --ar 4:3 --style raw
```

**5. Мониторинг (иллюстрация к шагу 6)** — 4:5, 1080 × 1350
```
Vertical minimal scene: a frosted glass calendar-like grid without numbers, a soft emerald pulse line running through it like a radar sweep, a few small blank packages floating beside, dark background, calm, no text, no numbers --ar 4:5 --style raw
```

### 3.2. Бриф 3D-сцены (Blender)

| Параметр | Решение |
|---|---|
| Объекты | библиотека из 6 условных упаковок: банка, флакон, туба, коробка, саше, дой-пак; без надписей, нейтральные серые `#9AA3A0`–`#C9D0CD` |
| Сцена | изометрическая полка из тёмного стекла; 120 позиций расставить через Geometry Nodes (Instance on Points + Random Value для выбора формы и лёгкого сдвига) |
| Подсветка «риска» | у выбранных объектов Emission `#34D399` 2–4, остальные без свечения; для варианта «план» — три стеклянных лотка |
| Таблица | стеклянная панель с сеткой линий (без текста); реальная таблица ставится вёрсткой поверх |
| Свет | HDRI студийный 0,4 + Area сверху; контровой изумрудный 20 % |
| Камера | ортографическая для изометрии (Orthographic Scale по кадру), 35 мм для перспективного варианта; ракурсы: изометрия 30°, вид сверху, наезд на «поднятую» упаковку |
| Рендер | Eevee Next допустим для изометрии (быстрее и чище), Cycles — для обложки; AgX, 16-bit PNG |
| Отдать | .blend с Geometry Nodes, PNG тёмная и светлая версии |

### 3.3. Сценарий ролика, 12 секунд

Ролик для презентации и обложки кейса, не для карточки площадки.

| Секунда | Кадр | Движение | Текст на экране | Звук |
|---|---|---|---|---|
| 0–2 | Полка из 120 серых упаковок | Камера медленно едет вдоль полки | «120 SKU» | тихий эмбиент |
| 2–4 | Изумрудная линия-сканер | Проходит по рядам | «Документ · статус · наименование · маркировка» | мягкий «скан» |
| 4–6 | Часть упаковок светится | Подсвеченные чуть приподнимаются | «Где риск» | короткие «тики» |
| 6–9 | Три стеклянных лотка | Упаковки разлетаются по лоткам | «Переоформить · Снять · Исправить карточку» | три мягких щелчка |
| 9–11 | Стеклянная панель-таблица | Сетка заполняется изумрудными точками | «План с ответственными» | эмбиент |
| 11–12 | Пульс-линия поверх полки | Пульс проходит раз | «Мониторинг каждый месяц» | затухание |

**9:16:** полка вертикально (камера сверху вниз), подписи вверху.
**1:1:** изометрия, подписи в нижней трети на стеклянной плашке.

### 3.4. Где использовать и alt-тексты

| Место | Файл | Alt |
|---|---|---|
| Обложка кейса | промпт 1 / изометрия | «Полка из 120 условных упаковок, часть подсвечена как позиции с риском — демо-кейс аудита» |
| Карточка в хабе | промпт 4 | «Сетка из 120 позиций ассортимента, несколько выделены — иллюстрация аудита» |
| Шаг 5 | промпт 3 | «Три списка плана: переоформить, снять, исправить карточку» |
| Шаг 6 | промпт 5 | «Ежемесячный мониторинг документов и правил — иллюстрация» |
| Ролик | 1:1 и 9:16 | «Видео: проверка ассортимента и распределение позиций по плану» |

---

## 4. Батончик «Пропуск»: юнит-экономика и выход на маркетплейс

Страница: `kejsy/batonchik-yunit-ekonomika/`.
**Продукт:** батончик во флоупаке 40–50 г, матовая плёнка цвета мокрого асфальта с изумрудной полосой; коробка-набор на 12 штук с окном-прорезью. Надпись «ПРОПУСК».

### 4.1. Промпты для изображений

**1. Обложка, тёмная тема** — 16:9, 2400 × 1350
```
Minimalist product shot of a protein bar in a matte dark grey flow-wrap package with a single emerald green (#34D399) stripe, brand name "PROPUSK" in clean sans-serif, lying diagonally on dark glass, one bar unwrapped and cut in half showing a dense layered cross-section with nuts, background #0B0F0E with soft radial glow, soft key light, emerald rim light, photorealistic 3D render, empty space on the left --ar 16:9 --style raw
```

**2. Обложка, светлая тема** — 16:9
```
Protein bar in matte dark grey wrapper with emerald stripe on a pale frosted glass surface, background #F4F7F6, soft daylight, beside it a minimal closed cardboard multipack box in matching colors, clean glassmorphism, calm, photorealistic, no text except "PROPUSK" --ar 16:9 --style raw
```

**3. Где теряется маржа (иллюстрация к шагу 4)** — 16:10, 1600 × 1000
```
Abstract minimal 3D scene: a single protein bar standing on a frosted glass pedestal, thin translucent glass slices peel off from it one by one and drift away, each slice slightly tinted, the last remaining core glows emerald, dark background, soft volumetric light, metaphor of costs taken from price, no text, no numbers, no currency symbols --ar 16:10 --style raw
```

**4. Поштучно и набором (карточка в хабе)** — 4:3, 1200 × 900
```
Side-by-side minimal composition: on the left a single protein bar in dark grey wrapper with emerald stripe, on the right an open multipack box with twelve identical bars neatly arranged, both on dark frosted glass, soft studio light, glassmorphism, no text except the brand name "PROPUSK" --ar 4:3 --style raw
```

**5. Мобильная обложка** — 4:5, 1080 × 1350
```
Vertical close-up of a protein bar half out of its matte dark grey wrapper with emerald stripe, cross-section visible, crumbs on dark glass, emerald haze at the top, moody studio lighting, photorealistic --ar 4:5 --style raw
```

### 4.2. Бриф 3D-сцены (Blender)

| Параметр | Решение |
|---|---|
| Упаковка | флоупак: тело по размерам батончика (около 120 × 35 × 18 мм — сверить с производителем), гофрированные запайки по краям (Displacement по текстуре), продольный шов на обороте; коробка-набор: картон, крышка-клапан, окно |
| Батончик | основа — Remesh + Displace по шумовой текстуре; срез — отдельный материал с орехами (Particle Instances) и слоями; глазурь — Roughness 0,3, лёгкий Coat |
| Материалы | плёнка: `#3A403E`, Roughness 0,5, Sheen 0,2 для «мягкого» блика; полоса `#34D399`; картон: Roughness 0,85, текстура волокна; печать — текстура макета |
| Свет | ключевой Area сбоку 60° для фактуры среза; заполняющий −2 EV; контровой изумрудный 25 %; HDRI 0,3 |
| Камера | 85 мм для героя, 100 мм для среза; f/4 и f/2,8 |
| Ракурсы | 1) батончик в обёртке, диагональ; 2) батончик в разрезе; 3) коробка-набор закрытая; 4) коробка открытая, 12 батончиков; 5) один батончик выдвинут из открытой коробки |
| Рендер | Cycles, 512–1024 сэмплов, AgX, 16-bit PNG; ролик — 24 к/с, 256 сэмплов |
| Отдать | .blend, PNG тёмная и светлая версии, прозрачный фон для ракурсов 1 и 3 |

### 4.3. Сценарий ролика, 12 секунд

| Секунда | Кадр | Движение | Текст на экране | Звук |
|---|---|---|---|---|
| 0–2 | Закрытая коробка-набор | Свет проявляет коробку | «ПРОПУСК» | мягкий эмбиент |
| 2–4 | Клапан коробки | Клапан открывается, видно ряд батончиков | — | шорох картона |
| 4–6 | Один батончик | Выезжает из ряда к камере | «Когда обед не случился» | «свуш» |
| 6–8 | Батончик в обёртке | Обёртка раскрывается по шву | — | хруст плёнки |
| 8–10 | Срез | Батончик разделяется, камера облетает срез | «Состав — на обороте» | короткий «тик» |
| 10–12 | Батончик + коробка | Статичный финальный кадр | «ПРОПУСК · набор» | затухание |

Без цифр белка и калорий в кадре: их место — на упаковке и в характеристиках карточки, сверенных с документом.

**9:16:** коробка снизу, батончик выезжает вверх по центру; текст — в верхней трети.
**1:1:** коробка слева, батончик выезжает вправо; текст справа.

### 4.4. Где использовать и alt-тексты

| Место | Файл | Alt |
|---|---|---|
| Обложка кейса, десктоп | промпт 1 / ракурс 2 | «Протеиновый батончик вымышленного бренда „Пропуск“ в обёртке и в разрезе — демо-проект» |
| Обложка кейса, мобильная | промпт 5 | «Батончик „Пропуск“, наполовину вынутый из обёртки — демо-проект» |
| Карточка в хабе | промпт 4 | «Батончик „Пропуск“ поштучно и в наборе — иллюстрация к расчёту юнит-экономики» |
| Шаг 4 | промпт 3 | «Из цены батончика один за другим уходят расходы — иллюстрация потерь маржи» |
| Шаг 6 | рендеры 3–5 | «Коробка-набор „Пропуск“: закрытая и открытая — 3D-визуализация» |
| Ролик | 9:16 и 1:1 | «Видео: коробка открывается, батончик выезжает и раскрывается в разрезе» |

---

## 5. Хаб «Кейсы»: общие элементы

- **Плашка «Демо-проект»** на каждой карточке хаба и на обложке кейса: стеклянная пилюля, Inter 600, 13–14 px, текст «Демо-проект», изумрудная точка слева. Не убирать при вёрстке.
- **Порядок карточек в хабе:** магний → крем → аудит → батончик (от продукта к ассортименту и экономике).
- **Alt плашки не нужен:** это текст вёрстки, не картинка.
