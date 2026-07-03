window.COURSE = window.COURSE || [];
window.COURSE.push({
  id: "fastapi-routers-di",
  title: "Routers & Dependency Injection",
  emoji: "🧩",
  lang: "python",
  lessons: [
    {
      id: "routers",
      title: "Routers",
      steps: [
        {
          type: "text",
          md: [
            "## One file per resource",
            "`app/main.py` doesn't hold every route — that would be a repeat of Flask's giant `app.py` from module 19. Instead the real backend keeps one file per resource under `app/routers/`: `walkers.py`, `bookings.py`, `payments.py`, `auth.py`, and more. Each file builds its own `APIRouter` and gets wired into the app once, in `main.py`.",
            "This is the exact same instinct as Flask's **blueprints** (module 19): a mini app for one resource's routes, defined in its own file, then registered onto the main app. `APIRouter` is FastAPI's blueprint — same idea, typed.",
          ],
        },
        {
          type: "code",
          title: "app/routers/walkers.py",
          source: String.raw`from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from .. import data
from ..db import get_session
from ..deps import get_current_walker
from ..schemas import User, Walker, WalkerProfileUpdate

router = APIRouter(prefix="/walkers", tags=["walkers"])


@router.get("", response_model=list[Walker])
def list_walkers(session: Session = Depends(get_session)) -> list[Walker]:
    return data.list_walkers(session)


@router.get("/{walker_id}", response_model=Walker)
def get_walker(walker_id: str, session: Session = Depends(get_session)) -> Walker:
    walker = data.get_walker(session, walker_id)
    if walker is None:
        raise HTTPException(status_code=404, detail="Walker not found")
    return walker`,
          caption: "`APIRouter(prefix=\"/walkers\", tags=[\"walkers\"])` means every route below is automatically mounted under `/walkers` and grouped under a \"walkers\" heading in `/docs`. `@router.get(\"\")` is really `GET /walkers`; `@router.get(\"/{walker_id}\")` is `GET /walkers/{walker_id}`.",
        },
        {
          type: "text",
          md: [
            "## Order matters inside a router, just like Flask",
            "Look at `app/routers/bookings.py`: `GET /bookings/stats` and `GET /bookings/assigned` are declared **before** `GET /bookings/{booking_id}`. If `{booking_id}` came first, a request for `/bookings/stats` would match it instead, with `booking_id=\"stats\"`. Same trap as dynamic Flask routes in module 18 — first match wins, so specific paths go above the catch-all.",
            "Wiring a router into the app is one line in `app/main.py`: `app.include_router(walkers.router)`. That's the whole registration step — the prefix and tags travel with the router.",
          ],
        },
        {
          type: "quiz",
          q: "Why does `app/routers/bookings.py` declare `GET /bookings/stats` before `GET /bookings/{booking_id}`?",
          choices: [
            "So `/bookings/stats` isn't swallowed by the `{booking_id}` path parameter, which would match literally anything",
            "FastAPI requires routes to be declared in alphabetical order",
            "It makes the `/docs` page load faster",
            "`{booking_id}` routes must always be declared last in the file for the app to start",
          ],
          answer: 0,
          explain: "Routes are matched top to bottom, first match wins. `{booking_id}` is a wildcard segment — if it came first, `/bookings/stats` would be captured as booking_id=\"stats\" and 404 further down the line. Specific literal paths go before dynamic ones.",
          nudge: "Think about what `{booking_id}` actually matches — it's not picky about the text in that slot.",
        },
        {
          type: "exercise",
          title: "Skeleton of a new reviews router",
          prompt: [
            "PawWalk is adding reviews. Start a new `app/routers/reviews.py`. Create the router with `prefix=\"/reviews\"` and `tags=[\"reviews\"]`, then add a `GET /reviews` route (the empty-string path, same pattern as `list_walkers`) that returns an empty list for now.",
          ],
          starter: String.raw`from fastapi import APIRouter

# your code here
`,
          solution: String.raw`from fastapi import APIRouter

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.get("")
def list_reviews() -> list[dict]:
    return []`,
          checks: [
            { re: /router=APIRouter\(/, hint: "Create the router first: `router = APIRouter(...)`." },
            { re: /prefix="\/reviews",tags=\["reviews"\]/, hint: "Pass both `prefix=\"/reviews\"` and `tags=[\"reviews\"]` to `APIRouter(...)`, in that order." },
            { re: /@router\.get\("/, hint: "Add a route with the `@router.get(\"\")` decorator — the empty string, since the prefix already supplies `/reviews`." },
          ],
          success: "That's the exact skeleton every resource in app/routers/ starts from — router, then decorated functions underneath.",
        },
      ],
    },
    {
      id: "dependency-injection",
      title: "Dependency injection",
      steps: [
        {
          type: "text",
          md: [
            "## Depends() hands each request what it needs",
            "Every route above took a `session: Session = Depends(get_session)` parameter. `Depends(...)` is FastAPI's **dependency injection**: instead of the route function reaching out and creating its own database session, FastAPI calls `get_session()` for you, per request, and hands the result in as an argument. Same idea for the logged-in user: `Depends(get_current_walker)`.",
            "Compare this to Part I's `APIClient`: your SwiftUI views held a reference to a shared `APIClient` instance (often via `@EnvironmentObject` or a singleton) and called its methods directly. FastAPI's version is more automatic — you just declare *what type of thing you need* as a parameter, and `Depends(...)` says *how to get one*. The route never constructs it itself.",
          ],
        },
        {
          type: "code",
          title: "app/deps.py",
          source: String.raw`from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlmodel import Session

from .db import get_session
from .models_db import UserTable
from .schemas import User
from .security import decode_token

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    session: Session = Depends(get_session),
) -> User:
    user_id = decode_token(credentials.credentials) if credentials else None
    if user_id is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    row = session.get(UserTable, user_id)
    if row is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return User.model_validate(row, from_attributes=True)


def get_current_owner(current_user: User = Depends(get_current_user)) -> User:
    """Owner-only routes (pets, creating bookings)."""
    if current_user.role != "owner":
        raise HTTPException(status_code=403, detail="This action is for pet owners")
    return current_user


def get_current_walker(current_user: User = Depends(get_current_user)) -> User:
    """Walker-only routes (assigned walks, status transitions, profile edit)."""
    if current_user.role != "walker":
        raise HTTPException(status_code=403, detail="This action is for walkers")
    return current_user`,
          caption: "Dependencies can depend on OTHER dependencies: `get_current_owner` itself declares `current_user: User = Depends(get_current_user)`. FastAPI resolves the whole chain — bearer token → session → user → role check — before your route body ever runs.",
        },
        {
          type: "text",
          md: [
            "## Why this beats passing things around by hand",
            "Notice `get_session` — the database dependency — isn't in this file at all; it's imported from `app/db.py`. `app/deps.py` only holds the auth-flavored dependencies that build on top of it. Every route that needs a session declares `Depends(get_session)`, and every route that needs to know who's logged in declares `Depends(get_current_user)` (or the role-scoped `get_current_owner` / `get_current_walker`). No route manually opens a connection or checks a token — that logic lives in exactly one place and gets reused everywhere.",
            "This is the payoff: a 401 or 403 gets raised inside the dependency, before your route body runs at all. Compare to hand-checking `if request.headers.get(\"Authorization\")` in every Flask view — that's the boilerplate DI deletes.",
          ],
        },
        {
          type: "exercise",
          title: "A route that needs a session",
          prompt: [
            "Write a route function `list_walker_notes(walker_id)` that takes `walker_id: str` and a database session, using the SAME dependency the real routers use. Just return `[]` for now — the point is the signature.",
          ],
          starter: String.raw`from fastapi import APIRouter, Depends
from sqlmodel import Session

from ..db import get_session

router = APIRouter()


# your code here
`,
          solution: String.raw`from fastapi import APIRouter, Depends
from sqlmodel import Session

from ..db import get_session

router = APIRouter()


@router.get("/walkers/{walker_id}/notes")
def list_walker_notes(walker_id: str, session: Session = Depends(get_session)) -> list[dict]:
    return []`,
          checks: [
            { re: /def list_walker_notes\(walker_id:str,/, hint: "Keep `walker_id: str` as the first parameter, same as `get_walker(walker_id: str, ...)`." },
            { re: /session:Session=Depends\(get_session\)/, hint: "The session parameter must read exactly `session: Session = Depends(get_session)` — that's the repo's real dependency name, not `get_db`." },
            { re: /Depends\(/, hint: "The session has to come from `Depends(...)` — that's what makes it dependency injection instead of a manual argument." },
          ],
          mustNot: [
            { re: /Depends\(get_db\)/, hint: "This repo's dependency is called `get_session` (in `app/db.py`), not `get_db` — always check `deps.py`/`db.py` for the real name." },
          ],
          success: "Same signature shape as list_walkers, get_walker, and every other route in app/routers/ — db.py's get_session, injected via Depends().",
        },
      ],
    },
    {
      id: "typed-settings",
      title: "Typed settings",
      steps: [
        {
          type: "text",
          md: [
            "## Configuration is just another Pydantic model",
            "Every app needs configuration: a database URL, a JWT signing secret, feature flags. The tempting Python way is scattered `os.getenv(\"SOME_VAR\")` calls all over the codebase — no validation, no defaults in one place, and a typo in the env var name fails silently at 2am. `pydantic-settings` fixes this the same way Pydantic fixed request bodies in module 23: define a model, and loading becomes validation.",
            "`app/config.py` defines one `Settings` class. Fields with a default (like `app_name`) are optional; a field with NO default, like `jwt_secret`, means the app refuses to start unless it's actually set — a real deployment can't silently boot without a signing key.",
          ],
        },
        {
          type: "code",
          title: "app/config.py",
          source: String.raw`from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="PAWWALK_", env_file=".env", extra="ignore")

    app_name: str = "PawWalk API"
    version: str = "0.1.0"

    database_url: str = "sqlite:///./pawwalk.db"

    # No default on purpose: a real deployment must set PAWWALK_JWT_SECRET or
    # startup fails loudly. Local/dev gets a value from compose.yaml instead.
    jwt_secret: str
    jwt_alg: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7

    llm_model: str | None = None
    stripe_secret_key: str | None = None


settings = Settings()`,
          caption: "`SettingsConfigDict(env_prefix=\"PAWWALK_\", env_file=\".env\")` means the field `jwt_secret` is populated from the env var `PAWWALK_JWT_SECRET`, read straight out of a `.env` file if present. One `Settings()` call at import time, and `settings` is reused everywhere — the same object every module imports.",
        },
        {
          type: "code",
          title: ".env.example",
          source: String.raw`# Required. Secret used to sign JWTs — no default, the app refuses to start
# without it.
PAWWALK_JWT_SECRET=

# Optional — defaults shown.
# PAWWALK_JWT_ALG=HS256
# PAWWALK_JWT_EXPIRE_MINUTES=10080

# Which model Pydantic AI should use, e.g. openai:gpt-4o-mini
PAWWALK_LLM_MODEL=`,
          caption: "Every field in `Settings` has a matching `PAWWALK_`-prefixed line here. `.env` itself is gitignored (real secrets never get committed) — `.env.example` is the checked-in template a developer copies.",
        },
        {
          type: "quiz",
          q: "In `app/config.py`, `jwt_secret: str` has no default value, while `database_url: str = \"sqlite:///./pawwalk.db\"` does. What's the practical difference?",
          choices: [
            "The app fails to start if `PAWWALK_JWT_SECRET` isn't set, but happily falls back to the SQLite default if `PAWWALK_DATABASE_URL` isn't set",
            "There's no real difference — both are just documentation",
            "`jwt_secret` can only be set once per server lifetime; `database_url` can change at runtime",
            "Fields without defaults are automatically encrypted",
          ],
          answer: 0,
          explain: "A `pydantic-settings` field with no default is REQUIRED — construction raises a validation error if it's missing, so `Settings()` at import time crashes the app immediately with a clear message instead of limping along with an empty secret.",
          nudge: "Think about what happens the moment `Settings()` runs, at import time, if a no-default field has no matching env var.",
        },
      ],
    },
    {
      id: "async-event-loop",
      title: "Async & the event loop",
      steps: [
        {
          type: "text",
          md: [
            "## Every route so far has been `def`, not `async def`",
            "Look back at `list_walkers` — it's a plain `def`, not `async def`. That's allowed, and FastAPI handles it well: it runs ordinary `def` route functions in a small thread pool, so a slow one doesn't block other requests. `async def` is for a different situation: **I/O-bound** work — waiting on a network call, a database query, or a file read — where the function can *pause* while waiting and let the event loop handle other requests in the meantime.",
            "The rule of thumb: **I/O-bound** (waiting on something external — network, disk, another service) benefits from `async def` + `await`. **CPU-bound** (actually crunching numbers on the CPU) doesn't benefit from `async` at all — it still blocks the event loop while it runs, `async` keyword or not.",
          ],
        },
        {
          type: "code",
          title: "async def, conceptually",
          source: String.raw`async def get_walker(walker_id: str, session: Session = Depends(get_session)) -> Walker:
    walker = await data.get_walker_async(session, walker_id)
    if walker is None:
        raise HTTPException(status_code=404, detail="Walker not found")
    return walker`,
          caption: "`await` marks the exact point where this function can pause — while the database driver waits for a reply — and hand control back to the event loop so it can serve OTHER requests in the meantime. Without `await`, `async def` buys you nothing.",
        },
        {
          type: "text",
          md: [
            "## Why the real backend mostly stays sync",
            "SQLModel's synchronous engine (what `app/db.py` actually uses) doesn't support `await` — so PawWalk's routes stay plain `def`, and FastAPI's thread pool covers the waiting. If the backend later swapped in an async database driver, the same route shapes would become `async def` with `await` in front of every database call. The event loop itself doesn't care which style a given route uses — it just runs sync routes off to the side in threads, and async routes directly.",
          ],
        },
        {
          type: "exercise",
          title: "Convert a sync route to async",
          prompt: [
            "Convert this sync route to `async def`, and `await` the (now-async) data call. Keep everything else — the parameters, the 404 check, and the return — exactly the same.",
          ],
          starter: String.raw`def get_walker(walker_id: str, session: Session = Depends(get_session)) -> Walker:
    walker = data.get_walker(session, walker_id)
    # your code here
    if walker is None:
        raise HTTPException(status_code=404, detail="Walker not found")
    return walker`,
          solution: String.raw`async def get_walker(walker_id: str, session: Session = Depends(get_session)) -> Walker:
    walker = await data.get_walker(session, walker_id)
    if walker is None:
        raise HTTPException(status_code=404, detail="Walker not found")
    return walker`,
          checks: [
            { re: /async def get_walker\(/, hint: "Add `async` right before `def` — `async def get_walker(...)`." },
            { re: /await data\.get_walker\(/, hint: "The now-async call needs `await` in front of it: `await data.get_walker(...)`." },
            { re: /raise HTTPException\(status_code=404,detail="Walker not found"\)/, hint: "Keep the 404 branch exactly as it was — only the function signature and the data call change." },
          ],
          success: "That's the whole conversion: add async, add await at the one line that actually waits on I/O. Everything else in the route is untouched.",
        },
        {
          type: "xcode",
          label: "Over to the terminal",
          title: "Add a real (toy) availability endpoint",
          intro: [
            "Time to add a genuine new route to the running backend — a small, safe one: hardcoded availability slots for a walker, nothing that touches real booking data yet.",
          ],
          items: [
            "With the backend running (`uv run fastapi dev` in `apps/backend`), open `app/routers/walkers.py`",
            "Add a new route: `@router.get(\"/{walker_id}/availability\")` returning a hardcoded list of slots, e.g. `{\"slots\": [\"09:00\", \"11:00\", \"14:00\"]}`",
            "Save the file — `fastapi dev` auto-reloads",
            "Open [http://localhost:8000/docs](http://localhost:8000/docs), find `GET /walkers/{walker_id}/availability` under the walkers tag",
            "Try it out with any `walker_id` and confirm you get your hardcoded slots back",
          ],
        },
      ],
    },
  ],
});
