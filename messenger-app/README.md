# Messenger App — Full‑Stack Real‑Time Chat (FastAPI, React, Postgres, Docker)

A production‑style **messenger MVP** showcasing a clean full‑stack setup: FastAPI + PostgreSQL on the backend, React + TypeScript + Vite on the frontend, and Nginx as the entry gateway. Everything runs **via Docker Compose** and a **Makefile** driving common tasks (build, run, migrate, lint).

> **Why this project is relevant**
>
> * Mirrors a typical junior full‑stack stack (Python/FastAPI, React, PostgreSQL, Docker).
> * Emphasizes readable code, small commits, and DX (one‑command setup, typed APIs, linters, pre‑commit).
> * Designed for learning and teamwork: clear architecture, Makefile, and docs to help others run it quickly.

---

## Features

* **Auth:** Registration/Login using OAuth2 Password Flow with **JWT access tokens** (PyJWT), passwords hashed with **bcrypt**.
* **1‑to‑1 conversations** with unique pair constraint (one dialog per user pair).
* **Messages** with text and **multi‑file attachments**; pagination, **edit**, and **soft‑delete**.
* **Realtime** via FastAPI **WebSocket** (`/ws`) — receive new/updated/deleted messages live.
* **File storage** locally under `/uploads`, served by Nginx via **X‑Accel‑Redirect**.
* **Migrations:** Alembic. **Quality:** ruff, black, isort, mypy; **pre‑commit hooks**.
* **Frontend:** Tailwind + shadcn/ui, React Query, small Zustand store for auth/UI/socket.

---

## Repository Layout

```
./
├── messenger-app
│   ├── README.md
│   ├── docker-compose.yml
│   ├── Makefile
│   ├── .env.example
│   ├── .pre-commit-config.yaml
│   ├── api/
│   │   ├── Dockerfile
│   │   ├── pyproject.toml
│   │   ├── .env.example
│   │   ├── alembic.ini
│   │   ├── alembic/
│   │   │   ├── env.py
│   │   │   └── versions/
│   │   │       ├── 5f34d0a0c24f_create_users.py
│   │   │       ├── be1d7d5318f9_create_conversations_messages_.py
│   │   │       ├── 0b42f9d50e8f_add_messages_conv_created_index.py
│   │   │       └── a58300d40bad_fix_user_id_to_uuid.py
│   │   └── app/
│   │       ├── main.py, deps.py, ws.py
│   │       ├── core/ (config.py, db.py, security.py)
│   │       ├── models/ (user.py, conversation.py, message.py, attachment.py)
│   │       ├── routers/ (auth.py, conversations.py, messages.py, users.py)
│   │       ├── schemas/ (auth.py, user.py, conversation.py, message.py)
│   │       └── services/ (auth.py, storage.py)
│   ├── nginx/
│   │   ├── Dockerfile
│   │   └── nginx.conf
│   └── web/
│       ├── Dockerfile, package.json, vite.config.ts, tailwind.config.cjs, etc.
│       └── src/
│           ├── api/ (client.ts, auth.ts, conversations.ts, messages.ts)
│           ├── components/ (AttachmentItem.tsx, MessageItem.tsx, Navbar.tsx)
│           ├── hooks/ (useConversationWS.ts)
│           ├── pages/ (auth/, chats/, dialog/, profile/)
│           └── store/ (auth.ts)
```

---

## Architecture

```
[ Browser (React/Vite) ]
        │
        ▼
[        Nginx        ]  — reverse proxy, static hosting, /uploads via X-Accel-Redirect
   │             │
   │ /api        │ /ws
   ▼             ▼
[ FastAPI (Uvicorn) ]  — REST + WebSocket, business logic, validation
        │
        ▼
[ PostgreSQL ]    — SQLAlchemy ORM + Alembic migrations
[ /uploads  ]     — local file storage (mounted volume)
```

* **WebSocket** is plain FastAPI (`websockets`), no socket.io — stays close to the stack.
* **Access control** enforced at REST and WS layers: a user must belong to the conversation.

---

## Data Model (MVP)

**users**: `id (uuid)`, `email (unique)`, `username (unique)`, `password_hash`, `created_at`.

**conversations**: `id (uuid)`, `user_a (fk)`, `user_b (fk)`, `created_at`; **unique index** on ordered pair `LEAST(user_a,user_b), GREATEST(user_a,user_b)`.

**messages**: `id (uuid)`, `conversation_id (fk)`, `sender_id (fk)`, `content (nullable)`, `edited_at (nullable)`, `deleted_at (nullable)`, `created_at`.

**attachments**: `id (uuid)`, `message_id (fk)`, `filename`, `mime`, `size_bytes`, `storage_key`, `created_at`.

> Optional: `refresh_tokens` with `jti`, `expires_at`, `revoked` (for rotation in the "plus" version).

---

## REST API (via Nginx)

Base URL: `http://localhost/api`

### Auth

* `POST /auth/register` → `{ email, username, password }` → user + tokens (201) or 409.
* `POST /auth/token` (OAuth2 Password flow; `application/x-www-form-urlencoded`) → `{ access_token, token_type: "bearer" }`.
* `POST /auth/refresh` (if enabled) → new `{ access_token }`.

### Users

* `GET /users/me` — current user by Bearer token.
* `GET /users/search?q=` — case‑insensitive search for starting a chat.

### Conversations

* `POST /conversations` — `{ peer_id }` → create or return existing 1:1 conversation.
* `GET /conversations` — user’s conversations list (MVP: without unread counts).

### Messages

* `GET /conversations/{id}/messages?cursor=&limit=50` — paginate upwards (cursor by time/ID).
* `POST /conversations/{id}/messages` — `multipart/form-data`: `content` (optional), `files[]` (0..N). Limits: **≤ 10 MB/file**; MIME whitelist: `image/*`, `application/pdf`, `text/plain`, `application/zip`.
* `PATCH /messages/{id}` — `{ content }` (author only), sets `edited_at`.
* `DELETE /messages/{id}` — soft delete, sets `deleted_at`.

### Attachments

* `GET /attachments/{id}` — file is served via Nginx (`X-Accel-Redirect`).

#### Curl examples

```bash
# Register
curl -X POST http://localhost/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"a@example.com","username":"alice","password":"secret"}'

# Login
AT=$(curl -s -X POST http://localhost/api/auth/token \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'username=alice&password=secret' | jq -r .access_token)

# Create conversation
curl -H "Authorization: Bearer $AT" -H 'Content-Type: application/json' \
  -d '{"peer_id":"<uuid>"}' http://localhost/api/conversations

# Send message with a file
curl -H "Authorization: Bearer $AT" \
  -F 'content=hi' -F 'files[]=@./doc.pdf' \
  http://localhost/api/conversations/<cid>/messages
```

---

## WebSocket API

Endpoint: `ws://localhost/ws?token=<JWT>&conversation_id=<UUID>`

Events (`type` + `payload`):

* `message:new` — a new message arrived.
* `message:update` — content/edited\_at changed.
* `message:delete` — message soft‑deleted.
* *(plus version)* `presence:typing` (start/stop) and simple heartbeat for online presence.

**Auth & Errors**

* Invalid token → **4401**; user not in conversation → **4403**.
* Server sends keep‑alive pings; client handles auto‑reconnect with backoff.

---

## Environment Variables

### Root (`messenger-app/.env`)

* `COMPOSE_PROJECT_NAME=messenger`
* `POSTGRES_USER=app`, `POSTGRES_PASSWORD=app`, `POSTGRES_DB=app`, `POSTGRES_PORT=5432`

### API (`messenger-app/api/.env`)

* `DATABASE_URL=postgresql+psycopg://app:app@db:5432/app`
* `JWT_SECRET=change-me`, `JWT_ALG=HS256`, `ACCESS_TOKEN_EXPIRE_MINUTES=30`
* `API_CORS_ORIGINS=http://localhost`
  Supports comma‑separated string **or** JSON array.
* `UPLOAD_DIR=/uploads`

### Web (`messenger-app/web/.env`)

* `VITE_API_URL=http://localhost/api`
* `VITE_WS_URL=ws://localhost/ws`

Examples available as `/.env.example`, `/api/.env.example`, `/web/.env.example`.

---

## Run with Docker (recommended)

> **All database operations (migrations, revisions) are executed *through Docker*. Do not run local Alembic against the host DB.**

```bash
# 1) Copy envs
cp messenger-app/.env.example messenger-app/.env
cp messenger-app/api/.env.example messenger-app/api/.env
cp messenger-app/web/.env.example messenger-app/web/.env

# 2) Bring the stack up
make up

# 3) Apply migrations (inside API container via Makefile)
make migrate

# 4) Follow logs
make logs

# 5) Stop & remove containers
make down
```

* Frontend → `http://localhost`
* REST API → `http://localhost/api`

> For large uploads adjust `client_max_body_size` in `nginx/nginx.conf`.

---

## Local Dev without Docker (optional)

**Backend**

```bash
cd messenger-app/api
python -m venv .venv && source .venv/bin/activate
pip install -e .
uvicorn app.main:app --reload --port 8000
```

**Frontend**

```bash
cd messenger-app/web
npm i
npm run dev
```

Set `VITE_API_URL=http://localhost:8000` and `VITE_WS_URL=ws://localhost:8000/ws` accordingly.

---

## Database Migrations (Alembic)

```bash
# Create a new revision (runs Alembic inside the API container)
make alembic-revision message="add something"

# Apply all migrations
make migrate

# Roll back last migration
make alembic-downgrade
```

---

## Makefile Targets

* `make up` — build & up the stack
* `make down` — stop & remove containers
* `make logs` — tail logs
* `make migrate` — `alembic upgrade head` inside API container
* `make alembic-revision` — create Alembic revision (pass `message="..."`)
* `make lint-api` / `make lint-web` — linters
* `make format-api` / `make format-web` — formatters

---

## Security & Access Control

* Bearer JWT required for protected REST/WS endpoints.
* For any conversation fetch/WS connect the user **must be** one of `{user_a, user_b}`.
* Passwords hashed with `passlib[bcrypt]`.
* File validation (size ≤ 10 MB; MIME whitelist).
* Soft delete policy: clients render a "deleted" placeholder instead of removing the item.
* Nginx rate limit (`limit_req zone=api`) as a simple abuse protection.
* CORS strictly controlled via env (`API_CORS_ORIGINS`).

---

## Frontend Overview

* **Auth**: registration/login, token persisted in a small Zustand store.
* **Chats**: conversations list with last message and time.
* **Dialog**: virtualized list, upward infinite scroll; textarea + drag’n’drop multi‑upload with inline previews.
* **Profile**: minimal user page.
* **Realtime**: `useConversationWS` handles tokenized WS, backoff reconnect, ping/pong.

> Styling with Tailwind + shadcn/ui; data fetching with React Query; routing with React Router.

---

## File Storage

* Uploads via REST (`multipart/form-data`).
* Stored locally in `UPLOAD_DIR` (default `/uploads`).
* Served by Nginx using `X‑Accel‑Redirect` (internal path).

**Plus‑version plan**: switch to MinIO (S3‑compatible) with presigned PUT URLs; store object key/etag in DB.

---

## Code Quality & pre‑commit

Hooks: `ruff`, `black`, `isort`, `mypy`, `forbid-print`, `end-of-file-fixer`.

```bash
pip install pre-commit
pre-commit install
pre-commit run --all-files
```

> Example: `ruff` error **F841** indicates an assigned but unused variable — clean up the binding.

---

## License

MIT License

---

## Contact

artyashchenko.wrk@gmail.com
