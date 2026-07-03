window.COURSE = window.COURSE || [];
window.COURSE.push({
  id: "django-orm",
  title: "Django ORM",
  emoji: "🗄️",
  lang: "python",
  lessons: [
    {
      id: "models",
      title: "Models",
      steps: [
        {
          type: "text",
          md: [
            "## A model is a table",
            "Every PawWalk walker needs to live somewhere between requests — right now `walker_list` in `views.py` just returns a hardcoded Python list, and it forgets everything the moment the server restarts. Django's fix is a **model**: a Python class that describes a database table, one attribute per column.",
            "This is the first database of the whole course. Django ships with **SQLite** already wired up in `settings.py` — a single file on disk, zero setup, perfect for learning. The real PawWalk backend talks to Postgres instead, but the swap is a few lines in `settings.py`; the model code you're about to write barely changes.",
          ],
        },
        {
          type: "code",
          title: "walks/models.py",
          source: String.raw`from django.db import models


class Walker(models.Model):
    name = models.CharField(max_length=100)
    rating = models.DecimalField(max_digits=3, decimal_places=2)
    price_cents = models.IntegerField()

    def __str__(self):
        return self.name`,
          caption: "Each field type maps to a column type: CharField needs a max_length, DecimalField needs precision, IntegerField is just a whole number — like price_cents everywhere else in this course.",
        },
        {
          type: "text",
          md: [
            "## Fields, decoded",
            "- **`models.Model`** — the base class that turns a plain class into a database table. Every model inherits from it.\n- **`CharField(max_length=100)`** — a short text column; Django *requires* `max_length` so the database can size the column.\n- **`IntegerField()`** — a whole number, same idea as `price_cents` in every other module of this course.\n- **`DecimalField(max_digits=3, decimal_places=2)`** — an exact decimal (never use a float for money or ratings); `4.90` fits `max_digits=3, decimal_places=2`.",
            "Notice what's missing: no `id` column. Django adds an auto-incrementing `id` primary key to every model automatically — you never write it.",
          ],
        },
        {
          type: "quiz",
          q: "Why does `DecimalField` need `max_digits` and `decimal_places`, when `IntegerField` needs nothing extra?",
          choices: [
            "The database column has to reserve a fixed amount of storage and precision for exact decimal math — a plain `float` would round money and ratings in ways that compound over time",
            "It's an arbitrary Django rule with no real reason",
            "IntegerField secretly also stores decimals, so it doesn't need the arguments",
            "max_digits and decimal_places only affect the Django admin display, not the database",
          ],
          answer: 0,
          explain: "DecimalField exists specifically so ratings and prices don't drift the way binary floats do. Telling Django the exact shape (3 total digits, 2 after the point) lets the database store it exactly.",
          nudge: "Think about what `DecimalField` is FOR — the same reason this course has always stored money as price_cents instead of a dollar float.",
        },
        {
          type: "exercise",
          title: "Write the Walker model",
          prompt: [
            "In `walks/models.py`, write `class Walker(models.Model):` with three fields: `name` as a `CharField(max_length=100)`, `rating` as a `DecimalField(max_digits=3, decimal_places=2)`, and `price_cents` as an `IntegerField()`.",
          ],
          starter: String.raw`from django.db import models

# your code here
`,
          solution: String.raw`from django.db import models


class Walker(models.Model):
    name = models.CharField(max_length=100)
    rating = models.DecimalField(max_digits=3, decimal_places=2)
    price_cents = models.IntegerField()`,
          checks: [
            { re: /class Walker\(models\.Model\):/, hint: "Declare the model as `class Walker(models.Model):` — every model inherits from `models.Model`." },
            { re: /name=models\.CharField\(max_length=100\)/, hint: "`name` is a `models.CharField(max_length=100)` — CharField always needs a max_length." },
            { re: /price_cents=models\.IntegerField\(\)/, hint: "`price_cents` is a plain `models.IntegerField()` — no arguments needed." },
          ],
          mustNot: [
            { re: /rating=models\.FloatField/, hint: "Use `DecimalField`, not `FloatField` — ratings deserve exact decimal math, same reasoning as prices." },
          ],
          success: "That's a real Django model — three fields away from being an actual database table.",
        },
      ],
    },
    {
      id: "migrations",
      title: "Migrations",
      steps: [
        {
          type: "text",
          md: [
            "## A model is just Python — until a migration says otherwise",
            "Writing `class Walker(models.Model):` doesn't touch the database at all. It's still just a Python class. Django needs a separate step to translate that class into an actual `CREATE TABLE` statement: a **migration**.",
            "Think of migrations as **version control for the schema** — the same way git tracks changes to code, migrations track changes to your database's shape over time, one file per change, in order.",
          ],
        },
        {
          type: "text",
          md: [
            "## The two-command dance",
            "- **`makemigrations`** — Django compares your models to the last migration it knows about, and writes a new migration FILE describing the difference (in `walks/migrations/0001_initial.py`, plain Python, readable). Nothing touches the database yet.\n- **`migrate`** — Django reads any migration files it hasn't applied yet and actually runs them against the database, creating or altering tables.",
            "You always run both, in that order. Skipping `migrate` means the migration file exists but the table doesn't.",
          ],
        },
        {
          type: "code",
          title: "walks/migrations/0001_initial.py (generated)",
          source: String.raw`class Migration(migrations.Migration):

    initial = True

    operations = [
        migrations.CreateModel(
            name="Walker",
            fields=[
                ("id", models.AutoField(primary_key=True)),
                ("name", models.CharField(max_length=100)),
                ("rating", models.DecimalField(max_digits=3, decimal_places=2)),
                ("price_cents", models.IntegerField()),
            ],
        ),
    ]`,
          caption: "Django wrote this file for you — a step-by-step recipe to build the table, checked into git like any other source file.",
        },
        {
          type: "text",
          md: [
            "## The real backend does the same job with Alembic",
            "PawWalk's actual backend (`apps/backend`) isn't Django — it's FastAPI with SQLAlchemy — but it faces the identical problem, solved with a different tool: **Alembic**. `alembic revision --autogenerate` is Django's `makemigrations`; `alembic upgrade head` is Django's `migrate`. Same two-step dance, different vocabulary.",
            "One difference worth knowing now: the real backend runs its migrations **automatically on startup** (`alembic upgrade head` fires before the server accepts requests), so the database is never out of sync with the code. In this Django playground, you run the two commands by hand.",
          ],
        },
        {
          type: "xcode",
          label: "Over to the terminal",
          title: "Create and apply the Walker migration",
          intro: [
            "In `playground/django-pawwalk/` (Task 20's project, with the `walks` app already added to `INSTALLED_APPS`):",
          ],
          items: [
            "Make sure `walks/models.py` has the `Walker` model from the previous lesson",
            "`uv run python manage.py makemigrations walks` — Django writes `walks/migrations/0001_initial.py`",
            "Open that generated file and read it — find the `CreateModel` call and match its fields to your `Walker` class",
            "`uv run python manage.py migrate` — Django creates the actual table in `db.sqlite3`",
            "`uv run python manage.py shell -c \"from walks.models import Walker; print(Walker.objects.count())\"` — prints `0`: the table exists and is empty",
          ],
        },
        {
          type: "quiz",
          q: "You edit `walks/models.py` to add a new field to `Walker`, but forget to run `makemigrations` and `migrate`. What happens when the app tries to query that new field?",
          choices: [
            "The database throws an error — the column doesn't exist yet, because only a migration actually alters the table",
            "Django adds the column automatically the next time the server starts",
            "The field silently defaults to None everywhere, with no error",
            "Nothing — Python classes and database tables are always kept in sync automatically",
          ],
          answer: 0,
          explain: "The model class and the database table are two separate things connected only by migrations. Editing the class changes Python's idea of the shape; only `makemigrations` + `migrate` changes the database's idea of it.",
          nudge: "Remember: `makemigrations` writes the recipe, `migrate` is the only step that actually touches the database.",
        },
      ],
    },
    {
      id: "admin",
      title: "The admin",
      steps: [
        {
          type: "text",
          md: [
            "## The \"for free\" moment",
            "Here's a feature nothing in Flask or FastAPI hands you automatically: Django ships with a full **admin site** — a web UI for viewing, adding, editing, and deleting rows in your tables — and it costs about three lines of code per model.",
            "`startproject` already wired `django.contrib.admin` into `INSTALLED_APPS` and `urls.py` back in Task 20. All that's left is telling the admin which models to manage.",
          ],
        },
        {
          type: "code",
          title: "walks/admin.py",
          source: String.raw`from django.contrib import admin

from .models import Walker

admin.site.register(Walker)`,
          caption: "Three lines: import the admin site, import the model, register it. That's the entire cost of a working CRUD UI for Walker.",
        },
        {
          type: "text",
          md: [
            "## Who's allowed in the door",
            "The admin site requires a login — you can't hand it to just anyone. `createsuperuser` makes the first admin account, from the terminal, interactively (username, email, password).",
            "This is a genuinely different philosophy from Flask, where you'd hand-write every one of these forms, routes, and permission checks yourself — and from the real FastAPI backend, which has no admin UI at all (it trusts the mobile clients and `/docs` instead). Django's bet is: most projects need this exact CRUD UI, so ship it built-in.",
          ],
        },
        {
          type: "xcode",
          label: "Over to the terminal",
          title: "Register Walker and add data through the admin",
          intro: ["Still in `playground/django-pawwalk/`:"],
          items: [
            "Edit `walks/admin.py` to add `from .models import Walker` and `admin.site.register(Walker)`",
            "`uv run python manage.py createsuperuser` — pick a username and password (email can be blank)",
            "`uv run python manage.py runserver` — leave it running",
            "Open [http://localhost:8000/admin/](http://localhost:8000/admin/) and log in with the superuser account",
            "Click **Walkers** → **Add Walker**, and add three walkers with a name, rating, and price_cents each",
            "Confirm all three show up in the Walkers list — you never wrote a single line of HTML or a route for any of this",
          ],
        },
        {
          type: "quiz",
          q: "You need a quick internal tool for support staff to fix a typo in a walker's name, with no engineering time to spare. Which framework from this course gets you there fastest, and why?",
          choices: [
            "Django — `admin.site.register(Walker)` gives a working edit UI in three lines, with zero routes or templates to write",
            "Flask — its minimalism makes UI-building faster than Django",
            "FastAPI — `/docs` is meant for exactly this kind of manual data editing",
            "All three are equally fast, since the underlying database work is identical",
          ],
          answer: 0,
          explain: "This is the admin's whole reason for existing: it's the fastest path in this course from “model exists” to “a human can edit rows in a browser,” at the cost of exactly three lines of code.",
          nudge: "Which framework in this course ships an entire CRUD web UI for free, versus one you'd have to hand-build?",
        },
      ],
    },
    {
      id: "querysets",
      title: "Querysets",
      steps: [
        {
          type: "text",
          md: [
            "## Asking the database for rows",
            "Every model gets a manager called `.objects` for free, and it's how you query the table. `Walker.objects.all()` returns every row; `Walker.objects.get(pk=1)` fetches exactly one by primary key. The interesting one is `.filter(...)`.",
          ],
        },
        {
          type: "code",
          title: "walks/views.py",
          source: String.raw`from django.http import JsonResponse

from .models import Walker


def walker_list(request):
    walkers = Walker.objects.filter(rating__gte=4.8)
    data = [
        {"id": w.id, "name": w.name, "rating": str(w.rating), "price_cents": w.price_cents}
        for w in walkers
    ]
    return JsonResponse({"walkers": data})`,
          caption: "`rating__gte=4.8` reads as “rating, greater-than-or-equal, 4.8” — the double underscore joins a field name to a lookup type. This replaces the hardcoded list `walker_list` returned back in Task 20.",
        },
        {
          type: "text",
          md: [
            "## The `__gte` lookup, and why it's lazy",
            "`__gte` is one of many lookup suffixes (`__lte`, `__contains`, `__in`, and more) — Django's way of building `WHERE` clauses without writing raw SQL. `Walker.objects.filter(rating__gte=4.8)` translates to roughly `SELECT * FROM walks_walker WHERE rating >= 4.8`.",
            "Querysets are also **lazy**: writing `Walker.objects.filter(...)` doesn't hit the database at all — it just builds up a description of the query. The actual SQL only runs when you *use* the result, like looping over it in the list comprehension above. This lets Django chain `.filter(...).order_by(...)` calls without running one query per step.",
          ],
        },
        {
          type: "quiz",
          q: "`Walker.objects.filter(rating__gte=4.8)` versus `[w for w in Walker.objects.all() if w.rating >= 4.8]` — both return the same walkers. What's the real difference?",
          choices: [
            "The queryset filter runs as a WHERE clause inside the database (in SQL); the list comprehension pulls every row into Python first and filters there",
            "There's no difference — Django rewrites list comprehensions into querysets automatically",
            "The list comprehension is always faster because Python is faster than SQL",
            "`.filter()` only works on fields that are indexed",
          ],
          answer: 0,
          explain: "The queryset pushes the comparison down into the database's WHERE clause — the database does the filtering and only sends back matching rows. The list comprehension has to fetch every single Walker row over the wire first, then discard most of them in Python. As the table grows, that difference gets enormous.",
          nudge: "Ask where the actual comparison `rating >= 4.8` executes in each version — inside the database engine, or after every row already arrived in Python?",
        },
        {
          type: "exercise",
          title: "Wire the filtered queryset into the view",
          prompt: [
            "Write the body of `walker_list(request)`. Query `Walker.objects.filter(rating__gte=4.8)` into a variable `walkers`, build a `data` list of dicts (`id`, `name`, `rating` as `str(w.rating)`, `price_cents`) via a list comprehension over `walkers`, then `return JsonResponse({\"walkers\": data})`.",
          ],
          starter: String.raw`from django.http import JsonResponse

from .models import Walker


def walker_list(request):
    # your code here
`,
          solution: String.raw`from django.http import JsonResponse

from .models import Walker


def walker_list(request):
    walkers = Walker.objects.filter(rating__gte=4.8)
    data = [
        {"id": w.id, "name": w.name, "rating": str(w.rating), "price_cents": w.price_cents}
        for w in walkers
    ]
    return JsonResponse({"walkers": data})`,
          checks: [
            { re: /Walker\.objects\.filter\(rating__gte=4\.8\)/, hint: "Query with `Walker.objects.filter(rating__gte=4.8)` — the double underscore joins the field to the `gte` lookup." },
            { re: /for w in walkers/, hint: "Build `data` with a list comprehension iterating `for w in walkers`." },
            { re: /JsonResponse\(\{"walkers":data\}\)/, hint: "Return `JsonResponse({\"walkers\": data})` — same response shape as Task 20's hardcoded view." },
          ],
          mustNot: [
            { re: /if w\.rating>=4\.8/, hint: "Let the database do the filtering with `.filter(rating__gte=4.8)` — don't re-filter in Python with an `if`." },
          ],
          success: "The filtering now runs in SQL, inside the database — not in a Python loop. That's the ORM doing its actual job.",
        },
      ],
    },
  ],
});
