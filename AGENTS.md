# AGENTS.md — dog-app

> Documentation language: this file and everything under `memory/` is kept in **English**.
> Exception: `README.md` is kept in **Russian** (user-facing project docs).
> Communication language: always communicate with the user strictly in **Russian**.

## Project in brief

PWA web app for tracking a dog's walk queue, age, and weight. Two real users, no
registration. Single shared password gate (first screen), password stored in the
backend `.env`. Mobile-first, installable PWA with offline read access to the last
synced data. Public GitHub repo — no personal data (names, photos) in git.

Stack: React (TypeScript) frontend, Nest.js (TypeScript) backend, SQLite database,
Docker Compose orchestration (`docker compose up`). HTTPS is terminated by the
host nginx, not by this project.

## Detailed context (other sessions start here)

Detailed project description lives in the `memory/` directory:

- `memory/architecture.md` — full application architecture (services, backend
  modules, DB schema, API contracts, frontend structure, PWA/offline strategy,
  Docker setup).
- `memory/roadmap.md` — step-by-step implementation plan.
- `memory/decisions.md` — confirmed product decisions and constraintsLog (source of
  truth when docs disagree).
- `memory/design.md` — analysis of the Claude Design prototype (`design/`, git-ignored):
  screen structure, functions, and how they connect.
- `memory/testing.md` — build, Docker smoke-test, UI verification, and test-data
  cleanup workflow.

Always read `memory/decisions.md` first, then `memory/architecture.md` for the task
at hand. Use `memory/testing.md` when verifying a change. The `design/` directory
is a visual reference only, not implementation source, and is excluded from git.

## Key constraints

- All code strictly in TypeScript. DB: SQLite (WAL mode). No complex data structures.
- Single shared password auth: `APP_PASSWORD` in backend `.env` (never in git),
  verified via `POST /api/auth/login` returning a long-lived JWT; client keeps the
  token in `localStorage`. No logout button (confirmed).
- Walk queue = cyclic auto-rotation anchored at "who walks today" (no per-day manual
  assignment). Max 10 walkers (enforced client- and server-side).
- Weight entries: default date = today; decimal separator is a dot only; input mask
  allows digits and one dot only; one record per date (upsert); tapping a row edits
  its kg/date, and deletion lives inside that edit sheet. A date collision is
  rejected (409).
- Pet photo is uploaded to the backend (`/data/uploads`) and cached by the PWA;
  offline mutations go into an outbox queue and sync when online.
- External `web` service port comes from `.env` (`WEB_PORT`), because port 80 on the
  real server is occupied. Never hardcode the public port.
- Frontend and backend run only as Docker containers via Docker Compose. Never run
  either of them directly on the host machine.
- PWA icons: `frontend/public/icons/icon-192.png` and `icon-512.png` (generated from
  the raw photo; source JPG is NOT in the repo).
- Public repo hygiene: no real names/photos/passwords in git. Seed data is neutral
  (`Pet`, empty lists). `design/` stays git-ignored.
- `README.md` is maintained in Russian; all other repo docs (`AGENTS.md`,
  `memory/`) stay in English.

## Git workflow

- Commit after every logically complete set of changes, not once at the end of a
  multi-step plan. Each self-contained fix, feature, or docs update gets its own
  commit.
- Use a concise commit message that matches the repo style.
- Push only when the user explicitly asks for a push.

## Memory policy (persist context across sessions)

If there is information that must survive across sessions:

- Put it in `AGENTS.md` only if it is critically important about the project as a
  whole or a standing constraint on the AI agent (languages, auth model, privacy,
  port-from-env rule, memory policy itself).
- Put everything else that is too detailed for `AGENTS.md` into `memory/` as
  Markdown (decisions, architecture details, plans, design notes). Update the
  relevant `memory/*.md` file in the same change that introduces the new decision.
