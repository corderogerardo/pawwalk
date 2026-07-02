// Module 02 — Swift, one level deeper: optionals, structs, enums, closures, protocols & errors.
// See FORMAT.md for the schema.
window.COURSE = window.COURSE || [];
window.COURSE.push({
  id: "swift-deeper",
  title: "Swift, One Level Deeper",
  emoji: "🧩",
  lessons: [
    // ────────────────────────────────────────────────────────── Lesson 1
    {
      id: "optionals",
      title: "Optionals: When a Value Might Not Exist",
      steps: [
        {
          type: "text",
          md: [
            "## Sometimes there's just no value",
            "Every pet in PawWalk has a name. But its age? A rescue dog's age is often a guess the owner never enters. And not every walker uploads a profile photo. Swift forces you to be honest about missing data: a value that *might not be there* gets a different type.",
            "`Double` is **always** a number. `Double?` — read it as \"optional Double\" — is *either* a number *or* `nil`, Swift's word for \"nothing here.\" In the real models file, `Pet.ageYears` is a `Double?` and `Walker.photoURL` is a `String?` for exactly these reasons.",
            "> The `?` is part of the type. `String` and `String?` are different types, and Swift will not let you use a `String?` as if the value were definitely there. That one rule eliminates the #1 crash in most other languages: using a value that doesn't exist.",
          ],
        },
        {
          type: "code",
          title: "Models/Models.swift — Pet (trimmed)",
          source: String.raw`struct Pet {
    let name: String        // every pet has a name
    let breed: String
    let ageYears: Double?   // the owner may not know the age
    let weightKg: Double?   // …or the weight
    let notes: String
}`,
          caption: "`struct` bundles values into a type of your own — that's the very next lesson. The real file also has `id` and `createdAt` fields, protocol conformances (Lesson 5), and JSON plumbing (Module 03).",
        },
        {
          type: "quiz",
          q: "`Walker.photoURL` has type `String?`. What can it hold?",
          choices: [
            "Only a URL string",
            "Only nil",
            "Either a string or nil",
            "An empty string, but never nil",
          ],
          answer: 2,
          explain: "That's the whole idea: `String?` is a box that contains a String *or* nothing. Some walkers uploaded a photo, some didn't — the type tells the truth.",
          nudge: "The `?` means the value is optional — what are the two possibilities?",
        },
        {
          type: "text",
          md: [
            "## Getting the value out",
            "Swift won't let you use a `String?` where a `String` is needed — you have to **unwrap** it first.",
            "The blunt tool is `!`, the **force-unwrap**: `photoURL!` means \"I swear this isn't nil.\" If you're wrong, the app **crashes on the spot**. You'll see `!` in the wild; in this course we treat it as a code smell and almost never use it.",
            "The safe tool is `if let`: *try* to unwrap. If there's a value, bind it to a new constant and run the block — inside the block, that constant is a plain, non-optional value. If it's nil, run the `else` branch instead.",
          ],
        },
        {
          type: "code",
          title: "if let, on a walker's photo",
          source: String.raw`let photoURL: String? = nil   // this walker never uploaded a photo

if let url = photoURL {
    print("Load the image at \(url)")
} else {
    print("Show the placeholder paw icon")
}`,
          caption: "Inside the `if` block, `url` is a plain `String` — the question mark is gone. Here `photoURL` is nil, so the `else` branch runs.",
        },
        {
          type: "exercise",
          title: "Unwrap a pet's age",
          prompt: [
            "PawWalk shows a pet's age only when it's known. Below, `maybeAge` is a `Double?` that happens to hold a value.",
            "Write an `if let` that unwraps it into a constant called `age` and prints `Age: \\(age)` — and an `else` branch that prints `Age unknown`.",
          ],
          starter: String.raw`let maybeAge: Double? = 3.0
// your code here
`,
          solution: String.raw`let maybeAge: Double? = 3.0
if let age = maybeAge {
    print("Age: \(age)")
} else {
    print("Age unknown")
}`,
          checks: [
            { re: /if let age=maybeAge\{/, hint: "Start with `if let age = maybeAge {` — unwrap the optional into a new constant named `age`." },
            { re: /print\("Age:\\\(age\)"\)/, hint: "Inside the braces, print with string interpolation: the text `Age: ` followed by `\\(age)`." },
            { re: /else\{print\("Age unknown"\)\}/, hint: "After the closing brace, add `else { print(\"Age unknown\") }` for the nil case." },
          ],
          mustNot: [
            { re: /maybeAge!/, hint: "No force-unwrapping! `!` crashes when the value is nil — `if let` is the safe way." },
          ],
          success: "Unwrapped safely. Both paths are handled, and nothing can crash — that's the optional mindset.",
        },
        {
          type: "text",
          md: [
            "## `guard let` — the early exit",
            "`if let` nests your happy path inside braces. Swift's second unwrapping tool keeps the happy path *flat*: `guard let value = optional else { return }` means \"unwrap this — and if you can't, leave the function right now.\" After the guard line, the value is unwrapped for the **rest of the function**. PawWalk's code uses this idiom everywhere.",
            "One shortcut you'll see constantly: when the unwrapped constant keeps the same name as the optional, you can drop the `= name` part. `guard let bearerToken else { return }` is short for `guard let bearerToken = bearerToken else { return }`.",
            "The real app uses this in the exact spot where a missing value matters most: attaching the login token to a network request. No token? Nothing to attach — leave early.",
          ],
        },
        {
          type: "code",
          title: "Services/APIClient.swift — attachAuthorization",
          source: String.raw`private func attachAuthorization(to request: inout URLRequest) {
    guard let bearerToken else { return }
    request.setValue("Bearer \(bearerToken)", forHTTPHeaderField: "Authorization")
}`,
          caption: "Real code from the networking client. `private`, `inout`, and `URLRequest` are details for later modules — the star is line 2: unwrap the token or bail out.",
        },
        {
          type: "quiz",
          q: "In `attachAuthorization`, what happens when `bearerToken` is nil?",
          choices: [
            "The app crashes",
            "The function returns immediately — no Authorization header is added",
            "Swift substitutes an empty string",
            "The request fails with an error",
          ],
          answer: 1,
          explain: "`guard let … else { return }` is the early exit: nothing to unwrap means the `else` runs and the function ends right there. The request simply goes out without the header.",
          nudge: "Read the `else` branch — what single keyword is inside it?",
        },
        {
          type: "text",
          md: [
            "## Two more one-liners",
            "**Nil-coalescing `??`** — \"use this value, or if it's nil, use that fallback\": `let url = photoURL ?? \"placeholder.png\"`. The result is a plain `String`, never nil, because the fallback plugs the hole.",
            "**Optional chaining `?.`** — reach into an optional without unwrapping it: `photoURL?.isEmpty` asks \"*if* there's a URL, is it empty?\" When `photoURL` is nil, the whole expression just evaluates to nil instead of crashing. (`isEmpty` on a string is `true` when it has no characters.)",
          ],
        },
        {
          type: "exercise",
          title: "Plug the hole with ??",
          prompt: [
            "This walker has no photo. Write one line that creates a constant `url` equal to `photoURL` — or, if that's nil, the fallback string `\"placeholder.png\"`. Use `??`.",
          ],
          starter: String.raw`let photoURL: String? = nil
// your code here
`,
          solution: String.raw`let photoURL: String? = nil
let url = photoURL ?? "placeholder.png"`,
          checks: [
            { re: /let url(:String)?=photoURL\?\?/, hint: "The shape is `let url = photoURL ?? fallback` — the optional on the left, `??` in the middle." },
            { re: /\?\?"placeholder\.png"/, hint: "The fallback goes on the right of `??`: the string `\"placeholder.png\"`." },
          ],
          mustNot: [
            { re: /photoURL!/, hint: "`!` crashes when the value is nil — `??` never does. That's the point of it." },
          ],
          success: "`url` is a plain non-optional `String` now. `??` is the one-line answer to \"show a default when the data is missing.\"",
        },
      ],
    },
    // ────────────────────────────────────────────────────────── Lesson 2
    {
      id: "structs",
      title: "Structs: Your Own Types",
      steps: [
        {
          type: "text",
          md: [
            "## Making your own types",
            "`Int`, `String`, `Double` — those are Swift's built-ins. But PawWalk thinks in *walkers*, *pets*, and *bookings*. A **struct** lets you define a type of your own: a named bundle of values.",
            "Each `let name: String` line inside a struct is a **stored property** — a piece of data that every value of the type carries. You read one with a dot: `walker.name`.",
            "You've already met the most important struct in the app. Here it is for real:",
          ],
        },
        {
          type: "code",
          title: "Models/Models.swift — Walker (trimmed)",
          source: String.raw`struct Walker: Codable, Identifiable, Hashable {
    let id: String
    let name: String
    let photoURL: String?      // Lesson 1 in the wild
    let rating: Double
    let pricePer30MinCents: Int
    let bio: String
    let neighborhoods: [String]
}`,
          caption: "`Codable, Identifiable, Hashable` are protocol conformances — Lesson 5. `[String]` is an array of strings — Lesson 4. Trimmed: the real file also has JSON mapping (Module 03) and one computed property you'll rebuild in a few minutes.",
        },
        {
          type: "text",
          md: [
            "## The free initializer",
            "To create a value of a struct, you call the struct like a function, filling in every stored property by name. Swift writes this **memberwise initializer** for you — one labeled argument per property, in declaration order. Zero code on your part.",
          ],
        },
        {
          type: "code",
          title: "Creating a Walker",
          source: String.raw`let maya = Walker(
    id: "w1",
    name: "Maya P.",
    photoURL: nil,
    rating: 4.9,
    pricePer30MinCents: 2400,
    bio: "Dogs > everything.",
    neighborhoods: ["Mission", "Castro"]
)

print(maya.name)     // Maya P.
print(maya.rating)   // 4.9`,
          caption: "Every property, by name, in order. In the finished app you'll rarely write this by hand — walkers arrive as JSON from the backend — but the shape is the same.",
        },
        {
          type: "quiz",
          q: "You add a new stored property `let city: String` to `Walker`. What happens to existing `Walker(id:…)` creation calls that don't pass a city?",
          choices: [
            "They stop compiling — the memberwise initializer now requires `city:` too",
            "They still compile; `city` defaults to an empty string",
            "They compile but crash at runtime",
            "Swift silently deletes the new property",
          ],
          answer: 0,
          explain: "The memberwise initializer always covers *every* stored property, so adding one changes the initializer — and the compiler points at every call site that needs updating. Annoying for 10 seconds, crash-proof forever.",
          nudge: "The initializer is generated *from* the property list. What happens to it when the list grows?",
        },
        {
          type: "exercise",
          title: "Your first struct",
          prompt: [
            "Define a struct called `Dog` with two stored properties: `let name: String` and `let breed: String` (in that order).",
            "Then use the free memberwise initializer to create a constant `mochi` — a Dog named `\"Mochi\"` of breed `\"Shiba Inu\"`.",
          ],
          starter: String.raw`// 1. Define the Dog struct
// 2. Create mochi
// your code here
`,
          solution: String.raw`struct Dog {
    let name: String
    let breed: String
}

let mochi = Dog(name: "Mochi", breed: "Shiba Inu")`,
          checks: [
            { re: /struct Dog\{/, hint: "Start with `struct Dog {` — the type name is capitalized by convention." },
            { re: /let name:String/, hint: "First stored property: `let name: String`." },
            { re: /let breed:String/, hint: "Second stored property: `let breed: String`." },
            { re: /let mochi(:Dog)?=Dog\(name:"Mochi",breed:"Shiba Inu"\)/, hint: "Create it like a function call with labels: `Dog(name: \"Mochi\", breed: \"Shiba Inu\")`." },
          ],
          mustNot: [
            { re: /init\(/, hint: "No `init` needed — Swift writes the memberwise initializer for you. Delete yours and just call `Dog(name:breed:)`." },
          ],
          success: "That's a custom type and a value of it — the exact pattern behind Walker, Pet, and Booking.",
        },
        {
          type: "text",
          md: [
            "## Behavior, not just data",
            "Structs can also contain functions. A function inside a type is called a **method**, and it can use the properties directly — no arguments needed.",
            "A **computed property** stores nothing: it computes a fresh value every time you read it. Write it as `var`, a name, a type, then braces holding code: `var priceLabel: String { … }`. You *read* it like data — `walker.priceLabel`, no parentheses — but it runs code. (It's always `var`, never `let`, because its result can differ between reads as the stored properties differ.)",
            "One more trick it relies on: when a function or computed property body is a **single expression**, Swift returns it automatically — no `return` keyword needed.",
          ],
        },
        {
          type: "code",
          title: "A method and a computed property",
          source: String.raw`struct Dog {
    let name: String
    let walksCompleted: Int

    func summary() -> String {
        "\(name) has been on \(walksCompleted) walks"
    }

    var greeting: String { "Who's a good dog? \(name)!" }
}

let rex = Dog(name: "Rex", walksCompleted: 12)
print(rex.summary())   // method — called with ()
print(rex.greeting)    // computed property — read without ()`,
          caption: "Rule of thumb from the PawWalk codebase: no inputs and it *describes* the value → computed property. Takes inputs or *does* something → method.",
        },
        {
          type: "exercise",
          title: "Rebuild Walker.priceLabel — the real thing",
          prompt: [
            "Walker stores its price in cents (`pricePer30MinCents` — 2400 means $24), the cents pattern from Module 01. The Walkers screen displays it as `$24 / 30 min`.",
            "Add a computed property — call it `priceLabel`, type `String` — whose single expression interpolates the dollars (`pricePer30MinCents / 100`) into the text `$… / 30 min`.",
          ],
          starter: String.raw`struct Walker {
    let pricePer30MinCents: Int
    // your code here
}`,
          solution: String.raw`struct Walker {
    let pricePer30MinCents: Int
    var priceLabel: String { "$\(pricePer30MinCents / 100) / 30 min" }
}`,
          checks: [
            { re: /var priceLabel:String\{/, hint: "Declare it `var priceLabel: String { … }` — computed properties are `var` with the code in braces." },
            { re: /\\\(pricePer30MinCents\/100\)/, hint: "Inside the string, interpolate the dollars: `\\(pricePer30MinCents / 100)` — integer division turns cents into whole dollars." },
            { re: /\/30 min"/, hint: "After the interpolation, the literal text ` / 30 min` finishes the label." },
          ],
          mustNot: [
            { re: /func priceLabel/, hint: "A computed property, not a method — use `var`, no parentheses." },
          ],
          success: "Character for character, that's line 20 of Models/Models.swift. You just wrote shipping PawWalk code.",
        },
        {
          type: "text",
          md: [
            "## Structs are values",
            "One paragraph of theory you'll feel later: structs are **value types**. Assigning one to a new constant, or passing it to a function, makes an independent **copy** — like copying a number. Change the copy and the original is untouched. There's no invisible sharing, no \"who else is holding this walker?\" — which is exactly why SwiftUI is built around structs, and why nearly every type in PawWalk is one. (Classes — *reference* types that do share — exist too; PawWalk uses them only where sharing is the point, like `APIClient`. Module 05.)",
          ],
        },
        {
          type: "quiz",
          q: "Structs are value types: `var b = a` makes a copy. If code then modifies `b`, what does `a` show?",
          choices: [
            "The same modification — a and b share one underlying dog",
            "a becomes nil",
            "Its original, unchanged data — b is an independent copy",
            "It depends on the property types inside",
          ],
          answer: 2,
          explain: "Copy means copy. `a` and `b` are as independent as two `Int`s — no spooky action at a distance. That predictability is why Swift (and this app) defaults to structs.",
          nudge: "Think of how `var y = x` behaves when x is a plain `Int`.",
        },
      ],
    },
    // ────────────────────────────────────────────────────────── Lesson 3
    {
      id: "enums",
      title: "Enums: A Fixed Set of Choices",
      steps: [
        {
          type: "text",
          md: [
            "## A fixed set of choices",
            "A PawWalk user is an *owner* or a *walker*. Not both, not `\"ownerr\"` with a typo, not some surprise third thing. When a value can only be one of a known, fixed set of choices, Swift gives you the **enum** (enumeration).",
            "You declare the choices as **cases**. A value of the type is exactly one case: `let role = UserRole.owner`. And when Swift already knows the type, you can use the beloved dot shorthand: `let role: UserRole = .owner`.",
          ],
        },
        {
          type: "code",
          title: "An enum, a value, a switch",
          source: String.raw`enum WalkLength {
    case short, standard, extended
}

let choice: WalkLength = .standard

switch choice {
case .short: print("15 minutes")
case .standard: print("30 minutes")
case .extended: print("60 minutes")
}`,
          caption: "No `default` needed: the switch covers every case, and the compiler *verifies* that it does. Add a fourth case tomorrow and this switch becomes a compile error until you handle it — a whole category of bugs caught before the app ever runs.",
        },
        {
          type: "exercise",
          title: "Declare an enum",
          prompt: [
            "Walkers filter dogs by size. Declare an enum called `DogSize` with three cases: `small`, `medium`, `large` — all on one `case` line, separated by commas.",
          ],
          starter: String.raw`// your code here
`,
          solution: String.raw`enum DogSize {
    case small, medium, large
}`,
          checks: [
            { re: /enum DogSize\{/, hint: "Start with `enum DogSize {` — enums use the same brace style as structs." },
            { re: /case small,medium,large/, hint: "One `case` keyword, then the three names separated by commas: `case small, medium, large`." },
          ],
          success: "Three choices, zero room for typos. Any other value literally cannot exist.",
        },
        {
          type: "quiz",
          q: "You add `case cancelled` to an enum but forget to update a `switch` over it (which has no `default`). What happens?",
          choices: [
            "Nothing — the switch just skips unknown cases",
            "The app crashes the first time cancelled shows up",
            "The code stops compiling until the switch handles cancelled",
            "Swift adds a default branch for you",
          ],
          answer: 2,
          explain: "Exhaustiveness is enforced at compile time. The compiler walks you to every switch that needs updating — this is why PawWalk avoids `default` in switches over its own enums.",
          nudge: "The compiler *checks* that a switch is exhaustive. What does a checker do when the check fails?",
        },
        {
          type: "text",
          md: [
            "## Raw values: the enum's spelling in JSON",
            "The backend doesn't know about Swift enums — it sends the plain string `\"owner\"` or `\"walker\"`. Give an enum a **raw value** type, declared like this: `enum UserRole: String`, and every case gets a fixed underlying value. By default, a case's raw value is simply its own name.",
            "When the case name and the wire spelling differ, assign the raw value yourself. Swift names use camelCase — `inProgress` — but the backend says `\"in_progress\"`, so: `case inProgress = \"in_progress\"`. Best of both worlds: idiomatic Swift in your code, the backend's exact spelling on the wire.",
          ],
        },
        {
          type: "code",
          title: "Models/Models.swift — UserRole & BookingStatus",
          source: String.raw`enum UserRole: String, Codable {
    case owner, walker
}

enum BookingStatus: String, Codable {
    case pending, confirmed, inProgress = "in_progress", completed, cancelled
}`,
          caption: "Verbatim from the repo. `Codable` is what lets these decode straight from the backend's JSON — deep dive in Module 03. `BookingStatus` is the lifecycle you watched in Module 00: pending → confirmed → in progress → completed.",
        },
        {
          type: "quiz",
          q: "What is the raw value of `BookingStatus.confirmed`?",
          choices: [
            "\"confirmed\" — a raw value defaults to the case's own name",
            "\"CONFIRMED\"",
            "1",
            "It has no raw value",
          ],
          answer: 0,
          explain: "Only `inProgress` needed an explicit raw value, because only its Swift name differs from the backend's `in_progress`. The other four default to their names.",
          nudge: "Look at the four cases that *don't* have an `=` — what do they fall back to?",
        },
        {
          type: "text",
          md: [
            "## Cases that carry data",
            "Now the enum feature that shapes every screen in PawWalk. A case can carry a payload — an **associated value** — packed in when the value is created and unpacked when you switch on it.",
            "Think about what the Walkers screen can be showing at any moment: it's *loading*, or it *loaded* some walkers, or it *failed* with an error message. Three states — and two of them come with data attached. `loaded` without the walkers would be useless; `failed` without a message would leave the user staring at a blank alert.",
            "When you switch, you unpack with `let` inside the case pattern: `case .loaded(let walkers):` binds whatever array was packed inside to a constant for that branch.",
            "> Raw values and associated values don't mix. Raw values are fixed at compile time; associated values are packed in at runtime. An enum has one flavor or the other (or neither).",
          ],
        },
        {
          type: "code",
          title: "Features/Walkers/WalkersViewModel.swift — ViewState",
          source: String.raw`enum ViewState {
    case loading
    case loaded([Walker])
    case failed(String)
}

// What the Walkers screen logically does with it:
let state: ViewState = .loading

switch state {
case .loading:
    print("Show a spinner")
case .loaded(let walkers):
    print("Show \(walkers.count) walkers")
case .failed(let message):
    print("Show the error: \(message)")
}`,
          caption: "The enum is verbatim repo code; the switch sketches what the screen does with it (the real SwiftUI version arrives in Module 05). `[Walker]` is an array of walkers and `.count` is its length — arrays get their own lesson next.",
        },
        {
          type: "exercise",
          title: "Rebuild ViewState",
          prompt: [
            "From memory: declare the enum `ViewState` with three cases — `loading` (no payload), `loaded` carrying a `[Walker]`, and `failed` carrying a `String`. One `case` per line, exactly like the real file.",
          ],
          starter: String.raw`// Rebuild WalkersViewModel's ViewState
// your code here
`,
          solution: String.raw`enum ViewState {
    case loading
    case loaded([Walker])
    case failed(String)
}`,
          checks: [
            { re: /enum ViewState\{/, hint: "Start with `enum ViewState {`." },
            { re: /case loading/, hint: "The first case carries no data at all — just `case loading`." },
            { re: /case loaded\(\[Walker\]\)/, hint: "`loaded` carries its payload type in parentheses: `case loaded([Walker])` — an array of walkers." },
            { re: /case failed\(String\)/, hint: "`failed` carries a message for the user: `case failed(String)`." },
          ],
          mustNot: [
            { re: /ViewState:String/, hint: "No raw-value type here — cases with associated values can't have one." },
          ],
          success: "That's the exact enum from WalkersViewModel.swift. Every screen you build in this course will have a ViewState just like it.",
        },
      ],
    },
    // ────────────────────────────────────────────────────────── Lesson 4
    {
      id: "closures-and-collections",
      title: "Arrays & Closures",
      steps: [
        {
          type: "text",
          md: [
            "## Many values, one name",
            "A walker covers several neighborhoods, an owner has several bookings, the backend returns a *list* of walkers. An **array** is an ordered list of values that all share one type. The type is written in square brackets — `[String]` is \"array of String\" — and so is a literal: `[\"Mission\", \"Castro\"]`. That's exactly what `Walker.neighborhoods` is.",
            "Arrays come with built-in properties: `.count` (how many), `.isEmpty` (is it zero?), and `.first` (the first element — as an *optional*, because the array might be empty).",
          ],
        },
        {
          type: "code",
          title: "Array basics",
          source: String.raw`let neighborhoods = ["Mission", "Castro", "Noe Valley"]

print(neighborhoods.count)               // 3
print(neighborhoods.isEmpty)             // false
print(neighborhoods.first ?? "Anywhere") // Mission`,
          caption: "`.first` is a `String?` — Lesson 1's optionals showing up exactly where promised — so `??` gives it a fallback.",
        },
        {
          type: "quiz",
          q: "`let none: [String] = []` — what is `none.first`?",
          choices: [
            "An empty string \"\"",
            "It crashes",
            "0",
            "nil — .first is an optional for exactly this case",
          ],
          answer: 3,
          explain: "An empty array has no first element, and Swift's honest answer to \"give me something that isn't there\" is always the same: an optional holding nil.",
          nudge: "What did Lesson 1 say Swift does when a value might not exist?",
        },
        {
          type: "exercise",
          title: "Make an array",
          prompt: [
            "Create a constant `dogs` holding the array `[\"Mochi\", \"Biscuit\", \"Rex\"]`, then print how many dogs there are using `.count`.",
          ],
          starter: String.raw`// your code here
`,
          solution: String.raw`let dogs = ["Mochi", "Biscuit", "Rex"]
print(dogs.count)`,
          checks: [
            { re: /let dogs(:\[String\])?=\["Mochi","Biscuit","Rex"\]/, hint: "An array literal is square brackets with comma-separated values: `[\"Mochi\", \"Biscuit\", \"Rex\"]`." },
            { re: /print\(dogs\.count\)/, hint: "`.count` after the array name gives its length — print that." },
          ],
          mustNot: [
            { re: /dogs\.count\(\)/, hint: "`count` is a property, not a method — no parentheses after it." },
          ],
          success: "Three dogs, counted. Now for the fun part: doing things to *every* element at once.",
        },
        {
          type: "text",
          md: [
            "## Closures: functions as values",
            "A **closure** is a function without a name that you can pass around like any other value. Arrays love them: \"here's my list — and here's a little function describing what to do with each item.\"",
            "The workhorse is `map`: transform every element, get a new array back. The closure goes in braces directly after the call — that's **trailing closure** syntax — and inside it, `$0` is shorthand for \"the current element.\" So `prices.map { $0 / 100 }` reads: *for each price, divide it by 100*.",
          ],
        },
        {
          type: "code",
          title: "map, filter, reduce",
          source: String.raw`let prices = [2400, 3000, 1800]                // cents, as always

let dollars = prices.map { $0 / 100 }          // [24, 30, 18]
let affordable = prices.filter { $0 <= 2500 }  // [2400, 1800]
let total = prices.reduce(0, +)                // 7200 — start at 0, keep adding`,
          caption: "`map` = transform each element. `filter` = keep the elements where the closure says true. `reduce` = boil the whole list down to one value.",
        },
        {
          type: "exercise",
          title: "Price tags with map",
          prompt: [
            "The Walkers screen needs display prices. In one line, use `map` to create a constant `labels` from `prices`, where each element becomes the string `\"$\\($0 / 100)\"` — so 2400 becomes `\"$24\"`.",
          ],
          starter: String.raw`let prices = [2400, 1900, 3100]
// your code here
`,
          solution: String.raw`let prices = [2400, 1900, 3100]
let labels = prices.map { "$\($0 / 100)" }`,
          checks: [
            { re: /let labels(:\[String\])?=prices\.map\(?\{/, hint: "Trailing closure syntax: `prices.map { … }` — the braces go right after `map`." },
            { re: /"\$\\\(\$0\/100\)"/, hint: "Inside the closure, build the string: a `$` sign, then interpolate `$0 / 100`." },
          ],
          mustNot: [
            { re: /for /, hint: "No loop needed — `map` does the looping for you. One line." },
          ],
          success: "`[\"$24\", \"$19\", \"$31\"]` — an Int array in, a String array out, one line of code.",
        },
        {
          type: "quiz",
          q: "In `prices.filter { $0 <= 2500 }`, what is `$0`?",
          choices: [
            "Each price, one at a time, as filter walks the array",
            "The first price only",
            "The count of the array",
            "A currency symbol",
          ],
          answer: 0,
          explain: "`$0` is the closure's first (and here, only) argument — filter calls the closure once per element, so `$0` takes each price in turn.",
          nudge: "The closure runs once per element. What does it get handed each time?",
        },
        {
          type: "text",
          md: [
            "## compactMap and joined",
            "`compactMap` is `map`'s nil-hating cousin: transform each element *and throw away any nils*. The everyday idiom `compactMap { $0 }` transforms nothing — it just drops the nils, turning a `[String?]` into a `[String]`.",
            "`joined(separator:)` glues an array of strings into one string, with the separator between elements.",
            "Together they power one of the app's nicest small touches: a pet's subtitle line — breed, age, weight — where *any piece might be missing*. Build an array of optional pieces, drop the nils, glue what's left. Missing pieces simply vanish; no dangling separators, no `if` pyramid.",
          ],
        },
        {
          type: "code",
          title: "Models/Models.swift — Pet.subtitle",
          source: String.raw`var subtitle: String {
    [breed.isEmpty ? nil : breed,
     ageYears.map { "\(Int($0)) yrs" },
     weightKg.map { String(format: "%.1f kg", $0) }]
        .compactMap { $0 }.joined(separator: " · ")
}`,
          caption: "Three things you haven't formally met: `condition ? a : b` is a one-line if/else; `.map` on an *optional* transforms the value only when it isn't nil; `String(format:)` does old-school number formatting. The shape to take away: build a `[String?]`, `compactMap` the nils out, `joined` the rest.",
        },
        {
          type: "exercise",
          title: "A simplified subtitle",
          prompt: [
            "A pet's pieces are already collected: breed `\"Shiba Inu\"`, no known age (`nil`), and the weight label `\"8.2 kg\"`.",
            "In one line, build a constant `subtitle`: drop the nils from `parts` with `compactMap { $0 }`, then chain `joined(separator: \" · \")`. Expected result: `Shiba Inu · 8.2 kg`.",
          ],
          starter: String.raw`let parts: [String?] = ["Shiba Inu", nil, "8.2 kg"]
// your code here
`,
          solution: String.raw`let parts: [String?] = ["Shiba Inu", nil, "8.2 kg"]
let subtitle = parts.compactMap { $0 }.joined(separator: " · ")`,
          checks: [
            { re: /let subtitle(:String)?=parts\.compactMap\(?\{\$0\}/, hint: "Start with `parts.compactMap { $0 }` — it keeps every non-nil value and drops the rest." },
            { re: /\.joined\(separator:"·"\)/, hint: "Chain `.joined(separator: \" · \")` right after the compactMap — one expression, two steps." },
          ],
          mustNot: [
            { re: /\.map\{\$0\}/, hint: "Plain `map` keeps the nils. You want its nil-dropping cousin." },
          ],
          success: "That's the engine inside Pet.subtitle. Nil-proof formatting in one line — this pattern shows up all over real iOS code.",
        },
      ],
    },
    // ────────────────────────────────────────────────────────── Lesson 5
    {
      id: "protocols-and-errors",
      title: "Protocols & Errors",
      steps: [
        {
          type: "text",
          md: [
            "## A contract for capabilities",
            "A **protocol** is a list of requirements — \"any type that conforms to me must provide these properties and methods.\" It says nothing about *how*. It's a contract, not an implementation.",
            "A type **conforms** by listing the protocol after its name (the same spot an enum puts its raw-value type) and supplying whatever the contract demands. `Identifiable` demands exactly one thing: a property called `id`. Walker has one — so Walker conforms, and anything built to work with \"identifiable things\" (like SwiftUI's lists) now works with walkers.",
            "You've been looking at three protocols since Lesson 2: `Identifiable` (has an id), `Hashable` (can be compared and used in sets and navigation), and `Codable` (can convert to and from JSON). For simple structs, Swift generates the Hashable and Codable code automatically — the Codable deep dive is the whole next module.",
          ],
        },
        {
          type: "code",
          title: "Models/Models.swift — Walker's conformances",
          source: String.raw`struct Walker: Codable, Identifiable, Hashable {
    let id: String
    let name: String
    // … the rest you rebuilt in Lesson 2
}`,
          caption: "`let id: String` is the entire price of admission for `Identifiable`. Three capabilities declared in one line — JSON, identity, hashing — and Swift writes nearly all of the code.",
        },
        {
          type: "quiz",
          q: "What does `struct Walker: Identifiable` promise the compiler?",
          choices: [
            "Walker inherits code from Identifiable",
            "Walker provides everything Identifiable requires — here, an `id` property",
            "Walker can never be changed",
            "Walker is automatically saved to a database",
          ],
          answer: 1,
          explain: "Conformance is a promise to fulfill the contract. Delete the `id` property and the promise breaks — the file stops compiling until it's back.",
          nudge: "A protocol is a contract. What does signing a contract oblige you to do?",
        },
        {
          type: "exercise",
          title: "Conform to Identifiable",
          prompt: [
            "Declare `struct Dog` conforming to `Identifiable`, with two stored properties (in this order): `let id: String` and `let name: String`.",
          ],
          starter: String.raw`// your code here
`,
          solution: String.raw`struct Dog: Identifiable {
    let id: String
    let name: String
}`,
          checks: [
            { re: /struct Dog:Identifiable\{/, hint: "The conformance goes after the type name: `struct Dog: Identifiable {`." },
            { re: /let id:String/, hint: "Identifiable's one requirement: a property called `id`. `let id: String` satisfies it." },
            { re: /let name:String/, hint: "Add the second property, `let name: String`." },
          ],
          success: "Contract signed and fulfilled. In Module 09, this exact conformance is what lets SwiftUI's `List` show a row per dog without you writing any bookkeeping.",
        },
        {
          type: "text",
          md: [
            "## When things go wrong, loudly",
            "Networks drop, servers reject, emails are already taken. Swift's error handling starts with — of course — a protocol: any type conforming to `Error` can be **thrown**.",
            "A function that can fail is marked `throws`. To call it you must write `try` — a visible flag in the source meaning \"this line can blow up.\" You handle failure with `do { } catch { }`: run the `do` block, and if any `try` inside throws, execution jumps straight to `catch`.",
            "Here's the pattern in the real app — the function that loads the walkers list, feeding the `ViewState` enum you built in Lesson 3:",
          ],
        },
        {
          type: "code",
          title: "Features/Walkers/WalkersViewModel.swift — load()",
          source: String.raw`func load() async {
    state = .loading
    do {
        let walkers = try await APIClient.shared.walkers()
        state = .loaded(walkers)
    } catch {
        state = .failed("Couldn't reach the server. Check your connection and try again.")
    }
}`,
          caption: "`async`/`await` is Module 03's big topic — for now, read `try await …` as \"ask the backend; this can fail.\" Everything else here is yours already: do/catch, and `state` flipping between the ViewState cases.",
        },
        {
          type: "quiz",
          q: "In `load()`, the backend is down and `walkers()` throws. Which line runs next?",
          choices: [
            "`state = .loaded(walkers)` with an empty array",
            "The app crashes",
            "`state = .failed(…)` inside the catch block",
            "Nothing — the error is silently ignored",
          ],
          answer: 2,
          explain: "The throw skips the rest of the `do` block and lands in `catch`, so `.loaded` never happens — the screen shows the error state instead. Failure is a *state*, not a crash.",
          nudge: "What is `catch` for?",
        },
        {
          type: "text",
          md: [
            "## Errors with a human voice",
            "Enums make perfect error types: a fixed set of things that can go wrong, some carrying data. PawWalk's is `APIError`, with two cases — `emailTaken` (signup with an email that already exists) and `serverError(String)` carrying the backend's own message. Conforming to `Error` makes it throwable.",
            "A second protocol, `LocalizedError`, makes it *speakable*: provide `var errorDescription: String?` and every alert in the app can show a proper sentence instead of raw error gibberish. Note the `String?` — the contract allows \"no message\"; ours always returns one.",
            "One new keyword: `self` means \"this very value.\" Inside the computed property, `switch self` asks *which case am I?* — and everything from this module lands in the next twelve lines: an enum, an associated value, a computed property, an optional, an exhaustive switch, and two protocols.",
          ],
        },
        {
          type: "code",
          title: "Services/APIClient.swift — APIError",
          source: String.raw`enum APIError: Error, LocalizedError {
    /// Signup with an email that's already registered (backend returns 409).
    case emailTaken
    /// Backend returned an error with a server-provided message.
    case serverError(String)

    var errorDescription: String? {
        switch self {
        case .emailTaken: return "That email is already registered. Try logging in instead."
        case .serverError(let detail): return detail
        }
    }
}`,
          caption: "Verbatim from the repo, doc comments and all. Each case spells out `return` — the explicit style the real file uses. (Modern Swift can also treat a whole `switch` like this as one big expression and drop the `return`s; both compile.)",
        },
        {
          type: "exercise",
          title: "Rebuild APIError's voice",
          prompt: [
            "The enum shell is written for you. Add the `errorDescription` computed property: type `String?`, containing a `switch self` with two cases.",
            "`.emailTaken` returns `\"That email is already registered. Try logging in instead.\"` — and `.serverError` binds its payload with `let detail` and returns it.",
          ],
          starter: String.raw`enum APIError: Error, LocalizedError {
    case emailTaken
    case serverError(String)

    // your code here
}`,
          solution: String.raw`enum APIError: Error, LocalizedError {
    case emailTaken
    case serverError(String)

    var errorDescription: String? {
        switch self {
        case .emailTaken: return "That email is already registered. Try logging in instead."
        case .serverError(let detail): return detail
        }
    }
}`,
          checks: [
            { re: /var errorDescription:String\?\{/, hint: "A computed property: `var errorDescription: String? { … }` — the type is optional String, exactly as the protocol demands." },
            { re: /switch self\{/, hint: "Ask which case this value is: `switch self { … }`." },
            { re: /case\.emailTaken:(return)?"/, hint: "`case .emailTaken:` returns the fixed message string." },
            { re: /case\.serverError\(let detail\):(return )?detail/, hint: "Unpack the payload in the pattern — `case .serverError(let detail):` — then `return detail`." },
          ],
          mustNot: [
            { re: /default:/, hint: "Two cases, two `case` lines — an exhaustive switch over your own enum needs no `default`." },
          ],
          success: "That's the real error type from Services/APIClient.swift — and you just used every idea from this module in one exercise. Next module: Codable, and how these types decode straight from the backend's JSON.",
        },
      ],
    },
  ],
});
