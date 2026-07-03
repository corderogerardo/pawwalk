// Module 00 — Welcome & setup (Android track). See ../lessons/FORMAT.md and
// ./FORMAT-KOTLIN.md for the schema and Kotlin-specific traps.
window.COURSE = window.COURSE || [];
window.COURSE.push({
  id: "welcome-android",
  title: "Welcome & Setup",
  emoji: "🤖",
  lang: "kotlin",
  lessons: [
    {
      id: "what-you-are-building",
      title: "What you're going to build",
      steps: [
        {
          type: "text",
          md: [
            "## Welcome to PawWalk Academy — Android edition",
            "By the end of this course you will have built **PawWalk** — a real Android app where dog owners find walkers, book and pay for walks, and watch their dog's walk live on a map with GPS. It's not a toy: the finished app already lives in this repository at `apps/android`, and every lesson here teaches you to rebuild a real piece of it, file by file.",
            "You need **zero** Kotlin, Android, or Jetpack Compose knowledge to start. We begin with \"what is a variable\" and end with an AI assistant that can draft a booking for you.",
            "> Already done the iOS track? Great — the concepts rhyme on purpose (`let` → `val`, `@State` → `remember`), so a lot of this will feel like a second pass. Never touched Swift either? Also fine — this course assumes nothing.",
            "## The app, in one screenshot tour",
            "- **Auth** — sign up / log in as a dog *owner* or a *walker*. Sessions survive app restarts thanks to encrypted on-device storage.\n- **Home** — a designed dashboard with your walk stats and recent walks.\n- **Walkers** — browse walkers, their ratings and prices, and book one.\n- **Bookings** — create a booking, watch its status move from *pending* → *confirmed* → *in progress* → *completed*.\n- **Live tracking** — a screen showing the walk happening in real time, fed by GPS.\n- **AI assistant** — chat with an assistant that can draft a booking for you.",
            "## How the pieces talk",
            "The Android app is a *client*. It talks HTTP + JSON to a Python backend (FastAPI) that owns the database. The backend is already built and already running in this repo — your job in this course is the Android side. It's the exact same backend the iOS app talks to.",
            "> You'll see the phrase **API contract** a lot. It's the agreement about exactly what JSON the backend sends and expects — written down in `docs/API-CONTRACT.md`. The Kotlin code you write will mirror it precisely.",
          ],
        },
        {
          type: "code",
          title: "Your first look at Kotlin — MainActivity.kt (trimmed)",
          source: String.raw`class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        TokenStore.init(this)
        enableEdgeToEdge()
        setContent {
            PawWalkTheme {
                Surface(Modifier.fillMaxSize(), color = Hud.colors.canvas) {
                    val authViewModel: AuthViewModel = viewModel()
                    val signedIn by authViewModel.signedIn.collectAsState()
                    // …decide which screen to show based on auth + role…
                }
            }
        }
    }
}`,
          caption: "This is the real entry point of the app, trimmed to the shape that matters. By the end of this course you'll understand — and have retyped — pieces of every line here.",
        },
        {
          type: "quiz",
          q: "Who owns the database in PawWalk?",
          choices: [
            "The Android app stores everything on the phone",
            "The Python backend — the Android app is a client that talks to it over HTTP",
            "Google Play services",
            "The database lives inside Android Studio",
          ],
          answer: 1,
          explain: "The Android app never touches the database directly — it sends and receives JSON over HTTP. That separation is why the same backend also serves the iOS app.",
          nudge: "Think about what `docs/API-CONTRACT.md` is for — why would two different apps need a contract?",
        },
      ],
    },
    {
      id: "first-look-at-kotlin",
      title: "Your first look at Kotlin",
      steps: [
        {
          type: "text",
          md: [
            "## Reading MainActivity.kt, piece by piece",
            "Let's decode that file you just saw, one keyword at a time — no prior Kotlin needed.",
            "- **`class MainActivity : ComponentActivity()`** — declares a `class` named `MainActivity` that *inherits from* `ComponentActivity`, Android's base class for a screen with its own lifecycle. The colon means \"is a kind of.\"\n- **`override fun onCreate(savedInstanceState: Bundle?)`** — `fun` declares a function (Kotlin's word for what other languages call a method). `override` means this replaces a function `ComponentActivity` already defines — Android calls `onCreate` once, when the screen is first created. The `?` after `Bundle` means the parameter is *nullable*: it might be a `Bundle`, or it might be `null`. Much more on that in Module 2.\n- **`setContent { … }`** — the bridge into Jetpack Compose. Everything inside those curly braces describes the UI declaratively — you say *what* the screen looks like for the current state, not a sequence of steps to build it.\n- **`PawWalkTheme { … }`, `Surface(...)`** — these are `@Composable` functions: ordinary Kotlin functions marked as UI-describing. Compose calls them to draw the screen, and re-calls them (\"recomposes\") whenever the state they read changes.",
            "## Compose vs SwiftUI, side by side",
            "If you've done (or plan to do) the iOS track, the ideas map almost one-to-one:",
            "| Concept | SwiftUI | Jetpack Compose |\n|---|---|---|\n| UI building block | `struct` conforming to `View` | `@Composable` function |\n| Declare a constant | `let` | `val` |\n| Declare a variable | `var` | `var` |\n| Local UI state | `@State` | `remember { mutableStateOf(...) }` |\n| Re-render on state change | automatic re-render | recomposition |\n| Vertical stack | `VStack` | `Column` |\n| Horizontal stack | `HStack` | `Row` |\n| String interpolation | `\"\\(name)\"` | `\"$name\"` |",
            "Same job, different spelling. You'll see this table's rows again as real code throughout the course.",
          ],
        },
        {
          type: "quiz",
          q: "In `override fun onCreate(savedInstanceState: Bundle?)`, what does the `?` after `Bundle` mean?",
          choices: [
            "It's a typo",
            "The parameter is nullable — it might be a Bundle, or it might be null",
            "It marks the function as optional to call",
            "It means the function returns a Bundle",
          ],
          answer: 1,
          explain: "Kotlin makes nullability part of the type: `Bundle` can never be null, `Bundle?` might be. Android passes `null` here on a fresh launch, and a real `Bundle` when restoring after the OS killed the app.",
          nudge: "Kotlin puts nullability right in the type name — what job would a `?` do there?",
        },
        {
          type: "exercise",
          title: "Try the code editor",
          prompt: [
            "Let's test the editor with your first line of Kotlin. In Kotlin, `println` writes a line of text to the console, and text goes in double quotes.",
            "Declare a `val` named `greeting` holding the text `PawWalk`, then print exactly: `Hello, PawWalk!` using a string template (`$greeting`, not string concatenation).",
          ],
          starter: String.raw`// Type your two lines of Kotlin below
`,
          solution: String.raw`val greeting = "PawWalk"
println("Hello, $greeting!")`,
          checks: [
            { re: /val greeting="PawWalk"/, hint: "Declare it as `val greeting = \"PawWalk\"` — no type annotation needed, Kotlin infers it's a String." },
            { re: /println\("Hello,\$greeting!"\)/, hint: "The shape is `println(\"Hello, $greeting!\")` — reference the constant with `$greeting` right inside the double-quoted string, no parentheses needed around a simple name." },
          ],
          success: "That's your first two lines of Kotlin — a `val` and a string template. The editor checks your code as you'd expect from here on.",
        },
      ],
    },
    {
      id: "how-this-course-works",
      title: "How this course works",
      steps: [
        {
          type: "text",
          md: [
            "## Learning by typing",
            "Reading about code teaches you to *recognize* it. **Typing** code teaches you to *write* it. So this course makes you type — a lot. Each lesson mixes four kinds of steps:",
            "- **Explanations** — short, plain-English. No wall of jargon.\n- **Code to read** — real files from the PawWalk repo, syntax-highlighted.\n- **Quick checks** — one multiple-choice question to make sure an idea landed.\n- **Write the code** — an editor where you type Kotlin and the course checks it.",
            "The **Continue** button under each step unlocks the next one. Quizzes and exercises must be completed before you can continue — that's the point.",
            "> Your progress (including code you type) is saved in your browser automatically, separately from the iOS course — the two live side by side. Close the tab, come back tomorrow, and you'll be right where you left off.",
          ],
        },
        {
          type: "text",
          md: [
            "## When you get stuck",
            "Fail a check twice and an **\"I'm stuck — show the solution\"** link appears. Using it is fine — but *type the solution out yourself* instead of pasting. The whole value is in your fingers learning the syntax.",
            "Some steps are real-world checklists — tasks on your own machine, like running the app on an emulator. The browser can't verify those, so you check them off yourself.",
          ],
        },
        {
          type: "quiz",
          q: "What's the recommended way to use the \"show the solution\" feature?",
          choices: [
            "Copy-paste the solution to move on quickly",
            "Read it, then type it out yourself in the editor",
            "Never use it — struggling for hours builds character",
            "Skip the exercise entirely",
          ],
          answer: 1,
          explain: "Getting unstuck fast is good; typing it yourself is what makes it stick. Struggle a little, then look, then type.",
        },
      ],
    },
    {
      id: "set-up-your-machine",
      title: "Set up your machine",
      steps: [
        {
          type: "text",
          md: [
            "## The tools",
            "Android development needs one big tool and a couple of small ones, all free, on Mac, Windows, or Linux:",
            "- **Android Studio** — Google's IDE. It bundles the Kotlin compiler, the Android SDK, and the emulator (a virtual Android phone that runs on your computer). It's a big download, so start it first.\n- **A Pixel emulator (API 36)** — Android Studio creates this for you; no physical phone required.\n- **Gradle** — the build tool. You never install it by hand: opening the project in Android Studio downloads the exact version pinned in this repo and syncs automatically.",
            "The backend also needs **uv** (a fast Python package manager) — one install command and you're done.",
          ],
        },
        {
          type: "xcode",
          label: "Over to Android Studio",
          title: "Install everything",
          intro: ["Work through these on your machine. The Android Studio download can run while you do the rest."],
          items: [
            "Install **Android Studio** from [developer.android.com/studio](https://developer.android.com/studio). Open it once after installing to run through its setup wizard (it downloads the Android SDK).",
            "Open the `apps/android` folder in Android Studio (**File → Open**) and let **Gradle sync** finish — a progress bar at the bottom of the window. First sync can take a few minutes.",
            "Open **Device Manager** (right-hand sidebar) → **Create device** → pick a **Pixel** → choose the **API 36** system image → **Finish**.",
            "Install uv: `curl -LsSf https://astral.sh/uv/install.sh | sh` (from [docs.astral.sh/uv](https://docs.astral.sh/uv)).",
            "In a terminal, `cd` into the repo, then run `cd apps/backend && uv sync` to install the backend's dependencies.",
          ],
        },
        {
          type: "quiz",
          q: "Why don't you install Gradle yourself before opening the project?",
          choices: [
            "Gradle isn't needed for Android development",
            "Android Studio downloads the exact Gradle version this repo is pinned to, automatically, on first sync",
            "Gradle only works on Linux",
            "The emulator replaces Gradle entirely",
          ],
          answer: 1,
          explain: "The repo pins an exact Gradle + Android Gradle Plugin version in `gradle/libs.versions.toml`. Opening the project and syncing fetches precisely that version — no manual install, no version mismatch.",
        },
      ],
    },
    {
      id: "run-pawwalk",
      title: "Run PawWalk for the first time",
      steps: [
        {
          type: "text",
          md: [
            "## Two processes, one app",
            "To see PawWalk working you run two things: the **backend** (a local web server on port 8000) and the **Android app** (in the emulator). Here's the one Android-specific wrinkle worth knowing before you run anything:",
            "> The emulator is its own little virtual machine — from its point of view, *your* computer isn't `localhost`, it's a separate machine reachable at the special address **`10.0.2.2`**. So the app is configured with `API_BASE_URL = \"http://10.0.2.2:8000\"` (you'll find this in `BuildConfig`, generated from `app/build.gradle.kts`) instead of `http://localhost:8000`. Same backend, same port — just a different address because the emulator sits one network hop away.",
            "> Keep the backend terminal window open while you use the app — if it's not running, the app falls back to built-in sample data so it never looks broken, but you won't see live changes.",
          ],
        },
        {
          type: "xcode",
          label: "Over to Android Studio",
          title: "Run the app in Android Studio",
          intro: ["From the repository root:"],
          items: [
            "Terminal tab 1: `cd apps/backend && uv run fastapi dev` — leave it running. Open [http://localhost:8000/docs](http://localhost:8000/docs) and admire the auto-generated API docs.",
            "In Android Studio, make sure your Pixel API 36 emulator is selected in the device dropdown in the toolbar.",
            "Click the green ▶ **Run** button (or press **Shift+F10**) and wait for Gradle to build and the emulator to boot.",
            "Sign up as an owner in the app and look around.",
            "In the app, open the walkers list and confirm walkers load — that's live data from your backend, delivered over `10.0.2.2`.",
          ],
        },
        {
          type: "quiz",
          q: "The app shows sample data instead of real walkers — what's the most likely cause?",
          choices: [
            "The emulator has no network access at all",
            "The backend isn't running — `uv run fastapi dev` was stopped or never started",
            "Android Studio needs to be reinstalled",
            "You need to deploy the backend to the internet first",
          ],
          answer: 1,
          explain: "The app is built to never look broken — if it can't reach `10.0.2.2:8000`, it quietly falls back to sample data instead of crashing. 99% of the time that just means the backend process isn't running.",
          nudge: "Remember: two processes. Which one answers on port 8000?",
        },
        {
          type: "text",
          md: [
            "## You're ready",
            "You've seen the finished product and you have a working toolchain. Next up: the Kotlin language itself — starting from the very first `val`. Everything you learn will point straight back at code you just watched run.",
          ],
        },
        {
          type: "quiz",
          q: "Ready to write some Kotlin?",
          choices: ["Let's go 🤖", "I was born ready"],
          answer: 0,
          explain: "Off we go.",
          nudge: "There is no wrong answer here… well, almost.",
        },
      ],
    },
  ],
});
