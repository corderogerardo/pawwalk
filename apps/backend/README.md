# PawWalk Backend — FastAPI · LangGraph · Pydantic AI

The API that the iOS, Android, and web clients all talk to. Implements the contract in [`../../docs/API-CONTRACT.md`](../../docs/API-CONTRACT.md).

## Run it

```bash
# from apps/backend
cp .env.example .env
# edit .env — at minimum set PAWWALK_JWT_SECRET (see Configuration below)
uv sync                 # create .venv and install deps
uv run fastapi dev      # http://localhost:8000  (auto-reload)
```

Or via Docker (no local Python/uv toolchain needed — `compose.yaml` sets a dev-only JWT secret for you):

```bash
docker compose up --build
```

Then open **http://localhost:8000/docs** — FastAPI generates interactive Swagger docs from the Pydantic models. Try `POST /assistant/chat` with `{ "message": "walker in the Mission for 60 minutes tomorrow at 3pm" }`.

```bash
uv run pytest           # run the test suite
uv run ruff check .     # lint
```

> **uv** is the package/ved manager (think: faster pip + venv + pip-tools in one). `uv sync` reads `pyproject.toml`, resolves everything, and writes a lockfile. `uv run X` runs `X` inside the project venv.

## Configuration

All settings are env vars prefixed `PAWWALK_` (see `app/config.py`), loaded from a `.env` file or the real environment. Copy `.env.example` to `.env` to start.

| Var | Required | Default | Notes |
|---|---|---|---|
| `PAWWALK_DATABASE_URL` | no | `sqlite:///./pawwalk.db` | SQLAlchemy URL. See "Running against Postgres" below. |
| `PAWWALK_JWT_SECRET` | **yes** | — | No default on purpose — startup fails loudly if unset. `python -c "import secrets; print(secrets.token_hex(32))"` to generate one. |
| `PAWWALK_JWT_ALG` | no | `HS256` | |
| `PAWWALK_JWT_EXPIRE_MINUTES` | no | `10080` (7 days) | |
| `PAWWALK_CORS_ORIGINS` | no | `http://localhost:3000,http://127.0.0.1:3000` | Comma-separated. Only matters for browser clients (native iOS/Android don't send an Origin header). |
| `PAWWALK_STRIPE_SECRET_KEY` | no | unset | When set, `/payments/intent` creates real Stripe PaymentIntents instead of an offline stub. |
| `PAWWALK_STRIPE_WEBHOOK_SECRET` | no | unset | Required for `/payments/webhook` to accept Stripe events (signature-verified). |
| `PAWWALK_LLM_MODEL` | no | unset | e.g. `openai:gpt-4o-mini`. Enables the real Pydantic AI agent for the booking assistant; without it, a heuristic parser is used. |

## Running against Postgres

SQLite is the local default; switching to Postgres is a one-line change — the same SQLModel code runs against either:

```bash
PAWWALK_DATABASE_URL=postgresql+psycopg://user:password@host:5432/pawwalk
```

`psycopg[binary]` (psycopg 3) is already a dependency, so no extra driver install is needed. Tables are created automatically on startup (`init_db()` in `app/db.py`, called from the lifespan handler) — there's no separate migration step yet (see "Known gaps" below).

## Running in production

`fastapi dev` is dev-only (auto-reload, verbose logging). For production:

```bash
uv run fastapi run app/main.py --port 8000      # single process, sane prod defaults
# or, for multiple worker processes behind a process manager:
uv run gunicorn -k uvicorn.workers.UvicornWorker -w 4 app.main:app --bind 0.0.0.0:8000
```

Set `PAWWALK_DATABASE_URL` to your Postgres instance, a real `PAWWALK_JWT_SECRET`, `PAWWALK_CORS_ORIGINS` to your actual web origins, and Stripe keys if payments are live. `compose.yaml` in this directory is dev-only (bind-mounts source, runs `fastapi dev`) — don't use it as-is in production.

## Layout

```
app/
├── main.py          # FastAPI app + router wiring + /health + lifespan (init_db + seed)
├── config.py        # typed settings (pydantic-settings)
├── schemas.py       # Pydantic models == the API contract
├── db.py            # SQLModel engine + session dependency + init_db()
├── models_db.py      # SQLModel table definitions (Walker/Booking/User)
├── data.py          # DB-backed data access (one function per query/mutation)
├── seed.py          # idempotent dev seed data for the walkers table
├── security.py       # password hashing + JWT encode/decode
├── deps.py            # get_current_user FastAPI dependency
├── routers/         # one file per resource (auth, walkers, bookings, payments, assistant)
└── assistant/
    ├── intent.py    # text → typed BookingIntent (heuristic + Pydantic AI agent)
    └── graph.py     # LangGraph state machine: parse → search → draft
tests/test_api.py    # TestClient-based, fully offline (throwaway SQLite DB per run)
```

## How the three pieces fit together

- **FastAPI** owns the HTTP layer. Every endpoint takes/returns a Pydantic model, which gives you validation (`422` on bad input) and the OpenAPI schema for free.
- **LangGraph** structures the booking assistant as an explicit state machine (`app/assistant/graph.py`) instead of one giant prompt. Each node is a small, testable function. This is where you add steps like "ask a follow-up if the dog's name is missing."
- **Pydantic AI** powers the one node that needs an LLM — intent parsing (`app/assistant/intent.py`). `Agent(model, output_type=BookingIntent)` forces the model's answer into our schema, so everything downstream stays type-safe.

## Enabling the real AI assistant

It works **without** an API key (a heuristic parser handles common phrasings). To switch on the LLM agent, set `PAWWALK_LLM_MODEL` (see Configuration above) and export the matching provider key, e.g. `OPENAI_API_KEY`. Restart the server. `extract_intent()` will now call the Pydantic AI agent and fall back to the heuristic if anything goes wrong.

## Known gaps / next up

- No Alembic migrations yet — schema changes rely on `create_all()`, which only adds new tables, never alters existing ones. Add Alembic once the schema settles (see `docs/IMPLEMENTATION-PLAN.md` B12). **Until then:** after changing a column in `app/models_db.py`, delete the dev DB and restart so the schema is rebuilt — `rm apps/backend/pawwalk.db && docker compose restart backend`. (Skipping this shows up as `500 … no such column`.)
- No rate limiting on `/auth/login` — fine for a learning project, not for anything internet-facing.

## Roadmap (see Notion board)

1. ~~**Phase 1** — swap `data.py` for a real database (SQLModel) + user-scoped queries.~~ Done (SQLite by default; Postgres is a connection-string change, see above). Alembic migrations still open.
2. ~~**Phase 2** — auth: sign-up/login, JWT, user-scoped bookings.~~ Done.
3. ~~**Phase 3** — real Stripe `PaymentIntent` behind `/payments/intent`, plus a webhook to confirm bookings.~~ Done.
4. **Phase 4** — grow the LangGraph agent (follow-up questions, tools, memory); live GPS tracking.
