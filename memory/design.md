# Design analysis (Claude Design prototype)

Source: `design/Пульник - главный экран.dc.html` (single file; `support.js`,
`image-slot.js`, `_ds/` are prototype runtime, not app code). The file is a
visual reference only — do not copy its HTML/CSS/JS into the app. Real
names/photo in it (`Пульник`, two walker names) must never enter git.

## Global frame (390×844 mobile)

- **Header (persistent):** dog name (large, left) + round avatar `image-slot`
  with accent ring (right).
- **Content (switchable):** 4 tabs.
- **Bottom nav (persistent):** `Главная / Месяц / Вес / Питомец`; active tab has
  a pill highlight.
- **Overlays:** password lock (`z-index 20`), weight bottom-sheet (`z-5`),
  walkers bottom-sheet (`z-6`).

Design tokens: bg `#f5ead8`, cards `#fbf6ec`, text `#201e1d`, secondary
`#82796a/#a19786`, accent variable (default `#FFA500`), font `Roboto`,
large radii (cards 26–28px, pills 999px).

## Screens

### 1. Lock (first screen)

Lock icon, `Введите пароль` title, explanatory subtitle, `type=password` field,
accent `Войти` button, error hint line (`Неверный пароль`). Prototype accepts any
non-empty string — the real app verifies against the backend instead.

### 2. Home (`tab=home`)

1. Two cards: **Age** (`38px/900` years + `род. 14 июня 2023`) and **Weight**
   (kg + last-measurement date + corner `+` button opening the weight sheet).
2. `Сегодня выгуливает` banner: walker name, background = that walker's color,
   weekday/date on the right (hardcoded in the prototype).
3. `График выгула` card: title + range, 7-day grid (weekday, date, walker color
   dot), today highlighted; legend chips (`color + name`).
4. Outlined `Изменить выгульщиков` button opening the walkers sheet.

### 3. Month (`tab=month`)

`< Month Year >` pager (`monthOffset` state), weekday header `Пн..Вс`, day grid of
38px walker-color circles (past days at 50% opacity, today ringed), same legend
and edit button as Home.

### 4. Weight (`tab=weight`)

`История веса` title + range + `+` button; `Динамика` card (min/max + SVG
polyline/area chart with dots and date labels); entry rows
(`Дата | Вес | Изменение`) with delta badges (gain `#ffe1d0`, loss `#e1eecc`,
first measurement plain). Prototype always writes to "today" and overwrites a
same-day record; per confirmed decisions the real sheet adds a date picker
(default today) and deletion of old records.

### 5. Pet (`tab=pet`)

Large avatar (132px, tap to replace) + hint text; `Имя питомца` field (used as app
header title); `Дата рождения` (`type=date`); accent `Сейчас возраст` banner
(years + months with Russian pluralization).

## Sheets

### Weight sheet

Grab handle, title, numeric input (`inputMode="decimal"` + `кг`), date caption,
accent `Сохранить`. Closes on backdrop click; inner clicks stop propagation.

### Walkers sheet

Subtitle `Нажмите на человека, чтобы поставить его на сегодня`. Per row: initial
button (opens 10-swatch color palette), tap name (set as today, highlighted row),
pencil (inline rename + confirm), trash (delete, blocked for the last walker),
expandable `Цвет выгульщика` grid (5×2, selected ringed). Add-row
(`Имя нового выгульщика` + `+`, first free palette color), dark `Готово` button.

## Shared state and logic (from the prototype `DCLogic` script)

- `tab, locked/pass, dogName/birth, walkers/todayId, entries/weight/draft`.
- Week/month cells derive from the anchor: `walkers[(todayIdx + dayDiff) mod n]`.
- Age from birth date vs anchor date with `год/года/лет`, `месяц/месяца/месяцев`.
- Chart from ascending entries (min/max ±0.4 padding, SVG points/area/dots).
- Accent/second colors are theming props, not per-walker data.
