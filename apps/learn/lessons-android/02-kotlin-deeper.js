// Module 02 — Kotlin, one level deeper: nullability, data classes, sealed
// interfaces, collections/lambdas, interfaces & errors.
// See ../lessons/FORMAT.md and ./FORMAT-KOTLIN.md for the schema.
window.COURSE = window.COURSE || [];
window.COURSE.push({
  id: "kotlin-deeper",
  title: "Kotlin, One Level Deeper",
  emoji: "🧠",
  lang: "kotlin",
  lessons: [
    // ────────────────────────────────────────────────────────── Lesson 1
    {
      id: "nullability",
      title: "Nullability: When a Value Might Not Exist",
      steps: [
        {
          type: "text",
          md: [
            "## Sometimes there's just no value",
            "Every pet in PawWalk has a name. But its age? A rescue dog's age is often a guess the owner never entered. And not every walker uploads a profile photo. Kotlin forces you to be honest about missing data: a value that *might not be there* gets a different type.",
            "`Double` is **always** a number. `Double?` — read it as \"nullable Double\" — is *either* a number *or* `null`, Kotlin's word for \"nothing here.\" In the real models file, `Pet.ageYears` is a `Double?` and `Walker.photoUrl` is a `String?` for exactly these reasons.",
            "> The `?` is part of the type. `String` and `String?` are different types, and Kotlin will not let you use a `String?` as if the value were definitely there. That one rule eliminates the #1 crash in most other languages: using a value that doesn't exist.",
          ],
        },
        {
          type: "code",
          title: "data/Models.kt — Walker (trimmed)",
          source: String.raw`data class Walker(
    val id: String,
    val name: String,
    val photoUrl: String? = null,   // not every walker uploads one
    val rating: Double,
    val pricePer30MinCents: Int,
    val bio: String = "",
    val neighborhoods: List<String> = emptyList(),
)`,
          caption: "`data class` bundles values into a type of your own — that's the very next lesson. The real file also has `@Serializable`/`@SerialName` annotations (Module 03) and a computed property you'll rebuild soon.",
        },
        {
          type: "quiz",
          q: "`Walker.photoUrl` has type `String?`. What can it hold?",
          choices: [
            "Only a URL string",
            "Only null",
            "Either a string or null",
            "An empty string, but never null",
          ],
          answer: 2,
          explain: "That's the whole idea: `String?` is a box that contains a String *or* nothing. Some walkers uploaded a photo, some didn't — the type tells the truth.",
          nudge: "The `?` means the value is nullable — what are the two possibilities?",
        },
        {
          type: "text",
          md: [
            "## Getting the value out",
            "Kotlin won't let you use a `String?` where a `String` is needed — you have to check it first.",
            "The blunt tool is `!!`, the **not-null assertion**: `photoUrl!!` means \"I swear this isn't null.\" If you're wrong, the app **crashes on the spot** with an NPE. You'll see `!!` in the wild; in this course we treat it as a code smell and almost never use it.",
            "The safe tool is the **safe call** `?.`: reach into a nullable without crashing. `photoUrl?.isEmpty()` asks \"*if* there's a URL, is it empty?\" When `photoUrl` is null, the whole expression just evaluates to `null` instead of blowing up.",
          ],
        },
        {
          type: "code",
          title: "?. on a walker's photo",
          source: String.raw`val photoUrl: String? = null   // this walker never uploaded a photo

val length = photoUrl?.length
println(length)   // null — the safe call short-circuits instead of crashing`,
          caption: "`?.` chains: if the receiver is null, the whole expression is null and nothing after the `?.` ever runs.",
        },
        {
          type: "text",
          md: [
            "## `?:` — the Elvis operator",
            "**`?:`** (nicknamed the *Elvis operator* — tilt your head, it's a smiley) plugs the hole: \"use this value, or if it's null, use that fallback.\" `val url = photoUrl ?: \"placeholder.png\"`. The result is a plain `String`, never null, because the fallback fills the gap.",
            "`?.` and `?:` pair up constantly: `photoUrl?.length ?: 0` reads as \"the length if there's a URL, otherwise 0.\"",
          ],
        },
        {
          type: "code",
          title: "?: filling in a default",
          source: String.raw`val photoUrl: String? = null
val url = photoUrl ?: "placeholder.png"
println(url)   // placeholder.png`,
          caption: "`url` is a non-nullable `String` now — the compiler can prove it, because `?:` guarantees a value on both sides.",
        },
        {
          type: "quiz",
          q: "`val n: Int? = null`. What does `n ?: 0` evaluate to?",
          choices: ["null", "0", "An exception is thrown", "-1"],
          answer: 1,
          explain: "`?:` says \"use the left side unless it's null, then use the right side.\" `n` is null, so the whole expression becomes the fallback, `0`.",
          nudge: "Elvis operator: left side if present, right side otherwise. Which side is null here?",
        },
        {
          type: "text",
          md: [
            "## `let` — run code only when there's a value",
            "The scope function `let` runs a block *only if* the receiver isn't null, and inside the block you get a plain, non-nullable reference (conventionally named `it`). Combine it with `?.`: `photoUrl?.let { url -> ... }` means \"if there's a URL, do something with it.\"",
            "You've already seen this pattern in the wild — `Pet.ageYears?.let { \"$it yrs\" }`-style code in the real models file turns a nullable age into a display string, or nothing at all.",
          ],
        },
        {
          type: "code",
          title: "data/Models.kt — Pet.subtitle (trimmed)",
          source: String.raw`val subtitle: String get() = listOfNotNull(
    breed.ifBlank { null },
    ageYears?.let { "${"$"}{it.toInt()} yrs" },
    weightKg?.let { "%.1f kg".format(it) },
).joinToString(" · ")`,
          caption: "Three optional pieces — breed, age, weight — each becomes either a string or `null` via `?.let`. `listOfNotNull` drops the nulls, `joinToString` glues what's left. Full walkthrough later this module.",
        },
        {
          type: "exercise",
          title: "Unwrap a pet's age",
          prompt: [
            "PawWalk shows a pet's age only when it's known. Below, `maybeAge` is a `Double?` that happens to hold a value.",
            "Use `?.let` to print `Age: ` followed by the value, and `?:` so that when it's null the block instead evaluates the string `\"Age unknown\"`. One expression: `println(maybeAge?.let { \"Age: $it\" } ?: \"Age unknown\")`.",
          ],
          starter: String.raw`val maybeAge: Double? = 3.0
// your code here
`,
          solution: String.raw`val maybeAge: Double? = 3.0
println(maybeAge?.let { "Age: $it" } ?: "Age unknown")`,
          checks: [
            { re: /maybeAge\?\.let\{/, hint: "Start with `maybeAge?.let { … }` — the safe call runs the block only when there's a value." },
            { re: /"Age:\$it"/, hint: "Inside the block, build the string `\"Age: $it\"` — `it` is the unwrapped value." },
            { re: /\}\?:"Age unknown"/, hint: "After the closing brace, add `?: \"Age unknown\"` for the null case." },
          ],
          mustNot: [
            { re: /maybeAge!!/, hint: "No `!!`! It crashes when the value is null — `?.let` is the safe way." },
          ],
          success: "Unwrapped safely. Both paths are handled, and nothing can crash — that's the nullability mindset.",
        },
      ],
    },
    // ────────────────────────────────────────────────────────── Lesson 2
    {
      id: "data-classes",
      title: "Data Classes: Your Own Types",
      steps: [
        {
          type: "text",
          md: [
            "## Making your own types",
            "`Int`, `String`, `Double` — those are Kotlin's built-ins. But PawWalk thinks in *walkers*, *pets*, and *bookings*. A **data class** lets you define a type of your own: a named bundle of values, with useful behavior generated for free.",
            "Each `val name: String` inside the parentheses is a **property** — a piece of data that every value of the type carries. You read one with a dot: `walker.name`.",
            "You've already met the most important data class in the app. Here it is for real:",
          ],
        },
        {
          type: "code",
          title: "data/Models.kt — Walker",
          source: String.raw`data class Walker(
    val id: String,
    val name: String,
    val photoUrl: String? = null,
    val rating: Double,
    val pricePer30MinCents: Int,
    val bio: String = "",
    val neighborhoods: List<String> = emptyList(),
) {
    val priceLabel: String get() = "$%.0f / 30 min".format(pricePer30MinCents / 100.0)
}`,
          caption: "`List<String>` is a list of strings — this lesson's next stop. `= emptyList()` and `= null` are default values, so callers can skip them. `priceLabel` is a computed property (below).",
        },
        {
          type: "text",
          md: [
            "## What `data` gives you for free",
            "Marking a class `data` tells the compiler to generate several things from the properties in its constructor, with zero code from you: a readable `toString()`, structural `equals()` (two Walkers with the same properties are equal — no `===` reference-comparison surprises), a matching `hashCode()`, and **`copy()`** — build a near-identical value with just the fields you want changed.",
          ],
        },
        {
          type: "code",
          title: "Creating and copying a Walker",
          source: String.raw`val maya = Walker(
    id = "w1",
    name = "Maya P.",
    rating = 4.9,
    pricePer30MinCents = 2400,
    bio = "Dogs > everything.",
    neighborhoods = listOf("Mission", "Castro"),
)

println(maya.name)     // Maya P.
println(maya.priceLabel)  // $24 / 30 min

val raise = maya.copy(pricePer30MinCents = 2600)   // everything else unchanged
println(raise.pricePer30MinCents)   // 2600
println(maya.pricePer30MinCents)    // 2400 — the original is untouched`,
          caption: "Named arguments (`id = \"w1\"`) make constructor calls self-documenting and order-independent. `copy()` never mutates the original — it returns a new value.",
        },
        {
          type: "quiz",
          q: "`val b = a.copy(rating = 5.0)` where `a` is a Walker. What happens to `a.rating`?",
          choices: [
            "It also becomes 5.0 — a and b share state",
            "It stays whatever it was — copy() returns an independent new value",
            "It becomes null",
            "The code fails to compile",
          ],
          answer: 1,
          explain: "`copy()` builds a brand-new value with the listed properties changed and everything else carried over — the original is never touched. That's why it's safe to use everywhere.",
          nudge: "The clue is in the name: copy. What does copying leave behind?",
        },
        {
          type: "exercise",
          title: "Your first data class",
          prompt: [
            "Define a data class called `Dog` with two properties, in this order: `val name: String` and `val breed: String`.",
            "Then create a constant `mochi` — a Dog named `\"Mochi\"` of breed `\"Shiba Inu\"`, using named arguments.",
          ],
          starter: String.raw`// 1. Define the Dog data class
// 2. Create mochi
// your code here
`,
          solution: String.raw`data class Dog(
    val name: String,
    val breed: String,
)

val mochi = Dog(name = "Mochi", breed = "Shiba Inu")`,
          checks: [
            { re: /data class Dog\(/, hint: "Start with `data class Dog(` — properties go inside the parentheses." },
            { re: /val name:String/, hint: "First property: `val name: String`." },
            { re: /val breed:String/, hint: "Second property: `val breed: String`." },
            { re: /val mochi(:Dog)?=Dog\(name="Mochi",breed="Shiba Inu"\)/, hint: "Create it with named arguments: `Dog(name = \"Mochi\", breed = \"Shiba Inu\")`." },
          ],
          success: "That's a custom type and a value of it — the exact pattern behind Walker, Pet, and Booking.",
        },
        {
          type: "text",
          md: [
            "## Computed properties",
            "A **computed property** stores nothing: it computes a fresh value every time you read it. Write it with `get()` after the type: `val priceLabel: String get() = ...`. You *read* it like data — `walker.priceLabel`, no parentheses — but it runs code behind the scenes.",
            "Walker stores its price in cents (`pricePer30MinCents` — 2400 means $24), the cents pattern from Module 01. `priceLabel` formats that into `$24 / 30 min` for display, using `.format(...)` — Kotlin's number-formatting helper, borrowed from Java's `String.format`.",
          ],
        },
        {
          type: "exercise",
          title: "Rebuild Walker.priceLabel — the real thing",
          prompt: [
            "The Walkers screen displays a walker's price as `$24 / 30 min`.",
            "Add a computed property — call it `priceLabel`, type `String` — using `get() =` whose expression formats `pricePer30MinCents / 100.0` into the text `$… / 30 min`, matching the real file exactly: `\"$%.0f / 30 min\".format(pricePer30MinCents / 100.0)`.",
          ],
          starter: String.raw`class Walker(
    val pricePer30MinCents: Int,
) {
    // your code here
}`,
          solution: String.raw`class Walker(
    val pricePer30MinCents: Int,
) {
    val priceLabel: String get() = "$%.0f / 30 min".format(pricePer30MinCents / 100.0)
}`,
          checks: [
            { re: /val priceLabel:String get\(\)="\$%\.0f\/30 min"\.format\(/, hint: "Declare it `val priceLabel: String get() = \"$%.0f / 30 min\".format(…)` — a computed property, formatted string." },
            { re: /format\(pricePer30MinCents\/100\.0\)/, hint: "Pass `pricePer30MinCents / 100.0` to `.format(...)` — dividing by a `Double` (100.0) keeps the fractional dollars before `%.0f` rounds them." },
          ],
          mustNot: [
            { re: /fun priceLabel/, hint: "A computed property, not a function — use `val … get() = `, no parentheses when reading it." },
          ],
          success: "Character for character, that's the real line from Models.kt. You just wrote shipping PawWalk code.",
        },
      ],
    },
    // ────────────────────────────────────────────────────────── Lesson 3
    {
      id: "enums-and-sealed",
      title: "Enums & Sealed Interfaces: A Fixed Set of Choices",
      steps: [
        {
          type: "text",
          md: [
            "## A fixed set of choices",
            "A PawWalk user is an *owner* or a *walker*. Not both, not `\"ownerr\"` with a typo, not some surprise third thing. When a value can only be one of a known, fixed set of choices, Kotlin gives you the **enum class**.",
            "You declare the choices as **entries**. A value of the type is exactly one entry: `val status = BookingStatus.PENDING`.",
          ],
        },
        {
          type: "code",
          title: "An enum, a value, a when",
          source: String.raw`enum class WalkLength { SHORT, STANDARD, EXTENDED }

val choice = WalkLength.STANDARD

when (choice) {
    WalkLength.SHORT -> println("15 minutes")
    WalkLength.STANDARD -> println("30 minutes")
    WalkLength.EXTENDED -> println("60 minutes")
}`,
          caption: "`when` is Kotlin's `switch`. No `else` needed here: the compiler can see the `when` covers every entry of the enum, and *verifies* that it does. Add a fourth entry tomorrow and this `when` becomes a compile error until you handle it.",
        },
        {
          type: "quiz",
          q: "You add `EXPRESS` to an exhaustive `when` over an enum (no `else` branch). What happens?",
          choices: [
            "Nothing — the when just skips unknown entries",
            "The app crashes the first time EXPRESS shows up",
            "The code stops compiling until the when handles EXPRESS",
            "Kotlin adds a branch for you",
          ],
          answer: 2,
          explain: "Exhaustiveness is enforced at compile time for `when` used as a statement or expression over a sealed type. The compiler walks you to every `when` that needs updating.",
          nudge: "The compiler *checks* that a when is exhaustive. What does a checker do when the check fails?",
        },
        {
          type: "text",
          md: [
            "## Sealed interfaces: choices that carry different data",
            "Now the feature that shapes every screen in PawWalk. `PawWalk`'s real `BookingStatus` is plain strings straight off the wire (you'll type it in Module 3). But the Walkers *screen state* needs something richer: it's *loading*, or it *loaded* some walkers, or it *failed* with an error message. Three shapes, and two of them carry different data.",
            "A **sealed interface** declares a closed family of types: every implementation must live in the same file (or module), so the compiler knows the *complete* list — just like an enum's entries, except each case can be its own type with its own payload. `data object` is for a case with no data (a lightweight singleton); `data class` is for a case that carries something.",
          ],
        },
        {
          type: "code",
          title: "ui/screens/WalkersViewModel.kt — UiState",
          source: String.raw`class WalkersViewModel : ViewModel() {

    sealed interface UiState {
        data object Loading : UiState
        data class Success(val walkers: List<Walker>) : UiState
        data class Error(val message: String) : UiState
    }

    private val _state = MutableStateFlow<UiState>(UiState.Loading)
    val state: StateFlow<UiState> = _state.asStateFlow()
}`,
          caption: "Verbatim from the repo (trimmed to the sealed interface — `load()` and the StateFlow plumbing are Module 5's topic). `MutableStateFlow`/`StateFlow` are how the ViewModel publishes state; ignore them for now and focus on the three UiState shapes.",
        },
        {
          type: "code",
          title: "Switching on UiState",
          source: String.raw`fun describe(state: WalkersViewModel.UiState): String = when (state) {
    is WalkersViewModel.UiState.Loading -> "Show a spinner"
    is WalkersViewModel.UiState.Success -> "Show ${"$"}{state.walkers.size} walkers"
    is WalkersViewModel.UiState.Error -> "Show the error: ${"$"}{state.message}"
}`,
          caption: "`is X ->` checks which implementation `state` actually is, and — because `Success` and `Error` are data classes — Kotlin *smart-casts* inside each branch, so `state.walkers` and `state.message` are already the right type with no unwrapping step.",
        },
        {
          type: "quiz",
          q: "Why must every implementation of a sealed interface live in the same file (or module)?",
          choices: [
            "It's just a style convention with no compiler effect",
            "So the compiler can see the complete list of possibilities and check `when` is exhaustive",
            "To make the file shorter",
            "Sealed interfaces don't have this restriction",
          ],
          answer: 1,
          explain: "That restriction is the whole point: it lets the compiler prove a `when` over the sealed type covers every possibility, the same guarantee an enum gives you — but with each case free to carry its own data.",
          nudge: "Think about what an exhaustive `when` needs to know in advance.",
        },
        {
          type: "exercise",
          title: "Rebuild UiState",
          prompt: [
            "From memory: declare `sealed interface UiState` with three members — `data object Loading` (no payload), `data class Success` carrying `val walkers: List<Walker>`, and `data class Error` carrying `val message: String`. Each implements `UiState`, exactly like the real file.",
          ],
          starter: String.raw`// Rebuild WalkersViewModel's UiState
// your code here
`,
          solution: String.raw`sealed interface UiState {
    data object Loading : UiState
    data class Success(val walkers: List<Walker>) : UiState
    data class Error(val message: String) : UiState
}`,
          checks: [
            { re: /sealed interface UiState\{/, hint: "Start with `sealed interface UiState {`." },
            { re: /data object Loading:UiState/, hint: "The no-payload case is `data object Loading : UiState`." },
            { re: /data class Success\(val walkers:List<Walker>\):UiState/, hint: "`Success` carries its payload in its constructor: `data class Success(val walkers: List<Walker>) : UiState`." },
            { re: /data class Error\(val message:String\):UiState/, hint: "`Error` carries a message: `data class Error(val message: String) : UiState`." },
          ],
          success: "That's the exact sealed interface from WalkersViewModel.kt. Every screen you build in this course will have a UiState just like it.",
        },
      ],
    },
    // ────────────────────────────────────────────────────────── Lesson 4
    {
      id: "collections-and-lambdas",
      title: "Collections & Lambdas",
      steps: [
        {
          type: "text",
          md: [
            "## Many values, one name",
            "A walker covers several neighborhoods, an owner has several bookings, the backend returns a *list* of walkers. A **List** is an ordered collection of values that all share one type. The type is written in angle brackets — `List<String>` is \"list of String\" — and a literal is built with `listOf(...)`. That's exactly what `Walker.neighborhoods` is.",
            "Lists come with built-in properties and functions: `.size` (how many), `.isEmpty()` (is it zero?), and `.firstOrNull()` (the first element — as a *nullable*, because the list might be empty).",
          ],
        },
        {
          type: "code",
          title: "List basics",
          source: String.raw`val neighborhoods = listOf("Mission", "Castro", "Noe Valley")

println(neighborhoods.size)                      // 3
println(neighborhoods.isEmpty())                 // false
println(neighborhoods.firstOrNull() ?: "Anywhere")  // Mission`,
          caption: "`.firstOrNull()` returns `String?` — Lesson 1's nullability showing up exactly where promised — so `?:` gives it a fallback.",
        },
        {
          type: "quiz",
          q: "`val none = listOf<String>()` — what is `none.firstOrNull()`?",
          choices: [
            "An empty string \"\"",
            "It throws an exception",
            "0",
            "null — firstOrNull() is nullable for exactly this case",
          ],
          answer: 3,
          explain: "An empty list has no first element, and Kotlin's honest answer to \"give me something that isn't there\" is always the same: a nullable holding null.",
          nudge: "What did Lesson 1 say Kotlin does when a value might not exist?",
        },
        {
          type: "exercise",
          title: "Make a list",
          prompt: [
            "Create a constant `dogs` holding the list `listOf(\"Mochi\", \"Biscuit\", \"Rex\")`, then print how many dogs there are using `.size`.",
          ],
          starter: String.raw`// your code here
`,
          solution: String.raw`val dogs = listOf("Mochi", "Biscuit", "Rex")
println(dogs.size)`,
          checks: [
            { re: /val dogs(:List<String>)?=listOf\("Mochi","Biscuit","Rex"\)/, hint: "`listOf(...)` builds a list from comma-separated values: `listOf(\"Mochi\", \"Biscuit\", \"Rex\")`." },
            { re: /println\(dogs\.size\)/, hint: "`.size` gives the list's length — print that." },
          ],
          mustNot: [
            { re: /dogs\.size\(\)/, hint: "`size` is a property, not a function — no parentheses after it." },
          ],
          success: "Three dogs, counted. Now for the fun part: doing things to *every* element at once.",
        },
        {
          type: "text",
          md: [
            "## Lambdas: functions as values",
            "A **lambda** is a function without a name that you can pass around like any other value. Lists love them: \"here's my list — and here's a little function describing what to do with each item.\"",
            "The workhorse is `map`: transform every element, get a new list back. When a lambda is the *last* argument to a call, Kotlin lets you move it outside the parentheses — **trailing lambda** syntax — and when it takes one argument, `it` is shorthand for \"the current element.\" So `prices.map { it / 100 }` reads: *for each price, divide it by 100*.",
          ],
        },
        {
          type: "code",
          title: "map, filter, sumOf",
          source: String.raw`val prices = listOf(2400, 3000, 1800)                  // cents, as always

val dollars = prices.map { it / 100 }                  // [24, 30, 18]
val affordable = prices.filter { it <= 2500 }          // [2400, 1800]
val total = prices.sumOf { it }                        // 7200`,
          caption: "`map` = transform each element. `filter` = keep the elements where the lambda says true. `sumOf` = add up a numeric value derived from each element.",
        },
        {
          type: "exercise",
          title: "Price tags with map",
          prompt: [
            "The Walkers screen needs display prices. Use `map` to create a constant `labels` from `prices`: inside the lambda, first pull the whole-dollar amount into a `val dollars = it / 100`, then build the string `\"$dollars\"` — so 2400 becomes `\"$24\"`. This is the safe `$name` template form: a `val` first, then interpolate its plain name (no braces, no expression inside the string).",
          ],
          starter: String.raw`val prices = listOf(2400, 1900, 3100)
// your code here
`,
          solution: String.raw`val prices = listOf(2400, 1900, 3100)
val labels = prices.map {
    val dollars = it / 100
    "$dollars"
}`,
          checks: [
            { re: /val labels(:List<String>)?=prices\.map\{/, hint: "Trailing lambda syntax: `prices.map { … }` — the braces go right after `map`, no parentheses needed." },
            { re: /val dollars=it\/100/, hint: "Inside the lambda, extract a `val dollars = it / 100` first." },
            { re: /"\$dollars"/, hint: "Then build the string `\"$dollars\"` — the simple `$name` template form, no braces needed." },
          ],
          mustNot: [
            { re: /for ?\(/, hint: "No loop needed — `map` does the looping for you." },
          ],
          success: "[\"$24\", \"$19\", \"$31\"] — an Int list in, a String list out, using the safe `$name` interpolation form.",
        },
        {
          type: "quiz",
          q: "In `prices.filter { it <= 2500 }`, what is `it`?",
          choices: [
            "Each price, one at a time, as filter walks the list",
            "The first price only",
            "The size of the list",
            "A currency symbol",
          ],
          answer: 0,
          explain: "`it` is the lambda's single implicit argument — filter calls the lambda once per element, so `it` takes each price in turn.",
          nudge: "The lambda runs once per element. What does it get handed each time?",
        },
        {
          type: "text",
          md: [
            "## listOfNotNull and joinToString",
            "`listOfNotNull` is `listOf`'s null-hating cousin: build a list from the arguments you pass it, silently dropping any that are `null`. Pair it with `?.let` (Lesson 1) and you get a list built entirely from *maybe-there* pieces, with the gaps already gone.",
            "`joinToString(separator = ...)` glues a list of strings into one string, with the separator between elements.",
            "Together they power one of the app's nicest small touches: a pet's subtitle line — breed, age, weight — where *any piece might be missing*. Build a list of nullable pieces, drop the nulls, glue what's left. Missing pieces simply vanish; no dangling separators, no `if` pyramid.",
          ],
        },
        {
          type: "code",
          title: "data/Models.kt — Pet.subtitle",
          source: String.raw`val subtitle: String get() = listOfNotNull(
    breed.ifBlank { null },
    ageYears?.let { "${"$"}{it.toInt()} yrs" },
    weightKg?.let { "%.1f kg".format(it) },
).joinToString(" · ")`,
          caption: "Verbatim from the repo. `breed.ifBlank { null }` turns an empty breed string into `null` so it's dropped too. The shape to take away: build a `List<String?>` with `listOfNotNull`, then `joinToString` the survivors.",
        },
        {
          type: "exercise",
          title: "A simplified subtitle",
          prompt: [
            "A pet's pieces are already collected: breed `\"Shiba Inu\"`, no known age (`null`), and the weight label `\"8.2 kg\"`.",
            "In one line, build a constant `subtitle`: use `listOfNotNull(...)` to drop the null, then chain `.joinToString(\" · \")`. Expected result: `Shiba Inu · 8.2 kg`.",
          ],
          starter: String.raw`val breed = "Shiba Inu"
val age: String? = null
val weight = "8.2 kg"
// your code here
`,
          solution: String.raw`val breed = "Shiba Inu"
val age: String? = null
val weight = "8.2 kg"
val subtitle = listOfNotNull(breed, age, weight).joinToString(" · ")`,
          checks: [
            { re: /listOfNotNull\(breed,age,weight\)/, hint: "Start with `listOfNotNull(breed, age, weight)` — it keeps every non-null value and drops the rest." },
            { re: /\.joinToString\("·"\)/, hint: "Chain `.joinToString(\" · \")` right after listOfNotNull — one expression, two steps." },
          ],
          mustNot: [
            { re: /listOf\(breed,age,weight\)/, hint: "Plain `listOf` keeps the null. You want its null-dropping cousin, `listOfNotNull`." },
          ],
          success: "That's the engine inside Pet.subtitle. Null-proof formatting in one line — this pattern shows up all over real Android code.",
        },
      ],
    },
    // ────────────────────────────────────────────────────────── Lesson 5
    {
      id: "interfaces-and-errors",
      title: "Interfaces & Errors",
      steps: [
        {
          type: "text",
          md: [
            "## A contract for capabilities",
            "An **interface** is a list of requirements — \"any type that implements me must provide these properties and functions.\" It says nothing about *how*. It's a contract, not an implementation.",
            "A type **implements** an interface by listing it after a colon (the same spot a class lists its superclass) and supplying whatever the contract demands. PawWalk's repositories are plain Kotlin `object`s (singletons) rather than interface implementations for now — but the pattern matters everywhere in Android: ViewModels expose `StateFlow`, screens expose `Composable` — all built on \"promise to provide X, and callers can rely on it.\"",
            "The simplest real example in the app: `WalkerRepository` promises `fetchWalkers()`, `myProfile()`, and `updateProfile()` — the ViewModel above never needs to know *how* those hit the network, only that they exist.",
          ],
        },
        {
          type: "code",
          title: "data/WalkerRepository.kt",
          source: String.raw`object WalkerRepository {
    private val api: PawWalkApi get() = Network.api

    suspend fun fetchWalkers(): List<Walker> = api.getWalkers()

    suspend fun myProfile(): Walker = api.walkerProfile()

    suspend fun updateProfile(update: WalkerProfileUpdate): Walker = api.updateWalkerProfile(update)
}`,
          caption: "`object` declares a singleton — one shared instance, no constructor call needed. `suspend fun` is a function that can pause without blocking a thread (Module 3's topic). The ViewModel from Lesson 3 calls `WalkerRepository.fetchWalkers()` and trusts the contract.",
        },
        {
          type: "quiz",
          q: "What does `object WalkerRepository` give you that `class WalkerRepository` wouldn't, without extra code?",
          choices: [
            "Nothing — they behave identically",
            "A single shared instance, reachable as `WalkerRepository.fetchWalkers()` with no `WalkerRepository()` construction",
            "Automatic network retries",
            "The ability to have multiple instances",
          ],
          answer: 1,
          explain: "`object` is Kotlin's built-in singleton: the compiler creates exactly one instance and you refer to it by name. No manual singleton boilerplate, unlike older Java patterns.",
          nudge: "Look at how the ViewModel calls it — is there ever a `WalkerRepository(...)` constructor call?",
        },
        {
          type: "text",
          md: [
            "## When things go wrong, loudly",
            "Networks drop, servers reject, emails are already taken. Kotlin's error handling uses ordinary exceptions: any `Throwable` (usually an `Exception`) can be **thrown** with `throw`.",
            "You handle failure with `try { } catch (e: Exception) { }`: run the `try` block, and if anything inside throws, execution jumps straight to `catch`. Unlike some languages, Kotlin doesn't require you to mark a function as \"can throw\" — any function can throw at any time, so a `try/catch` at the boundary (here, the ViewModel) is what keeps failures from crashing the app.",
            "Here's the pattern in the real app — the function that loads the walkers list, feeding the `UiState` sealed interface you built in Lesson 3:",
          ],
        },
        {
          type: "code",
          title: "ui/screens/WalkersViewModel.kt — load()",
          source: String.raw`fun load() {
    viewModelScope.launch {
        _state.value = UiState.Loading
        _state.value = try {
            UiState.Success(WalkerRepository.fetchWalkers())
        } catch (e: Exception) {
            UiState.Error(e.message ?: "Something went wrong")
        }
    }
}`,
          caption: "`viewModelScope.launch { }` is Module 3's big topic — for now, read it as \"run this in the background.\" Everything else here is yours already: try/catch, and `_state.value` flipping between the UiState cases.",
        },
        {
          type: "quiz",
          q: "In `load()`, the backend is down and `fetchWalkers()` throws. Which line runs next?",
          choices: [
            "`UiState.Success` with an empty list",
            "The app crashes",
            "`UiState.Error(...)` inside the catch block",
            "Nothing — the exception is silently ignored",
          ],
          answer: 2,
          explain: "The throw skips the rest of the `try` block and lands in `catch`, so `Success` never happens — the screen shows the error state instead. Failure is a *state*, not a crash.",
          nudge: "What is `catch` for?",
        },
        {
          type: "text",
          md: [
            "## try as an expression",
            "One Kotlin idiom worth calling out: `try/catch` isn't just a statement, it's an **expression** — it produces a value, just like `if`. That's how `load()` assigns `_state.value = try { ... } catch (e: Exception) { ... }` directly: whichever branch runs, its last expression becomes the value assigned.",
            "This is the same \"everything is an expression\" spirit as `if`/`else` and `when` in Kotlin — one reason Kotlin code tends to have fewer temporary `var`s than you'd expect.",
          ],
        },
        {
          type: "exercise",
          title: "Rebuild load()'s error handling",
          prompt: [
            "The function shell and the happy path are written for you.",
            "Wrap the call in `try { … } catch (e: Exception) { … }` as an expression assigned to `result`: on success, wrap the list in `UiState.Success(...)`; on failure, produce `UiState.Error(e.message ?: \"Something went wrong\")`.",
          ],
          starter: String.raw`val result = // your code here
    WalkerRepository.fetchWalkers()
`,
          solution: String.raw`val result = try {
    UiState.Success(WalkerRepository.fetchWalkers())
} catch (e: Exception) {
    UiState.Error(e.message ?: "Something went wrong")
}`,
          checks: [
            { re: /val result=try\{/, hint: "Assign directly from the try expression: `val result = try { … }`." },
            { re: /UiState\.Success\(WalkerRepository\.fetchWalkers\(\)\)/, hint: "The success branch wraps the fetched list: `UiState.Success(WalkerRepository.fetchWalkers())`." },
            { re: /catch\(e:Exception\)\{UiState\.Error\(e\.message\?:"Something went wrong"\)\}/, hint: "The catch branch: `catch (e: Exception) { UiState.Error(e.message ?: \"Something went wrong\") }`." },
          ],
          success: "That's the real error handling from WalkersViewModel.kt — and you just used every idea from this module in one exercise. Next module: serialization and coroutines, and how these types decode straight from the backend's JSON.",
        },
      ],
    },
  ],
});
