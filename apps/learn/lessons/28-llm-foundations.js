window.COURSE = window.COURSE || [];
window.COURSE.push({
  id: "llm-foundations",
  title: "LLM Foundations",
  emoji: "🤖",
  lang: "python",
  lessons: [
    {
      id: "what-an-llm-does",
      title: "What an LLM actually does",
      steps: [
        {
          type: "text",
          md: [
            "## The finale: teaching PawWalk to understand English",
            "You've built the whole backend: routes, validation, a database, auth, payments, tests. This last stage adds the piece your iOS app teased in Part I — the **assistant** that turns *\"walk my dog in Mission tomorrow at 3pm\"* into a real booking.",
            "That means putting a **large language model (LLM)** inside the backend. Before we wire one in, you need an honest picture of what an LLM *is* — because its one surprising weakness shapes every design choice in this stage.",
          ],
        },
        {
          type: "text",
          md: [
            "## It predicts the next token. That's it.",
            "An LLM does exactly one thing: given some text, it predicts the **next token** — then appends it and predicts again, one token at a time, until it decides to stop. A **token** is a chunk of text, roughly ¾ of a word (`\"walking\"` might be `\"walk\"` + `\"ing\"`). The model has no database, no memory of you, no plan. Each step is just: *given everything so far, what token is most likely next?*",
            "The text it can \"see\" at once — your input plus what it has generated — is the **context window**, measured in tokens. Everything outside that window may as well not exist. A booking message is tiny; a whole PawWalk manual would not fit, which is exactly the problem RAG solves two modules from now.",
          ],
        },
        {
          type: "text",
          md: [
            "## Temperature: the randomness dial",
            "\"Most likely next token\" isn't the only option — the model has a probability for *every* possible next token, and **temperature** controls how much it gambles. At temperature `0` it always takes the single most likely token (repeatable, boring, ideal for parsing). Crank it up and it samples less likely tokens too — more creative, more varied, and more likely to wander off.",
            "For a booking parser you want low temperature: the same message should give the same answer every time. For writing a friendly reply, a little temperature makes it sound less robotic.",
          ],
        },
        {
          type: "text",
          md: [
            "## Why this is a problem for your program",
            "Here's the catch. Your FastAPI code speaks in **types**: a `BookingIntent` with a `duration_minutes: Duration`, a `start_time: datetime | None`. An LLM speaks in **free text** — a stream of tokens that *looks* like an answer.",
            "Ask an LLM for a booking and it might reply `\"Sure! Book a 60-minute walk.\"` one time and `\"I'd suggest an hour-long stroll 🐕\"` the next. Both are correct English. Neither is something your code can `duration_minutes = ...` from without guessing. Raw LLM text is **unreliable as program input** — not because the model is dumb, but because prose has no schema.",
            "> The whole job of this module is closing that gap: making the LLM hand back a *typed* `BookingIntent`, not a sentence you have to parse by hand.",
          ],
        },
        {
          type: "quiz",
          q: "At its core, generating a response, what is an LLM actually doing?",
          choices: [
            "Predicting the next token repeatedly, one at a time, based on all the text so far",
            "Looking up the answer in a built-in database of facts",
            "Running your question through a fixed set of if/else rules",
            "Searching the live internet and summarizing the top results",
          ],
          answer: 0,
          explain: "That's the entire mechanism: next-token prediction, appended and repeated. No lookup table, no rules engine, no live search — just probabilities over the next token, bounded by the context window.",
          nudge: "Re-read the second step. There's no database and no plan inside the model — only one repeated operation.",
        },
        {
          type: "quiz",
          q: "Why can't your FastAPI route trust raw LLM text as input to build a typed `BookingIntent`?",
          choices: [
            "Prose has no schema — the same request can come back in endlessly different wordings, so there's no reliable field to read",
            "LLMs only ever output invalid JSON that Python refuses to parse",
            "The text is encrypted and must be decoded with a provider key first",
            "Python can't store strings longer than the context window",
          ],
          answer: 0,
          explain: "The model is fluent, not structured. \"a 60-minute walk\" and \"an hour-long stroll\" mean the same thing to a human and nothing consistent to `duration_minutes = ...`. Free text has no guaranteed shape — that's the gap the rest of this module closes.",
          nudge: "Think about the two different-but-correct replies in the last text step. What made them useless to your typed code?",
        },
      ],
    },
    {
      id: "prompts-chat-shape",
      title: "Prompts & chat shape",
      steps: [
        {
          type: "text",
          md: [
            "## A prompt is a function argument, not a spell",
            "It's tempting to treat prompting like magic incantations. Drop that framing. A **prompt** is just the text you pass to the model — an argument to a function, the same way you pass `message` to a Python function. Better arguments give better results; there's nothing mystical about it.",
            "Modern chat models don't take one flat blob of text, though. They take a **list of messages**, each with a **role**. Three roles matter.",
          ],
        },
        {
          type: "text",
          md: [
            "## Three roles: system, user, assistant",
            "- **system** — the standing instructions. *Who the model is and what job it's doing.* Set once, applies to the whole conversation. This is where you say \"You extract dog-walking booking details.\"\n- **user** — what the person typed. *\"Walk my dog in Mission tomorrow at 3pm.\"*\n- **assistant** — what the model said back. In a multi-turn chat, past assistant replies are fed back in so the model remembers the thread.",
            "A single request is usually one **system** message plus one **user** message. The system message is your leverage: it's how you turn a general-purpose model into a *booking parser* specifically.",
          ],
        },
        {
          type: "code",
          title: "The shape of a chat request (illustrative)",
          source: String.raw`messages = [
    {"role": "system", "content": "You extract dog-walking booking details."},
    {"role": "user", "content": "Walk my dog in Mission tomorrow at 3pm"},
]`,
          caption: "A list of role-tagged dicts — dicts and lists, exactly the containers from module 15. Pydantic AI (next lesson) builds this list for you from a system instruction plus the user's message, so you rarely assemble it by hand. But this is what's underneath.",
        },
        {
          type: "text",
          md: [
            "## Few-shot: teach by example",
            "One more trick worth knowing. If a plain instruction isn't precise enough, you can put a couple of **examples** right in the prompt — an example input and the exact output you'd want for it. This is called **few-shot** prompting (zero examples = *zero-shot*).",
            "For a parser, one or two worked examples (\"message → the fields it should produce\") often pin down edge cases better than another paragraph of instructions. The examples *are* the specification, shown rather than described.",
          ],
        },
        {
          type: "text",
          md: [
            "## Your turn: write the system prompt",
            "The system message for PawWalk's booking parser is a plain Python **string**. Write it. There's no single right wording — a good one names the model's **role** (it extracts booking details) and states that the output must be **structured / JSON**, not chatty prose.",
            "Assign it to a variable called `system_prompt`. One string, that's the whole exercise.",
          ],
        },
        {
          type: "exercise",
          title: "Write a booking-parser system prompt",
          prompt: [
            "Assign a string to `system_prompt` that (a) tells the model its **role** is to extract dog-walking booking details, and (b) says the output must be **structured** (mention `structured` or `JSON`).",
            "Any sensible wording passes — this is prose, not code golf. Example: `You extract dog-walking booking details and return structured JSON.`",
          ],
          starter: String.raw`# Write one string and assign it to system_prompt
`,
          solution: String.raw`system_prompt = "You extract dog-walking booking details and return structured JSON."`,
          checks: [
            { re: /system_prompt="/, hint: "Assign a double-quoted string to `system_prompt` — `system_prompt = \"...\"`." },
            { re: /extract/i, hint: "Name the model's job. The word `extract` (as in \"extract booking details\") makes the role concrete." },
            { re: /structured|json/i, hint: "Say the output must be `structured` or `JSON`, not free-form prose — that's the whole point of the parser." },
          ],
          success: "That string is doing real work: it's the difference between a chatty general model and a focused booking parser. Next lesson makes the \"structured\" part enforceable instead of just requested.",
        },
      ],
    },
    {
      id: "structured-output",
      title: "Structured output",
      steps: [
        {
          type: "text",
          md: [
            "## The killer idea: make the type the contract",
            "Your system prompt *asks* for structured output. But asking isn't enforcing — the model can still hand back prose on a bad day, and now your code has to defend against it. This lesson removes the hope.",
            "**Pydantic AI** is the library the real backend uses. Its central object is an `Agent`, and its killer feature is one keyword: `output_type`. You give it a Pydantic model, and the agent *guarantees* the model's reply matches that schema — validating the output and **retrying** the model if it doesn't — before your code ever sees it.",
          ],
        },
        {
          type: "code",
          title: "Constructing the agent (from app/assistant/intent.py)",
          source: String.raw`return Agent(
    settings.llm_model,
    output_type=BookingIntent,
    instructions=(
        "You extract dog-walking booking details from a user's message. "
        f"Known neighborhoods: {', '.join(_KNOWN_HOODS)}. "
        "Only fill fields you are confident about; leave others null."
    ),
)`,
          caption: "The real agent, verbatim. `output_type=BookingIntent` is the whole trick: the reply is forced to become a valid `BookingIntent`, not a sentence. `instructions` is the system prompt you just practiced writing — same idea, real code. Remember module 23's `response_model=`? Same philosophy: the type IS the contract, here pointed at the LLM instead of the HTTP response.",
        },
        {
          type: "text",
          md: [
            "## The model it must match",
            "`BookingIntent` is an ordinary Pydantic model from `app/schemas.py` — the same `BaseModel` you've been writing since module 23. Because the agent's `output_type` is this class, whatever the LLM produces gets `model_validate`'d into it. A reply that doesn't fit the shape isn't accepted; the agent asks the model to try again.",
          ],
        },
        {
          type: "code",
          title: "app/schemas.py",
          source: String.raw`class BookingIntent(BaseModel):
    """Typed output of the intent-parsing step (heuristic or Pydantic AI agent)."""
    neighborhood: str | None = None
    dog_name: str | None = None
    duration_minutes: Duration = 30
    start_time: datetime | None = None`,
          caption: "`Duration` is the `Literal[30, 45, 60]` from module 16 — the LLM can't return a 37-minute walk, the type forbids it. Every field except `duration_minutes` is optional (`str | None = None`), because a real message often mentions only some of them.",
        },
        {
          type: "quiz",
          q: "What does `output_type=BookingIntent` actually guarantee about the agent's result?",
          choices: [
            "The result is a valid BookingIntent — validated against the schema, with the model retried if its reply doesn't fit",
            "The LLM runs faster because it has fewer tokens to generate",
            "The result is always the raw text string the model produced",
            "The agent skips the LLM entirely and returns an empty BookingIntent",
          ],
          answer: 0,
          explain: "That's the payoff: the boundary between fuzzy LLM text and your typed code is enforced *by the type itself*. Your route gets a `BookingIntent` or nothing — never a sentence to parse by hand.",
          nudge: "Re-read the first step: the agent validates the output against the schema and does something specific when it doesn't match.",
        },
        {
          type: "text",
          md: [
            "## Your turn: extend the schema",
            "Suppose an earlier version of `BookingIntent` didn't track the dog's name yet — like this:",
            "```\nclass BookingIntent(BaseModel):\n    neighborhood: str | None = None\n    duration_minutes: Duration = 30\n    start_time: datetime | None = None\n```",
            "Add a new **optional** field `dog_name` so the parser can capture *\"walk Mochi\"*. Optional Pydantic fields follow the module-16 pattern: `name: str | None = None`.",
          ],
        },
        {
          type: "exercise",
          title: "Add dog_name to BookingIntent",
          prompt: [
            "Add one field to the model: `dog_name: str | None = None`.",
            "It goes right alongside the others — a string that may also be `None`, defaulting to `None` so a message without a dog name still validates.",
          ],
          starter: String.raw`class BookingIntent(BaseModel):
    neighborhood: str | None = None
    # your code here
    duration_minutes: Duration = 30
    start_time: datetime | None = None`,
          solution: String.raw`class BookingIntent(BaseModel):
    neighborhood: str | None = None
    dog_name: str | None = None
    duration_minutes: Duration = 30
    start_time: datetime | None = None`,
          checks: [
            { re: /dog_name:str\|None/, hint: "Type it as `dog_name: str | None` — a string OR `None`, the module-16 optional pattern." },
            { re: /dog_name:str\|None=None/, hint: "Give it a default of `None` so a message with no dog name still validates: `dog_name: str | None = None`." },
          ],
          mustNot: [
            { re: /dog_name:str=/, hint: "Don't make it a required plain `str` — most messages won't name the dog, so it must be optional (`str | None`)." },
          ],
          success: "You just extended the exact schema the real agent targets — and because it's the `output_type`, the LLM will now be forced to fill (or leave null) a `dog_name` field too. This is the field you'll teach the parser to populate in the next module.",
        },
      ],
    },
    {
      id: "the-fallback-pattern",
      title: "The fallback pattern",
      steps: [
        {
          type: "text",
          md: [
            "## No key? The server still works.",
            "Calling a real LLM needs a provider key and a network round-trip — money and latency you don't always want, and things you definitely don't want in a test suite. So the PawWalk assistant is built to run **fully offline by default**.",
            "The design: a **heuristic parser** — plain Python, no network — always runs and produces a `BookingIntent`. Only if a model is configured does the LLM run *on top* of it. This isn't a hack around a missing feature; graceful degradation is the design.",
          ],
        },
        {
          type: "code",
          title: "app/assistant/intent.py",
          source: String.raw`def heuristic_intent(message: str) -> BookingIntent:
    return BookingIntent(
        neighborhood=_parse_neighborhood(message),
        duration_minutes=_parse_duration(message),  # type: ignore[arg-type]
        start_time=_parse_start_time(message),
    )`,
          caption: "The offline parser, verbatim. It's just regex helpers — `_parse_duration` looks for \"60\"/\"an hour\", `_parse_neighborhood` matches known hoods. Crude, but deterministic and free. It returns the same `BookingIntent` type the LLM would.",
        },
        {
          type: "code",
          title: "app/assistant/intent.py — extract_intent",
          source: String.raw`def extract_intent(message: str) -> BookingIntent:
    base = heuristic_intent(message)
    if not settings.has_llm:
        return base
    try:
        result = _agent().run_sync(message)
        llm = result.output
        # Prefer LLM values, but fall back to heuristic where the LLM left blanks.
        return BookingIntent(
            neighborhood=llm.neighborhood or base.neighborhood,
            dog_name=llm.dog_name or base.dog_name,
            duration_minutes=llm.duration_minutes or base.duration_minutes,
            start_time=llm.start_time or base.start_time,
        )
    except Exception:
        # Never let an LLM/network error break the endpoint.
        return base`,
          caption: "The pattern in full. `base` (heuristic) always runs first. `settings.has_llm` is `True` only when `PAWWALK_LLM_MODEL` is set (see `.env.example`). If it's unset — or the LLM call throws — you get `base` back. The endpoint can never fail just because the model is down.",
        },
        {
          type: "text",
          md: [
            "## `@lru_cache`: build the agent once",
            "One detail from module 24's dependency-injection mindset. Constructing the agent is expensive, so `_agent()` is wrapped in `@lru_cache(maxsize=1)` — the first call builds it, every later call returns the cached instance. Same lazy-singleton trick you'd reach for anywhere; here it keeps a network client from being rebuilt on every request.",
          ],
        },
        {
          type: "quiz",
          q: "A request hits `/assistant/chat` and `PAWWALK_LLM_MODEL` is NOT set. What does `extract_intent` return?",
          choices: [
            "The heuristic `base` result — `has_llm` is False, so the LLM branch is skipped entirely",
            "An HTTP 500 error, because no model is configured",
            "None, and the caller has to handle the missing value",
            "It waits for a key to be added, blocking the request",
          ],
          answer: 0,
          explain: "`base = heuristic_intent(message)` runs first, then `if not settings.has_llm: return base`. No key means no network, no crash — a real, typed `BookingIntent` from pure Python. That's why the whole test suite runs offline.",
          nudge: "Trace the first three lines of `extract_intent` with `has_llm` being False.",
        },
        {
          type: "xcode",
          label: "Over to the terminal",
          title: "Call the assistant — with no key, then (stretch) with one",
          intro: ["See the fallback pattern for real. First offline (the default), then optionally with a live model so you can compare."],
          items: [
            "Make sure the backend is running: `cd apps/backend && uv run fastapi dev` (leave it up)",
            "Open [http://localhost:8000/docs](http://localhost:8000/docs) and expand `POST /assistant/chat`",
            "**Try it out** → set the body to `{\"message\": \"Walk my dog in Mission tomorrow at 3pm\"}` → **Execute**",
            "Read the reply: the heuristic parser pulled out the neighborhood, duration, and time — no key, no network, a real typed answer",
            "Send a vaguer message like `{\"message\": \"I need a walk sometime\"}` and notice which fields come back null — the heuristic only fills what it's confident about",
            "STRETCH (costs a request, needs a key): copy `.env.example` to `.env`, set `PAWWALK_LLM_MODEL=` to a real model (e.g. `anthropic:claude-3-5-haiku-latest`), add the matching provider key (`ANTHROPIC_API_KEY=...`), restart the server",
            "STRETCH: send a trickier message like `{\"message\": \"walk Mochi for an hour after lunch\"}` and compare — the LLM can catch phrasing (\"after lunch\", the dog's name) the regex heuristic misses",
          ],
        },
        {
          type: "quiz",
          q: "Why does the backend keep the heuristic parser even when a real LLM is configured?",
          choices: [
            "Graceful degradation — if the LLM call errors or leaves a field blank, the heuristic result is there to fall back on",
            "Because heuristics are always more accurate than an LLM",
            "To avoid ever having to write Pydantic models",
            "The LLM legally requires a backup parser to run alongside it",
          ],
          answer: 0,
          explain: "`base` always runs first, and the LLM path is wrapped in `try/except` that returns `base` on any failure — plus it fills LLM blanks from the heuristic. A network blip degrades quality, never availability. That resilience is a design choice, not an accident.",
          nudge: "Look at the `except Exception: return base` line and the `llm.x or base.x` merges — what do both protect against?",
        },
      ],
    },
  ],
});
