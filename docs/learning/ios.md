# iOS / SwiftUI Learning Track

Native iPhone development with Swift 6 and SwiftUI. This track maps to the code in [`apps/ios`](../../apps/ios).

## Prerequisites

- A Mac with **Xcode 26** (free from the Mac App Store).
- `brew install xcodegen`, then `cd apps/ios && xcodegen generate && open PawWalk.xcodeproj`.

## Mental model

SwiftUI is **declarative**: you write a function of state that returns a view, and the framework figures out what to redraw. You almost never imperatively "update a label." Instead you change state, and the UI follows.

## Module 1 — Swift the language (week 1)

Before SwiftUI, get comfortable with Swift itself. Focus on: `struct` vs `class`, `enum` with associated values, optionals (`?`, `if let`, `guard let`), `protocol`, closures, and `async`/`await`.

- **In the repo:** [`Models/Models.swift`](../../apps/ios/PawWalk/Models/Models.swift) shows `struct` + `Codable` + `enum CodingKeys`. [`Services/APIClient.swift`](../../apps/ios/PawWalk/Services/APIClient.swift) shows `async`/`await`.
- **Resource:** Apple's free *Swift Programming Language* book (the "A Swift Tour" chapter).
- **Exercise:** add a `formattedRating` computed property to `Walker` returning `"4.9 ★"`.

## Module 2 — SwiftUI views & layout (weeks 2–3, Phase 1)

`View`, `VStack`/`HStack`/`ZStack`, `List`, `NavigationStack`, modifiers, `@ViewBuilder`.

- **In the repo:** [`Features/Walkers/WalkersView.swift`](../../apps/ios/PawWalk/Features/Walkers/WalkersView.swift) — a `List` inside a `NavigationStack`, with a `switch` over state and a private `WalkerRow` subview.
- **Exercise (Phase 1):** add a **WalkerDetailView**. Make each row a `NavigationLink` to it. Show the walker's bio, rating, neighborhoods, and a "Book" button (wire the button up in Phase 2).
- **Stretch:** load `photoURL` with `AsyncImage`.

## Module 3 — State & data flow (weeks 4–5, Phase 2)

`@State`, `@Observable`, `@Binding`, `.task`, and how SwiftUI tracks dependencies.

- **In the repo:** [`Features/Walkers/WalkersViewModel.swift`](../../apps/ios/PawWalk/Features/Walkers/WalkersViewModel.swift) is an `@Observable` class held with `@State` in the view; `.task { await model.load() }` ties loading to the view lifecycle.
- **Exercise (Phase 2):** build a **BookingFormView** with `@State` fields (dog name, duration `Picker`, date `DatePicker`). On submit, call a new `APIClient.createBooking(_:)` that `POST`s `CreateBookingRequest`. Handle the loading/success/error states.
- **Concept to nail:** unidirectional data flow — views read state, send actions back; the model owns the truth.

## Module 4 — Networking & errors (alongside Phase 2–3)

`URLSession`, `JSONDecoder`/`JSONEncoder`, typed error handling, `Result`.

- **In the repo:** `APIClient.walkers()` — `URLSession.data(from:)`, status-code check, decode.
- **Exercise:** make errors visible. Replace the silent sample-data fallback with a real `.failed` state when the user explicitly retries, and add a Retry button using `ContentUnavailableView`.

## Module 5 — Apple frameworks (Phases 4–7)

Pull these in as features demand them:

- **Phase 4 — Sign in with Apple** (`AuthenticationServices`) + **Keychain** for the token.
- **Phase 5 — Apple Pay / Stripe iOS SDK** in the booking flow.
- **Phase 7 — MapKit** (`Map`, `Annotation`) for live walk tracking; **CoreLocation** for permissions.

## Milestones checklist

- [ ] All Swift basics comfortable (optionals, enums, async)
- [ ] Walker detail screen with navigation (Phase 1)
- [ ] Booking form that POSTs to the API (Phase 2)
- [ ] Robust loading/error UI with retry
- [ ] Sign in with Apple (Phase 4)
- [ ] Map-based walk tracking (Phase 7)

## Best free resources

- Apple's **SwiftUI tutorials** (developer.apple.com/tutorials/swiftui) — hands-on, official.
- **Hacking with Swift** — "100 Days of SwiftUI" (free).
- **WWDC sessions** on "What's new in SwiftUI" for the current year.
