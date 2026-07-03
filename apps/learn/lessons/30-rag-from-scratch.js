window.COURSE = window.COURSE || [];
window.COURSE.push({
  id: "rag-from-scratch",
  title: "RAG from Scratch",
  emoji: "📚",
  lang: "python",
  lessons: [
    {
      id: "why-rag",
      title: "Why RAG",
      steps: [
        {
          type: "text",
          md: [
            "## The LLM doesn't know PawWalk",
            "In module 28 you saw what an LLM does: predict the next token from patterns it learned during training. That training happened long before this repo existed. So if you ask a raw model *“What's PawWalk's cancellation policy?”*, it has never seen `docs/API-CONTRACT.md` — it will confidently invent an answer. That made-up answer is called a **hallucination**, and it's the single biggest risk in shipping an LLM feature.",
            "The model isn't lying on purpose. It's doing exactly its job — producing plausible text — with no access to *your* facts. The fix is to hand it the facts at question time.",
          ],
        },
        {
          type: "text",
          md: [
            "## Two ways to teach a model your data",
            "- **Fine-tuning** — keep training the model on your documents until the facts are baked into its weights. Expensive, slow, needs re-doing every time a doc changes, and it *still* can't cite where an answer came from.\n- **Retrieval** — leave the model untouched. When a question comes in, **look up** the few most relevant snippets from your own documents and paste them into the prompt. The model reads them right there and answers from them.",
            "That second approach is **RAG — Retrieval-Augmented Generation**. \"Augmented\" because you augment (add to) the prompt with retrieved text. It's cheaper, updates the instant a doc changes, and can point at the exact source. For a small app with a folder of Markdown docs, it wins every time.",
          ],
        },
        {
          type: "text",
          md: [
            "## The pipeline, in words",
            "RAG is five plain steps — no magic, and you'll build every one of them in stdlib Python this module:",
            "1. **Chunk** — split each doc into small passages (a whole file is too big to paste).\n2. **Embed** — turn each chunk into a vector of numbers that represents its content.\n3. **Retrieve** — embed the *question* the same way, then find the chunks whose vectors are most similar.\n4. **Augment** — build a prompt: *“Answer ONLY from the context below,”* then the top chunks, then the question.\n5. **Generate** — send that prompt to the LLM (or module 28's heuristic) and get a grounded answer.",
            "> The corpus we'll retrieve from is this repo's own `docs/*.md` — the same files a human reads to understand PawWalk. `docs/API-CONTRACT.md`, `docs/ARCHITECTURE.md`, and friends become the assistant's knowledge base.",
          ],
        },
        {
          type: "quiz",
          q: "You ask a stock LLM (no retrieval) about PawWalk's cancellation rules. It answers fluently but the details are wrong. What happened?",
          choices: [
            "It hallucinated — it never saw PawWalk's docs, so it produced plausible-but-invented text",
            "Its internet connection to the docs timed out",
            "The docs are written in Markdown, which LLMs can't read",
            "It refused to answer because the topic is private",
          ],
          answer: 0,
          explain: "The model only knows patterns from its training data, and PawWalk's docs weren't in it. With nothing real to go on, it fills the gap with plausible text. RAG fixes this by pasting the actual doc snippets into the prompt before the model answers.",
          nudge: "The model has never read this repo. What does an LLM produce when it has no real facts for a question?",
        },
        {
          type: "quiz",
          q: "PawWalk's docs change often as the API evolves. Why is RAG a better fit than fine-tuning here?",
          choices: [
            "Retrieval reads the current docs at question time, so an edit is live immediately — no re-training",
            "Fine-tuning can't handle Markdown files",
            "RAG makes the model itself smarter and larger",
            "Fine-tuning always hallucinates and RAG never does",
          ],
          answer: 0,
          explain: "Fine-tuning bakes facts into the weights — every doc change means retraining. RAG leaves the model alone and just looks up the latest text each time, so updating a doc updates the answers instantly. (RAG can still be wrong if retrieval pulls the wrong chunk — but it's grounded in real text you can inspect.)",
          nudge: "Which approach needs re-training every time a doc is edited?",
        },
      ],
    },
    {
      id: "chunking",
      title: "Chunking",
      steps: [
        {
          type: "text",
          md: [
            "## Why not just paste the whole doc?",
            "The obvious idea — dump every doc into the prompt — fails for two reasons. First, the **context window** is finite (module 28): a big repo's docs won't fit. Second, even if they fit, burying the one relevant sentence in thousands of irrelevant ones makes the model's answer *worse*, not better, and costs more tokens.",
            "So we **chunk**: cut each document into small passages, and later retrieve only the handful that actually matter. A chunk is just a slice of the text — a few hundred characters, roughly a paragraph.",
          ],
        },
        {
          type: "text",
          md: [
            "## Reading the docs is module 17 again",
            "Loading a doc is exactly the `with open(...) as f:` pattern from module 17 — the corpus is plain files on disk:",
            "```\nfrom pathlib import Path\n\ndocs = {}\nfor path in Path(\"docs\").glob(\"*.md\"):\n    with open(path) as f:\n        docs[path.name] = f.read()\n```",
            "`Path(\"docs\").glob(\"*.md\")` yields every Markdown file; `f.read()` returns its whole text as one string. Now each doc is a big string ready to be chunked.",
          ],
        },
        {
          type: "text",
          md: [
            "## Size, and why overlap matters",
            "The simplest chunker walks the text in fixed-size windows: characters `0–500`, then `500–1000`, and so on. But a hard cut can slice a sentence — or a policy rule — right down the middle, so neither chunk contains the whole idea.",
            "The fix is **overlap**: start each new chunk a little *before* the previous one ended. With `size=500` and `overlap=50`, chunk two starts at character `450`, repeating the last 50 characters of chunk one. That way a sentence straddling the boundary survives intact in at least one chunk. The step forward is therefore `size - overlap`, not `size`.",
          ],
        },
        {
          type: "code",
          title: "The shape of a fixed-size chunker",
          source: String.raw`text = "abcdefghij"
size, overlap = 4, 1

i = 0
while i < len(text):
    print(text[i : i + size])
    i += size - overlap
# abcd  (0..4)
# defg  (3..7, the 'd' overlaps)
# ghij  (6..10)
# j     (9..10, tail)`,
          caption: "`text[i : i + size]` slices one window. `i += size - overlap` advances by 3 each loop (4 minus the 1-char overlap), so every window shares its first character with the previous window's last.",
        },
        {
          type: "quiz",
          q: "With `size=500` and `overlap=50`, how far does the start index move forward after each chunk?",
          choices: ["450 characters", "500 characters", "50 characters", "550 characters"],
          answer: 0,
          explain: "You step forward by `size - overlap` = 500 - 50 = 450. The extra 50 characters at the front of each chunk are the overlap that keeps boundary-straddling sentences whole. Step by the full 500 and you lose the overlap entirely.",
          nudge: "The step is `size - overlap`. Plug in the numbers.",
        },
        {
          type: "exercise",
          title: "Write the chunker",
          prompt: [
            "Write `chunk(text, size, overlap)` that returns a **list** of string slices of `text`.",
            "Start `i` at `0`. While `i < len(text)`, append the slice `text[i : i + size]`, then advance `i` by `size - overlap`. Return the list of chunks.",
          ],
          starter: String.raw`def chunk(text, size, overlap):
    chunks = []
    i = 0
    # your code here
    return chunks`,
          solution: String.raw`def chunk(text, size, overlap):
    chunks = []
    i = 0
    while i < len(text):
        chunks.append(text[i : i + size])
        i += size - overlap
    return chunks`,
          checks: [
            { re: /while i<len\(text\):/, hint: "Loop until you've passed the end: `while i < len(text):`." },
            { re: /chunks\.append\(text\[i:i\+size\]\)/, hint: "Append one window: `chunks.append(text[i : i + size])` — slice from `i` to `i + size`." },
            { re: /i\+=size-overlap/, hint: "Advance by the step, not the full size: `i += size - overlap`. That leaves the overlap in place." },
          ],
          mustNot: [
            { re: /i\+=size(?!-)/, hint: "Stepping by `size` alone drops the overlap entirely — advance by `size - overlap` so chunks share their edges." },
          ],
          success: "That's a real chunker. Every RAG system starts here — smarter ones split on headings or sentences, but the fixed-window-with-overlap idea is the backbone.",
        },
      ],
    },
    {
      id: "vectors-cosine",
      title: "Vectors & cosine similarity",
      steps: [
        {
          type: "text",
          md: [
            "## Turning text into numbers",
            "To find the chunks most *similar* to a question, we need to compare text mathematically. So we turn each chunk into a **vector** — a bag of numbers describing it. The honest toy version is **bag-of-words**: just count how often each word appears, ignoring order.",
            "`collections.Counter` (a `dict` subclass you met in Stage A) does the counting for free. `\"the walker cancelled the walk\"` becomes `{\"the\": 2, \"walker\": 1, \"cancelled\": 1, \"walk\": 1}`. That dict *is* the vector — each word is a dimension, each count is that dimension's value.",
          ],
        },
        {
          type: "code",
          title: "Bag-of-words with Counter",
          source: String.raw`from collections import Counter

def embed(text):
    words = text.lower().split()
    return Counter(words)

a = embed("the walker cancelled the booking")
b = embed("cancel the booking policy")
print(a)  # Counter({'the': 2, 'walker': 1, 'cancelled': 1, 'booking': 1})
print(b)  # Counter({'cancel': 1, 'the': 1, 'booking': 1, 'policy': 1})`,
          caption: "`.lower().split()` normalizes case and breaks on whitespace; `Counter` tallies each word. These two share `the` and `booking` — that overlap is the signal we'll measure.",
        },
        {
          type: "text",
          md: [
            "## Cosine similarity: how much do two vectors point the same way?",
            "Two bag-of-words vectors are *similar* when they share words. The standard measure is **cosine similarity** — the cosine of the angle between the two vectors. It's `1.0` when they point the same direction (identical word mixes), `0.0` when they share no words at all, and in between otherwise. Crucially it ignores length, so a long chunk and a short question compare fairly.",
            "The formula is the **dot product** divided by the product of the two vectors' **magnitudes**:",
            "- **Dot product** — for every word the two share, multiply the counts and sum: `sum(a[k] * b[k] for shared word k)`.\n- **Magnitude** of a vector — `sqrt(sum of each count squared)`. In Python that's `math.sqrt(...)`, or just `... ** 0.5` (raising to the ½ power *is* a square root).",
          ],
        },
        {
          type: "code",
          title: "Cosine, in six lines of stdlib",
          source: String.raw`from math import sqrt

def cosine(a, b):
    shared = set(a) & set(b)
    dot = sum(a[k] * b[k] for k in shared)
    na = sqrt(sum(v * v for v in a.values()))
    nb = sqrt(sum(v * v for v in b.values()))
    return dot / (na * nb) if na and nb else 0.0`,
          caption: "`set(a) & set(b)` is the words in common (a dict iterates its keys). The dot product only needs shared words — a word in just one vector contributes `count * 0 = 0`. The `if na and nb` guard avoids dividing by zero on an empty vector.",
        },
        {
          type: "quiz",
          q: "Two chunks share NO words at all. What is their cosine similarity?",
          choices: ["0.0 — the dot product is zero, so they're maximally dissimilar", "1.0 — every vector is similar to itself", "Undefined — you can't compare them", "Negative — counts can go below zero"],
          answer: 0,
          explain: "With no shared words the dot product is 0, so cosine is 0/(…) = 0.0 — no similarity. Identical word mixes give 1.0. Bag-of-words counts are never negative, so cosine here stays between 0 and 1.",
          nudge: "The dot product only sums over shared words. No shared words → what's the numerator?",
        },
        {
          type: "exercise",
          title: "Implement cosine similarity",
          prompt: [
            "Write `cosine(a, b)` for two `Counter` vectors. Compute the **dot product** over shared keys, each vector's **magnitude**, and return `dot` divided by the product of the magnitudes.",
            "Use `a[k] * b[k]` in a loop over the shared keys for the dot product, and `** 0.5` (or `sqrt`) for the magnitudes. The starter guards the empty-vector case for you.",
          ],
          starter: String.raw`def cosine(a, b):
    shared = set(a) & set(b)
    na = sum(v * v for v in a.values())
    nb = sum(v * v for v in b.values())
    if na == 0 or nb == 0:
        return 0.0
    # your code here`,
          solution: String.raw`def cosine(a, b):
    shared = set(a) & set(b)
    na = sum(v * v for v in a.values())
    nb = sum(v * v for v in b.values())
    if na == 0 or nb == 0:
        return 0.0
    dot = sum(a[k] * b[k] for k in shared)
    return dot / (na ** 0.5 * nb ** 0.5)`,
          checks: [
            { re: /dot=sum\(a\[k\]\*b\[k\]for k in shared\)/, hint: "Dot product over shared keys: `dot = sum(a[k] * b[k] for k in shared)` — multiply the two counts for each shared word and sum." },
            { re: /return dot\//, hint: "You return the dot product divided by something: `return dot / (…)`." },
            { re: /na\*\*0\.5\*nb\*\*0\.5/, hint: "The denominator is the product of magnitudes: `na ** 0.5 * nb ** 0.5` (raising a sum-of-squares to the ½ power is its square root)." },
          ],
          mustNot: [
            { re: /return dot\/\(na\*nb\)/, hint: "`na` and `nb` here are the sums of squares — you still need the square root of each: `na ** 0.5 * nb ** 0.5`, not `na * nb`." },
          ],
          success: "That's the exact similarity function real vector databases run — just over 1536-dimensional learned embeddings instead of word counts. The math is identical.",
        },
        {
          type: "text",
          md: [
            "## What real embeddings add",
            "Bag-of-words only sees *exact* word overlap. Ask *“How do I call off a walk?”* and it scores low against a doc that says *“cancel a booking”* — same meaning, zero shared words. **Real embedding models** (a stretch item in the next lesson) fix this: they map text to vectors where *meaning* is close, so \"call off\" and \"cancel\" land near each other. Same `cosine` function, smarter vectors.",
          ],
        },
        {
          type: "quiz",
          q: "Why does the bag-of-words retriever miss the doc when the question says \"call off a walk\" but the doc says \"cancel a booking\"?",
          choices: [
            "Bag-of-words scores only exact word overlap — synonyms share no words, so cosine is near zero",
            "The doc is too long to fit in a Counter",
            "cosine can't handle questions, only documents",
            "\"walk\" and \"booking\" are the same word to a Counter",
          ],
          answer: 0,
          explain: "Counters compare literal words, so synonyms look unrelated. This is exactly the gap real embedding models close by placing similar *meanings* near each other in vector space — while you reuse the same `cosine` function unchanged.",
          nudge: "What does bag-of-words actually compare — the meaning of words, or the words themselves?",
        },
      ],
    },
    {
      id: "retrieve-generate",
      title: "Retrieve & generate",
      steps: [
        {
          type: "text",
          md: [
            "## Putting it together: retrieve the top-k",
            "You now have every piece. **Retrieval** is: embed the question, score it against every chunk with `cosine`, sort by score, and keep the best few — the **top-k** (k is usually 3–5). Those are the passages most likely to hold the answer.",
            "`sorted(..., key=..., reverse=True)[:k]` does the sort-and-slice in one line — the same `sorted` you'd use on any list, with a `key` that pulls out each chunk's score.",
          ],
        },
        {
          type: "code",
          title: "Retrieve the k best chunks",
          source: String.raw`def retrieve(question, chunks, k=3):
    q = embed(question)
    scored = [(cosine(q, embed(text)), text, source) for source, text in chunks]
    scored.sort(reverse=True)
    return scored[:k]`,
          caption: "`chunks` is a list of `(source, text)` pairs — `source` is the filename, so we can cite it. Each chunk gets a `(score, text, source)` tuple; sorting tuples sorts by score first, so `reverse=True` puts the best on top, and `[:k]` keeps them.",
        },
        {
          type: "text",
          md: [
            "## Augment: build the grounded prompt",
            "Now **augment** the prompt. The template is the heart of RAG — it fences the model in so it answers from the retrieved text and nothing else:",
            "```\ncontext = \"\\n\\n\".join(text for score, text, source in top)\nprompt = (\n    \"Answer ONLY from the context below. \"\n    \"If the answer isn't there, say you don't know.\\n\\n\"\n    f\"Context:\\n{context}\\n\\n\"\n    f\"Question: {question}\"\n)\n```",
            "That *“Answer ONLY from the context below”* instruction is what turns a hallucination-prone model into a grounded one. It can only use what you handed it — and if the answer isn't there, it says so instead of inventing.",
          ],
        },
        {
          type: "text",
          md: [
            "## Generate: reuse module 28",
            "The final **generate** step is the module-28 assistant: pass the augmented prompt to the LLM if a key is set, or to the heuristic fallback if not. Either way the answer is now built from *real PawWalk docs*, and because each chunk carried its `source` filename, you can print *“from docs/API-CONTRACT.md”* next to the answer — a citation, the thing fine-tuning could never give you.",
          ],
        },
        {
          type: "quiz",
          q: "Why does the augmented prompt open with “Answer ONLY from the context below. If the answer isn't there, say you don't know”?",
          choices: [
            "It fences the model to the retrieved text, so it grounds answers in real docs instead of hallucinating",
            "It makes the model respond faster",
            "It's required syntax that every LLM API demands",
            "It hides the context from the user for privacy",
          ],
          answer: 0,
          explain: "The instruction constrains the model to the passages you retrieved. Combined with real chunks from your docs, that's what makes RAG trustworthy — and the \"say you don't know\" clause stops it from inventing an answer when retrieval comes up empty.",
          nudge: "What is the instruction trying to stop the model from doing when the context lacks the answer?",
        },
        {
          type: "xcode",
          label: "Over to the terminal",
          title: "Build rag.py and ask it three questions",
          intro: [
            "Assemble the whole pipeline as one stdlib script in a fresh playground, point it at this repo's docs, and watch it cite the right file. No new dependencies — everything you need ships with Python.",
          ],
          items: [
            "`mkdir -p playground/rag-pawwalk && cd playground/rag-pawwalk` — a gitignored scratch project",
            "Create `rag.py`. At the top: `from pathlib import Path`, `from collections import Counter`, `from math import sqrt`.",
            "Add `embed(text)` (lowercase + split into a `Counter`), your `chunk(text, size, overlap)` from lesson 2, and your `cosine(a, b)` from lesson 3.",
            "Load the corpus: loop `Path(\"../../docs\").glob(\"*.md\")`, `open()` each file, and `chunk(f.read(), 500, 50)` it — collect `(source_filename, chunk_text)` pairs into one list.",
            "Add `retrieve(question, chunks, k=3)`: embed the question, score every chunk with `cosine`, `sort(reverse=True)`, return the top 3 `(score, text, source)` tuples.",
            "Build the augmented prompt string: `\"Answer ONLY from the context below…\"` + the joined top-3 chunks + the question. Print the prompt and the winning `source` filename (that's your citation).",
            "Wire generation: import module 28's assistant if you like, or just print the top chunk as the answer for now — the retrieval is the part you built.",
            "Run `python3 rag.py` and ask three PawWalk questions: *“What is the cancellation policy?”*, *“Which framework is the backend built with?”*, *“What does a Booking look like?”* — confirm each cites the right doc (API-CONTRACT.md, ARCHITECTURE.md, API-CONTRACT.md).",
            "STRETCH (optional, needs a key): swap `embed` to call a real embeddings API and re-embed the chunks. The vectors get smarter; `cosine` and everything downstream stay exactly the same.",
          ],
        },
        {
          type: "quiz",
          q: "Put the RAG pipeline in order, from raw docs to a grounded answer:",
          choices: [
            "chunk → embed → retrieve (cosine top-k) → augment the prompt → generate",
            "embed → chunk → generate → retrieve → augment",
            "generate → augment → retrieve → embed → chunk",
            "retrieve → chunk → embed → generate → augment",
          ],
          answer: 0,
          explain: "Split the docs into chunks, embed each into a vector, retrieve the top-k most similar to the question via cosine, augment the prompt with those chunks (\"Answer ONLY from the context below…\"), and generate the answer. That's RAG end to end — and you built every step in plain Python.",
          nudge: "You can't retrieve before you've embedded, and you can't embed before you've chunked. Start from the raw docs.",
        },
      ],
    },
  ],
});
