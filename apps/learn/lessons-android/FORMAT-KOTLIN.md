# Kotlin addendum to the lesson format

This is a one-page addendum to [`../lessons/FORMAT.md`](../lessons/FORMAT.md) — read
that file first. Everything there (module shape, step types, pedagogy rules, the
validator) applies unchanged to `lessons-android/`. This page covers only what's
different when the code is Kotlin instead of Swift.

## Every module declares `lang: "kotlin"`

The engine highlights and normalizes code per language (`swift` | `python` |
`kotlin`), defaulting to Swift. Every module in `lessons-android/` must set
`lang: "kotlin"` next to its `emoji` so Kotlin keywords (`fun`, `val`, `when`, …)
highlight correctly. A single step can override with its own `lang` if it ever
shows another language.

## THE BIG TRAP — Kotlin `${...}` inside JS templates

All code fields (`source`, `starter`, `solution`) still use `String.raw` backtick
templates, same as Swift. But `String.raw` only stops JS from processing
**backslash** escapes — it does **not** stop JS from interpolating `${expr}`.
Swift's interpolation (`\(name)`) is backslash-based, so `String.raw` neutralizes it
for free. Kotlin's interpolation is dollar-based, so it collides with JS's own syntax:

- Kotlin's simple form, `$name`, is safe — JS only interpolates `${...}` (with
  braces), never a bare `$name`. Prefer this form: extract a `val` and reference it
  as `$name` instead of embedding an expression.
- Kotlin's brace form, `${expr}`, is **NOT safe**. Written bare inside a
  `String.raw` template, JS will evaluate `expr` as a JS expression right then —
  throwing a `ReferenceError` (if `expr` isn't a JS identifier in scope) or silently
  splicing in `undefined`/garbage (if it happens to resolve). The validator cannot
  catch this — it's a JS-level runtime failure that only shows up when the page loads.
  If you must use the brace form, escape it as `${"$"}{expr}` — the closing `"$"` is
  a real JS string that breaks up the `${` sequence so JS doesn't parse it as an
  interpolation, and the browser sees `${expr}` in the final text.

**After writing each module file, grep it:**

```sh
grep -n '\${' lessons-android/NN-name.js
```

Every hit must be the escaped form `${"$"}{` — if you see a bare `${` that isn't
that exact escape, fix it before moving on.

## Regex checks in `checks`/`mustNot`

Same normalization as the iOS course (see FORMAT.md's "How checking works"):
comments stripped (Kotlin uses `//` and `/* */`, same as Swift), all whitespace
collapsed, then spaces around punctuation removed. Write regexes against that
normalized shape. One extra Kotlin-specific point:

- Escape `$` as `\$` in regexes when matching a Kotlin string template, e.g. a
  solution containing `"$name"` needs a check like `/"\$name"/`, not `/"$name"/`
  (an unescaped `$` in a regex anchors to end-of-string).

## Kotlin must be real, compiling Kotlin

Every code sample and solution must be real Kotlin that compiles in `apps/android`.
When a lesson rebuilds a piece of a repo file, read that file first and match it
verbatim — don't recall it from memory. Title code blocks with the real path, e.g.
`data/Models.kt`.

## Another trap — URL literals silently truncated by the comment stripper

The validator's (and engine's) `normalize()` strips comments with
`code.replace(/\/\/[^\n]*/g, " ")` before checking regexes — it has no idea what a
string literal is, so it treats **any** `//` as a comment start, including the `//` in
`https://...`. If a `checks`/`solution` string contains a URL literal, everything from
that `//` to the end of the line is silently cut before your regex ever runs — the
check can never match, and the failure mode is confusing (a check that looks obviously
correct still fails).

Rule: **keep URL literals out of anything that gets normalized** — i.e. out of
`exercise` `solution`/`starter`/`checks`/`mustNot`. Two ways to show a URL safely:

- Put it in a read-only `type: "code"` step (`source` isn't normalized/checked, only
  exercise solutions are), or
- Put it in a starter line the learner doesn't have to type/match against a check
  (e.g. pre-filled and outside what any regex targets).

## Checklist steps (`type: "xcode"`)

The step type is still literally the string `"xcode"` — it's an engine keyword
meaning "a checklist done outside the browser," not literally about Xcode. Title
it for Android Studio (e.g. `title: "Run the app in Android Studio"`), and set
`label: "Over to Android Studio"` — the `label` field overrides the badge text
above the card's heading (it defaults to "Over to Xcode").
