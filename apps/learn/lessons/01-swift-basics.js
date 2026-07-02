// Module 01 — Swift Basics. See FORMAT.md for the schema.
window.COURSE = window.COURSE || [];
window.COURSE.push({
  id: "swift-basics",
  title: "Swift Basics",
  emoji: "🔤",
  lessons: [
    {
      id: "constants-and-variables",
      title: "Constants & Variables",
      steps: [
        {
          type: "text",
          md: [
            "## Naming your data",
            "A program is mostly data with names attached. In Swift you attach a name to a value with one of two keywords:",
            "- **`let`** declares a **constant** — a name whose value is set once and can never change.\n- **`var`** declares a **variable** — a name whose value you can replace later.",
            "Swift strongly prefers `let`. A value that *can't* change is a value that can't be changed **by accident** — a whole category of bugs, gone. Xcode even warns you when you write `var` for something you never modify.",
            "> Rule of thumb: start with `let`. Switch to `var` only when the **compiler** — the program that turns your Swift into a runnable app — tells you the value actually needs to change.",
          ],
        },
        {
          type: "code",
          title: "let vs var",
          source: String.raw`let dogName = "Mochi"     // a constant: set once
let priceCents = 1500     // also a constant
var rating = 4.8          // a variable: allowed to change

rating = 4.9              // fine — rating is a var
// dogName = "Rex"        // compile error! dogName is a let`,
          caption: "The compiler refuses to build code that reassigns a `let`. That's a feature, not a punishment.",
        },
        {
          type: "quiz",
          q: "You wrote `let walkMinutes = 30`, and three lines later you write `walkMinutes = 60`. What happens?",
          choices: [
            "walkMinutes becomes 60",
            "The compiler refuses to build — a `let` can never be reassigned",
            "The app builds but crashes when it runs",
            "Swift silently keeps 30 and ignores the new value",
          ],
          answer: 1,
          explain: "A `let` is a promise to the compiler that the value never changes. Break the promise and the code simply won't compile — the fix is either to not reassign it, or to declare it with `var`.",
          nudge: "Which keyword means \"this can never change\"?",
        },
        {
          type: "text",
          md: [
            "## Types",
            "Every value in Swift has a **type** — the kind of thing it is. Four types cover most of PawWalk:",
            "- **`Int`** — a whole number: `1500`, `0`, `-3`. Every price in PawWalk is an `Int`.\n- **`Double`** — a number with a decimal point: `4.8`, `0.5`. Walker ratings are `Double`s.\n- **`Bool`** — exactly `true` or `false`, nothing else.\n- **`String`** — text, wrapped in double quotes: `\"Mochi\"`.",
            "You usually don't write the type yourself. Swift **infers** it from the value on the right of the `=`: `let priceCents = 1500` makes an `Int` (whole number), `let rating = 4.8` makes a `Double` (decimal point).",
            "When you want to spell it out — or there's no value yet — add a **type annotation**: a colon and the type after the name, `let priceCents: Int = 1500`. Read the colon as *\"of type\"*.",
            "One naming convention to lock in now: Swift names use **camelCase** — first word lowercase, every following word capitalized, no spaces or underscores: `dogName`, `pricePer30MinCents`.",
          ],
        },
        {
          type: "code",
          title: "Models/Models.swift — real PawWalk properties (excerpt)",
          source: String.raw`let name: String
let rating: Double
let pricePer30MinCents: Int`,
          caption: "Three lines straight out of the app's Walker type. (They live inside a `struct` — you'll meet structs in a later module.) With no `= value` on the line, the type annotation is required: name, colon, type.",
        },
        {
          type: "quiz",
          q: "Swift sees `let rating = 4.8`. What type does it infer for `rating`?",
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
            "1. a **constant** named `dogName` holding the text `\"Mochi\"`\n2. a **constant** named `priceCents` holding the whole number `1500`\n3. a **variable** named `rating` holding `4.8` — ratings move as new reviews arrive",
            "Let Swift infer all three types — no annotations needed.",
          ],
          starter: String.raw`// Declare dogName, priceCents, and rating below
// your code here
`,
          solution: String.raw`let dogName = "Mochi"
let priceCents = 1500
var rating = 4.8`,
          checks: [
            { re: /let dogName(?::String)?="Mochi"/, hint: "A dog's name never changes mid-walk — declare it with `let`, and remember text needs double quotes." },
            { re: /let priceCents(?::Int)?=1500/, hint: "`priceCents` is a constant too: `let`, then the bare number 1500 — no quotes around numbers." },
            { re: /var rating(?::Double)?=4\.8/, hint: "The rating needs to change over time. Which keyword declares a value you can reassign?" },
          ],
          mustNot: [
            { re: /var dogName/, hint: "The name won't change — Swift style says use `let` unless it must be a `var`." },
            { re: /let rating/, hint: "A `let` rating could never be updated when a new review lands. Use `var` for this one." },
          ],
          success: "That's the core habit: `let` by default, `var` only when the value truly changes — and Swift inferred String, Int, and Double for you.",
        },
      ],
    },
    {
      id: "strings",
      title: "Strings & Interpolation",
      steps: [
        {
          type: "text",
          md: [
            "## Text, and how to build it",
            "A **String** is text: characters between double quotes, like `\"Mochi\"`. PawWalk is full of them — dog names, walker bios, neighborhood names, error messages.",
            "The single most-used String feature in Swift is **string interpolation**: put `\\(someValue)` inside the quotes, and Swift drops the value into the text right there. It works with any value — a constant, a variable, even a calculation.",
            "You will type `\\( … )` hundreds of times in this course. It's how almost every label in the PawWalk UI gets its text.",
          ],
        },
        {
          type: "code",
          title: "Interpolation",
          source: String.raw`let dogName = "Mochi"
let minutes = 30

let greeting = "Time to walk \(dogName)!"        // "Time to walk Mochi!"
let plan = "A \(minutes)-minute walk"            // "A 30-minute walk"
let longer = "Or go big: \(minutes * 2) minutes" // "Or go big: 60 minutes"`,
          caption: "Anything inside the \\( ) parentheses is real Swift code — Swift evaluates it, turns the result into text, and splices it in.",
        },
        {
          type: "code",
          title: "Models/Models.swift — Walker.priceLabel",
          source: String.raw`var priceLabel: String { "$\(pricePer30MinCents / 100) / 30 min" }`,
          caption: "Real shipping code. Focus on the string: it interpolates a price calculation to build text like \"$15 / 30 min\". (The `var … { … }` wrapper is a *computed property* — you'll build one yourself in a later module.)",
        },
        {
          type: "quiz",
          q: "If `pricePer30MinCents` is 2000, what text does `\"$\\(pricePer30MinCents / 100) / 30 min\"` produce?",
          choices: [
            "$2000 / 30 min",
            "$20 / 30 min",
            "$\\(pricePer30MinCents / 100) / 30 min — the characters exactly as typed",
            "$20.00 / 30 min",
          ],
          answer: 1,
          explain: "Interpolation *runs* the code inside the parentheses first: 2000 / 100 is 20, so the string becomes \"$20 / 30 min\". No code appears in the output — only its result.",
          nudge: "Swift evaluates `pricePer30MinCents / 100` before building the text. What's 2000 divided by 100?",
        },
        {
          type: "text",
          md: [
            "## Three more string tricks",
            "**Concatenation** — `+` glues two strings together: `\"Paw\" + \"Walk\"` is `\"PawWalk\"`. Fine for simple gluing; for anything with values in the middle, interpolation reads better.",
            "**Methods** — a method is an ability a value carries around, called with a dot. Strings come with lots of them: `dogName.uppercased()` gives `\"MOCHI\"`. The parentheses mean *do it now*.",
            "**Multiline strings** — three double quotes `\"\"\"` on their own lines let a string span multiple lines, line breaks included. Handy for long text; you'll rarely need it, but you should recognize it.",
          ],
        },
        {
          type: "code",
          title: "Concatenation, a method, and a multiline string",
          source: String.raw`let first = "Paw"
let second = "Walk"
let brand = first + second       // "PawWalk"
let shout = brand.uppercased()   // "PAWWALK"

let poster = """
PawWalk
Walks your dog. Tracks the walk.
"""`,
        },
        {
          type: "exercise",
          title: "Build a walk banner",
          prompt: [
            "The app wants a banner line for the booking screen. Using the two constants already in the editor, declare a **constant** named `banner` that interpolates both of them to read exactly:",
            "`Bella walks for 30 minutes`",
            "Use interpolation — don't retype the word Bella or the number 30.",
          ],
          starter: String.raw`let dogName = "Bella"
let minutes = 30
// your code here
`,
          solution: String.raw`let dogName = "Bella"
let minutes = 30
let banner = "\(dogName) walks for \(minutes) minutes"`,
          checks: [
            { re: /let banner(?::String)?=/, hint: "Declare it with `let banner = …` — the banner never changes once built." },
            { re: /\\\(dogName\)walks for/, hint: "Start the string with the dog's name interpolated: `\"\\(dogName) walks for …\"`." },
            { re: /\\\(minutes\)minutes/, hint: "Interpolate the number too: `\\(minutes)` followed by the word minutes." },
          ],
          mustNot: [
            { re: /Bella walks/, hint: "Don't hard-code \"Bella\" into the string — interpolate `dogName` so the banner works for every dog." },
          ],
          success: "That's the exact pattern behind nearly every label in PawWalk — a String built with \\( ) interpolation.",
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
          source: String.raw`let doubleWalk = 1500 * 2   // 3000
let half = 7 / 2            // 3   — the .5 is dropped
let dollars = 2599 / 100    // 25  — not 25.99, not 26`,
        },
        {
          type: "quiz",
          q: "In Swift, what is `2599 / 100`?",
          choices: ["25.99", "26", "25", "A compile error"],
          answer: 2,
          explain: "Int divided by Int is an Int: Swift keeps the whole part (25) and drops the remainder. No rounding ever happens — 25.99 truncates to 25.",
          nudge: "Both numbers are Ints, so the answer must be an Int. Does Swift round up, or chop?",
        },
        {
          type: "text",
          md: [
            "## Why PawWalk stores money as Int cents",
            "`Double` seems like the natural type for money — until you learn that computers store `Double`s in binary, and many decimal fractions can't be represented exactly. In Swift, `0.1 + 0.2` is *not* `0.3` — it's `0.30000000000000004`. Tiny errors like that compound, and in a payments app \"tiny errors\" means *wrong charges*.",
            "The industry fix is simple: **store money as a whole number of cents, in an `Int`.** $15.00 is `1500`. Int math is exact — no drift, ever. That's why Models.swift has `pricePer30MinCents: Int` on Walker and `priceCents: Int` on Booking, and why the backend's JSON sends `price_per_30min_cents`.",
            "Only when a human needs to *read* the price does the app convert cents to dollars — with integer division, right inside a string interpolation.",
          ],
        },
        {
          type: "code",
          title: "Models/Models.swift — Booking (excerpt)",
          source: String.raw`let priceCents: Int

var priceLabel: String { "$\(priceCents / 100)" }`,
          caption: "The stored truth is `priceCents` (exact). The pretty version is computed on demand: 1500 cents becomes \"$15\".",
        },
        {
          type: "text",
          md: [
            "## Converting between Int and Double",
            "Swift **never converts number types silently** — adding an `Int` to a `Double` is a compile error until you convert one of them yourself. You convert by wrapping the value in the target type's name:",
            "- `Double(priceCents)` — makes `1500.0` from `1500`.\n- `Int(4.9)` — makes `4`. Same rule as division: **truncation, not rounding.** The decimal part is simply dropped.",
            "> This strictness is on purpose: every conversion that could lose information has to be visible in the code, written by you.",
          ],
        },
        {
          type: "quiz",
          q: "What does `Int(4.9)` give you?",
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
            "A booking costs `2599` cents. Add two constants:",
            "1. `dollars` — the whole-dollar amount, computed from `priceCents` with integer division\n2. `priceLabel` — a String that interpolates `dollars` to read `$25`",
            "Stay in `Int` the whole way — no `Double` anywhere.",
          ],
          starter: String.raw`let priceCents = 2599
// your code here
`,
          solution: String.raw`let priceCents = 2599
let dollars = priceCents / 100
let priceLabel = "$\(dollars)"`,
          checks: [
            { re: /let dollars(?::Int)?=priceCents\/100/, hint: "Divide the cents by 100: `priceCents / 100`. Truncation does the rest." },
            { re: /let priceLabel(?::String)?="\$\\\(dollars\)"/, hint: "Build the label with interpolation: a `$` inside the quotes, then `\\(dollars)`." },
          ],
          mustNot: [
            { re: /Double\(/, hint: "No Double needed — integer division already gives you whole dollars, exactly." },
            { re: /25\.99/, hint: "Keep everything as whole-number Ints. Decimal points and money don't mix in PawWalk." },
          ],
          success: "You just re-derived Booking.priceLabel from Models.swift — exact Int money in storage, pretty String on demand.",
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
            "- **`func`** — the keyword that starts every function definition.\n- **the name** — camelCase, usually a verb-ish phrase: `walkPrice`.\n- **parameters** in parentheses — the inputs, each written `name: Type`, separated by commas.\n- **`->` and a return type** — the arrow announces what type the function hands back.\n- **the body** in `{ }` — the code that runs. **`return`** followed by a value ends the function and hands that value back.",
            "Calling a function means writing its name with real values in the parentheses. The call is an expression — it *becomes* the returned value, so you can assign it straight to a `let`.",
          ],
        },
        {
          type: "code",
          title: "Define it once, call it anywhere",
          source: String.raw`func walkPrice(minutes: Int, ratePer30Cents: Int) -> Int {
    return (minutes / 30) * ratePer30Cents
}

let price = walkPrice(minutes: 60, ratePer30Cents: 1500)`,
          caption: "Two Ints in, one Int out. Note how the call repeats the parameter names — more on that in a second.",
        },
        {
          type: "quiz",
          q: "What value does `walkPrice(minutes: 60, ratePer30Cents: 1500)` return?",
          choices: ["1500", "3000", "90000", "750"],
          answer: 1,
          explain: "60 / 30 is 2 (two half-hours), and 2 * 1500 is 3000 cents — a $30 hour-long walk.",
          nudge: "Work the body by hand: what's `60 / 30`, and what do you multiply it by?",
        },
        {
          type: "text",
          md: [
            "## Call sites that read like sentences",
            "Those names at the call — `minutes: 60` — are **argument labels**. Most languages call functions like `login(a, b)` and make you guess what `a` is. Swift makes the label part of the call, so the call site documents itself: `login(email: ..., password: ...)`. Swift programmers even *name* functions with their labels attached: `login(email:password:)`.",
            "Functions can also give a parameter a **default value** with `= value` in the definition. Callers who are happy with the default just leave that argument out entirely.",
            "Here's a teaser from the file where PawWalk talks to its backend — real signatures you'll write yourself in a later module:",
          ],
        },
        {
          type: "code",
          title: "Services/APIClient.swift — real signatures (teaser)",
          source: String.raw`func login(email: String, password: String) async throws -> AuthResponse
func signup(email: String, password: String, name: String, role: UserRole) async throws -> AuthResponse
func cancelBooking(id: String) async throws -> Booking`,
          caption: "Read the parts you know: `func`, labeled parameters, `->` return type. `AuthResponse`, `UserRole`, and `Booking` are types PawWalk defines for itself in Models.swift — you'll build types like them in the next module. The `async throws` in the middle handles networking and errors — also a later module.",
        },
        {
          type: "quiz",
          q: "Given `func book(minutes: Int = 30) -> Int`, what happens when you call `book()`?",
          choices: [
            "Compile error — the minutes argument is required",
            "The function runs with minutes set to 0",
            "The function runs with minutes set to the default, 30",
            "Swift asks for the value while the app is running",
          ],
          answer: 2,
          explain: "A default value makes the argument optional at the call site. Leave it out and the default (30) is used; pass `book(minutes: 60)` to override it.",
          nudge: "What's the `= 30` in the definition for?",
        },
        {
          type: "exercise",
          title: "Write your first function",
          prompt: [
            "Write a function named `greeting` that takes one parameter, `dogName` of type `String`, and returns a `String`.",
            "Its body should use the `return` keyword to return the interpolated text `Time to walk \\(dogName)!` — so `greeting(dogName: \"Rex\")` returns `Time to walk Rex!`.",
            "The call at the bottom of the editor is already written for you.",
          ],
          starter: String.raw`// your code here

print(greeting(dogName: "Rex"))
`,
          solution: String.raw`func greeting(dogName: String) -> String {
    return "Time to walk \(dogName)!"
}

print(greeting(dogName: "Rex"))
`,
          checks: [
            { re: /func greeting\(dogName:String\)->String\{/, hint: "The shape is `func greeting(dogName: String) -> String { … }` — keyword, name, parameter with its type, arrow, return type, brace." },
            { re: /return"Time to walk\\\(dogName\)!"/, hint: "The body is one line: `return \"…\"` — interpolate the `dogName` parameter into the text with `\\( )`, and don't forget the exclamation mark." },
          ],
          mustNot: [
            { re: /Time to walk Rex/, hint: "Don't hard-code Rex inside the function — interpolate `dogName` so the function greets any dog it's given." },
          ],
          success: "Inputs in, String out — and the call site reads like a sentence: `greeting(dogName: \"Rex\")`. That's Swift.",
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
            "## if / else",
            "Programs constantly choose between paths. **`if`** runs a block of code only when a **condition** — an expression whose type is `Bool` — is `true`. **`else`** provides the block to run when it isn't.",
            "Conditions usually come from **comparison operators**, each producing a `Bool`:",
            "- `==` equal (two equals signs! a single `=` assigns)\n- `!=` not equal\n- `<` `>` less / greater than\n- `<=` `>=` less / greater than **or equal**",
          ],
        },
        {
          type: "code",
          title: "Choosing a path",
          source: String.raw`let rating = 4.8

if rating >= 4.5 {
    print("Top-rated walker")
} else {
    print("Solid walker")
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
            "## switch — one value, many cases",
            "When one value can be several specific things, a chain of `if`s gets clumsy. **`switch`** compares a value against a list of **cases** and runs the first one that matches.",
            "Swift's switch has a superpower: it must be **exhaustive** — every possible value has to be covered, or the code won't compile. For an open-ended type like `String`, that means adding a **`default:`** case to catch everything you didn't list.",
            "> Preview: PawWalk's bookings have a status — pending, confirmed, in progress, completed, cancelled — defined in Models.swift as `BookingStatus` (an `enum`, coming in a later module). The app renders each status with a `switch`, and exhaustiveness means the compiler *forces* the UI to handle every status. Forget one, and the app won't build.",
          ],
        },
        {
          type: "code",
          title: "Switching on a booking status",
          source: String.raw`let status = "confirmed"

switch status {
case "pending":
    print("Waiting for the walker to accept")
case "confirmed":
    print("Walk is on!")
case "cancelled":
    print("This walk was cancelled")
default:
    print("Some other status")
}`,
          caption: "Prints \"Walk is on!\". Only the matching case runs — no fall-through to the next case, unlike many other languages.",
        },
        {
          type: "quiz",
          q: "You delete the `default:` case from the switch above. What happens?",
          choices: [
            "Nothing — default was never matching anyway",
            "The app crashes if status is something unlisted",
            "It won't compile — a switch on a String must cover every possible value",
            "Swift adds the default back automatically",
          ],
          answer: 2,
          explain: "Exhaustiveness is checked at compile time. A String could be anything, so without `default:` the cases can't cover every possibility — the compiler stops you right there.",
          nudge: "Remember the switch superpower: *exhaustive*. Can three cases cover every possible String?",
        },
        {
          type: "text",
          md: [
            "## Repeating with loops",
            "**`for-in`** runs a block once per item in a collection. An **array** is Swift's ordered list — values in square brackets, like `[\"Mochi\", \"Bella\"]` (Models.swift uses one: each walker's `neighborhoods` is a `[String]`, an array of Strings; arrays get their full treatment in a later module).",
            "`for-in` also works over a **range**: `1...5` means the numbers 1 through 5, ends included. Perfect for things like drawing a 5-star rating.",
            "**`while`** repeats *as long as* a condition stays true — useful when you don't know the count in advance. You'll use it rarely; `for-in` covers most looping in this course.",
          ],
        },
        {
          type: "code",
          title: "for-in over an array, a range, and a while",
          source: String.raw`let dogs = ["Mochi", "Bella", "Rex"]
for dog in dogs {
    print("Walking \(dog)")
}

for star in 1...5 {
    print("Star \(star)")
}

var pings = 3
while pings > 0 {
    print("GPS ping")
    pings = pings - 1
}`,
          caption: "`dog` and `star` are new constants the loop creates for you, one fresh value per pass — no `let` needed.",
        },
        {
          type: "exercise",
          title: "Instant-book decision",
          prompt: [
            "PawWalk highlights walkers worth booking on the spot. Below the constant already in the editor, write an `if` / `else`:",
            "- if `rating` is **greater than or equal to** `4.5`, print `Book instantly!`\n- otherwise, print `Read reviews first`",
          ],
          starter: String.raw`let rating = 4.9
// your code here
`,
          solution: String.raw`let rating = 4.9
if rating >= 4.5 {
    print("Book instantly!")
} else {
    print("Read reviews first")
}`,
          checks: [
            { re: /if rating>=4\.5\{/, hint: "Start with `if`, then compare `rating` against 4.5 — greater-than-or-equal is `>=`, in that order — and end the line with an opening `{`." },
            { re: /print\("Book instantly!"\)/, hint: "Inside the if block, print exactly `Book instantly!` — quotes inside the parentheses." },
            { re: /else\{print\("Read reviews first"\)/, hint: "Add an `else { … }` branch that prints `Read reviews first`." },
          ],
          mustNot: [
            { re: /if rating=4/, hint: "A single `=` assigns a value. To compare you need `>=` (or `==`)." },
          ],
          success: "Branching, comparison operators, and print — you now have everything a program needs to make decisions. Module complete: next stop, building PawWalk's own types.",
        },
      ],
    },
  ],
});
