# Architecture

## The big picture

```
┌─────────────┐   ┌─────────────┐        ┌──────────────────────────┐
│  iOS app    │   │ Android app │        │  Landing (Next.js)       │
│ SwiftUI     │   │  Compose    │        │  marketing + waitlist    │
└──────┬──────┘   └──────┬──────┘        └────────────┬─────────────┘
       │ HTTPS/JSON      │ HTTPS/JSON                 │ HTTPS/JSON
       └────────┬────────┴──────────────┬────────────┘
                │                        │
          ┌─────▼────────────────────────▼─────┐
          │        Backend API (FastAPI)        │
          │  /walkers /bookings /payments       │
          │  /assistant  ── LangGraph graph ──┐ │
          │                                   │ │
          │   Pydantic AI agent (typed) ◄─────┘ │
          └──────────────────┬──────────────────┘
                             │
                     ┌───────▼────────┐   ┌──────────────┐
                     │  Database       │   │   Stripe     │
                     │ (SQLModel;      │   │  payments    │
                     │  SQLite/Postgres)│  │              │
                     └─────────────────┘   └──────────────┘
```

The three clients are thin: they render UI and call the API defined in [API-CONTRACT.md](API-CONTRACT.md). All business logic lives in the backend, which is the only thing that talks to the database, the payment processor, and the LLM.

## Why these choices

- **Native iOS & Android (not cross-platform).** The explicit goal is to *learn* both platforms deeply. Swift/SwiftUI and Kotlin/Compose are the modern, first-party ways to do that. A shared API contract keeps the two clients in sync without sharing code.
- **FastAPI backend.** Typed (Pydantic) request/response models give you a free OpenAPI schema that the clients are generated against. Async by default.
- **LangGraph + Pydantic AI for the assistant.** LangGraph models the booking conversation as an explicit state machine (parse → search → draft → confirm). Pydantic AI gives each LLM call a *typed* output so the rest of the code stays type-safe. You learn agent orchestration and typed AI together.
- **Next.js landing.** Server-rendered marketing site with great SEO; can later host a web dashboard.

## Phasing (high level — full board in Notion)

1. **Phase 0 — Scaffolding (done).** All four apps run with stubbed data.
2. **Phase 1 — Real domain (done).** SQLModel-backed database (SQLite locally, Postgres via a connection-string change — see `apps/backend/README.md`), real walkers/bookings, validation. Alembic migrations still open.
3. **Phase 2 — Auth & profiles (done).** Sign-up, JWT, user-scoped bookings — backend, iOS, and Android all wired end-to-end.
4. **Phase 3 — Payments (done).** Real Stripe PaymentIntents behind `/payments/intent` (falls back to an offline stub when no Stripe key is configured) plus a webhook that confirms bookings on `payment_intent.succeeded`.
5. **Phase 4 — AI assistant & GPS.** Grow the LangGraph agent; live walk tracking.

## Repo conventions

- Trunk-based: short-lived branches → PR → `main`.
- Commit messages scoped by app: `ios:`, `android:`, `backend:`, `landing:`, `docs:`.
- The API contract changes **before** the code that implements it.
