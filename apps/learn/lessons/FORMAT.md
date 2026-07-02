# Lesson file format

Each file in `lessons/` is a plain JS script that pushes ONE module onto `window.COURSE`.
Files load in the order listed in `index.html` — that order IS the course order.
Validate with `node tools/validate.mjs` (run it from `apps/learn/`); it must pass with 0 errors.

## Hard rules (violations break the site silently)

1. **All Swift code strings use `String.raw` templates.** Swift is full of `\(interpolation)`
   and `\n`; a normal string or template literal eats the backslashes.
   ```js
   source: String.raw`
   let name = "Mochi"
   print("Hello \(name)")
   `,
   ```
2. **Never use plain backtick templates for code fields** (`source`, `starter`, `solution`).
3. **`md` / `prompt` / `intro` fields are ARRAYS of double-quoted strings**, one block each.
   Inline markdown supported: `` `code` ``, `**bold**`, `*italic*`, `[text](https://url)`.
   Block prefixes: `"## Heading"`, `"### Subheading"`, `"- item\n- item"` (list),
   `"1. a\n2. b"` (numbered), `"> tip callout"`. Plain block = paragraph.
4. **Check rules are regex LITERALS** (`/…/`), never `new RegExp("…")`.
5. Swift code must be real Swift 6 / SwiftUI that compiles in the PawWalk app — when a lesson
   rebuilds a repo file, match the repo file.

## Module shape

```js
window.COURSE = window.COURSE || [];
window.COURSE.push({
  id: "swift-basics",          // kebab-case, unique across the course
  title: "Swift Basics",
  emoji: "🔤",
  lessons: [ { id: "variables", title: "Variables & Constants", steps: [ /* … */ ] } ],
});
```

## Step types

### text — explanation
```js
{ type: "text", md: ["## Why constants?", "Swift prefers `let`…", "> Tip: …"] }
```

### code — read-only, syntax-highlighted sample (not gated)
```js
{ type: "code", title: "Models/Models.swift", source: String.raw`…`, caption: "optional one-liner under the block" }
```

### quiz — one multiple-choice question (gates Continue until answered right)
```js
{ type: "quiz",
  q: "What does `let` mean?",
  choices: ["A constant", "A variable", "A function", "A loop"],
  answer: 0,                                  // index into choices
  explain: "`let` declares a value that can never change.",   // shown on success
  nudge: "One of these can never be reassigned…" }             // shown on a wrong pick (optional)
```

### exercise — the learner TYPES Swift code; checked with regexes (gates Continue)
```js
{ type: "exercise",
  title: "Add a price label",
  prompt: ["Write a computed property `priceLabel`…"],
  starter: String.raw`struct Walker {
    let pricePer30MinCents: Int
    // your code here
}`,
  solution: String.raw`struct Walker {
    let pricePer30MinCents: Int
    var priceLabel: String { "$\(pricePer30MinCents / 100) / 30 min" }
}`,
  checks: [
    { re: /var priceLabel:String\{/, hint: "Declare it as `var priceLabel: String { … }` — computed properties are `var`." },
    { re: /pricePer30MinCents\/100/, hint: "Divide the cents by 100 inside the string interpolation." },
  ],
  mustNot: [
    { re: /func priceLabel/, hint: "A computed property, not a function — use `var`, no parentheses." },
  ],
  success: "You just wrote the exact code that ships in Models.swift." }
```

**How checking works — write regexes against NORMALIZED code.** Before matching, the
learner's code is normalized: comments stripped, all whitespace collapsed, then spaces
around punctuation removed. So `var priceLabel: String { "$\(x)" }` becomes
`var priceLabel:String{"$\(x)"}`. Consequences for your regexes:

- No spaces around `:`, `{`, `(`, `=`, `->`, `,` etc. Between two word-characters there is
  exactly one space: `let name`, `var priceLabel`.
- Escape regex metacharacters that appear in Swift: `\(`, `\)`, `\{`, `\}`, `\$`, `\.`, `\?`, `\[`.
- Prefer several SHORT checks (each with a specific, teaching hint) over one giant regex.
  2–4 checks per exercise is the sweet spot. The hint is what the learner sees when that
  check fails — write it as a nudge, not the answer.
- The validator asserts `solution` passes every `checks` regex and no `mustNot` regex.
  If validation fails, fix the regex or the solution.
- Keep exercises SMALL: 1–8 lines of typing. Give the surrounding code in `starter`
  with a `// your code here` marker rather than asking for whole files.

### xcode — a real-world checklist done outside the browser (gates Continue; has a skip link)
```js
{ type: "xcode",
  title: "Run the app",
  intro: ["Now see it live on the simulator:"],
  items: ["Open Terminal and run `cd apps/ios && xcodegen generate`", "…"] }
```

## Pedagogy rules

- A lesson = 5–12 steps, ~10–20 minutes. Rhythm: explain → show real code → check
  understanding (quiz) → make them type (exercise). Every lesson ends with a quiz or exercise.
- Assume ZERO prior Swift/iOS knowledge in early modules; build strictly on what earlier
  modules covered (check `index.html` for order).
- Anchor everything in PawWalk: dog walkers, bookings, prices in cents, GPS fixes. When
  showing repo code, title the block with the real path (e.g. `Services/APIClient.swift`).
- Voice: encouraging, plain-spoken, no jargon without defining it. Short paragraphs.
