window.COURSE = window.COURSE || [];
window.COURSE.push({
  id: "flask-deeper",
  title: "Flask Deeper",
  emoji: "🔧",
  lang: "python",
  lessons: [
    {
      id: "query-params",
      title: "Query params & request data",
      steps: [
        {
          type: "text",
          md: [
            "## Your Flask app already exists",
            "Last module you built `playground/flask-pawwalk/app.py`: a `Flask(__name__)` app with `GET /walkers` (a hardcoded `WALKERS` list) and `GET /walkers/<walker_id>` (lookup by id, `abort(404)` if missing). That app is still sitting there. This module extends it — you never start over.",
            "First extension: **query parameters**. In Part I, `URLSession` built URLs like `/walkers?min_rating=4.8` — the part after `?` is the query string. Flask hands it to you through `request.args`, a dict-like object of everything after the `?`.",
          ],
        },
        {
          type: "code",
          title: "playground/flask-pawwalk/app.py",
          source: String.raw`from flask import Flask, jsonify, request

app = Flask(__name__)

WALKERS = [
    {"id": "w1", "name": "Ana", "rating": 4.9},
    {"id": "w2", "name": "Ben", "rating": 4.6},
    {"id": "w3", "name": "Cleo", "rating": 4.8},
]


@app.route("/walkers")
def list_walkers():
    return jsonify(WALKERS)`,
          caption: "The starting point from module 18 — every walker, every time. No filtering yet.",
        },
        {
          type: "text",
          md: [
            "## `request.args.get(...)` — and it's ALWAYS a string",
            "`request.args.get(\"min_rating\")` reads the `min_rating` query param. Two gotchas, both familiar from module 17:",
            "- If the param is missing, `.get()` returns `None` (pass a second argument for a default, just like dict `.get()` from module 15).\n- Query params are **always strings** — even `\"4.8\"` comes through as text, never a `float`. You must convert it yourself.",
            "That means every query param needs the same `try`/`except ValueError` pattern you wrote in module 17 for `int(user_input)`. Nothing new syntactically — just the same defensive habit, now guarding a URL instead of `input()`.",
          ],
        },
        {
          type: "code",
          title: "playground/flask-pawwalk/app.py",
          source: String.raw`@app.route("/walkers")
def list_walkers():
    min_rating_raw = request.args.get("min_rating")
    if min_rating_raw is None:
        return jsonify(WALKERS)

    try:
        min_rating = float(min_rating_raw)
    except ValueError:
        return jsonify({"error": "min_rating must be a number"}), 422

    filtered = [w for w in WALKERS if w["rating"] >= min_rating]
    return jsonify(filtered)`,
          caption: "No query param → everyone. A bad one → 422. A good one → the list comprehension from module 15 does the filtering.",
        },
        {
          type: "quiz",
          q: "A client requests `GET /walkers?min_rating=high`. What does `request.args.get(\"min_rating\")` return, and what happens next in the code above?",
          choices: [
            "The string `\"high\"`; `float(\"high\")` raises `ValueError`, caught, and the route returns a 422",
            "`None`, because `\"high\"` isn't a valid rating",
            "The float `0.0`, since Flask converts invalid numbers to zero",
            "Flask raises a server error before the route function even runs",
          ],
          answer: 0,
          explain: "request.args always hands you strings — Flask never validates or converts them for you. `float(\"high\")` fails, your try/except catches it, and you choose the 422. That choice is entirely on you — this is the pain the spec keeps mentioning.",
          nudge: "`request.args.get(...)` never raises by itself — it just returns whatever string was in the URL, or None if absent. The failure happens one line later, at the `float(...)` call.",
        },
        {
          type: "exercise",
          title: "Filter walkers by minimum rating",
          prompt: [
            "Write the body of `list_walkers()`. Read `min_rating` from `request.args.get(\"min_rating\")`. If it's `None`, return `jsonify(WALKERS)`. Otherwise convert it with `float(...)` inside a `try`/`except ValueError` that returns `jsonify({\"error\": \"min_rating must be a number\"}), 422` on failure, then return `jsonify(...)` of the walkers whose `\"rating\"` is `>=` that value.",
          ],
          starter: String.raw`@app.route("/walkers")
def list_walkers():
    # your code here
`,
          solution: String.raw`@app.route("/walkers")
def list_walkers():
    min_rating_raw = request.args.get("min_rating")
    if min_rating_raw is None:
        return jsonify(WALKERS)

    try:
        min_rating = float(min_rating_raw)
    except ValueError:
        return jsonify({"error": "min_rating must be a number"}), 422

    filtered = [w for w in WALKERS if w["rating"] >= min_rating]
    return jsonify(filtered)`,
          checks: [
            { re: /request\.args\.get\("min_rating"\)/, hint: "Read the param with `request.args.get(\"min_rating\")` — exactly that key." },
            { re: /try:min_rating=float\(min_rating_raw\)except ValueError:/, hint: "Wrap the `float(...)` conversion in `try:` / `except ValueError:` — query params are strings and can't always convert." },
            { re: /for w in WALKERS if w\["rating"\]>=min_rating/, hint: "Filter with a list comprehension: `[w for w in WALKERS if w[\"rating\"] >= min_rating]` — same shape as module 15." },
          ],
          mustNot: [
            { re: /int\(min_rating_raw\)/, hint: "Ratings are decimals like 4.8 — convert with `float(...)`, not `int(...)`." },
          ],
          success: "Filtering by query param, safely. Next: the harder direction — data coming IN through a POST body.",
        },
      ],
    },
    {
      id: "post-validation",
      title: "POST & validation by hand",
      steps: [
        {
          type: "text",
          md: [
            "## Reading a POST body",
            "`GET /walkers?min_rating=4.8` puts data in the URL. Creating something — like a booking — needs more data than fits comfortably in a URL, so it travels in the **request body** as JSON. Flask reads it with `request.get_json()`, which does the `json.loads` from module 17 for you and hands back a plain Python dict — or `None` if the body wasn't valid JSON at all.",
            "PawWalk's real backend defines a booking's shape in `app/schemas.py`: a `walker_id`, and a `duration` that must be one of `Duration = Literal[30, 45, 60]` — never any other number of minutes. Flask has never heard of `Literal`. Every one of those rules is now **your job**, checked by hand, one `if` at a time.",
          ],
        },
        {
          type: "code",
          title: "app/schemas.py (real backend, for reference)",
          source: String.raw`Duration = Literal[30, 45, 60]


class CreateBookingRequest(BaseModel):
    walker_id: str
    duration: Duration
    notes: str = ""`,
          caption: "This is the contract you're about to hand-roll in Flask. Keep it in view — Task 23 shows what replaces all of the code you're about to write.",
        },
        {
          type: "code",
          title: "playground/flask-pawwalk/app.py",
          source: String.raw`@app.route("/bookings", methods=["POST"])
def create_booking():
    body = request.get_json(silent=True)
    if body is None:
        return jsonify({"error": "request body must be JSON"}), 422

    walker_id = body.get("walker_id")
    if not walker_id:
        return jsonify({"error": "walker_id is required"}), 422

    duration = body.get("duration")
    if duration is None:
        return jsonify({"error": "duration is required"}), 422
    if duration not in (30, 45, 60):
        return jsonify({"error": "duration must be 30, 45, or 60"}), 422

    booking = {"walker_id": walker_id, "duration": duration}
    return jsonify(booking), 201`,
          caption: "Count the lines between `def create_booking():` and the success path. Every single one exists only to guard against bad input.",
        },
        {
          type: "text",
          md: [
            "## Count them",
            "Go back to the code block above and literally count the `if` statements whose only job is validation (not counting the final success line). There are **four**: JSON-or-not, `walker_id` present, `duration` present, `duration` in the allowed set.",
            "**Remember that number.** In Stage D you'll write the exact same rule as `duration: Duration` — one type hint — and FastAPI/Pydantic will enforce all of it, generate the 422 automatically, AND write the API docs. Flask makes you do it in four lines by hand; FastAPI does it in zero.",
          ],
        },
        {
          type: "quiz",
          q: "`POST /bookings` arrives with body `{\"walker_id\": \"w1\", \"duration\": 40}`. What does the hand-rolled validation above do?",
          choices: [
            "Returns `422` with an error dict, because 40 isn't in `(30, 45, 60)`",
            "Returns `201` and creates the booking anyway, rounding 40 to 45",
            "Returns `404`, since `duration` isn't a known route",
            "Crashes the server with an unhandled exception",
          ],
          answer: 0,
          explain: "duration is present (so it passes the `is None` check) but fails `duration not in (30, 45, 60)` — that branch returns the 422 error dict. Flask never rounds or guesses; it only does exactly what your `if` statements say.",
          nudge: "Walk it through your own code: does `40` satisfy `duration in (30, 45, 60)`?",
        },
        {
          type: "exercise",
          title: "Validate a booking by hand",
          prompt: [
            "Write the body of `create_booking()`. Read the JSON body with `body = request.get_json(silent=True)`; if `body` is `None`, return a 422 error dict. Require `walker_id` (truthy) and `duration` (not `None`), returning 422 error dicts when missing. Then check `duration not in (30, 45, 60)` and return a 422 if so. Otherwise build a `booking` dict with `walker_id` and `duration` and return it with status `201`.",
          ],
          starter: String.raw`@app.route("/bookings", methods=["POST"])
def create_booking():
    # your code here
`,
          solution: String.raw`@app.route("/bookings", methods=["POST"])
def create_booking():
    body = request.get_json(silent=True)
    if body is None:
        return jsonify({"error": "request body must be JSON"}), 422

    walker_id = body.get("walker_id")
    if not walker_id:
        return jsonify({"error": "walker_id is required"}), 422

    duration = body.get("duration")
    if duration is None:
        return jsonify({"error": "duration is required"}), 422
    if duration not in (30, 45, 60):
        return jsonify({"error": "duration must be 30, 45, or 60"}), 422

    booking = {"walker_id": walker_id, "duration": duration}
    return jsonify(booking), 201`,
          checks: [
            { re: /request\.get_json\(silent=True\)/, hint: "Read the body with `request.get_json(silent=True)` — `silent=True` means bad JSON returns `None` instead of crashing." },
            { re: /duration not in\(30,45,60\)/, hint: "Check membership with `duration not in (30, 45, 60)` — the exact tuple from `Duration = Literal[30, 45, 60]`." },
            { re: /jsonify\(\{"error":/, hint: "Every failure path returns `jsonify({\"error\": \"...\"})` alongside a status code." },
            { re: /\),201/, hint: "On success, return the booking with a `201` status: `return jsonify(booking), 201`." },
          ],
          mustNot: [
            { re: /duration in\[30,45,60\]/, hint: "Use a tuple `(30, 45, 60)` with `not in`, matching the real schema's `Literal[30, 45, 60]` — not a list literal." },
          ],
          success: "Four validation ifs, hand-typed. Hold onto that count — Stage D turns it into a single type hint.",
        },
      ],
    },
    {
      id: "blueprints-errors",
      title: "Blueprints & error handlers",
      steps: [
        {
          type: "text",
          md: [
            "## One `app.py` won't survive contact with a real API",
            "Right now `app.py` holds walker routes AND booking routes in one file. That's fine for two resources. PawWalk's real backend has walkers, bookings, pets, payments, auth, an AI assistant — a dozen resources. One file would become an unreadable, un-mergeable wall of routes.",
            "Flask's answer is a **blueprint**: a mini Flask app for one resource's routes, defined in its own file, then registered onto the main `app`. It's the same instinct as splitting a giant SwiftUI view into smaller ones — one concern per file.",
          ],
        },
        {
          type: "code",
          title: "playground/flask-pawwalk/walkers.py",
          source: String.raw`from flask import Blueprint, jsonify, request

walkers_bp = Blueprint("walkers", __name__)

WALKERS = [
    {"id": "w1", "name": "Ana", "rating": 4.9},
    {"id": "w2", "name": "Ben", "rating": 4.6},
]


@walkers_bp.route("/walkers")
def list_walkers():
    return jsonify(WALKERS)`,
          caption: "A blueprint looks just like the app you already know — `@walkers_bp.route(...)` instead of `@app.route(...)`.",
        },
        {
          type: "code",
          title: "playground/flask-pawwalk/app.py",
          source: String.raw`from flask import Flask, jsonify

from walkers import walkers_bp
from bookings import bookings_bp

app = Flask(__name__)
app.register_blueprint(walkers_bp)
app.register_blueprint(bookings_bp)


@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "not found"}), 404`,
          caption: "`app.py` shrinks to wiring: import each blueprint, register it, define shared error handlers once. This is a small preview of the real backend's `app/routers/` folder — one file per resource, imported into `app/main.py`.",
        },
        {
          type: "text",
          md: [
            "## `@app.errorhandler(404)` — one place for shared behavior",
            "Without an error handler, Flask's default 404 is an HTML page — fine for a browser, useless for an API client expecting JSON. `@app.errorhandler(404)` intercepts every 404 across every blueprint and rewrites it as JSON, in exactly one place. Same idea for `@app.errorhandler(500)` if you wanted to guarantee JSON even on a crash.",
            "This is the same lesson as module 17's files/JSON module, generalized: don't repeat handling logic at every call site — centralize it.",
          ],
        },
        {
          type: "quiz",
          q: "Why does splitting `app.py` into `walkers.py` + `bookings.py` blueprints matter as the API grows, beyond just \"fewer lines per file\"?",
          choices: [
            "Each resource's routes, and the people who own them, can change independently without merge conflicts in one giant file — the same reason the real backend has a separate file per router in `app/routers/`",
            "Blueprints make the server run faster than a single-file app",
            "Flask requires blueprints once you have more than one route",
            "Blueprints automatically add validation that plain routes don't have",
            "It has no real benefit — it's purely a style preference",
          ],
          answer: 0,
          explain: "It's an organization win, not a performance or validation win: independent files mean independent changes and reviews. The real backend takes this exactly one step further with `app/routers/walkers.py`, `app/routers/bookings.py`, etc.",
          nudge: "Think about ten engineers editing one 3,000-line app.py at the same time versus ten small router files.",
        },
      ],
    },
    {
      id: "ship-it",
      title: "Ship the mini-API",
      steps: [
        {
          type: "text",
          md: [
            "## Assemble everything",
            "Time to put query filtering, hand-rolled validation, blueprints, and error handlers into one real, running mini-API — the full shape you've built across this module and the last.",
          ],
        },
        {
          type: "xcode",
          label: "Over to the terminal",
          title: "Build the two-blueprint PawWalk API",
          intro: [
            "In `playground/flask-pawwalk/` (already scaffolded from module 18 with `uv init && uv add flask`):",
          ],
          items: [
            "Create `walkers.py` with a `walkers_bp = Blueprint(\"walkers\", __name__)`, the `GET /walkers` route (with `min_rating` filtering) and `GET /walkers/<walker_id>` (404 on miss)",
            "Create `bookings.py` with a `bookings_bp = Blueprint(\"bookings\", __name__)` and the validated `POST /bookings` route from this module",
            "Rewrite `app.py` to just create `app = Flask(__name__)`, register both blueprints, and add `@app.errorhandler(404)` returning JSON",
            "Run it: `uv run flask --app app run --debug`",
            "`curl http://localhost:5000/walkers?min_rating=4.8` — only the highly-rated walkers come back",
            "`curl -X POST http://localhost:5000/bookings -H \"Content-Type: application/json\" -d '{\"walker_id\": \"w1\", \"duration\": 45}'` — a `201` with the booking",
            "`curl -X POST http://localhost:5000/bookings -H \"Content-Type: application/json\" -d '{\"walker_id\": \"w1\", \"duration\": 40}'` — a failing `422` with your error dict, on purpose",
            "`curl http://localhost:5000/nope` — your JSON 404, not Flask's default HTML page",
          ],
        },
        {
          type: "quiz",
          q: "You just shipped a real two-resource API in Flask. Looking back at everything you hand-wrote — the query param conversion, the four-line validation block, the tuple membership check, the JSON error dicts — what did Flask NOT do for you?",
          choices: [
            "Validate that incoming data matches a shape, or generate any API documentation from your code",
            "Route incoming requests to the correct Python function",
            "Convert a Python dict into a JSON HTTP response",
            "Let you split routes across multiple files",
          ],
          answer: 0,
          explain: "Flask nailed routing, blueprints, and JSON responses — that's its whole job as a micro-framework. What it never touched was validation (every check was an `if` you typed) or documentation (there is no `/docs` anywhere in this app). That gap is exactly what Stage D's FastAPI + Pydantic closes: types become validation AND documentation, for free.",
          nudge: "Think about the four-line validation block you counted earlier, and whether anything resembling `/docs` exists in this project.",
        },
      ],
    },
  ],
});
