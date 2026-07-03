window.COURSE = window.COURSE || [];
window.COURSE.push({
  id: "database-sqlalchemy",
  title: "Databases & SQLAlchemy",
  emoji: "🐘",
  lang: "python",
  lessons: [
    {
      id: "tables-as-classes-again",
      title: "Tables as classes, again",
      steps: [
        {
          type: "text",
          md: [
            "## Two classes, same walker",
            "Back in module 21 you wrote `class Walker(models.Model)` in Django — a class that IS a database table. The real PawWalk backend does the same thing with a different library: **SQLModel**, a thin layer over **SQLAlchemy** (Python's most-used database toolkit). The idea hasn't changed: one class, one table, one row per instance.",
            "But this backend ALSO has `app/schemas.py`, full of classes like `Walker(BaseModel)` — the Pydantic models from module 23. That's not a duplicate by accident. It's the big architecture lesson of this module: **the database shape and the API shape are deliberately two different classes.**",
          ],
        },
        {
          type: "code",
          title: "app/models_db.py",
          source: String.raw`"""SQLModel table definitions (Phase 1 — DB-backed storage).

Mirrors the field shapes in \`schemas.py\`. These are the storage layer; the
Pydantic models in \`schemas.py\` stay the request/response shapes and are never
returned directly from a route.
"""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel

from .schemas import BookingStatus


class WalkerTable(SQLModel, table=True):
    __tablename__ = "walkers"

    id: str = Field(primary_key=True)
    name: str
    photo_url: str | None = None
    rating: float
    price_per_30min_cents: int
    bio: str = ""
    neighborhoods: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    user_id: str | None = Field(default=None, foreign_key="users.id")`,
          caption: "`table=True` is the switch that turns a SQLModel class into a real table (a plain SQLModel without it behaves like a Pydantic model). Compare `WalkerTable` here to `Walker(BaseModel)` in `app/schemas.py` — same fields, same names, different job.",
        },
        {
          type: "text",
          md: [
            "## Same columns, why two classes?",
            "Lay them side by side:",
            "- `WalkerTable.rating: float` ↔ `Walker.rating: float = Field(ge=0, le=5)` — the DB just stores a float; the API model adds the 0–5 validation rule.\n- `WalkerTable.neighborhoods` is stored as a raw JSON column ↔ `Walker.neighborhoods: list[str] = []` is the clean list your client sees.\n- `WalkerTable.user_id` (a foreign key, an internal wiring detail) has **no equivalent at all** in `Walker` — API clients never need to know which login row a walker profile is linked to.",
            "**Why not one class for both?** Three reasons, and they compound:",
            "1. **Different concerns.** The table's job is *how it's stored* (foreign keys, indexes, JSON columns). The API model's job is *what a client is allowed to send or see* (validation, hiding internal fields, picking a wire-friendly shape).\n2. **Independent evolution.** You can add an internal `user_id` column to `WalkerTable` — for the login-linking feature — without that field ever leaking into `/walkers` responses, because `Walker` in `schemas.py` simply doesn't have it.\n3. **The password lesson.** `UserTable` has `password_hash`. `User` (the API model in `schemas.py`) does not. If they were the same class, returning a user from a route would leak the hash. Two classes make that mistake structurally impossible — you'd have to go out of your way to add the field to the model that leaves the server.",
            "A route never returns a `WalkerTable` row directly — it converts to the Pydantic model first (you'll see exactly how in lesson 4). That conversion step is the seam between 'what the DB holds' and 'what the wire sees'.",
          ],
        },
        {
          type: "quiz",
          q: "`UserTable` (in `models_db.py`) has a `password_hash` field. `User` (in `schemas.py`) does not. Why does that split matter?",
          choices: [
            "It structurally prevents a route from ever leaking the password hash to a client — the API model simply has no field to leak it through",
            "It's a historical accident; both classes should really be merged",
            "SQLModel doesn't support optional fields, so the split is a technical workaround",
            "It only matters for performance, not security",
          ],
          answer: 0,
          explain: "This is the core reason DB shape ≠ API shape. If `password_hash` lived on the one class a route returns, some future route would eventually return it by accident. Splitting the classes makes that bug impossible to write, not just easy to avoid.",
          nudge: "Think about what would happen if a route accidentally did `return user_table_row` straight to the client — which class doesn't give it that option?",
        },
      ],
    },
    {
      id: "sessions-and-queries",
      title: "Sessions & queries",
      steps: [
        {
          type: "text",
          md: [
            "## The engine and the session",
            "Two more pieces make the DB usable: an **engine** (a live connection to the actual database file/server) and a **session** (one conversation with the database — you open it, do some work, close it). Read the whole file — it's short.",
          ],
        },
        {
          type: "code",
          title: "app/db.py",
          source: String.raw`"""DB engine + session dependency (Phase 1).

Replaces the in-memory store in \`data.py\` with a real database, without the
router or schema layers changing — \`data.py\` stays the seam.
"""
from __future__ import annotations

from collections.abc import Iterator

from sqlmodel import Session, create_engine

from .config import settings

connect_args = (
    {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
)
engine = create_engine(settings.database_url, connect_args=connect_args)


def get_session() -> Iterator[Session]:
    with Session(engine) as session:
        yield session`,
          caption: "`settings.database_url` defaults to `sqlite:///./pawwalk.db` in `app/config.py` — the exact same connection string swaps to Postgres in production with zero code changes.",
        },
        {
          type: "text",
          md: [
            "## `get_session` — you already know this shape",
            "Look familiar? `get_session` is a **generator dependency** — the exact pattern module 24 taught you with `Depends(...)`. FastAPI calls it, runs everything before the `yield` (open a session), hands your route the value from `yield` (the session itself), and after your route finishes, runs everything after `yield` (the `with` block closes the session automatically).",
            "The plan called this dependency `get_db` — in the real repo it's named **`get_session`**, imported from `app.db` and wired into routes and other dependencies as `session: Session = Depends(get_session)`. You saw this exact line in `app/deps.py`'s `get_current_user`. Same DI mechanism, new callback.",
            "Once a route has a `session`, it asks the database questions using `select()` and `.where()` — SQLAlchemy's query language. Here's the real thing, from `app/routers/auth.py`:",
          ],
        },
        {
          type: "code",
          title: "app/routers/auth.py (excerpt)",
          source: String.raw`existing = session.exec(
    select(UserTable).where(UserTable.email == req.email)
).first()`,
          caption: "`select(UserTable)` builds the query, `.where(...)` filters it, `session.exec(...)` runs it against the database, `.first()` grabs one row (or `None`).",
        },
        {
          type: "text",
          md: [
            "## A phrasebook: Django queryset ↔ SQLAlchemy",
            "Module 21 taught you Django's queryset API. Same jobs, different spelling:",
            "| Django | SQLAlchemy / SQLModel |\n|---|---|\n| `Walker.objects.all()` | `session.exec(select(WalkerTable)).all()` |\n| `Walker.objects.filter(rating__gte=4.8)` | `session.exec(select(WalkerTable).where(WalkerTable.rating >= 4.8)).all()` |\n| `Walker.objects.get(pk=id)` | `session.get(WalkerTable, id)` |\n| `Walker.objects.order_by(\"-rating\")` | `select(WalkerTable).order_by(WalkerTable.rating.desc())` |",
            "Same underlying idea as Django: the filtering happens in the *database*, in SQL, not by looping over Python objects — a `select(...).where(...)` query is lazy until `session.exec(...)` actually runs it.",
          ],
        },
        {
          type: "exercise",
          title: "Filter walkers by rating",
          prompt: [
            "Write a query for `select_top_walkers(session)` that finds every `WalkerTable` row with `rating >= 4.8`, and returns the list. Use `select(...)`, `.where(...)`, `session.exec(...)`, and `.all()` — the same shapes you just saw in `auth.py`.",
          ],
          starter: String.raw`def select_top_walkers(session):
    # your code here
`,
          solution: String.raw`def select_top_walkers(session):
    return session.exec(select(WalkerTable).where(WalkerTable.rating >= 4.8)).all()`,
          checks: [
            { re: /select\(WalkerTable\)/, hint: "Start the query with `select(WalkerTable)` — that's the table you're asking about." },
            { re: /\.where\(WalkerTable\.rating\s*>=\s*4\.8\)/, hint: "Chain `.where(WalkerTable.rating >= 4.8)` onto the select — this is the filter." },
            { re: /session\.exec\(/, hint: "Wrap the whole `select(...).where(...)` in `session.exec(...)` to actually run it." },
            { re: /\.all\(\)/, hint: "Call `.all()` at the end to get every matching row back as a list." },
          ],
          mustNot: [
            { re: /for\s+\w+\s+in\s+session\.exec\(select\(WalkerTable\)\)\.all\(\)\s*:/, hint: "Don't fetch everything and filter in a Python loop — push the filter into `.where(...)` so SQL does the work." },
          ],
          success: "That's the real query pattern from app/routers/auth.py, aimed at ratings instead of email. The database does the filtering — Python just asks the question.",
        },
      ],
    },
    {
      id: "alembic-migrations",
      title: "Alembic migrations",
      steps: [
        {
          type: "text",
          md: [
            "## Migrations are version control for your schema",
            "Module 21 called this out for Django (`makemigrations`/`migrate`). The real backend uses **Alembic**, SQLAlchemy's migration tool, for the exact same job: every change to `models_db.py` needs a matching migration file that tells the database HOW to change its actual tables to match.",
            "`alembic/env.py` wires this to the app's own models and settings, so migrations are always generated against the real `models_db.py` and the real `database_url` — no separate config to keep in sync:",
          ],
        },
        {
          type: "code",
          title: "alembic/env.py (excerpt)",
          source: String.raw`from app import models_db  # noqa: F401 — registers tables on SQLModel.metadata
from app.config import settings

config = context.config
config.set_main_option("sqlalchemy.url", settings.database_url)
target_metadata = SQLModel.metadata`,
          caption: "Importing `models_db` is what makes Alembic aware of every `SQLModel` table — that import has a side effect: it registers each class onto `SQLModel.metadata`, which `target_metadata` then points at.",
        },
        {
          type: "code",
          title: "alembic/versions/c507af0b7e1c_initial_schema.py (excerpt)",
          source: String.raw`def upgrade() -> None:
    op.create_table('walkers',
    sa.Column('id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
    sa.Column('name', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
    sa.Column('rating', sa.Float(), nullable=False),
    sa.Column('price_per_30min_cents', sa.Integer(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('walkers')`,
          caption: "Every migration file has two functions: `upgrade()` (apply the change) and `downgrade()` (undo it). Alembic writes both for you when you autogenerate.",
        },
        {
          type: "text",
          md: [
            "## The rule that matters more than any syntax",
            "`app/db.py`'s `run_migrations()` runs `alembic upgrade head` **automatically, every time the backend starts.** That single fact changes how you're allowed to make a schema change:",
            "> After you edit `models_db.py`, you must **autogenerate a migration** before you restart the backend. Never delete `pawwalk.db` to 'reset' the schema — on a real deployment that's not a file you can delete, and even locally you'd throw away every seeded walker, booking, and login.",
            "The workflow, every time: edit the model → `alembic revision --autogenerate -m \"message\"` (Alembic diffs your models against the current DB and writes the migration) → read the generated file (autogenerate is a good guess, not gospel) → `alembic upgrade head` (apply it).",
          ],
        },
        {
          type: "xcode",
          label: "Over to the terminal",
          title: "Add a column, migrate, then revert",
          intro: [
            "Do this in `apps/backend`, with the server stopped so nothing else touches the DB mid-edit. You'll add a harmless nullable column, watch Alembic generate the migration, apply it, then undo everything — this checklist is a full round trip, not a permanent change.",
          ],
          items: [
            "Open `app/models_db.py` and add one line inside `WalkerTable`: `notes_internal: str | None = None` (nullable — no default headaches, no data to backfill)",
            "`cd apps/backend && uv run alembic revision --autogenerate -m \"add walker notes_internal\"` — Alembic diffs your model against the DB and writes a new file in `alembic/versions/`",
            "Open that new file and read it: confirm `upgrade()` has one `add_column(...)` call for `notes_internal`, and `downgrade()` has the matching `drop_column(...)`",
            "`uv run alembic upgrade head` — applies it; the running DB now has the column",
            "`uv run alembic downgrade -1` — undo it (the `downgrade()` you just read runs, dropping the column again)",
            "Revert your model edit too, so the repo is byte-for-byte clean: `git checkout app/models_db.py`",
            "`git status` — confirm nothing is left over (no new file under `alembic/versions/`, no modified `models_db.py`)",
          ],
        },
        {
          type: "quiz",
          q: "You just added a column to `models_db.py`. What's the ONE thing you must never do to make the running database match it?",
          choices: [
            "Delete the database file and let it get recreated from scratch",
            "Run `alembic revision --autogenerate` and then `alembic upgrade head`",
            "Read the generated migration file before applying it",
            "Restart the server after the migration is applied",
          ],
          answer: 0,
          explain: "Deleting the DB throws away every real row — seeded walkers, bookings, users — and doesn't scale to a deployed server where there IS no file to delete. Migrations exist precisely so schema changes and data can coexist.",
          nudge: "The backend runs `alembic upgrade head` on every startup — what does that make the DB file, disposable or precious?",
        },
      ],
    },
    {
      id: "seeds-and-the-whole-flow",
      title: "Seeds & the whole flow",
      steps: [
        {
          type: "text",
          md: [
            "## Where the demo data comes from",
            "Every walker, booking, and demo login you've seen in `/docs` or the app came from one file: `app/seed.py`. It runs on startup, after migrations, and is written to be safe to run again and again.",
          ],
        },
        {
          type: "code",
          title: "app/seed.py (excerpt)",
          source: String.raw`def seed_demo_data(session: Session) -> None:
    # 1. Public walker profiles.
    if session.exec(select(WalkerTable)).first() is None:
        session.add_all(
            WalkerTable(**{k: v for k, v in w.items() if k != "email"}) for w in _WALKERS
        )
        session.commit()`,
          caption: "The `if ... is None` guard is why seeding is idempotent (safe to re-run): it only inserts walkers when the table is empty, so restarting the backend a hundred times never creates duplicate rows.",
        },
        {
          type: "text",
          md: [
            "## One request, six hops",
            "You now know every piece. Trace a real request — `GET /walkers?min_rating=4.8` — end to end:",
            "1. **Route.** FastAPI matches the path to a function in `app/routers/walkers.py`.\n2. **Dependency.** That function's signature has `session: Session = Depends(get_session)` — FastAPI runs `get_session()` first and hands the route a live session (module 24's DI, lesson 2's callback).\n3. **Session.** The route uses that session to build a query: `select(WalkerTable).where(WalkerTable.rating >= min_rating)`.\n4. **Model.** `session.exec(...).all()` runs it and returns `WalkerTable` rows — plain database rows, still in DB shape.\n5. **Schema.** The route converts each row to the API shape: `Walker.model_validate(row, from_attributes=True)` (or a plain constructor call) — this is the seam from lesson 1, DB shape becoming API shape.\n6. **JSON.** FastAPI serializes the list of `Walker` Pydantic models to JSON and sends the response — the exact bytes your iOS/Android app decodes.",
            "Every module from 20 to 25 was one of those six hops. That's the whole backend.",
          ],
        },
        {
          type: "exercise",
          title: "Convert a row to its API shape",
          prompt: [
            "Write `to_api_walker(row)` that takes a `WalkerTable` row and returns a `Walker` (the Pydantic model from `schemas.py`) using `Walker.model_validate(...)` with `from_attributes=True` — the exact conversion hop 5 needs.",
          ],
          starter: String.raw`def to_api_walker(row):
    # your code here
`,
          solution: String.raw`def to_api_walker(row):
    return Walker.model_validate(row, from_attributes=True)`,
          checks: [
            { re: /Walker\.model_validate\(/, hint: "Call `Walker.model_validate(...)` — Pydantic's constructor-from-object method." },
            { re: /from_attributes\s*=\s*True/, hint: "Pass `from_attributes=True` so Pydantic reads fields off the row object's attributes, not a dict." },
            { re: /return/, hint: "Don't forget to `return` the converted model." },
          ],
          mustNot: [
            { re: /return\s+row/, hint: "Returning the raw row would hand back a WalkerTable — the DB shape, not the API shape. Convert it first." },
          ],
          success: "That's hop 5 of the request trace, typed out. The DB row never leaves the function — only its API-shaped twin does.",
        },
        {
          type: "quiz",
          q: "Put these six hops of `GET /walkers?min_rating=4.8` in the order they actually happen.",
          choices: [
            "Route match → dependency injects session → query via session → DB rows returned → converted to schema → serialized to JSON",
            "Serialized to JSON → route match → query via session → schema conversion → dependency injects session → DB rows returned",
            "Dependency injects session → DB rows returned → route match → query via session → serialized to JSON → schema conversion",
            "Query via session → route match → dependency injects session → schema conversion → DB rows returned → serialized to JSON",
          ],
          answer: 0,
          explain: "FastAPI matches the route first, resolves its dependencies (like `get_session`) before the function body runs, then the function body queries, gets rows back, converts them to the API schema, and FastAPI serializes the result last.",
          nudge: "The dependency has to exist before the route body can use it — and nothing can be serialized before it's been fetched and converted.",
        },
      ],
    },
  ],
});
