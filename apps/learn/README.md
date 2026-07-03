# PawWalk Academy

An interactive, step-by-step course that teaches Swift, SwiftUI, and iOS development
from absolute zero by rebuilding the PawWalk app in `apps/ios` — typing the real code,
lesson by lesson, with in-browser checking.

**Part II (modules 13–31, complete)** teaches the Python backend the same way: Python → Flask →
Django → FastAPI (the real `apps/backend`) → LLM agents → RAG. The full academy is now 32 modules
/ 120 lessons. Build plan and per-module tasks:
[`docs/learning/python-academy-plan.md`](../../docs/learning/python-academy-plan.md).

## Run it

No build step, no dependencies:

```sh
cd apps/learn
python3 -m http.server 4173
```

Open http://localhost:4173. Progress (including code you type) is saved in the
browser's localStorage.

## Layout

- `index.html` — shell; the `lessons/*.js` script-tag order is the course order
- `app.js` — the course engine (routing, step reveal, quiz/exercise/checklist logic)
- `lessons/` — one JS file per module; format documented in `lessons/FORMAT.md`
- `tools/validate.mjs` — schema + solvability checks; run `node tools/validate.mjs`
  after editing any lesson (it asserts every exercise's solution passes its own checks)
