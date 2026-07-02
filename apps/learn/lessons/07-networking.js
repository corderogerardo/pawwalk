// Module 07 — Talking to the Backend. See FORMAT.md for the schema.
window.COURSE = window.COURSE || [];
window.COURSE.push({
  id: "networking",
  title: "Talking to the Backend",
  emoji: "🌐",
  lessons: [
    // ------------------------------------------------------------------
    {
      id: "urlsession",
      title: "Your First Network Request",
      steps: [
        {
          type: "text",
          md: [
            "## Your app is about to make its first call",
            "Everything real in PawWalk — the walkers, your bookings, your login — lives on the backend. Until now you've decoded JSON that was handed to you as `Data`. This module is about *getting* that `Data` yourself, over the network. Four words to pin down first:",
            "- **URL** — the address of one thing on a server, like `http://localhost:8000/walkers`. In Swift it's a type: `URL`.\n- **Request** — the full ask you send: a URL plus *how* you're asking (fetch it? create something?) plus any extra info. Swift's type is `URLRequest`.\n- **Response** — what comes back: some metadata (\"did it work?\") and a body of raw bytes (usually JSON).\n- **URLSession** — Apple's networking engine. `URLSession.shared` is a ready-made instance the whole app can use.",
            "The heart of it all is one line:",
            "> `let (data, response) = try await URLSession.shared.data(for: request)`",
            "It's `async` — your code pauses here without freezing the app (exactly the `await` you learned earlier) — and it can `throw`, because networks fail: airplane mode, backend not running, Wi-Fi drops. One line in, you get *two* things back: the body bytes and the metadata.",
          ],
        },
        {
          type: "code",
          title: "A complete fetch — the backend's /health endpoint",
          source: String.raw`struct Health: Decodable {
    let status: String
    let version: String
}

let url = URL(string: "http://localhost:8000/health")!
let request = URLRequest(url: url)
let (data, response) = try await URLSession.shared.data(for: request)
let health = try JSONDecoder().decode(Health.self, from: data)
print(health.status)   // "ok"`,
          caption: "`URL(string:)` returns an optional — the string might be garbage — so we force-unwrap with `!` because this URL is hardcoded and known-good.",
        },
        {
          type: "quiz",
          q: "`try await URLSession.shared.data(for: request)` returns a pair, `(data, response)`. What is in `data`?",
          choices: [
            "The raw bytes of the response body — for our backend, JSON",
            "The HTTP status code",
            "An already-decoded Swift struct",
            "The URL that was fetched",
          ],
          answer: 0,
          explain: "`data` is just bytes. That's why the next line feeds it to `JSONDecoder` — decoding is *your* job; URLSession only delivers.",
          nudge: "Which half of the pair would you hand to `JSONDecoder`?",
        },
        {
          type: "text",
          md: [
            "## The other half: response",
            "`response` is the envelope the bytes arrived in. Its declared type is `URLResponse`, but for anything fetched over HTTP it's really an `HTTPURLResponse` — a more specific type that adds the one thing you care about: **the status code**. You get at it with a **conditional cast**, `as?` — new syntax meaning \"treat this value as an `HTTPURLResponse`, *if* it really is one.\" The result is an optional — `nil` when the value isn't that type — which is why it pairs with the `guard let` you already know.",
            "Status codes are the server's three-digit verdict, and four of them cover almost everything you'll see building PawWalk:",
            "- **200** (and anything 200–299) — \"here you go, all good.\"\n- **401** — \"I don't know who you are\" — you're not logged in, or your token expired.\n- **404** — \"no such thing here\" — wrong path, or a booking that isn't yours.\n- **500** — \"I crashed\" — a bug on the *server* side; nothing your app did wrong.",
          ],
        },
        {
          type: "code",
          title: "Reading the status code",
          source: String.raw`let (data, response) = try await URLSession.shared.data(for: request)

guard let http = response as? HTTPURLResponse else {
    throw URLError(.badServerResponse)
}
print(http.statusCode)   // 200 if all went well`,
          caption: "`URLError(.badServerResponse)` is a built-in error meaning \"that wasn't a sensible HTTP reply.\" The guard should never fail for HTTP URLs — but Swift makes you say what happens if it does.",
        },
        {
          type: "quiz",
          q: "A request to the PawWalk backend comes back with status 401. In plain words, the server is saying…",
          choices: [
            "\"Everything went fine.\"",
            "\"I don't know who you are — log in (again).\"",
            "\"That thing doesn't exist.\"",
            "\"I crashed — server-side bug.\"",
          ],
          answer: 1,
          explain: "401 is the \"unauthorized\" code — missing or expired credentials. In Lesson 4 you'll see how PawWalk turns any 401 into an automatic logout.",
          nudge: "40x codes mean *you* asked wrong. Which one is about identity?",
        },
        {
          type: "text",
          md: [
            "## Your turn: fetch the walkers",
            "The API contract (`docs/API-CONTRACT.md`) says: `GET /walkers → 200 [Walker]` — a JSON *array* of walkers, no login required. You already built the `Walker` struct with its `CodingKeys` back in the Codable module, and it has no `Date` fields — so a plain `JSONDecoder()` handles it. (Dates are the next lesson's headache.)",
            "One new convenience: instead of spelling out a full URL string per endpoint, keep one `baseURL` and glue paths onto it with `baseURL.appendingPathComponent(\"walkers\")` — that produces `http://localhost:8000/walkers`. The real `APIClient` does exactly this.",
          ],
        },
        {
          type: "exercise",
          title: "Write walkers() — the long way",
          prompt: [
            "Write the body of `walkers()` longhand — three lines. (Next-next lesson you'll shrink it to one.)",
            "1. Build a `URLRequest` in a constant called `request`, using `baseURL.appendingPathComponent(\"walkers\")` as the URL.\n2. Fetch with the one big line. You don't need the response half here, so bind the pair as `let (data, _)`.\n3. Decode the array with a fresh `JSONDecoder()` and return it.",
          ],
          starter: String.raw`let baseURL = URL(string: "http://localhost:8000")!

func walkers() async throws -> [Walker] {
    // your code here
}`,
          solution: String.raw`let baseURL = URL(string: "http://localhost:8000")!

func walkers() async throws -> [Walker] {
    let request = URLRequest(url: baseURL.appendingPathComponent("walkers"))
    let (data, _) = try await URLSession.shared.data(for: request)
    return try JSONDecoder().decode([Walker].self, from: data)
}`,
          checks: [
            { re: /URLRequest\(url:baseURL\.appendingPathComponent\("walkers"\)\)/, hint: "Line 1: wrap the URL in `URLRequest(url: …)`, and build the URL by appending the path component `\"walkers\"` to `baseURL`." },
            { re: /try await URLSession\.shared\.data\(for:request\)/, hint: "The fetch line needs both keywords — `try` because it can fail, `await` because it takes time — calling `URLSession.shared.data(for: request)`." },
            { re: /JSONDecoder\(\)\.decode\(\[Walker\]\.self,from:data\)/, hint: "The endpoint returns a JSON *array*, so the type to decode is `[Walker].self` — and the bytes come `from: data`." },
          ],
          mustNot: [
            { re: /dataTask/, hint: "`dataTask(with:)` is the old callback-based API. PawWalk uses the modern async one: `try await URLSession.shared.data(for:)`." },
          ],
          success: "That's a real network request, start to finish: build the ask, await the bytes, decode the JSON. Every endpoint in PawWalk is a variation of these three lines.",
        },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: "decoding-dates",
      title: "Decoding Real-World JSON",
      steps: [
        {
          type: "text",
          md: [
            "## Dates: the classic networking pain",
            "JSON has no date type. None. It has strings, numbers, booleans, arrays, and objects — so every backend on Earth ships dates as *strings*, like `\"2026-07-01T15:00:00Z\"`. That format is called **ISO-8601**: year-month-day, a `T`, the time, and a timezone (`Z` means UTC, \"universal time\").",
            "Swift's `Date` type, on the other hand, is a real point in time you can compare and format. Somebody has to bridge the two — and that somebody is `JSONDecoder`, via its `dateDecodingStrategy` property. Set it once and every `Date` field in every struct decodes automatically.",
          ],
        },
        {
          type: "code",
          title: "The simple case — .iso8601",
          source: String.raw`struct RecentWalk: Decodable {
    let dogName: String
    let startTime: Date

    enum CodingKeys: String, CodingKey {
        case dogName = "dog_name"
        case startTime = "start_time"
    }
}

let decoder = JSONDecoder()
decoder.dateDecodingStrategy = .iso8601
let walk = try decoder.decode(RecentWalk.self, from: data)`,
          caption: "With the strategy set, `\"2026-07-01T15:00:00Z\"` becomes a real `Date` — no manual parsing. (This is a trimmed, two-field slice of the real `RecentWalk` in `Models/Models.swift` — the full struct has more fields, same idea.)",
        },
        {
          type: "quiz",
          q: "The backend sends `\"2026-07-01T15:00:00.123456\"` — fractional seconds, and no timezone. What does a decoder set to plain `.iso8601` do with it?",
          choices: [
            "Parses it fine",
            "Throws a decoding error — the whole decode fails",
            "Silently drops the fractional seconds",
            "Assumes your local timezone and carries on",
          ],
          answer: 1,
          explain: "`.iso8601` is strict: fractional seconds alone break it, and so does a missing timezone. One stubborn date string fails the *entire* response — which is exactly why APIClient doesn't use it for decoding.",
          nudge: "Strict parsers don't guess. What does a decoder do when it can't make sense of a value?",
        },
        {
          type: "text",
          md: [
            "## Why PawWalk's dates are messy",
            "The PawWalk backend stores data in SQLite during development, and SQLite timestamps come back with **fractional seconds** (`15:00:00.123456`) and **no timezone marker** — the `Z` gets lost even though the time really is UTC. Strict `.iso8601` chokes on both.",
            "So `APIClient` uses the `.custom` strategy: you hand the decoder a closure that receives the raw string and returns a `Date` — parse it however you like. PawWalk's closure is a **fallback ladder**. It tries, in order:",
            "1. ISO-8601 *with* timezone and fractional seconds — `\"…15:00:00.123Z\"`\n2. ISO-8601 with timezone, no fractional seconds — `\"…15:00:00Z\"`\n3. Both again with a `\"Z\"` appended first — repairing what SQLite dropped\n4. Last resort: `DateFormatter` with explicit patterns, which tolerates any number of fractional digits",
            "First rung that parses wins. If all four miss, it throws a clear \"Invalid date\" error. You do **not** need to memorize this code — you need to recognize the *shape*: try the strict thing, then progressively forgive known quirks.",
          ],
        },
        {
          type: "code",
          title: "Services/APIClient.swift",
          source: String.raw`private var decoder: JSONDecoder {
    let d = JSONDecoder()
    d.dateDecodingStrategy = .custom { decoder in
        let container = try decoder.singleValueContainer()
        let string = try container.decode(String.self)
        // Try ISO8601 with timezone + fractional seconds, then without fractional
        let iso = ISO8601DateFormatter()
        iso.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = iso.date(from: string) { return date }
        iso.formatOptions = .withInternetDateTime
        if let date = iso.date(from: string) { return date }
        // Backend's SQLite loses timezone — try appending Z
        let withZ = string + "Z"
        iso.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = iso.date(from: withZ) { return date }
        iso.formatOptions = .withInternetDateTime
        if let date = iso.date(from: withZ) { return date }
        // Last resort: DateFormatter handles any fractional digit count
        let df = DateFormatter()
        df.locale = Locale(identifier: "en_US_POSIX")
        df.timeZone = TimeZone(secondsFromGMT: 0)
        for fmt in ["yyyy-MM-dd'T'HH:mm:ss.SSSSSS", "yyyy-MM-dd'T'HH:mm:ss.SSS", "yyyy-MM-dd'T'HH:mm:ss"] {
            df.dateFormat = fmt
            if let date = df.date(from: string) { return date }
            if let date = df.date(from: string + "Z") { return date }
        }
        throw DecodingError.dataCorruptedError(in: container, debugDescription: "Invalid date: \(string)")
    }
    return d
}`,
          caption: "The real decoder, verbatim. `ISO8601DateFormatter` and `DateFormatter` are Apple's two date parsers — the first is strict and fast, the second is the flexible old-timer. Skim the ladder; don't memorize it.",
        },
        {
          type: "quiz",
          q: "Why does the ladder try appending `\"Z\"` to the date string?",
          choices: [
            "Z makes parsing faster",
            "Swift requires every string to end in Z",
            "The backend's SQLite drops the timezone marker, so adding Z back restores \"this time is UTC\"",
            "It's checking for a typo in the backend",
          ],
          answer: 2,
          explain: "The times *are* UTC — SQLite just loses the label on the way out. Re-appending `Z` tells the parser what the backend meant. Rung 3 of the ladder is a repair, not a guess.",
          nudge: "What did the lesson say SQLite loses?",
        },
        {
          type: "text",
          md: [
            "## Sending dates back",
            "Traffic flows both ways: when you create a booking, the app *sends* a `start_time`. The mirror image of `JSONDecoder` is **`JSONEncoder`** — it turns your Swift structs into JSON `Data` — and it has a matching `dateEncodingStrategy`.",
            "Here the strict setting is perfect. The API contract says timestamps are ISO-8601 UTC, and since *we* produce the string, there are no quirks to forgive: `.iso8601` it is. Forgiving on the way in, strict on the way out.",
          ],
        },
        {
          type: "exercise",
          title: "Type the encoder",
          prompt: [
            "Type `APIClient`'s `encoder` property exactly as it ships in `Services/APIClient.swift`: a `private var` computed property of type `JSONEncoder` that creates an encoder in a constant named `e`, sets its date encoding strategy to ISO-8601, and returns it.",
          ],
          starter: String.raw`// Inside APIClient
// your code here`,
          solution: String.raw`private var encoder: JSONEncoder {
    let e = JSONEncoder()
    e.dateEncodingStrategy = .iso8601
    return e
}`,
          checks: [
            { re: /private var encoder:JSONEncoder\{/, hint: "Start with the computed-property shell: `private var encoder: JSONEncoder { … }` — a `var` with a type and braces, no `=`." },
            { re: /let e=JSONEncoder\(\)/, hint: "First line inside: make a fresh `JSONEncoder` and store it in a constant called `e`." },
            { re: /e\.dateEncodingStrategy=\.iso8601/, hint: "Set the encoder's date strategy — the property is `dateEncodingStrategy`, and the value is `.iso8601`." },
            { re: /return e/, hint: "A computed property must produce its value — `return e` at the end." },
          ],
          mustNot: [
            { re: /dateDecodingStrategy/, hint: "`dateDecodingStrategy` belongs to JSON*Decoder*. For sending, the encoder's property is `dateEncodingStrategy`." },
          ],
          success: "That's the exact property from APIClient. Every date your app sends will now be clean ISO-8601 UTC — precisely what the contract promises.",
        },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: "generic-helpers",
      title: "Generic Request Helpers",
      steps: [
        {
          type: "text",
          md: [
            "## The repetition problem",
            "PawWalk talks to more than a dozen endpoints: walkers, bookings, pets, stats, login… If you wrote each one longhand like your Lesson 1 exercise, `APIClient` would be hundreds of lines of near-identical code. Look at what two of them would be:",
          ],
        },
        {
          type: "code",
          title: "What APIClient would look like without helpers",
          source: String.raw`func walkers() async throws -> [Walker] {
    let request = URLRequest(url: baseURL.appendingPathComponent("walkers"))
    let (data, _) = try await URLSession.shared.data(for: request)
    return try decoder.decode([Walker].self, from: data)
}

func bookings() async throws -> [Booking] {
    let request = URLRequest(url: baseURL.appendingPathComponent("bookings"))
    let (data, _) = try await URLSession.shared.data(for: request)
    return try decoder.decode([Booking].self, from: data)
}`,
          caption: "Only two things differ: the path string and the type being decoded. Everything else is copy-paste — and copy-paste is where bugs breed.",
        },
        {
          type: "text",
          md: [
            "## Generics: type placeholders with capabilities",
            "You can already write a function that takes any *value* as a parameter. **Generics** let a function take any *type* as a parameter. The angle brackets declare the placeholder:",
            "> `func get<Response: Decodable>(…) async throws -> Response`",
            "Read `<Response: Decodable>` as: \"for any type — call it `Response` — as long as it's `Decodable`.\" The name is a placeholder; the `: Decodable` part is a **capability requirement**. It's what lets the body call `decoder.decode(…)` on it: the compiler knows any `Response` can be decoded, because you demanded it.",
            "Two small companions you'll see in the signature:",
            "- `_ type: Response.Type` — a parameter whose value is *a type itself*. `Response.Type` means \"the type `Response`, passed as a value\".\n- `.self` — how you hand a type over at the call site: `get([Walker].self, path: \"walkers\")`. The `.self` says \"the type itself, not an instance of it.\"",
            "When a caller writes `get([Walker].self, path: \"walkers\")`, the compiler fills the placeholder: every `Response` in the function becomes `[Walker]` for that call. One function, every endpoint.",
          ],
        },
        {
          type: "code",
          title: "Services/APIClient.swift",
          source: String.raw`private func get<Response: Decodable>(
    _ type: Response.Type, path: String, authorized: Bool = false
) async throws -> Response {
    var request = URLRequest(url: baseURL.appendingPathComponent(path))
    if authorized { attachAuthorization(to: &request) }
    let (data, response) = try await URLSession.shared.data(for: request)
    try checkStatus(response, data: data)
    return try decoder.decode(Response.self, from: data)
}`,
          caption: "The real GET helper. `checkStatus` throws when the status code is bad — you'll write it yourself in the next lesson; for now, trust that it either passes or throws.",
        },
        {
          type: "quiz",
          q: "In `func get<Response: Decodable>(…)`, what exactly is `Response`?",
          choices: [
            "A struct defined somewhere in Models.swift",
            "A placeholder for any decodable type — each caller fills it in, e.g. with [Walker]",
            "The HTTPURLResponse object from URLSession",
            "A protocol that all models must adopt",
          ],
          answer: 1,
          explain: "`Response` doesn't exist as a type anywhere — it's a name for \"whatever the caller asks for,\" constrained to types that are `Decodable`. `get([Walker].self, …)` makes it `[Walker]`; `get(User.self, …)` makes it `User`.",
          nudge: "Would the same function call work with [Walker] today and User tomorrow?",
        },
        {
          type: "text",
          md: [
            "## Proving who you are: the Bearer header",
            "Most PawWalk endpoints need to know *who's asking* — your bookings are not my bookings. HTTP handles this with **headers**: little key-value labels attached to a request. The convention for logged-in requests is the `Authorization` header carrying the word `Bearer` plus your token: the string the backend issued when you logged in.",
            "`APIClient` keeps that token in a property, `var bearerToken: String?` — optional, because before login there isn't one. (`AuthSession` sets it after login; you'll build that in a later module.) A tiny helper stamps it onto requests.",
            "That helper's parameter is marked **`inout`** — a keyword meaning \"this function edits the caller's own variable, not a copy.\" The caller flags it with `&`, as in `attachAuthorization(to: &request)`, so it's obvious at the call site that `request` may change.",
            "One more verb before the payoff: everything so far *fetched* (GET). To *send* something — a new booking, a login form — HTTP uses **POST**, and the request carries a JSON body that you produce with last lesson's `encoder`.",
          ],
        },
        {
          type: "code",
          title: "Services/APIClient.swift",
          source: String.raw`var bearerToken: String?

private func attachAuthorization(to request: inout URLRequest) {
    guard let bearerToken else { return }
    request.setValue("Bearer \(bearerToken)", forHTTPHeaderField: "Authorization")
}

// The payoff — every endpoint becomes one line:
func walkers() async throws -> [Walker] {
    try await get([Walker].self, path: "walkers")
}

func me() async throws -> User {
    try await get(User.self, path: "auth/me", authorized: true)
}

func bookings() async throws -> [Booking] {
    try await get([Booking].self, path: "bookings", authorized: true)
}`,
          caption: "Compare with the copy-paste version at the top of this lesson. Public endpoints skip `authorized:`; private ones pass `true`.",
        },
        {
          type: "code",
          title: "Services/APIClient.swift",
          source: String.raw`private func post<Body: Encodable, Response: Decodable>(
    path: String, body: Body, authorized: Bool = false
) async throws -> Response {
    var request = URLRequest(url: baseURL.appendingPathComponent(path))
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.httpBody = try encoder.encode(body)
    if authorized { attachAuthorization(to: &request) }
    let (data, response) = try await URLSession.shared.data(for: request)
    try checkStatus(response, data: data)
    return try decoder.decode(Response.self, from: data)
}`,
          caption: "POST needs *two* placeholders: `Body` (encodable — goes out) and `Response` (decodable — comes back). Note `httpMethod = \"POST\"`, the `Content-Type` header announcing \"this body is JSON,\" and `encoder` from last lesson producing the bytes.",
        },
        {
          type: "quiz",
          q: "`attachAuthorization` begins with `guard let bearerToken else { return }`. What happens when nobody has logged in yet?",
          choices: [
            "The app crashes on the force-unwrap",
            "It throws APIError",
            "It waits until someone logs in",
            "The function quietly does nothing — the request goes out with no Authorization header",
          ],
          answer: 3,
          explain: "No token → no header, no drama. That's fine for public endpoints like `/walkers`; a *protected* endpoint will answer 401 — and next lesson you'll see exactly how the app reacts to that.",
          nudge: "`guard … else { return }` — what does an early `return` from a stamp-a-header function actually do?",
        },
        {
          type: "exercise",
          title: "Type the get helper",
          prompt: [
            "The signature is written for you. Fill in the five-line body, exactly as it ships in `Services/APIClient.swift`:",
            "1. Build the request in a *variable* called `request` (it might get modified), from `baseURL.appendingPathComponent(path)`.\n2. If `authorized`, call `attachAuthorization(to:)` — remember the `&`.\n3. Fetch, binding the pair as `let (data, response)` — you need both halves this time.\n4. Run `try checkStatus(response, data: data)` — trust it for now; you write it next lesson.\n5. Decode `Response.self` using the class's `decoder` property, and return the result.",
          ],
          starter: String.raw`private func get<Response: Decodable>(
    _ type: Response.Type, path: String, authorized: Bool = false
) async throws -> Response {
    // your code here
}`,
          solution: String.raw`private func get<Response: Decodable>(
    _ type: Response.Type, path: String, authorized: Bool = false
) async throws -> Response {
    var request = URLRequest(url: baseURL.appendingPathComponent(path))
    if authorized { attachAuthorization(to: &request) }
    let (data, response) = try await URLSession.shared.data(for: request)
    try checkStatus(response, data: data)
    return try decoder.decode(Response.self, from: data)
}`,
          checks: [
            { re: /var request=URLRequest\(url:baseURL\.appendingPathComponent\(path\)\)/, hint: "Same first line as your Lesson 1 exercise — but the path is now the `path` parameter, and it's `var`, not `let`." },
            { re: /if authorized\{attachAuthorization\(to:&request\)\}/, hint: "Only attach the token when the caller asked for it: `if authorized { … }`, passing the request with `&` so the helper can modify it." },
            { re: /try await URLSession\.shared\.data\(for:request\)/, hint: "The big fetch line again — `try await URLSession.shared.data(for: request)`, bound as `let (data, response)`." },
            { re: /try checkStatus\(response,data:data\)/, hint: "Don't skip step 4 — right after the fetch, `try checkStatus(response, data: data)` is what turns bad status codes into thrown errors." },
            { re: /return try decoder\.decode\(Response\.self,from:data\)/, hint: "Decode `Response.self` — the placeholder, not a concrete type — and use the class's `decoder`, not a new one." },
          ],
          mustNot: [
            { re: /JSONDecoder\(\)/, hint: "Don't create a fresh `JSONDecoder()` here — use the `decoder` property, or you lose the date-decoding ladder from last lesson." },
          ],
          success: "You just wrote the engine room of APIClient. Every GET in the app — walkers, bookings, pets, stats — runs through these five lines.",
        },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: "typed-errors",
      title: "Errors Users Can Read",
      steps: [
        {
          type: "text",
          md: [
            "## \"The operation couldn't be completed\" helps no one",
            "When a request fails, Swift gives you *an* error — but `URLError` messages read like legal disclaimers. If someone signs up with an email that's taken, they deserve \"That email is already registered. Try logging in instead.\" — not error code -1011.",
            "The fix is a **typed error**: your own enum of the failures your app actually cares about. Any type can be thrown as long as it conforms to `Error` (an empty marker protocol). Add **`LocalizedError`** on top — a protocol with one interesting requirement, `errorDescription: String?` — and every error carries a human-readable sentence that SwiftUI alerts and labels can show directly via `error.localizedDescription`.",
            "You already know the last ingredient: an enum case can carry an **associated value**, so `serverError(String)` carries the message itself.",
          ],
        },
        {
          type: "code",
          title: "Services/APIClient.swift",
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
          caption: "Two cases cover PawWalk's needs: one hand-written sentence for the signup collision, and a pass-through for whatever message the backend sends.",
        },
        {
          type: "quiz",
          q: "What does conforming to `LocalizedError` buy `APIError`?",
          choices: [
            "Failed requests retry automatically",
            "Each error can supply a human-readable `errorDescription` that the UI shows directly",
            "Errors get translated into every language automatically",
            "The compiler prevents the errors from ever being thrown",
          ],
          answer: 1,
          explain: "`LocalizedError` is the bridge from \"an error was thrown\" to \"a sentence appears on screen.\" A view can show `error.localizedDescription` without knowing which case it was.",
          nudge: "The protocol's one requirement is a property called `errorDescription`…",
        },
        {
          type: "text",
          md: [
            "## checkStatus: one gate for every request",
            "Both helpers you met last lesson call `try checkStatus(response, data: data)` right after the fetch. That's the single place where status codes become Swift errors. Its logic, top to bottom:",
            "1. **Cast** `response` to `HTTPURLResponse` with `guard … as? …` — no cast, no deal.\n2. **401?** Post a notification (more on this in a moment) so the app can log the user out.\n3. **Switch** on the code. Swift lets a `case` match a *range*: `case 200..<300` covers every success code in one line, and `return` means \"all good, carry on.\"\n4. **409** — the contract says signup answers 409 when the email exists → throw `.emailTaken`.\n5. **Everything else** — the contract promises error bodies shaped like `{ \"detail\": \"human-readable message\" }`. A tiny private struct, `ServerError`, decodes just that field. `try?` means \"attempt it; give me `nil` instead of throwing if it fails\" — perfect here, because if the body isn't in that shape we still want to throw *something*: the generic `URLError(.badServerResponse)`.",
          ],
        },
        {
          type: "code",
          title: "Services/APIClient.swift",
          source: String.raw`private struct ServerError: Decodable {
    let detail: String
}

private func checkStatus(_ response: URLResponse, data: Data) throws {
    guard let http = response as? HTTPURLResponse else { throw URLError(.badServerResponse) }
    if http.statusCode == 401 {
        NotificationCenter.default.post(name: Self.unauthorizedNotification, object: nil)
    }
    switch http.statusCode {
    case 200..<300: return
    case 409: throw APIError.emailTaken
    default:
        if let serverError = try? decoder.decode(ServerError.self, from: data) {
            throw APIError.serverError(serverError.detail)
        }
        throw URLError(.badServerResponse)
    }
}`,
          caption: "Every request in the app funnels through these lines. `Self.unauthorizedNotification` is a named notification defined on APIClient — explained next.",
        },
        {
          type: "quiz",
          q: "The backend returns 404 with body `{ \"detail\": \"Booking not found\" }`. What does `checkStatus` throw?",
          choices: [
            "APIError.emailTaken",
            "URLError(.badServerResponse)",
            "APIError.serverError(\"Booking not found\") — the backend's own message",
            "Nothing — 404 is fine",
          ],
          answer: 2,
          explain: "404 falls to `default:`, the `ServerError` decode succeeds, and the backend's message rides along in the associated value — so the user reads \"Booking not found,\" not a mystery code.",
          nudge: "Trace it: 404 isn't 2xx and isn't 409… and the body *does* decode as ServerError.",
        },
        {
          type: "text",
          md: [
            "## The 401 trick: shouting without knowing who's listening",
            "A 401 can arrive on *any* authorized request — tokens expire. The right reaction is app-wide: log the user out, show the login screen. But that logic lives in `AuthSession`, and here's the design problem: if `APIClient` called `AuthSession` directly, the two would know about each other in a circle — `AuthSession` already uses `APIClient` to log in. Tangles like that make code impossible to test or change. The goal is **decoupling**: `APIClient` should not know `AuthSession` exists.",
            "The tool is **`NotificationCenter`** — an app-wide bulletin board built into Foundation. Anyone can *post* a note with a well-known name; anyone can *listen* for that name. Poster and listener never meet.",
            "> `static let unauthorizedNotification = Notification.Name(\"APIClient.unauthorized\")`",
            "`checkStatus` posts it on every 401 — that's the `NotificationCenter.default.post(…)` line you saw. It writes `Self.unauthorizedNotification`: where lowercase `self` means \"this very value,\" capital **`Self`** means \"the current *type*\" — so inside APIClient that reads \"APIClient's own `unauthorizedNotification`.\" In a later module, `AuthSession` will listen for this exact name and wipe the session. APIClient shouts \"someone's token is bad!\" into the room and goes back to work.",
          ],
        },
        {
          type: "quiz",
          q: "Why does `checkStatus` post a notification on 401 instead of just calling `AuthSession.logout()` directly?",
          choices: [
            "Notifications are faster than function calls",
            "It keeps APIClient decoupled — it never has to know AuthSession exists",
            "Swift forbids one class from calling another",
            "logout() can only run at app launch",
          ],
          answer: 1,
          explain: "AuthSession already depends on APIClient (to log in). If APIClient also depended on AuthSession, you'd have a circular tangle. The notification keeps the dependency one-way: APIClient announces, whoever cares reacts.",
          nudge: "Who already uses whom? Think about which direction the arrow between these two classes should point.",
        },
        {
          type: "exercise",
          title: "Write the switch in checkStatus",
          prompt: [
            "The guard and the 401 notification are done — write the `switch` on `http.statusCode`:",
            "1. Any 2xx code → just `return`.\n2. `409` → throw `APIError.emailTaken`.\n3. `default:` → use the class's `decoder` with `try?` to decode `ServerError.self` from `data` into a constant called `serverError`; if that works, throw `APIError.serverError` with its `detail`. Otherwise throw `URLError(.badServerResponse)`.",
          ],
          starter: String.raw`private func checkStatus(_ response: URLResponse, data: Data) throws {
    guard let http = response as? HTTPURLResponse else { throw URLError(.badServerResponse) }
    if http.statusCode == 401 {
        NotificationCenter.default.post(name: Self.unauthorizedNotification, object: nil)
    }
    // your code here
}`,
          solution: String.raw`private func checkStatus(_ response: URLResponse, data: Data) throws {
    guard let http = response as? HTTPURLResponse else { throw URLError(.badServerResponse) }
    if http.statusCode == 401 {
        NotificationCenter.default.post(name: Self.unauthorizedNotification, object: nil)
    }
    switch http.statusCode {
    case 200..<300: return
    case 409: throw APIError.emailTaken
    default:
        if let serverError = try? decoder.decode(ServerError.self, from: data) {
            throw APIError.serverError(serverError.detail)
        }
        throw URLError(.badServerResponse)
    }
}`,
          checks: [
            { re: /case 200(\.\.<300|\.\.\.299):return/, hint: "A `case` can match a range: the half-open `200..<300` covers every success code. Success means just `return`." },
            { re: /case 409:throw APIError\.emailTaken/, hint: "409 is the signup-collision status — throw the `.emailTaken` case of your enum." },
            { re: /try\?decoder\.decode\(ServerError\.self,from:data\)/, hint: "In `default:`, attempt the decode with `try?` inside an `if let serverError = …` — failure just gives you nil, not a thrown error. Use the class's `decoder` property, like the get helper does." },
            { re: /throw APIError\.serverError\(serverError\.detail\)/, hint: "When the decode works, the backend's message is in `serverError.detail` — wrap it in `.serverError(…)` and throw." },
            { re: /throw URLError\(\.badServerResponse\)[\s\S]*throw URLError\(\.badServerResponse\)/, hint: "One last line: when the body *doesn't* decode as ServerError, `default:` still needs its own last-resort `throw URLError(.badServerResponse)` — the one in the guard up top doesn't cover it." },
          ],
          mustNot: [
            { re: /case 401/, hint: "401 is already handled above the switch (the notification) — don't add a `case 401`; let it fall through to `default` for the thrown error." },
            { re: /JSONDecoder\(\)/, hint: "Don't create a fresh `JSONDecoder()` — use the class's `decoder` property, the same one every helper uses." },
          ],
          success: "That's the whole error story: one switch turns raw status codes into errors a person can read. Module complete — APIClient is no longer a mystery; it's code you've typed.",
        },
      ],
    },
  ],
});
