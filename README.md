# dog-app

PWA for tracking a dog's walk queue, age, and weight. Two users, no
registration — a single shared password gate. Mobile-first, installable,
works offline (shows last synced data, queues mutations).

Stack: React + TypeScript (frontend), Nest.js + TypeScript (backend),
SQLite, Docker Compose. HTTPS is terminated by the host nginx.

## Quick start (real server)

```bash
cp .env.example .env
# Edit .env: set APP_PASSWORD, JWT_SECRET and WEB_PORT
# (port 80 is occupied on the real server, pick a free one, e.g. 8081)
nano .env

docker compose up --build -d
```

Open `http://<server>:<WEB_PORT>`, enter the password once — the app stays
logged in on that device (token in `localStorage`).

## Layout

- `frontend/` — React PWA (Vite). Served by nginx, `/api/*` and `/uploads/*`
  are proxied to the backend.
- `backend/` — Nest.js API (`/api` prefix), SQLite at `/data/app.sqlite`,
  uploads at `/data/uploads`.
- `memory/` — detailed project docs for AI sessions (`architecture.md`,
  `roadmap.md`, `decisions.md`, `design.md`).
- `AGENTS.md` — agent entry point (points at `memory/`).
- `design/` — Claude Design prototype, git-ignored visual reference only.

## Configuration

All secrets live in `.env` (never committed, see `.env.example`):

| Variable       | Meaning                                              |
| -------------- | ---------------------------------------------------- |
| `APP_PASSWORD` | shared app password (first screen)                   |
| `JWT_SECRET`   | long random string for signing tokens                |
| `JWT_EXPIRES_IN` | token lifetime (`365d` by default — no logout button) |
| `WEB_PORT`     | public port of the `web` service (e.g. `8081`)       |

## Useful commands

```bash
docker compose ps                    # container status
docker compose logs -f api           # backend logs
docker compose down                  # stop (data volumes are kept)
docker compose down -v               # stop AND wipe database + uploads
```

## Backup

The database and photos live in Docker volumes (`sqlite-data`,
`uploads-data`). Back them up, e.g.:

```bash
docker run --rm -v dog-app_sqlite-data:/data -v "$PWD:/out" \
  alpine tar czf /out/backup-sqlite.tgz -C /data .
docker run --rm -v dog-app_uploads-data:/data -v "$PWD:/out" \
  alpine tar czf /out/backup-uploads.tgz -C /data .
```

## Local development (without Docker)

Backend:

```bash
cd backend && npm install
APP_PASSWORD=dev JWT_SECRET=devsecret DATA_DIR=./data npm run start:dev
```

Frontend (proxies `/api` and `/uploads` to `localhost:3000`):

```bash
cd frontend && npm install && npm run dev
```
