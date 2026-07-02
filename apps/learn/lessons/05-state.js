// Module 05 — State & Data Flow. See FORMAT.md for the schema.
window.COURSE = window.COURSE || [];
window.COURSE.push({
  id: "state",
  title: "State & Data Flow",
  emoji: "🔄",
  lessons: [
    // ────────────────────────────────────────────────────────────
    {
      id: "state-basics",
      title: "@State: Views That Remember",
      steps: [
        {
          type: "text",
          md: [
            "## Views have no memory",
            "You know that a SwiftUI view is a struct, and that `body` describes what's on screen. Here's the catch: SwiftUI throws those structs away and rebuilds them *constantly* — every animation frame, every layout pass. A plain `var count = 0` inside a view would reset to 0 each time. Your view needs memory that survives.",
            "That's what `@State` is for. It's a **property wrapper** — an annotation you put in front of a property to give it extra behavior. `@State` tells SwiftUI: *store this value for me, outside the struct, and keep it alive no matter how many times the view is rebuilt.*",
            "> New term: **re-render** — SwiftUI calling `body` again to recompute what's on screen. You'll see the word a lot in this module.",
          ],
        },
        {
          type: "code",
          title: "A counter — the \"hello world\" of state",
          source: String.raw`struct WalkCounter: View {
    @State private var walksToday = 0

    var body: some View {
        VStack(spacing: 12) {
            Text("Walks today: \(walksToday)")
            Button("Add a walk") {
                walksToday += 1
            }
        }
    }
}`,
          caption: "Tap the button, the number on screen goes up. Nobody told the Text to update — that's the magic we unpack next.",
        },
        {
          type: "text",
          md: [
            "## The update loop",
            "When you change a `@State` value, SwiftUI notices, re-runs `body`, and redraws whatever changed. You never call a refresh function — you change the *data*, and the *screen follows*. That one idea is the heart of SwiftUI.",
            "Why `private`? Because `@State` is this view's private memory. No other view should reach in and change it — if outside code needs to affect it, there are better tools (coming up in this very module). Writing `@State private var` is the convention everywhere, including every PawWalk file.",
            "**The rule: `@State` is for view-local value types** — an `Int`, `String`, or `Bool` that only this one view cares about. The walker list shared across screens? Not `@State`'s job — hold that thought for lesson 3.",
          ],
        },
        {
          type: "quiz",
          q: "You tap \"Add a walk\" and `walksToday` goes from 0 to 1. What makes the Text on screen update?",
          choices: [
            "You must call `refresh()` on the Text",
            "SwiftUI notices the @State change and re-runs `body` automatically",
            "The Text re-reads the variable once per second",
            "Nothing — the screen shows 0 until the app restarts",
          ],
          answer: 1,
          explain: "Change the data, and SwiftUI recomputes `body` and redraws. That's the whole contract: your job is state, SwiftUI's job is the screen.",
          nudge: "Who owns the render loop — you or SwiftUI?",
        },
        {
          type: "exercise",
          title: "A walk-length picker",
          prompt: [
            "PawWalk walks come in 30, 45, and 60-minute lengths. Build the state behind a simple length picker.",
            "1. Declare a `@State` property called `minutes`, starting at `30` (let Swift infer the type).\n2. In the button's action, add `15` to it.",
          ],
          starter: String.raw`struct WalkLengthPicker: View {
    // your code here (the state property)

    var body: some View {
        VStack {
            Text("\(minutes) min walk")
            Button("+15 min") {
                // your code here (the action)
            }
        }
    }
}`,
          solution: String.raw`struct WalkLengthPicker: View {
    @State private var minutes = 30

    var body: some View {
        VStack {
            Text("\(minutes) min walk")
            Button("+15 min") {
                minutes += 15
            }
        }
    }
}`,
          checks: [
            { re: /@State (private )?var minutes(:Int)?=30/, hint: "The property wrapper goes in front of an otherwise normal declaration: `@State private var …`, starting at 30." },
            { re: /minutes\+=15|minutes=minutes\+15/, hint: "Inside the button's braces, bump `minutes` in place — the `+=` operator from Module 01 does it in one line." },
          ],
          mustNot: [
            { re: /let minutes/, hint: "`let` values can never change — state that changes must be a `var`." },
          ],
          success: "Tap +15 and the Text redraws with the new length — no refresh call in sight.",
        },
        {
          type: "quiz",
          q: "Which of these is the RIGHT job for `@State`?",
          choices: [
            "Whether this view is currently showing its filter options — a Bool only this view cares about",
            "The signed-in user, needed by every screen in the app",
            "The app's accent color, fixed at compile time",
            "The backend's database connection",
          ],
          answer: 0,
          explain: "View-local value types — that's the `@State` sweet spot. App-wide shared data (like the signed-in user) gets its own tools later in this module.",
          nudge: "The rule was: *view-local*, *value type*.",
        },
      ],
    },
    // ────────────────────────────────────────────────────────────
    {
      id: "bindings",
      title: "Bindings: Two-Way Connections",
      steps: [
        {
          type: "text",
          md: [
            "## Reading is easy — writing takes a Binding",
            "`Text(\"30 min walk\")` only *reads* state. A text field is different: it must read the current value **and write back** every character the user types. For that, SwiftUI has the **Binding** — a two-way connection to a value that lives somewhere else. Through a binding you can read the value and write it.",
            "Every `@State` property comes with a free binding, spelled with a `$` prefix. If `email` is the String, then `$email` is the `Binding<String>` — same value, plus write access.",
          ],
        },
        {
          type: "code",
          title: "Three controls, three bindings",
          source: String.raw`struct LoginForm: View {
    @State private var email = ""
    @State private var password = ""
    @State private var staySignedIn = true

    var body: some View {
        VStack(spacing: 12) {
            TextField("Email", text: $email)
            SecureField("Password", text: $password)
            Toggle("Stay signed in", isOn: $staySignedIn)
        }
    }
}`,
          caption: "`SecureField` is a TextField that masks what you type; `Toggle` is a switch that wants a Bool binding via `isOn:`. All three write straight back into the @State.",
        },
        {
          type: "quiz",
          q: "In `TextField(\"Email\", text: $email)`, what exactly is `$email`?",
          choices: [
            "A copy of the string at that moment",
            "A Binding<String> — read *and* write access to the `email` state",
            "A special string that happens to start with a dollar sign",
            "The placeholder text",
          ],
          answer: 1,
          explain: "You type a character → the field writes it back through the binding → the @State changes → `body` re-runs → the field shows the updated text. Two-way, and instant.",
          nudge: "One of the choices says \"two-way\" in different words.",
        },
        {
          type: "text",
          md: [
            "## @Binding: handing write access to a child view",
            "PawWalk's login screen, `AuthView`, owns the email and password state. But the styled input field is its own little view, `AuthField`, so the styling isn't written out for every field. Problem: if `AuthField` declared its own `@State private var text`, it would type into *its own copy* — `AuthView`'s `email` would stay `\"\"` forever.",
            "The fix is **@Binding**: a property wrapper that says *\"I don't own this value — my parent does. Hand me write access.\"* The parent passes `$email`, the child declares `@Binding var text: String`, and both now point at the same storage.",
            "> Bonus: the `$` prefix works on a `@Binding` property too — that's how a child forwards the same connection further down.",
          ],
        },
        {
          type: "code",
          title: "Features/Auth/AuthView.swift (excerpt)",
          source: String.raw`struct AuthView: View {
    @State private var mode: Mode = .login
    @State private var email = ""
    @State private var password = ""
    @State private var name = ""

    private var fields: some View {
        VStack(spacing: 12) {
            if mode == .signup {
                roleToggle
                AuthField(label: "Name", text: $name, textContentType: .name)
            }
            AuthField(label: "Email", text: $email, keyboard: .emailAddress, textContentType: .emailAddress)
            AuthField(label: "Password", text: $password, isSecure: true,
                      textContentType: mode == .login ? .password : .newPassword)
        }
    }
}`,
          caption: "`Mode` is a private enum (`.login` / `.signup`) — one screen serves both jobs. `textContentType` tells iOS which autofill to offer; the `?:` picks between the login and signup variants.",
        },
        {
          type: "code",
          title: "Features/Auth/AuthView.swift — the AuthField child (trimmed)",
          source: String.raw`private struct AuthField: View {
    let label: String
    @Binding var text: String
    var isSecure: Bool = false

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            MonoCaption(label, size: 9, tracking: 0.1)
            if isSecure {
                SecureField("", text: $text)
            } else {
                TextField("", text: $text)
            }
            Rectangle().fill(Brand.ink.opacity(0.18)).frame(height: 1)
        }
    }
}`,
          caption: "Trimmed — the real file also sets keyboard type and fonts (`MonoCaption` and `Brand` are PawWalk's design-system helpers). Note `$text`: the @Binding is forwarded straight into the real TextField.",
        },
        {
          type: "quiz",
          q: "Why does `AuthField` declare `@Binding var text` instead of `@State private var text`?",
          choices: [
            "@State only works with Strings",
            "The email lives in AuthView — AuthField needs write access to *that* value, not a private copy of its own",
            "@Binding renders faster than @State",
            "Child views aren't allowed to use @State",
          ],
          answer: 1,
          explain: "With its own @State, AuthField would happily collect your typing in a copy — and when you hit \"Log in\", AuthView would send an empty email to the backend. Ownership stays with the parent; the child borrows write access.",
          nudge: "Who owns the value — the parent or the child?",
        },
        {
          type: "exercise",
          title: "A notes field for the walker",
          prompt: [
            "PawWalk's booking form lets owners leave notes for the walker (\"Mochi pulls on the leash near squirrels\"). Build the state + field pair.",
            "1. Declare `@State private var notes` starting as the empty string `\"\"`.\n2. In `body`, add a `TextField` with the placeholder `Notes for your walker`, bound to `notes`.",
          ],
          starter: String.raw`struct BookingNotes: View {
    // your code here (the state)

    var body: some View {
        // your code here (the text field)
    }
}`,
          solution: String.raw`struct BookingNotes: View {
    @State private var notes = ""

    var body: some View {
        TextField("Notes for your walker", text: $notes)
    }
}`,
          checks: [
            { re: /@State private var notes(:String)?=""/, hint: "Same shape as the walk-length picker's state line — `@State private var …` — but this one starts as the empty string." },
            { re: /TextField\("Notes for your walker",text:\$notes\)/, hint: "`TextField` takes the placeholder string first, then `text:` with the binding — remember the `$`." },
          ],
          mustNot: [
            { re: /text:notes\)/, hint: "Plain `notes` hands over a read-only value. The `$` is what makes it a two-way Binding." },
          ],
          success: "Every character typed lands straight in `notes` — ready to send with the booking.",
        },
        {
          type: "exercise",
          title: "Borrow, don't own",
          prompt: [
            "Now the other direction. A booking form owns `@State private var repeatsWeekly = false` and renders this child as `WalkToggle(repeatsWeekly: $repeatsWeekly)`.",
            "Declare the single property `WalkToggle` needs so the *parent's* Bool flips when the toggle does. Call it `repeatsWeekly`, and give it an explicit type.",
          ],
          starter: String.raw`struct WalkToggle: View {
    // your code here (one property)

    var body: some View {
        Toggle("Repeat weekly", isOn: $repeatsWeekly)
    }
}`,
          solution: String.raw`struct WalkToggle: View {
    @Binding var repeatsWeekly: Bool

    var body: some View {
        Toggle("Repeat weekly", isOn: $repeatsWeekly)
    }
}`,
          checks: [
            { re: /@Binding var repeatsWeekly/, hint: "A child that borrows write access declares `@Binding var …` — no `private`, because the parent passes it in." },
            { re: /repeatsWeekly:Bool/, hint: "Give it an explicit type, `: Bool` — a @Binding has no default value to infer from." },
          ],
          mustNot: [
            { re: /@State/, hint: "@State would give WalkToggle its own separate Bool — the parent's value would never change." },
            { re: /=false/, hint: "A @Binding never has a default value — the parent always supplies the connection." },
          ],
          success: "Exactly the pattern AuthField uses for `text`. Parent owns, child borrows — data flows both ways.",
        },
      ],
    },
    // ────────────────────────────────────────────────────────────
    {
      id: "observable-viewmodels",
      title: "@Observable: Shared State That Announces Changes",
      steps: [
        {
          type: "text",
          md: [
            "## When state outgrows the view",
            "The Walkers screen shows a list fetched from the backend. That involves real logic: start a request, handle success, handle failure. Stuffing all of that into a view's `body` gets ugly fast — and the view can't be the only thing that ever needs the data.",
            "The PawWalk pattern is a **view model**: a class that owns a screen's data and the logic around it. The view's only job is to *display* whatever the view model says. It's a class — a reference type — because everyone who looks at it must see the *same one object*, not a copy.",
            "One problem remains: when a property of a plain class changes, SwiftUI has no idea. Enter **@Observable** — a macro from the Observation framework (iOS 17+). A **macro** is an annotation that writes boilerplate for you at compile time; this one makes the class *announce* its changes. SwiftUI then tracks exactly which properties each view reads, and re-renders a view only when one of *those* changes.",
          ],
        },
        {
          type: "quiz",
          q: "What does the `@Observable` macro do for a class?",
          choices: [
            "Makes the class run on a background thread",
            "Lets SwiftUI track which properties a view reads, and re-render that view when one of them changes",
            "Saves the class to disk automatically",
            "Turns the class into a struct",
          ],
          answer: 1,
          explain: "It's the modern (iOS 17+) replacement for the older `ObservableObject` + `@Published` you'll see in old tutorials — with the bonus that tracking is per-property, so fewer views re-render.",
          nudge: "The name says it: the class becomes observable. Who's watching?",
        },
        {
          type: "text",
          md: [
            "## Two more keywords on the class",
            "Every PawWalk view model opens with the same three-line stack, and each line earns its place:",
            "- `@MainActor` — the **main thread** is the one thread allowed to touch the screen. Async work can finish anywhere, so this attribute guarantees the class's properties are only ever read and written on the main thread. UI-safe by construction.\n- `@Observable` — the announcement machinery you just met.\n- `final class` — `final` just means \"no subclasses\"; a small clarity-and-speed favor to the compiler.",
          ],
        },
        {
          type: "exercise",
          title: "Type the view-model shell",
          prompt: [
            "Every view model in PawWalk starts the same way. Type the shell for the bookings screen: a `final class` named `BookingsViewModel`, marked `@MainActor` and `@Observable`, with an empty body `{ }` for now.",
          ],
          starter: String.raw`import Foundation
import Observation

// your code here`,
          solution: String.raw`import Foundation
import Observation

@MainActor
@Observable
final class BookingsViewModel {
}`,
          checks: [
            { re: /@MainActor/, hint: "Add `@MainActor` above the class so every property change happens on the UI thread." },
            { re: /@Observable/, hint: "Add `@Observable` so SwiftUI can watch the properties." },
            { re: /final class BookingsViewModel\{/, hint: "The declaration reads `final class BookingsViewModel { }`." },
          ],
          mustNot: [
            { re: /struct BookingsViewModel/, hint: "A view model must be a `class` — one shared object, not a copied value." },
          ],
          success: "That's the opening stanza of every view model in the app. Muscle memory acquired.",
        },
        {
          type: "code",
          title: "Features/Walkers/WalkersViewModel.swift",
          source: String.raw`import Foundation
import Observation

@MainActor
@Observable
final class WalkersViewModel {
    enum ViewState {
        case loading
        case loaded([Walker])
        case failed(String)
    }

    private(set) var state: ViewState = .loading

    func load() async {
        state = .loading
        do {
            let walkers = try await APIClient.shared.walkers()
            state = .loaded(walkers)
        } catch {
            state = .failed("Couldn't reach the server. Check your connection and try again.")
        }
    }
}`,
          caption: "The whole file. `APIClient.shared.walkers()` asks the backend for the walker list — you'll build APIClient itself in the networking module; for now it's just an async call that can throw.",
        },
        {
          type: "text",
          md: [
            "## One property, three impossible-to-mix states",
            "Look at `ViewState`: an enum with associated values — you've built these. The screen is *exactly one* of loading, loaded-with-walkers, or failed-with-a-message. Compare that to three separate properties (`isLoading: Bool`, `walkers: [Walker]`, `errorMessage: String?`), where nonsense combinations like \"loading AND showing an error\" are possible and *will* happen at 2am.",
            "And `private(set)`: anyone can **read** `state`, but only code *inside* the class can **write** it. Views display the state; they can't corrupt it. That's the whole data-flow contract of the screen in one keyword.",
          ],
        },
        {
          type: "quiz",
          q: "Why one `ViewState` enum instead of three properties — `isLoading: Bool`, `walkers: [Walker]`, `errorMessage: String?`?",
          choices: [
            "Enums use less memory than Bools",
            "With three separate properties the screen could be loading *and* showing an error at once — the enum makes exactly one state representable at a time",
            "SwiftUI can only observe enums",
            "Arrays can't be stored in classes",
          ],
          answer: 1,
          explain: "\"Make impossible states impossible\" — the enum turns a whole family of bugs into code that won't compile.",
          nudge: "What does `isLoading == true` while `errorMessage != nil` even mean?",
        },
        {
          type: "text",
          md: [
            "## Who owns the model? The view does",
            "The Walkers screen creates its model with — surprise — `@State`:",
            "`@State private var model = WalkersViewModel()`",
            "Here's the refined rule: **@State provides ownership** — it keeps the object alive across re-renders (remember, the struct is rebuilt constantly). **@Observable provides the change tracking.** Together: the view owns the model, the model announces changes.",
            "One last piece: `.task { await model.load() }`. The `.task` modifier runs async work when the view first appears — and cancels it if the view disappears. That's how the walker list starts loading the instant you open the screen.",
            "Three views in the next excerpt are new faces, not new ideas: `ProgressView(\"…\")` is the system loading spinner with a label, `ContentUnavailableView` is the system \"can't show this\" layout (icon + title + message), and `List` turns an array into scrollable rows. They each get real coverage later — today they're just what the three `ViewState` cases look like on screen.",
          ],
        },
        {
          type: "code",
          title: "Features/Walkers/WalkersView.swift (excerpt)",
          source: String.raw`struct WalkersView: View {
    @State private var model = WalkersViewModel()

    var body: some View {
        NavigationStack {
            content
                .navigationTitle("Find a walker")
                .task { await model.load() }
        }
    }

    @ViewBuilder
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
            }
        }
    }
}`,
          caption: "The `switch` is the enum's payoff: each case renders exactly one thing. `NavigationStack` (the title bar) and `@ViewBuilder` (lets a property return a different view type per branch) get proper treatment in later modules — the excerpt also omits the tap-to-book wiring, which is next lesson's sheet.",
        },
        {
          type: "quiz",
          q: "What does `.task { await model.load() }` do?",
          choices: [
            "Runs `load()` once every second",
            "Runs `load()` as async work when the view appears — and cancels it if the view goes away",
            "Blocks the UI until `load()` finishes",
            "Schedules `load()` for the next app launch",
          ],
          answer: 1,
          explain: "The screen shows the `.loading` case while the request runs, then re-renders when `state` changes — no spinner management, no callbacks.",
          nudge: "When does the walkers list start loading — and what happens if you close the screen mid-request?",
        },
        {
          type: "exercise",
          title: "Rebuild WalkersViewModel",
          prompt: [
            "Time to build the real thing. The shell and the `ViewState` enum are given — you write the state property and the body of `load()`.",
            "1. Declare `state`: type `ViewState`, starting as `.loading`, readable everywhere but settable only inside the class — that's `private(set)`.\n2. Inside `load()`, open a `do`/`catch`. In `do`: fetch with `try await APIClient.shared.walkers()` into a constant called `walkers`, then set `state` to `.loaded(walkers)`. In `catch`: set `state` to `.failed(...)` with the message `Couldn't reach the server. Check your connection and try again.`",
          ],
          starter: String.raw`@MainActor
@Observable
final class WalkersViewModel {
    enum ViewState {
        case loading
        case loaded([Walker])
        case failed(String)
    }

    // your code here (the state property)

    func load() async {
        state = .loading
        // your code here (do / catch)
    }
}`,
          solution: String.raw`@MainActor
@Observable
final class WalkersViewModel {
    enum ViewState {
        case loading
        case loaded([Walker])
        case failed(String)
    }

    private(set) var state: ViewState = .loading

    func load() async {
        state = .loading
        do {
            let walkers = try await APIClient.shared.walkers()
            state = .loaded(walkers)
        } catch {
            state = .failed("Couldn't reach the server. Check your connection and try again.")
        }
    }
}`,
          checks: [
            { re: /private\(set\)var state(:ViewState=\.loading|=ViewState\.loading)/, hint: "`private(set) var state: ViewState = .loading` — read anywhere, write only in here." },
            { re: /do\{let walkers(:\[Walker\])?=try await APIClient\.shared\.walkers\(\)/, hint: "Open a `do {` block; the first line inside stores the fetch in `let walkers`. The call is async AND can throw, so it needs both keywords: `try await`." },
            { re: /state=\.loaded\(walkers\)/, hint: "On success, wrap the result in the enum case: `state = .loaded(walkers)`." },
            { re: /catch\{state=\.failed\("/, hint: "`} catch { state = .failed(\"…\") }` — hand the view a human sentence, not a raw error dump." },
          ],
          mustNot: [
            { re: /try!/, hint: "`try!` crashes the app when the request fails — handling failure is exactly what the `catch` branch is for." },
          ],
          success: "That's the exact file at Features/Walkers/WalkersViewModel.swift — and the pattern every PawWalk screen's view model follows.",
        },
      ],
    },
    // ────────────────────────────────────────────────────────────
    {
      id: "environment-and-sheets",
      title: "@Environment & Presenting Screens",
      steps: [
        {
          type: "text",
          md: [
            "## One object, needed everywhere",
            "PawWalk has one object that nearly every screen cares about: `AuthSession`, the view model that knows who is signed in. The root view needs it to decide login-vs-home; the login screen calls its `logIn`; the profile screen shows its `currentUser`; the home screen greets them by name.",
            "You *could* pass it as an init parameter into every view, through every view in between — even views that don't use it. That's called **prop drilling**, and it turns every new screen into plumbing work.",
            "SwiftUI's fix is the **environment**: a bag of shared values that flows down the view tree. Inject an object once at the root with `.environment(object)`, and *any* descendant — child, grandchild, a sheet presented five levels deep — can ask for it by type. No plumbing in between.",
          ],
        },
        {
          type: "code",
          title: "PawWalkApp.swift — the injection",
          source: String.raw`import SwiftUI

@main
struct PawWalkApp: App {
    @State private var auth = AuthSession()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(auth)
                .task { await auth.restore() }
        }
    }
}`,
          caption: "You first saw this file in Module 00 — now every line reads. `@State` owns the AuthSession for the app's lifetime, `.environment(auth)` offers it to every view inside, and `.task` kicks off restoring a saved session at launch.",
        },
        {
          type: "text",
          md: [
            "## Reading it back out",
            "Any view under that root can declare:",
            "`@Environment(AuthSession.self) private var auth`",
            "The `AuthSession.self` part is the *type itself*, used as the lookup key — it means \"find me **the** AuthSession in the environment.\" No default value: the environment supplies the object.",
            "So what does `AuthSession` actually offer? It's the same `@MainActor @Observable final class` pattern you built last lesson — just for auth instead of walkers.",
          ],
        },
        {
          type: "code",
          title: "Services/AuthSession.swift (excerpt)",
          source: String.raw`@MainActor
@Observable
final class AuthSession {
    private(set) var currentUser: User?
    private(set) var isRestoring = true
    var errorMessage: String?

    var signedIn: Bool { currentUser != nil }

    func logOut() {
        TokenStore.clear()
        APIClient.shared.bearerToken = nil
        currentUser = nil
    }
}`,
          caption: "Excerpt — `restore()`, `logIn`, and `signUp` arrive in the auth module, and so does `TokenStore` (it saves the login token on the device; `logOut` clears it and drops the API token). The shape, though, you already know: `private(set)` state, a computed `signedIn`, one shared object.",
        },
        {
          type: "code",
          title: "ContentView.swift — the root gate",
          source: String.raw`import SwiftUI

struct ContentView: View {
    @Environment(AuthSession.self) private var auth

    var body: some View {
        Group {
            if auth.isRestoring {
                Brand.canvas.ignoresSafeArea()
            } else if auth.signedIn {
                if auth.currentUser?.role == .walker {
                    WalkerHomeView()
                } else {
                    HomeView()
                }
            } else {
                AuthView()
            }
        }
        .tint(Brand.accent)
    }
}

#Preview {
    ContentView()
        .environment(AuthSession())
}`,
          caption: "While restoring: a blank canvas. Signed in: Home (walker or owner flavor). Signed out: AuthView. When `auth.currentUser` changes, this view re-renders and the whole app pivots — that's @Observable + @Environment working together.",
        },
        {
          type: "quiz",
          q: "ContentView asks for `@Environment(AuthSession.self)`. What happens if NO ancestor ever called `.environment(auth)`?",
          choices: [
            "SwiftUI quietly creates a new AuthSession",
            "The property is nil",
            "The app crashes at runtime the moment the view reads it",
            "The compiler reports an error",
          ],
          answer: 2,
          explain: "An environment lookup by type is a promise, checked at runtime. That's why PawWalkApp injects at the root — and why `#Preview` at the bottom of ContentView.swift injects its own `AuthSession()`.",
          nudge: "Look at ContentView's `#Preview` — why does it bother calling `.environment(AuthSession())`?",
        },
        {
          type: "exercise",
          title: "Read the shared session",
          prompt: [
            "PawWalk's profile screen greets the user by name. Give `ProfileView` access to the shared session: declare a `private` property named `auth` that reads the `AuthSession` from the environment.",
          ],
          starter: String.raw`struct ProfileView: View {
    // your code here (one property)

    var body: some View {
        Text(auth.currentUser?.name ?? "Guest")
    }
}`,
          solution: String.raw`struct ProfileView: View {
    @Environment(AuthSession.self) private var auth

    var body: some View {
        Text(auth.currentUser?.name ?? "Guest")
    }
}`,
          checks: [
            { re: /@Environment\(AuthSession\.self\)/, hint: "The wrapper takes the type as its key: `@Environment(AuthSession.self)`." },
            { re: /private var auth/, hint: "Finish the declaration: `private var auth` — no default value; the environment supplies the object." },
          ],
          mustNot: [
            { re: /@State/, hint: "@State would create a brand-new AuthSession just for this view — you want the one shared object injected at the root." },
            { re: /=AuthSession\(\)/, hint: "Don't construct one — read the existing session from the environment." },
          ],
          success: "One line, and ProfileView sees the same session as every other screen — no init parameters, no plumbing.",
        },
        {
          type: "text",
          md: [
            "## Presenting screens: sheets",
            "Tap the profile button in PawWalk's tab bar and the profile screen slides up over Home. That's a **sheet** — a card presented over the current view, dismissed by swiping down. The recipe is two pieces you already own:",
            "1. A `@State` Bool: `@State private var showProfile = false`\n2. A modifier: `.sheet(isPresented: $showProfile) { ProfileView() }`",
            "Set the Bool to `true` and the sheet appears. Why a *binding* and not a plain Bool? Because dismissal is two-way: when the user swipes the sheet down, SwiftUI writes `false` back into your state. **fullScreenCover** follows the exact same recipe but covers the whole screen with no swipe-to-dismiss — PawWalk uses it for live GPS tracking, where a map deserves every pixel.",
          ],
        },
        {
          type: "text",
          md: [
            "## Closing from the inside",
            "From *inside* a presented screen, you can close yourself: declare `@Environment(\\.dismiss) private var dismiss`, then call `dismiss()`. The `\\.dismiss` spelling is a **key path** — system-provided environment values use key paths as keys, while your own objects (like AuthSession) use the `Type.self` form. PawWalk's `CreateBookingView` uses exactly this for its Cancel button: `Button(\"Cancel\") { dismiss() }`.",
          ],
        },
        {
          type: "code",
          title: "Features/Home/HomeView.swift (excerpt)",
          source: String.raw`struct HomeView: View {
    @Environment(AuthSession.self) private var auth
    @State private var model = HomeViewModel()
    @State private var showLive = false
    @State private var showBookings = false
    @State private var showProfile = false

    var body: some View {
        ZStack(alignment: .bottom) {
            // …the dashboard cards and tab bar (built in the Home module)…
        }
        .task { await model.load() }
        .fullScreenCover(isPresented: $showLive) {
            LiveTrackingView(bookingID: model.upcoming?.booking.id,
                             dogName: model.upcoming?.booking.dogName ?? model.pets.first?.name)
        }
        .sheet(isPresented: $showBookings) { BookingsView() }
        .sheet(isPresented: $showProfile) { ProfileView() }
    }
}`,
          caption: "Excerpt — and every line is now familiar: an environment read, an owned view model, one Bool per presentable screen. Buttons in the dashboard just set `showLive = true`; the modifiers do the presenting.",
        },
        {
          type: "quiz",
          q: "Why does `.sheet(isPresented:)` demand a Binding (`$showBookings`) rather than a plain Bool?",
          choices: [
            "All SwiftUI modifiers require Bindings",
            "When the user swipes the sheet down, SwiftUI needs to write `false` back into your state",
            "Bools can't be stored in @State",
            "It's only a naming convention",
          ],
          answer: 1,
          explain: "Two-way, one more time: you write `true` to present; SwiftUI writes `false` on dismiss. Your state and the screen can never disagree.",
          nudge: "Who sets the flag back to `false` when the user swipes the sheet away?",
        },
        {
          type: "exercise",
          title: "Wire up a sheet",
          prompt: [
            "Right after you book a walk, HomeView pops your bookings list up in a sheet — the `.sheet(isPresented: $showBookings)` line in the excerpt above. Build a standalone version: a button that presents the real `BookingsView`.",
            "1. In the button's action, set `showingBookings` to `true`.\n2. Attach a `.sheet` to the Button, driven by `showingBookings`, presenting `BookingsView()`.",
          ],
          starter: String.raw`struct BookingsButton: View {
    @State private var showingBookings = false

    var body: some View {
        Button("My bookings") {
            // your code here (flip the flag)
        }
        // your code here (the sheet)
    }
}`,
          solution: String.raw`struct BookingsButton: View {
    @State private var showingBookings = false

    var body: some View {
        Button("My bookings") {
            showingBookings = true
        }
        .sheet(isPresented: $showingBookings) {
            BookingsView()
        }
    }
}`,
          checks: [
            { re: /showingBookings=true/, hint: "The button's whole job: `showingBookings = true`." },
            { re: /\.sheet\(isPresented:\$showingBookings/, hint: "`.sheet(isPresented: $showingBookings) { … }` — attach it right after the Button's closing brace." },
            { re: /\{BookingsView\(\)\}/, hint: "Inside the sheet's trailing closure, return the screen to present: `BookingsView()`." },
          ],
          mustNot: [
            { re: /isPresented:showingBookings/, hint: "Missing `$` — the sheet needs a Binding so it can set the flag back to `false` on swipe-down." },
          ],
          success: "State in, screens out. You now hold the complete data-flow toolkit: @State, Bindings, @Observable view models, @Environment, and sheets — every screen in PawWalk is built from exactly these.",
        },
      ],
    },
  ],
});
