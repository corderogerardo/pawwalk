# Android / Kotlin Learning Track

> **New: the interactive course.** [PawWalk Academy — Android](../../apps/learn/android.html)
> (13 modules, 55 lessons, run with `cd apps/learn && python3 -m http.server 4173`) teaches
> Kotlin/Jetpack Compose from zero by rebuilding `apps/android`, with type-the-code exercises
> checked in the browser. It supersedes this track for beginners — read on for the
> self-directed, resource-linked version.

Native Android development with Kotlin and Jetpack Compose. Maps to the code in [`apps/android`](../../apps/android).

## Prerequisites

- **Android Studio** (latest). Open the `apps/android` folder; let Gradle sync (it creates the wrapper). Run on an emulator (Pixel, API 36).

## Mental model

Like SwiftUI, Compose is **declarative**: composable functions describe UI from state, and Compose re-renders ("recomposes") the parts that change. The patterns rhyme with iOS — learning them side by side is a superpower.

## Module 1 — Kotlin the language (week 1)

Focus: `val`/`var`, `data class`, `sealed interface`/`enum`, nullability (`?`, `?.`, `?:`), lambdas, extension functions, and `suspend` functions (coroutines).

- **In the repo:** [`data/Models.kt`](../../apps/android/app/src/main/java/com/pawwalk/android/data/Models.kt) (`data class`, `@Serializable`, `@SerialName`); [`data/WalkerRepository.kt`](../../apps/android/app/src/main/java/com/pawwalk/android/data/WalkerRepository.kt) (`suspend fun`, `try/catch`).
- **Resource:** Kotlin Koans (play.kotlinlang.org) — interactive.
- **Exercise:** add a `priceLabel` already exists on `Walker`; add a `ratingStars: String` extension property returning `"★ 4.9"`.

## Module 2 — Compose UI & layout (weeks 2–3, Phase 1)

`@Composable`, `Column`/`Row`/`Box`, `LazyColumn`, `Scaffold`, `TopAppBar`, `Modifier`, Material 3 components.

- **In the repo:** [`ui/screens/WalkersScreen.kt`](../../apps/android/app/src/main/java/com/pawwalk/android/ui/screens/WalkersScreen.kt) — a `Scaffold` + `LazyColumn` of `WalkerCard`s, switching on UI state.
- **Exercise (Phase 1):** add a **WalkerDetailScreen** and navigate to it with `navigation-compose` (already a dependency). Use a `NavHost` with two routes.
- **Stretch:** load `photoUrl` images with Coil (`io.coil-kt.coil3:coil-compose`).

## Module 3 — State & ViewModel (weeks 4–5, Phase 2)

`remember`/`mutableStateOf`, `StateFlow`, `ViewModel`, `collectAsState`, unidirectional data flow.

- **In the repo:** [`ui/screens/WalkersViewModel.kt`](../../apps/android/app/src/main/java/com/pawwalk/android/ui/screens/WalkersViewModel.kt) exposes an immutable `StateFlow<UiState>`; the screen reads it with `collectAsState()`.
- **Exercise (Phase 2):** build a **BookingFormScreen** with `remember { mutableStateOf(...) }` fields (dog name `TextField`, duration `SegmentedButton`, date picker). Add `createBooking` to the repo + API and call it from a `BookingViewModel`.
- **Concept to nail:** state flows down, events flow up — the composable never owns business state.

## Module 4 — Coroutines & networking (alongside Phase 2–3)

`suspend`, `viewModelScope.launch`, `Dispatchers`, Retrofit, kotlinx.serialization.

- **In the repo:** [`data/PawWalkApi.kt`](../../apps/android/app/src/main/java/com/pawwalk/android/data/PawWalkApi.kt) (Retrofit interface) + the Retrofit builder in `WalkerRepository.kt`. `BuildConfig.API_BASE_URL` is `http://10.0.2.2:8000` (emulator → host localhost).
- **Exercise:** surface a real error state + Retry button when the network call fails (instead of silently using samples).

## Module 5 — Jetpack libraries (Phases 4–7)

- **Phase 4 — auth:** store the token with **DataStore** (or EncryptedSharedPreferences); add an OkHttp interceptor that attaches `Authorization`.
- **Phase 5 — payments:** Stripe Android SDK (`PaymentSheet`).
- **Phase 7 — maps:** Maps Compose (`com.google.maps.android:maps-compose`) + FusedLocationProvider for live tracking.

## Milestones checklist

- [ ] Kotlin basics comfortable (data classes, null-safety, coroutines)
- [ ] Walker detail screen + navigation (Phase 1)
- [ ] Booking form with ViewModel that POSTs (Phase 2)
- [ ] Real loading/error/retry UI
- [ ] Token auth with interceptor (Phase 4)
- [ ] Map-based walk tracking (Phase 7)

## Best free resources

- **Android Basics with Compose** (developer.android.com/courses) — official, project-based.
- **Now in Android** sample app + podcast for current best practices.
- **Compose pathway** and the Compose docs' "Thinking in Compose."
