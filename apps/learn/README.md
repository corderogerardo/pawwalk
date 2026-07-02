# PawWalk Academy

An interactive, step-by-step course that teaches native app development from absolute
zero by rebuilding the PawWalk app, typing the real code, lesson by lesson, with
in-browser checking. Two courses share one engine:

- **iOS** (`index.html`) — Swift & SwiftUI, rebuilding `apps/ios`
- **Android** (`android.html`) — Kotlin & Jetpack Compose, rebuilding `apps/android`

Each course's header links to the other so you can hop between them.

## Run it

No build step, no dependencies:

```sh
cd apps/learn
python3 -m http.server 4173
```

Open http://localhost:4173 for the iOS course, or http://localhost:4173/android.html
for the Android course. Progress (including code you type) is saved in the browser's
localStorage — the two courses use separate store keys (`pawwalk-academy-v1` for iOS,
`pawwalk-academy-android-v1` for Android), so progress in one never touches the other.

## Layout

- `index.html` — iOS course shell; the `lessons/*.js` script-tag order is the course order
- `android.html` — Android course shell; same engine, loads `lessons-android/*.js` and
  sets `window.STORE_KEY` before the lesson scripts so progress is stored separately
- `app.js` — the course engine (routing, step reveal, quiz/exercise/checklist logic),
  shared by both courses
- `lessons/` — one JS file per iOS module; format documented in `lessons/FORMAT.md`
- `lessons-android/` — one JS file per Android module; same format, plus the
  Kotlin-specific traps in `lessons-android/FORMAT-KOTLIN.md`
- `tools/validate.mjs` — schema + solvability checks; run `node tools/validate.mjs`
  after editing any iOS lesson (it asserts every exercise's solution passes its own
  checks) or `node tools/validate.mjs lessons-android` after editing an Android lesson
  (the directory is an optional argument, defaulting to `lessons`)
