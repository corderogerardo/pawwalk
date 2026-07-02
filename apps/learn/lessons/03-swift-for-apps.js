// Module 03 — Swift for Real Apps: Codable & Async. See FORMAT.md for the schema.
window.COURSE = window.COURSE || [];
window.COURSE.push({
  id: "swift-for-apps",
  title: "Swift for Real Apps: Codable & Async",
  emoji: "📦",
  lessons: [
    {
      id: "json-and-codable",
      title: "JSON & Codable",
      steps: [
        {
          type: "text",
          md: [
            "## The language your app and backend share",
            "PawWalk's iPhone app and its Python backend are two separate programs, possibly written years apart by different people. They agree on exactly one thing: the shape of the **JSON** they send each other.",
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
          caption: "Every field the Walkers screen shows is right here — the app's job is to turn this text into a Swift value it can work with.",
        },
        {
          type: "quiz",
          q: "In the JSON above, `price_per_30min_cents` is 1800. Which Swift type should hold it?",
          choices: [
            "Double — money has decimals",
            "Int — the contract says money is always whole cents",
            "String — everything in JSON is text",
            "Bool",
          ],
          answer: 1,
          explain: "PawWalk's API contract is strict: money is always integer cents, never floats — 1800 cents is $18.00. The client formats it for display (that's what `priceLabel` is for).",
          nudge: "Check the field name again — what unit is the price already in?",
        },
        {
          type: "text",
          md: [
            "## Codable: the bridge",
            "`Codable` is a protocol — one of those ability contracts you met in Module 02. When your struct conforms to it (`struct Walker: Codable`), the **compiler writes the JSON conversion code for you**. Both directions: JSON → Swift is *decoding*, Swift → JSON is *encoding*. (`Codable` is literally `Decodable` + `Encodable` in one word.)",
            "Two new pieces make decoding work:",
            "- **`Data`** — Swift's type for raw bytes. When the network hands you a response, it arrives as `Data`, not as a string.\n- **`JSONDecoder`** — the machine that turns `Data` into your structs. You tell it *what* to decode by passing the type itself: `[Walker].self` means \"an array of Walkers\". The `.self` is how you hand a *type* to a function as a value.",
            "And it's marked `try`, because decoding **can fail**: the backend could rename a field, send a string where you expect a number, or return an error page instead of JSON. You already know `try`/`throws` from Module 02 — this is where it starts earning its keep.",
          ],
        },
        {
          type: "code",
          title: "Decoding the walkers list",
          source: String.raw`struct Walker: Codable {
    let id: String
    let name: String
    let rating: Double
    let bio: String
    let neighborhoods: [String]
}

// data: Data — the GET /walkers response, arrived from the network as
// raw bytes: a JSON array [ {…}, {…} ] of walkers like the one above
let walkers = try JSONDecoder().decode([Walker].self, from: data)
print(walkers[0].name)   // "Sam Rivera"`,
          caption: "A first cut of Walker — only the fields whose names already match the JSON exactly. photo_url and price_per_30min_cents need a trick you'll learn next lesson.",
        },
        {
          type: "quiz",
          q: "Why does `decode` require `try`?",
          choices: [
            "Decoding is slow, and `try` makes Swift optimize it",
            "The bytes might not match the struct — a missing key or wrong type makes decoding throw an error",
            "`try` is required whenever you call a function on a class",
            "It doesn't — `try` is optional here",
          ],
          answer: 1,
          explain: "Decoding is a bet that the data matches your struct. If the backend changes a field or sends an error page instead of JSON, the bet fails — and `throws`/`try` is Swift's honest way of saying so.",
          nudge: "Think about what happens if the backend renames a field and your struct doesn't know.",
        },
        {
          type: "exercise",
          title: "Decode the health check",
          prompt: [
            "The backend's simplest endpoint is `GET /health`, which returns: `{ \"status\": \"ok\", \"version\": \"0.1.0\" }`.",
            "1. Define a struct `Health` conforming to `Codable`, with two `String` constants: `status` and `version` (in that order).\n2. Then decode it: a constant named `health`, using `try` and `JSONDecoder().decode(...)`. The bytes are already in a constant called `data`.",
          ],
          starter: String.raw`// data: Data already holds { "status": "ok", "version": "0.1.0" }

// 1. define Health
// your code here

// 2. decode into a constant named health
// your code here`,
          solution: String.raw`struct Health: Codable {
    let status: String
    let version: String
}
let health = try JSONDecoder().decode(Health.self, from: data)`,
          checks: [
            { re: /struct Health:Codable\{/, hint: "Declare `struct Health: Codable { … }` — conforming to `Codable` is what unlocks decoding." },
            { re: /let status:String let version:String/, hint: "Give the struct two `String` constants — `status` first, then `version`, each on its own line." },
            { re: /let health=try JSONDecoder\(\)\.decode\(Health\.self,from:data\)/, hint: "Pass the type itself first (that's what `.self` is for), then the bytes with the `from:` label — and don't forget `try` in front." },
          ],
          mustNot: [
            { re: /decode\(\[Health\]/, hint: "This JSON is a single object `{…}`, not an array — decode `Health.self`, not `[Health].self`." },
          ],
          success: "You just did what PawWalk does with every response from the backend: bytes in, typed Swift value out.",
        },
      ],
    },
    {
      id: "coding-keys",
      title: "CodingKeys: snake_case → camelCase",
      steps: [
        {
          type: "text",
          md: [
            "## Two naming worlds collide",
            "The backend is Python, and Python names things in **snake_case**: `photo_url`, `price_per_30min_cents`. Swift names things in **camelCase**: `photoURL`, `pricePer30MinCents`. Neither side should bend — each should look idiomatic in its own language.",
            "But by default, Codable matches property names to JSON keys **character for character**. So `let photoURL: String?` goes looking for a JSON key literally called `photoURL` — which isn't there. Because it's an optional, decoding doesn't even fail: `photoURL` just comes back `nil`, *silently*, and every walker photo in the app is blank. `let pricePer30MinCents: Int` is worse-but-honest: it's not optional, so decoding **throws**.",
            "## The fix: CodingKeys",
            "You add a nested enum named `CodingKeys` inside the struct. It's a `String` raw-value enum — exactly the kind you built in Module 02 — that also conforms to `CodingKey`. Three rules:",
            "1. Once the enum exists, it's the **complete list** — only properties with a case get decoded, and every stored property needs one.\n2. A case **without** a raw value (`case id`) matches the JSON key with the same name.\n3. A case **with** one (`case photoURL = \"photo_url\"`) remaps: Swift property name on the left, the exact JSON key in quotes on the right.",
          ],
        },
        {
          type: "code",
          title: "Models/Models.swift",
          source: String.raw`struct Walker: Codable, Identifiable, Hashable {
    let id: String
    let name: String
    let photoURL: String?
    let rating: Double
    let pricePer30MinCents: Int
    let bio: String
    let neighborhoods: [String]

    enum CodingKeys: String, CodingKey {
        case id, name, rating, bio, neighborhoods
        case photoURL = "photo_url"
        case pricePer30MinCents = "price_per_30min_cents"
    }

    var priceLabel: String { "$\(pricePer30MinCents / 100) / 30 min" }
}`,
          caption: "The real, shipping Walker. Identifiable and Hashable are next lesson; priceLabel is a computed property like the ones you wrote in Module 02.",
        },
        {
          type: "quiz",
          q: "In `case photoURL = \"photo_url\"`, what does the string on the right name?",
          choices: [
            "The Swift property",
            "The exact JSON key the backend sends",
            "A default value used when the key is missing",
            "The type of the field",
          ],
          answer: 1,
          explain: "Left side: your Swift property name. Right side: the backend's JSON key, verbatim. The decoder reads `photo_url` from the JSON and stores it in `photoURL`.",
          nudge: "One side belongs to Swift, the other belongs to the wire. Which is in quotes?",
        },
        {
          type: "quiz",
          q: "You write a CodingKeys enum for Walker but forget the `bio` case. What happens?",
          choices: [
            "It decodes fine — `bio` is just an empty string",
            "It compiles but crashes the first time a walker loads",
            "It won't compile — with CodingKeys present, every stored property needs a case (or a default value)",
            "`bio` gets decoded from `photo_url` instead",
          ],
          answer: 2,
          explain: "CodingKeys is all-or-nothing: once you write it, it's the definitive list. The compiler sees `let bio: String` with no case and no default value, and refuses — there'd be no way to fill it in.",
          nudge: "`let bio: String` has to get a value from *somewhere*…",
        },
        {
          type: "exercise",
          title: "Write Walker's CodingKeys",
          prompt: [
            "Type the real CodingKeys enum from `Models/Models.swift`, exactly as it ships:",
            "- First line: the five keys that already match, together on one `case` line, in this order: `id, name, rating, bio, neighborhoods`.\n- Then one remap line for `photoURL` and one for `pricePer30MinCents`.",
          ],
          starter: String.raw`struct Walker: Codable {
    let id: String
    let name: String
    let photoURL: String?
    let rating: Double
    let pricePer30MinCents: Int
    let bio: String
    let neighborhoods: [String]

    // your code here
}`,
          solution: String.raw`struct Walker: Codable {
    let id: String
    let name: String
    let photoURL: String?
    let rating: Double
    let pricePer30MinCents: Int
    let bio: String
    let neighborhoods: [String]

    enum CodingKeys: String, CodingKey {
        case id, name, rating, bio, neighborhoods
        case photoURL = "photo_url"
        case pricePer30MinCents = "price_per_30min_cents"
    }
}`,
          checks: [
            { re: /enum CodingKeys:String,CodingKey\{/, hint: "The enum's raw type is String and it conforms to CodingKey: `enum CodingKeys: String, CodingKey { … }`." },
            { re: /case id,name,rating,bio,neighborhoods/, hint: "Five keys already match the JSON — list them together: `case id, name, rating, bio, neighborhoods`." },
            { re: /case photoURL="photo_url"/, hint: "Remap with the Swift name on the left and the JSON key in quotes on the right: `case photoURL = \"…\"`." },
            { re: /case pricePer30MinCents="price_per_30min_cents"/, hint: "The price key is `price_per_30min_cents` — every underscore counts." },
          ],
          mustNot: [
            { re: /case photo_url/, hint: "The case *name* is the Swift property (`photoURL`); the snake_case name goes inside the quotes on the right." },
          ],
          success: "Character for character, that's the enum shipping in Models.swift. Photos load, prices decode, and neither Python nor Swift had to bend.",
        },
      ],
    },
    {
      id: "building-the-models",
      title: "Building Models.swift",
      steps: [
        {
          type: "text",
          md: [
            "## One struct per JSON shape",
            "`Models/Models.swift` is the whole API contract, translated into Swift: one struct (or enum) for every JSON shape in `docs/API-CONTRACT.md`. In this lesson you'll build the core four: `User`, `AuthResponse`, `Booking`, and `Pet`.",
            "### Two freebie protocols",
            "You'll see two new conformances next to `Codable`:",
            "- **`Identifiable`** — a protocol with one requirement: an `id` property. SwiftUI lists demand it so they can tell rows apart (which row moved, which got deleted). Our structs already have `id`, so conforming costs zero extra code.\n- **`Hashable`** — the value can be boiled down to a number (a *hash*), which lets it live in a `Set` (Swift's no-duplicates collection) and — the reason we care — be used for screen-to-screen navigation later. The compiler synthesizes it for free when every property is itself Hashable.",
            "That's the pattern all over this file: declare the conformance, pay nothing.",
          ],
        },
        {
          type: "code",
          title: "Models/Models.swift",
          source: String.raw`enum UserRole: String, Codable {
    case owner, walker
}

struct User: Codable, Identifiable, Hashable {
    let id: String
    let email: String
    let name: String
    let role: UserRole
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, email, name, role
        case createdAt = "created_at"
    }
}`,
          caption: "Date is Swift's timestamp type — the decoder converts the backend's ISO string into one (you'll configure how in the networking module).",
        },
        {
          type: "quiz",
          q: "Why is `role` a `UserRole` enum instead of a plain `String`?",
          choices: [
            "The contract says roles are a closed set — an enum makes the compiler catch typos and unhandled cases",
            "Enums use less memory than strings",
            "JSON can't transport strings longer than five characters",
            "Apple requires enums for user data",
          ],
          answer: 0,
          explain: "The contract is explicit: enums are closed sets, and clients should model them as enums \"so the compiler catches unhandled cases\". With a String, `\"onwer\"` is a bug at runtime; with `UserRole`, it's a bug at compile time.",
          nudge: "There are exactly two roles in PawWalk. What Swift tool did Module 02 give you for \"exactly these values and no others\"?",
        },
        {
          type: "code",
          title: "Models/Models.swift",
          source: String.raw`struct AuthResponse: Codable {
    let accessToken: String
    let tokenType: String
    let user: User

    enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case tokenType = "token_type"
        case user
    }
}`,
          caption: "`user: User` shows Codable's best trick: nesting. The `user` object inside the login JSON decodes into a full User automatically — no extra code.",
        },
        {
          type: "text",
          md: [
            "## Bookings and the sneaky status",
            "A booking's `status` normally walks `pending → confirmed → in_progress → completed`; the fifth state, `cancelled`, is the exit ramp (the walker declines, or the owner cancels before the walk starts). Five possible values, a closed set → enum, same as `UserRole`.",
            "But there's a trap. Remember from Module 02: a String enum's raw value **defaults to the case name**. `case pending` matches JSON `\"pending\"` for free — but the idiomatic Swift case `inProgress` would default to `\"inProgress\"`, and the backend sends `\"in_progress\"`. One case needs an explicit raw value; the other four don't.",
          ],
        },
        {
          type: "exercise",
          title: "Type BookingStatus",
          prompt: [
            "Write the `BookingStatus` enum from `Models/Models.swift`: a `String` raw-value enum that also conforms to `Codable`, with all five cases on **one** `case` line, in contract order: `pending`, `confirmed`, `inProgress`, `completed`, `cancelled`.",
            "Give `inProgress` the explicit raw value the backend actually sends.",
          ],
          starter: String.raw`// your code here`,
          solution: String.raw`enum BookingStatus: String, Codable {
    case pending, confirmed, inProgress = "in_progress", completed, cancelled
}`,
          checks: [
            { re: /enum BookingStatus:String,Codable\{/, hint: "Declare `enum BookingStatus: String, Codable { … }` — String raw values, plus Codable so it decodes straight from JSON." },
            { re: /case pending,confirmed,inProgress/, hint: "One `case` line, contract order: pending, confirmed, inProgress, …" },
            { re: /inProgress="in_progress"/, hint: "`inProgress` needs `= \"in_progress\"` — its default raw value would be \"inProgress\", which the backend never sends." },
            { re: /completed,cancelled/, hint: "After the remap, finish the list: `completed, cancelled`." },
          ],
          mustNot: [
            { re: /inProgress(?!=)/, hint: "Without an explicit raw value, decoding an in-progress booking throws — the raw value must match the JSON's \"in_progress\" exactly." },
            { re: /case in_progress/, hint: "The Swift case name stays camelCase (`inProgress`); `in_progress` only appears inside the quotes." },
          ],
          success: "That `= \"in_progress\"` is eleven characters standing between you and a decoding error on every active walk. Well typed.",
        },
        {
          type: "code",
          title: "Models/Models.swift",
          source: String.raw`struct Booking: Codable, Identifiable, Hashable {
    let id: String
    let walkerID: String
    let dogName: String
    let startTime: Date
    let durationMinutes: Int
    let status: BookingStatus
    let priceCents: Int
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, status
        case walkerID = "walker_id"
        case dogName = "dog_name"
        case startTime = "start_time"
        case durationMinutes = "duration_minutes"
        case priceCents = "price_cents"
        case createdAt = "created_at"
    }

    var priceLabel: String { "$\(priceCents / 100)" }
}`,
          caption: "Booking uses everything from this module so far: Codable, both freebie protocols, a nested enum property, and the biggest CodingKeys in the file.",
        },
        {
          type: "exercise",
          title: "Type Booking's CodingKeys",
          prompt: [
            "From memory (peek back if you must), type Booking's CodingKeys enum exactly as it ships:",
            "- First line: the two keys that already match — `id, status`.\n- Then six remap lines, one per property, in this order: `walkerID`, `dogName`, `startTime`, `durationMinutes`, `priceCents`, `createdAt`.",
          ],
          starter: String.raw`struct Booking: Codable, Identifiable, Hashable {
    let id: String
    let walkerID: String
    let dogName: String
    let startTime: Date
    let durationMinutes: Int
    let status: BookingStatus
    let priceCents: Int
    let createdAt: Date

    // your code here
}`,
          solution: String.raw`struct Booking: Codable, Identifiable, Hashable {
    let id: String
    let walkerID: String
    let dogName: String
    let startTime: Date
    let durationMinutes: Int
    let status: BookingStatus
    let priceCents: Int
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, status
        case walkerID = "walker_id"
        case dogName = "dog_name"
        case startTime = "start_time"
        case durationMinutes = "duration_minutes"
        case priceCents = "price_cents"
        case createdAt = "created_at"
    }
}`,
          checks: [
            { re: /enum CodingKeys:String,CodingKey\{/, hint: "Same header as always: `enum CodingKeys: String, CodingKey { … }`." },
            { re: /case id,status/, hint: "Only `id` and `status` already match the JSON — they share the first line." },
            { re: /case walkerID="walker_id"case dogName="dog_name"case startTime="start_time"/, hint: "One remap per line, Swift name = \"snake_case_key\": `walkerID`, then `dogName`, then `startTime`…" },
            { re: /case durationMinutes="duration_minutes"case priceCents="price_cents"case createdAt="created_at"/, hint: "…then `durationMinutes`, `priceCents`, and finally `createdAt = \"created_at\"`." },
          ],
          mustNot: [
            { re: /case walker_id/, hint: "Case names are the Swift properties (camelCase); the snake_case strings live to the right of the `=`." },
          ],
          success: "Eight properties, eight cases, zero surprises at decode time. This exact enum ships in the app.",
        },
        {
          type: "code",
          title: "Models/Models.swift",
          source: String.raw`struct Pet: Codable, Identifiable, Hashable {
    let id: String
    let name: String
    let breed: String
    let ageYears: Double?
    let weightKg: Double?
    let notes: String
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, name, breed, notes
        case ageYears = "age_years"
        case weightKg = "weight_kg"
        case createdAt = "created_at"
    }

    var subtitle: String {
        [breed.isEmpty ? nil : breed,
         ageYears.map { "\(Int($0)) yrs" },
         weightKg.map { String(format: "%.1f kg", $0) }]
            .compactMap { $0 }.joined(separator: " · ")
    }
}`,
          caption: "The `subtitle` line packs Module 02 tools: `.map` also works on an optional (transform the value if present, stay nil if not), and compactMap drops the nils. `String(format:)` prints one decimal place — you'll see it again later.",
        },
        {
          type: "quiz",
          q: "The backend adds a new field, `\"tip_cents\": 200`, to Booking JSON. Your Booking struct doesn't mention it. What happens when the app decodes a booking?",
          choices: [
            "Decoding throws — the JSON no longer matches",
            "The app crashes on launch",
            "Nothing — decoding ignores JSON keys your struct doesn't ask for",
            "Xcode automatically adds a `tipCents` property",
          ],
          answer: 2,
          explain: "Extra keys in the JSON are simply skipped — that's what lets the backend grow without breaking old app versions. The reverse is the dangerous direction: a non-optional property whose key goes *missing* makes decoding throw.",
          nudge: "One direction of mismatch is forgiving, the other throws. Which is which?",
        },
      ],
    },
    {
      id: "async-await",
      title: "async/await: Waiting Without Freezing",
      steps: [
        {
          type: "text",
          md: [
            "## The main thread",
            "Everything your user sees runs on one lane of execution called the **main thread**. It redraws the screen up to 120 times a second, and it handles every tap, scroll, and animation. It's fast — as long as nobody makes it *wait*.",
            "A network request to the PawWalk backend takes anywhere from 50 milliseconds to several seconds on hotel Wi-Fi. If the main thread stood still waiting for that response, the app would **freeze**: scrolling dies mid-flick, buttons ignore taps, spinners stop spinning. Users experience it as \"the app is broken\".",
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
          explain: "Even the loading spinner is drawn by the main thread — if it's stuck waiting, nothing animates and nothing responds. That's exactly the disaster async/await exists to prevent.",
          nudge: "Who draws the spinner?",
        },
        {
          type: "text",
          md: [
            "## async and await",
            "Swift's answer is two keywords:",
            "- **`async`** after a function's parentheses marks it as *suspendable*: `func walkers() async throws -> [Walker]`. It can pause in the middle and let the thread go do other work.\n- **`await`** at the call site marks the exact spot where the pause can happen: `let walkers = try await client.walkers()`. The function *suspends* — it doesn't block. The thread is freed to keep drawing the UI, and when the result arrives, the function wakes up on the next line as if nothing happened.",
            "And why the `try`? Network calls can also *fail* (server down, airplane mode) — that's the `throws` in the signature — so the call site stacks both keywords, always in this order: **`try await`**.",
            "Here's the real thing, from PawWalk's networking code:",
          ],
        },
        {
          type: "code",
          title: "Services/APIClient.swift",
          source: String.raw`func walkers() async throws -> [Walker] {
    try await get([Walker].self, path: "walkers")
}

// …and inside the get(…) helper, the three lines that do the work:
let (data, response) = try await URLSession.shared.data(for: request)
try checkStatus(response, data: data)
return try decoder.decode(Response.self, from: data)`,
          caption: "URLSession is Apple's built-in HTTP machinery; it hands back two values at once — a tuple — and `let (data, response) =` unpacks them. The `<Response>` generics that make `get` reusable come in a later module.",
        },
        {
          type: "quiz",
          q: "What does `await` actually do at `try await URLSession.shared.data(for: request)`?",
          choices: [
            "Blocks the thread until the download finishes",
            "Suspends this function, freeing the thread for UI work; resumes here when the data arrives",
            "Moves the download to Apple's servers",
            "Retries the request until it succeeds",
          ],
          answer: 1,
          explain: "Suspend, not block — that's the entire trick. The function bookmarks its place and steps aside; the thread keeps the UI silky; the function resumes at the bookmark when the response lands.",
          nudge: "Blocking is the disease from step one. `await` is the cure — so it must do something *other* than block.",
        },
        {
          type: "text",
          md: [
            "## Task: the ignition key",
            "One catch: `await` is only legal inside an `async` function. But the code that *starts* things — a button tap, a screen appearing — is ordinary synchronous code. The bridge is **`Task { … }`**: it takes a closure (Module 02 again) and runs it as new async work, immediately, without making the caller wait.",
          ],
        },
        {
          type: "code",
          title: "Starting async work from synchronous code",
          source: String.raw`Task {
    let walkers = try await APIClient.shared.walkers()
    print("Loaded \(walkers.count) walkers")
}`,
          caption: "The synchronous code creates the Task and moves on in microseconds; the closure suspends and resumes on its own timeline.",
        },
        {
          type: "text",
          md: [
            "### One more resident of this file: @MainActor",
            "Because UI updates must happen on the main thread, Swift has the **main actor** — think of it as the main thread with a compiler-enforced guest list. Writing `@MainActor` on a class means \"all of this runs on the main actor\", and the compiler guarantees it. `APIClient` is marked `@MainActor`, and you'll see it on every view model in the app. That's all you need for now — just recognize it when it appears.",
          ],
        },
        {
          type: "exercise",
          title: "Fetch walkers without freezing anything",
          prompt: [
            "Two parts, exactly like PawWalk does it:",
            "1. Write `func loadWalkers() async throws -> [Walker]` whose body is one line: return the result of `APIClient.shared.walkers()` using `try await` (no `return` keyword needed for a one-line body — Module 02).\n2. Below it, start the work from synchronous code: a `Task { … }` that calls `loadWalkers()` with `try await`, stores the result in a constant named `walkers`, and prints `walkers.count`.",
          ],
          starter: String.raw`// 1. the suspendable function
// your code here

// 2. kick it off from synchronous code
// your code here`,
          solution: String.raw`func loadWalkers() async throws -> [Walker] {
    try await APIClient.shared.walkers()
}

Task {
    let walkers = try await loadWalkers()
    print(walkers.count)
}`,
          checks: [
            { re: /func loadWalkers\(\)async throws->\[Walker\]\{/, hint: "The signature is `func loadWalkers() async throws -> [Walker]` — `async` comes right after the parentheses, before `throws`." },
            { re: /try await APIClient\.shared\.walkers\(\)/, hint: "Call the shared client with both keywords: `try await APIClient.shared.walkers()`." },
            { re: /Task\{/, hint: "Wrap the kickoff in `Task { … }` — that's how synchronous code starts async work." },
            { re: /let walkers=try await loadWalkers\(\)/, hint: "Inside the Task: `let walkers = try await loadWalkers()`." },
            { re: /print\(.*walkers\.count/, hint: "Last line of the Task: print the count — `print(walkers.count)`." },
          ],
          mustNot: [
            { re: /await try/, hint: "The keywords always read `try await`, in that order." },
            { re: /throws async/, hint: "In a signature it's `async throws` — async first." },
          ],
          success: "That's the full pattern: an async throws function that suspends instead of blocking, ignited by a Task. Every screen in PawWalk loads its data exactly this way — and now, so can you.",
        },
      ],
    },
  ],
});
