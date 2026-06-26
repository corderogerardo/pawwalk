# PawWalk iOS — Swift 6 · SwiftUI

Native iPhone/iPad client. SwiftUI, async/await networking, the modern `@Observable` state model.

## Run it

This project uses [**XcodeGen**](https://github.com/yonaskolb/XcodeGen) — the
`.xcodeproj` is generated from [`project.yml`](project.yml) instead of being
committed (keeps the monorepo clean and avoids gnarly project-file merge conflicts).

```bash
brew install xcodegen          # one time
cd apps/ios
xcodegen generate              # creates PawWalk.xcodeproj from project.yml
open PawWalk.xcodeproj          # then press ⌘R in Xcode
```

Pick an iPhone simulator and Run. The iOS Simulator shares your Mac's network, so
the app reaches the backend at `http://localhost:8000` (start it with
`cd apps/backend && uv run fastapi dev`). If the backend isn't running, the app
shows built-in sample walkers so it never looks broken.

> To run on a **physical device**, set your Apple Team ID in `project.yml`
> (`DEVELOPMENT_TEAM`) and re-run `xcodegen generate`.

## Requirements (June 2026)

- macOS + **Xcode 26** (Swift 6.x, iOS 26 SDK)
- Deployment target **iOS 18** — broad device coverage. Bump to 26 in `project.yml` to use the very newest APIs.

## Layout

```
PawWalk/
├── PawWalkApp.swift        # @main entry — the App/Scene
├── ContentView.swift       # root TabView
├── Models/Models.swift     # Codable structs (the API contract)
├── Services/APIClient.swift # async/await URLSession client
├── Features/
│   ├── Walkers/            # WalkersView + WalkersViewModel (@Observable)
│   └── Bookings/           # placeholder for Phase 1
├── Theme/Theme.swift       # brand color
└── Assets.xcassets/        # accent color + app icon slot
```

## Learning notes

- **SwiftUI is declarative.** A `View` is a value describing the UI for the current state; SwiftUI diffs and re-renders. `WalkersView` switches on `model.state` to show loading / loaded / error.
- **`@Observable` + `@State`.** `WalkersViewModel` is an `@Observable` class held by the view via `@State`. SwiftUI observes exactly the properties the view reads — the successor to `ObservableObject`/`@Published`.
- **Structured concurrency.** `.task { await model.load() }` runs an async load tied to the view's lifecycle (auto-cancelled when the view goes away). `APIClient` uses `async`/`await` `URLSession`.
- **`Codable`.** `JSONDecoder` + `CodingKeys` turn the backend's snake_case JSON into typed Swift structs. `ContentUnavailableView` (iOS 17+) gives a polished empty/error state for free.

## Next (see Notion board)

Walker detail + booking flow → auth (Sign in with Apple) → Apple Pay / Stripe → MapKit live-tracking for walks.
