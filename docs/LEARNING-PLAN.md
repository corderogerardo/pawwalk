# PawWalk — Learning Plan

You're building a real product **and** learning three native/typed stacks at once: iOS (Swift/SwiftUI), Android (Kotlin/Compose), and a Python AI backend (FastAPI + LangGraph + Pydantic AI). This plan ties study directly to the code already in the repo, so every concept you learn has a place you can immediately see and change it.

## How to use this plan

- **Build features, not tutorials.** Each phase below adds one real feature *across all stacks*. You learn the same concept three ways (e.g. "list data" in SwiftUI, Compose, and FastAPI), which is the fastest way to see what's universal vs. platform-specific.
- **Pick a primary track per phase.** Doing all three in parallel is a lot. Go deep on one platform per feature, then port it to the others — porting is where the learning sticks.
- **The code is the textbook.** Every track doc (`docs/learning/{ios,android,backend}.md`) points at exact files in this repo. Read the file, understand it, then extend it with the phase's exercise.
- **Track it in Notion.** The "No office location → PawWalk" board mirrors these phases as tasks. Check things off there.

## The 12-week arc

| Weeks | Phase | What you build | Core concepts (all 3 stacks) |
|-------|-------|----------------|------------------------------|
| 1 | **0 · Orientation** | Run all 4 apps. Read the scaffolding. | Toolchains, project structure, the API contract |
| 2–3 | **1 · Lists & detail** | Walker list → walker detail screen | Models/Codable, async networking, list UIs, navigation |
| 4–5 | **2 · Create flow** | Booking form → POST to API | Forms & validation, state management, error handling |
| 6–7 | **3 · Persistence & data** | Real database in the backend | SQL/ORM, migrations, separating data from transport |
| 8–9 | **4 · Auth & profiles** | Sign-up/login, user-scoped data | Tokens/keychain, secure storage, auth headers |
| 10 | **5 · Payments** | Stripe checkout in the booking flow | SDK integration, payment intents, webhooks |
| 11 | **6 · The AI assistant** | Grow the LangGraph booking agent | State machines, typed LLM output, tools |
| 12 | **7 · GPS & polish** | Live walk tracking on a map | Maps, location, real-time updates |

Each phase maps to a section in the per-track docs. Phases 0–1 are scaffolded for you already — start by *reading and running*, not writing.

## Phase 0 — Orientation (this week)

Goal: get all four apps running and understand how they connect.

1. **Backend:** `cd apps/backend && uv sync && uv run fastapi dev`. Open http://localhost:8000/docs and click around. This is the contract every client follows. ✅ It already passes tests (`uv run pytest`).
2. **Landing:** `cd apps/landing && npm install && npm run dev`. Open http://localhost:3000.
3. **iOS:** `cd apps/ios && xcodegen generate && open PawWalk.xcodeproj`, then ⌘R. Watch it load walkers from the running backend.
4. **Android:** open `apps/android` in Android Studio, let it sync, Run. Same walker list.
5. Read [`docs/API-CONTRACT.md`](API-CONTRACT.md) and [`docs/ARCHITECTURE.md`](ARCHITECTURE.md).

When all four show the same three walkers, you've got the full loop working. That's the foundation everything else builds on.

## The three tracks

- **[iOS / SwiftUI](learning/ios.md)** — Swift language basics → SwiftUI views → state → networking → the Apple frameworks (MapKit, StoreKit, Sign in with Apple).
- **[Android / Kotlin](learning/android.md)** — Kotlin language basics → Compose → state/ViewModel → coroutines & Retrofit → the Jetpack libraries.
- **[Backend / FastAPI + LangGraph + Pydantic AI](learning/backend.md)** — Python typing & Pydantic → FastAPI → async → databases → agents with LangGraph + Pydantic AI.

## A weekly rhythm that works

- **Mon–Tue:** read the relevant track doc + the repo files it references.
- **Wed–Thu:** do the phase exercise on your primary platform.
- **Fri:** port it to a second platform (or write a test). Commit with a scoped message (`ios:`, `backend:`…).
- **Weekend (optional):** the "stretch" item in the track doc.

Keep a short learning log (a Notion page works) of "what clicked / what confused me." Reviewing it monthly is surprisingly motivating.
