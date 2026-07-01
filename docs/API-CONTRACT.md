# API Contract — PawWalk v0

This is the single source of truth for the HTTP API. The iOS app, Android app, and (later) the landing page all consume it. When the contract changes, change it **here first**, then update the backend and clients in the same commit.

- **Base URL (dev):** `http://localhost:8000`
- **Format:** JSON, `Content-Type: application/json`
- **Auth:** `Authorization: Bearer <token>` — real JWT, issued by `POST /auth/login` or `/auth/signup`
- **Interactive docs:** the backend auto-generates OpenAPI at `/docs` (Swagger UI) and `/openapi.json`.

> Because FastAPI generates `/openapi.json` from the Pydantic models, this document and the live schema should always agree. If they drift, the backend wins — regenerate clients from `/openapi.json`.

---

## Core resources

### Health
```
GET /health  →  200 { "status": "ok", "version": "0.1.0" }
```

### Auth
```
POST /auth/signup  { email, password, name, role? } → 201 AuthResponse
POST /auth/login   { email, password }              → 200 AuthResponse | 401
GET  /auth/me      (Bearer)                          → 200 User | 401
```
```jsonc
// User
{ "id": "usr_123", "email": "jane@example.com", "name": "Jane Doe", "role": "owner", "created_at": "2026-06-26T19:00:00Z" }

// AuthResponse
{ "access_token": "eyJ...", "token_type": "bearer", "user": { /* User */ } }
```
`role` is `"owner"` (default) or `"walker"` — clients show the matching experience after login.
Signing up as a `walker` also creates a public walker profile (below), so owners can book them.
`POST /auth/signup` returns `409` if the email is already registered. Owner-only routes return
`403` for walkers and vice-versa.

### Pets  (owner only)
```
POST   /pets            → 201 Pet
GET    /pets            → 200 [Pet]        (current owner's)
DELETE /pets/{pet_id}   → 204 | 404
```
```jsonc
// Pet
{ "id": "pet_123", "name": "Mochi", "breed": "Shiba Inu", "age_years": 3, "weight_kg": 9.4, "notes": "", "created_at": "…" }
```
The booking form picks one of these to fill `dog_name` — `bookings` is unchanged.

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
All endpoints below require a valid Bearer token. Bookings are scoped to the
caller — `GET /bookings` only lists the caller's own, and `{booking_id}` reads
and cancels 404 if the booking belongs to someone else.
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

### Walker workflow  (walker only)
```
GET  /walkers/me                     → 200 Walker            // own profile
PATCH /walkers/me { bio?, price_per_30min_cents?, neighborhoods? } → 200 Walker
GET  /bookings/assigned              → 200 [Booking]         // walks assigned to me
POST /bookings/{id}/accept           → 200 Booking           // pending  → confirmed
POST /bookings/{id}/decline          → 200 Booking           // pending  → cancelled
POST /bookings/{id}/start            → 200 Booking           // confirmed → in_progress
POST /bookings/{id}/complete         → 200 Booking           // in_progress → completed
```
Transitions require the caller to be the **assigned** walker (`404` otherwise) and the
booking to be in the right start state (`409` otherwise). Owner still has
`POST /bookings/{id}/cancel` (pending/confirmed → cancelled).

### Payments
Requires a valid Bearer token; 404 if the booking isn't the caller's.
```
POST /payments/intent         → 200 { "client_secret": "...", "amount_cents": 1800 }
```
Returns a real Stripe `PaymentIntent` client secret when `PAWWALK_STRIPE_SECRET_KEY` is configured server-side; otherwise returns an offline stub (`pi_stub_...`) so the mobile clients still work without Stripe set up. Same response shape either way — clients don't need to know which mode is active.

```
POST /payments/webhook        → 200 { "received": true }
```
Stripe-only (configure this URL in the Stripe dashboard, not called by mobile clients). Verifies the `Stripe-Signature` header against `PAWWALK_STRIPE_WEBHOOK_SECRET` — 400 if unconfigured or the signature is invalid. On `payment_intent.succeeded`, flips the matching booking to `confirmed`.

### Owner home stats  (owner only)
Real numbers for the Home screen — computed from completed bookings and their
recorded GPS tracks.
```
GET /bookings/stats  (Bearer)  → 200 OwnerStats
```
```jsonc
// OwnerStats
{
  "distance_km": 2.7,              // total tracked distance across completed walks
  "streak_days": 2,                // consecutive days (UTC) with a completed walk
  "recent_walks": [                // newest first, max 3
    {
      "booking_id": "bkg_…",
      "dog_name": "Mochi",
      "walker_name": "Sam Rivera",
      "start_time": "2026-06-30T18:00:00Z",
      "duration_minutes": 45,
      "distance_km": 1.36,
      "sparkline": [0.6, 1.0, 0.8, 0.7, 0.9, 0.4]   // per-segment distance profile, 0..1; [] if no GPS track
    }
  ]
}
```

### Waitlist  (public, no auth)
Landing-page signups. Body never reveals whether the email was already listed.
```
POST /waitlist { "email": "you@example.com" }  → 201 { "status": "ok" }   // 200 on repeat
```

### Live GPS tracking
Real-time walk tracking. The walker's device publishes GPS fixes; the owner
subscribes and sees them live. Both endpoints and the socket admit the booking's
**owner or the assigned walker's login** (`404`/`4404` for anyone else).
```
GET /bookings/{booking_id}/track  (Bearer)  → 200 [Position]   // path recorded so far
WS  /ws/track/{booking_id}?token=<JWT>                          // live channel
```
```jsonc
// Position
{ "lat": 37.7749, "lng": -122.4194, "recorded_at": "2026-07-06T15:03:11Z" }
```
WebSocket protocol (JSON frames):
- On connect the server sends the history: `{ "type": "history", "points": [Position, …] }`
- Client → server (walker publishing a fix): `{ "type": "position", "lat": 37.77, "lng": -122.42 }`
- Server → all subscribers (owner + walker): `{ "type": "position", "lat", "lng", "recorded_at" }`
- Auth is the `?token=` query param (WebSockets can't set an `Authorization` header from native clients). Bad/missing token closes with `4401`; a caller who is neither the booking's owner nor its assigned walker closes with `4404`.

Positions persist to a `positions` table. On Postgres a PostGIS `geog` column is
kept in sync by a trigger (migration `0002`) so spatial queries are ready; on
SQLite the plain `lat`/`lng` are used, so the feature works with zero setup too.

```
POST /bookings/{booking_id}/simulate  (Bearer)  → 202 { "status": "started", "points": N }
```
Demo helper — replays a deterministic ~300 m walking route into the live channel
(publishes to the same hub + `positions` table a real walker would), so you can
see movement on a stationary simulator without walking around with a phone.

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
