# PawWalk Android — Kotlin · Jetpack Compose

Native Android client. Single-activity, 100% Jetpack Compose, MVVM.

## Run it

**Easiest:** open the `apps/android` folder in **Android Studio** (latest). It will
sync Gradle (creating the wrapper automatically), then press ▶ Run on an emulator
or device.

**Command line** (after the wrapper jar exists — see note below):

```bash
cd apps/android
./gradlew assembleDebug          # build a debug APK
./gradlew installDebug           # install on a running emulator/device
```

> **Wrapper note:** `gradle/wrapper/gradle-wrapper.jar` is a small binary that
> isn't committed. Android Studio generates it on first sync. To create it from a
> terminal instead: `gradle wrapper --gradle-version 8.13` (needs Gradle installed).

### Talking to the backend

The app reads `API_BASE_URL` from `BuildConfig` (set in `app/build.gradle.kts`) and
defaults to `http://10.0.2.2:8000` — that's how the Android **emulator** reaches a
server running on your computer's `localhost`. Start the backend (`cd apps/backend
&& uv run fastapi dev`) and the walker list comes from the live API. If the backend
isn't running, the app shows built-in sample data so it never looks broken.

## Versions (June 2026)

Pinned in [`gradle/libs.versions.toml`](gradle/libs.versions.toml) — the Gradle
**version catalog**, the modern single source of truth for dependencies:

- Android Gradle Plugin 8.13, Gradle 8.13
- Kotlin 2.3.21 + the `org.jetbrains.kotlin.plugin.compose` compiler plugin
- Jetpack Compose BOM 2026.06.00 (the BOM keeps all Compose libs on compatible versions)
- compileSdk / targetSdk 36 (Android 16), minSdk 26, Java 17

## Layout

```
app/src/main/
├── AndroidManifest.xml
├── java/com/pawwalk/android/
│   ├── MainActivity.kt           # single activity → sets Compose content
│   ├── data/
│   │   ├── Models.kt             # @Serializable data classes (the API contract)
│   │   ├── PawWalkApi.kt         # Retrofit interface
│   │   └── WalkerRepository.kt   # network + sample-data fallback
│   └── ui/
│       ├── theme/                # Material 3 theme (color, type, dynamic color)
│       └── screens/
│           ├── WalkersViewModel.kt   # StateFlow<UiState>
│           └── WalkersScreen.kt      # Compose UI
└── res/                          # strings, theme, adaptive launcher icon (vector)
```

## Learning notes

- **Compose is declarative.** `WalkersScreen` describes UI as a function of state; when the `ViewModel`'s `StateFlow` changes, Compose re-renders the affected parts. No XML layouts, no `findViewById`.
- **MVVM + unidirectional data flow.** `ViewModel` owns state and exposes it as an immutable `StateFlow`; the UI only reads it and sends events back (`viewModel.load()`).
- **Retrofit + kotlinx.serialization** give you a typed HTTP client from a Kotlin interface. The `@SerialName` annotations map snake_case JSON to idiomatic camelCase Kotlin.
- **Material You / dynamic color** (`Theme.kt`) adapts the palette to the user's wallpaper on Android 12+.

## Next (see Notion board)

Bookings screen + booking flow → auth → in-app payments (Stripe SDK) → live GPS map for walks.
