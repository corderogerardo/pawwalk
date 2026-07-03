window.COURSE = window.COURSE || [];
window.COURSE.push({
  id: "pydantic-fastapi",
  title: "Pydantic & FastAPI",
  emoji: "⚡",
  lang: "python",
  lessons: [
    {
      id: "pydantic-basics",
      title: "Pydantic: type hints that DO something",
      steps: [
        {
          type: "text",
          md: [
            "## No more playground",
            "Every module until now built throwaway code — a mini Flask app, a Django project you'll never deploy. Starting here, **the textbook is `apps/backend` itself.** You'll read the actual files that serve your iOS app, extend them in browser exercises, and (via terminal checklists) run the real server and the real test suite.",
            "First stop: Pydantic. It's the library that makes every model in `app/schemas.py` tick.",
          ],
        },
        {
          type: "text",
          md: [
            "## The cliffhanger from module 16, resolved",
            "Back in classes & typing you wrote `name: str` and were told: *a type hint doesn't enforce anything at runtime.* You can hand a Python function `name: str` and pass it `42` — nothing stops you. Python just shrugs.",
            "**Pydantic is the gap-filler.** A `pydantic.BaseModel` looks like a dataclass with type hints, but *constructing one actually checks the types* — and raises an error if they don't match. The hints stop being decoration and start being a contract.",
          ],
        },
        {
          type: "code",
          title: "app/schemas.py",
          source: String.raw`from pydantic import BaseModel, EmailStr, Field


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    name: str
    role: Role = "owner"`,
          caption: "Real code from the backend. `BaseModel` is the Pydantic base every schema inherits. `EmailStr` isn't a Python builtin — it's a Pydantic type that rejects anything that isn't a valid email shape. `Field(min_length=8)` attaches a rule to `password` beyond just \"is a string\".",
        },
        {
          type: "text",
          md: [
            "## Construction IS validation",
            "`SignupRequest(email=\"ana@example.com\", password=\"short\", name=\"Ana\")` doesn't just build an object — it **runs the checks first**. If `password` were 4 characters, Pydantic raises a `ValidationError` before a `SignupRequest` ever exists. There's no separate `.validate()` step to remember or forget.",
            "`Field(...)` is how you attach extra rules beyond the base type: `min_length=8` on a string, or — for a number — `ge=1, le=5` (greater-or-equal / less-or-equal), turning a plain `int` into \"an int, but only 1 through 5\".",
          ],
        },
        {
          type: "quiz",
          q: "A caller constructs `SignupRequest(email=\"not-an-email\", password=\"longenough\", name=\"Ana\")`. What happens?",
          choices: [
            "Pydantic raises a ValidationError immediately — email isn't a valid address",
            "It's created fine; email format is only checked when you save to a database",
            "It silently sets email to None",
            "Python raises a TypeError before Pydantic even runs",
          ],
          answer: 0,
          explain: "EmailStr's whole job is to validate the shape of the string at construction time. Bad input never becomes a real SignupRequest — it becomes an exception, right where the bad data entered the system.",
          nudge: "Re-read the text step above: construction IS validation, not a separate step.",
        },
        {
          type: "text",
          md: [
            "## Your turn: a ReviewRequest model",
            "PawWalk doesn't have a review model yet — you're about to write the first draft of one, the same way `SignupRequest` was written.",
            "A review needs a `rating` from 1 to 5 (use `Field(ge=1, le=5)` on an `int`) and a `comment` string capped at some length (use `Field(max_length=...)`).",
          ],
        },
        {
          type: "exercise",
          title: "Write ReviewRequest",
          prompt: [
            "Define `class ReviewRequest(BaseModel):` with two fields:",
            "- `rating: int = Field(ge=1, le=5)`\n- `comment: str = Field(max_length=280)`",
          ],
          starter: String.raw`from pydantic import BaseModel, Field

# your code here
`,
          solution: String.raw`from pydantic import BaseModel, Field


class ReviewRequest(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str = Field(max_length=280)`,
          checks: [
            { re: /class ReviewRequest\(BaseModel\):/, hint: "Declare the class as `class ReviewRequest(BaseModel):` — it must inherit from Pydantic's `BaseModel`." },
            { re: /rating:int=Field\(ge=1,le=5\)/, hint: "The rating field: `rating: int = Field(ge=1, le=5)` — `ge`/`le` bound it between 1 and 5 inclusive." },
            { re: /max_length=280/, hint: "Give `comment` a cap with `Field(max_length=280)` (any number works, but write it as `max_length=`)." },
          ],
          mustNot: [
            { re: /class ReviewRequest:/, hint: "Don't drop `(BaseModel)` — without it, this is a plain class with zero validation." },
          ],
          success: "That's a real Pydantic model: rating can never be 0 or 11, comment can never blow past 280 characters — and you didn't write a single if-statement.",
        },
      ],
    },
    {
      id: "parsing-422",
      title: "Parsing & 422s",
      steps: [
        {
          type: "text",
          md: [
            "## Two ways data becomes a model",
            "So far you've built models with keyword arguments: `SignupRequest(email=..., password=..., name=...)`. But data usually arrives as a **dict** — parsed from JSON that came over the wire. Pydantic's `model_validate` builds a model straight from a dict, running the exact same checks.",
            "`SignupRequest.model_validate({\"email\": \"ana@example.com\", \"password\": \"longenough\", \"name\": \"Ana\"})` — same validation, dict in instead of keywords in.",
          ],
        },
        {
          type: "text",
          md: [
            "## When it fails: ValidationError → 422",
            "If the dict is missing a field, or a field has the wrong shape, `model_validate` raises `pydantic.ValidationError` — a Python exception, same family as the `try`/`except` you learned in module 17.",
            "FastAPI catches that exact exception for you at the edge of every route and turns it into an **HTTP 422 Unprocessable Entity** response, with a JSON body listing exactly which field failed and why. You never write that translation yourself.",
            "Remember module 19's Flask lesson? You hand-counted the lines of `if`/`else` validation code needed for `POST /bookings`, then were told: *FastAPI does this in zero lines.* This is that promise, paid off — Pydantic model + FastAPI route, and the 422 just happens.",
          ],
        },
        {
          type: "code",
          title: "app/schemas.py",
          source: String.raw`class CreateBookingRequest(BaseModel):
    walker_id: str
    dog_name: str
    start_time: datetime
    duration_minutes: Duration = 30
    notes: str | None = None`,
          caption: "`Duration` is `Literal[30, 45, 60]` from module 16 — a closed set of valid durations. Send `duration_minutes: 40` and Pydantic rejects it before your route body ever runs.",
        },
        {
          type: "quiz",
          q: "A client POSTs `{\"walker_id\": \"w1\", \"dog_name\": \"Mochi\", \"start_time\": \"2026-01-01T10:00:00\", \"duration_minutes\": 40}` to create a booking. What happens?",
          choices: [
            "422 — 40 isn't one of the allowed Literal values (30, 45, 60)",
            "201 — it creates the booking with duration_minutes rounded to 45",
            "500 — the server crashes because Literal isn't a real type",
            "200 — FastAPI ignores duration_minutes entirely",
          ],
          answer: 0,
          explain: "Literal[30, 45, 60] means exactly those three ints are valid — nothing else. FastAPI runs CreateBookingRequest's validation on the incoming JSON automatically, and 40 fails it, so the client gets a 422 with a field-level error message instead of bad data ever reaching your code.",
          nudge: "Think back to Literal from module 16: it makes invalid states unrepresentable. 40 was never a representable state.",
        },
        {
          type: "text",
          md: [
            "## Your turn: round-trip a booking dict",
            "Time to do exactly what FastAPI does under the hood: take a dict (imagine it just came from `json.loads` on a request body) and turn it into a real `CreateBookingRequest`, using `model_validate`.",
          ],
        },
        {
          type: "exercise",
          title: "Parse a booking dict",
          prompt: [
            "Given the dict `booking_data` below, create a `CreateBookingRequest` from it named `booking` using `CreateBookingRequest.model_validate(booking_data)`.",
          ],
          starter: String.raw`booking_data = {
    "walker_id": "w1",
    "dog_name": "Mochi",
    "start_time": "2026-01-01T10:00:00",
    "duration_minutes": 30,
}

# your code here
`,
          solution: String.raw`booking_data = {
    "walker_id": "w1",
    "dog_name": "Mochi",
    "start_time": "2026-01-01T10:00:00",
    "duration_minutes": 30,
}

booking = CreateBookingRequest.model_validate(booking_data)`,
          checks: [
            { re: /booking=CreateBookingRequest\.model_validate\(booking_data\)/, hint: "Call `CreateBookingRequest.model_validate(booking_data)` and store the result in `booking`." },
          ],
          mustNot: [
            { re: /CreateBookingRequest\(\*\*booking_data\)/, hint: "That also works in real Python, but this exercise is about `model_validate` specifically — the method FastAPI itself calls on incoming JSON." },
          ],
          success: "That's the exact move FastAPI makes on every request body: dict in, validated model out — or a ValidationError (which becomes your client's 422) if the data doesn't fit.",
        },
      ],
    },
    {
      id: "fastapi-hello",
      title: "FastAPI hello → the real main.py",
      steps: [
        {
          type: "text",
          md: [
            "## Familiar decorator, new superpower",
            "`@app.route(\"/\")` from Flask and FastAPI's `@app.get(\"/\")` look almost identical — same decorator idea from module 16, same \"a function handles a request\" model from Flask. The difference is what happens to the function's **parameters**.",
            "In Flask, everything from the request is a string you convert by hand (`float(request.args.get(...))`, remember module 19?). In FastAPI, you write a type hint on the parameter, and FastAPI converts AND validates it for you — using Pydantic under the hood.",
          ],
        },
        {
          type: "code",
          title: "hello world, FastAPI-style",
          source: String.raw`from fastapi import FastAPI

app = FastAPI()


@app.get("/walkers/{walker_id}")
def get_walker(walker_id: str, min_rating: float = 0) -> dict:
    return {"walker_id": walker_id, "min_rating": min_rating}`,
          caption: "walker_id comes from the URL path; min_rating comes from a query param (?min_rating=4.8) — FastAPI parses it as a float automatically, and 422s if it isn't one. No hand-written float(...) + try/except.",
        },
        {
          type: "text",
          md: [
            "## Now the real thing: app/main.py",
            "This is the file that boots the actual PawWalk server. Read it slowly — every line earns its place.",
          ],
        },
        {
          type: "code",
          title: "app/main.py",
          source: String.raw`from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlmodel import Session

from .config import settings
from .db import engine, run_migrations
from .routers import assistant, auth, bookings, live, payments, pets, waitlist, walkers
from .seed import seed_demo_data


@asynccontextmanager
async def lifespan(app: FastAPI):
    run_migrations()
    with Session(engine) as session:
        seed_demo_data(session)
    yield


app = FastAPI(title=settings.app_name, version=settings.version, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(walkers.router)
app.include_router(bookings.router)
app.include_router(pets.router)
app.include_router(payments.router)
app.include_router(assistant.router)
app.include_router(live.router)
app.include_router(waitlist.router)`,
          caption: "lifespan runs ONCE at startup — migrations, then demo data — and yield hands control to the running server (module 17's `with` returns: it's a context manager). CORS is a browser-only gate — your iOS app doesn't send an Origin header, so it never hits this wall (only the landing page and Swagger UI do). Each include_router bolts on one resource's routes — the Flask-blueprints idea from module 19, but built in from day one instead of retrofitted.",
        },
        {
          type: "text",
          md: [
            "## response_model= does two jobs at once",
            "Look at any route in `app/routers/bookings.py`: `@router.post(\"\", response_model=Booking, status_code=201)`. That `response_model=Booking` argument isn't decoration — it does real work, twice:",
            "1. **Validates the output.** Whatever your function returns gets checked against `Booking` before it's sent. Accidentally return a field with the wrong type, and FastAPI catches it server-side instead of shipping a broken response.\n2. **Writes the docs.** `/docs` reads `response_model` to show exactly what shape a client should expect back — no comment, no wiki page, just the model.",
          ],
        },
        {
          type: "quiz",
          q: "A route is declared `@router.get(\"\", response_model=list[Booking])`. What does `response_model=list[Booking]` actually do?",
          choices: [
            "Both validates the returned data matches a list of Booking objects AND generates that shape in the /docs page",
            "Only affects the /docs page — it has no effect on the actual response at runtime",
            "Only validates the response — /docs shows a generic 'object' with no detail",
            "Converts the response into a Django QuerySet before returning",
          ],
          answer: 0,
          explain: "response_model is doing double duty: FastAPI runs the return value through Booking's Pydantic validation before sending it, AND that same model is what powers the auto-generated /docs schema for this endpoint. One declaration, two payoffs.",
          nudge: "Re-read the text step above — response_model was described as doing two jobs, not one.",
        },
      ],
    },
    {
      id: "contract-loop",
      title: "The contract loop",
      steps: [
        {
          type: "text",
          md: [
            "## The loop that runs this whole backend",
            "Here's the idea the whole FastAPI stage is building toward: **change a Pydantic model → `/docs` changes with it → both mobile clients follow the new contract.** No separate documentation to update, no Postman collection to keep in sync — the model *is* the source of truth, and `docs/API-CONTRACT.md` is just the human-readable mirror of it.",
            "You're about to make that loop happen with your own hands: add one rule to a real field, and watch the docs update live.",
          ],
        },
        {
          type: "xcode",
          label: "Over to the terminal",
          title: "Change a model, watch the contract move",
          intro: [
            "You'll edit one real line in the repo, see the effect, then put it back exactly as you found it. This is a read → run → extend → revert loop — the repo should be untouched when you're done.",
          ],
          items: [
            "`cd apps/backend && uv run fastapi dev` — start the real server (leave it running)",
            "Open [http://localhost:8000/docs](http://localhost:8000/docs), expand `POST /bookings`, and look at the `notes` field on `CreateBookingRequest` — no length limit yet",
            "In `app/schemas.py`, find `class CreateBookingRequest(BaseModel):` and change `notes: str | None = None` to `notes: str | None = Field(default=None, max_length=280)`",
            "Save the file — `fastapi dev` auto-reloads. Refresh `/docs` and expand `POST /bookings` again: the schema now shows `notes` capped at 280 characters",
            "In `/docs`, try it out on `POST /bookings` with a `notes` value 281 characters long (any repeated letter works) plus the other required fields — execute it and confirm you get a **422**, not a 201",
            "Revert your edit: `git checkout -- app/schemas.py` (or manually restore the original line) — confirm `git status` shows the file clean again",
          ],
        },
        {
          type: "quiz",
          q: "You just watched one line change in app/schemas.py ripple all the way to a 422 in the live API. What made that possible, in one sentence?",
          choices: [
            "The Pydantic model is the single source of truth — FastAPI derives both validation and docs from it, so nothing else needs to change by hand",
            "FastAPI re-reads docs/API-CONTRACT.md on every request to decide what's valid",
            "The iOS and Android apps pushed a config update the moment the server restarted",
            "It was a coincidence — the 422 came from an unrelated validation rule",
          ],
          answer: 0,
          explain: "That's the contract loop: one model, validation and documentation both generated from it automatically. Every lesson in this module was building toward this one idea — it's why PawWalk chose FastAPI for a backend serving two mobile clients.",
          nudge: "Think about what response_model= and Field(...) both have in common — they live in exactly one place: the model.",
        },
      ],
    },
  ],
});
