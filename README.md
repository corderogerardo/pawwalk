# 🐕 PawWalk — Dog Walking App (Monorepo)

A booking + payments platform for dog walking, built as a learning-first monorepo across **four native/typed stacks**:

| App | Folder | Stack | What it is |
|-----|--------|-------|------------|
| iOS | [`apps/ios`](apps/ios) | Swift 6 · SwiftUI · Xcode 26 | Native iPhone app |
| Android | [`apps/android`](apps/android) | Kotlin 2.3 · Jetpack Compose | Native Android app |
| Backend | [`apps/backend`](apps/backend) | Python 3.12 · FastAPI · LangGraph · Pydantic AI v2 | API + AI booking agent |
| Landing | [`apps/landing`](apps/landing) | Next.js 15 · React 19 · Tailwind v4 | Marketing site |

> This repo is built to **learn native iOS, native Android, and a modern Python AI backend** while shipping a real product. Every app has its own `README.md` plus a matching learning track in [`docs/learning/`](docs/learning).

---

## Why a monorepo?

One repository, four apps, shared docs and conventions. You get atomic commits across the API contract and the clients that consume it, a single source of truth for the product plan, and one place to learn. Each app keeps its **own** native toolchain — there is no shared build system forcing them together, which is the right call for a polyglot (Swift + Kotlin + Python + TypeScript) codebase.

```
.
├── apps/
│   ├── ios/        # SwiftUI app          → open in Xcode
│   ├── android/    # Compose app          → open in Android Studio
│   ├── backend/    # FastAPI + LangGraph  → uv run
│   └── landing/    # Next.js site         → npm run dev
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API-CONTRACT.md        # the shared contract all clients follow
│   ├── LEARNING-PLAN.md       # the master study plan
│   └── learning/{ios,android,backend}.md
├── Makefile        # convenience commands (make backend, make landing, …)
└── README.md
```

## Tech stack — pinned versions (verified June 2026)

These are the latest stable releases as of June 2026. Each app documents how to bump them.

- **iOS**: Xcode 26.6, Swift 6.3, iOS 26 SDK. Deployment target iOS 18 (broad device support). Project generated with [XcodeGen](https://github.com/yonaskolb/XcodeGen) so the `.xcodeproj` stays out of git.
- **Android**: Kotlin 2.3.21, Android Gradle Plugin 8.13, Gradle 8.13, Jetpack Compose BOM 2026.06.00, compileSdk 36 (Android 16), minSdk 26. Java 17.
- **Backend**: Python 3.12, [uv](https://docs.astral.sh/uv/) for env/deps, FastAPI, Pydantic v2 / Pydantic AI v2.0, LangGraph, Uvicorn.
- **Landing**: Next.js 15 (App Router + Turbopack), React 19, TypeScript, Tailwind CSS v4 (CSS-first, no config file).

## Prerequisites

| To work on | You need |
|------------|----------|
| iOS | macOS + Xcode 26+, and `brew install xcodegen` |
| Android | Android Studio (latest) or JDK 17 + Android SDK 36 |
| Backend | Python 3.12+ and `uv` (`curl -LsSf https://astral.sh/uv/install.sh \| sh`) |
| Landing | Node.js 20+ and npm |

You only need the tools for the app you're touching. The backend and landing page run on any OS; the two mobile apps need their platform IDEs.

## Quickstart

```bash
# Backend API (http://localhost:8000, docs at /docs)
cd apps/backend && uv sync && uv run fastapi dev

# Landing page (http://localhost:3000)
cd apps/landing && npm install && npm run dev

# Android — open apps/android in Android Studio, let Gradle sync, Run
# iOS — cd apps/ios && xcodegen generate && open PawWalk.xcodeproj
```

Or use the [`Makefile`](Makefile): `make backend`, `make landing`, `make ios`, `make android-build`.

## Where to start learning

Read [`docs/LEARNING-PLAN.md`](docs/LEARNING-PLAN.md) first — it sequences the three native tracks into a 12-week plan tied to the code in this repo. Then pick a track:

- [iOS / SwiftUI track](docs/learning/ios.md)
- [Android / Kotlin track](docs/learning/android.md)
- [Backend / FastAPI + LangGraph + Pydantic AI track](docs/learning/backend.md)

The full task board lives in **Notion → "No office location" → PawWalk**.

## Status

🟢 Scaffolding complete — every app runs. Next up: real auth, database, and the payments integration. See the Notion board for the phased roadmap.
