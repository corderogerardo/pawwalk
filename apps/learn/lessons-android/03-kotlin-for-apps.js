// Module 03 — Kotlin for Real Apps: Serialization & Coroutines (Android track).
// See ../lessons/FORMAT.md and ./FORMAT-KOTLIN.md for the schema and Kotlin-specific traps.
window.COURSE = window.COURSE || [];
window.COURSE.push({
  id: "kotlin-for-apps",
  title: "Kotlin for Real Apps: Serialization & Coroutines",
  emoji: "📦",
  lang: "kotlin",
  lessons: [
    {
      id: "json-and-serializable",
      title: "JSON & @Serializable",
      steps: [
        {
          type: "text",
          md: [
            "## The language your app and backend share",
            "PawWalk's Android app and its Python backend are two separate programs. They agree on exactly one thing: the shape of the **JSON** they send each other.",
            "JSON (*JavaScript Object Notation*) is plain text for structured data. An object is `{ }` with `\"key\": value` pairs inside; values can be strings, numbers, `true`/`false`, `null`, arrays `[ ]`, or nested objects. That's the whole format.",
            "Here's a real walker, exactly as the backend sends it when the app asks for the walkers list:",
          ],
        },
        {
          type: "code",
          title: "docs/API-CONTRACT.md — one Walker, as GET /walkers sends it",
          source: String.raw`{
  "id": "wlk_123",
  "name": "Sam Rivera",
  "photo_url": "https://…",
  "rating": 4.9,
  "price_per_30min_cents": 1800,
  "bio": "10 yrs with dogs. Loves huskies.",
  "neighborhoods": ["Mission", "SoMa"]
}`,
          caption: "Every field the Walkers screen shows is right here — the app's job is to turn this text into a Kotlin value it can work with.",
        },
        {
          type: "quiz",
          q: "In the JSON above, `price_per_30min_cents` is 1800. Which Kotlin type should hold it?",
          choices: [
            "Double — money has decimals",
            "Int — the contract says money is always whole cents",
            "String — everything in JSON is text",
            "Boolean",
          ],
          answer: 1,
          explain: "PawWalk's API contract is strict: money is always integer cents, never floats — 1800 cents is $18.00. The client formats it for display (that's what `priceLabel` is for).",
          nudge: "Check the field name again — what unit is the price already in?",
        },
        {
          type: "text",
          md: [
            "## kotlinx.serialization: the bridge",
            "`@Serializable` is an annotation — you stick it on a `data class` and a compiler plugin **writes the JSON conversion code for you**. Both directions: JSON → Kotlin is *deserializing*, Kotlin → JSON is *serializing*.",
            "Two new pieces make decoding work:",
            "- **`Json`** — the object that does the converting. You call `Json.decodeFromString<T>(text)`, where `T` is the type you want back.\n- **The type parameter (`<Walker>` or `<List<Walker>>`)** — this is how you tell `decodeFromString` *what shape* to expect. Kotlin's generics let one function work for any `@Serializable` type.",
            "Unlike Swift's `try`, a bad decode in Kotlin throws an ordinary exception (`SerializationException`) — you'll catch those with `try`/`catch` later this module. For now, assume the JSON is well-formed and focus on the shape.",
          ],
        },
        {
          type: "code",
          title: "Decoding the walkers list",
          source: String.raw`import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

@Serializable
data class Walker(
    val id: String,
    val name: String,
    val rating: Double,
    val bio: String,
    val neighborhoods: List<String>,
)

// json: String — the GET /walkers response body, arrived from the network as
// raw text: a JSON array [ {…}, {…} ] of walkers like the one above
val walkers = Json.decodeFromString<List<Walker>>(json)
println(walkers[0].name)   // "Sam Rivera"`,
          caption: "A first cut of Walker — only the fields whose names already match the JSON exactly. photoUrl and pricePer30MinCents need a trick you'll learn next lesson.",
        },
        {
          type: "quiz",
          q: "Why does `Walker` need the `@Serializable` annotation at all?",
          choices: [
            "It doesn't — any data class can be decoded",
            "It tells the kotlinx.serialization compiler plugin to generate the JSON conversion code for this class",
            "It makes the class faster",
            "It's required for every Kotlin class, not just data classes",
          ],
          answer: 1,
          explain: "Without `@Serializable`, `Json.decodeFromString` has no generated code to call — the annotation is what triggers the compiler plugin to write the (de)serializer for that exact class shape.",
          nudge: "Think about what's different between a plain `data class` and one Json.decodeFromString actually works on.",
        },
        {
          type: "exercise",
          title: "Decode the health check",
          prompt: [
            "The backend's simplest endpoint is `GET /health`, which returns: `{ \"status\": \"ok\", \"version\": \"0.1.0\" }`.",
            "1. Define a `data class Health` marked `@Serializable`, with two `String` properties: `status` and `version` (in that order).\n2. Then decode it: a `val` named `health`, using `Json.decodeFromString<Health>(...)`. The text is already in a `val` called `json`.",
          ],
          starter: String.raw`// json: String already holds { "status": "ok", "version": "0.1.0" }

// 1. define Health
// your code here

// 2. decode into a val named health
// your code here`,
          solution: String.raw`@Serializable
data class Health(
    val status: String,
    val version: String,
)
val health = Json.decodeFromString<Health>(json)`,
          checks: [
            { re: /@Serializable data class Health\(/, hint: "Mark it `@Serializable` on the line above `data class Health(` — that's what unlocks decoding." },
            { re: /val status:String,val version:String,/, hint: "Give the data class two `String` properties — `status` first, then `version`, each as `val`." },
            { re: /val health=Json\.decodeFromString<Health>\(json\)/, hint: "Pass the type as a generic parameter — `Json.decodeFromString<Health>(json)` — no `.self`, that's a Swift thing." },
          ],
          mustNot: [
            { re: /decodeFromString<List<Health>>/, hint: "This JSON is a single object `{…}`, not an array — decode `<Health>`, not `<List<Health>>`." },
          ],
          success: "You just did what PawWalk does with every response from the backend: text in, typed Kotlin value out.",
        },
      ],
    },
    {
      id: "serialname",
      title: "@SerialName: snake_case → camelCase",
      steps: [
        {
          type: "text",
          md: [
            "## Two naming worlds collide",
            "The backend is Python, and Python names things in **snake_case**: `photo_url`, `price_per_30min_cents`. Kotlin names things in **camelCase**: `photoUrl`, `pricePer30MinCents`. Neither side should bend — each should look idiomatic in its own language.",
            "But by default, kotlinx.serialization matches property names to JSON keys **character for character**. So `val photoUrl: String?` goes looking for a JSON key literally called `photoUrl` — which isn't there. Because it's nullable, decoding doesn't even fail: `photoUrl` just comes back `null`, *silently*, and every walker photo in the app is blank. `val pricePer30MinCents: Int` is worse-but-honest: it's not nullable and has no default, so decoding **throws**.",
            "## The fix: @SerialName",
            "You annotate the property itself — no separate enum needed, unlike Swift's `CodingKeys`. `@SerialName(\"photo_url\") val photoUrl: String? = null` tells the plugin: read the JSON key `photo_url`, store it in the Kotlin property `photoUrl`. Properties whose name already matches the JSON key (`id`, `name`, `rating`) need no annotation at all.",
          ],
        },
        {
          type: "code",
          title: "data/Models.kt",
          source: String.raw`@Serializable
data class Walker(
    val id: String,
    val name: String,
    @SerialName("photo_url") val photoUrl: String? = null,
    val rating: Double,
    @SerialName("price_per_30min_cents") val pricePer30MinCents: Int,
    val bio: String = "",
    val neighborhoods: List<String> = emptyList(),
) {
    val priceLabel: String get() = "$%.0f / 30 min".format(pricePer30MinCents / 100.0)
}`,
          caption: "The real, shipping Walker. `priceLabel` is a computed property like the ones you wrote in Module 02 — and the default values (`= null`, `= \"\"`, `= emptyList()`) mean a missing key doesn't throw, it just falls back.",
        },
        {
          type: "quiz",
          q: "In `@SerialName(\"photo_url\") val photoUrl: String? = null`, what does the string inside the annotation name?",
          choices: [
            "The Kotlin property",
            "The exact JSON key the backend sends",
            "A default value used when the key is missing",
            "The type of the field",
          ],
          answer: 1,
          explain: "The annotation's argument is the backend's JSON key, verbatim. The property name after `val` is the idiomatic Kotlin name. The decoder reads `photo_url` from the JSON and stores it in `photoUrl`.",
          nudge: "One name belongs to Kotlin, the other belongs to the wire. Which one is inside the parentheses?",
        },
        {
          type: "quiz",
          q: "You add `val bio: String` to Walker (no default value, no @SerialName) and the backend's JSON omits `bio` entirely for one walker. What happens?",
          choices: [
            "It decodes fine — `bio` is just an empty string",
            "Decoding throws — a non-nullable property with no default and a missing key is an error",
            "The property is silently set to the string \"null\"",
            "kotlinx.serialization automatically adds a default of \"\"",
          ],
          answer: 1,
          explain: "Unlike a nullable property (which silently becomes `null` when a key is missing), a non-optional property with no default value has nowhere to get a value from — decoding throws a `MissingFieldException`. That's why the real `Walker` gives `bio` a default of `\"\"`.",
          nudge: "Compare this to `photoUrl: String?` — that one has an escape hatch. Does plain `String` have the same one?",
        },
        {
          type: "exercise",
          title: "Write Walker's @SerialName annotations",
          prompt: [
            "Starting from the plain property list below, add the two `@SerialName` annotations `Walker` actually ships with — one for the photo field, one for the price field. Leave every other property alone.",
          ],
          starter: String.raw`@Serializable
data class Walker(
    val id: String,
    val name: String,
    val photoUrl: String? = null,
    val rating: Double,
    val pricePer30MinCents: Int,
    val bio: String = "",
    val neighborhoods: List<String> = emptyList(),
)`,
          solution: String.raw`@Serializable
data class Walker(
    val id: String,
    val name: String,
    @SerialName("photo_url") val photoUrl: String? = null,
    val rating: Double,
    @SerialName("price_per_30min_cents") val pricePer30MinCents: Int,
    val bio: String = "",
    val neighborhoods: List<String> = emptyList(),
)`,
          checks: [
            { re: /@SerialName\("photo_url"\)val photoUrl:String\?=null,/, hint: "Put `@SerialName(\"photo_url\")` directly before `val photoUrl: String? = null`." },
            { re: /@SerialName\("price_per_30min_cents"\)val pricePer30MinCents:Int,/, hint: "Put `@SerialName(\"price_per_30min_cents\")` directly before `val pricePer30MinCents: Int` — every underscore counts." },
          ],
          mustNot: [
            { re: /@SerialName\("photoUrl"\)/, hint: "The annotation argument is the backend's snake_case key (`photo_url`), not the Kotlin property name." },
          ],
          success: "Character for character, that's the annotations shipping in Models.kt. Photos load, prices decode, and neither Python nor Kotlin had to bend.",
        },
      ],
    },
    {
      id: "building-models",
      title: "Building Models.kt",
      steps: [
        {
          type: "text",
          md: [
            "## One data class per JSON shape",
            "`data/Models.kt` is the whole API contract, translated into Kotlin: one `data class` for every JSON shape in `docs/API-CONTRACT.md`. It also gives some of them a computed property, the same trick from Module 02 — logic derived from stored fields, at zero storage cost.",
            "PawWalk's Android app keeps `status` as a plain `String` (not an enum) so an unexpected backend value never crashes decoding — but the contract still treats it as a closed set, and `Booking` exposes a computed `Boolean` so the rest of the app never has to compare strings by hand.",
          ],
        },
        {
          type: "code",
          title: "data/Models.kt",
          source: String.raw`@Serializable
data class Booking(
    val id: String,
    @SerialName("walker_id") val walkerId: String,
    @SerialName("dog_name") val dogName: String,
    @SerialName("start_time") val startTime: String,
    @SerialName("duration_minutes") val durationMinutes: Int,
    val status: String,
    @SerialName("price_cents") val priceCents: Int,
    @SerialName("created_at") val createdAt: String,
) {
    /** Walk hasn't happened yet or is happening now (excludes completed and cancelled). */
    val isActive: Boolean get() = status == "pending" || status == "confirmed" || status == "in_progress"
}`,
          caption: "Eight properties, five of them remapped with @SerialName, plus one computed property — the exact shape shipping in the app.",
        },
        {
          type: "quiz",
          q: "`Booking.status` is `val status: String`, with no default value and no `?`. What does that tell you about the `status` key in the JSON?",
          choices: [
            "It's optional — the backend might omit it",
            "It must always be present, or decoding this Booking throws",
            "It defaults to \"pending\" automatically",
            "Kotlin ignores this property entirely",
          ],
          answer: 1,
          explain: "No `?` and no `= default` means this property has exactly one way to get a value: the JSON key must be there. That's a deliberate choice — a booking with no status would be meaningless, so the contract makes it required.",
          nudge: "Compare `status: String` to `bio: String = \"\"` on Walker — one of them has an escape hatch if the key is missing.",
        },
        {
          type: "quiz",
          q: "The backend adds a new field, `\"tip_cents\": 200`, to Booking JSON. Your Booking data class doesn't mention it. What happens when the app decodes a booking?",
          choices: [
            "Decoding throws — the JSON no longer matches",
            "The app crashes on launch",
            "Nothing — decoding ignores JSON keys your data class doesn't ask for",
            "Kotlin automatically adds a `tipCents` property",
          ],
          answer: 2,
          explain: "Extra keys in the JSON are simply skipped — that's what lets the backend grow without breaking old app versions. The reverse is the dangerous direction: a non-nullable property with no default whose key goes *missing* makes decoding throw.",
          nudge: "One direction of mismatch is forgiving, the other throws. Which is which?",
        },
        {
          type: "exercise",
          title: "Type Booking's field list",
          prompt: [
            "From memory (peek back if you must), type Booking's property list exactly as it ships — eight properties, in order, with the five `@SerialName` remaps: `walkerId` → `walker_id`, `dogName` → `dog_name`, `startTime` → `start_time`, `durationMinutes` → `duration_minutes`, `priceCents` → `price_cents`. (Skip `createdAt` — just end the list after `priceCents`.)",
          ],
          starter: String.raw`@Serializable
data class Booking(
    // your code here
)`,
          solution: String.raw`@Serializable
data class Booking(
    val id: String,
    @SerialName("walker_id") val walkerId: String,
    @SerialName("dog_name") val dogName: String,
    @SerialName("start_time") val startTime: String,
    @SerialName("duration_minutes") val durationMinutes: Int,
    val status: String,
    @SerialName("price_cents") val priceCents: Int,
)`,
          checks: [
            { re: /val id:String,/, hint: "First property, no annotation needed: `val id: String,`." },
            { re: /@SerialName\("walker_id"\)val walkerId:String,@SerialName\("dog_name"\)val dogName:String,@SerialName\("start_time"\)val startTime:String,/, hint: "Three remaps in a row: `walkerId` → \"walker_id\", `dogName` → \"dog_name\", `startTime` → \"start_time\"." },
            { re: /@SerialName\("duration_minutes"\)val durationMinutes:Int,val status:String,@SerialName\("price_cents"\)val priceCents:Int,/, hint: "Then `durationMinutes` → \"duration_minutes\", plain `status`, then `priceCents` → \"price_cents\"." },
          ],
          mustNot: [
            { re: /val walker_id/, hint: "Property names are camelCase (`walkerId`); the snake_case string only appears inside `@SerialName(...)`." },
          ],
          success: "That's the real field list from Models.kt, five remaps and all.",
        },
      ],
    },
    {
      id: "coroutines",
      title: "Coroutines: Waiting Without Freezing",
      steps: [
        {
          type: "text",
          md: [
            "## The main thread",
            "Everything your user sees runs on one lane of execution called the **main thread**. It redraws the screen dozens of times a second, and it handles every tap, scroll, and animation. It's fast — as long as nobody makes it *wait*.",
            "A network request to the PawWalk backend takes anywhere from 50 milliseconds to several seconds on hotel Wi-Fi. If the main thread stood still waiting for that response, the app would **freeze**: scrolling dies mid-flick, buttons ignore taps, spinners stop spinning. Users experience it as \"the app is broken\" — and Android will eventually show an *Application Not Responding* dialog and offer to kill it.",
            "So the rule is: the main thread may *start* slow work, but it must never *stand around* waiting for it.",
          ],
        },
        {
          type: "quiz",
          q: "The walkers list takes 2 seconds to download and the main thread waits, doing nothing else. What does the user see during those 2 seconds?",
          choices: [
            "A loading spinner, animating smoothly",
            "A completely frozen app — no scrolling, no taps, spinner stuck",
            "The previous screen, fully interactive",
            "Nothing changes; downloads happen on a separate device",
          ],
          answer: 1,
          explain: "Even the loading spinner is drawn by the main thread — if it's stuck waiting, nothing animates and nothing responds. That's exactly the disaster coroutines exist to prevent.",
          nudge: "Who draws the spinner?",
        },
        {
          type: "text",
          md: [
            "## suspend fun and coroutines",
            "Kotlin's answer is a **coroutine** — a chunk of work that can *pause* itself without blocking the thread it's running on. Two pieces make this work:",
            "- **`suspend`** in front of `fun` marks it as *pausable*: `suspend fun fetchWalkers(): List<Walker>`. It can only be called from inside another `suspend` function or a coroutine — the compiler enforces this so you can never accidentally call slow code from the main thread directly.\n- **`launch { … }`** starts a new coroutine from ordinary, non-suspend code — the bridge in, much like Swift's `Task { … }`. Inside the braces you can freely call `suspend` functions.",
            "If you've compared notes with the iOS track: `suspend fun` is Kotlin's `async`, and calling a suspend function is like Swift's `await` — except Kotlin needs no extra keyword at the call site, just the fact that you're inside a coroutine or another `suspend fun`.",
            "Here's the real thing, from `WalkerRepository.kt`:",
          ],
        },
        {
          type: "code",
          title: "data/WalkerRepository.kt",
          source: String.raw`object WalkerRepository {
    private val api: PawWalkApi get() = Network.api

    suspend fun fetchWalkers(): List<Walker> = api.getWalkers()

    suspend fun myProfile(): Walker = api.walkerProfile()
}`,
          caption: "Every function here is `suspend` — none of them freeze the thread they're called from, they just pause until the network answers.",
        },
        {
          type: "quiz",
          q: "Why must `fetchWalkers()` be marked `suspend`?",
          choices: [
            "It's a style convention with no real effect",
            "It calls `api.getWalkers()`, a network call that needs to pause without blocking the thread — and the compiler requires suspend functions to only be called from other suspend code",
            "`suspend` makes the function run faster",
            "Every function inside an `object` must be `suspend`",
          ],
          answer: 1,
          explain: "`suspend` isn't decoration — it's how the compiler tracks which functions can pause. Since `fetchWalkers` awaits a network call, it must itself be `suspend`, which is exactly what forces every caller up the chain to also be a coroutine or another suspend function.",
          nudge: "What would happen if a plain, non-suspend function tried to directly wait on a network response?",
        },
        {
          type: "text",
          md: [
            "## viewModelScope: the ignition key",
            "One catch: you can only call a `suspend` function from inside a coroutine, but the code that *starts* things — a screen appearing, a button tap — is ordinary non-suspend code. The bridge in a `ViewModel` is **`viewModelScope.launch { … }`**: it starts a new coroutine tied to that screen's lifetime, and Android automatically cancels it if the screen goes away before the work finishes — no manual cleanup, no leaked network calls.",
          ],
        },
        {
          type: "code",
          title: "ui/screens/WalkersViewModel.kt",
          source: String.raw`class WalkersViewModel : ViewModel() {

    sealed interface UiState {
        data object Loading : UiState
        data class Success(val walkers: List<Walker>) : UiState
        data class Error(val message: String) : UiState
    }

    private val _state = MutableStateFlow<UiState>(UiState.Loading)
    val state: StateFlow<UiState> = _state.asStateFlow()

    init { load() }

    fun load() {
        viewModelScope.launch {
            _state.value = UiState.Loading
            _state.value = try {
                UiState.Success(WalkerRepository.fetchWalkers())
            } catch (e: Exception) {
                UiState.Error(e.message ?: "Something went wrong")
            }
        }
    }
}`,
          caption: "`load()` itself is a normal, non-suspend function — it just opens a coroutine with `launch` and does the suspending work inside. `UiState` and `try`/`catch` both return to Module 04 and Module 05 in full.",
        },
        {
          type: "exercise",
          title: "Fetch walkers without freezing anything",
          prompt: [
            "Two parts, exactly like PawWalk does it:",
            "1. Write `suspend fun loadWalkers(): List<Walker>` whose body is one line: return `WalkerRepository.fetchWalkers()` (no `return` keyword needed for a one-line body — Module 02's expression-body syntax).\n2. Below it, start the work from non-suspend code: `viewModelScope.launch { }`, calling `loadWalkers()`, storing the result in a `val` named `walkers`, and printing `walkers.size`.",
          ],
          starter: String.raw`// 1. the suspend function
// your code here

// 2. kick it off from non-suspend code
// your code here`,
          solution: String.raw`suspend fun loadWalkers(): List<Walker> = WalkerRepository.fetchWalkers()

viewModelScope.launch {
    val walkers = loadWalkers()
    println(walkers.size)
}`,
          checks: [
            { re: /suspend fun loadWalkers\(\):List<Walker>=WalkerRepository\.fetchWalkers\(\)/, hint: "The signature is `suspend fun loadWalkers(): List<Walker> = WalkerRepository.fetchWalkers()` — `suspend` comes right before `fun`." },
            { re: /viewModelScope\.launch\{/, hint: "Wrap the kickoff in `viewModelScope.launch { … }` — that's how non-suspend code starts coroutine work in a ViewModel." },
            { re: /val walkers=loadWalkers\(\)/, hint: "Inside the launch block: `val walkers = loadWalkers()` — no extra keyword needed at the call site." },
          ],
          mustNot: [
            { re: /fun suspend/, hint: "The order is `suspend fun`, not `fun suspend` — `suspend` is a modifier that goes before `fun`." },
          ],
          success: "That's the full pattern: a suspend function that pauses instead of blocking, ignited by viewModelScope.launch. Every screen in PawWalk loads its data exactly this way — and now, so can you.",
        },
      ],
    },
  ],
});
