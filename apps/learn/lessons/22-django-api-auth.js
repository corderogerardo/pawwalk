window.COURSE = window.COURSE || [];
window.COURSE.push({
  id: "django-api-auth",
  title: "Django APIs & Auth",
  emoji: "🔐",
  lang: "python",
  lessons: [
    {
      id: "post-models-forms",
      title: "POST with models & forms",
      steps: [
        {
          type: "text",
          md: [
            "## A booking needs a walker",
            "So far `Walker` has been the only model in `playground/django-pawwalk/`. But a booking doesn't exist on its own — it's always *a booking of a specific walker*. That's a relationship, and Django models relationships with a **`ForeignKey`**.",
            "```\nclass Booking(models.Model):\n    walker = models.ForeignKey(\"Walker\", on_delete=models.CASCADE)\n    duration_minutes = models.IntegerField()\n    price_cents = models.IntegerField()\n```",
            "Read `on_delete=models.CASCADE` as an instruction, not decoration: *if this walker is deleted, delete their bookings too.* Every `ForeignKey` in Django must say what happens on the other side when the parent row disappears — there's no silent orphaning.",
          ],
        },
        {
          type: "text",
          md: [
            "## Flask made you write the ifs. Django writes a form for you",
            "In module 19 you validated a Flask request by hand: `if \"name\" not in data: return error`, one `if` per field. Django's **`ModelForm`** generates that validation FROM the model — the field types you already declared (`IntegerField`, `ForeignKey`) become validation rules for free.",
            "```\nfrom django import forms\nfrom .models import Booking\n\nclass BookingForm(forms.ModelForm):\n    class Meta:\n        model = Booking\n        fields = [\"walker\", \"duration_minutes\", \"price_cents\"]\n```",
            "In the view: `form = BookingForm(request.POST)`. Then `form.is_valid()` runs every rule at once and returns `True`/`False`. If it's `False`, `form.errors` is a dict of field → messages — no `if` chain, no manual type checks.",
          ],
        },
        {
          type: "code",
          title: "walks/views.py",
          source: String.raw`from django.http import JsonResponse
from .forms import BookingForm


def create_booking(request):
    form = BookingForm(request.POST)
    if form.is_valid():
        booking = form.save()
        return JsonResponse({"id": booking.id}, status=201)
    return JsonResponse({"errors": form.errors}, status=400)`,
          caption: "`form.save()` is new too — it writes the validated data straight to the database as a row. One call, no `INSERT` in sight.",
        },
        {
          type: "quiz",
          q: "In Flask (module 19) you'd write `if not data.get(\"duration_minutes\"): return error`. What replaces that whole chain in Django?",
          choices: [
            "`form.is_valid()`, driven by the field types already declared on the model",
            "Nothing — Django still needs the same manual `if` chain",
            "A try/except around `Booking.objects.create()`",
            "Django validates automatically at the database level only, with no Python-side check",
          ],
          answer: 0,
          explain: "The `ModelForm` reads the model's field types (`IntegerField`, `ForeignKey`, …) and turns them into validation rules. `form.is_valid()` runs all of them in one call; `form.errors` explains what failed.",
          nudge: "Think about where the field types came from — you already wrote them once, on the model.",
        },
        {
          type: "exercise",
          title: "The Booking model",
          prompt: [
            "Add a `Booking` model to `walks/models.py`. It needs:",
            "- `walker` — a `ForeignKey` to `\"Walker\"` that deletes bookings when the walker is deleted (`on_delete=models.CASCADE`)\n- `duration_minutes` — an `IntegerField`\n- `price_cents` — an `IntegerField`",
          ],
          starter: String.raw`from django.db import models


class Booking(models.Model):
    # your code here
    pass`,
          solution: String.raw`from django.db import models


class Booking(models.Model):
    walker = models.ForeignKey("Walker", on_delete=models.CASCADE)
    duration_minutes = models.IntegerField()
    price_cents = models.IntegerField()`,
          checks: [
            { re: /walker=models\.ForeignKey\("Walker",on_delete=models\.CASCADE\)/, hint: "Declare `walker = models.ForeignKey(\"Walker\", on_delete=models.CASCADE)` — the string `\"Walker\"` names the related model, and `on_delete` is required." },
            { re: /duration_minutes=models\.IntegerField\(\)/, hint: "`duration_minutes = models.IntegerField()` — same pattern as `Walker`'s fields from the last module." },
            { re: /price_cents=models\.IntegerField\(\)/, hint: "`price_cents = models.IntegerField()` — prices are stored as cents, same convention as the real backend." },
          ],
          mustNot: [
            { re: /models\.ForeignKey\(Walker,/, hint: "Pass `\"Walker\"` as a quoted string, not the bare class name — Django resolves it lazily, which avoids import-order headaches." },
          ],
          success: "That's a real relationship: every Booking row now points at exactly one Walker row, and the database enforces it.",
        },
      ],
    },
    {
      id: "auth-in-django",
      title: "Auth in Django",
      steps: [
        {
          type: "text",
          md: [
            "## A User model, already built",
            "Every Flask or FastAPI project you'll ever write needs its own `User` table, its own password hashing, its own login endpoint. Django ships all of it: `django.contrib.auth` gives you a `User` model, `createsuperuser`, password hashing, and a login view — nothing to design.",
            "`request.user` is available on every view. Log in, and it's a `User` instance; not logged in, and it's an `AnonymousUser`. Either way, `request.user.is_authenticated` just works.",
          ],
        },
        {
          type: "text",
          md: [
            "## Sessions vs. the tokens your iOS app uses",
            "Here's the part that matters for PawWalk. Django's default auth is **session-based**: log in, and Django creates a session record in the database, then sets a `sessionid` **cookie** in the response. Every later request from that browser automatically resends the cookie, and Django looks up the session to know who's asking.",
            "Cookies are a browser thing — sent automatically by the browser on every request to that domain. Your iOS app in Part I doesn't have that mechanism, which is exactly why the real PawWalk backend uses **token auth** instead: log in once, get back a token string, and *you* — `Services/APIClient.swift` — store it in the Keychain and attach it yourself on every request (`Authorization: Bearer <token>`).",
            "> The shorthand: **mobile clients want tokens** (no cookie jar, you control every header), **browser apps love sessions** (the browser manages the cookie for you, no client code needed).",
          ],
        },
        {
          type: "code",
          title: "walks/views.py — session login (Django's way)",
          source: String.raw`from django.contrib.auth import authenticate, login
from django.http import JsonResponse


def login_view(request):
    user = authenticate(
        request,
        username=request.POST["username"],
        password=request.POST["password"],
    )
    if user is not None:
        login(request, user)  # sets the sessionid cookie on the response
        return JsonResponse({"logged_in": True})
    return JsonResponse({"error": "invalid credentials"}, status=401)`,
          caption: "Compare this to Part I's login: no token is generated or returned here. The cookie IS the proof of login, and the browser handles resending it.",
        },
        {
          type: "quiz",
          q: "Your iOS app calls `POST /auth/login` on the real PawWalk backend and stores a string in the Keychain. A browser-based admin panel logs into that same kind of Django app instead. What's the key difference in how each proves it's still logged in on the NEXT request?",
          choices: [
            "The iOS app attaches the stored token itself in an `Authorization` header; the browser's cookie is resent automatically",
            "They're identical — both automatically resend a cookie set at login",
            "The iOS app also gets a cookie, just stored in the Keychain instead of a cookie jar",
            "Neither needs to prove anything again — the first login is enough forever",
          ],
          answer: 0,
          explain: "Tokens are proven by the CLIENT actively attaching them (that's why Part I's APIClient has code to add the header). Sessions are proven by the BROWSER passively resending a cookie — no client code needed, which is also why sessions don't fit a mobile app with no browser underneath it.",
          nudge: "Who does the work of resending proof-of-login: the app's own code, or the browser?",
        },
        {
          type: "quiz",
          q: "Why doesn't PawWalk's real FastAPI backend use Django-style session cookies for the iOS app?",
          choices: [
            "iOS has no browser managing a cookie jar for you — Part I's `APIClient` has to attach credentials itself, which is exactly what a token is for",
            "Cookies are less secure than tokens in every situation",
            "FastAPI is technically incapable of setting cookies",
            "Sessions only work with SQLite, and PawWalk uses Postgres",
          ],
          answer: 0,
          explain: "It's an architecture fit, not a security ranking: sessions lean on browser cookie-handling that a native app doesn't have, so mobile APIs issue a token the client stores and attaches itself.",
          nudge: "What piece of browser machinery does a native iOS app simply not have?",
        },
      ],
    },
    {
      id: "choosing-a-framework",
      title: "Choosing a framework",
      steps: [
        {
          type: "text",
          md: [
            "## Three frameworks, three philosophies",
            "You've now felt all three. Time for the honest comparison — not \"which is best\" (there isn't one), but which trade-off fits which job.",
            "| | Flask | Django | FastAPI |\n|---|---|---|---|\n| Philosophy | Micro — you wire everything | Batteries included — its way or the highway | Typed — the schema IS the contract |\n| Routing | Hand-written, one file | `urls.py` + views, project structure enforced | Decorator routing, typed parameters |\n| Validation | You write every `if` | `ModelForm`, from the model's fields | Pydantic models, automatic |\n| Auth | You build it | `User`, sessions, cookies — free | You build it (tokens, typically) |\n| Admin UI | None | Free, generated from models | None |\n| Docs | None | None | Free, generated from type hints (`/docs`) |\n| Async | No | Limited | Yes, native |\n| Best fit | Small APIs, full control | Content sites, internal tools, fast CRUD+admin | Typed APIs serving multiple clients |",
          ],
        },
        {
          type: "text",
          md: [
            "## Why PawWalk chose FastAPI",
            "PawWalk has exactly the shape FastAPI is built for: **two mobile clients** (iOS now, Android later) that both need to agree on a data contract with the server, with zero tolerance for silent mismatches. A Pydantic model like `SignupRequest` isn't documentation *about* the contract — it *is* the contract, checked on every request and mirrored by hand in Swift as `Codable` structs.",
            "Django's admin and sessions are fantastic — for a content site or an internal dashboard with one client (a browser) to please. PawWalk has no browser client and no content to administer through a UI; it has JSON flowing to native apps. Flask would work too, but you'd hand-write the exact validation and docs that FastAPI generates from type hints alone.",
            "None of Task 20–22 was wasted, though: Django's ORM patterns (querysets, migrations) and its \"give me an admin for free\" instinct show up again the moment you reach for `django-admin`-style tooling on a future project with a browser front end.",
          ],
        },
        {
          type: "xcode",
          label: "Over to the terminal",
          title: "Feel the trade-off yourself",
          intro: ["Django's admin is the fastest way to *feel* the \"batteries included\" trade-off. One more look before you close the Django detour for good:"],
          items: [
            "`cd playground/django-pawwalk && uv run python manage.py runserver`",
            "Open [http://localhost:8000/admin](http://localhost:8000/admin) and log in with the superuser from module 21",
            "Add a `Booking` row through the generated form — notice you wrote zero UI code for this",
            "Now imagine building that same form-plus-table UI by hand in Flask or FastAPI — that's the price of the \"its way or the highway\" philosophy, paid back with interest",
          ],
        },
        {
          type: "quiz",
          q: "Four scenarios, one framework each. Which one fits: (1) a marketing site with a blog admins update themselves, (2) a tiny script exposing one endpoint with total control, (3) a typed API serving both an iOS and an Android app, (4) an internal tool where non-engineers need a working data UI THIS week.",
          choices: [
            "(1) Django (2) Flask (3) FastAPI (4) Django",
            "(1) FastAPI (2) Django (3) Flask (4) FastAPI",
            "(1) Flask (2) FastAPI (3) Django (4) Flask",
            "All four: FastAPI — it's strictly the best framework",
            "All four: whichever the team already knows, the choice never matters",
          ],
          answer: 0,
          explain: "Django wins wherever an admin UI or content model saves real time (1 and 4). Flask wins when you want minimal ceremony over one or two routes (2). FastAPI wins when a typed contract has to hold across multiple clients (3) — exactly PawWalk's shape.",
          nudge: "Which framework gives you an admin panel for free? Which gives you the least ceremony for a single tiny endpoint? Which is built around a typed contract for multiple clients?",
        },
      ],
    },
  ],
});
