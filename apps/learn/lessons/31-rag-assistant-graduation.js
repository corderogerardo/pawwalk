// Module 31 — RAG in the Assistant + Graduation. See FORMAT.md for the schema.
window.COURSE = window.COURSE || [];
window.COURSE.push({
  id: "rag-assistant-graduation",
  title: "RAG in the Assistant + Graduation",
  emoji: "🎓",
  lang: "python",
  lessons: [
    // ────────────────────────────────────────────────────────────────────
    {
      id: "rag-node",
      title: "A RAG node in the graph",
      steps: [
        {
          type: "text",
          md: [
            "## The last mile",
            "In Module 30 you built a RAG pipeline from scratch in the playground: chunk the docs, embed with bag-of-words, cosine-rank, retrieve the top chunks, and stuff them into the prompt. It answered *\"what's PawWalk's cancellation policy?\"* by quoting the real doc instead of hallucinating.",
            "That retriever is still sitting in `playground/rag-pawwalk/`. This module moves it into the **real assistant** — the LangGraph state machine from Module 29 — so an owner can ask a *policy question* in the same chat where they book walks. Then you'll measure whether it actually answers well, and graduate.",
            "Nothing here is new. It's Module 29's graph plus Module 30's retriever, wired together with the conditional-edge trick you already know.",
          ],
        },
        {
          type: "code",
          title: "app/assistant/graph.py (the graph you already know)",
          source: String.raw`class AssistantState(TypedDict, total=False):
    message: str
    session: Session
    intent: BookingIntent
    walkers: list[Walker]
    reply: str
    suggested: list[str]
    draft: DraftBooking | None


def parse_intent(state: AssistantState) -> AssistantState:
    return {"intent": extract_intent(state["message"])}


def find_walkers(state: AssistantState) -> AssistantState:
    intent = state["intent"]
    matches = data.find_walkers(state["session"], intent.neighborhood)
    return {"walkers": matches}`,
          caption: "Straight from the repo. `parse_intent` runs first; today we add a fork right after it — booking requests keep going to `find_walkers`, but questions veer off to a new node.",
        },
        {
          type: "text",
          md: [
            "## One new node: `answer_question`",
            "A node is just a function `state -> partial state` (Module 29). The new one takes the user's message, runs the Module-30 retriever over PawWalk's `docs/*.md`, and writes a `reply` grounded in what it found:",
            "```python\ndef answer_question(state):\n    chunks = retrieve(state[\"message\"], top_k=3)\n    context = \"\\n\\n\".join(c.text for c in chunks)\n    reply = answer_from_context(state[\"message\"], context)\n    return {\"reply\": reply, \"suggested\": [], \"draft\": None}\n```",
            "`retrieve` and `answer_from_context` are the exact functions you wrote in the playground — this is the \"productionize Task 30\" step. A question doesn't suggest walkers or draft a booking, so those come back empty.",
          ],
        },
        {
          type: "text",
          md: [
            "## The fork: a conditional edge",
            "In Module 29 you learned `add_conditional_edges` — after a node, a small **router function** reads the state and returns the *name* of the next node as a string. LangGraph looks that name up and goes there.",
            "Here the router runs after `parse_intent`. If the message looks like a question (no booking details — no neighborhood, no time), route to `answer_question`. Otherwise it's a booking request: route to `find_walkers`, the original path.",
            "> The router NEVER does the work itself — it only decides *which node* does. Two possible return strings, two destinations.",
          ],
        },
        {
          type: "exercise",
          title: "Write the router",
          prompt: [
            "Write `route_message(state)`. It looks at `state[\"intent\"]` and decides where the graph goes next.",
            "- If the intent has **no** `neighborhood` and **no** `start_time`, treat it as a question → `return \"answer_question\"`.\n- Otherwise it's a booking → `return \"find_walkers\"`.",
            "Two `return` statements, one `if`. Return the node *names as strings* — that's the whole contract of a router.",
          ],
          starter: String.raw`def route_message(state):
    intent = state["intent"]
    # your code here
`,
          solution: String.raw`def route_message(state):
    intent = state["intent"]
    if not intent.neighborhood and not intent.start_time:
        return "answer_question"
    return "find_walkers"`,
          checks: [
            { re: /if not intent\.neighborhood and not intent\.start_time:/, hint: "The question branch: `if not intent.neighborhood and not intent.start_time:` — no place and no time means they're asking, not booking." },
            { re: /return"answer_question"/, hint: "Inside the `if`, return the question node's name as a string: `return \"answer_question\"`." },
            { re: /return"find_walkers"/, hint: "The fall-through (booking) case returns the original node's name: `return \"find_walkers\"`." },
          ],
          mustNot: [
            { re: /def answer_question\(/, hint: "Don't answer the question here — a router only DECIDES. Return a node name; that node does the work." },
          ],
          success: "That's a router: read state, return a node name. LangGraph wires `parse_intent → route_message → {answer_question | find_walkers}` for you.",
        },
        {
          type: "quiz",
          q: "The router returns the string `\"answer_question\"`. What does LangGraph do with that string?",
          choices: [
            "Runs the node registered under that name next, then follows that node's edges",
            "Prints it back to the user as the assistant's reply",
            "Treats it as the answer text and stops the graph immediately",
            "Passes it as the first argument to every remaining node",
          ],
          answer: 0,
          explain: "A conditional edge maps the router's return string to a registered node name. LangGraph looks up `answer_question`, runs it, and then follows *its* edges (here, straight to END). The router chooses the path; it never produces output itself.",
          nudge: "You registered the node with `g.add_node(\"answer_question\", answer_question)`. The router's string has to match that name.",
        },
        {
          type: "xcode",
          label: "Over to the terminal",
          title: "Wire it in and watch both paths",
          intro: [
            "Add the node and the fork to the real graph, then prove each intent takes its own road.",
          ],
          items: [
            "In `app/assistant/graph.py`, add `g.add_node(\"answer_question\", answer_question)` and replace the plain `g.add_edge(\"parse_intent\", \"find_walkers\")` with `g.add_conditional_edges(\"parse_intent\", route_message)`.",
            "Add `g.add_edge(\"answer_question\", END)` so the question path terminates.",
            "Restart the server: `cd apps/backend && uv run fastapi dev`.",
            "Open [http://localhost:8000/docs](http://localhost:8000/docs), expand `POST /assistant/chat` → **Try it out**.",
            "Ask a **policy question**: `{\"message\": \"what is your cancellation policy?\"}` — the reply should quote the docs, with `suggested_walkers` empty. That's the `answer_question` path.",
            "Ask a **booking request**: `{\"message\": \"a walker in the Mission tomorrow at 3pm\"}` — you get walker suggestions and a draft. That's the original `find_walkers` path.",
            "Same endpoint, same graph — the router sent each message down a different branch. Skip if the server isn't set up; the browser exercise already proved the logic.",
          ],
        },
      ],
    },
    // ────────────────────────────────────────────────────────────────────
    {
      id: "evals",
      title: "Did it answer well? Evals 101",
      steps: [
        {
          type: "text",
          md: [
            "## \"Looks good\" is not a metric",
            "You asked the assistant one policy question and it looked right. Ship it? No. Change a chunk size, tweak the prompt, swap the embedding — and you have no idea if you made it better or worse. You're steering by *vibes*.",
            "The fix is an **eval**: a small fixed set of questions with known-correct answers, plus a script that scores how often the system gets them right. Run it before and after every change. Evals turn \"feels better\" into a number that went up or down.",
          ],
        },
        {
          type: "text",
          md: [
            "## The simplest useful eval: retrieval hit-rate",
            "RAG lives or dies on retrieval — if the right chunk isn't fetched, no prompt can save the answer. So the cheapest meaningful eval checks: *for each question, did we retrieve a chunk from the doc that actually contains the answer?*",
            "You need two things: an **eval set** (questions paired with the doc each answer lives in) and a **loop** that runs retrieval on each question and counts the hits.",
          ],
        },
        {
          type: "code",
          title: "playground/rag-pawwalk/eval.py (the eval set)",
          source: String.raw`EVAL_SET = [
    {"question": "what is your cancellation policy?", "expected_source": "docs/API-CONTRACT.md"},
    {"question": "how are prices calculated?", "expected_source": "docs/ARCHITECTURE.md"},
    {"question": "how do I deploy the backend?", "expected_source": "docs/DEPLOY.md"},
    {"question": "what does the assistant do?", "expected_source": "docs/ARCHITECTURE.md"},
    {"question": "how is auth handled?", "expected_source": "docs/ARCHITECTURE.md"},
]`,
          caption: "Five dicts, each a `question` and the `expected_source` doc the answer should come from. Real eval sets grow to hundreds, but five is enough to catch a regression — and enough to start.",
        },
        {
          type: "text",
          md: [
            "## The scoring loop",
            "For each case, retrieve the top chunks, then check whether any retrieved chunk came from the `expected_source` doc. If yes, it's a hit. Count hits, divide by total, print the rate:",
            "```python\nhits = 0\nfor case in EVAL_SET:\n    chunks = retrieve(case[\"question\"], top_k=3)\n    sources = [c.source for c in chunks]\n    if case[\"expected_source\"] in sources:\n        hits += 1\nprint(f\"hit-rate: {hits}/{len(EVAL_SET)}\")\n```",
            "Run it, get `4/5`, change something, run again. Now every tweak has a scoreboard.",
          ],
        },
        {
          type: "exercise",
          title: "Write the eval loop",
          prompt: [
            "Fill in the loop body. For each `case` in `EVAL_SET`, `retrieve` the top chunks for `case[\"question\"]`, collect their `.source` values into a list called `sources`, and if `case[\"expected_source\"]` is in that list, add one to `hits`.",
            "Three lines inside the loop: retrieve, build `sources`, the `if` that bumps `hits`.",
          ],
          starter: String.raw`hits = 0
for case in EVAL_SET:
    # your code here
print(hits)`,
          solution: String.raw`hits = 0
for case in EVAL_SET:
    chunks = retrieve(case["question"], top_k=3)
    sources = [c.source for c in chunks]
    if case["expected_source"] in sources:
        hits += 1
print(hits)`,
          checks: [
            { re: /for case in EVAL_SET:/, hint: "Loop over the eval set: `for case in EVAL_SET:`." },
            { re: /retrieve\(case\["question"\]/, hint: "Retrieve for this case's question: `retrieve(case[\"question\"], top_k=3)`." },
            { re: /if case\["expected_source"\]in sources:/, hint: "Score the hit: `if case[\"expected_source\"] in sources:` — did retrieval reach the right doc?" },
            { re: /hits\+=1/, hint: "On a hit, bump the counter: `hits += 1`." },
          ],
          mustNot: [
            { re: /hits=len\(EVAL_SET\)/, hint: "Don't hand yourself a perfect score — count real hits one case at a time inside the loop." },
          ],
          success: "That's an eval harness. Run it before and after every change and you're steering by data, not vibes.",
        },
        {
          type: "quiz",
          q: "Your hit-rate eval passes at 5/5, but users still complain the answers ramble. What is the eval NOT measuring?",
          choices: [
            "The quality of the generated answer — retrieval hit-rate only checks the RIGHT chunk was fetched, not that the LLM used it well",
            "Nothing — 5/5 means the system is perfect",
            "The server's response time",
            "Whether the docs exist on disk",
          ],
          answer: 0,
          explain: "Retrieval hit-rate is a *component* eval: it confirms the right context reached the prompt. Answer quality (did the model actually ground its reply, stay concise, avoid making things up?) is a separate eval — often an LLM grading the answer against the source. Start with the cheap component metric; add answer-quality evals as you grow.",
          nudge: "Getting the right document in front of the model is necessary but not sufficient. What happens *after* retrieval?",
        },
        {
          type: "xcode",
          label: "Over to the terminal",
          title: "Stretch: give the assistant a memory",
          intro: [
            "Optional final flourish (staged exercise 4 from `docs/learning/backend.md`). Right now each `/assistant/chat` call is amnesiac — it forgets the previous turn. Real assistants remember.",
          ],
          items: [
            "Add a `history: list[str]` field to `AssistantState` in `app/assistant/graph.py` so earlier turns can ride along in state.",
            "Have `parse_intent` (or a new `remember` node) append the incoming message to `history` before the graph does its work.",
            "Feed `history` into `answer_question`'s context so a follow-up like \"and what about refunds?\" knows what \"that\" refers to.",
            "Persisting history across HTTP requests needs a store (a dict keyed by conversation id, or the DB) — sketch it, note the trade-off, and leave it as a design exercise. This is genuinely optional; skip it and still graduate.",
          ],
        },
      ],
    },
    // ────────────────────────────────────────────────────────────────────
    {
      id: "graduation",
      title: "Graduation Day",
      steps: [
        {
          type: "text",
          md: [
            "## Look how far you've come",
            "Nineteen Python modules ago, `name = \"Mochi\"` with no `let` in front of it was news. Now look at what you can read — and *write*:",
            "- **Python itself** — types, collections, classes, dataclasses, type hints, exceptions, files, JSON (Modules 14–17)\n- **Three frameworks** — Flask's hand-wired HTTP, Django's batteries-included ORM and admin, and FastAPI, the typed framework running the real backend (Modules 18–27)\n- **The contract loop** — Pydantic models that validate themselves and generate `/docs`, routers, dependency injection, a real database with Alembic migrations, JWT auth, payments, and pytest (Modules 23–27)\n- **The AI stack** — what an LLM actually does, typed output with Pydantic AI, agents as LangGraph state machines, RAG from scratch, and today, RAG wired into the real assistant with an eval to keep it honest (Modules 28–31)",
            "The AI assistant — the \"hardest\" feature in the whole backend — introduced almost *zero* new ideas today. A node is a function. An edge is an `if`. RAG is chunk-embed-retrieve-stuff. You'd already met every piece. That's what knowing a stack feels like: new features stop being new and start being combinations.",
          ],
        },
        {
          type: "xcode",
          label: "Over to the terminal",
          title: "The graduation tour",
          intro: [
            "One last run — the whole backend, end to end, every stage you built. Hit each feature and recognize it.",
          ],
          items: [
            "`cd apps/backend && uv run fastapi dev` — start the server, leave it running.",
            "In a second terminal: `cd apps/backend && uv run pytest` — the full suite passes, including any test you added along the way.",
            "Open [http://localhost:8000/docs](http://localhost:8000/docs) — the OpenAPI page FastAPI generated from your Pydantic models. Every endpoint below came from a stage you studied.",
            "**Stage D:** `POST /auth/signup` then `POST /auth/login`, copy the token into **Authorize**, then call a protected route (Modules 23–26). Create a booking with `POST /bookings`; kick off a payment (Module 27).",
            "**Stage E:** `POST /assistant/chat` with a **booking request** — walker suggestions and a draft (Modules 28–29). Then a **policy question** — a RAG-grounded answer from the docs (Modules 30–31). Same endpoint, two paths, one router.",
            "Every request touched code you can now read line by line. That's a complete, typed, tested Python backend — with an AI assistant — and you understand all of it.",
          ],
        },
        {
          type: "quiz",
          q: "Part II recap, question 1 of 4. Why did PawWalk choose FastAPI over Flask or Django for the real backend?",
          choices: [
            "The typed Pydantic models ARE the API contract — they validate requests and auto-generate the `/docs` that two mobile clients mirror",
            "It's the newest framework, so it must be best",
            "Flask and Django can't return JSON",
            "FastAPI is the only Python framework with a database",
          ],
          answer: 0,
          explain: "Flask gives you total control but you write validation and docs by hand; Django hands you an ORM, admin, and auth but insists on its way. FastAPI's bet is that *types are the contract* — one Pydantic model validates input, shapes output, and writes the OpenAPI docs the iOS and Android apps depend on. For a product with two typed clients, that's the winning trade.",
          nudge: "Think about what the iOS and Android apps both need to agree on, and what generates `/docs`.",
        },
        {
          type: "quiz",
          q: "Recap 2 of 4. You add `Field(max_length=280)` to a request model and restart. What follows, automatically?",
          choices: [
            "`/docs` updates to show the new limit, and a 281-char request now returns 422 — no other code changed",
            "Nothing until you hand-edit the OpenAPI JSON file",
            "The database schema migrates itself",
            "Every client app must be rebuilt before the server will start",
          ],
          answer: 0,
          explain: "That's the contract loop. The Pydantic model is the single source of truth: change a constraint and validation, the 422 behavior, and the generated docs all move together. The human mirror in `docs/API-CONTRACT.md` is the only thing you update by hand — the machine keeps the rest in sync.",
          nudge: "One model, three things it drives at once: validation, the error response, and the docs.",
        },
        {
          type: "quiz",
          q: "Recap 3 of 4. Why force the LLM's output through a Pydantic model (`Agent(output_type=BookingIntent)`) instead of parsing its free text?",
          choices: [
            "It guarantees downstream code gets validated, typed data — the agent retries until the reply matches the schema, so a stray sentence can't crash the graph",
            "It makes the LLM run faster",
            "It removes the need for an API key",
            "It lets the model return any shape it wants",
          ],
          answer: 0,
          explain: "Raw LLM text is unreliable program input — it drifts, adds prose, forgets fields. `output_type=BookingIntent` makes Pydantic AI validate the reply against your schema and retry on a miss, so `parse_intent` always hands the rest of the graph a clean, typed `BookingIntent`. Typed output is what makes an LLM safe to build on.",
          nudge: "What does the code *after* the LLM step need in order to not crash on a weird reply?",
        },
        {
          type: "quiz",
          q: "Recap 4 of 4, the finale. Put the RAG pipeline in order, from raw docs to grounded answer.",
          choices: [
            "chunk the docs → embed each chunk → embed the question and cosine-rank → retrieve the top-k → stuff them into the prompt → generate the answer",
            "generate the answer → retrieve chunks → embed → chunk the docs",
            "embed the question → generate → chunk → retrieve",
            "stuff every doc into the prompt → hope the context window is big enough",
          ],
          answer: 0,
          explain: "Chunk, embed, retrieve, generate — the pipeline you built from stdlib in Module 30 and wired into the assistant today. That last wrong answer (\"stuff every doc in\") is exactly what RAG exists to avoid: retrieval means the model reads only the few chunks that matter, grounded in your real data instead of its guesses.",
          nudge: "You can't rank by similarity before things are embedded, and you can't answer before you've retrieved. Follow the data.",
        },
        {
          type: "text",
          md: [
            "## You built the other side of the URL",
            "In Part I you built the PawWalk app — the client. In Part II you built the server it talks to: routes, validation, a database, auth, payments, tests, and an AI assistant that parses bookings and answers questions from your own docs. You've now stood on *both* sides of every request your app makes.",
            "That's the whole product, front to back, and you understand every file it touches. Go build something.",
            "Congratulations, graduate. 🎓🐾",
          ],
        },
        {
          type: "quiz",
          q: "Truly the last question. What's the smartest next move for everything you just learned?",
          choices: [
            "Build your own project — pick an idea and stand up a typed FastAPI backend for it",
            "Delete it all and start over in a different language",
            "Never touch a backend again",
            "Memorize the FastAPI source code line by line",
          ],
          answer: 0,
          explain: "You have the full stack now: Python, a typed framework, a database, auth, tests, and an AI assistant. The only way it sticks is to use it — start a project, make the mistakes, and reach for the docs when you're stuck. That's exactly how every backend engineer got here. Now go. 🐾",
          nudge: "Knowledge you don't use fades. What makes it permanent?",
        },
      ],
    },
  ],
});
