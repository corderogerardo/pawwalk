# API Contract — PawWalk v0

This is the single source of truth for the HTTP API. The iOS app, Android app, and (later) the landing page all consume it. When the contract changes, change it **here first**, then update the backend and clients in the same commit.

- **Base URL (dev):** `http://localhost:8000`
- **Format:** JSON, `Content-Type: application/json`
- **Auth:** `Authorization: Bearer <token>` (stubbed in v0 — any non-empty token is accepted)
- **Interactive docs:** the backend auto-generates OpenAPI at `/docs` (Swagger UI) and `/openapi.json`.

> Because FastAPI generates `/openapi.json` from the Pydantic models, this document and the live schema should always agree. If they drift, the backend wins — regenerate clients from `/openapi.json`.

---

## Core resources

### Health
```
GET /health  →  200 { "status": "ok", "version": "0.1.0" }
```

### Walkers
```
GET /walkers                  → 200 [Walker]
GET /walkers/{walker_id}      → 200 Walker | 404
```
```jsonc
// Walker
{
  "id": "wlk_123",
  "name": "Sam Rivera",
  "photo_url": "https://…",
  "rating": 4.9,
  "price_per_30min_cents": 1800,
  "bio": "10 yrs with dogs. Loves huskies.",
  "neighborhoods": ["Mission", "SoMa"]
}
```

### Bookings
```
POST /bookings                → 201 Booking
GET  /bookings                → 200 [Booking]      (current user's)
GET  /bookings/{booking_id}   → 200 Booking | 404
POST /bookings/{booking_id}/cancel → 200 Booking
```
```jsonc
// CreateBookingRequest  (POST body)
{
  "walker_id": "wlk_123",
  "dog_name": "Cooper",
  "start_time": "2026-07-01T15:00:00Z",
  "duration_minutes": 30,          // 30 | 45 | 60
  "notes": "Pulls on the leash a bit."
}

// Booking  (response)
{
  "id": "bkg_456",
  "walker_id": "wlk_123",
  "dog_name": "Cooper",
  "start_time": "2026-07-01T15:00:00Z",
  "duration_minutes": 30,
  "status": "pending",             // pending | confirmed | in_progress | completed | cancelled
  "price_cents": 1800,
  "created_at": "2026-06-26T19:00:00Z"
}
```

### Payments (stubbed in v0)
```
POST /payments/intent         → 200 { "client_secret": "...", "amount_cents": 1800 }
```
v0 returns a fake client secret so the mobile clients can build the checkout UI. Phase 3 swaps this for a real Stripe PaymentIntent — the response shape stays the same.

### AI booking assistant (LangGraph + Pydantic AI)
```
POST /assistant/chat          → 200 AssistantReply
```
```jsonc
// AssistantChatRequest
{ "message": "Find me a walker in the Mission for my husky tomorrow at 3pm" }

// AssistantReply
{
  "reply": "I found 2 walkers in the Mission free at 3pm…",
  "suggested_walkers": ["wlk_123"],
  "draft_booking": {                 // null if the agent isn't ready to book
    "walker_id": "wlk_123",
    "dog_name": null,
    "start_time": "2026-07-01T15:00:00Z",
    "duration_minutes": 30
  }
}
```
The assistant is a small **LangGraph** state machine. One node parses intent with a **Pydantic AI** agent (typed output), another node queries available walkers, a third drafts a booking. This is the piece you'll grow the most while learning the AI stack.

---

## Conventions

- **IDs** are opaque strings with a type prefix (`wlk_`, `bkg_`, `usr_`). Never assume they're integers.
- **Money** is always integer **cents**, never floats. Format on the client.
- **Timestamps** are ISO-8601 UTC (`Z` suffix). Clients convert to local time for display.
- **Errors** use a consistent body: `{ "detail": "human-readable message" }` with the right HTTP status (`400/401/404/422`). FastAPI returns `422` automatically for validation failures.
- **Enums** (`status`, `duration_minutes`) are closed sets — clients should model them as enums so the compiler catches unhandled cases.

## How each client consumes this

- **iOS** mirrors these as `Codable` structs in `Models/`. See `apps/ios`.
- **Android** mirrors these as Kotlin `data class`es with `kotlinx.serialization`. See `apps/android`.
- **Backend** *is* the source — these come from Pydantic models in `app/schemas.py`. See `apps/backend`.
