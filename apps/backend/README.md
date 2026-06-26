# PawWalk Backend — FastAPI · LangGraph · Pydantic AI

The API that the iOS, Android, and web clients all talk to. Implements the contract in [`../../docs/API-CONTRACT.md`](../../docs/API-CONTRACT.md).

## Run it

```bash
# from apps/backend
uv sync                 # create .venv and install deps
uv run fastapi dev      # http://localhost:8000  (auto-reload)
```

Then open **http://localhost:8000/docs** — FastAPI generates interactive Swagger docs from the Pydantic models. Try `POST /assistant/chat` with `{ "message": "walker in the Mission for 60 minutes tomorrow at 3pm" }`.

```bash
uv run pytest           # run the test suite
uv run ruff check .     # lint
```

> **uv** is the package/ved manager (think: faster pip + venv + pip-tools in one). `uv sync` reads `pyproject.toml`, resolves everything, and writes a lockfile. `uv run X` runs `X` inside the project venv.

## Layout

```
app/
├── main.py          # FastAPI app + router wiring + /health
├── config.py        # typed settings (pydantic-settings)
├── schemas.py       # Pydantic models == the API contract
├── data.py          # in-memory store (Phase 1 → Postgres)
├── routers/         # one file per resource (walkers, bookings, payments, assistant)
└── assistant/
    ├── intent.py    # text → typed BookingIntent (heuristic + Pydantic AI agent)
    └── graph.py     # LangGraph state machine: parse → search → draft
tests/test_api.py    # TestClient-based, fully offline
```

## How the three pieces fit together

- **FastAPI** owns the HTTP layer. Every endpoint takes/returns a Pydantic model, which gives you validation (`422` on bad input) and the OpenAPI schema for free.
- **LangGraph** structures the booking assistant as an explicit state machine (`app/assistant/graph.py`) instead of one giant prompt. Each node is a small, testable function. This is where you add steps like "ask a follow-up if the dog's name is missing."
- **Pydantic AI** powers the one node that needs an LLM — intent parsing (`app/assistant/intent.py`). `Agent(model, output_type=BookingIntent)` forces the model's answer into our schema, so everything downstream stays type-safe.

## Enabling the real AI assistant

It works **without** an API key (a heuristic parser handles common phrasings). To switch on the LLM agent:

```bash
cp .env.example .env
# set in .env:
PAWWALK_LLM_MODEL=openai:gpt-4o-mini      # or anthropic:claude-3-5-haiku-latest
# and export the provider key Pydantic AI needs:
export OPENAI_API_KEY=sk-...
```

Restart the server. `extract_intent()` will now call the Pydantic AI agent and fall back to the heuristic if anything goes wrong.

## Roadmap (see Notion board)

1. **Phase 1** — swap `data.py` for Postgres (SQLModel) + Alembic migrations.
2. **Phase 2** — auth: sign-up/login, JWT, user-scoped bookings.
3. **Phase 3** — real Stripe `PaymentIntent` behind `/payments/intent`.
4. **Phase 4** — grow the LangGraph agent (follow-up questions, tools, memory).
