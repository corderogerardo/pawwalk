# PawWalk — Implementation Plan (Auth + Backend Completion)

A task-by-task checklist sized for one Sonnet 5 agent per task. Each task lists
the **files** it touches, **what to do**, and a **check** (the smallest thing
that proves it works). Hand an agent one task at a time, in order.

> **Status (2026-07-01):** the checkboxes below are **stale** — Slices 0–3 are
> largely shipped and were verified against the Docker backend on 2026-07-01.
> See **[docs/FUNCTIONAL-REVIEW.md](FUNCTIONAL-REVIEW.md)** for the screen-by-screen
> results, the P0 bug that was found + fixed (stale DB missing `bookings.user_id`,
> because migrations B12 aren't done), and new to-dos **N1–N9** (profile screen,
> real Home data, persistent nav, real Stripe, assistant screen, live-tracking data).

## Recommended sequencing — vertical slices, backend-first within each slice

You asked whether to do all-backend-first or interleave backend↔frontend.
**Interleave by feature slice, backend-first inside the slice.** Reasons:

- The backend today has **no database and no user model** — auth has nowhere to
  store a user. So there's one unavoidable backend-only prerequisite (Slice 0)
  before any auth work.
- After that, each feature (auth, bookings, payments) ships as a vertical slice:
  backend endpoint → iOS → Android. You always have a working endpoint before
  building the client against it, and you see one feature working end-to-end
  before starting the next (good for a learning repo).

```
Slice 0  Data foundation        backend only        ← prerequisite for everything
Slice 1  Auth (login/sign up)   backend → iOS → Android   ← your headline ask
Slice 2  Bookings (persisted,   backend → iOS → Android
         user-scoped)
Slice 3  Payments (real Stripe) backend → iOS → Android
Slice 4  Hardening & deploy     backend (+ small client touches)
```

Landing-page auth is **optional** and deferred (the site only has a waitlist
today). iOS + Android are the project's focus, so they're in the critical path.

### Library choices (picked to be the lazy-correct default; swap if you prefer)

- **DB / ORM:** SQLModel (FastAPI author's lib, Pydantic v2 native) on **SQLite**
  locally. Same code runs on Postgres later by changing only the connection URL.
- **Schema management:** start with `create_all()` (zero config); add Alembic
  (Task B12) once the schema starts churning.
- **Password hashing:** `pwdlib[bcrypt]` (what current FastAPI docs use).
- **JWT:** `PyJWT` (small, maintained).
- **Payments:** official `stripe` Python SDK, test mode.
- **Token storage:** iOS Keychain; Android EncryptedSharedPreferences. Never
  store a token in plaintext UserDefaults / SharedPreferences.

> Convention reminder (from `docs/ARCHITECTURE.md`): **change `API-CONTRACT.md`
> first**, then the backend, then the clients — ideally in the same commit.

---

## Slice 0 — Data foundation (backend only)

Replaces the in-memory `data.py` with a real DB, without changing the router or
schema layers. This is the whole point of `data.py` already being a seam.

- [ ] **B1 — Add dependencies & settings for the DB.**
  - Files: `apps/backend/pyproject.toml`, `apps/backend/app/config.py`, `apps/backend/.env.example`
  - Do: add `sqlmodel` to `dependencies`. Add `database_url: str = "sqlite:///./pawwalk.db"` to `Settings` (env `PAWWALK_DATABASE_URL`). Add the var to `.env.example`. Add `pawwalk.db` to `.gitignore`.
  - Check: `uv sync` succeeds; `python -c "from app.config import settings; print(settings.database_url)"` prints the sqlite URL.

- [ ] **B2 — Create the DB engine + session dependency.**
  - Files: `apps/backend/app/db.py` (new)
  - Do: create the SQLModel `engine` from `settings.database_url` (with `connect_args={"check_same_thread": False}` for SQLite), a `get_session()` FastAPI dependency that yields a `Session`, and an `init_db()` that calls `SQLModel.metadata.create_all(engine)`.
  - Check: `python -c "from app.db import init_db; init_db()"` creates `pawwalk.db` with no error.

- [ ] **B3 — Define SQLModel tables for Walker and Booking.**
  - Files: `apps/backend/app/models_db.py` (new)
  - Do: `WalkerTable` and `BookingTable` as `SQLModel, table=True`, mirroring the fields in `schemas.py`. Keep the API Pydantic models in `schemas.py` as the response/request shapes (don't expose table models directly). Store `neighborhoods` as a JSON column or a comma-joined string (note which).
  - Check: `init_db()` creates both tables (`sqlite3 pawwalk.db ".tables"` lists them).

- [ ] **B4 — Rewrite `data.py` to use the DB session.**
  - Files: `apps/backend/app/data.py`, callers in `app/routers/*.py`
  - Do: change each function (`list_walkers`, `get_walker`, `find_walkers`, `create_booking`, `list_bookings`, `get_booking`, `cancel_booking`) to take a `Session` and query the tables. Update the routers to depend on `get_session` and pass it through. Keep the same return types (`Walker`, `Booking` from `schemas.py`) so nothing downstream changes.
  - Check: existing `tests/test_api.py` still passes after Task B5 seeds data (`uv run pytest`).

- [ ] **B5 — Seed walkers + call `init_db` on startup.**
  - Files: `apps/backend/app/main.py`, `apps/backend/app/seed.py` (new)
  - Do: on FastAPI startup (lifespan handler), call `init_db()` then `seed_walkers()` which inserts the 3 sample walkers **only if the table is empty** (idempotent). Move the 3 sample walkers into `seed.py`.
  - Check: start the server, `GET /walkers` returns the 3 seeded walkers; restart and it's still 3 (not 6).

- [ ] **B6 — Make the test suite DB-aware.**
  - Files: `apps/backend/tests/test_api.py`, `apps/backend/tests/conftest.py` (new)
  - Do: a pytest fixture that points `PAWWALK_DATABASE_URL` at a throwaway SQLite file (or `sqlite:///:memory:` with a shared engine), runs `init_db()` + seed before tests, and tears down after. Ensure tests don't depend on a booking-count starting at 0 across runs.
  - Check: `uv run pytest` is green on a clean checkout and on re-run.

---

## Slice 1 — Auth (login / sign up)  ← headline ask

### Backend

- [ ] **B7 — Contract: add the auth section to `API-CONTRACT.md`.**
  - Files: `docs/API-CONTRACT.md`
  - Do: document the endpoints and shapes below. Update the "Auth" line at the top from "stubbed" to "real JWT".
    ```
    POST /auth/signup  { email, password, name }      → 201 AuthResponse
    POST /auth/login   { email, password }            → 200 AuthResponse | 401
    GET  /auth/me      (Bearer)                        → 200 User | 401
    // User          { id: "usr_…", email, name, created_at }
    // AuthResponse  { access_token, token_type: "bearer", user: User }
    ```
  - Check: doc reads cleanly; IDs use the `usr_` prefix already reserved in the conventions section.

- [ ] **B8 — Add auth deps, settings, and User table + schemas.**
  - Files: `pyproject.toml`, `app/config.py`, `.env.example`, `app/models_db.py`, `app/schemas.py`
  - Do: add `pwdlib[bcrypt]` and `pyjwt` deps. Add settings `jwt_secret: str`, `jwt_alg: str = "HS256"`, `jwt_expire_minutes: int = 60*24*7` (env-overridable; secret has NO default — fail loudly if unset in non-dev). Add `UserTable` (id, email **unique**, name, password_hash, created_at). Add Pydantic `User`, `SignupRequest`, `LoginRequest`, `AuthResponse` to `schemas.py`.
  - Check: `init_db()` creates the `usertable`; importing the new schemas works.

- [ ] **B9 — Password + JWT helpers.**
  - Files: `apps/backend/app/security.py` (new)
  - Do: `hash_password`, `verify_password` (pwdlib), `create_access_token(user_id)` and `decode_token(token)` (PyJWT, `sub`=user id, `exp`). Small and pure.
  - Check: a `__main__` self-check: hash→verify round-trips True/False; encode→decode returns the same `sub`.

- [ ] **B10 — Auth router + `get_current_user` dependency.**
  - Files: `apps/backend/app/routers/auth.py` (new), `apps/backend/app/main.py`, `apps/backend/app/deps.py` (new)
  - Do: implement `/auth/signup` (reject duplicate email with 409), `/auth/login` (401 on bad creds), `/auth/me`. Add `get_current_user(session, token=Depends(oauth2/Bearer))` in `deps.py` that decodes the token and loads the user (401 if missing/invalid). Register the router in `main.py`.
  - Check: new tests — signup→200 with token; login wrong password→401; `/auth/me` with the token→the user; with no token→401. `uv run pytest`.

- [ ] **B11 — Scope bookings to the authenticated user.**
  - Files: `app/models_db.py` (add `user_id` to `BookingTable`), `app/data.py`, `app/routers/bookings.py`, `docs/API-CONTRACT.md`
  - Do: add `user_id` to bookings. `POST /bookings` and all `/bookings` reads now require `get_current_user`; create attaches `user_id`; `GET /bookings` returns only the caller's; `get`/`cancel` 404 (or 403) if the booking isn't theirs. Note the auth requirement in the contract.
  - Check: tests — user A creates a booking; user B's `GET /bookings` doesn't see it; B cannot cancel A's booking.

- [ ] **B12 — (Optional) Add Alembic migrations.** *(do only once the schema settles)*
  - Files: `apps/backend/alembic/…`, `apps/backend/alembic.ini`, README note
  - Do: `alembic init`, point it at `settings.database_url` and the SQLModel metadata, generate the initial migration, switch startup from `create_all()` to "run migrations".
  - Check: `alembic upgrade head` builds the schema from scratch on a fresh DB.

### iOS

- [ ] **iOS1 — Auth models + APIClient methods.**
  - Files: `apps/ios/PawWalk/Models/Models.swift`, `apps/ios/PawWalk/Services/APIClient.swift`
  - Do: add `User`, `AuthResponse`, `SignupRequest`, `LoginRequest` Codable structs (CodingKeys for snake_case). Add a generic private `post(_:body:)` and a private `authorizedRequest` helper to `APIClient`; add `signup`, `login`, `me` methods. Add a stored bearer token the client attaches as `Authorization: Bearer …`.
  - Check: project compiles (`xcodegen generate` + build, or `swift build` of the module if set up).

- [ ] **iOS2 — Keychain token store.**
  - Files: `apps/ios/PawWalk/Services/TokenStore.swift` (new)
  - Do: tiny Keychain wrapper — `save(token:)`, `read() -> String?`, `clear()`. No third-party dep; use `Security` framework. APIClient reads the token from here.
  - Check: a `#Preview`/unit check or a quick in-app round-trip: save → read returns same → clear → read nil.

- [ ] **iOS3 — Auth session (observable) + gate the app.**
  - Files: `apps/ios/PawWalk/Services/AuthSession.swift` (new), `apps/ios/PawWalk/ContentView.swift`, `apps/ios/PawWalk/PawWalkApp.swift`
  - Do: an `@Observable`/`ObservableObject` `AuthSession` with `currentUser`, `signedIn`, and `signUp/logIn/logOut/restore` calling APIClient + TokenStore. In `ContentView`, show `AuthView` when signed out, else `HomeView`. Call `restore()` on launch.
  - Check: launch signed-out shows auth; after login the app shows Home; relaunch stays logged in (token restored).

- [ ] **iOS4 — Login / Sign-up screen.**
  - Files: `apps/ios/PawWalk/Features/Auth/AuthView.swift` (new)
  - Do: one screen toggling Login ↔ Sign Up (email, password, +name on signup), validation, loading + error states, calls `AuthSession`. Match the existing Brand/Theme tokens and HUD style.
  - Check: invalid creds shows the error; valid login transitions to Home. (Backend running.)

- [ ] **iOS5 — Logout + send token on booking calls.**
  - Files: `apps/ios/PawWalk/Features/…` (a settings/profile entry point), `APIClient.swift`
  - Do: a logout affordance that calls `AuthSession.logOut()`. Ensure booking endpoints (when added in Slice 2) send the bearer token. Handle a `401` by logging out.
  - Check: logout returns to the auth screen; the stored token is cleared.

### Android

- [ ] **A1 — Auth models + API methods.**
  - Files: `apps/android/app/src/main/java/com/pawwalk/android/data/Models.kt`, `.../data/PawWalkApi.kt`
  - Do: `@Serializable` `User`, `AuthResponse`, `SignupRequest`, `LoginRequest`. Add `@POST("auth/signup")`, `@POST("auth/login")`, `@GET("auth/me")` to the Retrofit interface.
  - Check: project compiles (`./gradlew :app:compileDebugKotlin`).

- [ ] **A2 — Encrypted token store + auth interceptor.**
  - Files: `apps/android/app/src/main/java/com/pawwalk/android/data/TokenStore.kt` (new), `.../data/WalkerRepository.kt` (or a new `Network.kt`), `app/build.gradle.kts`
  - Do: add `androidx.security:security-crypto` (EncryptedSharedPreferences) for `saveToken/getToken/clear`. Add an OkHttp `Interceptor` that attaches `Authorization: Bearer <token>` when present. Wire it into the existing OkHttp builder.
  - Check: compiles; manual round-trip save→get→clear works.

- [ ] **A3 — Auth repository + ViewModel.**
  - Files: `.../data/AuthRepository.kt` (new), `.../ui/screens/AuthViewModel.kt` (new)
  - Do: `AuthRepository.signup/login/me/logout` (calls API + TokenStore). `AuthViewModel` exposes UI state (idle/loading/error/success) and `currentUser`/`signedIn`.
  - Check: compiles; unit-level call against a running backend returns a token.

- [ ] **A4 — Login / Sign-up screen + gate the app.**
  - Files: `.../ui/screens/AuthScreen.kt` (new), `apps/android/app/src/main/java/com/pawwalk/android/MainActivity.kt`
  - Do: Compose screen toggling Login ↔ Sign Up with validation/loading/error, using `AuthViewModel` and the existing Brand/HUD components. In `MainActivity`, show `AuthScreen` when signed out, else the current Home; restore token on launch; add a logout action.
  - Check: signed-out launch shows auth; login → Home; relaunch stays logged in; logout returns to auth.

---

## Slice 2 — Bookings, persisted & user-scoped (clients)

Backend already done in B4/B11. Now wire the clients to real, authed bookings.

- [ ] **iOS6 — Booking create/list against the API.**
  - Files: `apps/ios/PawWalk/Services/APIClient.swift`, `apps/ios/PawWalk/Features/Bookings/BookingsView.swift`, a `BookingsViewModel.swift` (new)
  - Do: add `createBooking`, `bookings()` (authed) to APIClient; back `BookingsView` with a VM that loads the user's bookings and supports cancel.
  - Check: create a booking from the app → appears in the list → cancel updates status. (Backend running, logged in.)

- [ ] **A5 — Booking create/list against the API.**
  - Files: `.../data/PawWalkApi.kt` (add `GET bookings`, `POST bookings/{id}/cancel`), `.../data/BookingRepository.kt` (new), `.../ui/screens/BookingsScreen.kt` + VM
  - Do: mirror iOS6 — load the user's bookings, create, cancel; all authed via the interceptor.
  - Check: same as iOS6 on Android.

---

## Slice 3 — Payments (real Stripe, test mode)

- [ ] **B13 — Contract + Stripe settings + SDK.**
  - Files: `docs/API-CONTRACT.md`, `pyproject.toml`, `app/config.py`, `.env.example`
  - Do: add `stripe` dep; settings `stripe_secret_key`, `stripe_webhook_secret` (optional in dev). Document that `/payments/intent` now returns a **real** client secret when a key is set, else keeps the stub (so the app still runs offline).
  - Check: `uv sync`; server boots with and without the key set.

- [ ] **B14 — Real PaymentIntent in `/payments/intent`.**
  - Files: `apps/backend/app/routers/payments.py`
  - Do: when `settings.stripe_secret_key` is set, create a real `stripe.PaymentIntent` (amount = booking.price_cents, currency usd, metadata booking_id) and return its `client_secret`; else return the existing stub. Require `get_current_user` and verify the booking belongs to the caller.
  - Check: with a test key, a real `pi_…_secret_…` comes back; without, the stub still works. Tests cover both branches (mock Stripe).

- [ ] **B15 — (Optional) Stripe webhook → confirm booking.**
  - Files: `apps/backend/app/routers/payments.py` (add `POST /payments/webhook`), `app/data.py`
  - Do: verify the signature, and on `payment_intent.succeeded` flip the booking `status` to `confirmed`.
  - Check: `stripe trigger payment_intent.succeeded` (or a signed test payload) updates the booking status.

- [ ] **iOS7 / A6 — Checkout UI wired to the intent.**
  - Files: iOS `Features/Bookings/CheckoutView.swift` (new) + Stripe iOS SDK; Android checkout screen + Stripe Android SDK
  - Do: after creating a booking, fetch the intent and present the platform's Stripe Payment Sheet with the `client_secret`. Use Stripe **test** keys/cards.
  - Check: a test card completes the sheet; the booking shows as confirmed (after B15) or paid.

---

## Slice 4 — Hardening & deploy

- [ ] **B16 — Lock down CORS.**
  - Files: `apps/backend/app/main.py`, `app/config.py`
  - Do: replace `allow_origins=["*"]` with an env-driven allowlist (`PAWWALK_CORS_ORIGINS`), defaulting to localhost dev origins.
  - Check: a disallowed origin is rejected; the landing/dev origins work.

- [ ] **B17 — Consistent error handling + input limits.**
  - Files: `apps/backend/app/main.py` (exception handlers), routers
  - Do: ensure all errors return `{ "detail": … }` with correct status (already mostly true via FastAPI). Add password length / email format validation on signup. Rate-limit-ready note where login lives.
  - Check: malformed signup → 422 with a clear message; the error body shape matches the contract.

- [ ] **B18 — Round out the test suite.**
  - Files: `apps/backend/tests/…`
  - Do: cover auth (signup/login/me/duplicate/401), user-scoped bookings, and the payments branches. Aim for the happy path + one failure path per endpoint.
  - Check: `uv run pytest` green; `ruff check` clean.

- [ ] **B19 — Deploy config + docs.**
  - Files: `apps/backend/README.md`, `Dockerfile` (new, optional), `docs/ARCHITECTURE.md` (tick the phases)
  - Do: document env vars (DB URL, JWT secret, Stripe keys, CORS), how to run with Postgres, and a production run command (`uvicorn`/gunicorn). Update the phase checklist.
  - Check: a fresh reader can boot the backend against Postgres from the README alone.

---

## How to run a task with a Sonnet 5 agent

Give the agent: the **task ID + its bullet** from this file, the **files** it
names, and "run the **check** before reporting done." Keep tasks one-at-a-time
and in order — later tasks assume earlier ones landed. Update `API-CONTRACT.md`
in the same change as the backend task that implements it.
