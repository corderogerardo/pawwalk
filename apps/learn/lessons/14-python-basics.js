window.COURSE = window.COURSE || [];
window.COURSE.push({
  id: "python-basics",
  title: "Python Basics",
  emoji: "🔤",
  lang: "python",
  lessons: [
    {
      id: "variables-types",
      title: "Variables & types",
      steps: [
        {
          type: "text",
          md: [
            "## No `let`, no `var`",
            "In Swift you wrote `let walkerName = \"Ana\"` or `var walkPriceCents = 2400`. Python drops the keyword entirely — you just write the name, `=`, and the value:",
            "```\nwalker_name = \"Ana\"\nwalk_price_cents = 2400\n```",
            "There's no `let` vs `var` distinction either. Every plain assignment can be reassigned later — Python doesn't have Swift's constant-safety built into the syntax. (Style convention: `snake_case` names, not `camelCase` — you'll see `walker_name`, not `walkerName`.)",
          ],
        },
        {
          type: "text",
          md: [
            "## The core types",
            "Python has the same basic shapes Swift does, with different names and capitalization:",
            "- **`int`** — whole numbers: `2400` (like Swift's `Int`)\n- **`float`** — decimals: `4.8` (like Swift's `Double`)\n- **`str`** — text: `\"Ana\"` (like Swift's `String`)\n- **`bool`** — `True` / `False`, **capitalized** — unlike Swift's lowercase `true`/`false`\n- **`None`** — Python's absence-of-a-value, roughly Swift's `nil`. One key difference: in Swift, only `Optional` types can be `nil`. In Python, **any** variable can be `None` at any time — nothing in the language stops you from calling a method on it and crashing.",
          ],
        },
        {
          type: "code",
          title: "PawWalk values in Python",
          source: String.raw`walker_name = "Ana"
walk_price_cents = 2400
walker_rating = 4.8
is_available = True
backup_walker = None`,
          caption: "Five variables, five types, zero type annotations required.",
        },
        {
          type: "text",
          md: [
            "## Dynamic typing — and why hints come later",
            "Swift is **statically typed with inference**: the compiler figures out `walkPriceCents` is an `Int` once, and it can never become a `String` later — that's checked before your app ever runs.",
            "Python is **dynamically typed**: a name just points at whatever value you last assigned it, and that can change type at any time:",
            "```\nwalk_price_cents = 2400\nwalk_price_cents = \"free\"   # totally legal — Python won't stop you\n```",
            "Nothing catches that until the line that misuses it actually runs. Python *does* have optional **type hints** (`walk_price_cents: int = 2400`) that tools and humans can read — but the language itself still won't enforce them at runtime. That gap is exactly what a later module (Pydantic) closes for the real PawWalk backend. For now, just know hints exist and don't stress about them.",
          ],
        },
        {
          type: "text",
          md: [
            "## Checking a value's type: `type()`",
            "Swift tells you a value's type at compile time, in Xcode. Python tells you at runtime, with a built-in function: `type(walk_price_cents)` returns `<class 'int'>`. You'll use this constantly in the REPL (Python's interactive prompt) while poking at values — it's the fastest way to answer \"wait, what IS this thing?\"",
          ],
        },
        {
          type: "quiz",
          q: "In Swift, `var walkPriceCents = 2400` can never later hold a string — the compiler forbids it. What happens if you write `walk_price_cents = 2400` then `walk_price_cents = \"free\"` in Python?",
          choices: [
            "It works — Python lets a name point at any type, checked only when misused at runtime",
            "Python throws a compile error immediately, just like Swift",
            "Python silently converts \"free\" to the number 0",
            "It works only if you add a type hint first",
          ],
          answer: 0,
          explain: "Python variables aren't locked to a type. The name `walk_price_cents` is just a label — reassign it to any value, any type, any time. Nothing complains until code that assumes a number tries to do math on \"free\".",
          nudge: "Think about WHEN Swift's compiler catches a type mismatch — before running. Does Python have that step?",
        },
        {
          type: "exercise",
          title: "Your first PawWalk variables",
          prompt: [
            "Create two variables: `walk_price_cents` set to `2400`, and `walker_name` set to the string `\"Priya\"`.",
          ],
          starter: String.raw`# your code here
`,
          solution: String.raw`walk_price_cents = 2400
walker_name = "Priya"`,
          checks: [
            { re: /walk_price_cents=2400/, hint: "Assign the number directly, no quotes: `walk_price_cents = 2400`." },
            { re: /walker_name="Priya"/, hint: "Assign a string in quotes: `walker_name = \"Priya\"`." },
          ],
          mustNot: [
            { re: /walk_price_cents="2400"/, hint: "2400 is a number (`int`), not text — don't put it in quotes." },
          ],
          success: "Two variables, no type keywords, no semicolons. That's the whole ceremony in Python.",
        },
      ],
    },
    {
      id: "strings-fstrings",
      title: "Strings & f-strings",
      steps: [
        {
          type: "text",
          md: [
            "## Quoting a string",
            "Python accepts single or double quotes for a `str` — `'Ana'` and `\"Ana\"` are identical. This course sticks to double quotes for consistency with Swift. There's no separate \"character\" type like Swift's `Character` — a one-letter string is just a `str` of length 1.",
          ],
        },
        {
          type: "text",
          md: [
            "## f-strings: Python's `\\(interpolation)`",
            "Swift builds strings with backslash-parens: `\"Hello \\(name)\"`. Python's equivalent is the **f-string** — put an `f` right before the opening quote, then drop any expression in curly braces:",
            "```\nname = \"Priya\"\nprint(f\"Hello {name}\")\n```",
            "Forget the `f` and the braces print literally — `\"Hello {name}\"` — instead of interpolating. The `f` is not optional decoration; it's what turns `{name}` into a live expression slot.",
          ],
        },
        {
          type: "text",
          md: [
            "## Format specs: turning cents into a price",
            "PawWalk stores prices in **cents** (an `int`) to avoid floating-point rounding bugs — same reason Part I's Swift models did it. To display a price, divide by 100 and format it inside an f-string with a **format spec** after a colon:",
            "```\ncents = 2400\nprice = f\"${cents / 100:.2f}\"   # \"$24.00\"\n```",
            "`{cents / 100:.2f}` means: evaluate `cents / 100`, then format it with `.2f` — fixed-point, 2 decimal places. That colon-plus-spec syntax has no Swift equivalent; Swift would reach for `String(format:)` instead.",
          ],
        },
        {
          type: "code",
          title: "String methods you'll use constantly",
          source: String.raw`walker_name = "  ana  "
print(walker_name.strip())        # "ana" — trims whitespace from both ends
print(walker_name.strip().upper())  # "ANA"
print(len(walker_name))           # 7 — length, as a function, not a property`,
          caption: "`.strip()` and `.upper()` are methods (dot syntax, just like Swift). `len(x)` is a built-in FUNCTION, not `x.count` — that trips up everyone coming from Swift at first.",
        },
        {
          type: "quiz",
          q: "You write `name = \"Mochi\"` then `print(\"Hi {name}\")` (no `f`). What prints?",
          choices: [
            "The literal text `Hi {name}` — the braces are never evaluated",
            "`Hi Mochi` — Python interpolates automatically",
            "A crash: `NameError`",
            "`Hi ` followed by nothing",
          ],
          answer: 0,
          explain: "Without the `f` prefix, curly braces are just characters in a plain string. Interpolation is opt-in via the `f` — that's the one detail every Swift developer forgets on day one.",
          nudge: "Is `f` doing something, or is it just a style choice? What happens to `{name}` if nothing tells Python to evaluate it?",
        },
        {
          type: "exercise",
          title: "Build a price_label (mirror of Part I's priceLabel)",
          prompt: [
            "Remember `priceLabel` from Part I — the computed property that turned `pricePer30MinCents` into a display string? Do the same thing in Python: given `walk_price_cents = 2400`, build `price_label` as an f-string reading like `\"$24.00 / 30 min\"`, using a `.2f` format spec on `walk_price_cents / 100`.",
          ],
          starter: String.raw`walk_price_cents = 2400
# your code here
`,
          solution: String.raw`walk_price_cents = 2400
price_label = f"` + "$" + String.raw`{walk_price_cents / 100:.2f} / 30 min"`,
          checks: [
            { re: /price_label=f"/, hint: "Assign an f-string: `price_label = f\"...\"` — don't forget the `f`." },
            { re: /walk_price_cents\/100/, hint: "Divide cents by 100 inside the braces: `{walk_price_cents / 100...}`." },
            { re: /:\.2f/, hint: "Add the format spec after a colon inside the braces: `:.2f` for 2 decimal places." },
          ],
          mustNot: [
            { re: /price_label="/, hint: "A plain string won't interpolate `walk_price_cents` — you need the `f` prefix." },
          ],
          success: "Same idea as Part I's priceLabel, new syntax: an f-string with a format spec instead of a computed property.",
        },
      ],
    },
    {
      id: "control-flow",
      title: "Control flow",
      steps: [
        {
          type: "text",
          md: [
            "## `if` without parentheses — but with a colon",
            "Swift wraps conditions in `if condition { }`. Python drops the parentheses around the condition and the braces around the body, replacing `{ }` with a **colon and indentation**:",
            "```\nrating = 4.9\nif rating >= 4.8:\n    print(\"top rated\")\nelif rating >= 4.0:\n    print(\"solid\")\nelse:\n    print(\"needs reviews\")\n```",
            "`elif` is Python's `else if` — one word, no space. The indentation (4 spaces, by convention) is not just style: **it's how Python knows which lines belong to the `if` block.** There is no closing brace to mark the end — dedenting back to the left ends the block.",
          ],
        },
        {
          type: "text",
          md: [
            "## Comparisons and boolean logic",
            "Comparison operators (`==`, `!=`, `<`, `>=`, …) work exactly like Swift's. Boolean combinators are spelled out as words instead of symbols:",
            "- Swift `&&` → Python `and`\n- Swift `||` → Python `or`\n- Swift `!` → Python `not`",
            "```\nif is_available and rating >= 4.8:\n    print(\"book them\")\n```",
          ],
        },
        {
          type: "text",
          md: [
            "## `for` loops: `for x in …`",
            "Swift's `for walker in walkers { }` becomes `for walker in walkers:` — same shape, colon instead of braces. To loop a fixed number of times, Python has no `1...5`-style range operator on integers directly in a `for`; instead there's the built-in `range()`:",
            "```\nfor minutes in [30, 45, 60]:\n    print(minutes)\n\nfor i in range(3):     # 0, 1, 2 — stops BEFORE 3\n    print(i)\n```",
            "`range(3)` produces `0, 1, 2` — three values, stopping *before* 3. `range(1, 4)` gives `1, 2, 3`. It's Python's rough equivalent of Swift's `0..<3`.",
          ],
        },
        {
          type: "code",
          title: "while loops",
          source: String.raw`fixes_remaining = 3
while fixes_remaining > 0:
    print(f"waiting for {fixes_remaining} more GPS fixes")
    fixes_remaining -= 1`,
          caption: "`while condition:` — same idea as Swift's `while condition { }`. `-= 1` works just like Swift's compound assignment.",
        },
        {
          type: "quiz",
          q: "In Python, what actually marks which lines are INSIDE an `if` block, since there are no `{ }`?",
          choices: [
            "Indentation — the block is whatever's indented under the `if:` line",
            "A semicolon at the end of the block",
            "The `end` keyword, like Ruby",
            "Nothing — Python guesses based on blank lines",
          ],
          answer: 0,
          explain: "Indentation isn't cosmetic in Python — it's syntax. Lines indented under `if condition:` belong to that block; dedenting ends it. Get the indentation wrong and Python either errors or silently runs the wrong lines.",
          nudge: "You just saw `if:` / `elif:` / `else:` with no closing brace anywhere. What visually shows where each block stops?",
        },
        {
          type: "exercise",
          title: "Label three walk durations",
          prompt: [
            "Loop over `[30, 45, 60]` with a variable named `minutes`, and `print` a label for each one using an f-string like `\"30 min walk\"`.",
          ],
          starter: String.raw`# your code here
`,
          solution: String.raw`for minutes in [30, 45, 60]:
    print(f"{minutes} min walk")`,
          checks: [
            { re: /for minutes in\[30,45,60\]:/, hint: "Loop directly over the list literal: `for minutes in [30, 45, 60]:`." },
            { re: /print\(f"/, hint: "Print an f-string inside the loop body: `print(f\"...\")`." },
            { re: /\{minutes\}/, hint: "Interpolate the loop variable: `{minutes}` inside the f-string." },
          ],
          mustNot: [
            { re: /range\(/, hint: "You don't need `range()` here — loop directly over the `[30, 45, 60]` list." },
          ],
          success: "A for-loop over a literal list — no index variable needed, just like Swift's `for minutes in [30, 45, 60]`.",
        },
      ],
    },
    {
      id: "functions",
      title: "Functions",
      steps: [
        {
          type: "text",
          md: [
            "## `def` instead of `func`",
            "Swift declares a function with `func`. Python uses `def`, and the body is indented instead of braced:",
            "```\ndef greet(name):\n    return f\"Hello, {name}!\"\n```",
            "`return` works exactly like Swift's `return` — it hands back a value and exits the function immediately. Unlike Swift, Python doesn't require (or even support) a `-> ReturnType` arrow by default — that's an optional type *hint* you'll meet in a later module, not an enforced contract.",
          ],
        },
        {
          type: "text",
          md: [
            "## Default parameter values",
            "Just like Swift, a Python parameter can have a default, making it optional to pass:",
            "```\ndef booking_total(duration, rate_cents_per_30=2400):\n    return duration / 30 * rate_cents_per_30\n```",
            "Call `booking_total(30)` and `rate_cents_per_30` defaults to `2400`. Call `booking_total(30, 3000)` to override it. The default lives directly in the parameter list — `name=value` — no separate overload needed.",
          ],
        },
        {
          type: "text",
          md: [
            "## Keyword arguments",
            "You can call any Python function by naming its parameters at the call site, in any order — similar to how Swift often requires argument labels, except in Python it's always optional:",
            "```\nbooking_total(duration=45, rate_cents_per_30=2000)\nbooking_total(rate_cents_per_30=2000, duration=45)   # same call, reordered\n```",
            "This is why default parameters and keyword arguments pair so well: you can skip earlier defaulted params entirely by naming the one you actually want to override.",
          ],
        },
        {
          type: "code",
          title: "Docstrings",
          source: String.raw`def booking_total(duration, rate_cents_per_30=2400):
    """Return the total price in cents for a walk of the given duration."""
    return duration / 30 * rate_cents_per_30`,
          caption: "A triple-quoted string right after `def` is a **docstring** — Python's built-in way to document a function, readable via `help(booking_total)`. Roughly Swift's `///` doc comment, but it's a real string, not a comment.",
        },
        {
          type: "quiz",
          q: "`def booking_total(duration, rate_cents_per_30=2400):` — which call is valid?",
          choices: [
            "`booking_total(45)` — uses the default rate",
            "`booking_total()` — both params are optional since one has a default",
            "`booking_total(duration=45, 2400)` — mixing keyword then positional",
            "You must always pass both arguments explicitly",
          ],
          answer: 0,
          explain: "Only `rate_cents_per_30` has a default, so it's optional — `duration` still must be supplied. `booking_total(45)` fills `duration=45` and lets `rate_cents_per_30` fall back to 2400.",
          nudge: "Only the parameter WITH a default value becomes optional. Does `duration` have one?",
        },
        {
          type: "exercise",
          title: "Write booking_total",
          prompt: [
            "Define `def booking_total(duration, rate_cents_per_30=2400):` that returns the total cents for the walk: `duration / 30 * rate_cents_per_30`.",
          ],
          starter: String.raw`# your code here
`,
          solution: String.raw`def booking_total(duration, rate_cents_per_30=2400):
    return duration / 30 * rate_cents_per_30`,
          checks: [
            { re: /def booking_total\(duration,rate_cents_per_30=2400\):/, hint: "Match the exact signature: `def booking_total(duration, rate_cents_per_30=2400):`." },
            { re: /rate_cents_per_30=2400/, hint: "Give `rate_cents_per_30` a default value of `2400` right in the parameter list." },
            { re: /return/, hint: "The function needs a `return` statement to hand back the total." },
          ],
          success: "A function with a default parameter — the same signature the exercises ahead will keep building on.",
        },
      ],
    },
  ],
});
