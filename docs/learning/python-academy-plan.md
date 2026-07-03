# PawWalk Academy Part II — Python Backend course build plan

The execution plan for extending [`apps/learn`](../../apps/learn) (PawWalk Academy) with an
interactive Python backend course: **Python → Flask → Django → FastAPI → LLM agents → RAG**,
anchored in the real backend at [`apps/backend`](../../apps/backend).

Every task below is **self-contained and sized for one short session** with an inexpensive
model. To execute a task, prompt: *"Open docs/learning/python-academy-plan.md and execute
Task N."* Tasks must be done in order **within a stage** (later lessons assume earlier
concepts); stages themselves are also sequential.

Already done (the template to imitate):
- Engine supports Python (`lang: "python"` on a module; see the Python addendum in
  [`apps/learn/lessons/FORMAT.md`](../../apps/learn/lessons/FORMAT.md)).
- Module 13 [`13-py-welcome.js`](../../apps/learn/lessons/13-py-welcome.js) is live — **copy its
  voice, step rhythm, and exercise style.**

## How to execute one task (the recipe — follow it exactly)

1. **Read** `apps/learn/lessons/FORMAT.md` end to end (module shape, step types, the
   normalization rules your check regexes run against, and the Python addendum).
2. **Read** `apps/learn/lessons/13-py-welcome.js` as the style template.
3. **Read the anchor files** listed in the task (paths relative to `apps/backend` unless
   stated otherwise). When a lesson shows repo code, quote it faithfully and title the code
   block with the real path.
4. **Write** the module file `apps/learn/lessons/<file>` from the task spec:
   - Module object: `id` (kebab-case, unique), `title`, `emoji`, `lang: "python"`, `lessons`.
   - 3–4 lessons per the task outline; each lesson 5–12 steps, ~10–20 min.
   - Rhythm per lesson: explain (`text`) → show real code (`code`) → check understanding
     (`quiz`) → make them type (`exercise`). Every lesson ENDS on a quiz, exercise, or
     checklist step — never text.
   - Exercises: 1–8 lines of typing, `starter` with `# your code here`, 2–4 short `checks`
     each with a teaching hint, `mustNot` for the classic wrong turn. All code fields use
     `String.raw`.
   - Terminal work is an `xcode` step with `label: "Over to the terminal"`.
5. **Register it**: add `<script src="lessons/<file>"></script>` to `apps/learn/index.html`
   directly after the previous module's tag (tag order = course order).
6. **Validate**: `cd apps/learn && node tools/validate.mjs` → must print 0 errors. Fix any
   `SOLUTION FAILS ITS OWN CHECK` by adjusting the regex (remember: whitespace is collapsed
   and spaces around punctuation are removed before matching).
7. **Tick the box** in the progress table below (edit this file).

**Definition of done (every task):** module file created; script tag added in order;
validator passes with 0 errors; every lesson ends on a gating step; repo-quoted code matches
the actual files; the learner never edits `apps/backend` destructively (read, run, extend —
the four staged agent exercises in Task 29/31 add code, which is fine).

**Audience calibration:** the learner finished Part I (Swift/iOS) but has **zero Python
experience**. Define every term at first use. Use Swift comparisons early (they fade out by
Stage D). Anchor every example in PawWalk: walkers, bookings, prices in cents, GPS fixes.

## Progress

| Stage | Task / Module | File | Status |
|---|---|---|---|
| A | 13 · Part II welcome | `13-py-welcome.js` | ✅ done |
| A | 14 · Python basics | `14-python-basics.js` | ✅ done |
| A | 15 · Collections | `15-collections.js` | ✅ done |
| A | 16 · Classes & typing | `16-classes-typing.js` | ✅ done |
| A | 17 · Errors, files & JSON | `17-errors-files-json.js` | ✅ done |
| B | 18 · HTTP & Flask | `18-http-flask.js` | ✅ done |
| B | 19 · Flask deeper | `19-flask-deeper.js` | ✅ done |
| C | 20 · Django anatomy | `20-django-anatomy.js` | ✅ done |
| C | 21 · Django ORM | `21-django-orm.js` | ✅ done |
| C | 22 · Django APIs & auth | `22-django-api-auth.js` | ✅ done |
| D | 23 · Pydantic & FastAPI | `23-pydantic-fastapi.js` | ✅ done |
| D | 24 · Routers & DI | `24-fastapi-routers-di.js` | ✅ done |
| D | 25 · Databases | `25-database-sqlalchemy.js` | ✅ done |
| D | 26 · Auth & security | `26-auth-security.js` | ✅ done |
| D | 27 · Payments & testing | `27-payments-testing.js` | ✅ done |
| E | 28 · LLM foundations | `28-llm-foundations.js` | ✅ done |
| E | 29 · LangGraph agents | `29-langgraph-agent.js` | ✅ done |
| E | 30 · RAG from scratch | `30-rag-from-scratch.js` | ✅ done |
| E | 31 · RAG in the assistant + graduation | `31-rag-assistant-graduation.js` | ✅ done |

---

## Stage A — Python the language

No frameworks yet. Exercises are checked in the browser; `xcode` checklists have the learner
run snippets in the Python REPL (`python3` in a terminal) to see real output.

### Task 14 — `14-python-basics.js` · id `python-basics` · 🔤

**Goal:** variables, core types, f-strings, control flow, functions — enough Python to read
simple code fluently. Heavy Swift comparisons.

**Lessons (4):**
1. **Variables & types** — assignment without `let`/`var`; `int`, `float`, `str`, `bool`
   (capitalized `True`/`False`, `None` vs Swift's `nil`); dynamic typing vs Swift, and why
   type *hints* come later; `type()` in the REPL. Exercise: create `walk_price_cents = 2400`
   and a `walker_name` string.
2. **Strings & f-strings** — quoting, f-strings vs Swift interpolation, `.upper()`,
   `.strip()`, `len()`; format specs like `f"${cents / 100:.2f}"` for prices. Exercise:
   build a `price_label` string from cents (mirror of the Part I `priceLabel` exercise —
   call that out, it's a nice callback).
3. **Control flow** — `if`/`elif`/`else` (no parens, colon + indentation), comparison and
   `and`/`or`/`not`; `for x in …` and `range()`; `while`. Quiz on indentation-as-syntax.
   Exercise: loop over walk durations `[30, 45, 60]` and print a label for each.
4. **Functions** — `def`, `return`, default parameter values, keyword arguments; docstrings.
   Exercise: `def booking_total(duration, rate_cents_per_30=2400):` returning the total —
   checks verify `def booking_total(`, a default value, and `return`.

**Anchors:** none in the repo yet — pure language. Keep every example PawWalk-themed.

**Check-regex reminders:** normalized code has no spaces around punctuation:
`def booking_total(duration,rate_cents_per_30=2400):` — write regexes against that shape.

### Task 15 — `15-collections.js` · id `py-collections` · 📦

**Goal:** the four core containers and comprehensions — the shapes all API data takes.

**Lessons (4):**
1. **Lists** — literals, indexing (incl. negative), `.append()`, slicing `walkers[1:3]`;
   lists vs Swift arrays. Exercise: build a list of walker names and append one.
2. **Dictionaries** — `{"name": "Ana"}`, access, `.get()` with default, `in`, iteration
   over `.items()`; dicts vs Swift dictionaries; **a JSON object is a dict** — plant this
   flag, Stage B harvests it. Exercise: build a `walker` dict with `name`, `rating`,
   `price_cents`.
3. **Tuples & sets** — immutability, tuple unpacking `lat, lng = fix`; sets for dedup and
   membership. Quiz: pick the right container for three PawWalk scenarios.
4. **Comprehensions** — `[w["name"] for w in walkers]`, with `if` filter; dict
   comprehension briefly; when a plain loop is clearer. Exercise: names of walkers rated
   ≥ 4.8 via a list comprehension — checks verify `for w in` and an `if` clause inside `[…]`.

### Task 16 — `16-classes-typing.js` · id `classes-typing` · 🧬

**Goal:** classes, dataclasses, type hints, enums — the direct bridge to Pydantic. This
module ends *reading real repo code*.

**Anchors:** `apps/backend/app/schemas.py` (top ~60 lines: `Duration = Literal[30, 45, 60]`,
`BookingStatus(str, Enum)`, `User`, `SignupRequest`).

**Lessons (4):**
1. **Classes** — `class Walker:`, `__init__`, `self` (vs Swift's implicit `self`), methods,
   creating instances. Exercise: a `Walker` class with `name` and `price_cents` and a
   `price_label` method.
2. **Dataclasses** — `@dataclass` kills the `__init__` boilerplate (first decorator sighting
   — explain `@` syntax in one paragraph, Stage B/E reuse it); default values; compare to a
   Swift struct. Exercise: convert lesson 1's class to a `@dataclass`.
3. **Type hints** — `name: str`, `-> str`, `str | None` (vs Swift optionals!), `list[str]`;
   hints don't *enforce* anything at runtime — that's exactly the gap Pydantic fills (say
   this; it's the cliffhanger for Stage D). Exercise: add hints to an unhinted function.
4. **Enums & Literal** — `class BookingStatus(str, Enum)` and `Literal[30, 45, 60]`, quoted
   verbatim from `app/schemas.py` in a `code` step; closed sets make invalid states
   unrepresentable (same philosophy as Swift enums). End with a quiz on why
   `Literal[30, 45, 60]` beats `int`.

### Task 17 — `17-errors-files-json.js` · id `errors-files-json` · 🧯

**Goal:** exceptions, files, JSON — the language of APIs, right before Stage B needs it.

**Lessons (3):**
1. **Exceptions** — `try`/`except ValueError`/`else`/`finally`; `raise`; exceptions vs
   Swift's `do/try/catch`; look up errors don't crash servers — frameworks catch them (foreshadow
   HTTP 500s). Exercise: wrap `int(user_input)` in try/except returning a fallback.
2. **Files & context managers** — `with open(path) as f:` and why `with` guarantees cleanup
   (vs Swift `defer`); `.read()`, iterating lines. Exercise: a function that reads a file and
   returns its line count using `with` — `mustNot` an unclosed bare `open(` assignment.
3. **JSON** — `import json`; `json.loads` (string → dict) and `json.dumps` (dict → string);
   round-trip a PawWalk booking dict; JSON is exactly the wire format the iOS app's
   `Codable` decoded in Part I. Exercise: parse a booking JSON string and pull out
   `["walker"]["name"]`. Final quiz: which `json.*` function for which direction.

---

## Stage B — HTTP & Flask (the micro-framework)

The learner builds a real mini-API in `playground/flask-pawwalk/` (gitignored) via terminal
checklists, and types the key code in browser exercises. Setup pattern for every checklist:
`mkdir -p playground/flask-pawwalk && cd playground/flask-pawwalk && uv init && uv add flask`
then `uv run python app.py` (or `uv run flask --app app run --debug`).

### Task 18 — `18-http-flask.js` · id `http-flask` · 🌐

**Goal:** demystify HTTP, then serve PawWalk's walkers from a 20-line Flask app.

**Lessons (4):**
1. **What an HTTP request actually is** — method, path, headers, body; status codes
   (200/201/404/422/500); this is what Part I's `URLSession` was sending. Show a raw
   request/response as a `code` step (`lang: "swift"` not needed — plain text is fine in a
   python block). Quiz: match method to intent (GET fetch / POST create…).
2. **Hello, Flask** — `Flask(__name__)`, `@app.route("/")`, run it; the decorator from
   module 16 returns! Checklist: scaffold the playground project, run the server, curl it.
3. **Routes that return JSON** — return a dict → Flask jsonifies it; a hardcoded
   `WALKERS` list of dicts (reuse the shape from `GET /walkers` in the real backend — link
   to http://localhost:8000/docs); `jsonify`. Exercise: write the `/walkers` route returning
   the list.
4. **Dynamic routes** — `@app.route("/walkers/<walker_id>")`, look up by id, return 404 via
   `abort(404)` when missing. Exercise: the lookup route — checks verify `<walker_id>` in
   the route string and a 404 path. Checklist: hit both routes in the browser.

### Task 19 — `19-flask-deeper.js` · id `flask-deeper` · 🔧

**Goal:** POST bodies, hand-rolled validation (feel the pain Pydantic will remove),
blueprints, error handling. Ends with a complete two-resource mini-API.

**Lessons (4):**
1. **Query params & request data** — `request.args.get("min_rating")`, filtering the
   walker list; type conversion by hand (`float(...)` + try/except from module 17).
   Exercise: filtered `/walkers?min_rating=4.8`.
2. **POST & validation by hand** — `request.get_json()`; check required fields, check
   `duration in (30, 45, 60)`, return 422 with an error dict when bad. Have them COUNT the
   validation lines, then say: *remember this number — FastAPI does it in zero.* Exercise:
   the validation block for `POST /bookings`.
3. **Blueprints & error handlers** — split walkers/bookings into blueprints;
   `@app.errorhandler(404)` returning JSON. Quiz on why one giant `app.py` fails at scale
   (the answer previews the real backend's `app/routers/` layout).
4. **Ship the mini-API** — checklist: assemble the full `flask-pawwalk` app (two blueprints,
   validation, error handlers), curl all endpoints including a failing 422. Final quiz:
   what did Flask NOT do for you (validation, docs, types — the Stage D setup).

---

## Stage C — Django (batteries included)

Playground: `playground/django-pawwalk/`. Setup: `uv init && uv add django`, then
`uv run django-admin startproject pawwalk .` and `uv run python manage.py startapp walks`.
Django's file spray is the lesson — contrast with Flask's one file.

### Task 20 — `20-django-anatomy.js` · id `django-anatomy` · 🏗️

**Goal:** navigate a Django project without fear; requests → URLconf → view → response.

**Lessons (3):**
1. **The project tour** — `startproject`/`startapp` output explained file by file
   (`settings.py`, `urls.py`, `manage.py`, the app folder); "project vs app". Checklist:
   scaffold it, `uv run python manage.py runserver`, see the rocket page.
2. **URLs & views** — `path("walkers/", views.walker_list)`, a view is `request →
   response`; `JsonResponse` (Django can do APIs too, not just HTML). Exercise: write the
   `walker_list` view returning `JsonResponse({"walkers": WALKERS})` and its `path()` line.
3. **Same API, third framework** — port `/walkers/<id>` from Flask; `get_object_or_404`
   teaser (needs models — next module). Quiz: trace a request through
   settings → urls → view. End quiz: Flask vs Django so far — who decides more for you?

### Task 21 — `21-django-orm.js` · id `django-orm` · 🗄️

**Goal:** the headline Django features: models, migrations, admin, querysets. First
database of the course (SQLite — zero setup; say Postgres swaps in via settings).

**Lessons (4):**
1. **Models** — `class Walker(models.Model)` with `CharField`, `IntegerField`,
   `DecimalField`; a model is a table. Exercise: the `Walker` model (name, rating,
   price_cents).
2. **Migrations** — `makemigrations` / `migrate`; migrations are version control for the
   schema (the real backend uses Alembic for the same job — cross-reference, and note the
   backend runs its migrations automatically on startup). Checklist: run both commands,
   inspect the generated migration file.
3. **The admin** — register `Walker`, `createsuperuser`, add three walkers in the UI —
   the "for free" moment; nothing in Flask or FastAPI matches it. Checklist-driven.
4. **Querysets** — `Walker.objects.all()`, `.filter(rating__gte=4.8)`, `.get(pk=…)`,
   `.order_by()`; lazy evaluation in one sentence. Exercise: the filtered queryset; wire it
   into the JSON view from module 20. Quiz: queryset vs list comprehension — where does the
   filtering run (in SQL, not Python)?

### Task 22 — `22-django-api-auth.js` · id `django-api-auth` · 🔐

**Goal:** JSON APIs with a `Booking` model + `ModelForm` validation, session auth in
concept, and the framework-choice decision. Closes the Django detour.

**Lessons (3):**
1. **POST with models & forms** — `Booking` model with a `ForeignKey` to `Walker`;
   `ModelForm` validation (`form.is_valid()` / `form.errors`) vs Flask's hand-rolled ifs.
   Exercise: the `Booking` model with `ForeignKey("Walker", on_delete=models.CASCADE)`.
2. **Auth in Django** — `User` comes built in; sessions + cookies vs the token auth the
   real backend uses (Part I stored a token in Keychain — connect the dots: mobile clients
   want tokens, browser apps love sessions). Quiz distinguishing session vs token flows.
3. **Choosing a framework** — the honest comparison table (Flask: control, you write
   everything; Django: admin/ORM/auth free, its way or the highway; FastAPI: types are the
   contract, async, auto docs); "for PawWalk we chose FastAPI because the schema IS the
   contract for two mobile clients." Final quiz: pick the framework for four scenarios.

---

## Stage D — FastAPI: the real PawWalk backend

No more playground — the textbook is `apps/backend` itself. Every module: read the real
file, understand it line by line, extend it in a browser exercise, then (checklist) run
`uv run fastapi dev` + `uv run pytest` to see it live. **Read each anchor file before
writing the lessons — quote it exactly.**

### Task 23 — `23-pydantic-fastapi.js` · id `pydantic-fastapi` · ⚡

**Anchors:** `app/schemas.py`, `app/main.py`.

**Goal:** Pydantic models as self-validating types, and FastAPI turning typed functions
into an API with free docs.

**Lessons (4):**
1. **Pydantic: type hints that DO something** — `BaseModel`; construction validates;
   `EmailStr`, `Field(min_length=8)`; the module-16 cliffhanger resolved. Quote
   `SignupRequest` verbatim. Exercise: write a `ReviewRequest` model (rating 1–5 via
   `Field(ge=1, le=5)`, comment with `max_length`).
2. **Parsing & 422s** — `model_validate` on a dict; what happens on bad data
   (`ValidationError`); this is Flask lesson 19.2's validation in zero lines. Exercise:
   round-trip a booking dict through a model.
3. **FastAPI hello → the real main.py** — decorator routing looks like Flask, but
   parameters are TYPED and converted/validated automatically; read `app/main.py`: routers
   wired, lifespan, CORS (explain each briefly). Quiz on what `response_model=` does
   (validates output AND writes the docs).
4. **The contract loop** — change a model → `/docs` changes → clients follow;
   `docs/API-CONTRACT.md` is the human mirror. Checklist: add
   `Field(max_length=280)` to `CreateBookingRequest.notes` in the real repo, restart, see
   `/docs` update, send a 281-char note via /docs → 422, then revert (git checkout). End
   quiz.

### Task 24 — `24-fastapi-routers-di.js` · id `fastapi-routers-di` · 🧩

**Anchors:** `app/routers/walkers.py`, `app/routers/bookings.py`, `app/deps.py`,
`app/config.py`.

**Goal:** how the backend is organized: routers per resource, dependency injection,
typed settings, async.

**Lessons (4):**
1. **Routers** — `APIRouter`, prefix/tags, one file per resource in `app/routers/`; the
   Flask-blueprints rhyme. Exercise: skeleton of a new `reviews` router with a GET route.
2. **Dependency injection** — read `app/deps.py`; `Depends(...)` gives each request its
   session/current-user; compare to Part I's manual passing of `APIClient`. Exercise: a
   route signature taking `db: Session = Depends(get_db)` (match the repo's actual dep
   names — read `deps.py` first!).
3. **Typed settings** — `app/config.py` + `pydantic-settings`; `.env.example`;
   configuration is just another validated model. Quiz.
4. **Async & the event loop** — `async def` routes, `await`, I/O-bound vs CPU-bound in
   plain words; when FastAPI runs sync functions in a threadpool. Exercise: convert a sync
   route to async. Checklist: `GET /walkers/{id}/availability` — add a real (toy) endpoint
   to the repo returning hardcoded slots, see it in /docs (this one stays: it's the
   long-planned Phase 1 exercise from `docs/learning/backend.md`).

### Task 25 — `25-database-sqlalchemy.js` · id `database-sqlalchemy` · 🐘

**Anchors:** `app/models_db.py`, `app/db.py`, `app/seed.py`, `alembic/env.py`, one file in
`alembic/versions/`, `docs/ARCHITECTURE.md` (skim).

**Goal:** the persistence layer: SQLAlchemy models, sessions, and Alembic migrations —
Django's ORM ideas, unbundled.

**Lessons (4):**
1. **Tables as classes, again** — read `app/models_db.py`; map each column to its
   `app/schemas.py` twin and say WHY they're separate classes (DB shape ≠ API shape — the
   big architecture lesson of the module). Quiz on that separation.
2. **Sessions & queries** — `app/db.py`: engine, `SessionLocal`, the `get_db` dependency
   (module 24 callback); `select(...)`/`.where(...)` — Django queryset ↔ SQLAlchemy
   phrasebook table. Exercise: a query filtering walkers by rating.
3. **Alembic migrations** — `alembic revision --autogenerate` + `alembic upgrade head`;
   the backend runs `upgrade head` on startup, so after any model change you AUTOGENERATE A
   REVISION (never delete the DB). Checklist: add a nullable toy column to a model,
   autogenerate, inspect the revision, upgrade, then revert (downgrade + git checkout).
4. **Seeds & the whole flow** — `app/seed.py`; trace one request end to end:
   route → dependency → session → model → schema → JSON. Final quiz: order the steps.

### Task 26 — `26-auth-security.js` · id `auth-security` · 🔑

**Anchors:** `app/security.py`, `app/routers/auth.py`, `app/deps.py` (current-user dep),
`tests/test_api.py` (auth tests).

**Goal:** how signup/login/JWT actually work — the server side of Part I's auth module 08.

**Lessons (3):**
1. **Passwords are never stored** — hashing (read the repo's actual hash usage in
   `security.py`), salts in one paragraph; signup flow. Exercise: the verify-password
   branch returning 401 on mismatch. NEVER simplify away security here — quote the real
   code paths.
2. **JWT tokens** — what's inside a token (header/payload/signature), expiry; the repo's
   create/decode functions; the token the iOS app stored in Keychain came from exactly
   here. Exercise: build the token response shape (`AuthResponse` from schemas.py).
3. **Protecting routes** — the current-user dependency; 401 vs 403; user-scoped queries
   ("my bookings"). Checklist: signup + login via /docs, paste the token into Authorize,
   call a protected route with and without it. Final quiz.

### Task 27 — `27-payments-testing.js` · id `payments-testing` · 💳

**Anchors:** `app/routers/payments.py`, `tests/conftest.py`, `tests/test_api.py`,
`tests/test_stats_waitlist.py` (as a second example of test style).

**Goal:** the payment flow, then pytest — closing the "engineering hygiene" gap.

**Lessons (3):**
1. **Payments** — read `app/routers/payments.py`: intents, statuses, why amounts live in
   cents (Part I callback), idempotency in one paragraph; webhooks described conceptually
   (the repo pattern first, Stripe-in-production as outlook). Quiz.
2. **pytest & TestClient** — `tests/conftest.py` fixtures; tests run fully offline against
   a test DB; read one real test end to end; `uv run pytest`. Exercise: fill in the body
   of a test asserting `GET /walkers` returns 200 and ≥1 walker — checks verify
   `def test_`, `client.get(`, `assert`.
3. **Write your own test** — checklist: add a real test file for the availability endpoint
   from Task 24, run pytest until green. Final quiz on what makes a good test (one
   behavior, arranged/act/assert).

---

## Stage E — AI: LLMs, agents, RAG

The finale. **Everything must run WITHOUT an API key by default** — `app/assistant/intent.py`
has a heuristic fallback, and Task 30's retrieval is pure Python. Real-LLM steps are
checklist stretch items (`.env` + `PAWWALK_LLM_MODEL` per `.env.example`). Read
`docs/learning/backend.md` module 5 before writing these — the four staged agent exercises
there are the spine of Tasks 29/31.

### Task 28 — `28-llm-foundations.js` · id `llm-foundations` · 🤖

**Anchors:** `app/assistant/intent.py`, `app/routers/assistant.py`, `.env.example`.

**Goal:** what an LLM is, and how to make its output *typed* — Pydantic AI's
`Agent(output_type=…)`.

**Lessons (4):**
1. **What an LLM actually does** — next-token prediction, tokens, context window,
   temperature; why raw LLM text is unreliable as program input (the problem statement for
   the whole stage). Quiz.
2. **Prompts & chat shape** — system/user/assistant messages; few-shot examples; a prompt
   is a function argument, not magic. Exercise: write a system prompt string for a booking
   parser (checked loosely: mentions role + output expectations).
3. **Structured output** — the killer idea: `Agent(model, output_type=BookingIntent)`
   forces the reply to match a Pydantic model, retrying until valid; read `intent.py`
   verbatim — model, fallback heuristic, and the `BookingIntent` schema. Exercise: extend
   `BookingIntent` with a new optional field (`dog_name: str | None`).
4. **The fallback pattern** — heuristics when no key is set; graceful degradation as
   design, not embarrassment. Checklist: call `POST /assistant` via /docs with no key (see
   the heuristic answer), then the stretch: set a real key in `.env` and compare. Final
   quiz.

### Task 29 — `29-langgraph-agent.js` · id `langgraph-agent` · 🕸️

**Anchors:** `app/assistant/graph.py`, `app/assistant/intent.py`,
`docs/learning/backend.md` (module 5 exercises 1–3).

**Goal:** agents as explicit state machines: LangGraph's `StateGraph`, conditional edges,
tools.

**Lessons (4):**
1. **Why a graph, not a mega-prompt** — read `graph.py`: state dict, `parse_intent →
   find_walkers → draft_booking → END`; each node is a testable `state -> partial state`
   function. Quiz: trace a message through the graph.
2. **Nodes** — write one: the staged exercise, `dog_name` extraction in the heuristic
   parser (exercise in browser, then checklist to apply it in the repo and see it work).
3. **Conditional edges** — `add_conditional_edges`; the staged exercise: if `dog_name`
   missing → route to a new `ask_followup` node instead of `draft_booking`. Exercise: the
   router function; checklist: wire it in the repo, test both paths via `/assistant`.
4. **Tools** — Pydantic AI `@agent.tool` (decorator, again): give the agent a
   check-availability tool so it only suggests free walkers (staged exercise 3); tools =
   functions the LLM may call, still typed. Exercise: the tool signature + body skeleton.
   Final quiz: node vs edge vs tool — who does what.

### Task 30 — `30-rag-from-scratch.js` · id `rag-from-scratch` · 📚

**Anchors:** the repo's own `docs/*.md` (the corpus!); no new backend code yet. Playground:
`playground/rag-pawwalk/` — plain Python, **no new dependencies** (stdlib only; embeddings
via a real API are a stretch item at the end, never a requirement).

**Goal:** retrieval-augmented generation with no magic: chunk → embed (bag-of-words) →
cosine → retrieve → stuff the prompt. Every piece typed by hand.

**Lessons (4):**
1. **Why RAG** — LLMs don't know your data (ask one about PawWalk's cancellation policy —
   it hallucinates); fine-tuning vs retrieval in two paragraphs; the pipeline diagram in
   words. Quiz.
2. **Chunking** — read `docs/*.md` files (module 17's `open()` returns!), split by
   headings/paragraphs with overlap; why chunk size matters. Exercise: the
   `chunk(text, size, overlap)` function — checks verify slicing and the overlap step.
3. **Vectors & cosine similarity** — bag-of-words counts as honest toy embeddings
   (`collections.Counter`); cosine similarity in ~6 lines of stdlib Python (`sum`, `sqrt`);
   what real embedding models add (meaning, not just word overlap). Exercise: implement
   `cosine(a, b)` — the classic; checks verify the dot product loop and the denominator.
4. **Retrieve & generate** — top-k by score, build the augmented prompt ("Answer ONLY from
   the context below…"), answer with the heuristic/LLM from module 28. Checklist: assemble
   `rag.py` in the playground, ask it three PawWalk questions, watch it cite the right doc.
   Stretch item: swap bag-of-words for a real embeddings API. Final quiz: order the RAG
   pipeline stages.

### Task 31 — `31-rag-assistant-graduation.js` · id `rag-assistant-graduation` · 🎓

**Anchors:** `app/assistant/graph.py`, `app/routers/assistant.py`, Task 30's playground
code, `docs/learning/backend.md` (staged exercise 4: memory).

**Goal:** productionize Task 30 inside the real assistant, evaluate it, graduate.

**Lessons (3):**
1. **A RAG node in the graph** — port the playground retriever into a new
   `answer_question` node; a conditional edge routes question-intents to RAG and
   booking-intents down the existing path (Task 29's edge skills, applied). Exercise: the
   routing function. Checklist: wire it in, ask `/assistant` a policy question AND a
   booking request, watch each take its own path.
2. **Did it answer well? Evals 101** — a tiny eval set (5 question/expected-source pairs)
   as a list of dicts; a loop that scores retrieval hit-rate; why evals beat vibes.
   Exercise: the eval loop. Conversation memory (staged exercise 4) as the stretch
   checklist item.
3. **Graduation** — the full tour, in one checklist: run the backend, run pytest, hit every
   Stage D/E feature via /docs; then the Part II recap quiz (framework choice, the contract
   loop, why typed LLM output, the RAG pipeline). Final words mirror Part I's graduation
   module (see `12-assistant-graduation.js` for tone).

---

## After the last task

Update `docs/LEARNING-PLAN.md` and `apps/learn/README.md` if the shape drifted, and delete
nothing: `docs/learning/backend.md` stays as the prose companion (this course absorbs its
exercises; the doc already cross-references the same files).
