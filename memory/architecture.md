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

## 2. Backend (Nest.js, strict TypeScript)

```
backend/
  src/
    main.ts            # /api prefix, global ValidationPipe, SQLite WAL
    app.module.ts
    config/            # env validation (APP_PASSWORD, JWT_SECRET, DATA_DIR)
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
DELETE /api/weights/:id

GET    /api/pet                   -> { name, birthDate, photoUrl }
PUT    /api/pet                   { name?, birthDate? }
POST   /api/pet/photo             multipart (jpg/png/webp, <= 5 MB) -> { photoUrl }
DELETE /api/pet/photo
```

Weight validation (both sides): `date` is `YYYY-MM-DD`, not further than tomorrow;
`kg` is a number with max 1 decimal place, 1–150, rounded server-side.

## 3. Frontend (React + TypeScript + Vite PWA)

```
frontend/
  src/
    api/client.ts      # fetch wrapper: Bearer token, 401 handling
    api/cache.ts       # last-good snapshots (localStorage/IndexedDB)
    api/outbox.ts      # offline mutation queue, flush on 'online'
    hooks/             # useWalkers, useWeights, usePet, useOnline
    lib/queue.ts       # client-side rotation mirror for instant UI
    lib/age.ts         # age calc + Russian pluralization
    lib/weightInput.ts # mask: digits + single dot only
    components/        # LockScreen, Header, TabBar,
                       # HomeTab, MonthTab, WeightTab, PetTab,
                       # WeightSheet, WalkersSheet
    App.tsx            # tab state (no router needed for 4 tabs)
  vite.config.ts       # vite-plugin-pwa
  nginx.conf           # static dist/ + proxy /api -> api:3000
  Dockerfile
  public/icons/        # icon-192.png, icon-512.png
```

PWA (`vite-plugin-pwa`, `generateSW`, `registerType: 'autoUpdate'`):

- `manifest`: name/short_name/description, `theme_color`, icons 192/512,
  `display: 'standalone'`.
- `workbox.globPatterns: ['**/*.{js,css,html,ico,png,svg}']` — precached app shell.
- `runtimeCaching`: `NetworkFirst` for `GET /api/*` and `/uploads/*` (offline shows
  last data + photo); `NetworkOnly` for mutations, which additionally go through
  the `outbox` queue and show a "pending sync" state.
- Weight sheet: date picker defaulting to today + numeric input
  (`inputMode="decimal"`, mask from `lib/weightInput.ts`, dot only).
- Pet photo: client-side downscale (~1200px) before upload, then cached by SW.

## 4. Configuration and repo hygiene

In git: `docker-compose.yml`, Dockerfiles, `nginx.conf`, `.env.example`, code,
migrations, generated PNG icons. Never in git: `.env`, `*.sqlite*`, `/data/*`,
real photos/names/passwords, `design/` (already git-ignored), `node_modules/`,
`dist/`. Recommended `.gitignore` additions: `.env`, `*.db`, `*.sqlite*`,
`uploads/`, `dist/`, `node_modules/`.

## 5. Non-goals / future

New features will appear later; modules are split (`walkers`, `weights`, `pet`,
`schedule`, `auth`) so new domains can be added without touching the queue logic.
No multi-user support, no per-day manual assignment, no logout flow.
