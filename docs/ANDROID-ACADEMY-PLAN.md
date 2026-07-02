# PawWalk Academy — Android Track: Build Plan

A step-by-step plan to build the **Android edition of PawWalk Academy**: an interactive
course that teaches Kotlin and Jetpack Compose from absolute zero by rebuilding the app
in [`apps/android`](../apps/android) — mirroring the iOS course (13 modules, 52 lessons)
that already ships in [`apps/learn`](../apps/learn).

**How to use this plan:** each task below is self-contained and sized for a single
session with a cost-efficient model (Sonnet / Opus). Start a fresh session and prompt:

> Read `docs/ANDROID-ACADEMY-PLAN.md` and do **Task N** only. Follow the task's
> "Read first" list before writing anything. Run the validator before finishing.

Do the tasks in order — Task 0 must land first; Tasks 1–13 each depend only on Task 0;
Task 14 goes last. One task = one commit (`learn: android module NN — <title>`).

---

## Model assignment & how we verify it

| Task | Assigned model | Why |
|------|----------------|-----|
| 0 — engine prep | `sonnet` | Small and fully specified; gated by the validator + an iOS-course regression check |
| 1 — welcome module | `sonnet` | **Pilot module**: reviewed closely before fanning out the rest |
| 2–13 — modules | `sonnet` | Mechanical content production from a precise spec — the bulk of the tokens, on the cheap tier |
| 14 — links/docs/QA | `sonnet` | Mechanical edits + running the validators |
| Orchestration & diff review | main session (Fable/Opus) | Reads diffs and validator output, never authors lesson content — keeps its token share small |

> Naming: the `sonnet` alias resolves to the **latest** Sonnet (currently Sonnet 5,
> `claude-sonnet-5`). There is no "Sonnet 4.6".

**Enforcement — three visible checkpoints:**

1. **Pinned at spawn.** When a task is delegated from a Claude Code session, it is
   launched as a subagent with the model set explicitly (`model: "sonnet"`). That
   parameter is visible on the Agent tool call in the transcript — the orchestrator
   cannot quietly run it on itself.
2. **Sworn in the commit.** Every task commit ends with a `Model:` trailer (e.g.
   `Model: claude-sonnet-5`): each agent reports the model id it is running as, and
   it goes into the commit message. `git log` is the permanent audit trail.
3. **Reviewed upstream, authored downstream.** The main session only reviews each
   task's diff and validator output before dependent tasks start; if a review finds a
   problem, the *fix* also goes back to the assigned model, not the reviewer.

Running a task manually instead? Start the session on Sonnet (`claude --model sonnet`,
or the model picker in the app) and use the prompt template above — the active model
shows in the composer, and checkpoint 2 still applies.

**Rollout order (cost safety):** Task 0 → Task 1 as a pilot → review → Tasks 2–13 in
parallel → Task 14. If the pilot exposes a spec problem, it gets fixed once in this
plan instead of 13 times.

---

## Architecture decision (already made — do not revisit)

**Reuse the existing course engine.** No new framework, no build step. The Android
course is:

- `apps/learn/android.html` — a second entry page (copy of `index.html`) that loads
  `lessons-android/*.js` instead of `lessons/*.js`
- `apps/learn/lessons-android/` — 13 new module files, same format as `lessons/FORMAT.md`
- The same `app.js` + `styles.css`, with two tiny edits (store key + Kotlin keywords)
- Progress is stored separately per course (`pawwalk-academy-android-v1` vs
  `pawwalk-academy-v1`), so both courses coexist in one browser

Everything about the lesson format — step types (`text`, `code`, `quiz`, `exercise`,
`xcode`), the regex-checked exercises, the validator — carries over unchanged.

---

## Task 0 — Engine prep: android.html, store key, Kotlin support, format addendum

**Files:** edit `apps/learn/app.js`, `apps/learn/tools/validate.mjs`, create
`apps/learn/android.html`, `apps/learn/lessons-android/FORMAT-KOTLIN.md`.

**Read first:** `apps/learn/README.md`, `apps/learn/lessons/FORMAT.md`,
`apps/learn/index.html`, `apps/learn/app.js` (all of it — it's ~450 lines),
`apps/learn/tools/validate.mjs`.

1. **Store key** — in `app.js`, change
   `const STORE_KEY = "pawwalk-academy-v1";` to
   `const STORE_KEY = window.STORE_KEY || "pawwalk-academy-v1";`
   That is the only behavioral change to the engine for the iOS course (none).

2. **Kotlin syntax highlighting** — `app.js` has a `SWIFT_KW` keyword set (~line 60).
   Add the Kotlin keywords missing from it so both languages highlight from one set:
   `fun val when object data sealed suspend override package companion by lazy null
   is as vararg out internal constructor init interface class import private public
   abstract open lateinit crossinline reified inline typealias`.
   (Highlighting is cosmetic; a merged set is fine. Optionally rename `SWIFT_KW` → `KW`.)

3. **`android.html`** — copy `index.html`, then:
   - `<title>PawWalk Academy — learn Kotlin & Jetpack Compose by rebuilding PawWalk</title>`
   - Header `<h1>PawWalk Academy · Android</h1>`, and next to it a small link
     `<a href="index.html">iOS course →</a>` (match existing header markup/classes)
   - Before the lesson script tags add: `<script>window.STORE_KEY = "pawwalk-academy-android-v1";</script>`
   - Replace the 13 `lessons/*.js` script tags with the 13 `lessons-android/*.js`
     files listed in the curriculum table below (they won't exist yet — that's fine,
     missing scripts just 404; the engine shows an empty-course message until Task 1 lands).
   - Keep `app.js` as the last script.

4. **Validator** — `tools/validate.mjs` reads the `lessons/` directory; parameterize it:
   `const dir = process.argv[2] || "lessons";`. `node tools/validate.mjs` must behave
   exactly as before; `node tools/validate.mjs lessons-android` validates the new course.
   Run it against `lessons/` after the change to prove nothing broke (0 errors).

5. **`lessons-android/FORMAT-KOTLIN.md`** — a one-page addendum to `FORMAT.md` (link to
   it, don't duplicate it) covering the Kotlin-specific traps:
   - **THE BIG TRAP — Kotlin `${...}` inside JS templates.** All code fields use
     `String.raw` backtick templates. JS still interpolates `${expr}` inside
     `String.raw`! Kotlin's simple `$name` interpolation is safe (no brace), but
     Kotlin's `${expr}` form MUST be written as `${"$"}{expr}` in the lesson file, or —
     preferred — restructure the Kotlin to use `$name` (extract a `val`), which is
     cleaner Kotlin anyway. The validator cannot catch this; a bare `${expr}` throws a
     ReferenceError or silently injects `undefined` when the page loads. After writing
     each module, grep it: `grep -n '\${' <file>` — every hit must be `${"$"}{`.
   - **Regexes in `checks`:** same normalization as iOS (comments stripped — Kotlin
     uses `//` and `/* */` too — whitespace collapsed, no spaces around punctuation).
     Escape `$` as `\$` in regexes when matching Kotlin string templates.
   - **Kotlin code must be real Kotlin** that compiles in `apps/android` — when a
     lesson rebuilds a repo file, match the repo file verbatim.
   - **Checklist steps:** keep the step `type: "xcode"` (it's an engine keyword for
     "out-of-browser checklist"); just title it for Android Studio (e.g.
     `title: "Run the app in Android Studio"`). Check `app.js` — if it renders any
     hardcoded "Xcode" label for this step type, change it to use the step's `title`.

**Acceptance:** `node tools/validate.mjs` → 0 errors (iOS course untouched);
`python3 -m http.server 4173` → `index.html` works exactly as before, `android.html`
loads with the Android header and an empty course; `grep -c KW app.js` shows the merged
keyword set is used by the highlighter.

---

## The curriculum — 13 modules, ~52 lessons

Mirrors the iOS course one-to-one so concepts land twice ("this is `let` → `val`",
"this is `@State` → `remember`"). Every module anchors to real files in
`apps/android/app/src/main/java/com/pawwalk/android/` (paths below are relative to that).

| # | File (`lessons-android/`) | Module id | Title | Emoji |
|---|---------------------------|-----------|-------|-------|
| 00 | `00-welcome.js` | `welcome-android` | Welcome & Setup | 🤖 |
| 01 | `01-kotlin-basics.js` | `kotlin-basics` | Kotlin Basics | 🔤 |
| 02 | `02-kotlin-deeper.js` | `kotlin-deeper` | Kotlin, One Level Deeper | 🧠 |
| 03 | `03-kotlin-for-apps.js` | `kotlin-for-apps` | Kotlin for Real Apps: Serialization & Coroutines | 📦 |
| 04 | `04-compose-first-steps.js` | `compose-first-steps` | Jetpack Compose: First Steps | 🎨 |
| 05 | `05-state.js` | `compose-state` | State & Data Flow | 🔄 |
| 06 | `06-design-system.js` | `design-system-android` | The PawWalk Design System | 🖌️ |
| 07 | `07-networking.js` | `networking-android` | Networking with Retrofit | 🌐 |
| 08 | `08-auth.js` | `auth-android` | Auth & Secure Storage | 🔐 |
| 09 | `09-lists-navigation.js` | `lists-navigation` | Lists & Navigation | 🧭 |
| 10 | `10-bookings.js` | `bookings-android` | Bookings & Forms | 📅 |
| 11 | `11-live-tracking.js` | `live-tracking-android` | Live Walk Tracking | 📍 |
| 12 | `12-assistant-graduation.js` | `assistant-graduation-android` | The AI Assistant & Graduation | 🎓 |

Module ids must be unique across BOTH courses (localStorage routes by id) — hence the
`-android` suffixes where the iOS course has a similarly named module.

---

## Tasks 1–13 — one module per task

**Every module task follows the same recipe** (repeated here once; each task below only
adds the specifics):

- **Read first (mandatory, in this order):**
  1. `apps/learn/lessons/FORMAT.md` + `apps/learn/lessons-android/FORMAT-KOTLIN.md`
  2. The matching iOS module in `apps/learn/lessons/` (same number) — copy its
     *structure, rhythm, and voice*, not its content: same lesson count, same
     explain → real code → quiz → type-it-yourself flow, encouraging tone, zero
     assumed knowledge, everything anchored in PawWalk (dogs, walkers, cents, GPS).
  3. The anchor files listed in the task — the Kotlin shown MUST match the repo.
- **Write** `apps/learn/lessons-android/NN-name.js`: one `window.COURSE.push({...})`
  with the module id/title/emoji from the table and ~4 lessons × 5–12 steps. Every
  lesson ends with a quiz or exercise. Exercises: 1–8 lines of typing, 2–4 short
  regex checks each with a teaching hint.
- **Wire it up:** confirm the script tag for this file exists in `android.html`
  (Task 0 added them all; if not, add it in course order).
- **Validate:** `node tools/validate.mjs lessons-android` → 0 errors. Then
  `grep -n '\${' lessons-android/NN-name.js` → every hit is the `${"$"}{` escape.
  Then load `android.html` in a browser (`python3 -m http.server 4173`), click through
  the new module, and complete at least one exercise end-to-end.
- **Don't** touch the engine, the iOS lessons, or other Android modules.

### Task 1 — `00-welcome.js` (Welcome & Setup)

Lessons (4): **What you're going to build** · **Your first look at Kotlin** ·
**How this course works** · **Set up your machine**.

- Tour the finished app: role-based auth, walker list, bookings, payments, live GPS,
  AI assistant — same product as iOS, different stack.
- Read `MainActivity.kt` top-to-bottom as the "whole file" walkthrough (mirror how the
  iOS module walks `PawWalkApp.swift`): `class`, `override fun onCreate`, `setContent`,
  a first `@Composable`.
- Explain Android/Kotlin/Compose in three sentences each; how Compose relates to
  SwiftUI (one comparison table — many learners will do both tracks).
- "Try the code editor" starter exercise (type `val greeting = "PawWalk"` + print it).
- Setup checklist (`type: "xcode"` steps): install Android Studio, open `apps/android`,
  Gradle sync, create a Pixel emulator (API 36), run the app; start the backend
  (`cd apps/backend && uv run fastapi dev`) and explain **`10.0.2.2` = the emulator's
  address for your host's localhost** (it's in `BuildConfig.API_BASE_URL`).
- **Anchors:** `MainActivity.kt`, `apps/android/README.md`, `docs/learning/android.md`.

### Task 2 — `01-kotlin-basics.js` (Kotlin Basics)

Lessons (5, mirroring iOS 01): **Constants & Variables** (`val`/`var`, type inference)
· **Strings & Templates** (`$name`, `"""` raw strings, `.uppercase()`) ·
**Numbers & Money in Cents** (Int division truncates; cents→dollars the PawWalk way) ·
**Functions** (default/named args) · **Making Decisions** (`if`/`else` as expression,
`when`, `for`/`while`, ranges).

- Show real excerpts: `data/Models.kt` properties, a `priceLabel`-style computed
  property (`val priceLabel: String get() = ...`), a `when` over a booking status.
- Exercises: declare walker data with `val`; build a walk banner with a string
  template (use `$name` form — see FORMAT-KOTLIN); cents-to-dollars; first function;
  instant-book `when` decision.
- **Anchors:** `data/Models.kt`.

### Task 3 — `02-kotlin-deeper.js` (Kotlin, One Level Deeper)

Lessons (5, mirroring iOS 02): **Nullability** (`String?`, `?.`, `?:`, `let`) —
Kotlin's answer to Swift optionals · **Data Classes** (auto `equals`/`copy`; rebuild a
trimmed `Walker`) · **Enums & Sealed Interfaces** (`enum class BookingStatus`; the
`UiState` sealed interface + exhaustive `when`) · **Collections & Lambdas** (`listOf`,
`map`/`filter`/`sumOf`, trailing lambda, `it`) · **Interfaces & Errors** (`try`/`catch`,
throwing vs `Result`, how the repository reports failure).

- Exercises: unwrap a pet's age with `?:`; write a `data class`; rebuild the
  `UiState` sealed interface from `WalkersViewModel.kt`; price tags with `map`;
  a `when` over `UiState`.
- **Anchors:** `data/Models.kt`, `ui/screens/WalkersViewModel.kt`,
  `data/WalkerRepository.kt`.

### Task 4 — `03-kotlin-for-apps.js` (Serialization & Coroutines)

Lessons (4, mirroring iOS 03): **JSON & @Serializable** (kotlinx.serialization; decode
the walkers list) · **@SerialName: snake_case → camelCase** (the CodingKeys
equivalent; rebuild `Walker`'s annotated fields) · **Building Models.kt** (type the
real `Booking` + `BookingStatus` from the repo) · **Coroutines: waiting without
freezing** (`suspend fun`, `viewModelScope.launch`, main-safety; compare to
async/await).

- Quote `docs/API-CONTRACT.md` for the exact JSON one walker arrives as — same
  payload the iOS module uses.
- Exercises: annotate a field with `@SerialName("price_per_30_min_cents")`; type
  `BookingStatus`; write a `suspend fun` and launch it.
- **Anchors:** `data/Models.kt`, `data/WalkerRepository.kt`, `docs/API-CONTRACT.md`.

### Task 5 — `04-compose-first-steps.js` (Compose: First Steps)

Lessons (4): **Your first @Composable** (functions-as-UI; `Text`, `@Preview`) ·
**Rows, Columns & Boxes** (layout primitives; `Arrangement`/`Alignment`) ·
**Modifiers** (order matters — padding-then-background vs background-then-padding) ·
**Buttons, Images & Material 3** (`Button(onClick=…)`, `Icon`, `Card`, `Scaffold` +
`TopAppBar` teaser).

- Build up a `WalkerCard` lookalike step by step; end by showing the real one in
  `ui/screens/WalkersScreen.kt`.
- Exercises: a composable that takes a `Walker` and shows name + price; a `Row` with
  avatar/name/rating; fix a modifier-order bug.
- **Anchors:** `ui/screens/WalkersScreen.kt`, `ui/components/HudComponents.kt`.

### Task 6 — `05-state.js` (State & Data Flow)

Lessons (4, mirroring iOS 05): **remember & mutableStateOf** (a walk-length picker;
recomposition = SwiftUI re-render) · **State Hoisting** (state down, events up —
`value` + `onValueChange`; a `TextField`; compare to `@Binding`) · **ViewModel &
StateFlow** (`WalkersViewModel`: private `MutableStateFlow`, public `StateFlow`,
`collectAsState()`; rebuild the view-model shell) · **Where State Lives** (screen
switches on `UiState`: loading/error/content; why composables never own business
state).

- **Anchors:** `ui/screens/WalkersViewModel.kt`, `ui/screens/WalkersScreen.kt`,
  `ui/screens/AuthScreen.kt` (TextField state).

### Task 7 — `06-design-system.js` (The PawWalk Design System)

Lessons (4): **Material 3 Theming** (`MaterialTheme`, color scheme, dark mode) ·
**PawWalk's Brand** (`ui/theme/Brand.kt` + `Color.kt` — the HUD palette; type the
brand colors) · **Reusable HUD Components** (walk through 2–3 components in
`ui/components/HudComponents.kt`; rebuild a small one, e.g. a status chip/badge) ·
**Icons & Polish** (`HudIcons.kt`, spacing/typography consistency, when to extract a
component).

- **Anchors:** `ui/theme/Brand.kt`, `ui/theme/Color.kt`, `ui/theme/` (other files),
  `ui/components/HudComponents.kt`, `ui/components/HudIcons.kt`.

### Task 8 — `07-networking.js` (Networking with Retrofit)

Lessons (4): **The API Contract** (endpoints from `docs/API-CONTRACT.md`; FastAPI docs
at `http://10.0.2.2:8000`) · **Retrofit: an Interface Becomes a Client** (type the real
`PawWalkApi.kt` methods — `@GET("/walkers")`, `suspend fun`) · **The Network Stack**
(`data/Network.kt`: OkHttp, the kotlinx-serialization converter, `BuildConfig.API_BASE_URL`)
· **Repositories & Errors** (`WalkerRepository`: try/catch, mapping to `UiState`,
loading/error/retry UI).

- Exercises: write a `@GET` endpoint method; rebuild the repository's error branch;
  quiz on why the emulator needs `10.0.2.2` not `localhost`.
- **Anchors:** `data/PawWalkApi.kt`, `data/Network.kt`, `data/WalkerRepository.kt`,
  `docs/API-CONTRACT.md`.

### Task 9 — `08-auth.js` (Auth & Secure Storage)

Lessons (4, mirroring iOS 08): **Tokens 101** (login → bearer token → authorized
requests; same flow as iOS) · **Storing the Token** (`data/TokenStore.kt` — DataStore;
why not plain SharedPreferences) · **Attaching It Automatically** (the OkHttp
interceptor in `Network.kt` that adds `Authorization: Bearer …`) · **The Auth Screens**
(`AuthScreen.kt` + `AuthViewModel.kt`: form state, sign-up vs log-in, role selection,
error display, logout).

- Exercises: rebuild the interceptor's header line; the ViewModel's login happy path;
  quiz on where the token must never live (in a composable / in the repo / in git).
- **Anchors:** `data/TokenStore.kt`, `data/AuthRepository.kt`, `data/Network.kt`,
  `ui/screens/AuthScreen.kt`, `ui/screens/AuthViewModel.kt`.

### Task 10 — `09-lists-navigation.js` (Lists & Navigation)

Lessons (4): **LazyColumn** (`items(walkers, key = { it.id })`; why keys; contrast
with `Column`) · **Navigation Compose** (`NavHost`, routes, passing a walker id,
back stack) · **The Walker Detail Screen** (`WalkerScreen.kt` — reading arguments,
loading one walker) · **Tabs & Scaffolding** (`HomeScreen.kt` bottom navigation:
Home/Bookings/Live/Assistant/Profile; how `MainActivity` wires the graph).

- **Anchors:** `ui/screens/WalkersScreen.kt`, `ui/screens/WalkerScreen.kt`,
  `ui/screens/HomeScreen.kt`, `ui/screens/HomeViewModel.kt`, `MainActivity.kt`.

### Task 11 — `10-bookings.js` (Bookings & Forms)

Lessons (4): **The Booking Form** (`CreateBookingScreen.kt`: pet picker, duration,
date/time, notes — form state in `CreateBookingViewModel.kt`) · **Validate, then POST**
(client-side validation; `BookingRepository.createBooking`; cents math for the total) ·
**Your Bookings** (`BookingsScreen.kt`/`BookingsViewModel.kt`: status chips, which
statuses count as upcoming — pending/confirmed/in_progress) · **Paying for a Walk**
(the payment flow against the backend; where Stripe's PaymentSheet would slot in).

- **Anchors:** `ui/screens/CreateBookingScreen.kt`, `ui/screens/CreateBookingViewModel.kt`,
  `ui/screens/BookingsScreen.kt`, `ui/screens/BookingsViewModel.kt`,
  `data/BookingRepository.kt`, `data/PetRepository.kt`.

### Task 12 — `11-live-tracking.js` (Live Walk Tracking)

Lessons (4): **The Live Screen** (`LiveScreen.kt`: what a walk-in-progress shows) ·
**Polling & Flows** (`LiveViewModel.kt`: refreshing GPS fixes on an interval;
lifecycle awareness — stop when backgrounded) · **Drawing the Path** (rendering the
route from GPS fixes; where Maps Compose would replace the custom drawing) ·
**Permissions & Location** (runtime permission flow, `FusedLocationProvider` concept,
walker-vs-owner perspectives).

- **Anchors:** `ui/screens/LiveScreen.kt`, `ui/screens/LiveViewModel.kt`,
  the backend's walk-tracking endpoints in `docs/API-CONTRACT.md`.

### Task 13 — `12-assistant-graduation.js` (The AI Assistant & Graduation)

Lessons (4): **A Chat UI in Compose** (`AssistantScreen.kt`: message list, input row,
auto-scroll) · **Talking to the Agent** (`AssistantViewModel.kt` → the LangGraph
backend; request/response shape) · **The Rest of the App** (guided tour: `PetsScreen`,
`ProfileScreen` — read code you can now fully understand) · **Graduation** (recap of
all 13 modules; a self-assessment quiz; where to go next: Android Basics with Compose,
Now in Android, `docs/learning/android.md` stretch goals; challenge exercises — add a
favorite-walker feature end-to-end).

- **Anchors:** `ui/screens/AssistantScreen.kt`, `ui/screens/AssistantViewModel.kt`,
  `ui/screens/PetsScreen.kt`, `ui/screens/ProfileScreen.kt`.

---

## Task 14 — Cross-linking, docs, final QA

**Files:** edit `apps/learn/index.html`, `apps/learn/README.md`,
`docs/LEARNING-PLAN.md`, `docs/learning/android.md`.

1. `index.html`: add the same small header link the Android page has, pointing the
   other way (`android.html`, "Android course →").
2. `apps/learn/README.md`: document the two courses, the `lessons-android/` dir,
   the per-course store keys, and `node tools/validate.mjs lessons-android`.
3. `docs/LEARNING-PLAN.md`: extend the "interactive course" callout to mention the
   Android track supersedes `docs/learning/android.md` for beginners (mirror the
   existing iOS sentence).
4. `docs/learning/android.md`: add a pointer to the Academy Android track at the top.
5. **Final QA:** both validators pass (`node tools/validate.mjs` and
   `node tools/validate.mjs lessons-android`, 0 errors each);
   `grep -rn '\${' lessons-android/*.js` shows only `${"$"}{` escapes;
   serve the site and click through: iOS course progress untouched, Android course
   shows 13 modules / ~52 lessons, progress bar works, reset works, at least one
   exercise per module spot-checked in the browser.

---

## Guardrails for the executing model (read before every task)

1. **Never** put Kotlin `${expr}` bare inside a `String.raw` template — JS interpolates
   it even in `String.raw`. Use `$name` (restructure with a `val`) or `${"$"}{expr}`.
2. All code fields (`source`, `starter`, `solution`) use `String.raw` backtick
   templates; all prose fields (`md`, `prompt`, `intro`) are arrays of double-quoted
   strings; `checks`/`mustNot` regexes are literals (`/…/`).
3. Kotlin shown as repo code must match the actual file in `apps/android` — read it,
   don't recall it. Title code blocks with the real path (e.g. `data/Models.kt`).
4. Regexes match **normalized** code: comments stripped, whitespace collapsed, no
   spaces around punctuation (`val priceLabel:String get()=`). Escape `$ . ? ( ) { } [`
   in regexes. 2–4 short checks per exercise, each hint a nudge, not the answer.
5. The validator is the gate: `node tools/validate.mjs lessons-android` must report
   0 errors before a task is done. It asserts every solution passes its own checks.
6. Stay in your lane: a module task touches exactly one file in `lessons-android/`.
7. Commit format: `learn: android module NN — <title>` (or `learn: android track
   scaffolding (Task 0)`), with a body listing what was added and a final
   `Model: <your model id>` trailer before the standard co-author line.
