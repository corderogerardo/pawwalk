// Module 09 — Lists, Navigation & View Models. See FORMAT.md for the schema.
window.COURSE = window.COURSE || [];
window.COURSE.push({
  id: "lists-navigation",
  title: "Lists, Navigation & View Models",
  emoji: "🧭",
  lessons: [
    // ────────────────────────────────────────────────────────────
    {
      id: "lists",
      title: "List: Rows from an Array",
      steps: [
        {
          type: "text",
          md: [
            "## The scrolling workhorse",
            "Almost every content screen in PawWalk is an array on display: walkers, bookings, pets, recent walks. SwiftUI's tool for that is **List**: hand it an array and a closure, and it turns every element into a scrollable row — `List(walkers) { walker in … }`. The closure runs once per element and returns that element's row view.",
            "You glimpsed exactly this in Module 05, inside WalkersView's `.loaded` case. Now the details. List does a lot for free: scrolling, row separators, and *recycling* — it only builds the rows currently on screen, so a thousand-walker list stays fast.",
            "The one demand List makes: the elements must be `Identifiable`. This is the payoff of the `id` work from Modules 02–03 — when the array changes, List compares ids to know which rows appeared, moved, or vanished, and animates just those.",
          ],
        },
        {
          type: "code",
          title: "Features/Walkers/WalkersView.swift — the .loaded case",
          source: String.raw`case .loaded(let walkers):
    List(walkers) { walker in
        WalkerRow(walker: walker)
    }
    .listStyle(.plain)`,
          caption: "One newcomer: `.listStyle` picks the list's visual flavor. `.plain` means flat, edge-to-edge rows — the default `.insetGrouped` puts rows in rounded gray cards, which fights PawWalk's design. Trimmed: the real rows also carry two tap modifiers — next lesson's topic.",
        },
        {
          type: "quiz",
          q: "`List(walkers) { walker in … }` — what does List require of the `Walker` type to work like this?",
          choices: [
            "Conform to `Identifiable`, so List can tell rows apart when the array changes",
            "Be a class, so all rows share one object",
            "Conform to `Codable`, so rows can be saved to disk",
            "Have fewer than five stored properties",
          ],
          answer: 0,
          explain: "Walker's `let id: String` (plus the `Identifiable` conformance you wrote back in Module 02) is the entire price of admission — List handles the rest.",
          nudge: "Which protocol's whole contract was \"a property called id\"?",
        },
        {
          type: "text",
          md: [
            "## One row = one small view",
            "You *could* pile HStacks straight into the List closure. PawWalk instead gives the row its own struct, `WalkerRow`, and the closure stays one line. Views are cheap structs — extracting one costs nothing at runtime and buys a readable `body`, a reusable row, and a thing you can preview on its own.",
            "It's declared `private struct WalkerRow` — `private` on a top-level type means *visible only inside this file*. The row is WalkersView's implementation detail; no other screen should reach for it.",
            "One new face inside the row: **Label** — a text-plus-icon pair, `Label(\"4.9\", systemImage: \"star.fill\")`, that handles the spacing and alignment between icon and text for you. The rating is formatted with `String(format: \"%.1f\", walker.rating)` — the old-school number formatter you met in Module 02 — so `4.9231` prints as `4.9`.",
          ],
        },
        {
          type: "code",
          title: "Features/Walkers/WalkersView.swift — the row",
          source: String.raw`private struct WalkerRow: View {
    let walker: Walker

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(walker.name).font(.headline)
                Spacer()
                Label(String(format: "%.1f", walker.rating), systemImage: "star.fill")
                    .font(.subheadline)
                    .foregroundStyle(Color.brand)
            }
            Text(walker.bio)
                .font(.subheadline)
                .foregroundStyle(.secondary)
            HStack {
                Text(walker.neighborhoods.joined(separator: " · "))
                    .font(.caption)
                    .foregroundStyle(Color.brand)
                Spacer()
                Text(walker.priceLabel).font(.caption).bold()
            }
        }
        .padding(.vertical, 4)
    }
}`,
          caption: "Every line is a friend: `joined(separator:)` from Module 02, `priceLabel` — the computed property you wrote yourself — and `Color.brand`, Module 06's legacy alias for `Brand.accent`. `.foregroundStyle(.secondary)` is the system's dimmed text color.",
        },
        {
          type: "quiz",
          q: "Why does the row get its own `WalkerRow` struct instead of writing the stacks directly inside the List closure?",
          choices: [
            "SwiftUI can't nest stacks inside a List closure",
            "Structs render faster than closures",
            "Readability and reuse — and since views are cheap structs, extracting one costs nothing",
            "List requires a type whose name ends in Row",
          ],
          answer: 2,
          explain: "The List closure stays one line, the row can be previewed and reused, and the compiler inlines it all anyway. Small views are SwiftUI's favorite unit.",
          nudge: "Is there any *runtime* cost to a small struct? What does extracting one buy the reader?",
        },
        {
          type: "exercise",
          title: "Put walkers on screen",
          prompt: [
            "The walkers screen won't be the only list you ever build — practice the shape on a fresh view that receives its walkers from outside. It lives in the same file as `WalkerRow` (which is `private`, remember — file-visible), so it can reuse the row.",
            "1. In `body`, create a `List` over `walkers`, naming the closure parameter `walker`.\n2. Each row is a `WalkerRow(walker: walker)`.\n3. Chain `.listStyle(.plain)` onto the List.",
          ],
          starter: String.raw`struct WalkersList: View {
    let walkers: [Walker]

    var body: some View {
        // your code here (the list)
    }
}`,
          solution: String.raw`struct WalkersList: View {
    let walkers: [Walker]

    var body: some View {
        List(walkers) { walker in
            WalkerRow(walker: walker)
        }
        .listStyle(.plain)
    }
}`,
          checks: [
            { re: /List\(walkers\)\{walker in/, hint: "`List(walkers) { walker in … }` — the array first, then a trailing closure that names one element `walker`." },
            { re: /WalkerRow\(walker:walker\)/, hint: "Inside the closure, return one row: `WalkerRow(walker: walker)`." },
            { re: /\.listStyle\(\.plain\)/, hint: "Chain the style onto the List itself: `.listStyle(.plain)` — flat rows, no gray cards." },
          ],
          success: "An array in, scrolling rows out — with recycling, separators, and change animations thrown in free.",
        },
      ],
    },
    // ────────────────────────────────────────────────────────────
    {
      id: "navigation-and-sheets",
      title: "NavigationStack, @ViewBuilder & Tap to Book",
      steps: [
        {
          type: "text",
          md: [
            "## The navigation shell",
            "Module 05 promised `NavigationStack` a proper introduction — here it is. A NavigationStack is a container that gives its contents two things: a **navigation bar** (the title area at the top) and the ability to *push* deeper screens onto a stack, the drill-in pattern you know from Settings. Pushing uses `NavigationLink`; PawWalk's flows are sheet-based instead, so around here the stack's day job is the title bar.",
            "One placement rule trips everyone up: `.navigationTitle(\"Find a walker\")` attaches to the view **inside** the stack, not to the stack itself. The title belongs to the screen currently showing — if a screen gets pushed later, *it* declares its own title and the bar updates. The stack is the frame; each screen brings its own label.",
          ],
        },
        {
          type: "quiz",
          q: "Where does a screen's `.navigationTitle` go?",
          choices: [
            "On the NavigationStack itself — it owns the bar",
            "On the content inside the stack — each screen declares its own title, so the bar updates as screens change",
            "In PawWalkApp.swift, once for the whole app",
            "Nowhere — titles are taken from the struct's name automatically",
          ],
          answer: 1,
          explain: "That's why WalkersView writes `content.navigationTitle(…)` inside the stack. Attach it to the stack and the bar just stays blank.",
          nudge: "If the stack later shows a *different* screen, whose title should the bar display?",
        },
        {
          type: "text",
          md: [
            "## @ViewBuilder — the promised explanation",
            "Module 05's other IOU. Remember that `some View` means \"one specific view type, whose name I won't say out loud.\" A `switch` with three branches returns *three different types* — `ProgressView` here, `List` there — and Swift can't pick the one type a plain computed property must have. Try it and the compiler refuses.",
            "**@ViewBuilder** is the fix: an attribute that lets a property or function return *different view types per branch*, packaging them into one type behind the scenes. Plot twist: `body` has been @ViewBuilder all along — that's why `if`/`else` inside body always just worked. Your own helper properties don't get it for free, so `content` declares it explicitly.",
          ],
        },
        {
          type: "code",
          title: "Features/Walkers/WalkersView.swift — the content property",
          source: String.raw`@ViewBuilder
private var content: some View {
    switch model.state {
    case .loading:
        ProgressView("Finding walkers…")
    case .failed(let message):
        ContentUnavailableView(
            "Couldn't load walkers",
            systemImage: "exclamationmark.triangle",
            description: Text(message)
        )
    case .loaded(let walkers):
        List(walkers) { walker in
            WalkerRow(walker: walker)
                .contentShape(Rectangle())
                .onTapGesture { bookingWalker = walker }
        }
        .listStyle(.plain)
    }
}`,
          caption: "The full switch from Module 05, now with nothing trimmed: each `ViewState` case renders exactly one thing, and the rows carry two new modifiers — the tap-to-book wiring, unpacked next.",
        },
        {
          type: "quiz",
          q: "Delete the `@ViewBuilder` line above `content`. What happens?",
          choices: [
            "Nothing — it's just documentation",
            "The app crashes when the state changes",
            "It compiles, but only the .loading case ever shows",
            "A compile error — the switch branches return different view types, and a plain `some View` property must return exactly one",
          ],
          answer: 3,
          explain: "`some View` promises the compiler a single concrete type. @ViewBuilder is the machinery that folds many branch types into one — the same machinery `body` uses silently.",
          nudge: "What did `some View` promise the compiler — and how many different types does the switch produce?",
        },
        {
          type: "text",
          md: [
            "## Which walker did they tap?",
            "Module 05's sheets ran on a Bool: `.sheet(isPresented: $showProfile)`. Perfect when the presented screen needs no input. But tap a walker row and the booking form must know *which walker* — a Bool can't carry a Walker.",
            "The tool is the **item sheet**. State becomes an optional — `@State private var bookingWalker: Walker?` — where `nil` means \"no sheet.\" Then `.sheet(item: $bookingWalker) { walker in … }` presents the moment the state becomes non-nil, hands your closure the *unwrapped* walker, and writes `nil` back when the user swipes down. Same two-way contract as `isPresented`, but the state carries data. One requirement: the item's type must be `Identifiable` — Walker qualifies.",
            "Setting that state is a tap: `.onTapGesture { bookingWalker = walker }` runs its closure when the row is tapped. Its partner `.contentShape(Rectangle())` widens the *tappable area* to the row's whole rectangle — without it, taps only register on the drawn pixels, and the gaps around the Spacer are dead zones.",
          ],
        },
        {
          type: "code",
          title: "Features/Walkers/WalkersView.swift — state and body",
          source: String.raw`struct WalkersView: View {
    @State private var model = WalkersViewModel()
    @State private var bookingWalker: Walker?
    /// Set after a successful booking so the caller (HomeView) can switch to Bookings.
    var onBooked: (Booking) -> Void = { _ in }

    var body: some View {
        NavigationStack {
            content
                .navigationTitle("Find a walker")
                .task { await model.load() }
        }
        .sheet(item: $bookingWalker) { walker in
            CreateBookingView(walker: walker, onBooked: onBooked)
        }
    }
}`,
          caption: "`onBooked` is a stored closure — a callback for \"events flow up,\" this module's last lesson. `CreateBookingView` is the booking form (next module builds it). Note the sheet uses `item:`, not `isPresented:` — and hangs off the NavigationStack itself. A sheet covers the whole screen wherever it's attached; PawWalk keeps sheet wiring at the top level of `body`, where it's easy to find.",
        },
        {
          type: "quiz",
          q: "The booking sheet is up, and the user swipes it down. What's in `bookingWalker` now?",
          choices: [
            "Still the tapped walker",
            "false",
            "nil — SwiftUI writes nil back through the binding, and nil means no sheet",
            "An empty Walker with blank fields",
          ],
          answer: 2,
          explain: "The same two-way deal as `isPresented`, carried by an optional: you write a walker to present; SwiftUI writes nil to dismiss. State and screen can never disagree.",
          nudge: "In the item flavor, what value plays the role that `false` played for the Bool?",
        },
        {
          type: "exercise",
          title: "Tap a row, open the booking form",
          prompt: [
            "Wire the tap-to-book flow into the list you built last lesson. The optional state and the callback are given.",
            "1. On the row, after `.contentShape(Rectangle())`, add an `.onTapGesture` that stores the tapped walker in `bookingWalker`.\n2. On the List, attach a `.sheet(item:)` driven by `bookingWalker`, naming the closure parameter `walker`, presenting `CreateBookingView(walker: walker, onBooked: onBooked)`.",
          ],
          starter: String.raw`struct WalkersList: View {
    let walkers: [Walker]
    @State private var bookingWalker: Walker?
    var onBooked: (Booking) -> Void = { _ in }

    var body: some View {
        List(walkers) { walker in
            WalkerRow(walker: walker)
                .contentShape(Rectangle())
                // your code here (the tap)
        }
        // your code here (the item sheet)
    }
}`,
          solution: String.raw`struct WalkersList: View {
    let walkers: [Walker]
    @State private var bookingWalker: Walker?
    var onBooked: (Booking) -> Void = { _ in }

    var body: some View {
        List(walkers) { walker in
            WalkerRow(walker: walker)
                .contentShape(Rectangle())
                .onTapGesture { bookingWalker = walker }
        }
        .sheet(item: $bookingWalker) { walker in
            CreateBookingView(walker: walker, onBooked: onBooked)
        }
    }
}`,
          checks: [
            { re: /\.onTapGesture\{bookingWalker=walker\}/, hint: "The tap's whole job is remembering who was tapped: assign the closure's `walker` into `bookingWalker`." },
            { re: /\.sheet\(item:\$bookingWalker\)\{walker in/, hint: "`.sheet(item: $bookingWalker) { walker in … }` — the `item:` flavor, with the `$` binding, closure parameter named `walker`." },
            { re: /CreateBookingView\(walker:walker,onBooked:onBooked\)/, hint: "Inside the sheet, present the form: `CreateBookingView(walker: walker, onBooked: onBooked)`." },
          ],
          mustNot: [
            { re: /isPresented/, hint: "A Bool can't say *which* walker was tapped — use the `item:` flavor driven by the optional." },
          ],
          success: "That's the exact wiring shipping in WalkersView.swift: tap → optional fills → sheet rises with the right walker inside.",
        },
      ],
    },
    // ────────────────────────────────────────────────────────────
    {
      id: "home-view-model",
      title: "HomeViewModel: Four Requests at Once",
      steps: [
        {
          type: "text",
          md: [
            "## One screen, four endpoints",
            "The home screen is hungry: the next-walk card needs your **bookings**, the walker's name on that card needs the **walkers**, the big dog header needs your **pets**, and the stat tiles need the server-computed **stats**. Four independent GET requests. `bookings()` and `walkers()` you built in Module 07; `pets()` and `ownerStats()` are two more APIClient helpers built exactly the same one-line way.",
            "Await them one after another and the waits *add up* — four 200 ms requests cost 800 ms of spinner. They don't depend on each other, so they should run **at the same time**.",
            "The tool is **`async let`**: writing `async let bookingsCall = APIClient.shared.bookings()` *starts* the request immediately and keeps going — no waiting. Fire off all four, then `await` each result where it's needed. Total time: the *slowest* request, not the sum.",
          ],
        },
        {
          type: "code",
          title: "Features/Home/HomeViewModel.swift — load(), first half",
          source: String.raw`func load() async {
    async let bookingsCall = APIClient.shared.bookings()
    async let walkersCall = APIClient.shared.walkers()
    async let petsCall = APIClient.shared.pets()
    async let statsCall = APIClient.shared.ownerStats()
    let bookings = (try? await bookingsCall) ?? []
    let walkers = (try? await walkersCall) ?? []
    pets = (try? await petsCall) ?? []
    stats = try? await statsCall
    // …deriving the next walk and the week count comes next…
}`,
          caption: "`try?` (Module 07) turns a thrown error into nil, and `??` supplies the fallback: if one call fails, that slice is just empty and the rest of Home still renders — no all-or-nothing error screen. `pets` and `stats` are `private(set)` properties on the model; the full file lands in a minute.",
        },
        {
          type: "quiz",
          q: "Each of the four requests takes about 200 ms. Roughly how long does `load()` spend fetching with `async let`, versus plain sequential `await`s?",
          choices: [
            "About 200 ms either way — await is always parallel",
            "About 200 ms with async let, about 800 ms sequentially — the requests overlap",
            "About 800 ms either way — the network is the network",
            "async let makes each individual request itself faster",
          ],
          answer: 1,
          explain: "`async let` starts work *now* and defers the waiting; four overlapping 200 ms requests finish together. Sequential `await`s line them up single file.",
          nudge: "When does each request *start* — at its `async let` line, or at its `await`?",
        },
        {
          type: "text",
          md: [
            "## A dictionary for instant lookup",
            "A Booking stores only `walkerID: String` — to put a *name* on the card, the model must find the Walker with that id. Scanning the array per lookup works; the right structure is a **Dictionary**: Swift's key → value store. `let ages = [\"Mochi\": 4, \"Rex\": 7]` maps names to numbers; `ages[\"Mochi\"]` looks one up. The type is written `[String: Int]`, and a lookup returns an *optional* — the key might not be in there.",
            "To build one from the walkers array, meet the **tuple**: values grouped in parentheses, like `(\"w1\", someWalker)` — a quick way to bundle a few values without declaring a struct. `walkers.map { ($0.id, $0) }` turns each walker into a `(key, value)` pair, and `Dictionary(uniqueKeysWithValues:)` assembles the pairs into a dictionary. The \"unique\" in the name is a promise you're making: no two walkers share an id.",
          ],
        },
        {
          type: "quiz",
          q: "With `byID: [String: Walker]`, what is the type of `byID[someBooking.walkerID]`?",
          choices: [
            "Walker — dictionaries always return a value",
            "Walker? — the key might not be in the dictionary",
            "String",
            "[Walker]",
          ],
          answer: 1,
          explain: "A booking could reference a walker the walkers request didn't return. The optional forces the screen to plan for it — you'll see a \"Your walker\" fallback instead of a crash.",
          nudge: "What should a lookup hand back when the key simply isn't there?",
        },
        {
          type: "text",
          md: [
            "## Deriving the screen's facts",
            "The rest of `load()` boils the raw arrays down to what the screen shows. First, which bookings still matter: `.filter` (Module 02) keeps the ones that aren't cancelled and start in the future. Then a new friend, **`.sorted`**: give it a closure answering \"does `$0` come before `$1`?\" — `sorted { $0.startTime < $1.startTime }` puts the earliest walk first. After that, `.first` *is* the next walk.",
            "`future.first.map { … }` is optional-map, the Module 02 aside made real: run the closure only if there *is* a first booking; otherwise stay nil. The result lands in `upcoming`, whose type reads in layers: `(booking: Booking, walker: Walker?)?` — a **named tuple** (fields read as `up.booking`, `up.walker`), whose walker is optional (the dictionary lookup can miss), all wrapped in one more optional (there may be no upcoming walk at all).",
            "Last, `weekCount`: of those future bookings, how many start within the next 7 days — one more `.filter`, then `.count`.",
          ],
        },
        {
          type: "code",
          title: "Features/Home/HomeViewModel.swift",
          source: String.raw`import Foundation
import Observation

@MainActor
@Observable
final class HomeViewModel {
    private(set) var upcoming: (booking: Booking, walker: Walker?)?
    private(set) var weekCount = 0
    private(set) var pets: [Pet] = []
    private(set) var stats: OwnerStats?
    private(set) var loaded = false

    func load() async {
        async let bookingsCall = APIClient.shared.bookings()
        async let walkersCall = APIClient.shared.walkers()
        async let petsCall = APIClient.shared.pets()
        async let statsCall = APIClient.shared.ownerStats()
        let bookings = (try? await bookingsCall) ?? []
        let walkers = (try? await walkersCall) ?? []
        pets = (try? await petsCall) ?? []
        stats = try? await statsCall
        let byID = Dictionary(uniqueKeysWithValues: walkers.map { ($0.id, $0) })

        let now = Date()
        let future = bookings
            .filter { $0.status != .cancelled && $0.startTime >= now }
            .sorted { $0.startTime < $1.startTime }

        upcoming = future.first.map { ($0, byID[$0.walkerID]) }
        let weekAhead = now.addingTimeInterval(7 * 24 * 3600)
        weekCount = future.filter { $0.startTime <= weekAhead }.count
        loaded = true
    }
}`,
          caption: "The whole file — the same @MainActor @Observable shape as WalkersViewModel, just with derived properties instead of a state enum. `7 * 24 * 3600` is a week in seconds; `addingTimeInterval` slides a Date forward by that much.",
        },
        {
          type: "exercise",
          title: "Find the next walk",
          prompt: [
            "Practice the derivation on its own. Given an array of bookings, produce the next upcoming one.",
            "Build `let future`: starting from `bookings`, chain `.filter` keeping only bookings whose `status != .cancelled` **and** `startTime >= now`, then `.sorted` with the trailing closure `{ $0.startTime < $1.startTime }` so the earliest comes first.",
          ],
          starter: String.raw`func nextWalk(in bookings: [Booking]) -> Booking? {
    let now = Date()
    // your code here (let future = …)
    return future.first
}`,
          solution: String.raw`func nextWalk(in bookings: [Booking]) -> Booking? {
    let now = Date()
    let future = bookings
        .filter { $0.status != .cancelled && $0.startTime >= now }
        .sorted { $0.startTime < $1.startTime }
    return future.first
}`,
          checks: [
            { re: /let future=bookings/, hint: "Start the chain from the parameter: `let future = bookings` followed by the two steps." },
            { re: /\$0\.status!=\.cancelled/, hint: "Cancelled walks don't count: inside the filter, `$0.status != .cancelled`." },
            { re: /\$0\.startTime>=now/, hint: "Past walks don't count either: `$0.startTime >= now` — Dates compare with the usual operators." },
            { re: /\.sorted(\(by:)?\{\$0\.startTime<\$1\.startTime\}/, hint: "`.sorted { $0.startTime < $1.startTime }` — the closure answers \"does $0 come before $1?\"" },
          ],
          mustNot: [
            { re: /==\.cancelled/, hint: "That keeps ONLY the cancelled walks — you want everything *but*: `!=`." },
          ],
          success: "The exact derivation inside HomeViewModel.load() — filter what matters, sort by time, and .first is the answer.",
        },
      ],
    },
    // ────────────────────────────────────────────────────────────
    {
      id: "wiring-home",
      title: "Wiring the Home Screen",
      steps: [
        {
          type: "text",
          md: [
            "## From model to cards",
            "HomeView owns its model the standard way — `@State private var model = HomeViewModel()` plus `.task { await model.load() }` — and then simply *reads* the derived facts. The centerpiece is one branch: if `model.upcoming` has a value, show the dark **NextWalkCard**; otherwise show the **EmptyWalkCard** inviting you to book.",
            "That's an `if let` living inside `body` — legal because `body` is @ViewBuilder, as you learned two lessons ago. And the unwrapped `up` is the named tuple from last lesson: the card reads `up.booking` and `up.walker` by field name.",
          ],
        },
        {
          type: "code",
          title: "Features/Home/HomeView.swift — the branch",
          source: String.raw`if let up = model.upcoming {
    NextWalkCard(booking: up.booking, walker: up.walker,
                 onTrack: { showLive = true },
                 onChat: { showAssistant = true })
} else {
    EmptyWalkCard(onBook: { showBooking = true },
                  onChat: { showAssistant = true })
}`,
          caption: "The cards themselves are Module 06 skills — Brand colors, mono captions, capsules. What's new is the *arguments*: every `on…:` parameter is a closure. That's this lesson's theme.",
        },
        {
          type: "text",
          md: [
            "## Events flow up: closure callbacks",
            "Data flows *down* into a child view through plain parameters — `booking:`, `walker:`. Events flow back *up* through **callbacks**: closure properties the parent fills in. NextWalkCard declares `var onTrack: () -> Void` — read the type as \"a function taking nothing, returning nothing\" — and its Track button simply calls it: `Button(action: onTrack)`. The card never knows *what* tracking means; the parent decides. Children report, parents act.",
            "A callback can also carry a payload and a default. WalkersView's `var onBooked: (Booking) -> Void = { _ in }` takes the freshly created Booking; the default `{ _ in }` is a closure that ignores its argument and does nothing, so callers that don't care (like the `#Preview`) can skip the parameter entirely.",
            "Now trace the whole loop. HomeView presents WalkersView in its booking sheet → you tap a walker → CreateBookingView slides up → the booking succeeds → CreateBookingView calls `onBooked` → WalkersView passes it through → HomeView's closure runs:",
          ],
        },
        {
          type: "code",
          title: "Features/Home/HomeView.swift — the booking sheet",
          source: String.raw`.sheet(isPresented: $showBooking) {
    WalkersView(onBooked: { _ in
        showBooking = false
        showBookings = true
        Task { await model.load() }
    })
}`,
          caption: "Close the booking sheet, open the bookings list, refresh the model so the new walk appears on the next-walk card. `Task { … }` is Module 03's bridge into async from a synchronous spot. The `_` says this closure needs only the *fact* of the booking, not the booking itself.",
        },
        {
          type: "quiz",
          q: "Why give `onBooked` the default value `{ _ in }`?",
          choices: [
            "So callers that don't care about the event — like the #Preview — can write WalkersView() with no callback at all",
            "Swift requires every closure property to have a default",
            "It makes the closure run twice for reliability",
            "Defaults make closures run on the main thread",
          ],
          answer: 0,
          explain: "A do-nothing default turns the callback into an opt-in. HomeView opts in with real work; the preview doesn't mention it and gets the silent default.",
          nudge: "What would `#Preview { WalkersView() }` do if `onBooked` had no default?",
        },
        {
          type: "text",
          md: [
            "## ForEach: rows without the scroll",
            "One Home section is list-shaped: recent walks. But it sits *inside* Home's ScrollView — and a List can't go there, because a List brings its own scrolling, and nested scroll areas fight. The tool is **ForEach**: List's row-stamping half, minus the scrolling and styling. Give it an Identifiable array and a closure, and it stamps one view per element straight into whatever container you're already in.",
            "`RecentWalk` satisfies Identifiable with a twist worth seeing: no stored `id`, just `var id: String { bookingID }` — a computed property counts.",
          ],
        },
        {
          type: "code",
          title: "Features/Home/HomeView.swift — recent walks (trimmed)",
          source: String.raw`private var recentWalks: some View {
    VStack(spacing: 0) {
        // …the "§ Recent walks" header row…
        let walks = model.stats?.recentWalks ?? []
        if walks.isEmpty {
            MonoCaption("Completed walks show up here.")
        } else {
            ForEach(walks) { walk in
                RecentWalkRow(points: sparklinePoints(walk.sparkline),
                              title: "\(walk.dogName) with \(walk.walkerName)",
                              meta: walkMeta(walk))
            }
        }
    }
}`,
          caption: "Trimmed — the real file also styles the empty caption and adds a View-all button. `RecentWalkRow` and `sparklinePoints` draw the little distance graph; `walkMeta` builds the \"Tue · 30 min · 1.2 km\" line. Note a plain `let` is allowed between views inside a builder.",
        },
        {
          type: "quiz",
          q: "The recent-walks rows use `ForEach`, not `List`. Why?",
          choices: [
            "ForEach is newer and List is deprecated",
            "They already sit inside Home's ScrollView — List brings its own scrolling, while ForEach just stamps rows into whatever container it's in",
            "List can't display more than ten rows",
            "ForEach is required whenever the array might be empty",
          ],
          answer: 1,
          explain: "Same Identifiable contract, same per-element closure — but ForEach is layout-neutral. List = ForEach + scrolling + row chrome.",
          nudge: "What does List bring that Home's ScrollView already provides?",
        },
        {
          type: "exercise",
          title: "Declare the callback",
          prompt: [
            "Finish WalkersView by declaring the property that lets its parent react to a successful booking.",
            "Declare a stored `var` named `onBooked`: a closure taking a `Booking` and returning `Void`, with a default value that ignores its argument and does nothing.",
          ],
          starter: String.raw`struct WalkersView: View {
    @State private var model = WalkersViewModel()
    @State private var bookingWalker: Walker?
    // your code here (the callback property)

    var body: some View {
        NavigationStack {
            content
                .navigationTitle("Find a walker")
                .task { await model.load() }
        }
        .sheet(item: $bookingWalker) { walker in
            CreateBookingView(walker: walker, onBooked: onBooked)
        }
    }
}`,
          solution: String.raw`struct WalkersView: View {
    @State private var model = WalkersViewModel()
    @State private var bookingWalker: Walker?
    var onBooked: (Booking) -> Void = { _ in }

    var body: some View {
        NavigationStack {
            content
                .navigationTitle("Find a walker")
                .task { await model.load() }
        }
        .sheet(item: $bookingWalker) { walker in
            CreateBookingView(walker: walker, onBooked: onBooked)
        }
    }
}`,
          checks: [
            { re: /var onBooked:\(?\(Booking\)->Void/, hint: "A closure type reads like a function signature: takes `(Booking)`, arrow, returns `Void`." },
            { re: /=\{_ in\}/, hint: "Default it to a closure that receives the booking and ignores it — underscore is the \"I don't care\" name, then `in`, then nothing." },
          ],
          mustNot: [
            { re: /func onBooked/, hint: "A stored closure *property*, not a method — the parent supplies the body, not you." },
          ],
          success: "Data down through parameters, events up through closures — you've now seen both directions of the SwiftUI data flow in shipping code.",
        },
        {
          type: "xcode",
          title: "Watch the whole flow run",
          intro: ["Every piece of this module is live in the app. Prove it:"],
          items: [
            "Terminal tab 1: `cd apps/backend && uv run fastapi dev` — leave it running.",
            "Terminal tab 2: `cd apps/ios && xcodegen generate && open PawWalk.xcodeproj`, pick a simulator, press **⌘R** and log in as a pet owner.",
            "Tap **Book** in the tab bar. The walker list that slides up is your List + WalkerRow, under your navigationTitle.",
            "Tap any row — the booking form rises with that walker's name in it. That's `.contentShape` + `.onTapGesture` filling the optional, and `.sheet(item:)` doing the rest.",
            "Complete a booking. The sheet closes and your bookings appear — you just watched `onBooked` climb from CreateBookingView through WalkersView into HomeView's closure.",
            "Back on Home: the next-walk card now shows your booking, with the walker's name found through the `byID` dictionary — and the stats row filled by four requests that ran at once.",
          ],
        },
      ],
    },
  ],
});
