# Roadmap (full implementation plan)

Each step ends in a verifiable state. Do not start a step until the previous one
is verified. Code is TypeScript only; no personal data in git at any step.

## Step 0 — Repo skeleton and memory (this change)

- [x] `AGENTS.md` + `memory/` docs (architecture, roadmap, decisions, design).
- [x] PWA icons `frontend/public/icons/icon-192.png`, `icon-512.png` from the raw photo.
- [ ] Extend `.gitignore`: `.env`, `*.db`, `*.sqlite*`, `uploads/`, `dist/`, `node_modules/`
      (keep `design/` ignored).
- Verify: `git status` clean after commit; icons open as valid PNGs.

## Step 1 — Docker Compose + env contract

- [ ] Root `docker-compose.yml` with `api` (build `./backend`, `env_file: .env`,
      volumes `sqlite-data:/data`, `uploads-data:/data/uploads`) and `web`
      (build `./frontend`, `ports: ["${WEB_PORT:-8080}:80"]`, `depends_on: [api]`).
- [ ] Root `.env.example` (`APP_PASSWORD=`, `JWT_SECRET=`, `JWT_EXPIRES_IN=365d`,
      `WEB_PORT=8080`, `DATA_DIR=/data`). Real `.env` never committed.
- [ ] `backend/Dockerfile` (Node 22 LTS, production install, `node dist/main`).
- [ ] `frontend/Dockerfile` + `nginx.conf` (serve `dist/`, `proxy_pass /api/` to
      `http://api:3000`, cache headers for hashed assets, never cache `index.html`/SW).
- Verify: `docker compose config` renders the port from `.env`;
  `docker compose up --build -d` starts both containers (placeholder apps OK).

## Step 2 — Backend foundation (Nest.js + SQLite)

- [ ] Scaffold Nest.js app, `/api` global prefix, global `ValidationPipe`
      (whitelist, transform), SQLite via TypeORM + `better-sqlite3`, WAL mode
      (`PRAGMA journal_mode=WAL`), `DATA_DIR` respected.
- [ ] `GET /api/health` (no auth) + Docker `healthcheck` on it.
- [ ] Neutral seed on boot: `pet('Pet')`, empty walkers/weights, `walk_state` row.
- Verify: `GET /api/health -> { ok: true }`; DB file appears under `/data`;
  restart keeps data (volume).

## Step 3 — Auth (shared password + JWT)

- [ ] `POST /api/auth/login { password } -> { accessToken }` (`timingSafeEqual`
      against `APP_PASSWORD`, `@nestjs/jwt` signed with `JWT_SECRET`, 365d expiry).
- [ ] Global `JwtAuthGuard` exempting `auth/login` and `health`. 401 shape stable.
- Verify: correct password -> 200 + token; wrong -> 401; authed `GET /api/walkers`
  works, unauthed -> 401.

## Step 4 — Walkers + schedule (queue)

- [ ] Entities `walkers`, `walk_state`; CRUD per `architecture.md` §2.4 with
      class-validator DTOs; max-10 and last-walker guards; color regex; position
      ordering.
- [ ] Rotation service: anchor + lazy roll-forward + `PUT /schedule/today`;
      `GET /schedule/week|month` computed schedules.
- Verify (API-level): create 2 walkers, set today, `week` shows alternation;
  11th create -> 400; delete-until-one -> 400 on last; restart + next-day logic.

## Step 5 — Weights

- [ ] Entity `weights` (unique `date`); `GET list`, `POST upsert {date, kg}`,
      `DELETE :id`; validation: date format, not-future, kg 1–150, 1 decimal,
      server-side rounding.
- Verify: post today -> 200; repost same date overwrites (no duplicate);
  backdated post works; delete works; invalid (`12,6`, `abc`, `0`, future) -> 400.

## Step 6 — Pet + photo

- [ ] Singleton `pet` row; `GET/PUT /api/pet` (name 1–50, birthDate valid past date).
- [ ] `POST /api/pet/photo` (multer, 5 MB, jpg/png/webp, safe filename) served via
      static `/uploads/`; `DELETE /api/pet/photo`.
- Verify: upload -> `photoUrl` loads; re-upload replaces; delete clears;
  files persist in the uploads volume.

## Step 7 — Frontend shell + auth screen (React + TS + Vite)

- [ ] Scaffold Vite React-TS app matching the design system (bg `#f5ead8`, cards
      `#fbf6ec`, text `#201e1d`, accent `#FFA500`, Roboto, 390px mobile column).
- [ ] `LockScreen` per design (password input, `Войти`, error hint); token in
      `localStorage`; `api/client.ts` attaches Bearer, handles 401.
- [ ] `Header` (dog name + avatar) + `TabBar` (Главная/Месяц/Вес/Питомец).
- Verify: wrong password shows hint; correct stores token and opens cached home
  after reload without re-login.

## Step 8 — Tabs + sheets (design parity)

- [ ] `HomeTab` (age card, weight card + `+`, today banner, week grid, legend,
      edit button), `MonthTab` (month pager + calendar + legend),
      `WeightTab` (dynamics SVG chart + entry rows with delta badges),
      `PetTab` (avatar picker, name, birth date, current-age banner).
- [ ] `WeightSheet` (date defaults to today + dotted weight mask) and
      `WalkersSheet` (set-today, rename, recolor via 10-color palette, add,
      delete, `Готово`).
- [ ] Client mirrors: `lib/queue.ts`, `lib/age.ts` (Russian plurals),
      `lib/weightInput.ts` (digits + single dot).
- Verify: click-through of all 4 tabs + both sheets matches `memory/design.md`;
  walker rename/recolor/today-select updates week/month instantly.

## Step 9 — PWA + offline

- [ ] `vite-plugin-pwa` (`generateSW`, `autoUpdate`, manifest + icons from
      `public/icons/`); `runtimeCaching` per `architecture.md` §3.
- [ ] `api/cache.ts` last-good snapshots + offline badge; `api/outbox.ts` queue
      with flush on `online` + "pending sync" indicator.
- Verify (DevTools offline): reload shows last data + photo; mutations queue and
  sync on reconnect; Lighthouse PWA checks pass (installable, icons, SW).

## Step 10 — Hardening and handover

- [ ] Neutral seed check (`grep` for real names/photos/passwords -> nothing);
      `README.md` run instructions (`cp .env.example .env`, edit `WEB_PORT`,
      `docker compose up --build -d`); server backup note (volumes).
- [ ] Smoke test on a clean clone with a custom `WEB_PORT` (e.g. 8081).
- Verify: fresh machine + edited `.env` -> full app in two containers, no 80-port
  conflict, data survives `docker compose down/up` (volumes kept).
