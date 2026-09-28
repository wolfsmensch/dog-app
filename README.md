<p align="center">
  <img src="assets/readme-icon.png" width="150" height="150" alt="Иконка приложения" />
</p>

<h1 align="center">dog-app</h1>

<p align="center">
  PWA-приложение для учёта очереди выгула собаки, её возраста и веса.
</p>

Приложение для двух человек, без регистрации — вход через общий пароль
(первый экран). Интерфейс ориентирован на мобильные устройства,
устанавливается как PWA и работает офлайн (показывает последние
синхронизированные данные, изменения отправляет при появлении сети).

Стек: React + TypeScript (frontend), Nest.js + TypeScript (backend),
SQLite, Docker Compose. HTTPS настраивается на nginx хоста, а не в проекте.

## Быстрый запуск (боевой сервер)

```bash
cp .env.example .env
# Отредактируй .env: задай APP_PASSWORD, JWT_SECRET и WEB_PORT
# (80-й порт на боевом сервере занят, выбери свободный, например 8081)
nano .env

docker compose up --build -d
```

Открой `http://<сервер>:<WEB_PORT>` и введи пароль один раз — на этом
устройстве приложение останется авторизованным (токен в `localStorage`).

## Структура

- `frontend/` — React PWA (Vite). Раздаётся через nginx, запросы `/api/*`
  и `/uploads/*` проксируются в backend.
- `backend/` — Nest.js API (префикс `/api`), SQLite в `/data/app.sqlite`,
  загрузки в `/data/uploads`.
- `memory/` — детальная документация проекта для AI-сессий (`architecture.md`,
  `roadmap.md`, `decisions.md`, `design.md`, на английском языке).
- `AGENTS.md` — точка входа для агентов (ссылается на `memory/`).
- `design/` — прототип дизайна из Claude Design, только визуальный ориентир,
  исключён из git.

## Конфигурация

Все секреты живут в `.env` (не коммитится, см. `.env.example`):

| Переменная       | Назначение                                              |
| ---------------- | ------------------------------------------------------- |
| `APP_PASSWORD`   | общий пароль приложения (первый экран)                  |
| `JWT_SECRET`     | длинная случайная строка для подписи токенов            |
| `JWT_EXPIRES_IN` | время жизни токена (по умолчанию `365d`, кнопки выхода нет) |
| `WEB_PORT`       | публичный порт сервиса `web` (например, `8081`)         |

## Полезные команды

```bash
docker compose ps                    # статус контейнеров
docker compose logs -f api           # логи backend
docker compose down                  # остановить (данные в вольюмах сохранятся)
docker compose down -v               # остановить И удалить базу и загрузки
```

## Бэкап

База данных и фотографии живут в Docker-вольюмах (`sqlite-data`,
`uploads-data`). Пример бэкапа:

```bash
docker run --rm -v dog-app_sqlite-data:/data -v "$PWD:/out" \
  alpine tar czf /out/backup-sqlite.tgz -C /data .
docker run --rm -v dog-app_uploads-data:/data -v "$PWD:/out" \
  alpine tar czf /out/backup-uploads.tgz -C /data .
```

## Локальная разработка (без Docker)

Backend:

```bash
cd backend && npm install
APP_PASSWORD=dev JWT_SECRET=devsecret DATA_DIR=./data npm run start:dev
```

Frontend (запросы `/api` и `/uploads` проксируются на `localhost:3000`):

```bash
cd frontend && npm install && npm run dev
```
