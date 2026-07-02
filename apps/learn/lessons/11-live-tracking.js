// Module 11 — Live GPS Tracking. See FORMAT.md for the schema.
window.COURSE = window.COURSE || [];
window.COURSE.push({
  id: "live-tracking",
  title: "Live GPS Tracking",
  emoji: "🛰️",
  lessons: [
    // ────────────────────────────────────────────────────────────────────
    {
      id: "websockets",
      title: "WebSockets: A Live Wire to the Backend",
      steps: [
        {
          type: "text",
          md: [
            "## HTTP can't watch a dog walk",
            "Everything the app has done so far is *ask once, answer once*: `URLSession` sends a request, the backend replies, the connection is done. That shape is wrong for live tracking — the walker's phone produces a new GPS position whenever it moves, and the owner's phone should see each one **the moment it happens**. Asking `GET /position` once a second (called *polling*) is wasteful and always a beat behind.",
            "A **WebSocket** fixes this. The app makes one special HTTP request that says \"let's keep this connection open\", the server agrees, and from then on **either side can send a message at any time**, for as long as the connection lives. If plain HTTP is mailing letters, a WebSocket is a phone call.",
            "PawWalk opens one WebSocket per booking. The walker's phone *sends* GPS fixes up the wire; every phone watching that booking *receives* them. The whole client lives in one file — `Services/LiveTracker.swift` — and this module takes it apart piece by piece.",
          ],
        },
        {
          type: "code",
          title: "Services/LiveTracker.swift (the shell)",
          source: String.raw`@MainActor
@Observable
final class LiveTracker {
    struct Fix: Equatable { let lat: Double; let lng: Double }
    enum Phase: Equatable { case connecting, tracking, noBooking, denied, failed }

    private(set) var phase: Phase = .connecting
    private(set) var fixes: [Fix] = []
    private(set) var startedAt: Date?
    private(set) var activeBookingID: String?

    private var socket: URLSessionWebSocketTask?
    private let manager = CLLocationManager()
    private var locationDelegate: LocationDelegate?
}`,
          caption: "The same @MainActor @Observable view-model shape you've built since Module 5. A Fix is one GPS point; Phase is a plain enum naming every state the screen can be in. The two unfamiliar residents — URLSessionWebSocketTask and CLLocationManager — are this lesson and the next.",
        },
        {
          type: "text",
          md: [
            "## Dialing the number",
            "A WebSocket has its own URL schemes: `ws://` (plain) and `wss://` (encrypted), mirroring `http://` and `https://`. Our API base URL is `http://localhost:8000`, so the tracker needs to rewrite it into `ws://localhost:8000/ws/track/<bookingID>`.",
            "The tool for surgery like that is **`URLComponents`** — a struct that breaks a URL into named parts (`scheme`, `path`, `queryItems`…), lets you edit each one, then hands back the assembled `url`. Much safer than gluing strings together.",
            "One more passenger: the bearer token from Module 8. A WebSocket needs to prove who's connecting too, so the token rides along as a query item — `?token=…` — and the backend checks it before accepting the connection.",
          ],
        },
        {
          type: "code",
          title: "Services/LiveTracker.swift — connect",
          source: String.raw`private func connect(bookingID: String, token: String) {
    guard var comps = URLComponents(url: APIClient.shared.baseURL, resolvingAgainstBaseURL: false)
    else { phase = .failed; return }
    comps.scheme = comps.scheme == "https" ? "wss" : "ws"
    comps.path = "/ws/track/\(bookingID)"
    comps.queryItems = [URLQueryItem(name: "token", value: token)]
    guard let url = comps.url else { phase = .failed; return }
    let task = URLSession.shared.webSocketTask(with: url)
    socket = task
    task.resume()
    receive()
}`,
          caption: "URLSession.shared.webSocketTask(with:) is the same URLSession you know, opening a socket instead of a one-shot request. resume() dials; receive() starts listening.",
        },
        {
          type: "quiz",
          q: "`connect` rewrites the scheme with `comps.scheme == \"https\" ? \"wss\" : \"ws\"`. What are `ws` and `wss`?",
          choices: [
            "Two unrelated Apple frameworks the socket can use",
            "The WebSocket URL schemes — `ws` is plain, `wss` is encrypted, exactly mirroring `http` vs `https`",
            "Shorthand for \"web service\" — a REST naming convention",
            "Typos — the scheme should stay `https` for a socket",
          ],
          answer: 1,
          explain: "WebSockets have their own schemes, and the ternary keeps the *security level* of the base URL: a production `https` API becomes an encrypted `wss` socket; local `http` becomes plain `ws`. Hardcoding either one would break the other environment.",
          nudge: "Look at what the ternary maps: `https` → `wss`, anything else → `ws`. What property of the URL is being preserved?",
        },
        {
          type: "exercise",
          title: "Build the socket URL",
          prompt: [
            "Rebuild the two rewriting lines of `connect` where the marker is:",
            "1. Set `comps.scheme` with a one-line `? :` — if the current `comps.scheme` is `\"https\"`, use `\"wss\"`, otherwise `\"ws\"`.\n2. Set `comps.path` to the string `/ws/track/` with `bookingID` interpolated at the end.",
          ],
          starter: String.raw`private func connect(bookingID: String, token: String) {
    guard var comps = URLComponents(url: APIClient.shared.baseURL, resolvingAgainstBaseURL: false)
    else { phase = .failed; return }
    // your code here: scheme, then path
    comps.queryItems = [URLQueryItem(name: "token", value: token)]
    guard let url = comps.url else { phase = .failed; return }
    let task = URLSession.shared.webSocketTask(with: url)
    socket = task
    task.resume()
    receive()
}`,
          solution: String.raw`private func connect(bookingID: String, token: String) {
    guard var comps = URLComponents(url: APIClient.shared.baseURL, resolvingAgainstBaseURL: false)
    else { phase = .failed; return }
    comps.scheme = comps.scheme == "https" ? "wss" : "ws"
    comps.path = "/ws/track/\(bookingID)"
    comps.queryItems = [URLQueryItem(name: "token", value: token)]
    guard let url = comps.url else { phase = .failed; return }
    let task = URLSession.shared.webSocketTask(with: url)
    socket = task
    task.resume()
    receive()
}`,
          checks: [
            { re: /comps\.scheme=\(?comps\.scheme/, hint: "Assign to `comps.scheme`, and base the decision on the *current* `comps.scheme` — don't hardcode one scheme." },
            { re: /=="https"\)?\?"wss":"ws"/, hint: "Compare against `\"https\"` and pick with `? :` — encrypted stays encrypted (`wss`), plain stays plain (`ws`)." },
            { re: /comps\.path="\/ws\/track\/\\\(bookingID\)"/, hint: "Set `comps.path` to `\"/ws/track/…\"` with the booking's id interpolated: `\\(bookingID)`." },
          ],
          mustNot: [
            { re: /comps\.scheme="wss?"/, hint: "Don't hardcode the scheme — read the existing one and map https→wss, http→ws." },
          ],
          success: "That's the exact URL surgery shipping in LiveTracker.swift — one socket per booking, token attached.",
        },
        {
          type: "text",
          md: [
            "## Listening on the line",
            "Receiving is the part that trips people up: `socket.receive { result in … }` delivers exactly **one** message, then goes quiet. It's not a stream you subscribe to once — it's \"hand me the next message, then I'll ask again\".",
            "So the pattern is: handle the message, then immediately call `receive()` again to wait for the next one. The loop only stops when a receive *fails* — which is how we learn the connection dropped.",
            "Two more things inside the closure. `[weak self]` you've met (Module 8 — the socket holds this closure, so a strong `self` would be a leak). `Task { @MainActor in … }` is a new combination of two old friends: `Task { }` (Module 3's bridge into async) and `@MainActor` (Module 5). Writing `@MainActor in` at the top of the Task pins its work to the main actor — needed because the socket's callback arrives on a background thread, but `LiveTracker` is `@MainActor`, so the `Task` hops us back before touching any property.",
          ],
        },
        {
          type: "code",
          title: "Services/LiveTracker.swift — receive",
          source: String.raw`private func receive() {
    socket?.receive { [weak self] result in
        Task { @MainActor in
            guard let self else { return }
            switch result {
            case .success(let message):
                if case .string(let text) = message { self.handle(text) }
                self.receive()
            case .failure:
                if self.phase != .noBooking { self.phase = .failed }
            }
        }
    }
}`,
          caption: "The result is an enum with associated values (Module 2): .success carries the message, .failure means the socket died. Messages can be .string or .data — ours are JSON text, so we only handle .string.",
        },
        {
          type: "quiz",
          q: "Inside `.success`, right after handling the message, the code calls `self.receive()` again. Why?",
          choices: [
            "It reconnects the socket after every message",
            "It's recursion to keep the compiler from warning about an unused function",
            "`receive` delivers exactly ONE message per call — to hear the next one, you have to ask again",
            "Calling it twice makes messages arrive faster",
          ],
          answer: 2,
          explain: "One call, one message. Handle it, then re-arm. Skip the re-call and the app would show exactly one GPS fix and then go silent forever — a classic WebSocket bug.",
          nudge: "Re-read the first paragraph of the previous step: how many messages does one `receive` call deliver?",
        },
        {
          type: "text",
          md: [
            "## Two kinds of message",
            "The backend speaks a tiny protocol — every message is JSON with a `type` field:",
            "- `{\"type\": \"history\", \"points\": [{\"lat\": …, \"lng\": …}, …]}` — sent once when you connect: everything recorded on this walk so far.\n- `{\"type\": \"position\", \"lat\": …, \"lng\": …}` — sent live, one per new GPS fix from anyone on the booking.",
            "You'd normally reach for `Codable` (Module 3). Here the tracker uses **`JSONSerialization`** instead — an older tool that parses JSON into a plain `[String: Any]` dictionary. Why? One payload, two different shapes, distinguished by a string field: reading `obj[\"type\"]` and switching on it is less code than two Codable structs plus a two-stage decode. Right tool, small job.",
            "The values come out as `Any`, so every read needs `as?` — a cast that produces `nil` if the type doesn't match. That's what the little `fix(_:)` helper does: two `as? Double` reads, or `nil` if the point is malformed.",
          ],
        },
        {
          type: "code",
          title: "Services/LiveTracker.swift — handle + fix",
          source: String.raw`private func handle(_ text: String) {
    guard let data = text.data(using: .utf8),
          let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else { return }
    switch obj["type"] as? String {
    case "history":
        let points = obj["points"] as? [[String: Any]] ?? []
        fixes = points.compactMap { fix($0) }
        phase = .tracking
        if !fixes.isEmpty, startedAt == nil { startedAt = Date() }
    case "position":
        if let f = fix(obj) {
            fixes.append(f)
            if startedAt == nil { startedAt = Date() }
        }
        phase = .tracking
    default:
        break
    }
}

private func fix(_ o: [String: Any]) -> Fix? {
    guard let lat = o["lat"] as? Double, let lng = o["lng"] as? Double else { return nil }
    return Fix(lat: lat, lng: lng)
}`,
          caption: "history replaces the whole fixes array; position appends one point. startedAt is set at the first real fix — it drives the elapsed-time clock in lesson 3.",
        },
        {
          type: "exercise",
          title: "Handle a live position",
          prompt: [
            "The `\"history\"` case is done. Add the `\"position\"` case where the marker is:",
            "1. `case \"position\":`\n2. `fix(obj)` returns an optional `Fix?` — unwrap it with `if let f`.\n3. Inside the `if`: append `f` to `fixes`, and if `startedAt` is still `nil`, set it to `Date()`.\n4. After the `if` closes, set `phase = .tracking` — even a malformed point proves the socket is alive.",
          ],
          starter: String.raw`private func handle(_ text: String) {
    guard let data = text.data(using: .utf8),
          let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else { return }
    switch obj["type"] as? String {
    case "history":
        let points = obj["points"] as? [[String: Any]] ?? []
        fixes = points.compactMap { fix($0) }
        phase = .tracking
        if !fixes.isEmpty, startedAt == nil { startedAt = Date() }
    // your code here: the "position" case
    default:
        break
    }
}`,
          solution: String.raw`private func handle(_ text: String) {
    guard let data = text.data(using: .utf8),
          let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else { return }
    switch obj["type"] as? String {
    case "history":
        let points = obj["points"] as? [[String: Any]] ?? []
        fixes = points.compactMap { fix($0) }
        phase = .tracking
        if !fixes.isEmpty, startedAt == nil { startedAt = Date() }
    case "position":
        if let f = fix(obj) {
            fixes.append(f)
            if startedAt == nil { startedAt = Date() }
        }
        phase = .tracking
    default:
        break
    }
}`,
          checks: [
            { re: /case"position":/, hint: "Match the message's type field: `case \"position\":` — mind the exact spelling, it must equal what the backend sends." },
            { re: /if let f=fix\(obj\)/, hint: "`fix(obj)` might return nil — unwrap with `if let f = fix(obj) { … }`." },
            { re: /fixes\.append\(f\)/, hint: "Inside the `if let`, append the unwrapped fix: `fixes.append(f)`." },
            { re: /if startedAt==nil\{startedAt=Date\(\)\}/, hint: "Start the walk clock at the first fix: `if startedAt == nil { startedAt = Date() }`." },
            { re: /case"position":.*\}phase=\.tracking/, hint: "Step 4: after the `if let` block closes, set `phase = .tracking` — even a malformed point proves the socket is alive." },
          ],
          mustNot: [
            { re: /guard let f=fix/, hint: "Use `if let`, not `guard let` — a malformed point should NOT return early; we still want to reach `phase = .tracking` below it." },
          ],
          success: "Every live dot on the HUD map arrives through the case you just wrote.",
        },
      ],
    },
    // ────────────────────────────────────────────────────────────────────
    {
      id: "corelocation",
      title: "CoreLocation: Real GPS In",
      steps: [
        {
          type: "text",
          md: [
            "## The other direction",
            "Lesson 1 was fixes flowing *down* the socket. But somebody has to produce them — and on the walker's phone, that somebody is the device's real GPS. Apple's framework for it is **CoreLocation**, and the object you talk to is **`CLLocationManager`**.",
            "Location is sensitive, so iOS gatekeeps it: the first time the app asks, the user sees a permission alert, and the app must declare *why* in `Info.plist` (PawWalk's entry: \"PawWalk shows the walk happening live on the map.\"). In code, the ask is one call — `requestWhenInUseAuthorization()` — \"when in use\" meaning only while the app is on screen.",
            "Two knobs tune the firehose before it starts:",
            "- `desiredAccuracy` — how precise you want fixes. `kCLLocationAccuracyBest` asks for the best the hardware can do.\n- `distanceFilter` — how far (in metres) the device must move before you're told about a new fix.",
          ],
        },
        {
          type: "code",
          title: "Services/LiveTracker.swift — startLocation",
          source: String.raw`private func startLocation() {
    let delegate = LocationDelegate(
        onUpdate: { [weak self] lat, lng in Task { @MainActor in self?.publish(lat: lat, lng: lng) } },
        onDenied: { [weak self] in Task { @MainActor in self?.phase = .denied } }
    )
    locationDelegate = delegate
    manager.delegate = delegate
    manager.desiredAccuracy = kCLLocationAccuracyBest
    manager.distanceFilter = 5
    manager.requestWhenInUseAuthorization()
    manager.startUpdatingLocation()
}`,
          caption: "Wire up a delegate (explained two steps down), tune the two knobs, ask permission, open the tap. Every new fix ends up calling publish(lat:lng:), which sends it up the socket.",
        },
        {
          type: "exercise",
          title: "Configure the location manager",
          prompt: [
            "The delegate is wired. Finish `startLocation()` with the four manager calls, in order:",
            "1. Set `desiredAccuracy` to the constant `kCLLocationAccuracyBest`.\n2. Set `distanceFilter` to `5` metres.\n3. Ask permission with `requestWhenInUseAuthorization()`.\n4. Open the tap with `startUpdatingLocation()`.",
          ],
          starter: String.raw`private func startLocation() {
    let delegate = LocationDelegate(
        onUpdate: { [weak self] lat, lng in Task { @MainActor in self?.publish(lat: lat, lng: lng) } },
        onDenied: { [weak self] in Task { @MainActor in self?.phase = .denied } }
    )
    locationDelegate = delegate
    manager.delegate = delegate
    // your code here: accuracy, filter, permission, start
}`,
          solution: String.raw`private func startLocation() {
    let delegate = LocationDelegate(
        onUpdate: { [weak self] lat, lng in Task { @MainActor in self?.publish(lat: lat, lng: lng) } },
        onDenied: { [weak self] in Task { @MainActor in self?.phase = .denied } }
    )
    locationDelegate = delegate
    manager.delegate = delegate
    manager.desiredAccuracy = kCLLocationAccuracyBest
    manager.distanceFilter = 5
    manager.requestWhenInUseAuthorization()
    manager.startUpdatingLocation()
}`,
          checks: [
            { re: /manager\.desiredAccuracy=kCLLocationAccuracyBest/, hint: "The accuracy constants all start with `kCLLocationAccuracy…` — set the manager's `desiredAccuracy` to the Best one." },
            { re: /manager\.distanceFilter=5\b/, hint: "Set `manager.distanceFilter` to plain `5` — CoreLocation distances are always metres." },
            { re: /manager\.requestWhenInUseAuthorization\(\)/, hint: "Ask permission before starting: `requestWhenInUseAuthorization()` — it's a method call, don't forget the parentheses." },
            { re: /manager\.startUpdatingLocation\(\)/, hint: "Nothing flows until you call `startUpdatingLocation()` last." },
          ],
          mustNot: [
            { re: /requestAlwaysAuthorization/, hint: "\"Always\" access is for background tracking. A walk you watch on screen only needs When-In-Use — ask for the minimum." },
          ],
          success: "Four lines and the GPS is live. Now — where do the fixes actually arrive?",
        },
        {
          type: "text",
          md: [
            "## The delegate pattern",
            "`CLLocationManager` predates closures — it announces events using the **delegate pattern**: you hand the manager an object (`manager.delegate = …`), and the manager calls *specifically named methods* on that object when things happen. A new fix arrives → it calls `locationManager(_:didUpdateLocations:)`. Permission changes → `locationManagerDidChangeAuthorization(_:)`. The names are the contract (a protocol, `CLLocationManagerDelegate`), and the manager finds your methods by those exact names.",
            "Compare it to `NotificationCenter` from Module 8: notifications are a megaphone — anyone can listen. A delegate is a phone-a-friend — exactly one object gets the calls.",
            "Why doesn't `LiveTracker` just become the delegate itself? **Threads.** CoreLocation calls its delegate from wherever it pleases — not the main actor — and `LiveTracker` is `@MainActor`, so Swift 6 refuses the mix at compile time. The fix: a tiny separate class, `LocationDelegate`, takes the calls and forwards plain numbers through closures marked **`@Sendable`** — a promise to the compiler that the closure captures only thread-safe values. Look back at `startLocation()`: those closures wrap their work in `Task { @MainActor in … }` — the same hop `receive()` made in lesson 1.",
          ],
        },
        {
          type: "code",
          title: "Services/LiveTracker.swift — LocationDelegate",
          source: String.raw`private final class LocationDelegate: NSObject, CLLocationManagerDelegate {
    private let onUpdate: @Sendable (Double, Double) -> Void
    private let onDenied: @Sendable () -> Void

    init(onUpdate: @escaping @Sendable (Double, Double) -> Void, onDenied: @escaping @Sendable () -> Void) {
        self.onUpdate = onUpdate
        self.onDenied = onDenied
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let last = locations.last else { return }
        onUpdate(last.coordinate.latitude, last.coordinate.longitude)
    }

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        switch manager.authorizationStatus {
        case .denied, .restricted:
            onDenied()
        case .authorizedWhenInUse, .authorizedAlways:
            manager.startUpdatingLocation()
        default:
            break
        }
    }
}`,
          caption: "NSObject is the Objective-C base class most delegate protocols require — inherit it and move on. Note didUpdateLocations hands you an ARRAY: iOS may batch several fixes; the last one is the newest.",
        },
        {
          type: "quiz",
          q: "The permission alert appears and the user taps “Don't Allow”. Trace the chain — what ends up on screen?",
          choices: [
            "`didUpdateLocations` fires once with an empty array, which is ignored",
            "`locationManagerDidChangeAuthorization` fires → status is `.denied` → `onDenied()` runs → hops to the main actor → `phase = .denied` → the HUD shows \"Location access is off\"",
            "The app crashes — location permission is mandatory for the Live screen",
            "Nothing — CoreLocation silently re-asks every few minutes",
          ],
          answer: 1,
          explain: "Permission changes arrive through `locationManagerDidChangeAuthorization`. The delegate maps `.denied`/`.restricted` to the `onDenied` closure, which hops to the main actor and flips `phase` — and in lesson 3 you'll see the view turn that phase into a helpful message instead of a dead screen.",
          nudge: "Permission is an *authorization* change, not a location update. Which delegate method handles those, and which closure does it call?",
        },
        {
          type: "exercise",
          title: "Deliver the fix",
          prompt: [
            "Write the delegate method that receives GPS fixes. Its exact signature (CoreLocation finds it by name):",
            "`func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation])`",
            "Inside: iOS may batch fixes, so `guard let last = locations.last` (bail with `return` if the batch is somehow empty), then call `onUpdate` with `last.coordinate.latitude` and `last.coordinate.longitude` — latitude first.",
          ],
          starter: String.raw`private final class LocationDelegate: NSObject, CLLocationManagerDelegate {
    private let onUpdate: @Sendable (Double, Double) -> Void
    private let onDenied: @Sendable () -> Void

    init(onUpdate: @escaping @Sendable (Double, Double) -> Void, onDenied: @escaping @Sendable () -> Void) {
        self.onUpdate = onUpdate
        self.onDenied = onDenied
    }

    // your code here: didUpdateLocations
}`,
          solution: String.raw`private final class LocationDelegate: NSObject, CLLocationManagerDelegate {
    private let onUpdate: @Sendable (Double, Double) -> Void
    private let onDenied: @Sendable () -> Void

    init(onUpdate: @escaping @Sendable (Double, Double) -> Void, onDenied: @escaping @Sendable () -> Void) {
        self.onUpdate = onUpdate
        self.onDenied = onDenied
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let last = locations.last else { return }
        onUpdate(last.coordinate.latitude, last.coordinate.longitude)
    }
}`,
          checks: [
            { re: /func locationManager\(_ manager:CLLocationManager,didUpdateLocations locations:\[CLLocation\]\)/, hint: "The signature must match the protocol *exactly* — copy it from the prompt, including `_ manager` and the `[CLLocation]` array type." },
            { re: /guard let last=locations\.last/, hint: "Take the newest fix: `guard let last = locations.last` — `.last` is optional because the array could be empty." },
            { re: /onUpdate\(last\.coordinate\.latitude,last\.coordinate\.longitude\)/, hint: "Call `onUpdate` with the two doubles from `last.coordinate` — latitude first, then longitude." },
          ],
          mustNot: [
            { re: /locations\.first/, hint: "iOS batches fixes oldest-to-newest — you want `.last`, the most recent one." },
          ],
          success: "That's the exact method in the repo. GPS hardware → this method → onUpdate → main actor → the socket.",
        },
        {
          type: "text",
          md: [
            "## Up the wire, and measuring the walk",
            "Where does `onUpdate` send the numbers? `publish(lat:lng:)` — which builds the tiny `position` JSON *by hand* (for one three-field message, string interpolation beats an Encodable struct) and pushes it into the socket with `socket?.send`.",
            "And with fixes accumulating, the tracker can answer \"how far has the dog walked?\" — `distanceMeters`. You can't just subtract lat/lng values: those are angles on a sphere, not metres. The classic **haversine formula** converts a pair of coordinates into real ground distance (PawWalk's copy is a small free function at the bottom of the file — feel free to read it, the trigonometry is not on the test).",
            "The interesting Swift is how the fixes become *pairs*: `zip(fixes, fixes.dropFirst())` walks two copies of the array side by side, one shifted by one — so you get (fix0, fix1), (fix1, fix2), … Then `reduce` (Module 2) sums the haversine of each pair. Path length in one line.",
          ],
        },
        {
          type: "code",
          title: "Services/LiveTracker.swift — publish + distance",
          source: String.raw`private func publish(lat: Double, lng: Double) {
    let json = "{\"type\":\"position\",\"lat\":\(lat),\"lng\":\(lng)}"
    socket?.send(.string(json)) { _ in }
}

/// Total path length in metres (haversine over the fixes).
var distanceMeters: Double {
    guard fixes.count > 1 else { return 0 }
    return zip(fixes, fixes.dropFirst()).reduce(0) { $0 + haversine($1.0, $1.1) }
}`,
          caption: "In the reduce closure, $0 is the running total and $1 is the current PAIR — so $1.0 and $1.1 are its two fixes. One fix or none = no distance yet, hence the guard.",
        },
        {
          type: "quiz",
          q: "Why `manager.distanceFilter = 5` instead of `0` (report every fix)?",
          choices: [
            "It ignores the 5 least-accurate fixes in each batch",
            "A new fix only arrives after the device moves ≥ 5 metres — a phone sitting still won't flood the socket, and GPS jitter won't inflate `distanceMeters` with zig-zags",
            "It limits tracking to walks shorter than 5 km",
            "It delays each fix by 5 seconds to save battery",
          ],
          answer: 1,
          explain: "GPS readings wobble a few metres even when you stand still. With `distanceFilter = 0`, that jitter becomes a stream of tiny fake movements — noisy traffic on the socket AND phantom metres in the haversine sum. Five metres filters the wobble, keeps the real walk.",
          nudge: "distanceFilter is in metres. Think about a dog sniffing one lamppost for two minutes — what would zero-filter GPS report, and what would that do to the distance sum?",
        },
      ],
    },
    // ────────────────────────────────────────────────────────────────────
    {
      id: "hud",
      title: "The HUD: Drawing the Walk",
      steps: [
        {
          type: "text",
          md: [
            "## One screen, three layers",
            "`Features/Live/LiveTrackingView.swift` is the mission-control screen from Module 6, now fed by real data. Its body is a `ZStack` of three layers: the drawn map at the back, two dark gradients to keep text readable, and the HUD (top stats, status pill, bottom card) in front.",
            "The view owns the tracker the same way every screen has owned its view model since Module 5: `@State private var tracker = LiveTracker()`. Lifecycle is two modifiers: `.task { await tracker.start(…) }` when the screen appears, `.onDisappear { tracker.stop() }` to hang up the socket and stop GPS when it goes away.",
          ],
        },
        {
          type: "code",
          title: "Features/Live/LiveTrackingView.swift (skeleton)",
          source: String.raw`@State private var tracker = LiveTracker()

var body: some View {
    ZStack {
        Brand.inverse.ignoresSafeArea()

        TimelineView(.animation) { timeline in
            MapCanvas(date: timeline.date, fixes: tracker.fixes, dogName: dogName ?? "Your dog")
                .ignoresSafeArea()
        }

        // … gradients, topHUD, statusLine, bottomHUD …
    }
    .task { await tracker.start(bookingID: bookingID) }
    .onDisappear { tracker.stop() }
}`,
          caption: "tracker.start(bookingID:) accepts nil — the tracker then asks APIClient for your bookings and picks the first non-cancelled one. No walk at all → phase becomes .noBooking.",
        },
        {
          type: "text",
          md: [
            "## The status pill: Phase, on screen",
            "Remember `Phase` from lesson 1 — `connecting, tracking, noBooking, denied, failed`? The `statusLine` view turns each one into a human sentence, using a pattern worth stealing: a closure that returns an *optional* `String`, immediately called, then `if let` around the view. Return a string → a pill renders. Return `nil` → **no view at all**.",
          ],
        },
        {
          type: "code",
          title: "Features/Live/LiveTrackingView.swift — statusLine",
          source: String.raw`@ViewBuilder
private var statusLine: some View {
    let text: String? = {
        switch tracker.phase {
        case .noBooking: return "No active walk to track — book one first."
        case .denied:    return "Location access is off. Enable it in Settings to track."
        case .failed:    return "Lost connection to the tracker."
        case .connecting: return tracker.fixes.isEmpty ? "Acquiring GPS…" : nil
        case .tracking:  return tracker.fixes.isEmpty ? "Waiting for the first fix…" : nil
        }
    }()
    if let text {
        MonoCaption(text, size: 10, weight: .regular, tracking: 0.05, color: on.opacity(0.85))
            .padding(.horizontal, 12).padding(.vertical, 8)
            .background(Capsule().fill(Brand.inverse2.opacity(0.7)))
            .padding(.bottom, 10)
    }
}`,
          caption: "Every phase the tracker can reach has a sentence — including the permission-denied path you traced in lesson 2. MonoCaption is your Module 6 component, back on duty.",
        },
        {
          type: "quiz",
          q: "The walk is streaming happily: `phase == .tracking` and `fixes` has points. What does `statusLine` render?",
          choices: [
            "\"Waiting for the first fix…\"",
            "\"Live · Walk in progress\"",
            "Nothing — the closure returns `nil`, the `if let` doesn't enter, so no pill exists at all",
            "An empty capsule with no text",
          ],
          answer: 2,
          explain: "The pill exists only for states that need explaining. Once dots are flowing, `.tracking` with non-empty fixes returns `nil` and the pill vanishes — the map IS the status. (\"Live · Walk in progress\" is real, but it lives in the top HUD, not here.)",
          nudge: "Follow `.tracking` in the switch: `tracker.fixes.isEmpty ? \"Waiting…\" : nil` — and then what does `if let` do with a nil?",
        },
        {
          type: "text",
          md: [
            "## Numbers for the top HUD",
            "The three big stats — Elapsed, Distance, Pace — are computed properties deriving strings from the tracker. One new tool: **`String(format:)`**, C-style number formatting. `%02d` means \"integer, padded to 2 digits with zeros\" (so 7 → `07`), and `%.2f` means \"decimal with exactly 2 places\" (so 1.5 → `1.50`).",
            "- `elapsedLabel` — seconds since `startedAt`, shown as `String(format: \"%02d:%02d\", s / 60, s % 60)` → `07:42`.\n- `distanceLabel` — metres under a kilometre, kilometres after: `312 m` … `1.68 km`.\n- `paceLabel` — minutes per km, but only when `distanceMeters > 20`: divide by a near-zero distance and GPS jitter would proudly report a 4000-minute pace.",
          ],
        },
        {
          type: "exercise",
          title: "Write distanceLabel",
          prompt: [
            "Finish `distanceLabel` with one `return` line using `? :` — under 1000 metres show whole metres, otherwise kilometres:",
            "1. Condition: `m < 1000`.\n2. Metres branch: interpolate `Int(m)` (chop the decimals), then a space and `m` — like `312 m`.\n3. Kilometres branch: `String(format:)` with `\"%.2f km\"` and `m / 1000` — like `1.68 km`.",
          ],
          starter: String.raw`private var distanceLabel: String {
    let m = tracker.distanceMeters
    // your code here
}`,
          solution: String.raw`private var distanceLabel: String {
    let m = tracker.distanceMeters
    return m < 1000 ? "\(Int(m)) m" : String(format: "%.2f km", m / 1000)
}`,
          checks: [
            { re: /m<1000\)?\?/, hint: "One ternary: `m < 1000 ? metres-string : km-string`." },
            { re: /\?"\\\(Int\(m\)\)m":/, hint: "The metres branch comes right after the `?`: interpolate `Int(m)` — whole metres, no decimals — then a space and `m`." },
            { re: /String\(format:"%\.2f km",m\/1000\)/, hint: "The km branch: `String(format:)`, pattern `\"%.2f km\"`, value `m / 1000`." },
          ],
          mustNot: [
            { re: /if m<1000/, hint: "Use the one-line `? :` form, not an if/else — it reads as a single expression here." },
          ],
          success: "Exactly the line in the repo. 999 → \"999 m\", 1680 → \"1.68 km\".",
        },
        {
          type: "text",
          md: [
            "## Drawing the map — without a map",
            "There's no Apple Maps or Google tile here (tiles cost money and need API keys). The route is *drawn* with two SwiftUI tools you haven't met:",
            "- **`Canvas`** — a view that hands you a drawing context (`ctx`) and a size, and lets you paint paths, shapes and text directly. Think of it as a whiteboard: `ctx.stroke(path, …)` draws a line, `ctx.fill(…)` a filled shape.\n- **`TimelineView(.animation)`** — a wrapper that re-renders its content *every frame*, passing the current `date` each time. That ticking date is the animation engine.",
            "To place GPS points on the whiteboard, `MapCanvas` projects them: longitude is squished by `cos(midLat)` (degrees of longitude shrink as you leave the equator — skip this and every route looks stretched), then the points are scaled and centered to fit a padded rectangle. Relative shape is preserved; that's all a route sketch needs.",
            "The pulsing ping at the dog's position is pure date math — no `@State`, no explicit animation:",
          ],
        },
        {
          type: "code",
          title: "Features/Live/LiveTrackingView.swift — the ping",
          source: String.raw`// Current position — pulsing ping at the latest fix.
guard let cp = pts.last else { return }
let t = date.timeIntervalSinceReferenceDate.truncatingRemainder(dividingBy: 1.8) / 1.8
let pingR = 12 + 22 * t
ctx.fill(Path(ellipseIn: CGRect(x: cp.x - pingR, y: cp.y - pingR, width: 2 * pingR, height: 2 * pingR)),
         with: .color(accent.opacity(0.45 * (1 - t))))
ctx.fill(Path(ellipseIn: CGRect(x: cp.x - 8, y: cp.y - 8, width: 16, height: 16)), with: .color(accent))`,
          caption: "truncatingRemainder is % for doubles: the date becomes a sawtooth t going 0→1 every 1.8 s. The ring's radius grows with t while its opacity fades to zero — same idea as Module 6's PulsingDot, drawn by hand.",
        },
        {
          type: "quiz",
          q: "Why is `MapCanvas` wrapped in `TimelineView(.animation)`?",
          choices: [
            "It adds a scrubber so users can rewind the walk",
            "It re-renders the canvas every frame with a fresh `date` — and that ticking date is what drives the ping's pulse, no @State or .animation modifier needed",
            "It caches the canvas so it only draws once",
            "Canvas views are required to live inside a TimelineView",
          ],
          answer: 1,
          explain: "A Canvas redraws only when its inputs change. `TimelineView(.animation)` changes one input — `date` — every frame, and the ping's radius and opacity are functions of that date. New date → new t → the ring breathes.",
          nudge: "Look at what MapCanvas computes from `date`. What would the ping do if `date` never changed?",
        },
        {
          type: "xcode",
          title: "Watch a walk live",
          intro: ["Time to see every piece of this module — socket, GPS, canvas — running together:"],
          items: [
            "Terminal tab 1: `cd apps/backend && uv run fastapi dev` — the backend hosts the WebSocket too.",
            "Open `apps/ios/PawWalk.xcodeproj` in Xcode and run the app (⌘R).",
            "Log in as an owner and make sure you have a booking (Module 10) — the tracker needs one to open its channel.",
            "Tap **Track** in the bottom tab bar. The HUD opens, and iOS shows the permission alert you traced in lesson 2 — tap **Allow While Using App**. The status pill says \"Acquiring GPS…\". No fix after a few seconds? The Simulator has no location by default — give it one via **Features ▸ Location ▸ City Run** in the Simulator's menu bar.",
            "Tap the **Demo** capsule (top right). The backend replays a recorded route into your booking's channel — watch dots stream in, the route draw itself, and Distance/Pace tick up.",
            "Kill the backend Terminal with Ctrl-C and watch the status pill flip to \"Lost connection to the tracker.\" — that's your `.failure` branch from lesson 1. Restart the backend afterwards.",
          ],
        },
      ],
    },
  ],
});
