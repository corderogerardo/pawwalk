// Module 10 — Bookings: Forms & the Full Loop. See FORMAT.md for the schema.
window.COURSE = window.COURSE || [];
window.COURSE.push({
  id: "bookings",
  title: "Bookings: Forms & the Full Loop",
  emoji: "📅",
  lessons: [
    // ────────────────────────────────────────────────────────────────────
    {
      id: "the-booking-form",
      title: "The Booking Form",
      steps: [
        {
          type: "text",
          md: [
            "## From tap to walk: the full loop",
            "Everything you've built so far now pays off. In this module you'll follow one booking through its whole life: an owner fills a form → the app POSTs it to the backend → it lands as *pending* → a walker accepts it, starts the walk, completes it → the new status flows back to the owner's list. Both ends of that loop are Swift you can already read.",
            "Start at the beginning. In Module 9's `WalkersView`, tapping a walker card sets `@State private var bookingWalker: Walker?`, and the item sheet from that same module presents the form:",
            "`.sheet(item: $bookingWalker) { walker in CreateBookingView(walker: walker, onBooked: onBooked) }`",
            "So `CreateBookingView` receives two things from its presenter: the `Walker` being booked, and `onBooked` — a closure property of type `(Booking) -> Void`, the \"events flow up\" callback pattern from Module 9. The form doesn't know or care *who* presented it; it just promises to call `onBooked` with the new booking if the submit succeeds.",
          ],
        },
        {
          type: "code",
          title: "Features/Bookings/CreateBookingView.swift (excerpt)",
          source: String.raw`struct CreateBookingView: View {
    let walker: Walker
    var onBooked: (Booking) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var dogName = ""
    @State private var pets: [Pet] = []
    @State private var startTime = Date().addingTimeInterval(3600)
    @State private var durationMinutes = 30
    @State private var isSubmitting = false
    @State private var errorMessage: String?

    private let durations = [30, 45, 60]

    var body: some View {
        NavigationStack {
            Form {
                Section("Walker") {
                    Text(walker.name).font(.dm(15, .semibold))
                }
                Section("Walk details") {
                    if pets.isEmpty {
                        TextField("Dog's name", text: $dogName)
                    } else {
                        Picker("Pet", selection: $dogName) {
                            ForEach(pets) { Text($0.name).tag($0.name) }
                        }
                    }
                    DatePicker("Start time", selection: $startTime, in: Date()...)
                    Picker("Duration", selection: $durationMinutes) {
                        ForEach(durations, id: \.self) { Text("\($0) min").tag($0) }
                    }
                    .pickerStyle(.segmented)
                }
                if let errorMessage {
                    Text(errorMessage).font(.dm(12)).foregroundStyle(.red)
                }
            }
            // …navigationTitle, toolbar, and the pets-loading .task come next
        }
    }
}`,
          caption: "Every field of the form is a @State property. The starting time defaults to Date().addingTimeInterval(3600) — one hour from now, in seconds.",
        },
        {
          type: "text",
          md: [
            "### The container: `Form`",
            "One new container before the controls. **`Form`** is a `List` dressed for data entry: hand it the same children you'd give a `VStack` and it renders them as the grouped, Settings-app-style rows every iOS user already knows. **`Section(\"Walk details\") { … }`** groups rows under a small header. Zero styling code from us — the whole screen's look is those two words.",
            "### Two controls you haven't met",
            "**`DatePicker`** is `TextField`'s cousin for dates: it binds to a `Date` via `$startTime` and shows the native date-and-time controls. The interesting part is `in: Date()...` — a **one-sided range**. You've used `1...5` (both ends); leave the right end off and the range runs from `Date()` (now) to forever. The picker greys out everything outside the range, so booking a walk *yesterday* is impossible by construction.",
            "**`Picker`** is the choose-one-from-a-list control: a title, a binding for the current selection, and one view per option. Each option carries a `.tag(…)` — the value the binding receives when that option is chosen, and it must match the selection's type. The pet picker binds a `String` (`$dogName`), so it tags each row with `$0.name`. The duration picker binds an `Int`, so it tags `$0` — the number itself. And `ForEach(durations, id: \\.self)`: plain `Int`s aren't `Identifiable` like our models are, so `id: \\.self` says \"each value is its own identity\". Finally `.pickerStyle(.segmented)` renders it as the flat 30 | 45 | 60 pill row instead of a menu.",
            "One more trick worth savoring: `if pets.isEmpty` swaps a free-text `TextField` for a `Picker` of your saved pets. Same form, two experiences — a brand-new owner can still type a name, while a returning owner picks Mochi from a list. Where does `pets` come from? A `.task` — next step.",
          ],
        },
        {
          type: "quiz",
          q: "In `DatePicker(\"Start time\", selection: $startTime, in: Date()...)`, what does `in: Date()...` do?",
          choices: [
            "Sets the picker's initial value to the current time",
            "Makes the picker show only times, not dates",
            "Limits selectable dates to now-or-later, so an owner can't book a walk in the past",
            "Re-creates the picker every second so it stays on the current time",
          ],
          answer: 2,
          explain: "`Date()...` is a one-sided range: from this instant, unbounded on the right. The picker refuses anything earlier. The *initial value* comes from the @State default — `Date().addingTimeInterval(3600)`, an hour from now.",
          nudge: "`...` builds a range. One side is missing — what does an open right end mean for the allowed values?",
        },
        {
          type: "text",
          md: [
            "### Cancel, Book, and refusing bad input",
            "Below the `Form`, three modifiers finish the screen. A `.task` (the run-async-when-the-view-appears modifier you've used since Module 4) fetches the owner's saved pets through `APIClient` and pre-selects the first one. And a `.toolbar` adds the two buttons — with **semantic placements**: `.cancellationAction` and `.confirmationAction` tell iOS *what the buttons mean*, and iOS puts them where that kind of button belongs (leading and trailing edges of the nav bar).",
            "The Book button also refuses bad input. `dogName.trimmingCharacters(in: .whitespaces)` is a `String` method that returns a copy with spaces stripped off both ends — so a \"name\" of three spaces trims down to `\"\"`, and `.isEmpty` catches it. Feed that to `.disabled(…)` and the button greys out until there's a real name.",
            "Notice the *second* `.disabled(isSubmitting)` on the whole `NavigationStack`: while a submit is in flight, every control on the screen freezes. No editing the form mid-request, no double-tapping Book.",
          ],
        },
        {
          type: "code",
          title: "Features/Bookings/CreateBookingView.swift (excerpt)",
          source: String.raw`.navigationTitle("Book \(walker.name)")
.navigationBarTitleDisplayMode(.inline)
.task {
    pets = (try? await APIClient.shared.pets()) ?? []
    if dogName.isEmpty, let first = pets.first { dogName = first.name }
}
.toolbar {
    ToolbarItem(placement: .cancellationAction) {
        Button("Cancel") { dismiss() }
    }
    ToolbarItem(placement: .confirmationAction) {
        Button("Book") { Task { await submit() } }
            .disabled(dogName.trimmingCharacters(in: .whitespaces).isEmpty || isSubmitting)
    }
}
.disabled(isSubmitting)`,
          caption: "try? turns a failed pets fetch into nil, and ?? [] turns that into an empty list — the form quietly falls back to the free-text field.",
        },
        {
          type: "exercise",
          title: "Guard the Book button",
          prompt: [
            "The Book button below is missing its guardrail. Chain a modifier onto it that disables the button when **either** of these is true:",
            "1. `dogName`, after trimming whitespace off both ends, is empty — nobody books a walk for a dog named \"   \".\n2. `isSubmitting` is true — a request is already in flight.",
          ],
          starter: String.raw`.toolbar {
    ToolbarItem(placement: .cancellationAction) {
        Button("Cancel") { dismiss() }
    }
    ToolbarItem(placement: .confirmationAction) {
        Button("Book") { Task { await submit() } }
            // your code here
    }
}`,
          solution: String.raw`.toolbar {
    ToolbarItem(placement: .cancellationAction) {
        Button("Cancel") { dismiss() }
    }
    ToolbarItem(placement: .confirmationAction) {
        Button("Book") { Task { await submit() } }
            .disabled(dogName.trimmingCharacters(in: .whitespaces).isEmpty || isSubmitting)
    }
}`,
          checks: [
            { re: /\.disabled\(/, hint: "The modifier that greys out a control is `.disabled(…)` — chain it onto the Book button." },
            { re: /trimmingCharacters\(in:\.whitespaces\)/, hint: "Trim before you test: `dogName.trimmingCharacters(in: .whitespaces)` strips spaces off both ends." },
            { re: /\.isEmpty/, hint: "Once trimmed, `.isEmpty` tells you whether anything real is left." },
            { re: /isSubmitting/, hint: "Second condition: the button should also be off while `isSubmitting` is true. Combine the two with `||`." },
          ],
          mustNot: [
            { re: /dogName\.isEmpty/, hint: "Testing `dogName` raw lets a name made of spaces through — trim it first, *then* check `.isEmpty`." },
            { re: /&&/, hint: "`&&` disables the button only when *both* things are wrong. Either one alone should be enough — that's `||`." },
          ],
          success: "That's the exact line from CreateBookingView.swift. Grey buttons are cheaper than error dialogs — the best invalid submit is the one that can't happen.",
        },
      ],
    },
    // ────────────────────────────────────────────────────────────────────
    {
      id: "submitting-a-booking",
      title: "Submitting: Happy Path, Sad Path",
      steps: [
        {
          type: "text",
          md: [
            "## What the Book button actually does",
            "`Button(\"Book\") { Task { await submit() } }` — the `Task { }` wrapper is the same bridge you used in Module 8's login button: button taps are synchronous, networking is `async`, and `Task` jumps the gap.",
            "`submit()` has to juggle four responsibilities: flip the UI into its busy state, build the request, hit the network, and then take one of two exits — success (close the sheet, tell the presenter) or failure (show an error, keep the user's input). Here it is, whole:",
          ],
        },
        {
          type: "code",
          title: "Features/Bookings/CreateBookingView.swift (submit)",
          source: String.raw`private func submit() async {
    isSubmitting = true
    errorMessage = nil
    defer { isSubmitting = false }
    let request = CreateBookingRequest(
        walkerID: walker.id,
        dogName: dogName.trimmingCharacters(in: .whitespaces),
        startTime: startTime,
        durationMinutes: durationMinutes,
        notes: nil
    )
    do {
        let booking = try await APIClient.shared.createBooking(request)
        dismiss()
        onBooked(booking)
    } catch {
        errorMessage = "Couldn't create the booking. Try again."
    }
}`,
          caption: "defer (Module 8) runs its block on the way out of the function — every way out. isSubmitting flips back to false on success AND on failure, from one line.",
        },
        {
          type: "text",
          md: [
            "### The two exits",
            "**Happy path.** `APIClient.shared.createBooking(request)` is Module 7's generic `post` helper with `authorized: true` — your bearer token rides along, `CreateBookingRequest`'s `CodingKeys` turn `walkerID` into the `walker_id` the backend expects, and the response decodes into a full `Booking`: server-assigned `id`, `status` of `.pending`, and a `priceCents` the *server* computed from the walker's rate × duration. The client never sends a price — never trust the money math to the device the user controls. Then `dismiss()` closes the sheet and `onBooked(booking)` hands the result to the presenter. In PawWalk, `HomeView`'s closure closes the walkers sheet, opens the bookings list, and refreshes Home.",
            "**Sad path.** The `catch` sets `errorMessage`, which un-nils the `if let errorMessage` row in the `Form` — red text right inside the sheet. Notice everything that *doesn't* happen: no `dismiss()`, no `onBooked`. The form stays up with every field exactly as the user left it, and the Book button (re-enabled, thanks to `defer`) invites a retry. Failing without destroying the user's work is half of what \"handling\" an error means.",
          ],
        },
        {
          type: "quiz",
          q: "The backend is down. An owner fills the form and taps Book. What do they see?",
          choices: [
            "The sheet closes and the booking silently disappears",
            "The sheet stays open with all their input, a red \"Couldn't create the booking. Try again.\" appears, and the Book button works again",
            "The app crashes — the error was never caught",
            "The Book button stays greyed out forever because isSubmitting is stuck at true",
          ],
          answer: 1,
          explain: "`catch` turns the thrown error into a message, the form keeps the user's input because nothing dismissed it, and `defer { isSubmitting = false }` ran on the way out of `submit()` — so the button is live for a retry.",
          nudge: "Trace the `catch` branch line by line — and remember what `defer` promises about the way *out* of a function.",
        },
        {
          type: "exercise",
          title: "Build the request",
          prompt: [
            "The middle of `submit()` went missing: the part that packages the form's state into a `CreateBookingRequest` (its memberwise initializer takes `walkerID`, `dogName`, `startTime`, `durationMinutes`, `notes` — in that order). Rebuild it where the marker is:",
            "- Name the constant `request` — the `do` block below already uses it.\n- The walker's id comes from the `walker` this sheet was opened for.\n- Send the dog's name **trimmed** of surrounding whitespace, like the Book button's check.\n- `startTime` and `durationMinutes` pass straight through from @State.\n- The form has no notes field, so `notes` is `nil`.",
          ],
          starter: String.raw`private func submit() async {
    isSubmitting = true
    errorMessage = nil
    defer { isSubmitting = false }
    // your code here
    do {
        let booking = try await APIClient.shared.createBooking(request)
        dismiss()
        onBooked(booking)
    } catch {
        errorMessage = "Couldn't create the booking. Try again."
    }
}`,
          solution: String.raw`private func submit() async {
    isSubmitting = true
    errorMessage = nil
    defer { isSubmitting = false }
    let request = CreateBookingRequest(
        walkerID: walker.id,
        dogName: dogName.trimmingCharacters(in: .whitespaces),
        startTime: startTime,
        durationMinutes: durationMinutes,
        notes: nil
    )
    do {
        let booking = try await APIClient.shared.createBooking(request)
        dismiss()
        onBooked(booking)
    } catch {
        errorMessage = "Couldn't create the booking. Try again."
    }
}`,
          checks: [
            { re: /let request=CreateBookingRequest\(/, hint: "Start with `let request = CreateBookingRequest(…)` — the do-block below expects that exact name." },
            { re: /walkerID:walker\.id/, hint: "First argument: the id of the walker this sheet was opened for — `walkerID: walker.id`." },
            { re: /dogName:dogName\.trimmingCharacters\(in:\.whitespaces\)/, hint: "Don't send raw input — trim it, the same way the Book button's check did." },
            { re: /startTime:startTime,durationMinutes:durationMinutes,notes:nil/, hint: "Finish with the pass-through values, then `notes: nil` — the form has no notes field yet." },
          ],
          success: "You've rebuilt the whole submit() — validation, request, and both exits. That booking is now sitting on the backend as .pending, waiting for a walker.",
        },
      ],
    },
    // ────────────────────────────────────────────────────────────────────
    {
      id: "the-bookings-list",
      title: "The Bookings List & Cancelling",
      steps: [
        {
          type: "text",
          md: [
            "## Same ViewState song, new verse",
            "The owner's bookings screen is the pattern you've now seen twice: an `@Observable` view model with a `ViewState` enum (`loading` / `loaded` / `failed`), a `load()` that flips through them, and a view that `switch`es on the state. The repo file even says so — its doc comment reads \"Same `@Observable` + `ViewState` shape as `WalkersViewModel`.\"",
            "`load()` reaches for Module 9's `sorted` again, with the closure flipped. Home sorted with `<` — earliest first, because *what's next* matters there. Here it's `bookings.sorted { $0.startTime > $1.startTime }` — later dates first, so the newest booking sits at the top. Same tool, and the whole difference between a to-do list and a history is one comparison operator.",
          ],
        },
        {
          type: "code",
          title: "Features/Bookings/BookingsViewModel.swift",
          source: String.raw`import Foundation
import Observation

@MainActor
@Observable
final class BookingsViewModel {
    enum ViewState {
        case loading
        case loaded([Booking])
        case failed(String)
    }

    private(set) var state: ViewState = .loading

    func load() async {
        state = .loading
        do {
            let bookings = try await APIClient.shared.bookings()
            state = .loaded(bookings.sorted { $0.startTime > $1.startTime })
        } catch {
            state = .failed("Couldn't load your bookings. Pull to refresh to try again.")
        }
    }

    func cancel(_ booking: Booking) async {
        guard case .loaded(var bookings) = state else { return }
        do {
            let updated = try await APIClient.shared.cancelBooking(id: booking.id)
            if let index = bookings.firstIndex(where: { $0.id == updated.id }) {
                bookings[index] = updated
            }
            state = .loaded(bookings)
        } catch {
            // Leave the list as-is — the row's cancel button is still available to retry.
        }
    }
}`,
          caption: "The whole screen's logic, minus only the file's doc comment. cancel() is where the new Swift lives.",
        },
        {
          type: "text",
          md: [
            "### `guard case` — pattern matching outside a switch",
            "You've matched enum cases with associated values in `switch` statements since Module 2. `guard case` does one case's worth of that, inline: `guard case .loaded(var bookings) = state else { return }` reads as *\"unless `state` is `.loaded`, bail out — and if it is, pull its array into `bookings`.\"* The `var` matters: it binds a **mutable copy**, because two lines later we write into it. Can't cancel anything if the list hasn't loaded — the guard makes that precondition explicit.",
            "Then the interesting choice: `cancelBooking` POSTs to `/bookings/{id}/cancel` and the server replies with the **updated booking** — same id, `status` now `.cancelled`. `firstIndex(where:)` scans the array for the position of the first element matching a condition (an optional, since there might be no match — hence `if let`), and we swap the old row for the updated one. Finally `state = .loaded(bookings)` — with `@Observable`, *reassigning* `state` is what tells SwiftUI to re-render.",
            "Notice what we did **not** do: remove the row. The cancelled walk stays in the list wearing a CANCELLED badge. Your history is your history — and the UI stays honest about what the server knows.",
          ],
        },
        {
          type: "exercise",
          title: "Write the guard",
          prompt: [
            "`cancel(_:)` lost its first line. Add the guard that bails out unless `state` is `.loaded`, binding the associated array into a **mutable** `bookings` so the code below can write into it.",
          ],
          starter: String.raw`func cancel(_ booking: Booking) async {
    // your code here
    do {
        let updated = try await APIClient.shared.cancelBooking(id: booking.id)
        if let index = bookings.firstIndex(where: { $0.id == updated.id }) {
            bookings[index] = updated
        }
        state = .loaded(bookings)
    } catch {
    }
}`,
          solution: String.raw`func cancel(_ booking: Booking) async {
    guard case .loaded(var bookings) = state else { return }
    do {
        let updated = try await APIClient.shared.cancelBooking(id: booking.id)
        if let index = bookings.firstIndex(where: { $0.id == updated.id }) {
            bookings[index] = updated
        }
        state = .loaded(bookings)
    } catch {
    }
}`,
          checks: [
            { re: /guard case\.loaded\(var bookings\)=state/, hint: "Pattern: `guard case .loaded(… bookings) = state` — and bind with `var`, because `bookings[index] = updated` below has to mutate it." },
            { re: /else\{return\}/, hint: "Every guard needs its escape hatch: `else { return }`." },
          ],
          mustNot: [
            { re: /case let|\(let bookings\)/, hint: "`let` binds a constant — `bookings[index] = updated` won't compile. Bind with `var`." },
          ],
          success: "One line, three jobs: check the state, unpack the array, make it writable. `guard case` earns its keep in every view model with a ViewState enum.",
        },
        {
          type: "text",
          md: [
            "### The view: one switch, four screens",
            "`BookingsView` switches over `model.state` exactly like Module 9's list — with one refinement. Look at the two `.loaded` cases below: the first has a **`where` clause**, an extra condition bolted onto a case. `case .loaded(let bookings) where bookings.isEmpty` only matches a *loaded but empty* list, and shows a friendly \"No bookings yet\" instead of a blank screen. A non-empty list falls through to the plain `case .loaded` with the real `List` — which carries one modifier you haven't met: `.refreshable { await model.load() }` is the system pull-to-refresh. Drag the list down and SwiftUI runs your async closure, holding the spinner until it finishes.",
            "Each row is a `BookingRow` that receives the booking plus an `onCancel` closure — the same callback-prop shape as `onBooked`. The row decides for itself whether cancelling is even on the table: `canCancel` is true only for `.pending` and `.confirmed`. Once a walk is underway, finished, or already cancelled, the button simply isn't rendered.",
          ],
        },
        {
          type: "code",
          title: "Features/Bookings/BookingsView.swift (excerpt)",
          source: String.raw`@ViewBuilder
private var content: some View {
    switch model.state {
    case .loading:
        ProgressView("Loading bookings…")
    case .failed(let message):
        ContentUnavailableView {
            Label("Couldn't load bookings", systemImage: "exclamationmark.triangle")
        } description: {
            Text(message)
        }
    case .loaded(let bookings) where bookings.isEmpty:
        ContentUnavailableView {
            Label("No bookings yet", systemImage: "calendar.badge.plus")
        } description: {
            Text("Book a walk from the Walkers tab and it'll show up here.")
        }
    case .loaded(let bookings):
        List(bookings) { booking in
            BookingRow(booking: booking) {
                Task { await model.cancel(booking) }
            }
        }
        .listStyle(.plain)
        .refreshable { await model.load() }
    }
}

// inside BookingRow:
private var canCancel: Bool {
    booking.status == .pending || booking.status == .confirmed
}`,
          caption: "Swift checks where-clause cases top to bottom — the empty case must come before the general one, or it would never match.",
        },
        {
          type: "quiz",
          q: "Which of an owner's bookings show a Cancel button?",
          choices: [
            "All of them — it's the owner's booking",
            "Only .pending ones — once a walker accepts, you're committed",
            ".pending and .confirmed ones — any time before the walk actually starts",
            ".completed ones — so you can clear out old rows",
          ],
          answer: 2,
          explain: "`canCancel` is `status == .pending || status == .confirmed`. Before the walk starts, you can back out; once it's in progress, completed, or already cancelled, the button never renders.",
          nudge: "Re-read `canCancel` in the excerpt above — it's a one-line answer.",
        },
      ],
    },
    // ────────────────────────────────────────────────────────────────────
    {
      id: "closing-the-loop",
      title: "The Walker's Side: Closing the Loop",
      steps: [
        {
          type: "text",
          md: [
            "## A booking is a tiny state machine",
            "Five statuses, and only a few legal moves between them:",
            "- `.pending` —**accept**→ `.confirmed`, or —**decline**→ `.cancelled`\n- `.confirmed` —**start**→ `.inProgress`\n- `.inProgress` —**complete**→ `.completed`\n- `.pending` / `.confirmed` —owner **cancel**→ `.cancelled`",
            "The backend is the referee — it rejects illegal moves — and the whole client side of it is one `APIClient` method: `transitionBooking(id:action:)`, which POSTs to `/bookings/{id}/{action}` where the action string is `accept`, `decline`, `start`, or `complete`.",
            "Walkers see their walks through a different endpoint, too: `assignedBookings()` hits `/bookings/assigned` — the bookings assigned **to** them, rather than the ones they created. Here's their view model, from the top of `WalkerHomeView.swift`:",
          ],
        },
        {
          type: "code",
          title: "Features/Walker/WalkerHomeView.swift (excerpt)",
          source: String.raw`@MainActor
@Observable
final class WalkerViewModel {
    enum ViewState { case loading, loaded([Booking]), failed(String) }
    private(set) var state: ViewState = .loading
    private(set) var profile: Walker?

    func load() async {
        state = .loading
        async let bookingsCall = APIClient.shared.assignedBookings()
        async let profileCall = APIClient.shared.walkerProfile()
        profile = try? await profileCall
        if let bookings = try? await bookingsCall {
            state = .loaded(bookings.sorted { $0.startTime < $1.startTime })
        } else {
            state = .failed("Couldn't load your walks. Pull to refresh.")
        }
    }

    func act(_ booking: Booking, _ action: String) async {
        _ = try? await APIClient.shared.transitionBooking(id: booking.id, action: action)
        await load()
    }
}`,
          caption: "The profile-editing method is trimmed here. Spot the sort: < instead of the owner's > — soonest walk first, because for a walker this list is a to-do list, not a history.",
        },
        {
          type: "text",
          md: [
            "### `async let` — two requests at once, again",
            "This screen needs two things at launch: the assigned walks *and* the walker's own profile. Written as two plain `await`s, the second request wouldn't even start until the first finished — you'd pay for both, back to back. **`async let`** — Module 9's parallel-requests tool, doing here for two calls what Home did for four — kicks each call off *immediately* and keeps going without waiting. You only pay the `await` later, at the moment you actually read the value. Both requests are in flight together, and the screen is ready in the time of the *slower* one instead of the *sum*.",
            "Both reads use `try? await` — Module 7's `try?`, \"give me `nil` instead of throwing\": a failed profile fetch just leaves `profile` as `nil`, and the screen renders without the price line rather than failing entirely.",
            "`act(_:_:)` is refreshingly blunt: fire the transition, ignore the returned booking (`_ =` is Swift for \"I know there's a result; I don't want it\"), and re-`load()` the whole list. With a handful of walks, re-fetching is the simplest correct thing — no index bookkeeping like `cancel()` needed.",
          ],
        },
        {
          type: "exercise",
          title: "Fire both requests at once",
          prompt: [
            "`load()` lost its two kick-off lines. Start **both** network calls before either is awaited, using `async let`. The code below the marker already awaits `profileCall` and `bookingsCall`, so use exactly those names — the calls are `APIClient.shared.assignedBookings()` and `APIClient.shared.walkerProfile()`.",
          ],
          starter: String.raw`func load() async {
    state = .loading
    // your code here
    profile = try? await profileCall
    if let bookings = try? await bookingsCall {
        state = .loaded(bookings.sorted { $0.startTime < $1.startTime })
    } else {
        state = .failed("Couldn't load your walks. Pull to refresh.")
    }
}`,
          solution: String.raw`func load() async {
    state = .loading
    async let bookingsCall = APIClient.shared.assignedBookings()
    async let profileCall = APIClient.shared.walkerProfile()
    profile = try? await profileCall
    if let bookings = try? await bookingsCall {
        state = .loaded(bookings.sorted { $0.startTime < $1.startTime })
    } else {
        state = .failed("Couldn't load your walks. Pull to refresh.")
    }
}`,
          checks: [
            { re: /async let bookingsCall=APIClient\.shared\.assignedBookings\(\)/, hint: "One line per request, starting with `async let` — the bookings one binds `bookingsCall` to the `assignedBookings()` call." },
            { re: /async let profileCall=APIClient\.shared\.walkerProfile\(\)/, hint: "Same shape for the profile: `async let profileCall = …` calling `walkerProfile()`." },
          ],
          mustNot: [
            { re: /(?:try\?|try|await)[^\n]{0,20}assignedBookings/, hint: "No `try`/`await` on these lines — that would run the calls one after the other. `async let` alone starts the call; the awaiting happens below, where the values are read." },
          ],
          success: "Both requests now race down the network together. `async let` is the lightest tool in Swift concurrency — you'll reach for it any time a screen needs several independent fetches.",
        },
        {
          type: "code",
          title: "Features/Walker/WalkerHomeView.swift (WalkRow's actions)",
          source: String.raw`@ViewBuilder
private var actions: some View {
    HStack(spacing: 8) {
        switch booking.status {
        case .pending:
            actionButton("Accept", "accept", filled: true)
            actionButton("Decline", "decline", filled: false)
        case .confirmed:
            actionButton("Start walk", "start", filled: true)
        case .inProgress:
            Button(action: onTrack) {
                HStack(spacing: 5) {
                    Image(systemName: "location.fill").font(.system(size: 10))
                    Text("Stream GPS").font(.dm(12, .semibold))
                }
                .foregroundStyle(Brand.onInverse)
                .padding(.horizontal, 14).frame(height: 34)
                .background(Brand.signalGreen)
                .clipShape(RoundedRectangle(cornerRadius: 9, style: .continuous))
            }
            actionButton("Complete", "complete", filled: true)
        case .completed, .cancelled:
            EmptyView()
        }
    }
    .padding(.top, 2)
}`,
          caption: "The state machine, rendered: each status offers exactly its legal moves. EmptyView() renders nothing — how you say \"no actions\" in a spot that must return a view. Stream GPS is Module 11's story.",
        },
        {
          type: "quiz",
          q: "A walker taps **Accept** on a pending walk. `act` runs and the list reloads. What does that row offer now?",
          choices: [
            "Accept and Decline again, until the owner confirms",
            "A \"Start walk\" button — the booking came back .confirmed",
            "\"Stream GPS\" and \"Complete\" — the walk is now in progress",
            "Nothing — accepted walks leave the walker's list",
          ],
          answer: 1,
          explain: "`accept` moves `.pending` → `.confirmed`, `act` re-loads, and the `switch` in `actions` renders the `.confirmed` case: a single \"Start walk\" button. The UI never decides the status — it just draws whatever the server said.",
          nudge: "Follow the state machine: where does `accept` land you, and what does that `case` render?",
        },
        {
          type: "text",
          md: [
            "### The supporting cast",
            "Two more screens round out the loop, and you can already read every line of them. **`PetsView`** is where owners manage their dogs — an `@Observable` view model, a `ViewState` switch, an add-pet sheet built on `Form`, and swipe-to-delete via `.onDelete` on the list's `ForEach`. It matters here because the booking form's pet `Picker` reads this exact list: add Mochi once, and every future booking is two taps.",
            "**`ProfileView`** is the account hub: who's signed in, their pets, a \"Your bookings\" button that presents `BookingsView` in a sheet, and log out. No new Swift at all — sheets, callbacks, and `.task`, the same parts, rearranged.",
            "That's the whole loop on paper. Last step: watch it run for real, playing both sides yourself.",
          ],
        },
        {
          type: "xcode",
          title: "Run the full loop — be the owner AND the walker",
          intro: ["Backend first, then the app, then both sides of one booking:"],
          items: [
            "Terminal tab 1: `cd apps/backend && uv run fastapi dev` — leave it running.",
            "Terminal tab 2: `cd apps/ios && xcodegen generate && open PawWalk.xcodeproj`, pick a simulator, **⌘R**.",
            "Log in as the demo owner — `demo@pawwalk.app` / `PawwalkDemo1!` — open the profile screen, and check **Manage pets**: Mochi is already there, so your booking form will show the pet Picker, not the free-text field.",
            "Book a walk with **Sam Rivera**: pick a start time (try dragging to yesterday — the DatePicker won't let you), tap **45 min** on the segmented control, then **Book**. The sheet closes and your bookings list opens with the new walk wearing a PENDING badge.",
            "Log out, then log in as Sam: `sam@pawwalk.app` / `PawwalkDemo1!`. You land on the walker dashboard — your booking is there with **Accept** / **Decline**.",
            "Tap **Accept** (badge flips to CONFIRMED, button becomes **Start walk**), then **Start walk**, then **Complete**. You just walked the whole state machine.",
            "Log out, log back in as `demo@pawwalk.app`, and open your bookings: COMPLETED. Owner → backend → walker → backend → owner. The loop is closed.",
          ],
        },
      ],
    },
  ],
});
