window.COURSE = window.COURSE || [];
window.COURSE.push({
  id: "langgraph-agent",
  title: "LangGraph Agents",
  emoji: "🕸️",
  lang: "python",
  lessons: [
    {
      id: "why-a-graph",
      title: "Why a graph, not a mega-prompt",
      steps: [
        {
          type: "text",
          md: [
            "## One giant prompt is a black box",
            "In module 28 you gave an LLM a Pydantic `output_type` and got back a typed `BookingIntent`. Tempting next step: write ONE enormous prompt — *\"read the message, find matching walkers, draft a booking, reply\"* — and hope the model does all of it.",
            "That works until it doesn't. When the reply is wrong you can't tell *which part* failed: the parsing? the walker lookup? the wording? You can't test one piece in isolation, and you can't add a step without rewriting the whole prompt.",
            "The PawWalk assistant does the opposite. It's an **explicit state machine**: a handful of small steps, each a plain Python function, wired together in a fixed order. That's what **LangGraph** gives you.",
          ],
        },
        {
          type: "text",
          md: [
            "## A graph = nodes + edges over shared state",
            "- A **node** is a function that takes the current `state` and returns a *partial* update to it. `parse_intent`, `find_walkers`, `draft_booking` — each does one job.\n- An **edge** says *\"after this node, go to that one.\"* `START → parse_intent → find_walkers → draft_booking → END`.\n- The **state** is a plain dict that flows through: each node reads what it needs and adds its piece.",
            "The whole conversation becomes a diagram you can read, test node-by-node, and extend by dropping in another node. No node knows about the LLM except the one that needs it.",
          ],
        },
        {
          type: "code",
          title: "app/assistant/graph.py",
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
          caption: "The state is a `TypedDict` — a dict whose keys have types. `total=False` means every key is optional, because each node fills in only its own piece. Notice each node returns a small dict, not the whole state.",
        },
        {
          type: "text",
          md: [
            "## Wiring the nodes together",
            "The nodes above are just functions — nothing connects them yet. A `StateGraph` is where you register each node by name and draw the edges between them. `START` and `END` are LangGraph's built-in markers for \"where a run begins\" and \"where it stops.\"",
            "Read `_build_graph` below. It's the entire structure of the assistant in ten lines.",
          ],
        },
        {
          type: "code",
          title: "app/assistant/graph.py",
          source: String.raw`def _build_graph():
    g = StateGraph(AssistantState)
    g.add_node("parse_intent", parse_intent)
    g.add_node("find_walkers", find_walkers)
    g.add_node("draft_booking", draft_booking)
    g.add_edge(START, "parse_intent")
    g.add_edge("parse_intent", "find_walkers")
    g.add_edge("find_walkers", "draft_booking")
    g.add_edge("draft_booking", END)
    return g.compile()


GRAPH = _build_graph()`,
          caption: "`add_node(name, fn)` registers a function under a name; `add_edge(from, to)` draws an arrow. `g.compile()` freezes it into a runnable `GRAPH`. This is built once at import time, then reused for every request.",
        },
        {
          type: "text",
          md: [
            "## Running the graph",
            "One entry point kicks it off. `GRAPH.invoke({...})` seeds the initial state (the message and DB session), runs each node in edge order, and hands you the final accumulated state. The router then packs it into the typed `AssistantReply` your iOS app receives.",
          ],
        },
        {
          type: "code",
          title: "app/assistant/graph.py",
          source: String.raw`def run_assistant(message: str, session: Session) -> AssistantReply:
    final = GRAPH.invoke({"message": message, "session": session})
    return AssistantReply(
        reply=final["reply"],
        suggested_walkers=final.get("suggested", []),
        draft_booking=final.get("draft"),
    )`,
          caption: "`final` is the state dict after every node has run. `parse_intent` added `intent`, `find_walkers` added `walkers`, `draft_booking` added `reply`/`suggested`/`draft`. This is called from `POST /assistant/chat`.",
        },
        {
          type: "quiz",
          q: 'A user sends "Book a 60-min walk in Mission tomorrow at 3pm." Trace it through the graph — which sequence of nodes runs, and what does each add to the state?',
          choices: [
            "parse_intent (adds intent) → find_walkers (adds walkers) → draft_booking (adds reply/suggested/draft) → END",
            "find_walkers → parse_intent → draft_booking → END",
            "One node runs the whole prompt and returns the reply directly",
            "draft_booking runs first to reserve a slot, then parse_intent fills in details",
          ],
          answer: 0,
          explain: "Edges fix the order: START → parse_intent → find_walkers → draft_booking → END. `parse_intent` turns the text into a `BookingIntent`, `find_walkers` uses `intent.neighborhood` to query the DB, and `draft_booking` reads both to write the reply and draft. Each node only adds its own keys.",
          nudge: "Follow the `add_edge(...)` calls in `_build_graph` top to bottom — the arrows are the trace.",
        },
      ],
    },
    {
      id: "nodes",
      title: "Writing a node",
      steps: [
        {
          type: "text",
          md: [
            "## A node is just a function you can unit-test",
            "Because every node is `state -> partial state`, you can call one directly with a fake state dict and assert on what it returns — no server, no LLM, no database. That's the whole point of the graph shape.",
            "Time to add real capability. Right now the heuristic parser in `intent.py` pulls out neighborhood, duration, and start time — but **not the dog's name**. This is staged exercise 1 from `docs/learning/backend.md`: teach the parser to extract `dog_name`.",
          ],
        },
        {
          type: "code",
          title: "app/assistant/intent.py",
          source: String.raw`def _parse_neighborhood(text: str) -> str | None:
    t = text.lower()
    for hood in _KNOWN_HOODS:
        if hood.lower() in t:
            return hood
    return None


def heuristic_intent(message: str) -> BookingIntent:
    return BookingIntent(
        neighborhood=_parse_neighborhood(message),
        duration_minutes=_parse_duration(message),
        start_time=_parse_start_time(message),
    )`,
          caption: "Each `_parse_*` helper is a tiny function returning one field. `heuristic_intent` assembles them into a typed `BookingIntent`. You'll add a `_parse_dog_name` helper in the same shape, then wire it in.",
        },
        {
          type: "text",
          md: [
            "## The pattern to match",
            "People phrase it a few ways: *\"walk **for** Mochi\"*, *\"walk **my dog** Rex\"*, *\"take **Bella** out\"*. A small, honest regex covers the common cases: look for `for` or `my dog` followed by a capitalized name.",
            "`BookingIntent.dog_name` is already `str | None = None` in `schemas.py` (you added it in module 28), so the field is waiting — you just need to fill it.",
            "> This is a *heuristic*: it won't catch every phrasing, and that's fine. When a real LLM key is set, the Pydantic AI agent does a better job and the heuristic is the safety net. Progress over perfection.",
          ],
        },
        {
          type: "exercise",
          title: "Extract the dog's name",
          prompt: [
            "Write `_parse_dog_name(text)`. Use `re.search` for the pattern `for` (or `my dog`) followed by a capitalized word, and return the captured name or `None`.",
            "Return the match group when found, `None` otherwise. Keep it to a few lines.",
          ],
          starter: String.raw`def _parse_dog_name(text: str) -> str | None:
    # your code here
`,
          solution: String.raw`def _parse_dog_name(text: str) -> str | None:
    m = re.search(r"(?:for|my dog)\s+([A-Z][a-z]+)", text)
    return m.group(1) if m else None`,
          checks: [
            { re: /def _parse_dog_name\(text:str\)->str\|None:/, hint: "Match the signature exactly: `def _parse_dog_name(text: str) -> str | None:`." },
            { re: /re\.search\(/, hint: "Use `re.search(pattern, text)` to scan for the name anywhere in the message." },
            { re: /\.group\(1\)/, hint: "Pull the captured name out with `m.group(1)` — group 1 is the part in `( … )`." },
            { re: /if m else None/, hint: "Guard the no-match case: `m.group(1) if m else None` (a missing name is a valid outcome)." },
          ],
          mustNot: [
            { re: /findall\(/, hint: "Use `re.search` (returns one match or `None`), not `re.findall` — you want the first name, guarded by `if m else None`." },
          ],
          success: "That's a node's building block: one small, testable function. Next you wire it into heuristic_intent and see it live.",
        },
        {
          type: "quiz",
          q: "You now have `_parse_dog_name`. To make `parse_intent` actually populate `dog_name`, what's the ONE change left?",
          choices: [
            "Add `dog_name=_parse_dog_name(message)` to the `BookingIntent(...)` call inside `heuristic_intent`",
            "Add a new edge in `_build_graph` pointing to the parser",
            "Call `_parse_dog_name` from the `draft_booking` node",
            "Nothing — defining the function is enough; Python auto-wires it",
          ],
          answer: 0,
          explain: "`heuristic_intent` is what assembles the `BookingIntent`. Until you pass `dog_name=_parse_dog_name(message)` there, the field stays `None`. The node `parse_intent` calls `extract_intent`, which calls `heuristic_intent` — so that one line lights up the whole path.",
          nudge: "Which function actually constructs the `BookingIntent(...)`? The new field has to be passed there.",
        },
        {
          type: "xcode",
          label: "Over to the terminal",
          title: "Apply the node in the repo and see it work",
          intro: ["Take the browser exercise into the real backend and watch the dog's name flow through the graph."],
          items: [
            "Open `apps/backend/app/assistant/intent.py`",
            "Add your `_parse_dog_name(text)` function next to the other `_parse_*` helpers",
            "In `heuristic_intent`, add `dog_name=_parse_dog_name(message)` to the `BookingIntent(...)` call",
            "`cd apps/backend && uv run fastapi dev` — start the server",
            "Open [http://localhost:8000/docs](http://localhost:8000/docs), expand `POST /assistant/chat`, **Try it out**",
            'Send `{ "message": "Book a 45-min walk for Mochi in Mission tomorrow at 3pm" }` and Execute',
            "Confirm the response `draft_booking.dog_name` now reads `Mochi` — your node did that",
            "`cd apps/backend && uv run pytest` — the suite still passes",
          ],
        },
      ],
    },
    {
      id: "conditional-edges",
      title: "Conditional edges",
      steps: [
        {
          type: "text",
          md: [
            "## Straight lines can't ask questions",
            "Your parser now finds the dog's name — *when the user included it*. But what if they don't? *\"Book a walk in Mission tomorrow\"* has no name. Today the graph barrels straight into `draft_booking` and drafts a booking with `dog_name = None`. Rude.",
            "A better assistant would **branch**: if the name is missing, ask a follow-up question instead of drafting. A fixed `add_edge` can't do that — it always goes the same way. You need a **conditional edge**.",
          ],
        },
        {
          type: "text",
          md: [
            "## `add_conditional_edges` picks the next node at runtime",
            "Instead of a fixed arrow, you give LangGraph a **router function**: `state -> str`. It inspects the state and returns the *name* of the node to run next. LangGraph looks that name up and jumps there.",
            "The plan: after `find_walkers`, run a router. If `intent.dog_name` is missing, route to a new `ask_followup` node (which replies with a question). Otherwise, route to `draft_booking` as before.",
          ],
        },
        {
          type: "code",
          title: "app/assistant/graph.py (the new node)",
          source: String.raw`def ask_followup(state: AssistantState) -> AssistantState:
    return {
        "reply": "Happy to book that! What's your dog's name?",
        "suggested": [w.id for w in state.get("walkers", [])[:3]],
        "draft": None,
    }`,
          caption: "A perfectly ordinary node — same `state -> partial state` shape as the others. It sets a `reply` asking for the name and leaves `draft` as `None` (nothing is booked yet).",
        },
        {
          type: "text",
          md: [
            "## The router function is the branch",
            "The router reads the state and returns one of two node names as a plain string. This is the piece you write. It never mutates state — it only *decides*.",
            "> The strings it returns must exactly match the node names you registered with `add_node`. A typo routes nowhere.",
          ],
        },
        {
          type: "exercise",
          title: "Write the router",
          prompt: [
            "Write `route_after_walkers(state)`. Read the parsed intent from `state`. If its `dog_name` is missing, return the string `\"ask_followup\"`; otherwise return `\"draft_booking\"`.",
            "Return the node NAME as a string — the router decides, it doesn't build state.",
          ],
          starter: String.raw`def route_after_walkers(state: AssistantState) -> str:
    intent = state["intent"]
    # your code here
`,
          solution: String.raw`def route_after_walkers(state: AssistantState) -> str:
    intent = state["intent"]
    if not intent.dog_name:
        return "ask_followup"
    return "draft_booking"`,
          checks: [
            { re: /if not intent\.dog_name:/, hint: "Branch on the missing name: `if not intent.dog_name:` catches both `None` and an empty string." },
            { re: /return"ask_followup"/, hint: "When the name is missing, return the node name to ask a follow-up: `return \"ask_followup\"`." },
            { re: /return"draft_booking"/, hint: "Otherwise fall through to `return \"draft_booking\"` — the normal path." },
          ],
          mustNot: [
            { re: /return ask_followup/, hint: "Return the node NAME as a string — `\"ask_followup\"` in quotes, not the function itself." },
          ],
          success: "That's a router: pure decision, returns a node name. Now you wire it as a conditional edge.",
        },
        {
          type: "code",
          title: "app/assistant/graph.py (wiring the branch)",
          source: String.raw`g.add_node("ask_followup", ask_followup)
g.add_conditional_edges("find_walkers", route_after_walkers)
g.add_edge("ask_followup", END)
g.add_edge("draft_booking", END)`,
          caption: "`add_conditional_edges(\"find_walkers\", route_after_walkers)` replaces the fixed `find_walkers → draft_booking` edge: after `find_walkers`, the router decides. Both destination nodes still edge to `END`. Delete the old `g.add_edge(\"find_walkers\", \"draft_booking\")` line.",
        },
        {
          type: "quiz",
          q: "With the conditional edge wired, a user sends \"Book a walk in Mission tomorrow\" (no dog name). Which path runs?",
          choices: [
            "parse_intent → find_walkers → ask_followup → END, and the reply asks for the dog's name",
            "parse_intent → find_walkers → draft_booking → END, drafting with dog_name = None",
            "The graph errors because dog_name is required",
            "parse_intent → ask_followup, skipping find_walkers entirely",
          ],
          answer: 0,
          explain: "`find_walkers` still runs (so the follow-up can still suggest walkers). Then `route_after_walkers` sees `intent.dog_name` is falsy and returns `\"ask_followup\"`, so the graph jumps there instead of `draft_booking`. Add the name and the same message routes down the `draft_booking` path.",
          nudge: "The router runs AFTER find_walkers, and it returns a node name based on whether dog_name is set.",
        },
        {
          type: "xcode",
          label: "Over to the terminal",
          title: "Wire the branch and test both paths",
          intro: ["Add the node, the router, and the conditional edge to the real graph, then prove both branches work via `/assistant/chat`."],
          items: [
            "In `apps/backend/app/assistant/graph.py`, add the `ask_followup` node function and your `route_after_walkers` router",
            "In `_build_graph`: `g.add_node(\"ask_followup\", ask_followup)`",
            "Replace `g.add_edge(\"find_walkers\", \"draft_booking\")` with `g.add_conditional_edges(\"find_walkers\", route_after_walkers)`",
            "Add `g.add_edge(\"ask_followup\", END)` so the new node has an exit",
            "`cd apps/backend && uv run fastapi dev`, then open [http://localhost:8000/docs](http://localhost:8000/docs)",
            'Path A — no name: POST `/assistant/chat` with `{ "message": "Book a walk in Mission tomorrow" }` → reply asks for the dog\'s name, `draft_booking` is null',
            'Path B — with name: send `{ "message": "Book a walk for Mochi in Mission tomorrow" }` → you get a real draft back',
            "`uv run pytest` — confirm the existing tests still pass",
          ],
        },
      ],
    },
    {
      id: "tools",
      title: "Giving the agent a tool",
      steps: [
        {
          type: "text",
          md: [
            "## Sometimes the model needs to look something up",
            "Nodes and edges organize *your* code. But the LLM inside `parse_intent` sometimes needs a fact it can't invent — like *which walkers are actually free* at the requested time. Hallucinating an available walker is worse than useless.",
            "A **tool** is a function you hand the agent so it can call it mid-reasoning. Pydantic AI's `@agent.tool` decorator registers a normal Python function as something the model may invoke — and because it's a typed function, the arguments and return value stay type-safe. The decorator is the same `@` syntax you met with `@dataclass` and `@app.route`.",
          ],
        },
        {
          type: "text",
          md: [
            "## Tools are still just typed functions",
            "This is staged exercise 3: give the agent a `check_availability` tool so it only suggests walkers who are actually free. The model decides *when* to call it; you decide *what it does* and *what it returns*.",
            "The first parameter of a Pydantic AI tool is a `RunContext` (the agent's shared dependencies — here, the DB session). After that come the arguments the model fills in, like the neighborhood to search.",
          ],
        },
        {
          type: "code",
          title: "app/assistant/intent.py (the agent, from module 28)",
          source: String.raw`@lru_cache(maxsize=1)
def _agent():
    from pydantic_ai import Agent

    return Agent(
        settings.llm_model,
        output_type=BookingIntent,
        instructions=(
            "You extract dog-walking booking details from a user's message. "
            f"Known neighborhoods: {', '.join(_KNOWN_HOODS)}. "
            "Only fill fields you are confident about; leave others null."
        ),
    )`,
          caption: "This is the agent you'll attach a tool to. `output_type=BookingIntent` already forces typed output; a tool adds a typed *capability* the model can reach for while it works.",
        },
        {
          type: "text",
          md: [
            "## The tool shape",
            "You decorate a function with `@agent.tool`. Its docstring tells the model *when* to use it — the model reads it like a mini-manual. The body does a normal DB lookup and returns typed data (a list of free walker names). Keep the body a skeleton for now; the real availability query lands in the checklist.",
          ],
        },
        {
          type: "exercise",
          title: "Declare the availability tool",
          prompt: [
            "Register a tool on the agent. Decorate `check_availability` with `@agent.tool`. Give it a `RunContext` first param and a `neighborhood: str` param, and have it return a `list[str]` of free walker names (a stub list is fine for now).",
            "Just the signature and a return — 3 lines. The decorator is what makes it a tool.",
          ],
          starter: String.raw`agent = _agent()

# your code here
`,
          solution: String.raw`agent = _agent()

@agent.tool
def check_availability(ctx: RunContext, neighborhood: str) -> list[str]:
    return ["Ana", "Ben"]`,
          checks: [
            { re: /@agent\.tool/, hint: "Register it as a tool with the decorator on the line above the def: `@agent.tool`." },
            { re: /def check_availability\(ctx:RunContext,neighborhood:str\)->list\[str\]:/, hint: "Match the signature: a `ctx: RunContext` first, then `neighborhood: str`, returning `list[str]`." },
            { re: /return\["Ana"/, hint: "Return a list of free walker names — a stub like `[\"Ana\", \"Ben\"]` is fine until the checklist wires the real query." },
          ],
          mustNot: [
            { re: /def check_availability\(neighborhood/, hint: "A Pydantic AI tool takes `RunContext` as its FIRST parameter — put `ctx: RunContext` before `neighborhood`." },
          ],
          success: "You've given the agent a typed capability. Real query goes in next; the model now knows it CAN check availability instead of guessing.",
        },
        {
          type: "xcode",
          label: "Over to the terminal",
          title: "Fill in the real availability query",
          intro: ["Turn the stub into a real lookup and watch the agent suggest only free walkers. This path only runs when a real LLM key is set — the heuristic still works offline."],
          items: [
            "In `apps/backend/app/assistant/intent.py`, add your `@agent.tool`-decorated `check_availability` next to the `_agent()` setup",
            "Replace the stub return with a real query: use `data.find_walkers(ctx.deps.session, neighborhood)` and return `[w.name for w in matches]`",
            "In `.env`, set `PAWWALK_LLM_MODEL` (e.g. `anthropic:claude-3-5-haiku-latest`) and the matching provider key — see `.env.example`",
            "`cd apps/backend && uv run fastapi dev`",
            'Via [/docs](http://localhost:8000/docs), POST `/assistant/chat` with a booking message and confirm the agent leans on real walkers',
            "No key handy? That's fine — the heuristic path from earlier lessons still answers offline. Tools are the LLM upgrade, not a requirement.",
          ],
        },
        {
          type: "quiz",
          q: "You've now met three building blocks. Which statement pairs each with what it does?",
          choices: [
            "Node = a step (state → partial state); edge = which node runs next; tool = a typed function the LLM may call mid-reasoning",
            "Node = the LLM call; edge = a database row; tool = the reply text",
            "Node = which step runs next; edge = a typed function; tool = the shared state dict",
            "They're three names for the same thing — a prompt sent to the model",
          ],
          answer: 0,
          explain: "A **node** is a unit of work (`state -> partial state`). An **edge** — fixed or conditional — decides *which node is next*. A **tool** is a typed function you register with `@agent.tool` so the *model* can call it while reasoning. LangGraph orchestrates nodes and edges; Pydantic AI gives the one LLM node its typed brain and tools.",
          nudge: "One organizes work, one organizes order, one is a capability the model reaches for. Match each to graph.py and intent.py.",
        },
      ],
    },
  ],
});
