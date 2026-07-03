window.COURSE = window.COURSE || [];
window.COURSE.push({
  id: "py-welcome",
  title: "Part II: Python Backend",
  emoji: "🐍",
  lang: "python",
  lessons: [
    {
      id: "welcome",
      title: "Welcome to the backend",
      steps: [
        {
          type: "text",
          md: [
            "## You've been talking to a server all along",
            "In Part I you built the PawWalk iOS app. Every screen you made — the walker list, the booking form, login — worked by **asking a server for data** over HTTP. That server lives in this repo too, in `apps/backend`, and in Part II you learn to build it yourself: the other side of the URL.",
            "By the graduation module you'll understand — and have typed — the pieces of a complete Python backend: routes, validation, a real database, authentication, payments, tests, and an **AI assistant that uses an LLM and RAG** to answer questions about PawWalk.",
          ],
        },
        {
          type: "text",
          md: [
            "## The map for Part II",
            "- **Python the language** (modules 14–17) — variables to classes, with Swift comparisons so it clicks fast.\n- **Flask** (18–19) — a *micro*-framework. You wire HTTP by hand and feel exactly what a request is.\n- **Django** (20–22) — the *batteries-included* framework: ORM, migrations, and an admin site for free.\n- **FastAPI** (23–27) — the *typed, modern* framework that powers the real PawWalk backend. Here the repo itself becomes the textbook.\n- **AI: LLMs & RAG** (28–31) — structured LLM output, agents as graphs, and retrieval-augmented generation, ending inside PawWalk's real assistant.",
            "Why learn three frameworks? Because each teaches a different philosophy — and after feeling Flask's manual wiring and Django's magic, FastAPI's design will make *sense* instead of being memorized.",
          ],
        },
        {
          type: "code",
          title: "app/schemas.py (abridged)",
          source: String.raw`from typing import Literal

from pydantic import BaseModel, EmailStr, Field

Duration = Literal[30, 45, 60]


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    name: str`,
          caption: "Real code from the backend your iOS app talks to. In Part I you typed its Swift mirror — `struct SignupRequest: Codable`. Same contract, two languages.",
        },
        {
          type: "quiz",
          q: "Which framework powers the real PawWalk backend in `apps/backend`?",
          choices: ["FastAPI", "Flask", "Django", "Vapor"],
          answer: 0,
          explain: "You'll still learn Flask and Django on the way — they teach HTTP fundamentals and the batteries-included philosophy — but the code serving your iOS app is FastAPI.",
          nudge: "Part I's networking module pointed your app at http://localhost:8000 — the typed, modern Python framework runs there.",
        },
        {
          type: "text",
          md: [
            "## How Python reads, coming from Swift",
            "- **No `let` or `var`** — you just write `name = \"Mochi\"`. No type annotations required (though we'll add them later, and Pydantic will love them).\n- **Indentation is the braces.** Where Swift uses `{ }`, Python uses a `:` and indented lines.\n- **f-strings** are Python's version of Swift's `\\(name)` interpolation: `f\"Hello {name}\"`.\n- **`print()`** works just like Swift's `print()`.",
            "> The exercises check your Python right here in the browser, exactly like Part I. Same rules: type it, don't paste it.",
          ],
        },
        {
          type: "exercise",
          title: "Your first Python",
          prompt: [
            "Create a variable `name` holding the string `\"Mochi\"`, then print `Welcome, Mochi!` using an **f-string**: `print(f\"Welcome, {name}!\")`.",
          ],
          starter: String.raw`# Create the variable, then print the greeting
`,
          solution: String.raw`name = "Mochi"
print(f"Welcome, {name}!")`,
          checks: [
            { re: /name="Mochi"/, hint: "First line: assign the string — `name = \"Mochi\"`. No `let`, no `var`, just the name." },
            { re: /print\(f"/, hint: "Print with an f-string: the quote needs an `f` right in front of it — `print(f\"…\")`." },
            { re: /\{name\}/, hint: "Inside the f-string, drop the variable in with curly braces: `{name}` (Swift would say `\\(name)`)." },
          ],
          mustNot: [
            { re: /print\("/, hint: "That's a plain string — without the `f` prefix, `{name}` prints literally instead of interpolating." },
          ],
          success: "That's Python: no let, no braces, and f-strings instead of \\( ). Welcome to Part II.",
        },
      ],
    },
    {
      id: "toolchain",
      title: "Set up your toolchain",
      steps: [
        {
          type: "text",
          md: [
            "## Two installs, that's it",
            "Swift needed Xcode. Python needs two much smaller things:",
            "1. **Python 3.12** — the language itself (macOS: `brew install python@3.12`, or it may already be there).\n2. **`uv`** — the modern Python package manager. It plays the role Swift Package Manager played in Part I: reads the project's dependency list and installs exactly those versions.",
            "The backend's dependencies are declared in `apps/backend/pyproject.toml` — that file is to Python what `Package.swift` or `project.yml` was to the iOS app.",
          ],
        },
        {
          type: "text",
          md: [
            "## Virtual environments in one paragraph",
            "Python projects each get their own private toolbox called a **virtual environment** (a `.venv/` folder): the project's packages live there, not globally on your Mac, so two projects can use different versions of the same library without fighting. You almost never manage it by hand — `uv sync` builds it from `pyproject.toml`, and `uv run <command>` runs commands inside it.",
          ],
        },
        {
          type: "xcode",
          label: "Over to the terminal",
          title: "Run the real PawWalk backend",
          intro: ["Time to run the server your iOS app has been talking to. Keep this terminal workflow — every backend module starts this way."],
          items: [
            "Install `uv` (skip if `uv --version` already works): `curl -LsSf https://astral.sh/uv/install.sh | sh`, then open a fresh terminal",
            "`cd apps/backend && uv sync` — builds `.venv/` with every dependency from `pyproject.toml`",
            "`uv run fastapi dev` — starts the server; leave it running",
            "Open [http://localhost:8000/docs](http://localhost:8000/docs) — interactive docs for every endpoint",
            "Expand `GET /walkers`, hit **Try it out** → **Execute** — the same JSON walker list your iOS app fetches",
            "In a second terminal: `cd apps/backend && uv run pytest` — the backend's test suite passes",
          ],
        },
        {
          type: "quiz",
          q: "You didn't write a single line of documentation, yet `/docs` lists every endpoint with request and response shapes. Where does that page come from?",
          choices: [
            "FastAPI generates it from the code's type hints and Pydantic models",
            "It's a static HTML file someone committed to the repo",
            "It's FastAPI's built-in demo page, the same for every project",
            "It's downloaded from fastapi.tiangolo.com when the server starts",
          ],
          answer: 0,
          explain: "The Pydantic models in `app/schemas.py` ARE the contract — FastAPI turns them into OpenAPI docs automatically. Change a model, refresh `/docs`, and the docs change too. That idea carries the whole FastAPI stage.",
          nudge: "Think about what `app/schemas.py` claimed in its first line: “Pydantic models == the API contract.”",
        },
      ],
    },
  ],
});
