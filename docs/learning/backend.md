# Backend Learning Track — FastAPI · LangGraph · Pydantic AI

A modern, typed Python backend with an AI booking assistant. Maps to [`apps/backend`](../../apps/backend). You said you're new to all three frameworks — this track starts from Python typing and builds up.

## Prerequisites

- Python 3.12 and `uv` (`curl -LsSf https://astral.sh/uv/install.sh | sh`).
- `cd apps/backend && uv sync && uv run fastapi dev` → http://localhost:8000/docs.

## Mental model

Three layers, each teachable on its own:
1. **Pydantic** — typed data models that validate themselves.
2. **FastAPI** — turns typed functions into an HTTP API (with free docs).
3. **LangGraph + Pydantic AI** — the AI assistant: an explicit state machine whose "thinking" step returns *typed* data.

## Module 1 — Python typing & Pydantic (week 1)

Type hints (`str | None`, `list[X]`, `Literal`), then Pydantic `BaseModel` — validation, parsing, `Enum`, `Field`.

- **In the repo:** [`app/schemas.py`](../../apps/backend/app/schemas.py) — every request/response is a Pydantic model. `Duration = Literal[30, 45, 60]` makes invalid durations impossible. `BookingStatus(str, Enum)` is a closed set.
- **Resource:** Pydantic docs "Models" page.
- **Exercise:** add a `max_length` constraint to `CreateBookingRequest.notes` with `Field(max_length=280)` and watch FastAPI return `422` when it's exceeded.

## Module 2 — FastAPI (weeks 2–3, Phase 1)

Routers, path/query/body params, response models, dependency injection, automatic OpenAPI.

- **In the repo:** [`app/main.py`](../../apps/backend/app/main.py) wires routers; [`app/routers/`](../../apps/backend/app/routers) has one file per resource. Note how `response_model=` drives both validation and the docs. [`app/config.py`](../../apps/backend/app/config.py) shows typed settings via `pydantic-settings`.
- **Exercise (Phase 1):** add `GET /walkers/{walker_id}/availability` returning sample time slots. See it appear in `/docs` automatically.
- **Concept to nail:** the Pydantic models *are* the contract — `/openapi.json` is generated, and the iOS/Android clients mirror it.

## Module 3 — Async & the request lifecycle (alongside Phase 2)

`async def`, `await`, when async helps (I/O-bound), and testing with `TestClient`.

- **In the repo:** [`tests/test_api.py`](../../apps/backend/tests/test_api.py) — fully offline endpoint tests. Run `uv run pytest`.
- **Exercise:** write a test for your new availability endpoint.

## Module 4 — Databases (weeks 6–7, Phase 3)

Replace the in-memory store with Postgres. Learn SQLModel/SQLAlchemy + Alembic migrations.

- **In the repo:** [`app/data.py`](../../apps/backend/app/data.py) is deliberately isolated behind functions (`list_walkers`, `create_booking`, …). Swap its body for real DB queries and **nothing else changes** — that's the lesson.
- **Exercise (Phase 3):** model `Walker` and `Booking` as SQLModel tables, add a migration, and point `data.py` at the DB.

## Module 5 — The AI assistant: LangGraph + Pydantic AI (week 11, Phase 6)

This is the headline. Read these two files closely:

- **[`app/assistant/intent.py`](../../apps/backend/app/assistant/intent.py)** — a **Pydantic AI** `Agent(model, output_type=BookingIntent)`. Setting `output_type` forces the LLM to return data matching our schema (it retries until valid), so downstream code is type-safe. There's a heuristic fallback so it runs with no API key.
- **[`app/assistant/graph.py`](../../apps/backend/app/assistant/graph.py)** — a **LangGraph** `StateGraph`: `parse_intent → find_walkers → draft_booking → END`. Each node is a small function `state -> partial state`. Modeling the conversation as a graph (not one mega-prompt) makes each step testable and extendable.

**How they fit:** LangGraph is the *orchestration* (the steps and their order); Pydantic AI is the *typed brain* inside the one step that needs an LLM.

- **Turn on the real LLM:** copy `.env.example` to `.env`, set `PAWWALK_LLM_MODEL=openai:gpt-4o-mini` (or an Anthropic model) and the matching provider key.
- **Exercises (Phase 6), in order:**
  1. Add `dog_name` extraction to the heuristic parser, then compare against the LLM agent.
  2. Add a **conditional edge**: if `dog_name` is missing after parsing, route to a new `ask_followup` node instead of `draft_booking`.
  3. Give the agent a **tool** (Pydantic AI `@agent.tool`) that checks walker availability, so it only suggests free walkers.
  4. Add conversation memory so the assistant remembers earlier turns.

## Milestones checklist

- [ ] Pydantic models + validation comfortable
- [ ] New endpoint added + showing in `/docs` (Phase 1)
- [ ] A passing test you wrote yourself
- [ ] Postgres + migrations replacing `data.py` (Phase 3)
- [ ] Understand `intent.py` and `graph.py` line by line
- [ ] Added a conditional edge + a tool to the agent (Phase 6)

## Best free resources

- **FastAPI docs** (fastapi.tiangolo.com) — the tutorial is excellent and the framework's gold standard.
- **Pydantic AI docs** (ai.pydantic.dev) — read "Agents" and "Results/Output."
- **LangGraph docs** (langchain-ai.github.io/langgraph) — the "Low-level concepts" + "Quickstart."
