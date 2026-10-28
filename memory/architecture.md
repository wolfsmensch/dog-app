# Architecture

## 1. Overview

```
browser (PWA, mobile-first, installable via desktop icon)
  └─> web (nginx: serves frontend dist/, proxies /api/* -> api:3000)
        └─> api (Nest.js + SQLite at /data/app.sqlite, uploads at /data/uploads)
```

- `docker compose up --build -d` starts the whole system.
- HTTPS is terminated by the host nginx; internal traffic is plain HTTP.
- Two containers: `api` (no published port, container network only) and `web`
  (public port taken from `.env` as `${WEB_PORT:-8080}:80`).
- Persistent volumes: `sqlite-data:/data`, `uploads-data:/data/uploads`, so the
  DB and photos survive rebuilds.
- `api` runs as the unprivileged `node` user (UID/GID 1000) on Node.js 24 LTS /
  Debian 13 (`node:24-trixie-slim`); `web` uses `nginx:alpine`. The image
  pre-creates `/data/uploads` owned by `node`, so fresh named volumes inherit
  that ownership. Existing root-owned volumes must be migrated once:
  `docker compose run --rm --no-deps --user root --entrypoint chown api -R 1000:1000 /data`.

## 2. Backend (Nest.js, strict TypeScript)

```
backend/
  src/
    main.ts            # /api prefix, global ValidationPipe, SQLite WAL
    app.module.ts
    config/            # env validation (APP_PASSWORD, JWT_SECRET, DATA_DIR, TZ)
    auth/              # login, JwtStrategy, JwtAuthGuard (global minus login/health)
    health/            # GET /api/health (unauthenticated, Docker healthcheck)
    walkers/           # entity, DTOs, service, controller
    schedule/          # walk-state anchor + week/month computation
    weights/           # entity, DTOs, service, controller
    pet/               # singleton entity + photo upload (multer)
  Dockerfile
```

Dependencies: `@nestjs/common`, `@nestjs/jwt`, `@nestjs/platform-express`,
`class-validator`, `class-transformer`, `typeorm` + `better-sqlite3`, `multer`.
`multer` 2.5.0 and `body-parser` 2.4.0 are pinned via npm `overrides` so the
production dependency tree stays audit-clean.

### 2.1. Database schema (SQLite, WAL mode)

```sql
walkers(
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,            -- 1..30 chars
  color TEXT NOT NULL,           -- '#RRGGBB'
  position INT NOT NULL,         -- order in the rotation queue
  created_at TEXT NOT NULL
);

walk_state(
  id INTEGER PRIMARY KEY CHECK (id = 1),
  today_walker_id INTEGER REFERENCES walkers(id),
  today_date TEXT NOT NULL       -- 'YYYY-MM-DD', rotation anchor
);
-- Single row.

weights(
  id INTEGER PRIMARY KEY,
  date TEXT NOT NULL UNIQUE,     -- 'YYYY-MM-DD', one record per date
  kg REAL NOT NULL,              -- rounded to 1 decimal
  created_at TEXT NOT NULL
);

pet(
  id INTEGER PRIMARY KEY CHECK (id = 1),
  name TEXT NOT NULL DEFAULT 'Pet',
  birth_date TEXT NULL,          -- 'YYYY-MM-DD'
  photo_path TEXT NULL,          -- relative path under /data/uploads
  updated_at TEXT NOT NULL
);
-- Single row, neutral seed. No personal data in git.
```

### 2.2. Auth

- Secrets in backend `.env` (never in git): `APP_PASSWORD`, `JWT_SECRET`,
  `JWT_EXPIRES_IN=365d`, `DATA_DIR=/data`. `.env.example` documents names only.
- Local dates use `APP_TIMEZONE` (IANA name), injected into the `api` container
  as `TZ`; it defaults to `UTC` in Compose. `todayLocal()` and all date checks
  run in that zone, never in the container's default UTC.
- `POST /api/auth/login { password } -> { accessToken }` (timing-safe compare,
  no password logging).
- Global `JwtAuthGuard` protects all `/api/*` except `auth/login` and `health`.
  Client sends `Authorization: Bearer <token>`; token lives in `localStorage`.
- Offline: if a token exists locally, the cached app opens and shows last synced
  data; server verification happens once online again.

### 2.3. Walk queue logic

- Ordered list (`position`) + anchor `(todayWalkerId, todayDate)` in `walk_state`.
- Schedule for date `D`: `walker = list[(index(todayWalkerId) + days(D - todayDate)) mod n]`.
- Lazy roll-forward: on read, if `todayDate < today`, the anchor advances by the
  day difference, so rotation continues even when the app was not opened.
- `PUT /api/schedule/today { walkerId }` re-anchors the queue at today.
- Server rejects the 11th walker (400) and deletion of the last walker (400);
  color must match `^#[0-9A-Fa-f]{6}$`.

### 2.4. API contracts

```
POST   /api/auth/login            { password } -> { accessToken }
GET    /api/health                -> { ok: true }

GET    /api/walkers               -> [{ id, name, color, position }]
POST   /api/walkers               { name, color? } -> 201 | 400 (limit/validation)
PATCH  /api/walkers/:id           { name?, color?, position? }
DELETE /api/walkers/:id           -> 400 when deleting the last walker

PUT    /api/schedule/today        { walkerId, date? = today }
GET    /api/schedule/week?start=YYYY-MM-DD   -> [{ date, walkerId }]
GET    /api/schedule/month?year=&month=      -> [{ date, walkerId }]

GET    /api/weights?from=&to=     -> [{ id, date, kg }] desc
POST   /api/weights               { date = today, kg } -> upsert by date
PATCH  /api/weights/:id           { date, kg } -> edit; 409 if date is taken
DELETE /api/weights/:id

GET    /api/pet                   -> { name, birthDate, photoUrl }
PUT    /api/pet                   { name?, birthDate? }
POST   /api/pet/photo             multipart (jpg/png/webp, <= 5 MB) -> { photoUrl }
DELETE /api/pet/photo
```

Weight validation (both sides): `date` is `YYYY-MM-DD`, not further than tomorrow;
`kg` is a number with max 1 decimal place, 1–150, rounded server-side. Editing an
existing entry keeps the same uniqueness rule; a date collision returns 409 and
leaves both records untouched. Weight mutations (`upsertWeight`, `updateWeight`,
`deleteWeight`) are queued in the offline outbox.

Server date semantics: `todayLocal()` returns `YYYY-MM-DD` in `APP_TIMEZONE`
(`TZ` in the container), so the walk anchor and pet future-date check cannot
drift to UTC. Walker colors are validated against `^#[0-9A-Fa-f]{6}$`; shorthand
and named colors are rejected with 400.

## 3. Frontend (React + TypeScript + Vite PWA)

```
frontend/
  src/
    api/client.ts      # fetch wrapper: Bearer token, 401 handling
    api/errors.ts      # shared ApiError/QueuedError classes
    api/cache.ts       # last-good snapshots (localStorage/IndexedDB)
    api/outbox.ts      # offline mutation queue, flush on 'online'
    hooks/             # useWalkers, useWeights, usePet, useOnline
    lib/queue.ts       # client-side rotation mirror for instant UI
    lib/age.ts         # age calc + Russian pluralization
    lib/version.ts     # build version label in local time
    lib/weightInput.ts # mask: digits + single dot only
    components/        # LockScreen, Header, TabBar,
                       # HomeTab, MonthTab, WeightTab, PetTab,
                       # WeightSheet, WalkersSheet
    styles.scss        # entry stylesheet, compiled from SCSS by Vite
    styles/_fonts.scss # Roboto @font-face declarations
    App.tsx            # tab state (no router needed for 4 tabs)
    vite-env.d.ts      # Vite/PWA typings + build version globals
  vite.config.ts       # vite-plugin-pwa
  nginx.conf           # static dist/ + proxy /api -> api:3000
  Dockerfile
  public/icons/        # icon-192.png, icon-512.png
```

All styles are authored in SCSS and compiled to CSS during the Vite build. The
`sass` package is a frontend devDependency; `styles.scss` loads the font partial
with `@use './styles/fonts'`, and `index.html` has no separate font stylesheet
link. No hand-written `.css` files are kept in the frontend source; inline React
`style` props remain allowed.

UI layout: no simulated phone frame. The app content is a centered column capped
at 576px; wider screens keep the same `--bg` color (`#f5ead8`) on the sides as the
content column. The bottom `.tabbar` spans the full viewport, while its button grid
lives in an inner container capped at 576px. Tab-bar icons are always the outline
variant in the muted color, whether the tab is active or not; the active tab is
indicated by the chip background and label color only.

The document title is the pet name once `GET /api/pet` succeeds (or a cached pet
is restored), with `Питомец` as the initial/fallback value. In the weight history,
rows open the shared weight sheet in edit mode; the oldest row shows a gray
`0 кг` delta badge.

PWA (`vite-plugin-pwa`, `generateSW`, `registerType: 'autoUpdate'`):

- Registration is manual via `virtual:pwa-register`:
  `registerSW({ immediate: true })` in `main.tsx`. The plugin sets
  `skipWaiting`/`clientsClaim`, so a new service worker activates and reloads
  open pages automatically.
- `manifest`: `name` and `short_name` are `Собака`; description, `theme_color`,
  icons 192/512, `display: 'standalone'`.
- `/index.html`, `/sw.js`, and `/manifest.webmanifest` are served with
  `Cache-Control: no-cache`; hashed `/assets/*` are immutable.
- `workbox.globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']` — precached
  app shell.
- `runtimeCaching`: `NetworkFirst` for `GET /api/(walkers|schedule|weights|pet)`
  (5 s timeout, last data when offline); `CacheFirst` for `/uploads/*` (30 days).
  Mutations bypass the SW cache and go through the `outbox` queue.
- Build version: `<package.json version> · <UTC build time>` is injected at
  build time via Vite `define` (`__APP_VERSION__`, `__APP_BUILD_ID__`) and shown
  at the bottom of the Pet tab in the device's local time.
- Weight sheet: date picker defaulting to today + numeric input
  (`inputMode="decimal"`, mask from `lib/weightInput.ts`, dot only).
- Pet photo: client-side downscale (~1200px) before upload, then cached by SW.
  Offline photo selection is rejected immediately with a message; queued weight
  and pet mutations are still supported.
- Outbox flush: permanent 4xx failures (except 401/408/429) drop the entry and
  continue; network/5xx/auth errors stop and keep the queue. A dropped-entry
  count is shown in a dismissible sync bar. After the flush, and whenever the
  browser comes back online, all data is refreshed.
- `walkRevision` increments after a successful "today" change; the month view
  refetches on that signal, so its day colors update without a reload.

## 4. Configuration and repo hygiene

`.env` (from `.env.example`) holds `APP_PASSWORD`, `JWT_SECRET`,
`JWT_EXPIRES_IN`, `WEB_PORT`, and `APP_TIMEZONE` (`Asia/Yekaterinburg` in
production). Compose maps `APP_TIMEZONE` to `TZ` for the API container.

In git: `docker-compose.yml`, Dockerfiles, `nginx.conf`, `.env.example`, code,
migrations, generated PNG icons. Never in git: `.env`, `*.sqlite*`, `/data/*`,
real photos/names/passwords, `design/` (already git-ignored), `node_modules/`,
`dist/`. Recommended `.gitignore` additions: `.env`, `*.db`, `*.sqlite*`,
`uploads/`, `dist/`, `node_modules/`.

## 5. Non-goals / future

New features will appear later; modules are split (`walkers`, `weights`, `pet`,
`schedule`, `auth`) so new domains can be added without touching the queue logic.
No multi-user support, no per-day manual assignment, no logout flow.
