window.COURSE = window.COURSE || [];
window.COURSE.push({
  id: "py-collections",
  title: "Collections",
  emoji: "📦",
  lang: "python",
  lessons: [
    {
      id: "lists",
      title: "Lists",
      steps: [
        {
          type: "text",
          md: [
            "## A list is Python's array",
            "Swift has `var names: [String] = [\"Ana\", \"Ben\"]`. Python's version is a **list**, and it's even less ceremony:",
            "```\nwalkers = [\"Ana\", \"Ben\", \"Cleo\"]\n```",
            "No type annotation, no `[String]` — a list can technically hold mixed types, but in PawWalk code you'll keep each list's items the same shape (all walker names, all bookings, etc.), exactly like you did in Swift.",
          ],
        },
        {
          type: "code",
          title: "lists.py",
          source: String.raw`walkers = ["Ana", "Ben", "Cleo"]

print(walkers[0])       # "Ana"  — same indexing as Swift
print(walkers[-1])      # "Cleo" — negative index counts from the end
print(walkers[0:2])     # ["Ana", "Ben"] — a slice, end index excluded

walkers.append("Deja")  # adds to the end, like Swift's .append(_:)
print(len(walkers))     # 4`,
          caption: "Negative indexing (`walkers[-1]` for the last item) doesn't exist in Swift arrays — it's a nice Python shortcut.",
        },
        {
          type: "text",
          md: [
            "## Slicing: `walkers[1:3]`",
            "A slice `list[start:end]` grabs items from `start` up to (not including) `end` — same rule as Swift's `array[1..<3]`. `walkers[1:3]` on `[\"Ana\", \"Ben\", \"Cleo\", \"Deja\"]` gives `[\"Ben\", \"Cleo\"]`.",
            "> Lists are ordered and mutable, just like Swift arrays. `.append()` grows them in place — no `var` vs `let` distinction to worry about, though you can still reassign the variable name to a whole new list.",
          ],
        },
        {
          type: "quiz",
          q: "What does `walkers[-1]` give you?",
          choices: ["The last item in the list", "An error — negative indices don't exist", "The first item, reversed", "Removes the last item"],
          answer: 0,
          explain: "Negative indices count backward from the end: -1 is the last item, -2 the second-to-last, and so on.",
          nudge: "Think of it as counting from the far end of the list instead of the front.",
        },
        {
          type: "exercise",
          title: "Build a walker roster",
          prompt: [
            "Create a list `walkers` containing the strings `\"Ana\"`, `\"Ben\"`, and `\"Cleo\"`. Then append `\"Deja\"` to it with `.append()`.",
          ],
          starter: String.raw`# your code here
`,
          solution: String.raw`walkers = ["Ana", "Ben", "Cleo"]
walkers.append("Deja")`,
          checks: [
            { re: /walkers=\["Ana","Ben","Cleo"\]/, hint: "Start with the literal: `walkers = [\"Ana\", \"Ben\", \"Cleo\"]` — square brackets, comma-separated strings." },
            { re: /walkers\.append\("Deja"\)/, hint: "Call `.append(\"Deja\")` on `walkers` to add the fourth name to the end." },
          ],
          success: "That's a Python list: ordered, mutable, and grown with .append() — the same job Swift's array did, less punctuation.",
        },
      ],
    },
    {
      id: "dictionaries",
      title: "Dictionaries",
      steps: [
        {
          type: "text",
          md: [
            "## A dict is Python's dictionary — literally",
            "Swift's `[String: Any]` maps keys to values. Python's **dict** does the same job with lighter syntax:",
            "```\nwalker = {\"name\": \"Ana\", \"rating\": 4.9}\n```",
            "Keys and values go inside `{ }`, separated by `:`, pairs separated by commas — no `let`/`var`, no explicit key/value types.",
          ],
        },
        {
          type: "code",
          title: "dicts.py",
          source: String.raw`walker = {"name": "Ana", "rating": 4.9, "price_cents": 2400}

print(walker["name"])           # "Ana" — square-bracket access, like Swift
print(walker.get("rating"))     # 4.9
print(walker.get("bio", "n/a")) # "n/a" — .get() with a default, no crash on a missing key

print("name" in walker)         # True — membership check

for key, value in walker.items():
    print(key, value)           # iterate both key and value together`,
          caption: "`walker[\"missing\"]` would raise an error; `.get(\"missing\", default)` is the safe version — closer to Swift's `dict[\"missing\"] ?? default`.",
        },
        {
          type: "text",
          md: [
            "## Remember this: a JSON object IS a dict",
            "When the PawWalk backend sends `{\"name\": \"Ana\", \"rating\": 4.9}` over HTTP, Python receives it as exactly this: a dict. There's no separate \"JSON type\" to learn — parsing JSON just builds dicts (and lists) you already know how to use. Hang onto that thought; Stage B leans on it hard.",
          ],
        },
        {
          type: "quiz",
          q: "Why prefer `walker.get(\"bio\", \"n/a\")` over `walker[\"bio\"]` when the key might not exist?",
          choices: [
            "`.get()` returns a default instead of crashing when the key is missing",
            "`.get()` is faster",
            "`[...]` only works on lists, not dicts",
            "There's no difference",
          ],
          answer: 0,
          explain: "`dict[\"key\"]` raises a `KeyError` if the key is absent. `.get(\"key\", default)` returns the default instead — the dict equivalent of Swift's `dict[\"key\"] ?? default`.",
          nudge: "Think about what happens with a key that isn't there at all.",
        },
        {
          type: "exercise",
          title: "Build a walker dict",
          prompt: [
            "Create a dict `walker` with three keys: `\"name\"` set to `\"Ana\"`, `\"rating\"` set to `4.9`, and `\"price_cents\"` set to `2400`.",
          ],
          starter: String.raw`# your code here
`,
          solution: String.raw`walker = {"name": "Ana", "rating": 4.9, "price_cents": 2400}`,
          checks: [
            { re: /walker=\{/, hint: "Assign a `{ }` literal to `walker` — that's how a dict starts." },
            { re: /"name":"Ana"/, hint: "Include the pair `\"name\": \"Ana\"` — a string key, colon, string value." },
            { re: /"rating":4\.9/, hint: "Include `\"rating\": 4.9` — a number value doesn't need quotes." },
            { re: /"price_cents":2400/, hint: "Include `\"price_cents\": 2400` — again, no quotes around the number." },
          ],
          success: "That's a dict — and it's already the exact shape a JSON object takes on the wire. You'll see this again very soon.",
        },
      ],
    },
    {
      id: "tuples-sets",
      title: "Tuples & sets",
      steps: [
        {
          type: "text",
          md: [
            "## Tuples: a fixed little bundle",
            "A **tuple** is like a list, but frozen in length and (usually) meant to hold a few different things together — think of a GPS fix as `(lat, lng)`. Once built, you can't append to it or reassign a slot.",
            "```\nfix = (37.77, -122.42)\nlat, lng = fix   # unpacking — pull both values out in one line\n```",
            "That unpacking trick — `lat, lng = fix` — has no direct one-liner in Swift; the closest is destructuring a tuple in a `let (lat, lng) = fix`.",
          ],
        },
        {
          type: "code",
          title: "tuples_sets.py",
          source: String.raw`fix = (37.77, -122.42)
lat, lng = fix
print(lat)              # 37.77

active_ids = {3, 7, 9}          # a SET: unordered, no duplicates
active_ids.add(7)                # no-op — 7 is already in there
print(len(active_ids))           # still 3
print(7 in active_ids)           # True — fast membership check`,
          caption: "A set automatically drops duplicates and answers `in` checks quickly — perfect for \"have I seen this walker id already?\"",
        },
        {
          type: "text",
          md: [
            "## When to reach for which",
            "- **List** — an ordered collection you'll grow, shrink, or loop over in order (a roster of walkers).\n- **Tuple** — a small, fixed bundle of related values that won't change shape (one GPS fix: lat + lng).\n- **Set** — a collection where you only care *whether* something is present, and duplicates make no sense (the set of walker ids already notified).\n- **Dict** — labeled fields on one thing, accessed by name (one walker's `name`/`rating`/`price_cents`).",
          ],
        },
        {
          type: "quiz",
          q: "Pick the right container for each: (1) one GPS ping's `(lat, lng)`, (2) the set of dog ids already walked today (no repeats, order doesn't matter), (3) a walker's `name`/`rating`/`price_cents` fields.",
          choices: [
            "(1) tuple, (2) set, (3) dict",
            "(1) list, (2) dict, (3) tuple",
            "(1) dict, (2) tuple, (3) set",
            "(1) set, (2) list, (3) tuple",
          ],
          answer: 0,
          explain: "A fixed pair of coordinates is a tuple, a no-duplicates membership collection is a set, and named fields on one thing are a dict.",
          nudge: "Match each scenario's shape: fixed pair, no-duplicates membership, or named fields.",
        },
      ],
    },
    {
      id: "comprehensions",
      title: "Comprehensions",
      steps: [
        {
          type: "text",
          md: [
            "## Build a list, in one line",
            "A **list comprehension** builds a new list by transforming (and optionally filtering) another collection — all in one expression instead of a loop with `.append()` calls:",
            "```\nnames = [w[\"name\"] for w in walkers]\n```",
            "Read it left to right: \"give me `w[\"name\"]`, **for** each `w` **in** `walkers`.\" It's the Python equivalent of Swift's `walkers.map { $0[\"name\"] }`.",
          ],
        },
        {
          type: "code",
          title: "comprehensions.py",
          source: String.raw`walkers = [
    {"name": "Ana", "rating": 4.9},
    {"name": "Ben", "rating": 4.5},
    {"name": "Cleo", "rating": 4.8},
]

names = [w["name"] for w in walkers]
print(names)   # ["Ana", "Ben", "Cleo"]

top_rated = [w["name"] for w in walkers if w["rating"] >= 4.8]
print(top_rated)   # ["Ana", "Cleo"] — the "if" filters which items make it in

by_name = {w["name"]: w["rating"] for w in walkers}   # a dict comprehension
print(by_name)   # {"Ana": 4.9, "Ben": 4.5, "Cleo": 4.8}`,
          caption: "Adding `if w[\"rating\"] >= 4.8` inside the brackets filters — only items where the condition is true make it into the new list.",
        },
        {
          type: "text",
          md: [
            "## When a plain loop is clearer",
            "Comprehensions shine for a simple transform-and-maybe-filter in one line. Once the logic needs multiple steps, multiple conditions, or side effects (printing, saving to a file), a regular `for` loop reads better than a cramped one-liner. Don't force it — clarity beats compactness.",
          ],
        },
        {
          type: "quiz",
          q: "What does `if w[\"rating\"] >= 4.8` do inside `[w[\"name\"] for w in walkers if w[\"rating\"] >= 4.8]`?",
          choices: [
            "Filters out walkers that don't meet the rating condition",
            "Sorts the walkers by rating",
            "Raises an error if any walker is below 4.8",
            "Runs before the loop starts, once",
          ],
          answer: 0,
          explain: "The `if` clause runs for every item; only walkers where it's `True` get their name added to the resulting list.",
          nudge: "It sits right after `for w in walkers` — think about what a condition attached to a loop normally does.",
        },
        {
          type: "exercise",
          title: "Top-rated walkers, one line",
          prompt: [
            "Given the `walkers` list below (each a dict with `\"name\"` and `\"rating\"`), build a list `top_rated` containing the `\"name\"` of every walker whose `\"rating\"` is `>= 4.8`, using a **list comprehension**.",
          ],
          starter: String.raw`walkers = [
    {"name": "Ana", "rating": 4.9},
    {"name": "Ben", "rating": 4.5},
    {"name": "Cleo", "rating": 4.8},
]
# your code here
`,
          solution: String.raw`walkers = [
    {"name": "Ana", "rating": 4.9},
    {"name": "Ben", "rating": 4.5},
    {"name": "Cleo", "rating": 4.8},
]
top_rated = [w["name"] for w in walkers if w["rating"] >= 4.8]`,
          checks: [
            { re: /top_rated=\[w\["name"\]for w in walkers/, hint: "Start the comprehension with `[w[\"name\"] for w in walkers` — pull the name for each walker `w`." },
            { re: /if w\["rating"\]>=4\.8\]/, hint: "Add the filter inside the brackets: `if w[\"rating\"] >= 4.8]` — no filter means no cutoff." },
          ],
          mustNot: [
            { re: /for w in walkers:/, hint: "This should be a comprehension inside `[ ]`, not a `for … :` loop block." },
          ],
          success: "One line, transform and filter together — that's a list comprehension, and you'll reach for this shape constantly when working with API data.",
        },
      ],
    },
  ],
});
