// Module 01 — Kotlin Basics (Android track). See ../lessons/FORMAT.md and
// ./FORMAT-KOTLIN.md for the schema and Kotlin-specific traps.
window.COURSE = window.COURSE || [];
window.COURSE.push({
  id: "kotlin-basics",
  title: "Kotlin Basics",
  emoji: "🔤",
  lang: "kotlin",
  lessons: [
    {
      id: "constants-and-variables",
      title: "Constants & Variables",
      steps: [
        {
          type: "text",
          md: [
            "## Naming your data",
            "A program is mostly data with names attached. In Kotlin you attach a name to a value with one of two keywords:",
            "- **`val`** declares a **value** — a name whose reference is set once and can never be reassigned.\n- **`var`** declares a **variable** — a name whose value you can replace later.",
            "Kotlin strongly prefers `val`. A name that *can't* be reassigned is a name that can't drift out from under you by accident — a whole category of bugs, gone. Android Studio even warns you when you write `var` for something you never reassign.",
            "> Rule of thumb: start with `val`. Switch to `var` only when the **compiler** — the program that turns your Kotlin into a runnable app — tells you the value actually needs to change.",
          ],
        },
        {
          type: "code",
          title: "val vs var",
          source: String.raw`val dogName = "Mochi"     // a val: set once
val priceCents = 1500     // also a val
var rating = 4.8          // a var: allowed to change

rating = 4.9              // fine — rating is a var
// dogName = "Rex"        // compile error! dogName is a val`,
          caption: "The compiler refuses to build code that reassigns a `val`. That's a feature, not a punishment.",
        },
        {
          type: "quiz",
          q: "You wrote `val walkMinutes = 30`, and three lines later you write `walkMinutes = 60`. What happens?",
          choices: [
            "The compiler refuses to build — a `val` can never be reassigned",
            "walkMinutes becomes 60",
            "The app builds but crashes when it runs",
            "Kotlin silently keeps 30 and ignores the new value",
          ],
          answer: 0,
          explain: "A `val` is a promise to the compiler that the reference never changes. Break the promise and the code simply won't compile — the fix is either to not reassign it, or to declare it with `var`.",
          nudge: "Which keyword means \"this can never be reassigned\"?",
        },
        {
          type: "text",
          md: [
            "## Types",
            "Every value in Kotlin has a **type** — the kind of thing it is. Four types cover most of PawWalk:",
            "- **`Int`** — a whole number: `1500`, `0`, `-3`. Every price in PawWalk is an `Int`.\n- **`Double`** — a number with a decimal point: `4.8`, `0.5`. Walker ratings are `Double`s.\n- **`Boolean`** — exactly `true` or `false`, nothing else.\n- **`String`** — text, wrapped in double quotes: `\"Mochi\"`.",
            "You usually don't write the type yourself. Kotlin **infers** it from the value on the right of the `=`: `val priceCents = 1500` makes an `Int` (whole number), `val rating = 4.8` makes a `Double` (decimal point).",
            "When you want to spell it out — or there's no value yet — add a **type annotation**: a colon and the type after the name, `val priceCents: Int = 1500`. Read the colon as *\"of type\"*.",
            "One naming convention to lock in now: Kotlin names use **camelCase** — first word lowercase, every following word capitalized, no spaces or underscores: `dogName`, `pricePer30MinCents`.",
          ],
        },
        {
          type: "code",
          title: "data/Models.kt — real PawWalk properties (excerpt)",
          source: String.raw`val name: String
val rating: Double
val pricePer30MinCents: Int`,
          caption: "Three lines straight out of the app's Walker type. (They live inside a `data class` — you'll meet data classes in the next module.) With no `= value` on the line, the type annotation is required: name, colon, type.",
        },
        {
          type: "quiz",
          q: "Kotlin sees `val rating = 4.8`. What type does it infer for `rating`?",
          choices: ["Int", "String", "Double", "It can't tell without an annotation"],
          answer: 2,
          explain: "The decimal point is the giveaway: `4.8` is a `Double`, so `rating` is a `Double`. Inference means the annotation is optional whenever there's a value to look at.",
          nudge: "Look at the value on the right of the `=` — does it have a decimal point?",
        },
        {
          type: "exercise",
          title: "Declare PawWalk's first data",
          prompt: [
            "Declare three pieces of PawWalk data, in this order:",
            "1. a **val** named `dogName` holding the text `\"Mochi\"`\n2. a **val** named `priceCents` holding the whole number `1500`\n3. a **var** named `rating` holding `4.8` — ratings move as new reviews arrive",
            "Let Kotlin infer all three types — no annotations needed.",
          ],
          starter: String.raw`// Declare dogName, priceCents, and rating below
// your code here
`,
          solution: String.raw`val dogName = "Mochi"
val priceCents = 1500
var rating = 4.8`,
          checks: [
            { re: /val dogName(?::String)?="Mochi"/, hint: "A dog's name never changes mid-walk — declare it with `val`, and remember text needs double quotes." },
            { re: /val priceCents(?::Int)?=1500/, hint: "`priceCents` is a val too: `val`, then the bare number 1500 — no quotes around numbers." },
            { re: /var rating(?::Double)?=4\.8/, hint: "The rating needs to change over time. Which keyword declares a name you can reassign?" },
          ],
          mustNot: [
            { re: /var dogName/, hint: "The name won't change — Kotlin style says use `val` unless it must be a `var`." },
            { re: /val rating/, hint: "A `val` rating could never be updated when a new review lands. Use `var` for this one." },
          ],
          success: "That's the core habit: `val` by default, `var` only when the value truly changes — and Kotlin inferred String, Int, and Double for you.",
        },
      ],
    },
    {
      id: "strings-and-templates",
      title: "Strings & Templates",
      steps: [
        {
          type: "text",
          md: [
            "## Text, and how to build it",
            "A **String** is text: characters between double quotes, like `\"Mochi\"`. PawWalk is full of them — dog names, walker bios, neighborhood names, error messages.",
            "The single most-used String feature in Kotlin is the **string template**: put `$name` inside the quotes, and Kotlin drops that value into the text right there. For anything more than a bare name — a calculation, a property access — wrap it in braces: `${expr}`.",
            "You will type `$name` constantly in this course. It's how almost every label in the PawWalk UI gets its text.",
          ],
        },
        {
          type: "code",
          title: "String templates",
          source: String.raw`val dogName = "Mochi"
val minutes = 30

val greeting = "Time to walk $dogName!"                // "Time to walk Mochi!"
val plan = "A $minutes-minute walk"                    // "A 30-minute walk"
val longer = "Or go big: ${"$"}{minutes * 2} minutes"  // "Or go big: 60 minutes"`,
          caption: "A bare name after `$` is enough. An expression — like `minutes * 2` — needs braces: `${minutes * 2}`. Kotlin evaluates what's inside, turns the result into text, and splices it in.",
        },
        {
          type: "code",
          title: "data/Models.kt — Walker.priceLabel",
          source: String.raw`val priceLabel: String get() = "$%.0f / 30 min".format(pricePer30MinCents / 100.0)`,
          caption: "Real shipping code. `.format(...)` is a String method that fills in a `%.0f` placeholder — a whole-number-looking decimal — with the dollar amount, producing text like \"$15 / 30 min\". (The `val … get() = …` wrapper is a *computed property* — you'll build one yourself in a later module.)",
        },
        {
          type: "quiz",
          q: "You write `val price = 20; val label = \"$$price\"`. What does `label` hold?",
          choices: [
            "$$20",
            "$20",
            "A compile error — two dollar signs in a row aren't allowed",
            "20",
          ],
          answer: 1,
          explain: "The first `$` starts the template and interpolates `price` as `20`; the *second* `$` is a plain, literal dollar sign that isn't followed by a valid template start, so it prints as-is. Together: \"$20\".",
          nudge: "Only a `$` immediately followed by a name or `{` starts a template — otherwise it's just a literal character.",
        },
        {
          type: "text",
          md: [
            "## Three more string tricks",
            "**Concatenation** — `+` glues two strings together: `\"Paw\" + \"Walk\"` is `\"PawWalk\"`. Fine for simple gluing; for anything with values in the middle, a template reads better.",
            "**Methods** — a method is an ability a value carries around, called with a dot. Strings come with lots of them: `dogName.uppercase()` gives `\"MOCHI\"`. The parentheses mean *do it now*.",
            "**Raw strings** — three double quotes `\"\"\"` wrapping text let a string span multiple lines, line breaks included, with no need to escape most characters. Handy for long text; you'll rarely need it, but you should recognize it.",
          ],
        },
        {
          type: "code",
          title: "Concatenation, a method, and a raw string",
          source: String.raw`val first = "Paw"
val second = "Walk"
val brand = first + second       // "PawWalk"
val shout = brand.uppercase()    // "PAWWALK"

val poster = """
PawWalk
Walks your dog. Tracks the walk.
"""`,
        },
        {
          type: "exercise",
          title: "Build a walk banner",
          prompt: [
            "The app wants a banner line for the booking screen. Using the two vals already in the editor, declare a **val** named `banner` that uses string templates to read exactly:",
            "`Bella walks for 30 minutes`",
            "Use `$dogName` and `$minutes` — don't retype the word Bella or the number 30.",
          ],
          starter: String.raw`val dogName = "Bella"
val minutes = 30
// your code here
`,
          solution: String.raw`val dogName = "Bella"
val minutes = 30
val banner = "$dogName walks for $minutes minutes"`,
          checks: [
            { re: /val banner(?::String)?=/, hint: "Declare it with `val banner = …` — the banner never changes once built." },
            { re: /"\$dogName walks for/, hint: "Start the string with the dog's name templated in: `\"$dogName walks for …\"`." },
            { re: /\$minutes minutes"/, hint: "Template the number too: `$minutes` followed by the word minutes." },
          ],
          mustNot: [
            { re: /Bella walks/, hint: "Don't hard-code \"Bella\" into the string — template `$dogName` so the banner works for every dog." },
          ],
          success: "That's the exact pattern behind nearly every label in PawWalk — a String built with `$name` templates.",
        },
      ],
    },
    {
      id: "numbers-and-money",
      title: "Numbers & Money in Cents",
      steps: [
        {
          type: "text",
          md: [
            "## Int arithmetic",
            "`Int`s support the arithmetic you expect: `+`, `-`, `*` (multiply), `/` (divide). `1500 * 2` is `3000`, `1500 + 500` is `2000`.",
            "Division has a twist worth burning into memory: **when both sides are `Int`s, the result is an `Int` — the remainder is thrown away.** `7 / 2` is `3`, not `3.5`. There's no rounding: `2599 / 100` is `25`, even though 25.99 is \"closer\" to 26. This is called **truncation**.",
            "Truncation sounds like a bug waiting to happen. Used deliberately, it's a tool — and PawWalk uses it on purpose, as you're about to see.",
          ],
        },
        {
          type: "code",
          title: "Integer division truncates",
          source: String.raw`val doubleWalk = 1500 * 2   // 3000
val half = 7 / 2            // 3   — the .5 is dropped
val dollars = 2599 / 100    // 25  — not 25.99, not 26`,
        },
        {
          type: "quiz",
          q: "In Kotlin, what is `2599 / 100`?",
          choices: ["25.99", "26", "25", "A compile error"],
          answer: 2,
          explain: "Int divided by Int is an Int: Kotlin keeps the whole part (25) and drops the remainder. No rounding ever happens — 25.99 truncates to 25.",
          nudge: "Both numbers are Ints, so the answer must be an Int. Does Kotlin round up, or chop?",
        },
        {
          type: "text",
          md: [
            "## Why PawWalk stores money as Int cents",
            "`Double` seems like the natural type for money — until you learn that computers store `Double`s in binary, and many decimal fractions can't be represented exactly. In Kotlin, `0.1 + 0.2` is *not* `0.3` — it's `0.30000000000000004`. Tiny errors like that compound, and in a payments app \"tiny errors\" means *wrong charges*.",
            "The industry fix is simple: **store money as a whole number of cents, in an `Int`.** $15.00 is `1500`. Int math is exact — no drift, ever. That's why `data/Models.kt` has `pricePer30MinCents: Int` on `Walker` and `priceCents: Int` on `Booking`, and why the backend's JSON sends `price_per_30min_cents`.",
            "Only when a human needs to *read* the price does the app convert cents to dollars — with integer division, right inside a string template.",
          ],
        },
        {
          type: "code",
          title: "data/Models.kt — Booking (excerpt)",
          source: String.raw`val priceCents: Int
val isActive: Boolean get() = status == "pending" || status == "confirmed" || status == "in_progress"`,
          caption: "The stored truth is `priceCents` (exact). `isActive` is a different kind of computed property — a `Boolean` derived from `status` — but the same idea: compute the friendly view on demand from the exact stored value.",
        },
        {
          type: "text",
          md: [
            "## Converting between Int and Double",
            "Kotlin **never converts number types silently** — adding an `Int` to a `Double` is a compile error until you convert one of them yourself. You convert with a method named after the target type:",
            "- `priceCents.toDouble()` — makes `1500.0` from `1500`.\n- `4.9.toInt()` — makes `4`. Same rule as division: **truncation, not rounding.** The decimal part is simply dropped.",
            "> This strictness is on purpose: every conversion that could lose information has to be visible in the code, written by you.",
          ],
        },
        {
          type: "quiz",
          q: "What does `4.9.toInt()` give you?",
          choices: [
            "5 — it rounds to the nearest whole number",
            "4 — it truncates, dropping the decimal part",
            "4.9 — the value is unchanged",
            "A compile error",
          ],
          answer: 1,
          explain: "Converting Double to Int chops off everything after the decimal point — 4.9 becomes 4. If you ever want real rounding, you have to ask for it explicitly.",
          nudge: "Same behavior as integer division: chop, don't round.",
        },
        {
          type: "exercise",
          title: "Cents to dollars, the PawWalk way",
          prompt: [
            "A booking costs `2599` cents. Add two vals:",
            "1. `dollars` — the whole-dollar amount, computed from `priceCents` with integer division\n2. `priceLabel` — a String template that reads `$25`",
            "Stay in `Int` the whole way — no `Double` anywhere.",
          ],
          starter: String.raw`val priceCents = 2599
// your code here
`,
          solution: String.raw`val priceCents = 2599
val dollars = priceCents / 100
val priceLabel = "$$dollars"`,
          checks: [
            { re: /val dollars(?::Int)?=priceCents\/100/, hint: "Divide the cents by 100: `priceCents / 100`. Truncation does the rest." },
            { re: /val priceLabel(?::String)?="\$\$dollars"/, hint: "Build the label with a template: a literal `$` inside the quotes, then `$dollars`." },
          ],
          mustNot: [
            { re: /toDouble\(\)/, hint: "No Double needed — integer division already gives you whole dollars, exactly." },
            { re: /25\.99/, hint: "Keep everything as whole-number Ints. Decimal points and money don't mix in PawWalk." },
          ],
          success: "You just re-derived a PawWalk money label — exact Int cents in storage, pretty String on demand.",
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
            "## A named recipe",
            "A **function** is a named chunk of code you can run whenever you want. You give it inputs, it hands back an output. Define once, use everywhere — the opposite of copy-paste.",
            "The anatomy, left to right:",
            "- **`fun`** — the keyword that starts every function definition.\n- **the name** — camelCase, usually a verb-ish phrase: `walkPrice`.\n- **parameters** in parentheses — the inputs, each written `name: Type`, separated by commas.\n- **`:` and a return type** — after the parentheses, a colon announces what type the function hands back.\n- **the body** in `{ }` — the code that runs. **`return`** followed by a value ends the function and hands that value back.",
            "Calling a function means writing its name with real values in the parentheses. The call is an expression — it *becomes* the returned value, so you can assign it straight to a `val`.",
          ],
        },
        {
          type: "code",
          title: "Define it once, call it anywhere",
          source: String.raw`fun walkPrice(minutes: Int, ratePer30Cents: Int): Int {
    return (minutes / 30) * ratePer30Cents
}

val price = walkPrice(minutes = 60, ratePer30Cents = 1500)`,
          caption: "Two Ints in, one Int out. The call repeats the parameter names — that's optional in Kotlin, but it reads like a sentence, so PawWalk code uses it for anything non-obvious.",
        },
        {
          type: "quiz",
          q: "What value does `walkPrice(minutes = 60, ratePer30Cents = 1500)` return?",
          choices: ["1500", "3000", "90000", "750"],
          answer: 1,
          explain: "60 / 30 is 2 (two half-hours), and 2 * 1500 is 3000 cents — a $30 hour-long walk.",
          nudge: "Work the body by hand: what's `60 / 30`, and what do you multiply it by?",
        },
        {
          type: "text",
          md: [
            "## Named arguments and defaults",
            "Those names at the call — `minutes = 60` — are **named arguments**. Most languages call functions like `login(a, b)` and make you guess what `a` is. Kotlin lets you name the argument at the call site, so it documents itself: `login(email = ..., password = ...)`.",
            "Functions can also give a parameter a **default value** with `= value` in the definition. Callers who are happy with the default just leave that argument out entirely — and once you skip one, any argument after it needs a name so Kotlin knows which parameter you mean.",
            "Here's a teaser from the file where PawWalk talks to its backend — real signatures you'll write yourself in a later module:",
          ],
        },
        {
          type: "code",
          title: "data/PawWalkApi.kt — real signatures (teaser)",
          source: String.raw`suspend fun login(email: String, password: String): AuthResponse
suspend fun signup(email: String, password: String, name: String, role: String): AuthResponse
suspend fun cancelBooking(id: String): Booking`,
          caption: "Read the parts you know: `fun`, named parameters, `:` return type. `AuthResponse` and `Booking` are types PawWalk defines for itself in `data/Models.kt` — you'll build types like them in the next module. `suspend` handles networking without freezing the app — also a later module.",
        },
        {
          type: "quiz",
          q: "Given `fun book(minutes: Int = 30): Int`, what happens when you call `book()`?",
          choices: [
            "Compile error — the minutes argument is required",
            "The function runs with minutes set to 0",
            "The function runs with minutes set to the default, 30",
            "Kotlin asks for the value while the app is running",
          ],
          answer: 2,
          explain: "A default value makes the argument optional at the call site. Leave it out and the default (30) is used; pass `book(minutes = 60)` to override it.",
          nudge: "What's the `= 30` in the definition for?",
        },
        {
          type: "exercise",
          title: "Write your first function",
          prompt: [
            "Write a function named `greeting` that takes one parameter, `dogName` of type `String`, and returns a `String`.",
            "Its body should use the `return` keyword to return the templated text `Time to walk $dogName!` — so `greeting(dogName = \"Rex\")` returns `Time to walk Rex!`.",
            "The call at the bottom of the editor is already written for you.",
          ],
          starter: String.raw`// your code here

println(greeting(dogName = "Rex"))
`,
          solution: String.raw`fun greeting(dogName: String): String {
    return "Time to walk $dogName!"
}

println(greeting(dogName = "Rex"))
`,
          checks: [
            { re: /fun greeting\(dogName:String\):String\{/, hint: "The shape is `fun greeting(dogName: String): String { … }` — keyword, name, parameter with its type, colon, return type, brace." },
            { re: /return"Time to walk\$dogName!"/, hint: "The body is one line: `return \"…\"` — template the `dogName` parameter into the text with `$dogName`, and don't forget the exclamation mark." },
          ],
          mustNot: [
            { re: /Time to walk Rex/, hint: "Don't hard-code Rex inside the function — template `$dogName` so the function greets any dog it's given." },
          ],
          success: "Inputs in, String out — and the call site reads like a sentence: `greeting(dogName = \"Rex\")`. That's Kotlin.",
        },
      ],
    },
    {
      id: "control-flow",
      title: "Making Decisions",
      steps: [
        {
          type: "text",
          md: [
            "## if / else as an expression",
            "Programs constantly choose between paths. **`if`** runs a block of code only when a **condition** — an expression whose type is `Boolean` — is `true`. **`else`** provides the block to run when it isn't.",
            "Conditions usually come from **comparison operators**, each producing a `Boolean`:",
            "- `==` equal (two equals signs! a single `=` assigns)\n- `!=` not equal\n- `<` `>` less / greater than\n- `<=` `>=` less / greater than **or equal**",
            "Kotlin's `if` has a superpower Swift's doesn't: it's an **expression**, meaning it can produce a value directly — `val label = if (rating >= 4.5) \"Top-rated\" else \"Solid\"` skips the temporary variable entirely.",
          ],
        },
        {
          type: "code",
          title: "Choosing a path",
          source: String.raw`val rating = 4.8

if (rating >= 4.5) {
    println("Top-rated walker")
} else {
    println("Solid walker")
}`,
        },
        {
          type: "quiz",
          q: "With `rating` equal to 4.8, what does the code above print?",
          choices: [
            "Top-rated walker",
            "Solid walker",
            "Both lines",
            "Nothing — 4.8 isn't exactly 4.5",
          ],
          answer: 0,
          explain: "`4.8 >= 4.5` is `true`, so the `if` block runs and the `else` block is skipped. Exactly one of the two branches ever runs.",
          nudge: "Is `4.8 >= 4.5` true or false?",
        },
        {
          type: "text",
          md: [
            "## when — one value, many branches",
            "When one value can be several specific things, a chain of `if`s gets clumsy. **`when`** compares a value against a list of branches and runs the first one that matches — Kotlin's version of `switch`, but also usable as an expression.",
            "When `when` is used as an **expression** — assigned to a `val`, or returned — the compiler forces it to be **exhaustive**: every possible value must be covered, or the code won't compile. For an open-ended type like `String`, that means adding an **`else ->`** branch to catch everything you didn't list.",
            "> Preview: PawWalk's bookings have a status — pending, confirmed, in progress, completed, cancelled — stored as a `String` for now (you'll meet the stricter `enum class BookingStatus` in the next module). The app renders each status with a `when`, and exhaustiveness on the enum version means the compiler *forces* the UI to handle every status. Forget one, and the app won't build.",
          ],
        },
        {
          type: "code",
          title: "Deciding on a booking status",
          source: String.raw`val status = "confirmed"

val message = when (status) {
    "pending" -> "Waiting for the walker to accept"
    "confirmed" -> "Walk is on!"
    "cancelled" -> "This walk was cancelled"
    else -> "Some other status"
}`,
          caption: "`message` becomes \"Walk is on!\". Only the matching branch runs — no fall-through to the next branch, unlike some other languages' switch.",
        },
        {
          type: "quiz",
          q: "You delete the `else ->` branch from the `when` expression above. What happens?",
          choices: [
            "Nothing — else was never matching anyway",
            "The app crashes if status is something unlisted",
            "It won't compile — a `when` expression on a String must cover every possible value",
            "Kotlin adds the else branch back automatically",
          ],
          answer: 2,
          explain: "Exhaustiveness is checked at compile time whenever `when` is used as an expression. A String could be anything, so without `else ->` the branches can't cover every possibility — the compiler stops you right there.",
          nudge: "Remember the `when`-as-expression superpower: *exhaustive*. Can three branches cover every possible String?",
        },
        {
          type: "text",
          md: [
            "## Repeating with loops",
            "**`for`** runs a block once per item in a collection. A **List** is Kotlin's ordered collection — values in square brackets via `listOf(...)`, like `listOf(\"Mochi\", \"Bella\")` (`data/Models.kt` uses one: each walker's `neighborhoods` is a `List<String>`; lists get their full treatment in the next module).",
            "`for` also works over a **range**: `1..5` means the numbers 1 through 5, ends included. Perfect for things like drawing a 5-star rating.",
            "**`while`** repeats *as long as* a condition stays true — useful when you don't know the count in advance. You'll use it rarely; `for` covers most looping in this course.",
          ],
        },
        {
          type: "code",
          title: "for over a List, a range, and a while",
          source: String.raw`val dogs = listOf("Mochi", "Bella", "Rex")
for (dog in dogs) {
    println("Walking $dog")
}

for (star in 1..5) {
    println("Star $star")
}

var pings = 3
while (pings > 0) {
    println("GPS ping")
    pings = pings - 1
}`,
          caption: "`dog` and `star` are new vals the loop creates for you, one fresh value per pass — no `val` keyword needed.",
        },
        {
          type: "exercise",
          title: "Instant-book decision",
          prompt: [
            "PawWalk highlights walkers worth booking on the spot. Below the val already in the editor, write an `if` / `else`:",
            "- if `rating` is **greater than or equal to** `4.5`, print `Book instantly!`\n- otherwise, print `Read reviews first`",
          ],
          starter: String.raw`val rating = 4.9
// your code here
`,
          solution: String.raw`val rating = 4.9
if (rating >= 4.5) {
    println("Book instantly!")
} else {
    println("Read reviews first")
}`,
          checks: [
            { re: /if\(rating>=4\.5\)\{/, hint: "Start with `if (...)`, comparing `rating` against 4.5 — greater-than-or-equal is `>=`, in that order — then an opening `{`." },
            { re: /println\("Book instantly!"\)/, hint: "Inside the if block, print exactly `Book instantly!` — quotes inside the parentheses." },
            { re: /\}else\{println\("Read reviews first"\)/, hint: "Add an `else { … }` branch that prints `Read reviews first`." },
          ],
          mustNot: [
            { re: /if\(rating=4/, hint: "A single `=` assigns a value. To compare you need `>=` (or `==`)." },
          ],
          success: "Branching, comparison operators, and println — you now have everything a program needs to make decisions. Module complete: next stop, going one level deeper into Kotlin.",
        },
      ],
    },
  ],
});
