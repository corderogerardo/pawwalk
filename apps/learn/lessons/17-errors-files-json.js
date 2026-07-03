window.COURSE = window.COURSE || [];
window.COURSE.push({
  id: "errors-files-json",
  title: "Errors, Files & JSON",
  emoji: "🧯",
  lang: "python",
  lessons: [
    {
      id: "exceptions",
      title: "Exceptions",
      steps: [
        {
          type: "text",
          md: [
            "## When things go wrong",
            "Ask a user for their age and they type `\"banana\"`. Look up a walker by an id that doesn't exist. Divide by a zero that snuck through. Python doesn't quietly return `nil` for these — it **raises an exception**, and unless you catch it, the program crashes right there.",
            "In Swift you wrote `do { try riskyThing() } catch { ... }`, and functions that could fail were marked `throws`. Python's version is `try` / `except` — no `throws` keyword needed, any line can raise.",
          ],
        },
        {
          type: "code",
          title: "try / except",
          source: String.raw`age_text = "banana"

try:
    age = int(age_text)
    print(f"Age is {age}")
except ValueError:
    print("That's not a number")`,
          caption: "`int(\"banana\")` raises a `ValueError`. The `except ValueError:` block catches exactly that kind of failure and keeps the program running.",
        },
        {
          type: "text",
          md: [
            "## else, finally, and raise",
            "- **`else:`** runs only if the `try` block did NOT raise — good for code that should only happen on success.\n- **`finally:`** always runs, success or failure — Python's answer to Swift's `defer`. Closing a file or a network connection goes here.\n- **`raise ValueError(\"message\")`** lets YOUR code trigger an exception on purpose, same idea as Swift's `throw MyError.something`.",
            "> A caught exception doesn't crash the whole server. This matters a lot for Part II's backend: when a route handler raises, the web framework catches it FOR you and turns it into an HTTP response — often a `500 Internal Server Error` — instead of taking the whole process down. You'll see FastAPI do exactly this in Stage D.",
          ],
        },
        {
          type: "quiz",
          q: "A PawWalk booking route raises an uncaught exception while looking up a walker. What actually happens to the running server?",
          choices: [
            "The framework catches it and sends the client an error response (like HTTP 500) — the server keeps running",
            "The entire server process crashes and every other user's request fails too",
            "Python silently ignores it and returns `None`",
            "The request hangs forever",
          ],
          answer: 0,
          explain: "Frameworks wrap every request in their own try/except. One bad request becomes one error response, not a dead server — you'll build this exact behavior in the Flask and FastAPI stages.",
          nudge: "Think about what a web framework does around every request handler it calls.",
        },
        {
          type: "text",
          md: [
            "## Catching by type",
            "`except ValueError:` only catches `ValueError`. A `TypeError` or `KeyError` would still crash past it — which is good, it stops you from silently swallowing bugs you didn't expect. Catch the specific exception you know how to handle.",
          ],
        },
        {
          type: "exercise",
          title: "Safe age parsing",
          prompt: [
            "Write a function `safe_int(user_input)` that tries to convert `user_input` to an `int` and return it.",
            "If the conversion raises `ValueError`, return `0` instead (the fallback).",
          ],
          starter: String.raw`def safe_int(user_input):
    # your code here
`,
          solution: String.raw`def safe_int(user_input):
    try:
        return int(user_input)
    except ValueError:
        return 0`,
          checks: [
            { re: /def safe_int\(user_input\):/, hint: "Keep the signature exactly as given: `def safe_int(user_input):`." },
            { re: /try:return int\(user_input\)/, hint: "Inside `try:`, attempt the conversion and return it: `return int(user_input)`." },
            { re: /except ValueError:return 0/, hint: "Catch the specific error and return the fallback: `except ValueError:` then `return 0`." },
          ],
          success: "That's the shape of almost every 'parse untrusted input' function you'll write in the backend — try the risky thing, fall back on failure.",
        },
      ],
    },
    {
      id: "files-context-managers",
      title: "Files & context managers",
      steps: [
        {
          type: "text",
          md: [
            "## Opening a file",
            "`open(path)` gives you a file object you can read from. But a file is a resource, like a network socket — it must be **closed** when you're done, or you leak file handles.",
            "Swift makes you remember cleanup with `defer`. Python has a construct that makes closing automatic: **`with`**.",
          ],
        },
        {
          type: "code",
          title: "with open(...) as f:",
          source: String.raw`with open("walkers.txt") as f:
    contents = f.read()
    print(contents)

# f is already closed here, even if read() had raised`,
          caption: "`with` calls a setup step, hands you the file as `f`, and GUARANTEES a cleanup step (closing it) runs when the block ends — success, `return`, or exception. It's Python's built-in `defer`, scoped to one block.",
        },
        {
          type: "quiz",
          q: "Why prefer `with open(path) as f:` over `f = open(path)` followed by a manual `f.close()`?",
          choices: [
            "`with` closes the file automatically even if an exception happens inside the block",
            "`with` opens the file faster",
            "`f.close()` doesn't actually exist in Python",
            "`with` is required syntax — `open()` can't be called any other way",
          ],
          answer: 0,
          explain: "If code between `open()` and `close()` raises, a manual `close()` call is skipped and the file leaks open. `with` runs its cleanup no matter how the block exits — same guarantee as Swift's `defer`.",
          nudge: "What happens to a manual f.close() call if the line right before it raises an exception?",
        },
        {
          type: "text",
          md: [
            "## Reading lines",
            "`f.read()` returns the whole file as one string. To go line by line, iterate the file object directly — it hands you one line at a time, each still ending in `\\n`:",
            "```\nwith open(path) as f:\n    for line in f:\n        print(line.strip())\n```",
            "`line.strip()` removes the trailing newline (and any surrounding whitespace).",
          ],
        },
        {
          type: "exercise",
          title: "Count lines in a file",
          prompt: [
            "Write a function `count_lines(path)` that opens the file at `path` using `with`, reads all the lines, and returns how many there are.",
            "Tip: `f.readlines()` returns a list of lines — `len(...)` counts them.",
          ],
          starter: String.raw`def count_lines(path):
    # your code here
`,
          solution: String.raw`def count_lines(path):
    with open(path) as f:
        lines = f.readlines()
        return len(lines)`,
          checks: [
            { re: /def count_lines\(path\):/, hint: "Keep the signature: `def count_lines(path):`." },
            { re: /with open\(path\)as f:/, hint: "Open the file with a context manager: `with open(path) as f:`." },
            { re: /len\(lines\)|len\(f\.readlines\(\)\)/, hint: "Count the lines with `len(...)` — either store `f.readlines()` first or call `len()` right on it." },
          ],
          mustNot: [
            { re: /=open\(/, hint: "Use `with open(...) as f:` so the file closes itself — don't assign a bare `open()` to a variable." },
          ],
          success: "with open(...) as f: is the pattern you'll use for every file, config, and log the backend touches.",
        },
      ],
    },
    {
      id: "json",
      title: "JSON",
      steps: [
        {
          type: "text",
          md: [
            "## The wire format you already know",
            "Back in Part I, your iOS app's `Codable` structs decoded JSON that came over the network — `{\"id\": 3, \"name\": \"Rex\"}` turning into a Swift `struct`. That JSON came from a Python backend, and Python's `json` module is the other half of that same conversion.",
            "Two functions, two directions:",
            "- **`json.loads(text)`** — parse a JSON **string** into a Python `dict` (loads = **load** from a **s**tring).\n- **`json.dumps(data)`** — convert a Python `dict` back into a JSON **string** (dumps = **dump** to a **s**tring).",
          ],
        },
        {
          type: "code",
          title: "Round-tripping a booking",
          source: String.raw`import json

booking_json = '{"id": 42, "duration_minutes": 30, "walker": {"name": "Sam"}}'

booking = json.loads(booking_json)
print(booking["walker"]["name"])

back_to_text = json.dumps(booking)
print(back_to_text)`,
          caption: "`json.loads` turns the string into nested dicts and lists — `booking[\"walker\"][\"name\"]` reaches straight in, same as `booking.walker.name` felt in Swift's `Codable` struct. `json.dumps` reverses it.",
        },
        {
          type: "text",
          md: [
            "## Why this matters for the backend",
            "Every request body a PawWalk client sends, and every response the server sends back, travels as a JSON string. `json.loads` / `json.dumps` are the manual version of what frameworks like FastAPI do automatically for you later — but the underlying format is exactly this.",
          ],
        },
        {
          type: "exercise",
          title: "Pull the walker's name out of a booking",
          prompt: [
            "`booking_json` below holds a JSON string. Parse it with `json.loads` into a variable `booking`, then set `walker_name` to the walker's name — `booking[\"walker\"][\"name\"]`.",
          ],
          starter: String.raw`import json

booking_json = '{"id": 7, "duration_minutes": 45, "walker": {"name": "Priya"}}'

# your code here
`,
          solution: String.raw`import json

booking_json = '{"id": 7, "duration_minutes": 45, "walker": {"name": "Priya"}}'

booking = json.loads(booking_json)
walker_name = booking["walker"]["name"]`,
          checks: [
            { re: /booking=json\.loads\(booking_json\)/, hint: "Parse the string first: `booking = json.loads(booking_json)`." },
            { re: /walker_name=booking\["walker"\]\["name"\]/, hint: "Index in two steps: `booking[\"walker\"][\"name\"]`." },
          ],
          success: "That's a JSON booking parsed exactly the way a route handler parses an incoming request body.",
        },
        {
          type: "quiz",
          q: "You have a Python dict representing a booking and need to send it over the network as a JSON string. Which function?",
          choices: ["json.dumps(booking)", "json.loads(booking)", "json.parse(booking)", "json.stringify(booking)"],
          answer: 0,
          explain: "`dumps` goes dict → string (dump to a string). `loads` goes the other way, string → dict (load from a string) — the pair you'll use constantly once routes start accepting and returning JSON.",
          nudge: "loads reads FROM a string into Python. You want the opposite direction here.",
        },
      ],
    },
  ],
});
