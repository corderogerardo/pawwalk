// Module 04 — SwiftUI: First Screens. See FORMAT.md for the schema.
window.COURSE = window.COURSE || [];
window.COURSE.push({
  id: "swiftui-first-steps",
  title: "SwiftUI: First Screens",
  emoji: "🎨",
  lessons: [
    // ────────────────────────────────────────────────────────────
    {
      id: "declarative-ui",
      title: "Thinking in SwiftUI",
      steps: [
        {
          type: "text",
          md: [
            "## The one mental-model shift",
            "You know Swift. Now you'll put pixels on an iPhone screen — and there's exactly one big idea to absorb first.",
            "The old way to build UI is **imperative**: you give the screen orders, step by step. *Find the booking-status label. Set its text to \"confirmed\". Set its color to green.* And every place in your code where a booking can change, you must remember to go poke that label again — forget one spot and the screen shows stale, wrong data.",
            "SwiftUI is **declarative**: you never poke the screen. Instead you write a *description* of what the screen looks like **for a given state**. \"If the booking is confirmed, there's a green label saying confirmed.\" When the state changes, SwiftUI re-runs your description and updates the screen to match — automatically, everywhere, at once.",
            "> The slogan worth memorizing: **UI is a function of state.** Same state in, same pixels out. You manage the state; SwiftUI manages the pixels.",
          ],
        },
        {
          type: "code",
          title: "Your first SwiftUI view",
          source: String.raw`import SwiftUI

struct WelcomeBanner: View {
    var body: some View {
        Text("Welcome to PawWalk 🐾")
    }
}`,
          caption: "Six lines, and every one of them is Swift you already know: an import, a struct, a protocol conformance, a computed property.",
        },
        {
          type: "text",
          md: [
            "## Reading it line by line",
            "- `import SwiftUI` — loads Apple's UI framework, making `View`, `Text`, and everything else in this module available in the file. Plain Swift needed no imports; UI code always starts with this line.\n- `struct WelcomeBanner: View` — a screen piece is just a **struct** that conforms to the `View` protocol. You met protocols in Module 02; `View` requires exactly one thing…\n- `var body: some View { … }` — …a computed property named `body` that describes the view's content. SwiftUI calls `body` whenever it needs a fresh description — you never call it yourself. When state changes, `body` gets re-computed and the screen updates to match.",
            "## What is `some View`?",
            "`some View` is an **opaque return type** — it means \"some specific view type; the compiler figures out exactly which one.\" Once you start chaining modifiers, the true type of a view becomes a monster like `ModifiedContent<ModifiedContent<Text, …>, …>`. Nobody wants to type that. `some View` lets you promise \"this is *a* view\" while the compiler quietly tracks the exact type for you. That's the whole story — write it, don't fear it.",
          ],
        },
        {
          type: "quiz",
          q: "A PawWalk booking's status changes from \"pending\" to \"confirmed\". In SwiftUI, how does the label on screen update?",
          choices: [
            "You look up the label object and call setText(\"confirmed\") on it",
            "The state changes, SwiftUI re-computes `body`, and the fresh description shows the new text",
            "You must restart the app so the screen reloads",
            "Labels can't change after they're created",
          ],
          answer: 1,
          explain: "That's the declarative model: you never poke the label. State changes → `body` is re-computed → the screen is updated to match the new description.",
          nudge: "UI is a function of state. What happens when the input to a function changes?",
        },
        {
          type: "quiz",
          q: "What does `some View` in `var body: some View` mean?",
          choices: [
            "The body may return a different type of view every time it runs",
            "An optional view that might be nil",
            "One specific view type — the compiler infers exactly which, so you don't have to spell it out",
            "A protocol you still need to write an implementation for",
          ],
          answer: 2,
          explain: "It's an opaque return type: one concrete type, known to the compiler, hidden from you. Chained modifiers produce gnarly nested types — `some View` spares you from ever writing them.",
          nudge: "Think \"some *specific* view — compiler's problem, not mine.\"",
        },
        {
          type: "exercise",
          title: "Write your first view",
          prompt: [
            "Declare a struct called `PawBadge` that conforms to `View`. Its `body` should contain a single `Text(\"PawWalk\")`.",
            "That's the complete recipe for every SwiftUI view you'll ever write: struct + `View` + `body`.",
          ],
          starter: String.raw`import SwiftUI

// your code here
`,
          solution: String.raw`import SwiftUI

struct PawBadge: View {
    var body: some View {
        Text("PawWalk")
    }
}`,
          checks: [
            { re: /struct PawBadge:View\{/, hint: "A view is a struct that adopts the protocol: `struct PawBadge: View { … }`." },
            { re: /var body:some View\{/, hint: "Inside the struct, the one required member: `var body: some View { … }` — a computed property." },
            { re: /Text\("PawWalk"\)/, hint: "The body's content is `Text(\"PawWalk\")` — text goes in double quotes." },
          ],
          mustNot: [
            { re: /func body/, hint: "`body` is a computed *property*, not a function — use `var`, no parentheses." },
            { re: /class PawBadge/, hint: "SwiftUI views are structs, not classes — they're cheap descriptions, recreated all the time." },
          ],
          success: "That's the skeleton of every screen in PawWalk — HomeView, AuthView, the live map — they all start exactly like this.",
        },
      ],
    },
    // ────────────────────────────────────────────────────────────
    {
      id: "text-images-buttons",
      title: "Text, Images & Buttons",
      steps: [
        {
          type: "text",
          md: [
            "## Three views cover half the app",
            "Most of what you see in PawWalk is built from three basic views: `Text` shows words, `Image` shows pictures, `Button` responds to taps. Learn these and you can already sketch most screens.",
            "A bare `Text(\"…\")` renders in the default system font, black-or-white depending on dark mode. To style it, you attach **modifiers** — methods you chain onto the view with dots:",
          ],
        },
        {
          type: "code",
          title: "Text with modifiers",
          source: String.raw`Text("Maya is on the way!")
    .font(.headline)
    .foregroundStyle(.green)
    .padding()`,
          caption: "Each line indents under the view it modifies — that's just formatting convention; it's one long chained expression.",
        },
        {
          type: "text",
          md: [
            "## Modifiers return NEW views",
            "Here's the part that surprises people: `.padding()` doesn't reach into the text and change it. Views are structs — immutable descriptions. Instead, **each modifier returns a brand-new view that wraps the old one**. `Text → a font-styled wrapper → a colored wrapper → a padded wrapper.` You're building a little onion of views, outside-in.",
            "Two consequences worth filing away:",
            "- **Order can matter.** Padding *then* a background paints the background over the padded area; the reverse doesn't. (You'll use this constantly in Module 06.)\n- The dot-shorthand like `.headline` and `.green` is just enum-style member lookup you know from Module 02 — the full names are `Font.headline` and `Color.green`, and Swift infers the type from context.",
            "One more player: `Image(systemName: \"pawprint.fill\")` gives you an icon from **SF Symbols** — Apple's built-in library of 5,000+ icons that scale and weight themselves like text. PawWalk's paw prints, clocks, and map pins are all SF Symbols; no image files needed.",
          ],
        },
        {
          type: "quiz",
          q: "What does calling `.padding()` on a `Text` actually do?",
          choices: [
            "Mutates the Text in place and returns nothing",
            "Returns a new view that wraps the text with padding — the original Text is untouched",
            "Registers a padding setting that applies to every Text in the app",
            "Adds padding only if the text is too long",
          ],
          answer: 1,
          explain: "Views are immutable structs, so modifiers can't change them — each one returns a fresh wrapper view. Chaining modifiers builds a stack of wrappers, outside-in.",
          nudge: "Can a method mutate an immutable struct? So what must it return instead?",
        },
        {
          type: "exercise",
          title: "A walker's greeting",
          prompt: [
            "Maya is PawWalk's star walker. Fill in the body: a `Text(\"Hi! I'm Maya\")`, styled with `.font(.headline)` and given breathing room with `.padding()`.",
          ],
          starter: String.raw`struct WalkerGreeting: View {
    var body: some View {
        // your code here
    }
}`,
          solution: String.raw`struct WalkerGreeting: View {
    var body: some View {
        Text("Hi! I'm Maya")
            .font(.headline)
            .padding()
    }
}`,
          checks: [
            { re: /Text\("Hi!I'm Maya"\)/, hint: "Start with `Text(\"Hi! I'm Maya\")` — the modifiers chain onto it with dots." },
            { re: /\.font\(\.headline\)/, hint: "Chain `.font(.headline)` — note the dot before `headline` (it's shorthand for `Font.headline`)." },
            { re: /\.padding\(\)/, hint: "Add `.padding()` to the chain — with empty parentheses, it's a method call." },
          ],
          mustNot: [
            { re: /\.font\(headline\)/, hint: "`headline` needs its leading dot: `.font(.headline)` — the dot is the shorthand for `Font.headline`." },
          ],
          success: "Styled text in three chained calls. Every label in PawWalk is a variation on exactly this.",
        },
        {
          type: "text",
          md: [
            "## Buttons: a label plus an action",
            "A `Button` needs two things: what it looks like, and what happens on tap. The simplest form takes a text label in parentheses and the action as a **trailing closure** — the closure syntax you learned in Module 02, sitting in braces right after the call:",
          ],
        },
        {
          type: "code",
          title: "A button and an icon",
          source: String.raw`Image(systemName: "pawprint.fill")
    .foregroundStyle(.orange)

Button("Book walk") {
    print("Booking Maya…")
}`,
          caption: "The braces after Button are its action closure — SwiftUI runs it when the user taps. For now we just print; from Module 05 on, actions will change state.",
        },
        {
          type: "exercise",
          title: "Wire up a booking button",
          prompt: [
            "Fill in the body: a `Button` labeled `Book Maya` whose action prints `Booked!`.",
            "Remember the shape: label in parentheses, action in a trailing closure.",
          ],
          starter: String.raw`struct BookButton: View {
    var body: some View {
        // your code here
    }
}`,
          solution: String.raw`struct BookButton: View {
    var body: some View {
        Button("Book Maya") {
            print("Booked!")
        }
    }
}`,
          checks: [
            { re: /Button\("Book Maya"\)\{/, hint: "The shape is `Button(\"Book Maya\") { … }` — label in parentheses, then an open brace for the action." },
            { re: /print\("Booked!"\)/, hint: "Inside the braces, the action: `print(\"Booked!\")`." },
          ],
          mustNot: [
            { re: /Button\("Book Maya",print/, hint: "The action isn't a second argument inside the parentheses — it goes in a trailing closure *after* them: `Button(\"Book Maya\") { … }`." },
          ],
          success: "Label + trailing-closure action: that's the pattern behind every tappable thing in PawWalk, from \"Log in\" to \"Book walk\".",
        },
      ],
    },
    // ────────────────────────────────────────────────────────────
    {
      id: "stacks-and-layout",
      title: "Stacks: Laying Things Out",
      steps: [
        {
          type: "text",
          md: [
            "## Three stacks, all of layout",
            "One view per screen won't get you far. SwiftUI's layout system is built on three containers, each just a view that arranges its children:",
            "- **`VStack`** — stacks children **vertically**, top to bottom.\n- **`HStack`** — lines children up **horizontally**, left to right.\n- **`ZStack`** — **layers** children on top of each other, back to front (first child is at the back).",
            "You compose them by nesting: a screen is a `VStack` of rows, each row an `HStack` of an icon and some text. PawWalk's whole Home screen is stacks inside stacks.",
            "Both `VStack` and `HStack` take two optional parameters: `alignment` (how children line up on the cross axis — e.g. `.leading` for left-aligned in a VStack) and `spacing` (the gap *between* children, in points).",
          ],
        },
        {
          type: "code",
          title: "Stacks in the wild",
          source: String.raw`VStack(alignment: .leading, spacing: 8) {
    Text("Today's walk")
        .font(.headline)
    HStack(spacing: 4) {
        Image(systemName: "clock")
        Text("30 min")
    }
}`,
          caption: "A vertical stack of a title and a row; the row is a horizontal stack of an icon and a duration. Read layouts inside-out.",
        },
        {
          type: "quiz",
          q: "You want a walker's photo on the left with their name right next to it. Which container?",
          choices: [
            "VStack — it handles all directions",
            "HStack — children line up horizontally",
            "ZStack — the name sits on top of the photo",
            "You need a special PhotoRow view",
          ],
          answer: 1,
          explain: "Side by side means horizontal, and horizontal means `HStack`. (A ZStack would print the name *over* the photo — sometimes what you want, not here.)",
          nudge: "Which axis do \"left\" and \"next to\" describe?",
        },
        {
          type: "text",
          md: [
            "## Pushing, sizing, breathing",
            "Three more layout tools finish the kit:",
            "- **`Spacer()`** — an invisible view that expands to fill leftover room. Put one between two views in an `HStack` and it shoves them to opposite edges — that's how PawWalk puts a name on the left and a price on the right.\n- **`.frame(width:height:)`** — a modifier that gives a view an exact size. You'll see it in a second sizing a dot to 8 points.\n- **`.padding()`** — space *around* one view, versus **`spacing`**, the gap *between* siblings inside a stack. Padding belongs to a view; spacing belongs to the stack. Mixing these up is the classic layout bug.",
            "Now let's read real PawWalk code. `PulsingDot` is the little \"live\" radar dot you'll see next to GPS status all over the app — a `ZStack` of two circles. Two small newcomers in it: `Circle()` is a built-in shape view (like `Text`, but round — `.fill(color)` paints it), and `CGFloat` is just the decimal-number type UI code uses for sizes; treat it like `Double`.",
          ],
        },
        {
          type: "code",
          title: "Components/HUD.swift",
          source: String.raw`/// A status dot with an expanding "radar" pulse ring — the HUD's signature element.
struct PulsingDot: View {
    var color: Color
    var size: CGFloat = 8
    @State private var animate = false

    var body: some View {
        ZStack {
            Circle()
                .fill(color)
                .scaleEffect(animate ? 1.9 : 1.0)
                .opacity(animate ? 0 : 0.22)
            Circle().fill(color)
        }
        .frame(width: size, height: size)
        .onAppear {
            withAnimation(.easeOut(duration: 1.9).repeatForever(autoreverses: false)) {
                animate = true
            }
        }
    }
}`,
          caption: "Two Circles layered in a ZStack: the first (back) is the faint ring that grows and fades; the second (front) is the solid dot. The @State / withAnimation / .onAppear machinery is what makes it pulse — you'll meet all three in Module 05. Today, focus on the ZStack and the .frame sizing the whole thing.",
        },
        {
          type: "quiz",
          q: "In PulsingDot, why are the two Circles inside a ZStack?",
          choices: [
            "The pulse ring and the solid dot must be drawn on top of each other, and ZStack layers children back to front",
            "ZStack makes views animate automatically",
            "Circles only render inside a ZStack",
            "ZStack is faster than VStack",
          ],
          answer: 0,
          explain: "Z is the depth axis: the first Circle (the expanding, fading ring) sits at the back, and the solid dot is layered in front of it — one dot, one halo.",
          nudge: "V is vertical, H is horizontal… what axis is Z?",
        },
        {
          type: "exercise",
          title: "Build a walker card",
          prompt: [
            "Time to compose a real layout. Fill in the body of `WalkerCard`: an `HStack` containing an `Image(systemName: \"pawprint.fill\")`, then a `VStack(alignment: .leading)` with two texts — `Text(\"Maya\")` on top and `Text(\"$18 / 30 min\")` below.",
            "Icon on the left, a left-aligned column of name-over-price on the right — the exact shape of the walker rows you'll build for real in Module 09.",
          ],
          starter: String.raw`struct WalkerCard: View {
    var body: some View {
        // your code here
    }
}`,
          solution: String.raw`struct WalkerCard: View {
    var body: some View {
        HStack {
            Image(systemName: "pawprint.fill")
            VStack(alignment: .leading) {
                Text("Maya")
                Text("$18 / 30 min")
            }
        }
    }
}`,
          checks: [
            { re: /HStack(\([^)]*\))?\{/, hint: "Icon *beside* text means the outer container is horizontal: `HStack { … }`." },
            { re: /Image\(systemName:"pawprint\.fill"\)/, hint: "First child: `Image(systemName: \"pawprint.fill\")` — the SF Symbol name goes in quotes." },
            { re: /VStack\(alignment:\.leading[^)]*\)\{/, hint: "The two text lines stack vertically and hug the left edge: `VStack(alignment: .leading) { … }`." },
            { re: /Text\("Maya"\)Text\("\$18\/30 min"\)/, hint: "Inside the VStack: `Text(\"Maya\")` first, then `Text(\"$18 / 30 min\")` below it." },
          ],
          mustNot: [
            { re: /VStack\(alignment:\.leading[^)]*\)\{Image/, hint: "The pawprint sits *beside* the text column, not inside it — the Image is a direct child of the HStack." },
          ],
          success: "Stacks inside stacks — you just laid out the same shape as PawWalk's walker list rows. Layout is officially in your toolkit.",
        },
      ],
    },
    // ────────────────────────────────────────────────────────────
    {
      id: "app-entry-point",
      title: "How the App Starts",
      steps: [
        {
          type: "text",
          md: [
            "## Where does an app begin?",
            "You can write views all day, but *something* has to tell iOS which view appears when the user taps the PawWalk icon. That something is a struct conforming to the **`App`** protocol — the twin of `View`, one level up.",
            "- An `App` has a `body` too, but its type is **`some Scene`**, not `some View`. A **scene** is a chunk of UI the *system* manages — on iPhone, essentially \"the app's window\".\n- **`WindowGroup`** is the scene you'll use: \"give my content a window to live in.\" Whatever view you put inside it becomes the root of everything on screen.\n- **`@main`** is an attribute that marks the entry point: \"iOS, start *here*.\" Exactly one type per app gets it.",
            "PawWalk's entire entry point is 14 lines. Here it is, for real:",
          ],
        },
        {
          type: "code",
          title: "PawWalkApp.swift",
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
          caption: "You saw this file on day one. Now you can actually read most of it.",
        },
        {
          type: "text",
          md: [
            "## Line by line",
            "- `@main struct PawWalkApp: App` — the entry point: a struct conforming to `App`, marked `@main`.\n- `@State private var auth = AuthSession()` — the app creates one shared login-state object. `@State` is Module 05's headline act — for now, read it as \"a stored value SwiftUI watches\".\n- `var body: some Scene { WindowGroup { … } }` — the app's one window.\n- `ContentView()` — the **root view**. Every screen in PawWalk lives somewhere inside it.\n- `.environment(auth)` — shares the auth object with every view downstream (Module 05).\n- `.task { await auth.restore() }` — kicks off async work when the view appears; the `await` is the async/await you learned in Module 03. What `restore()` restores — a saved login from the Keychain — is Module 08's story.",
            "So the honest summary: three lines here are Module 05/08 machinery, and everything else you fully understand today.",
          ],
        },
        {
          type: "quiz",
          q: "The PawWalk project has dozens of structs. How does iOS know PawWalkApp is where the app starts?",
          choices: [
            "It picks the struct whose name ends in \"App\"",
            "The `@main` attribute marks it as the entry point",
            "It's the first file alphabetically",
            "WindowGroup registers it at runtime",
          ],
          answer: 1,
          explain: "`@main` is the marker — exactly one type per app carries it. The \"App\" in the name is just a friendly convention.",
          nudge: "There's one attribute in the file whose whole job is \"start here\".",
        },
        {
          type: "code",
          title: "ContentView.swift",
          source: String.raw`import SwiftUI

/// Root view. Gated on AuthSession: signed out shows AuthView, signed in
/// shows the designed Home screen (with its own HUD tab bar), which presents
/// Live GPS tracking. Light/dark follow the system appearance via the Brand
/// color tokens.
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
          caption: "The root view is a traffic cop: plain if/else deciding which screen exists. @Environment (receiving the shared auth object) is Module 05; the Brand colors are Module 06; Group is just a container that lets modifiers apply to whichever branch renders; .tint sets the accent color for everything inside, and .ignoresSafeArea lets the loading color flood the whole screen, notch included.",
        },
        {
          type: "text",
          md: [
            "## Declarative, in the wild",
            "Look at what ContentView's body *is*: an `if/else` over state. Signed out? The body describes `AuthView`. Signed in as a walker? `WalkerHomeView`. Nobody ever \"navigates away from the login screen\" — when `auth.signedIn` flips to true, the body re-computes and the login screen simply *stops existing*. That's the Lesson 1 mental model running the entire app.",
            "## #Preview and the canvas",
            "The block at the bottom — `#Preview { … }` — is a macro that tells Xcode: \"render this view live in the **canvas**, the preview panel beside the editor.\" You edit code on the left, the pixels update on the right, no simulator launch needed. Previews never ship to users; they're purely a development tool.",
            "And here's a pop quiz the file itself sets up: what does *this* preview show? A fresh `AuthSession` starts with `isRestoring` set to `true`, and nothing in a preview calls `restore()` — so the if/else lands on the **first** branch, and the canvas shows a blank `Brand.canvas` color. Not the login screen! Reading the state tells you the pixels. (The login screen has its own `#Preview`, at the bottom of AuthView.swift.)",
          ],
        },
        {
          type: "quiz",
          q: "What does the `#Preview` block at the bottom of ContentView.swift do?",
          choices: [
            "Adds a hidden demo mode users can unlock",
            "Runs the view's unit tests",
            "Caches the view so the app launches faster",
            "Renders the view live in Xcode's canvas while you edit — a dev-only tool that never ships",
          ],
          answer: 3,
          explain: "It's for you, not for users: instant visual feedback next to your code. Nearly every view file in PawWalk ends with one.",
          nudge: "The name says it — who needs a *preview* of a screen, the user or the developer?",
        },
        {
          type: "exercise",
          title: "Type the minimal App",
          prompt: [
            "Write the smallest possible PawWalk entry point from memory: a struct `PawWalkApp` conforming to `App`, marked `@main`, whose `body` is `some Scene` containing a `WindowGroup` with a `ContentView()` inside.",
            "This is the real file minus the three Module 05/08 lines — the skeleton every SwiftUI app on Earth shares.",
          ],
          starter: String.raw`import SwiftUI

// your code here
`,
          solution: String.raw`import SwiftUI

@main
struct PawWalkApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}`,
          checks: [
            { re: /@main/, hint: "Mark the struct with `@main` on the line above it — that's the \"start here\" flag." },
            { re: /struct PawWalkApp:App\{/, hint: "The entry point is `struct PawWalkApp: App { … }` — conforming to `App`, not `View`." },
            { re: /var body:some Scene\{/, hint: "An App's body produces a scene: `var body: some Scene { … }`." },
            { re: /WindowGroup\{ContentView\(\)\}/, hint: "Inside the body: `WindowGroup { ContentView() }` — a window wrapping the root view." },
          ],
          mustNot: [
            { re: /some View/, hint: "So close — an `App` body is a **Scene**, not a View. Change `some View` to `some Scene`." },
          ],
          success: "You just typed a real app entry point from memory. Everything PawWalk does hangs off these nine lines.",
        },
        {
          type: "xcode",
          title: "Run it, change it, see it",
          intro: [
            "Time to close the loop: run the real app, then prove to yourself that the UI is just the code you've been reading.",
          ],
          items: [
            "In Terminal, from the repo root: `cd apps/ios && xcodegen generate && open PawWalk.xcodeproj`.",
            "In Xcode's left-hand file navigator, open `PawWalk/Features/Auth/AuthView.swift` — the login screen. If the canvas isn't showing, turn it on with **Editor → Canvas** (⌥⌘↩) and watch the `#Preview` at the bottom of the file render it live — no simulator needed.",
            "Now press **⌘R** to run the full app in the Simulator. Since nobody's signed in, `ContentView`'s if/else lands on `AuthView` — the same login screen.",
            "Back in `AuthView.swift`, find the string `\"Welcome back.\"` (near the top). Change it to something of yours — say `\"Welcome back, boss.\"` — and watch the canvas update.",
            "Press **⌘R** again and read your own words on the login screen. That's the whole game: the screen is the code.",
            "Change the text back to `\"Welcome back.\"` so your repo stays clean.",
          ],
        },
      ],
    },
  ],
});
