# Testing and verification

The repo currently has no lint or automated test scripts. Verification is
build-based plus manual/UI smoke checks.

## Build

- Backend: `cd backend && npm run build` (`nest build`).
- Frontend: `cd frontend && npm run build` (`tsc` + `vite build`; also generates
  the PWA service worker).
- Run `git diff --check` before committing.

## Docker smoke test

- `docker compose up --build -d`.
- `docker compose ps` — `api` is healthy and `web` is published on `WEB_PORT`.
- `curl -fsS -o /dev/null -w '%{http_code}' http://localhost:$WEB_PORT/` -> `200`.
- `curl -fsS -o /dev/null -w '%{http_code}' http://localhost:$WEB_PORT/api/health` -> `200`.

`WEB_PORT` comes from `.env`; it is deployment-specific and must never be
hardcoded in docs, config, or code.

## UI checks

Use headless Playwright/Chrome and check at least mobile (390px), tablet (768px),
and desktop (1200px) widths.

- Layout: content column max 576px and centered; side background `#f5ead8`; the
  tabbar spans the full viewport with its buttons in a centered 576px container;
  no horizontal scroll (`document.documentElement.scrollWidth === innerWidth`).
- Tabbar: icons stay outline + muted on both active and inactive tabs.
- Title: `document.title` equals the pet name once loaded, and `Питомец` while
  locked or before the name is known.
- Weight: the create sheet is unchanged; tapping a row opens a prefilled edit
  sheet; the red delete button sits below Save; the header shows `Изменение`;
  the oldest row shows a gray `0 кг` badge; a date collision shows the 409
  message.
- Pet: the age banner title is `Возраст`, and the age value uses a single
  `16px`/`600` style.
- Auth: obtain a token with `POST /api/auth/login` using `APP_PASSWORD`; never
  print the password or token to logs. Remove temporary token files afterwards.

## Test data

- Use temporary weight entries on dates not used by real data, then delete them
  after the check.
- Confirm cleanup with `GET /api/weights`.
- Never put real names, photos, or passwords into test fixtures, commits, or docs.
