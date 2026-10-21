# UX/UI Reference Prompt — "Warm Haze" B2B SaaS language (reverse-engineered from the "Methodical" hero)

Source: one 1280 × 625 px screenshot of the hero of a template site called **Methodical** ("Evidence for every decision."). All values below were estimated from the pixels (sampled colors, measured bounding boxes) at a 1280 px viewport, and rounded to sensible design-system values.

**Not part of the design:** the dark pill switcher at the bottom centre ("Marketing / Application / E-commerce / Components") and the round "i" button at bottom right. They are the template marketplace's demo chrome: they overlap the hero's bottom edge, they use a dark neutral glass style found nowhere else on the page, and they switch between template *categories*, not site content. They must **not** go into the system or the build.

---

## (A) Reverse-engineering findings

### A1. Typography

**Identified family: Inter (most likely the v4 "Display" optical size, or Inter Display, at the headline).**

The letterforms point to Inter:

| Glyph | What we see | Why it is Inter and not the alternatives |
|---|---|---|
| `a` | Double-storey, with a short straight stem and a flat top bowl | Figtree and Mona Sans have rounder, more geometric bowls. Geist's `a` is narrower with a tighter top. |
| `y` (every, Every) | Straight diagonal tail, no hook or curl, cut flat | Switzer has a slightly curved tail. Figtree's tail is shorter and rounder. |
| `e` | Large x-height, wide open aperture, horizontal terminal on the lower stroke | This is the standard Inter "grotesk-neo" e. Geist's terminal is more angled. |
| `t` | Angled top-left cut on the stem, short crossbar | A classic Inter detail. |
| `G` (Get started) | Horizontal bar with a small vertical spur | Inter's G. Geist has no spur. |
| `S`, `i` dot, `.` | Square-ish dots and a full stop, open S terminals | Inter. |
| Overall | Very large x-height (about 0.55 of the em), tight negative tracking at display size, slightly condensed display proportions | Matches Inter's opsz=32 "Display" cut, which has tighter spacing and sharper joins. Inter Tight is a close second (it is the same design with tightened default spacing). |

No numerals are visible in the screenshot.

**Measured roles (1280 px viewport):**

| Role | Measured evidence | Spec |
|---|---|---|
| Hero H1 | Cap height about 47 px; baseline-to-baseline 71 px; "Evidence for every" is 553 px wide | **64 px / 1.1 (70 px), weight 700, tracking −0.035em**, colour white |
| Hero subhead | 2 lines, baseline step about 35 px, wraps at about 650 px | **22 px / 1.6, weight 400, tracking −0.005em**, white at about 85% (`#FBDCCB` on peach) |
| Nav links | x-height about 8 px | **15 px / 1, weight 500, tracking 0**, white at about 92% |
| Wordmark | Bold, tighter than the nav | **19–20 px, weight 700, tracking −0.02em**, with a 22 px diamond-cluster mark |
| Buttons | Label glyphs about 11 px cap | **16 px (header button 17 px), weight 600, tracking −0.005em** |
| Body (inferred for the rest of the page) | — | 16–17 px / 1.6, weight 400 |
| Eyebrow / label (inferred) | — | 13 px / 1, weight 600, tracking +0.04em, uppercase or small caps |

**Final pick for a Russian-language site (Cyrillic is required; Google Fonts is the only allowed host):**

- **Primary: `Inter` (Google Fonts, variable, axes `opsz 14..32` and `wght 100..900`, subsets `cyrillic`, `cyrillic-ext` and `latin`).** It is the same face as the reference. The Google build includes the optical-size axis, so with `font-optical-sizing: auto` you get the tighter "Display" cut automatically at headline sizes. Its Cyrillic is first class: the forms of к, ж, д and л are designed, not auto-generated.
- **Optional for H1/H2 only: `Inter Tight`** (Google Fonts, Cyrillic). Use it only if `opsz` is not working in the build. Do not mix both faces at body sizes.
- Rejected: Geist (its Cyrillic coverage on Google Fonts is newer and less tested), Figtree (no Cyrillic), Mona Sans and Switzer (not on Google Fonts, or no Cyrillic).
- Fallback stack: `"Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`.
- Cyrillic note: Russian copy runs about 10–20% longer than English. Allow the H1 block to be 720 px wide and step the H1 down to 56 px when a line has more than 22 characters. Use `text-wrap: balance` on headings and `hyphens: manual`. Never let a word break in an H1.

Google Fonts link:
`https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400..700&display=swap` (the CSS serves the Cyrillic subsets through `unicode-range` automatically).

### A2. Colour (sampled)

| Sample | Hex | Note |
|---|---|---|
| Page background (cream frame above and below the hero) | `#F8F3E8` (`#FBF4E8` at top) | Warm paper, not white |
| Sky / upper hero | `#D29B85` → `#D8A896` (lighter toward the horizon) | Desaturated peach-rose |
| Distant haze and clouds | `#D79D88`, `#D69277` | Low contrast, blurred |
| Sun disc | `#D9805A` | Small (about 28 px), half-sunk at the horizon, soft edge |
| Mid hills (lit) | `#D87F60`, `#D56540` | Terracotta |
| Near hills (shadow) | `#CB4E2D`, `#BE503C` | Burnt orange |
| Path | Light `#E9B7A0` with a `#BE503C` edge | Pale ribbon winding toward the viewer |
| Wildflower foreground | `#D8491E`, `#C12D10`, with pale specks `#F3C9B5` | High-frequency texture, out of focus |
| **CTA fill (primary)** | **`#CC3D10`** | Vermilion / orange-red. White label contrast is about 4.9:1 (passes AA) |
| Header bar over the sky | `#B6826F` (over `#D29B85`) | Equals `rgba(60, 20, 10, 0.18)` laid over the image: a warm-dark tint, not grey |
| Outline button | 1 px `rgba(255,255,255,.55)` border; fill `rgba(255,255,255,.08)` | Ghost on image |
| Hero subhead | `#FBDCCB` | Which is white at about 85% |

### A3. Layout and composition

- **Hero panel:** full-bleed horizontally and about 608 px tall at 1280 × 625 (so `min-height: min(92svh, 760px)`). It starts 8 px below the top of the viewport, with cream above it and cream visible again below it. Corners are essentially square (radius 0–4 px). It reads as a large framed "poster" sitting on cream paper.
- **Container:** content runs from x = 82 to x = 1190 inside a 1268 px viewport (1280 minus the scrollbar). That gives **max-width 1120 px with 80 px side padding**. Use 24 px padding on mobile and 40 px on tablet.
- **Header:** overlays the hero, **70 px tall** (y 8–78), full-bleed tinted bar `rgba(60,20,10,.18)`, no visible bottom border, a soft 1–2 px transition. The colour behind it is uniform, so a backdrop blur cannot be confirmed. Specify `backdrop-filter: blur(12px) saturate(1.1)`: it will look identical here and better once the page scrolls.
  - The logo sits at left, the nav is centred (4 items, gap about 28 px, 15 px/500), and the single primary "Sign in" button sits at right.
  - The Sign-in button is **108 × 40 px**, padding `0 16px`, radius 2–4 px, with a 16 px "log-in" stroke icon on the left and an 8 px gap.
- **Hero text block:** left-aligned, starting at the container edge. H1 top at about y 190, which is **112 px below the header**. The H1 block is about 560–650 px wide (max about 13 words). The subhead sits **28 px** under the H1 and is capped at **650 px**. The buttons sit **48 px** under the subhead.
- **Buttons:** primary **"Get started" 134 × 52 px** (padding `0 24px`, 16/600, radius 2 px, solid `#CC3D10`, no shadow). Secondary **"Watch demo" 172 × 52 px**, ghost style, with a 16 px outline "play" triangle icon, gap 10 px. The two buttons are **13 px apart (use 12)**.
- **Radius language:** near-square (2–4 px). This is the single most distinctive choice and must be carried through cards, inputs and badges (cards max 6 px).
- **Vertical rhythm:** 4 px base, 8 px grid. Steps in the hero are 112 / 28 / 48.

### A4. Imagery

The hero is a soft-focus, AI-painterly landscape. A pale peach sky fills the top 60%. A sun disc sits small and low, just right of centre, half hidden behind a far ridge. Wide, smooth, rounded dunes or hills run in 4–5 overlapping layers, getting darker and more saturated toward the viewer. A pale winding path snakes from the bottom right into the middle distance (it is the "methodical path" metaphor). The lower left and lower right corners hold dense out-of-focus wildflowers (orange-red with cream specks). Cumulus haze rises on the right. Atmospheric perspective is strong: the far layers are close to the sky colour. There is a slight film grain.

Text sits directly on the sky area, with **no visible scrim**. Contrast comes only from the H1's weight and size. See A5 for why this has to be fixed.

### A5. Motion and accessibility

- Template-family motion: 150–200 ms colour and background transitions on buttons and links. Primary hover darkens by about 8% (`#B3350D`). Ghost hover raises the fill to `.16` and the border to `.8`. Nav links go from 92% to 100% opacity, with an optional 1 px underline offset by 6 px. The header gains a stronger tint and a hairline bottom border once scrolled. Sections fade up 12 px over 400 ms with `cubic-bezier(.2,.7,.2,1)`, once only, and all of it is disabled under `prefers-reduced-motion`.
- **Contrast risks (measured):**
  - White on the sky `#D29B85` is about **2.4:1**. That **fails** WCAG even for large text (3:1 is required).
  - The subhead `#FBDCCB` on `#D29B85` is about **2.0:1**, a hard fail.
  - White on the header bar `#B6826F` is about 3.3:1, which fails for 15 px nav text (4.5 is needed).
  - White on CTA `#CC3D10` is about 4.9:1, which passes.
- **Fixes, which must all be applied:**
  1. Darken the sky in the left 60% of the hero. Use a left-to-right scrim `linear-gradient(90deg, rgba(70,24,10,.42) 0%, rgba(70,24,10,.22) 45%, transparent 75%)`, plus a top-down scrim under the header. Target **4.5:1 behind the subhead and 3:1 or better behind the H1**: the effective background must be `#A8634E` or darker.
  2. Use a pure white subhead (no transparency) at weight 450.
  3. Tint the header bar at `.32` or more when it sits over light image areas.
  4. Give every focus a visible `outline: 2px solid #fff; outline-offset: 3px` on dark or image backgrounds, and `#CC3D10` on cream.

### A6. Template family

This is a modern Tailwind-UI–style marketing template ("Marketing" category; sibling categories are Application, E-commerce and Components). It uses a single accent colour, a neutral warm paper base, an image-led hero, and below the hero a calm, card-based system with product UI mockups. The rest of the page in section C follows those conventions.

---

## (B) Design tokens

```css
/* ===== Warm Haze design tokens — paste into :root ===== */
:root {
  /* Type */
  --font-sans: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --font-display: var(--font-sans);           /* or "Inter Tight", same stack */
  --fs-display: clamp(2.5rem, 1.6rem + 3.2vw, 4rem);     /* 40 → 64px */
  --fs-h2: clamp(2rem, 1.5rem + 1.8vw, 3rem);            /* 32 → 48 */
  --fs-h3: 1.5rem;     /* 24 */
  --fs-h4: 1.125rem;   /* 18 */
  --fs-lead: clamp(1.125rem, 1rem + .5vw, 1.375rem);     /* 18 → 22 */
  --fs-body: 1rem;     /* 16 */
  --fs-small: .875rem; /* 14 */
  --fs-label: .8125rem;/* 13 */
  --lh-tight: 1.1; --lh-snug: 1.25; --lh-body: 1.6;
  --tr-display: -0.035em; --tr-h2: -0.025em; --tr-h3: -0.015em; --tr-label: 0.04em;
  --fw-regular: 400; --fw-medium: 500; --fw-semibold: 600; --fw-bold: 700;

  /* Palette — raw */
  --cream-50:  #FCF9F2;
  --cream-100: #F8F3E8;   /* page background */
  --cream-200: #F1E8D8;
  --cream-300: #E6D8C2;
  --sand-400:  #C9B49A;
  --peach-100: #F3D3C3;
  --peach-200: #E8B7A1;
  --peach-300: #D8A896;   /* horizon sky */
  --peach-400: #D29B85;   /* upper sky */
  --clay-400:  #D87F60;
  --clay-500:  #D56540;
  --clay-600:  #CB4E2D;
  --clay-700:  #A8634E;   /* min. scrimmed sky for text */
  --vermilion-500: #CC3D10;   /* accent / CTA */
  --vermilion-600: #B3350D;   /* hover */
  --vermilion-700: #962C0B;   /* active, text-on-cream accent */
  --ink-950: #1F1410;     /* warm near-black */
  --ink-800: #3A2A23;
  --ink-600: #6B564B;
  --ink-400: #9C8679;

  /* Semantic — light */
  --bg: var(--cream-100);
  --bg-elevated: var(--cream-50);
  --bg-sunken: var(--cream-200);
  --surface-card: #FFFDF8;
  --border: rgba(58, 42, 35, .12);
  --border-strong: rgba(58, 42, 35, .22);
  --text: var(--ink-950);
  --text-muted: var(--ink-600);
  --text-subtle: var(--ink-400);
  --text-on-image: #FFFFFF;
  --accent: var(--vermilion-500);
  --accent-hover: var(--vermilion-600);
  --accent-active: var(--vermilion-700);
  --accent-text: var(--vermilion-700);        /* accent used as text on cream: 5.9:1 */
  --accent-soft: #F7DDD2;                     /* badge / highlight fill */
  --on-accent: #FFFFFF;
  --focus-ring: var(--vermilion-500);
  --success: #3F7A4E; --warning: #B7791F; --danger: #B42318;

  /* Header */
  --header-h: 70px;
  --header-tint: rgba(60, 20, 10, .18);
  --header-tint-scrolled: rgba(248, 243, 232, .82);   /* turns cream once over content */
  --header-blur: 12px;

  /* Hero */
  --hero-min-h: min(92svh, 760px);
  --hero-scrim-x: linear-gradient(90deg, rgba(70,24,10,.42) 0%, rgba(70,24,10,.22) 45%, rgba(70,24,10,0) 75%);
  --hero-scrim-top: linear-gradient(180deg, rgba(60,20,10,.25) 0%, rgba(60,20,10,0) 28%);
  --ghost-fill: rgba(255,255,255,.08);
  --ghost-fill-hover: rgba(255,255,255,.16);
  --ghost-border: rgba(255,255,255,.55);
  --ghost-border-hover: rgba(255,255,255,.85);

  /* Layout */
  --container: 1120px;
  --gutter: clamp(24px, 6vw, 80px);
  --section-y: clamp(80px, 9vw, 128px);
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px; --space-5: 24px;
  --space-6: 32px; --space-7: 48px; --space-8: 64px; --space-9: 96px; --space-10: 128px;

  /* Shape */
  --radius-xs: 2px;     /* buttons, inputs, badges */
  --radius-sm: 4px;     /* header button, chips */
  --radius-md: 6px;     /* cards, mockup frames — max */
  --radius-pill: 999px; /* only for tiny status dots / toggles */
  --btn-h: 52px; --btn-h-sm: 40px; --btn-px: 24px; --btn-px-sm: 16px;

  /* Elevation (warm, low) */
  --shadow-1: 0 1px 2px rgba(58,30,20,.06);
  --shadow-2: 0 1px 2px rgba(58,30,20,.05), 0 8px 24px -8px rgba(58,30,20,.12);
  --shadow-3: 0 2px 4px rgba(58,30,20,.06), 0 24px 48px -16px rgba(58,30,20,.20);

  /* Motion */
  --ease-out: cubic-bezier(.2, .7, .2, 1);
  --dur-fast: 150ms; --dur-base: 200ms; --dur-slow: 400ms;
}

/* Dark variant — "dusk": same hue family, never pure black */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #17100D; --bg-elevated: #1F1612; --bg-sunken: #120C0A; --surface-card: #231915;
    --border: rgba(248,226,210,.10); --border-strong: rgba(248,226,210,.20);
    --text: #F6EDE4; --text-muted: #C2AE9F; --text-subtle: #8E7A6D;
    --accent: #E0521F; --accent-hover: #EA6534; --accent-active: #CC3D10;
    --accent-text: #F08A5D; --accent-soft: rgba(224,82,31,.16); --on-accent: #FFFFFF;
    --header-tint-scrolled: rgba(23,16,13,.78);
    --shadow-2: 0 1px 2px rgba(0,0,0,.4), 0 8px 24px -8px rgba(0,0,0,.5);
    --shadow-3: 0 2px 4px rgba(0,0,0,.4), 0 24px 48px -16px rgba(0,0,0,.6);
  }
}
:root[data-theme="dark"] {
  --bg: #17100D; --bg-elevated: #1F1612; --bg-sunken: #120C0A; --surface-card: #231915;
  --border: rgba(248,226,210,.10); --border-strong: rgba(248,226,210,.20);
  --text: #F6EDE4; --text-muted: #C2AE9F; --text-subtle: #8E7A6D;
  --accent: #E0521F; --accent-hover: #EA6534; --accent-active: #CC3D10;
  --accent-text: #F08A5D; --accent-soft: rgba(224,82,31,.16); --on-accent: #FFFFFF;
  --header-tint-scrolled: rgba(23,16,13,.78);
  --shadow-2: 0 1px 2px rgba(0,0,0,.4), 0 8px 24px -8px rgba(0,0,0,.5);
  --shadow-3: 0 2px 4px rgba(0,0,0,.4), 0 24px 48px -16px rgba(0,0,0,.6);
}
```

Dark-mode hero: keep the illustration, but shift it to dusk. Multiply the whole SVG with `#2A1410` at 35% (`mix-blend-mode: multiply` overlay) and lower the sun's saturation. White text contrast then improves on its own.

---

## (C) Build prompt for the builder agent

> **You are building a premium Western-style B2B/SaaS landing page in Russian.** Copy and structure come from the client's content file. Your job is the visual language described here, called **"Warm Haze"**: warm cream paper, one confident vermilion accent, a painterly sunset-dune hero, near-square corners, and Inter at tight display tracking. Build it as semantic HTML + CSS (Tailwind is fine if tokens map to the CSS variables in section B). Paste the token block from section B verbatim and use only those tokens; never hard-code a colour, radius or font size that is not a token.

### C1. Global rules
1. **Font:** Inter from Google Fonts only (`opsz,wght@14..32,400..700`, `display=swap`), with `font-optical-sizing: auto` and `font-feature-settings: "cv11", "ss01"` optional. Set `lang="ru"` on `<html>`. No other font hosts and no icon fonts.
2. **Icons:** inline SVG, 1.5 px stroke, 16 px in buttons and 20 px in features, `currentColor`, round caps (Lucide-style geometry, drawn inline, not loaded from a CDN unless an allowed CDN is pinned).
3. **No photos or images from the internet.** All imagery is original SVG/CSS (see C3). Product UI mockups are built in HTML/CSS.
4. Page background is `--bg` (cream), never white. Cards are `--surface-card`, with a 1 px `--border` and `--radius-md`, and `--shadow-2` only on hover or featured items.
5. Container is `max-width: var(--container); padding-inline: var(--gutter); margin-inline: auto`. Section padding is `--section-y`. The layout must work at 360 px (16–24 px gutter) with no horizontal scroll.
6. The corner radius stays at 2–6 px everywhere. **No pill buttons** (pills are allowed only for 8 px status dots and toggles).

### C2. Header (sticky)
- 70 px tall, full-bleed, `position: fixed; top: 0`, and an inner container laid out as a 3-column grid (`auto 1fr auto`).
- Over the hero it uses the `--header-tint` background plus `backdrop-filter: blur(var(--header-blur)) saturate(1.1)`, with white text (nav at 92% opacity, 100% on hover).
- After scrolling 40 px or more (IntersectionObserver on the hero), switch to `--header-tint-scrolled`, `--text` colour, a 1 px bottom border in `--border`, and a 200 ms transition.
- Logo: a geometric mark (an original diamond cluster or similar, 22 px) plus a wordmark at 19 px/700/−0.02em.
- Nav: 4–5 anchor links, centred, 15 px/500, gap 28 px.
- Right side: one solid primary button, 40 px tall with `--btn-px-sm` padding, `--radius-sm`, a 16 px icon before the label, and an 8 px gap. Add an optional ghost text link before it ("Войти") if the content needs one.
- Mobile (below 900 px): show the logo and a 40 × 40 menu button. The menu opens a full-width sheet on cream with 18 px/500 links stacked at 56 px row height, and the CTA full-width at the bottom.

### C3. Hero (original SVG landscape)
**Layout:**
- `min-height: var(--hero-min-h)`, sitting under the header with an 8 px cream gap above it (an optional "poster" frame), full-bleed.
- Content is left-aligned in the container. Padding-top is `header-h + 112px`; padding-bottom is 96 px or more.
- Eyebrow (optional): a 13 px/600 badge in a ghost style.
- H1: `--fs-display`, `--lh-tight`, weight 700, `--tr-display`, `max-width: 14ch` (Russian: 16ch), `text-wrap: balance`, white.
- Lead: `--fs-lead`, line-height 1.6, `max-width: 40rem`, pure white, weight 400–450, 28 px below the H1.
- Buttons row, 48 px below the lead, gap 12 px:
  - **Primary:** 52 px tall, padding 0 24 px, `--accent`, 16 px/600, `--radius-xs`.
  - **Ghost:** 52 px tall, `--ghost-fill`, a 1 px `--ghost-border`, a 16 px play-triangle icon, gap 10 px.
- Below 640 px the buttons stack full-width.

**Illustration:** one `<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice">` set as an absolutely positioned layer. Build it bottom-up:
1. **Sky:** a vertical `linearGradient` from `#CF9480` (top) through `#D8A896` (60%) to `#E7BCA6` (horizon, about 62% height).
2. **Sun:** a circle of r 26 at (1060, 545) filled `#E08A62`, with `feGaussianBlur stdDeviation 1.2`. Behind it, a radial glow of r 220 from `rgba(240,170,130,.45)` to transparent.
3. **Cloud haze, right third:** 5–7 overlapping ellipses in `#E2B2A0` at 40–60% opacity under `feGaussianBlur stdDeviation 18`, rising from the horizon at x 1150–1600.
4. **Hills (5 ridges, back to front),** each a single `path` of smooth cubic Béziers (wide, rounded dune crests, no sharp peaks). Each gets a vertical gradient from a lighter crest to a darker base, plus a soft `feGaussianBlur` that decreases toward the front (stdDeviation 3, 2, 1, 0.5, 0):
   - R1 at y about 560: `#DDA48C` → `#D69277`
   - R2 at about 600: `#DC9474` → `#D07A5A`
   - R3 at about 650: `#D98262` → `#C9603F`
   - R4 at about 720: `#D86A44` → `#BF4F31`
   - R5 at about 800: `#D25A33` → `#B5401F`
   - On R3–R5, add a light-side highlight: a second copy of the path with `#F0B49A` at 25% opacity, clipped to the upper-left 30% of each crest.
5. **Path:** a ribbon (a filled path, not a stroke) that widens from 6 px at about (980, 620) to 90 px at the bottom edge around x 1150, winding S-curve twice. Fill `#ECC0AA`, with a 1.5 px darker inner edge in `#B9533C` at 50% opacity.
6. **Wildflower foreground:** in the bottom-left and bottom-right corners only (each about 30% of the width and 18% of the height), scatter 300–500 circles (r 1.5–5) in `#D8491E`, `#C12D10` and `#E46A3F`, plus about 15% cream specks `#F6D2BF`. Generate them in a `<script>` with a seeded PRNG, or pre-generate them into the SVG. Then apply `feGaussianBlur stdDeviation 1.5` (shallow depth of field) and a dark base band `#B43816` beneath them.
7. **Atmospheric haze:** a full-width rectangle with a vertical gradient that is transparent at the top, `rgba(240,200,180,.35)` at the horizon band (55–70%), and transparent below. It sits above R1–R3 and below R4.
8. **Grain:** an `feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2"` rect at 6–8% opacity with `mix-blend-mode: overlay` (or a CSS pseudo-element with the same filter as a data-URI SVG).
9. **Legibility scrims (required):** two absolutely positioned `div`s over the SVG and under the text, `--hero-scrim-x` and `--hero-scrim-top`. Verify that the H1 has 3:1 or better and the lead has 4.5:1 or better against the darkest-adjusted background.
10. Respect `prefers-reduced-motion`. Optional motion: the sun glow breathes (opacity .9 ↔ 1, 6 s), and the clouds drift ±8 px over 20 s. Nothing else moves.

### C4. Sections after the hero (on a cream background)
Each section opens with a header block: an eyebrow (13 px/600, `--accent-text`, uppercase, `--tr-label`), an H2 (`--fs-h2`, 700, `--tr-h2`, `--lh-snug`, max 20ch) and a lead (18 px, `--text-muted`, max 36rem), left-aligned. Centre-align only the final CTA and pricing. Order:

1. **Credibility strip** (directly under the hero, 48–64 px padding): "Для кого / с чем работаем" (who it is for, what it works with). Show 5–6 items in a single row of monochrome `--ink-400` wordmarks or tool and standard names in **text** (for example the categories of integrations or methodologies). Do not invent customer logos. Separate the items with 1 px vertical dividers. On mobile it becomes a horizontal scroll-snap row or a 2 × 3 grid.
2. **Feature section A, split layout:** a 5/7 column split, with text and 3 bullet rows (20 px icon in an `--accent-soft` 36 px square with `--radius-xs`, title 16/600, body 15/400 muted) next to a **product UI mockup**.
   - Mockup: a browser-frame card with `--radius-md`, a 1 px border and `--shadow-3`; a 36 px top bar with 3 neutral 8 px dots; and inside it a sidebar plus a table or chart built in HTML/CSS using cream surfaces and vermilion highlights.
   - Alternate the image side in Feature section B.
3. **Feature grid:** 3 × 2 cards (padding 28 px, `--surface-card`, 1 px border, `--radius-md`). Each card has an icon square, an H4 at 18/600, and a 15 px body. On hover, raise the border to `--border-strong` and apply `--shadow-2`. Card motion is `translateY(-2px)` only.
4. **Workflow / steps:** a 4-step horizontal timeline. Each step has a numbered marker (a 32 px square, `--radius-xs`, 1 px accent border, 14/600 numerals with `font-variant-numeric: tabular-nums`), a hairline connector, a title and a 2-line description. It goes vertical below 768 px. Optional tabs above it, with tabs specified as: 40 px tall, a bottom 2 px accent indicator on the active tab, 15/500, muted for inactive.
5. **Comparison table:** "Как обычно" (the usual way) vs "С нами" (with us). The "with us" column has a header in `--accent-soft` and `--accent-text`. Rows are 56 px with 1 px `--border` dividers and a sticky first column on mobile. Use a check icon in accent and a dash in `--text-subtle`, never a red cross.
6. **Pricing:** 3 tiers, with the middle one featured: a 2 px accent top border, a "Рекомендуем" (recommended) badge (13/600, `--accent-soft` background, `--accent-text`, `--radius-xs`, padding 4 × 8) and `--shadow-3`.
   - Each tier shows the name (16/600), the price (40 px/700, `--tr-h2`, tabular numerals, with the "₽" and period in 15 px muted), one sentence, a full-width button (primary on the featured tier, outline on the others: 1 px `--border-strong` with `--text`) and 6–8 check rows.
   - Optional monthly/annual toggle (a segmented control, 36 px, `--radius-sm`).
7. **Proof without testimonials (the client has none, so never fabricate quotes, names, photos, ratings or logos).** Use honest substitutes:
   - (a) "Как мы работаем": 3 principle cards with verifiable commitments (for example a fixed scope, deadlines in the contract, and the deliverables listed).
   - (b) A sample deliverable preview: a mock document or report page in HTML/CSS labelled "Пример результата" (sample output).
   - (c) Founder/team credentials as plain facts (years, domains), with no portrait photos (an initials monogram on a cream square is allowed).
   - (d) An optional pilot offer, "Первые клиенты: пилот на особых условиях" (first clients: a pilot on special terms).
   - Label every number with its source or mark it as a target, never as a result.
8. **FAQ:** a 2-column layout with the H2 and a contact line on the left (4 columns) and an accordion on the right (8 columns).
   - Each item uses `<details>/<summary>`: question at 17/600, a 64 px row height, a 1 px `--border` between items, and a plus icon that rotates 45° over 200 ms. Answers are 16 px muted with a max width of 60ch.
9. **Final CTA band:** a full-bleed panel that re-uses a **cropped, calmer version of the hero SVG** (only ridges R3–R5 and the sun glow) with the scrim. The panel has `--radius-md` inside the container (an inset card, 64–96 px padding).
   - It contains a centred H2 in white, one line of lead, and the primary and ghost buttons.
   - Optional email capture: an input 52 px tall with `--radius-xs`, a white background, a 1 px border, and the button attached to its right.
10. **Footer:** on `--bg-sunken`, with a 4-column link grid (13/600 uppercase headings, 15/400 muted links, 12 px row gap), the logo and a one-line positioning statement on the left, and a bottom bar with a hairline top border holding the legal entity details (ИНН/ОГРН if provided), privacy policy, © year and a theme toggle. Text is 14 px.

### C5. Component specs (summary)
| Component | Spec |
|---|---|
| Button primary | 52 px (lg) / 40 px (sm). Padding 24 / 16. 16 px/600. `--accent` background, `--on-accent` label, `--radius-xs`. Hover `--accent-hover`; active `--accent-active` plus `translateY(1px)`. Focus: 2 px ring offset 3 px. Disabled: 40% opacity. |
| Button ghost (on image) | `--ghost-fill`, 1 px `--ghost-border`, white label. Hover uses the `-hover` tokens. |
| Button outline (on cream) | Transparent, 1 px `--border-strong`, `--text`. Hover: `--bg-sunken` background. |
| Text link | `--accent-text`, underline offset 3 px, thickness 1 px, underline on hover only in nav and always in body copy. |
| Card | `--surface-card`, 1 px `--border`, `--radius-md`, padding 28 px (24 on mobile). |
| Badge | 13 px/600, padding 4 × 8, `--radius-xs`, variants: accent-soft, neutral (`--bg-sunken`, `--text-muted`), outline. |
| Tabs | 40 px, gap 24 px, active has a 2 px bottom accent bar plus `--text`; inactive `--text-muted`. |
| Table | Header 13/600 uppercase muted, rows 56 px, 1 px dividers, numerals tabular and right-aligned. |
| Input | 48–52 px, `--radius-xs`, 1 px `--border-strong`, background `--surface-card`. Focus border `--accent` plus a 3 px `--accent-soft` ring. |
| Accordion | `<details>`, 64 px row, rotating-plus icon. |
| Mockup frame | `--radius-md`, `--shadow-3`, 36 px chrome bar, inner content in 13–14 px Inter. |

### C6. Motion and accessibility checklist
- Transitions: colour and background at 150–200 ms `--ease-out`; reveal-on-scroll is 12 px plus opacity over 400 ms, run once, staggered by 60 ms, and none of it runs under `prefers-reduced-motion: reduce`.
- Contrast: body text is 4.5:1 or better and large text 3:1 or better. Check the hero text after the scrim, nav-over-image (tint the header if it falls short) and the muted text on cream (`--ink-600` on `--bg` is about 6.4:1, which is fine).
- The whole page works by keyboard, with a skip link and visible focus. Use one `<h1>`, landmarks (`header`, `nav`, `main`, `footer`), and `aria-expanded` on the mobile menu. The hero SVG gets `aria-hidden="true"`.
- Tap targets are 44 px or more. Lines are capped at 70ch. Set `text-rendering: optimizeLegibility` and `-webkit-font-smoothing: antialiased` on dark and image areas only.

### C7. Do / Don't

**Do**
- Commit to **one** accent (vermilion `#CC3D10`) and use it sparingly: CTAs, active states, small highlights. 90% of the page is cream and ink.
- Keep corners near-square (2–6 px). This is the signature of the reference.
- Use tight display tracking (−0.035em) on headlines and normal tracking on body.
- Left-align hero and section headers. Leave generous empty space and keep the hero text to the left third.
- Make product mockups that look like *this* product: real Russian labels, plausible column names and realistic numbers marked as examples.
- Use warm shadows (brown-tinted, low opacity) and warm neutrals (ink `#1F1410`, never `#000` or cool grey).
- Use a painterly, atmospheric hero with depth layers, grain and haze. The same SVG language can recur once (the final CTA).
- Write honest proof (method, sample output, commitments) instead of fake social proof.

**Don't**
- Use purple/blue gradients, glassmorphism cards, glowing orbs, neon or "AI sparkle" icons.
- Use pill-shaped buttons, 16–24 px rounded cards or chunky drop shadows.
- Use emoji as icons, 3D blobs, stock illustration people, or any internet photo.
- Put white text straight on the light peach sky without a scrim, or use semi-transparent body text on images.
- Centre every section, or stack identical three-card rows section after section. Vary the rhythm (split, grid, timeline, table, accordion).
- Add a second accent colour, or more than two font weights per element group (stick to 400, 500, 600 and 700 in total).
- Invent customer logos, testimonials, star ratings, "trusted by 10,000+ teams" or award badges.
- Copy the marketplace demo chrome (the dark pill category switcher and the floating "i" button). It is not part of this design.
- Load fonts or assets from any host other than Google Fonts and the allowed pinned CDNs.
