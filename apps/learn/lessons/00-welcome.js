// Module 00 — Welcome & setup. See FORMAT.md for the schema.
window.COURSE = window.COURSE || [];
window.COURSE.push({
  id: "welcome",
  title: "Welcome & Setup",
  emoji: "🐾",
  lessons: [
    {
      id: "what-you-are-building",
      title: "What you're going to build",
      steps: [
        {
          type: "text",
          md: [
            "## Welcome to PawWalk Academy",
            "By the end of this course you will have built **PawWalk** — a real iPhone app where dog owners find walkers, book and pay for walks, and watch their dog's walk live on a map with GPS. It's not a toy: the finished app already lives in this repository at `apps/ios`, and every lesson here teaches you to rebuild a real piece of it, file by file.",
            "You need **zero** Swift, SwiftUI, or iOS knowledge to start. We begin with \"what is a variable\" and end with WebSockets streaming GPS fixes onto a live map.",
            "## The app, in one screenshot tour",
            "- **Auth** — sign up / log in as a dog *owner* or a *walker*. Sessions survive app restarts thanks to the iOS Keychain.\n- **Home** — a designed dashboard with your walk stats, streaks, and recent walks with distance sparklines.\n- **Walkers** — browse walkers, their ratings and prices, and book one.\n- **Bookings** — create a booking, watch its status move from *pending* → *confirmed* → *in progress* → *completed*.\n- **Live tracking** — a map showing the walk happening in real time, fed by GPS over a WebSocket.\n- **AI assistant** — chat with an assistant that can draft a booking for you.",
            "## How the pieces talk",
            "The iPhone app is a *client*. It talks HTTP + JSON to a Python backend (FastAPI) that owns the database. The backend is already built and already running in this repo — your job in this course is the iOS side.",
            "> You'll see the phrase **API contract** a lot. It's the agreement about exactly what JSON the backend sends and expects — written down in `docs/API-CONTRACT.md`. The Swift code you write will mirror it precisely.",
          ],
        },
        {
          type: "code",
          title: "Your first look at Swift — PawWalkApp.swift (the whole file)",
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
          caption: "This is the *entire* entry point of the app — 14 lines. By Module 08 you'll understand (and have retyped) every character of it.",
        },
        {
          type: "quiz",
          q: "Who owns the database in PawWalk?",
          choices: [
            "The iPhone app stores everything on the phone",
            "The Python backend — the iPhone app is a client that talks to it over HTTP",
            "Apple's iCloud",
            "The database lives inside Xcode",
          ],
          answer: 1,
          explain: "The iOS app never touches the database directly — it sends and receives JSON over HTTP. That separation is why the same backend also serves the Android app.",
          nudge: "Think about what `docs/API-CONTRACT.md` is for — why would two programs need a contract?",
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
            "- **Explanations** — short, plain-English. No wall of jargon.\n- **Code to read** — real files from the PawWalk repo, syntax-highlighted.\n- **Quick checks** — one multiple-choice question to make sure an idea landed.\n- **Write the code** — an editor where you type Swift and the course checks it.",
            "The **Continue** button under each step unlocks the next one. Quizzes and exercises must be completed before you can continue — that's the point.",
            "> Your progress (including code you type) is saved in your browser automatically. Close the tab, come back tomorrow, and you'll be right where you left off.",
          ],
        },
        {
          type: "exercise",
          title: "Try the code editor",
          prompt: [
            "Let's test the editor with your first line of Swift. In Swift, `print` writes text to the console, and text goes in double quotes.",
            "Type a line that prints exactly: `Hello, PawWalk!`",
          ],
          starter: String.raw`// Type your line of Swift below
`,
          solution: String.raw`print("Hello, PawWalk!")`,
          checks: [
            { re: /print\("Hello,PawWalk!"\)/, hint: "The shape is `print(\"…\")` — the text `Hello, PawWalk!` goes inside double quotes, inside the parentheses." },
          ],
          success: "That's your first Swift statement. The editor checks your code as you'd expect from here on.",
        },
        {
          type: "text",
          md: [
            "## When you get stuck",
            "Fail a check twice and an **\"I'm stuck — show the solution\"** link appears. Using it is fine — but *type the solution out yourself* instead of pasting. The whole value is in your fingers learning the syntax.",
            "Some steps are **Over to Xcode** checklists — real-world tasks on your Mac, like running the app on the simulator. The browser can't verify those, so you check them off yourself.",
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
      id: "set-up-your-mac",
      title: "Set up your Mac",
      steps: [
        {
          type: "text",
          md: [
            "## The tools",
            "iOS development needs a Mac and three tools, all free:",
            "- **Xcode** — Apple's IDE. It compiles Swift, runs the iPhone Simulator, and ships apps. It's a big download (~10 GB), so start it first.\n- **Homebrew** — the package manager for macOS, used to install command-line tools.\n- **XcodeGen** — generates the Xcode project file from `apps/ios/project.yml`. This repo uses it so the project file never causes git conflicts.",
            "The backend also needs **uv** (a fast Python package manager) — one install command and you're done.",
          ],
        },
        {
          type: "xcode",
          title: "Install everything",
          intro: ["Work through these on your Mac. The Xcode download can run while you do the rest."],
          items: [
            "Install **Xcode** from the Mac App Store (search \"Xcode\"). Open it once after installing and accept the license.",
            "Install Homebrew if you don't have it: paste the command from [brew.sh](https://brew.sh) into Terminal.",
            "Run `brew install xcodegen` in Terminal.",
            "Install uv: `curl -LsSf https://astral.sh/uv/install.sh | sh` (from [docs.astral.sh/uv](https://docs.astral.sh/uv)).",
            "In Terminal, `cd` into the repo, then run `cd apps/backend && uv sync` to install the backend's dependencies.",
          ],
        },
        {
          type: "quiz",
          q: "Why does this repo use XcodeGen instead of committing the Xcode project file?",
          choices: [
            "Xcode can't open committed project files",
            "The project file is generated from `project.yml`, so it never causes git merge conflicts",
            "XcodeGen makes the app run faster",
            "Apple requires it for the App Store",
          ],
          answer: 1,
          explain: "Xcode's `.xcodeproj` format is notorious for merge conflicts. Generating it from a small YAML file sidesteps that entirely — you'll run `xcodegen generate` whenever files are added.",
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
            "To see PawWalk working you run two things: the **backend** (a local web server on port 8000) and the **iOS app** (in the iPhone Simulator). The Simulator shares your Mac's network, so the app reaches the backend at `http://localhost:8000` with zero configuration.",
            "> Keep the backend Terminal window open while you use the app — if it's not running, the app can't load walkers or log you in.",
          ],
        },
        {
          type: "xcode",
          title: "Launch the full stack",
          intro: ["From the repository root:"],
          items: [
            "Terminal tab 1: `cd apps/backend && uv run fastapi dev` — leave it running. Open [http://localhost:8000/docs](http://localhost:8000/docs) and admire the auto-generated API docs.",
            "Terminal tab 2: `cd apps/ios && xcodegen generate && open PawWalk.xcodeproj`.",
            "In Xcode, pick an iPhone simulator in the toolbar's device menu, then press **⌘R** (Run).",
            "Wait for the Simulator to boot, then sign up as an owner in the app and look around.",
            "In the app, open the walkers list and confirm walkers load — that's live data from your backend.",
          ],
        },
        {
          type: "quiz",
          q: "The app shows \"Couldn't reach the server\" — what's the most likely cause?",
          choices: [
            "The iPhone Simulator has no network access",
            "You need to deploy the backend to the internet first",
            "The backend isn't running — `uv run fastapi dev` was stopped or never started",
            "Xcode needs to be reinstalled",
          ],
          answer: 2,
          explain: "The Simulator shares your Mac's network, and everything runs locally — so 99% of the time this error just means the backend process isn't running on port 8000.",
          nudge: "Remember: two processes. Which one answers `http://localhost:8000`?",
        },
        {
          type: "text",
          md: [
            "## You're ready",
            "You've seen the finished product and you have a working toolchain. Next up: the Swift language itself — starting from the very first `let`. Everything you learn will point straight back at code you just watched run.",
          ],
        },
        {
          type: "quiz",
          q: "Ready to write some Swift?",
          choices: ["Let's go 🐾", "I was born ready"],
          answer: 0,
          explain: "Off we go.",
          nudge: "There is no wrong answer here… well, almost.",
        },
      ],
    },
  ],
});
