window.COURSE = window.COURSE || [];
window.COURSE.push({
  id: "django-anatomy",
  title: "Django Anatomy",
  emoji: "🏗️",
  lang: "python",
  lessons: [
    {
      id: "project-tour",
      title: "The project tour",
      steps: [
        {
          type: "text",
          md: [
            "## The third framework",
            "You just built `/walkers` twice in Flask: a `Flask(__name__)` app, a handful of `@app.route(...)` functions, everything in one or two small files. That's Flask's whole philosophy — a **micro**-framework that gives you almost nothing until you write it.",
            "Django is the opposite instinct: a **batteries-included** framework. One command sprays out a dozen files before you've written a line of your own — settings, URL routing, a database config, an admin site. This module's whole goal is to walk that file spray without getting lost.",
          ],
        },
        {
          type: "text",
          md: [
            "## Project vs app",
            "Django has two nested ideas, and the vocabulary trips everyone up at first:",
            "- A **project** is the whole Django installation — one settings file, one root URL config, the thing you deploy. You make one with `django-admin startproject`.\n- An **app** is a self-contained chunk of functionality inside a project — walkers, bookings, payments could each be their own app. You make one with `manage.py startapp`. A project can hold many apps.",
            "Think of the project as the Xcode project file, and each app as one feature module inside it — except Django apps are plain folders, not a special file type.",
          ],
        },
        {
          type: "xcode",
          label: "Over to the terminal",
          title: "Scaffold the Django playground",
          intro: [
            "Everything below happens in `playground/django-pawwalk/` (gitignored — you're never editing the real `apps/backend`):",
          ],
          items: [
            "`mkdir -p playground/django-pawwalk && cd playground/django-pawwalk`",
            "`uv init && uv add django`",
            "`uv run django-admin startproject pawwalk .` — the trailing `.` puts the project in the current folder instead of a nested one",
            "`uv run python manage.py startapp walks` — creates the `walks` app for walker/booking routes",
            "`uv run python manage.py runserver` — starts the dev server on port 8000",
            "Open [http://localhost:8000](http://localhost:8000) — Django's rocket ship page means the project is wired correctly",
          ],
        },
        {
          type: "code",
          title: "playground/django-pawwalk/ (after both commands)",
          source: String.raw`pawwalk/
    manage.py
    pawwalk/
        __init__.py
        settings.py
        urls.py
        asgi.py
        wsgi.py
    walks/
        __init__.py
        admin.py
        apps.py
        models.py
        views.py
        migrations/
            __init__.py`,
          caption: "The outer `pawwalk/` is the project — one `settings.py`, one `urls.py`. The inner `walks/` is the app — its own `views.py` and `models.py`, ready to be wired into the project.",
        },
        {
          type: "text",
          md: [
            "## Four files worth knowing by name",
            "- **`manage.py`** — the command-line entry point for everything: `runserver`, `startapp`, migrations (next module). You'll type `uv run python manage.py <command>` constantly.\n- **`pawwalk/settings.py`** — one Python file holding all project configuration: installed apps, database connection, allowed hosts. No `Package.swift`-style build system — it's just a Python module full of variables.\n- **`pawwalk/urls.py`** — the project's root URL table. Every request Django receives is matched against the patterns here first.\n- **`walks/views.py`** — where the app's request-handling functions live, the Django equivalent of a Flask route function.",
            "Compare the line count: Flask's entire app was one `app.py` file. Django just handed you nine files before you wrote anything. That trade — more structure, less improvisation — is the whole flavor of this stage.",
          ],
        },
        {
          type: "quiz",
          q: "You ran `startproject pawwalk` once, then `startapp walks`. If PawWalk later needed a separate `payments` app too, what would that require?",
          choices: [
            "Run `manage.py startapp payments` again — one more app folder inside the same project, registered alongside `walks`",
            "Run `django-admin startproject payments` — a whole new project",
            "Nothing extra — `walks` already handles every resource in a Django project",
            "Delete `walks` first, since a project can only hold one app at a time",
          ],
          answer: 0,
          explain: "A project can hold as many apps as you like — that's the point of the project/app split. The real backend's rough equivalent is one `app/` with many `routers/` files; Django just gives each concern its own folder instead of just its own file.",
          nudge: "Re-read the project vs app distinction — which command makes a NEW project, and which just adds a feature folder to the existing one?",
        },
      ],
    },
    {
      id: "urls-and-views",
      title: "URLs & views",
      steps: [
        {
          type: "text",
          md: [
            "## A view is `request → response`, same as Flask",
            "Strip away the file spray and Django's core idea is identical to Flask's: a Python function takes a request and returns a response. Django calls that function a **view**, and it lives in `walks/views.py` instead of decorated inline in `app.py`.",
            "The difference is registration. Flask decorates the function directly: `@app.route(\"/walkers\")`. Django keeps views and routing in two separate files — the view is just a plain function, and a separate `urls.py` maps a path to it.",
          ],
        },
        {
          type: "code",
          title: "walks/views.py",
          source: String.raw`from django.http import JsonResponse

WALKERS = [
    {"id": "w1", "name": "Ana", "rating": 4.9},
    {"id": "w2", "name": "Ben", "rating": 4.6},
]


def walker_list(request):
    return JsonResponse({"walkers": WALKERS})`,
          caption: "Every Django view's first parameter is `request` — even when the view never reads anything off it. `JsonResponse` is Django's `jsonify`: hand it a dict, get back a proper JSON HTTP response.",
        },
        {
          type: "code",
          title: "walks/urls.py (new file you create) + pawwalk/urls.py",
          source: String.raw`# walks/urls.py
from django.urls import path

from . import views

urlpatterns = [
    path("walkers/", views.walker_list),
]

# pawwalk/urls.py
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", include("walks.urls")),
]`,
          caption: "`path(\"walkers/\", views.walker_list)` reads as: when the URL matches `walkers/`, call `views.walker_list`. The project's root `urls.py` then `include()`s the app's URL list — one more layer than Flask, but it's what lets `walks` plug into any project unmodified.",
        },
        {
          type: "text",
          md: [
            "## JsonResponse — Django does APIs too",
            "It's tempting to think of Django as an HTML-templates framework, but `JsonResponse` proves it's just as capable of serving JSON as Flask or FastAPI. Same PawWalk data, same wire format your iOS app already decodes — just one more Python function shape to recognize.",
          ],
        },
        {
          type: "exercise",
          title: "Write walker_list and its route",
          prompt: [
            "In `walks/views.py`, write a view function `walker_list(request)` that returns `JsonResponse({\"walkers\": WALKERS})` (assume `WALKERS` and `JsonResponse` are already imported).",
            "Then, in `walks/urls.py`, add the route: `path(\"walkers/\", views.walker_list)` inside `urlpatterns`.",
          ],
          starter: String.raw`# views.py
def walker_list(request):
    # your code here

# urls.py
urlpatterns = [
    # your code here
]`,
          solution: String.raw`# views.py
def walker_list(request):
    return JsonResponse({"walkers": WALKERS})

# urls.py
urlpatterns = [
    path("walkers/", views.walker_list),
]`,
          checks: [
            { re: /def walker_list\(request\)/, hint: "The view takes exactly one parameter named `request` — Django always passes it, even if unused." },
            { re: /return JsonResponse\(\{"walkers":WALKERS\}\)/, hint: "Return `JsonResponse({\"walkers\": WALKERS})` — a dict with one key, `\"walkers\"`, wrapping the list." },
            { re: /path\("walkers\/",views\.walker_list\)/, hint: "Add `path(\"walkers/\", views.walker_list)` to `urlpatterns` — the path string, then the view function (no parentheses after it)." },
          ],
          mustNot: [
            { re: /views\.walker_list\(\)/, hint: "Pass the view function itself to `path(...)`, not a call to it — no `()` after `walker_list`." },
          ],
          success: "Route and view, wired together the Django way. Two files instead of one decorator — but the same request-in, response-out shape as Flask.",
        },
      ],
    },
    {
      id: "same-api-third-framework",
      title: "Same API, third framework",
      steps: [
        {
          type: "text",
          md: [
            "## Porting /walkers/<id>",
            "Flask's dynamic route was `@app.route(\"/walkers/<walker_id>\")`. Django's path converters look almost the same, just inside `path(...)`: `<str:walker_id>` captures a path segment as a string and passes it to the view as an argument — the type prefix (`str`, `int`, ...) is new, but the idea is identical.",
          ],
        },
        {
          type: "code",
          title: "walks/views.py + walks/urls.py",
          source: String.raw`# views.py
from django.http import Http404, JsonResponse


def walker_detail(request, walker_id):
    for w in WALKERS:
        if w["id"] == walker_id:
            return JsonResponse(w)
    raise Http404("walker not found")

# urls.py
urlpatterns = [
    path("walkers/", views.walker_list),
    path("walkers/<str:walker_id>/", views.walker_detail),
]`,
          caption: "`raise Http404(...)` is Django's `abort(404)` — stop the view and send back a 404. Next module's `get_object_or_404` shortcut collapses this whole loop into one line, once there's a real database model to query instead of a hardcoded list.",
        },
        {
          type: "text",
          md: [
            "## Tracing one request, start to finish",
            "A request for `GET /walkers/w1/` travels through exactly three files, in this order:",
            "1. **`pawwalk/settings.py`** — loaded once at startup; it points Django at `ROOT_URLCONF = \"pawwalk.urls\"`, so Django knows where routing even begins.\n2. **`pawwalk/urls.py`** — the root URL table; `include(\"walks.urls\")` hands off any unmatched path to the app's own URL list.\n3. **`walks/urls.py` → `walks/views.py`** — the path pattern matches `walkers/<str:walker_id>/`, and Django calls `walker_detail(request, walker_id=\"w1\")`.",
            "Same three-stop journey as Flask's `app.py` — match a path, call a function — just split across more files, each with one job.",
          ],
        },
        {
          type: "quiz",
          q: "A request comes in for `GET /walkers/w1/`. Put these in the order Django actually consults them.",
          choices: [
            "settings.py (loads ROOT_URLCONF) → pawwalk/urls.py (root table, includes the app) → walks/urls.py → walks/views.py (the matching view runs)",
            "walks/views.py runs first, then Django checks urls.py afterward to confirm it was allowed",
            "walks/urls.py → pawwalk/urls.py → settings.py → walks/views.py",
            "settings.py handles the whole request itself; urls.py and views.py are only used for the admin site",
          ],
          answer: 0,
          explain: "settings.py tells Django where the root URL config lives, the root urls.py includes the app's URL list, and only then does the matching path call into views.py. Three files, one direction — never backwards.",
          nudge: "Which file has to be read first just to know WHICH urls.py is the root one?",
        },
        {
          type: "quiz",
          q: "Flask vs Django so far: which framework decides more FOR you, out of the box?",
          choices: [
            "Django — one project command sprayed out settings, routing, an app structure, and an admin site before you wrote a single view; Flask gave you nothing but an import and a decorator",
            "Flask — `@app.route(...)` is more magical than Django's `path(...)`",
            "They decide the same amount; only the file count differs",
            "Neither decides anything — both are equally low-level until you add a database",
          ],
          answer: 0,
          explain: "Django's whole pitch is opinionated structure: a settings file, a URL system split from views, an app folder shape, and (coming next module) an ORM and an admin site, all included before you write a line of business logic. Flask hands you a blank file and gets out of the way. Neither is wrong — it's a trade between speed-to-start and structure-for-free, and Stage D's FastAPI will show a third answer to the same question.",
          nudge: "Count what existed in your project folder immediately after `startproject`, before you'd written any code at all — compare that to Flask's very first `app.py`.",
        },
      ],
    },
  ],
});
