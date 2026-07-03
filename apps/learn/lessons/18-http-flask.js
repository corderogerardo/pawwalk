window.COURSE = window.COURSE || [];
window.COURSE.push({
  id: "http-flask",
  title: "HTTP & Flask",
  emoji: "🌐",
  lang: "python",
  lessons: [
    {
      id: "http-request",
      title: "What an HTTP request actually is",
      steps: [
        {
          type: "text",
          md: [
            "## The thing URLSession was sending",
            "In Part I, every time the iOS app called `APIClient`, it used `URLSession` to send an **HTTP request** to `http://localhost:8000` and got an **HTTP response** back. You never saw what that looked like on the wire — it was hidden behind Swift's `Codable` types. Time to open the envelope.",
            "An HTTP request is just **plain text** sent over a network connection. No magic, no binary format — you could type one by hand with `telnet` if you wanted to.",
          ],
        },
        {
          type: "code",
          title: "A raw HTTP request and response",
          source: String.raw`GET /walkers/w_1 HTTP/1.1
Host: localhost:8000
Accept: application/json

HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 87

{"id": "w_1", "name": "Ana", "rating": 4.9, "price_per_30min_cents": 2400}`,
          caption: "Top half: the request — a method, a path, headers. Blank line. Bottom half: the response — a status line, headers, blank line, then the body.",
        },
        {
          type: "text",
          md: [
            "## The four pieces of a request",
            "- **Method** — the verb: `GET` (fetch), `POST` (create), `PATCH` (partially update), `DELETE` (remove). PawWalk's iOS app used all four.\n- **Path** — which resource: `/walkers/w_1`.\n- **Headers** — metadata as `Key: Value` lines. `Accept: application/json` means \"send me JSON back.\"\n- **Body** — the payload. A `GET` usually has none; a `POST /bookings` carries the booking data as JSON text.",
            "A response mirrors the shape: a **status code** instead of a method+path, then headers, then a body.",
          ],
        },
        {
          type: "text",
          md: [
            "## Status codes you'll live with",
            "- **200 OK** — success, here's your data.\n- **201 Created** — success, and I made a new thing (a fresh booking).\n- **404 Not Found** — that path or id doesn't exist.\n- **422 Unprocessable Entity** — your request body didn't validate (bad shape, missing field).\n- **500 Internal Server Error** — the server code itself blew up. This is exactly the uncaught-exception case from the last module.",
            "> Swift's `URLResponse` exposed `.statusCode` as an `Int` — this is where that number came from all along.",
          ],
        },
        {
          type: "quiz",
          q: "Match the intent to the HTTP method: the iOS app wants to CREATE a new booking. Which method should the request use?",
          choices: ["POST", "GET", "DELETE", "PATCH"],
          answer: 0,
          explain: "POST means \"create a new thing.\" GET fetches without changing anything, PATCH updates part of an existing thing, DELETE removes one.",
          nudge: "GET never changes server state — creating something new needs a different verb.",
        },
        {
          type: "quiz",
          q: "A client asks for `GET /walkers/w_999` but no walker with that id exists. What status code should the server send back?",
          choices: ["404 Not Found", "200 OK with an empty body", "500 Internal Server Error", "201 Created"],
          answer: 0,
          explain: "404 means the path (or the resource it points to) doesn't exist. It's not a server bug — 500 is reserved for the server's own code failing.",
          nudge: "This isn't the server's fault, and nothing was created — which single code means \"that doesn't exist\"?",
        },
      ],
    },
    {
      id: "hello-flask",
      title: "Hello, Flask",
      steps: [
        {
          type: "text",
          md: [
            "## Flask: the smallest possible web framework",
            "Writing raw HTTP text by hand would be miserable. **Flask** is a Python *micro-framework* — a small library that listens for HTTP requests, matches the path to a function you wrote, calls it, and turns whatever you return into a proper HTTP response.",
            "\"Micro\" means it does almost nothing for you beyond that. No database, no validation, no built-in auth. You'll feel every one of those gaps in the next module — that's the point. FastAPI (Stage D) fills them in; Flask makes you appreciate why.",
          ],
        },
        {
          type: "code",
          title: "app.py",
          source: String.raw`from flask import Flask

app = Flask(__name__)


@app.route("/")
def home():
    return "PawWalk API is running"


if __name__ == "__main__":
    app.run(debug=True)`,
          caption: "That's a complete, runnable web server. `Flask(__name__)` creates the app; `app.run()` starts listening for requests.",
        },
        {
          type: "text",
          md: [
            "## @app.route is a decorator — you've met this shape",
            "Module 16 introduced `@dataclass`: a decorator wraps a class and changes what it does. `@app.route(\"/\")` is the same idea applied to a function — it tells Flask *\"when a request comes in for this path, call the function right below me.\"*",
            "`def home():` is a completely ordinary Python function. Flask is the only thing that's special here, and all it does is call `home()` at the right moment and ship its return value back to the client.",
          ],
        },
        {
          type: "xcode",
          label: "Over to the terminal",
          title: "Scaffold and run your first Flask app",
          intro: ["Every Flask module in this course starts the same way. Do this once now — you'll reuse the project for the rest of Stage B."],
          items: [
            "`mkdir -p playground/flask-pawwalk && cd playground/flask-pawwalk`",
            "`uv init` — creates a fresh Python project (same `uv` you installed for the real backend)",
            "`uv add flask` — installs Flask into this project's own `.venv/`",
            "Create `app.py` in that folder with the `home()` code shown above",
            "`uv run python app.py` — starts the server; leave it running (Ctrl+C to stop later)",
            "In a second terminal: `curl http://localhost:5000/` — you should see `PawWalk API is running`",
          ],
        },
        {
          type: "quiz",
          q: "What does the `@app.route(\"/\")` line actually do?",
          choices: [
            "It registers the function below it to run when a request matches that path",
            "It creates the Flask app object",
            "It starts the server listening for connections",
            "It converts the function's return value to JSON automatically, always",
          ],
          answer: 0,
          explain: "The decorator is a registration step: \"this path maps to this function.\" `Flask(__name__)` created the app object earlier, and `app.run()` is what actually starts listening.",
          nudge: "Think back to what a decorator does to the thing underneath it — it wraps or registers, it doesn't itself run the server.",
        },
      ],
    },
    {
      id: "json-routes",
      title: "Routes that return JSON",
      steps: [
        {
          type: "text",
          md: [
            "## A dict is already almost JSON",
            "Module 15 planted this flag: **a JSON object is a dict.** Flask cashes that in directly — return a dict from a route function, and Flask turns it into a proper JSON HTTP response for you, `Content-Type` header included.",
            "Let's serve the same shape the real backend's `GET /walkers` returns — you can compare them side by side at [http://localhost:8000/docs](http://localhost:8000/docs) once the real backend is running.",
          ],
        },
        {
          type: "code",
          title: "app/schemas.py (the real Walker shape)",
          source: String.raw`class Walker(BaseModel):
    id: str
    name: str
    photo_url: str | None = None
    rating: float = Field(ge=0, le=5)
    price_per_30min_cents: int
    bio: str = ""
    neighborhoods: list[str] = []`,
          caption: "The real backend validates this with Pydantic (Stage D). Our throwaway Flask app skips validation entirely — just a plain Python list of dicts with the same fields.",
        },
        {
          type: "code",
          title: "app.py — hardcoded WALKERS data",
          source: String.raw`WALKERS = [
    {"id": "w_1", "name": "Ana", "rating": 4.9, "price_per_30min_cents": 2400, "neighborhoods": ["Mission"]},
    {"id": "w_2", "name": "Sam", "rating": 4.7, "price_per_30min_cents": 2000, "neighborhoods": ["SoMa"]},
]`,
          caption: "No database yet — just Python data living in memory. It resets every time you restart the server.",
        },
        {
          type: "text",
          md: [
            "## jsonify vs returning a dict directly",
            "Recent Flask versions let you `return WALKERS` straight from a route and it just works. Under the hood — and in older code you'll read — that's what `flask.jsonify(...)` does explicitly: converts a dict or list into a JSON response with the right headers. We'll use `jsonify` so it's visible.",
          ],
        },
        {
          type: "exercise",
          title: "Write the /walkers route",
          prompt: [
            "Using the `WALKERS` list above, write a route function `list_walkers` for the path `/walkers` that returns the whole list as JSON.",
            "Import `jsonify` from `flask`, decorate the function with `@app.route(\"/walkers\")`, and `return jsonify(WALKERS)`.",
          ],
          starter: String.raw`from flask import Flask, jsonify

app = Flask(__name__)

WALKERS = [
    {"id": "w_1", "name": "Ana", "rating": 4.9, "price_per_30min_cents": 2400, "neighborhoods": ["Mission"]},
    {"id": "w_2", "name": "Sam", "rating": 4.7, "price_per_30min_cents": 2000, "neighborhoods": ["SoMa"]},
]

# your code here`,
          solution: String.raw`from flask import Flask, jsonify

app = Flask(__name__)

WALKERS = [
    {"id": "w_1", "name": "Ana", "rating": 4.9, "price_per_30min_cents": 2400, "neighborhoods": ["Mission"]},
    {"id": "w_2", "name": "Sam", "rating": 4.7, "price_per_30min_cents": 2000, "neighborhoods": ["SoMa"]},
]

@app.route("/walkers")
def list_walkers():
    return jsonify(WALKERS)`,
          checks: [
            { re: /@app\.route\("\/walkers"\)/, hint: "Decorate the function with `@app.route(\"/walkers\")` — the path with no trailing slash." },
            { re: /def list_walkers\(\)/, hint: "Name the function `list_walkers` — Flask calls whatever function you put right under the decorator." },
            { re: /return jsonify\(WALKERS\)/, hint: "Return `jsonify(WALKERS)` — pass the whole list straight in, no loop needed." },
          ],
          mustNot: [
            { re: /return WALKERS\[0\]/, hint: "Return the whole list, not just one walker — `GET /walkers` is a collection endpoint." },
          ],
          success: "That's the entire /walkers endpoint. The real backend's version adds a database and Pydantic validation, but the shape — path in, JSON list out — is identical.",
        },
      ],
    },
    {
      id: "dynamic-routes",
      title: "Dynamic routes",
      steps: [
        {
          type: "text",
          md: [
            "## Routes with a variable in the path",
            "`/walkers` returns everyone. But the iOS app also needs one specific walker: `/walkers/w_1`. Flask lets you capture part of the path as a variable with `<angle_brackets>` — whatever the client puts there gets passed into your function as an argument with that exact name.",
          ],
        },
        {
          type: "code",
          title: "app.py — a dynamic route",
          source: String.raw`from flask import abort

@app.route("/walkers/<walker_id>")
def get_walker(walker_id):
    for w in WALKERS:
        if w["id"] == walker_id:
            return jsonify(w)
    abort(404)`,
          caption: "`<walker_id>` in the path becomes the `walker_id` parameter. Loop the hardcoded list looking for a match — no database yet, just like module 15's list-of-dicts exercises.",
        },
        {
          type: "text",
          md: [
            "## abort(404) is the shortcut",
            "`abort(404)` immediately stops the function and sends back a 404 response — no `return` needed after it. It's Flask's version of `raise HTTPException(404)`, which you'll meet for real in Stage D's FastAPI routes. Same idea, different framework.",
            "This mirrors `apps/backend/app/routers/walkers.py`'s real `get_walker`: look the id up, and if `data.get_walker(...)` returns `None`, raise a 404 instead of ever returning `None` as if it were a walker.",
          ],
        },
        {
          type: "exercise",
          title: "Write the /walkers/<walker_id> route",
          prompt: [
            "Write a route function `get_walker` for the path `/walkers/<walker_id>` (assume `WALKERS`, `jsonify`, and `abort` are already available).",
            "Loop over `WALKERS`, and when `w[\"id\"] == walker_id`, return `jsonify(w)`. If nothing matches, call `abort(404)`.",
          ],
          starter: String.raw`# your code here`,
          solution: String.raw`@app.route("/walkers/<walker_id>")
def get_walker(walker_id):
    for w in WALKERS:
        if w["id"] == walker_id:
            return jsonify(w)
    abort(404)`,
          checks: [
            { re: /@app\.route\("\/walkers\/<walker_id>"\)/, hint: "The route string needs `<walker_id>` as a segment — `@app.route(\"/walkers/<walker_id>\")`." },
            { re: /for w in WALKERS/, hint: "Loop over `WALKERS` with `for w in WALKERS:` to search for the match." },
            { re: /abort\(404\)/, hint: "When the loop finishes without finding a match, call `abort(404)` to send back a 404 response." },
          ],
          mustNot: [
            { re: /return None/, hint: "Never return `None` for a missing walker — that would send back a 200 with a `null` body. Use `abort(404)` instead." },
          ],
          success: "Now you have a real lookup route with a real 404 path — exactly what the FastAPI version does in Stage D, just spelled differently.",
        },
        {
          type: "xcode",
          label: "Over to the terminal",
          title: "Hit both routes for real",
          intro: ["Add both routes to your playground's app.py, restart the server, and try them from the browser."],
          items: [
            "Add the `WALKERS` list, the `/walkers` route, and the `/walkers/<walker_id>` route to `playground/flask-pawwalk/app.py`",
            "Stop the server (Ctrl+C) and restart it: `uv run python app.py`",
            "Open [http://localhost:5000/walkers](http://localhost:5000/walkers) — see the full JSON list",
            "Open [http://localhost:5000/walkers/w_1](http://localhost:5000/walkers/w_1) — see just Ana",
            "Open [http://localhost:5000/walkers/w_999](http://localhost:5000/walkers/w_999) — see Flask's 404 page",
          ],
        },
      ],
    },
  ],
});
