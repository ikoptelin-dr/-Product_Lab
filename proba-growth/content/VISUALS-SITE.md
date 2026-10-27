# Изображения и моушн для сайта Proba Lab

Промпты для генерации (Ideogram, Midjourney, Flux) и брифы для дизайнера (Blender, моушн). Кейсы — отдельно в `cases/VISUALS.md`.

## Общие правила

- **Стиль:** минимализм, тёмный фон (#000–#0B0B0C) или светлый (#F4F4F5), стеклянные поверхности (glassmorphism), акцент изумрудный **#34D399**, мягкий студийный свет, много воздуха.
- **В кадре нельзя:** людей и лица (не выдаём генерацию за команду), медицинские символы (крест, шприц, таблетки как лекарство), реальные бренды и логотипы, текст кроме названия вымышленного бренда, «до/после», органы и тело.
- **Форматы:** WebP или AVIF; первый экран — до 200 КБ; остальные — до 120 КБ. Видео — MP4 (H.264) и WebM, без звука, до 2 МБ, зацикленное, с постером.
- **Подписи (alt)** — по-русски, описывают, что на картинке, без слов «наш клиент» и «наша студия».

## 1. Главная — первый экран (дополнение к схеме «путь продукта»)

**Промпт:**
> Minimalist product launch concept, three unbranded supplement and cosmetic containers (white jar, amber dropper bottle, matte tube) standing on a dark glass surface, soft emerald green rim light (#34D399), subtle reflections, frosted glass panels floating in background, deep black background, studio lighting, high-end tech aesthetic, no text, no people, no medical symbols --ar 4:3 --style raw

**alt:** «Баночка, флакон и тюбик без этикеток на тёмном стекле с изумрудной подсветкой»

**Моушн (6 с, цикл):** камера медленно облетает тару на 20°, по стеклу пробегает изумрудный блик, тара слегка вращается. Используется вместо статичной картинки в первом экране на десктопе; на телефоне — постер.

## 2. «Документы» — первый экран хаба

**Промпт:**
> Abstract regulatory documents concept, stack of blank paper sheets and a clipboard with an empty checklist on a frosted glass desk, emerald green checkmark glowing softly, dark background, minimal, clean, no readable text, no logos, no people --ar 16:9

**alt:** «Стопка документов и чек-лист с изумрудной отметкой»

## 3. «Маркетинг» — первый экран хаба

**Промпт:**
> Marketplace product card concept, floating glass smartphone screen showing a blank product card layout with an unbranded cosmetic jar, abstract infographic shapes in emerald green, dark background, soft glow, minimal UI, no real brand names, no readable text --ar 16:9

**alt:** «Экран телефона с макетом карточки товара и баночкой косметики»

## 4. «Аналитика» — первый экран хаба

**Промпт:**
> Abstract analytics dashboard made of frosted glass panels, simple bar and line charts in emerald green, no numbers, no text, dark background, depth of field, minimal futuristic --ar 16:9

**alt:** «Стеклянные панели с графиками»

## 5. 3D-визуализация — витрина (вместо портфолио, пока его нет)

**Бриф для Blender:** три вымышленные упаковки (банка магния, крем в тубе, батончик) из демо-кейсов. Один свет на все: ключевой мягкий бокс 45°, контровой изумрудный, пол — тёмное стекло с размытыми отражениями. Камера 85 мм, 3 ракурса: фронт, ¾, сверху. Рендер Cycles, 2000×1500, денойз. Отдельно — анимация вращения 360° за 6 с (MP4, WebM).

**alt:** «3D-визуализация упаковки: банка, туба и батончик вымышленных брендов»

## 6. «Упаковка до регистрации» — моушн-ролик (12 с)

| Секунды | Кадр | Текст на экране |
|---|---|---|
| 0–2 | Пустая белая банка вращается на тёмном фоне | «Документы в работе» |
| 2–5 | На банку «наклеивается» этикетка, появляется изумрудный контур | «Этикетка по требованиям» |
| 5–8 | Камера облетает банку, вокруг возникают 3 кадра карточки | «3D и видео — без съёмки» |
| 8–10 | Кадры складываются в экран телефона с карточкой | «Карточка готова» |
| 10–12 | Изумрудная галочка, логотип Proba Lab | «К выдаче документа — готовы продавать» |

Версии 16:9 (сайт), 9:16 и 1:1 (соцсети, карточки).

## 7. Блог — обложки статей

**Шаблон промпта:**
> Minimal abstract cover for an article about [TOPIC], frosted glass shapes, emerald green accent (#34D399), dark background, geometric, no text, no people --ar 16:9

Темы: JTBD → «abstract puzzle pieces forming a path»; CJM → «winding glowing path with checkpoints»; кастдев → «two abstract speech bubbles made of glass»; УТП → «one glowing gem among matte stones»; позиционирование → «compass made of glass»; маркировка → «abstract DataMatrix-like pattern without real code»; документы → «abstract stamp and paper shapes».

## 8. Команда и «О нас»

**Генерацию не используем.** Нужны реальные фотографии: портрет основателя на нейтральном фоне, рабочий процесс дизайнера (монитор с Blender, руки на планшете — с согласия). Пока фото нет — блок команды остаётся текстовым.
