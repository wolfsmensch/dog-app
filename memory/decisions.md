# Decisions Log (source of truth)

All items below are explicitly confirmed by the user. When any other doc
disagrees with this file, this file wins.

## Product

1. Two real users, no registration. Single shared password gate on the first
   screen. Password is entered once, then the client keeps the token in
   `localStorage` for subsequent authorizations.
2. No logout button. No "sign out" flow is designed or implemented.
3. Public GitHub repo: no personal data in git — no real names, photos,
   or passwords. Seed data is neutral (`Pet`, empty walker/weight lists).
   The `design/` directory stays git-ignored (it contains real names/photo).

## Walk queue

4. Cyclic auto-rotation anchored at "who walks today". There is an ordered
   walker list plus an anchor `(todayWalkerId, todayDate)`. Any date `D` maps to
   `list[(index(todayWalkerId) + (D - todayDate)) mod n]`. No per-day manual
   assignment; tapping a person sets them as "today", which shifts the whole
   schedule.
5. Max 10 walkers, enforced both client- and server-side. Palette of 10 colors
   matches the limit.

## Weight tracking

6. New entry defaults to the current date (device-local date).
7. Decimal separator is a dot only. The weight input accepts digits and a single
   dot only; commas are rejected (or auto-replaced with a dot plus a hint).
   One decimal place, range 1–150 kg.
8. One record per date (upsert by date). New entries default to today; existing
   entries are edited by tapping their row, which opens the same sheet with the
   current weight and date prefilled. The edit sheet has a red delete button
   below Save; the create sheet has no delete button. Moving an entry to a date
   that already has another entry is rejected (409, "На эту дату уже есть
   замер"). The oldest entry has nothing to compare with, so it shows a gray
   `0 кг` delta badge; the former "first measurement" label is removed. This
   extends the design prototype, which only had "today + overwrite".

## Photo and offline

9. Pet photo is uploaded to the backend (`/data/uploads`) and cached by the PWA.
   Offline mutations (weight, walkers, pet) go into an outbox queue on the client
   and sync when the connection returns. Offline mode otherwise shows the last
   synced data.

## Platform and ops

10. Frontend: current React (TypeScript). Backend: Nest.js (TypeScript). DB:
    SQLite (WAL mode). No complex data structures.
11. The app runs only via Docker Compose: `docker compose up --build -d` starts
    the whole app on the real server. Frontend and backend must never be run
    directly on the host machine. HTTPS/SSL is handled by the host nginx, not by
    this project.
12. The external `web` service port comes from `.env` (`WEB_PORT`), because port
    80 on the real server is occupied by other services. Operators must be able
    to set a different port before starting the app. Never hardcode the public
    port.
13. PWA icons are generated PNGs in `frontend/public/icons/` (`icon-192.png`,
    `icon-512.png`). The raw source photo (`~/downloads/icon.jpg`) is NOT
    committed to the repo.
14. The document title follows the pet name once it is known and falls back to
    `Питомец` before that (including the initial page load).

## Documentation

15. `AGENTS.md` and all `memory/*.md` files are kept in English. Communication
    with the user is strictly in Russian.
