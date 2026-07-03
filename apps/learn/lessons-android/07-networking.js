// Module 07 — Networking with Retrofit. See ../lessons/FORMAT.md and
// ./FORMAT-KOTLIN.md for the schema and Kotlin-specific traps.
window.COURSE = window.COURSE || [];
window.COURSE.push({
  id: "networking-android",
  title: "Networking with Retrofit",
  emoji: "🌐",
  lang: "kotlin",
  lessons: [
    // ------------------------------------------------------------------
    {
      id: "api-contract",
      title: "The API Contract",
      steps: [
        {
          type: "text",
          md: [
            "## Everything real in PawWalk lives on the backend",
            "The walkers, your bookings, your login — none of it is hardcoded in the app. It all comes from a Python (FastAPI) server the app talks to over HTTP. Up to now you've worked with `Walker` and `Booking` as Kotlin types sitting in memory. This module is about how those values actually get *into* the app: a request goes out, JSON comes back.",
            "The agreement about exactly what JSON the backend sends and expects lives in one file: `docs/API-CONTRACT.md`. Every Kotlin type you've built in this course mirrors a shape written down there. When in doubt about a field name or an endpoint path, that file is the source of truth — not memory, not guessing.",
          ],
        },
        {
          type: "code",
          title: "docs/API-CONTRACT.md — the Walkers resource",
          source: String.raw`### Walkers
GET /walkers                  -> 200 [Walker]
GET /walkers/{walker_id}      -> 200 Walker | 404

// Walker
{
  "id": "wlk_123",
  "name": "Sam Rivera",
  "photo_url": "https://...",
  "rating": 4.9,
  "price_per_30min_cents": 1800,
  "bio": "10 yrs with dogs. Loves huskies.",
  "neighborhoods": ["Mission", "SoMa"]
}`,
          caption: "`GET /walkers` needs no login and returns a JSON array. That's the exact endpoint this lesson wires up end to end.",
        },
        {
          type: "text",
          md: [
            "## FastAPI hands you free, live documentation",
            "Because the backend is FastAPI, it auto-generates interactive API docs from its own code — no separate doc-writing step, so they can't drift out of date the way a hand-maintained page can. Run the backend and open **`http://localhost:8000/docs`** in a browser on your computer: a page (Swagger UI) listing every endpoint, its request shape, its response shape, and a **Try it out** button that fires a real request.",
            "That's from *your computer's* point of view. The Android emulator is its own little virtual machine — to it, your computer isn't `localhost` at all. It's a separate machine reachable at the special address **`10.0.2.2`**. So inside the app, the exact same backend is configured as `http://10.0.2.2:8000` (you saw this in Module 0's setup, stored in `BuildConfig.API_BASE_URL`). Same server, same port, different address — because the emulator sits one network hop away from your machine.",
          ],
        },
        {
          type: "quiz",
          q: "You're inside the Android emulator's browser, trying to reach the backend running on your Mac/PC. Which address works?",
          choices: [
            "localhost:8000",
            "127.0.0.1:8000",
            "10.0.2.2:8000",
            "The emulator can never reach your computer",
          ],
          answer: 2,
          explain: "`10.0.2.2` is the emulator's special alias for \"the host machine's localhost.\" `localhost` inside the emulator means the emulator itself, which has no backend running on it.",
          nudge: "Inside the emulator, `localhost` refers to the emulator — not the computer it's running on. What's the alias for the host machine?",
        },
        {
          type: "text",
          md: [
            "## The shape of a REST API",
            "PawWalk's backend follows a common pattern called REST: each **resource** (walkers, bookings, pets) gets a URL path, and the **HTTP method** says what you want to do with it.",
            "- `GET /walkers` — fetch the list. GET never changes anything on the server.\n- `GET /walkers/{walker_id}` — fetch one, by id. The `{walker_id}` is a *path parameter* — a placeholder filled in per request.\n- `POST /bookings` — create something new. The request carries a JSON *body* with the details.\n- `PATCH /walkers/me` — update part of something that already exists.",
            "You'll meet all four verbs in this module. Every one of them, in Kotlin, becomes one line on an interface — that's next.",
          ],
        },
        {
          type: "quiz",
          q: "Which HTTP method does PawWalk use to create a brand-new booking?",
          choices: ["GET", "POST", "PATCH", "DELETE"],
          answer: 1,
          explain: "POST /bookings creates a new resource, with the booking details riding along as a JSON body. GET only ever reads.",
          nudge: "Which verb in the contract's Bookings section returns a 201 — \"created\"?",
        },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: "retrofit-interface",
      title: "Retrofit: an Interface Becomes a Client",
      steps: [
        {
          type: "text",
          md: [
            "## Turning a contract into code you can call",
            "You could build every request by hand — assemble a URL string, open a connection, parse the response. PawWalk uses a library called **Retrofit** instead, and it does something that looks almost like magic the first time you see it: you write an `interface` — a Kotlin type with function *signatures* but no bodies — annotate each function with an HTTP verb and path, and Retrofit generates a real, working network client from it at runtime.",
            "Two annotations you'll use constantly:",
            "- **`@GET(\"walkers\")`** on a function — \"calling this function performs `GET /walkers`.\"\n- **`suspend fun`** — every network call in PawWalk is a suspend function. You met `suspend` in Module 3: it means \"this pauses without freezing the app,\" which is exactly what a network round-trip needs.",
            "Retrofit reads the return type too. Declare `suspend fun getWalkers(): List<Walker>` and Retrofit decodes the JSON array straight into a `List<Walker>` for you — no manual JSON parsing code anywhere in sight.",
          ],
        },
        {
          type: "code",
          title: "data/PawWalkApi.kt",
          source: String.raw`interface PawWalkApi {
    @GET("walkers")
    suspend fun getWalkers(): List<Walker>

    @POST("bookings")
    suspend fun createBooking(@Body request: CreateBookingRequest): Booking

    @GET("bookings")
    suspend fun getBookings(): List<Booking>
}`,
          caption: "A trimmed slice of the real interface — `PawWalkApi.kt` has more endpoints, same idea. Nothing here has a body: Retrofit implements the interface for you.",
        },
        {
          type: "quiz",
          q: "In `interface PawWalkApi`, why do the functions have no `{ }` body?",
          choices: [
            "It's a Kotlin syntax error that happens to compile",
            "Retrofit generates the real implementation at runtime from the interface + annotations",
            "The bodies are written in a separate file",
            "Bodies are optional for all Kotlin functions",
          ],
          answer: 1,
          explain: "An `interface` declares *what* a function looks like, not how it works. Retrofit reads the `@GET`/`@POST` annotations and the signature, then builds a real class implementing this interface for you — you never write that class by hand.",
          nudge: "You've seen `interface` before, in Module 2's `UiState` — an interface has no bodies of its own. Who supplies one here?",
        },
        {
          type: "text",
          md: [
            "## Sending a body — `@Body` and path parameters",
            "`createBooking` above takes a parameter annotated **`@Body`** — that value gets serialized to JSON and sent as the POST's request body. `CreateBookingRequest` is a `data class` you'll build in Module 10; for now, notice the shape: one Kotlin parameter in, one JSON object out.",
            "The other new annotation is **`@Path`**, for URL placeholders like `{id}` in `bookings/{id}/cancel`:",
            "> `@POST(\"bookings/{id}/cancel\") suspend fun cancelBooking(@Path(\"id\") bookingId: String): Booking`",
            "The name inside `@Path(\"id\")` has to match the `{id}` in the URL string exactly — Retrofit substitutes the parameter's value in at that spot.",
          ],
        },
        {
          type: "code",
          title: "data/PawWalkApi.kt",
          source: String.raw`@POST("bookings/{id}/cancel")
suspend fun cancelBooking(@Path("id") bookingId: String): Booking

@GET("bookings/stats")
suspend fun ownerStats(): OwnerStats

@GET("auth/me")
suspend fun me(): User`,
          caption: "Three more real endpoints. Note `me()` needs no `@Path` or `@Body` at all — a bare GET with an empty parameter list is a perfectly normal endpoint.",
        },
        {
          type: "quiz",
          q: "`@Path(\"id\") bookingId: String` sits on a function whose URL is `\"bookings/{id}/cancel\"`. What connects them?",
          choices: [
            "Nothing — Retrofit ignores @Path",
            "The string inside @Path(\"id\") must match the {id} placeholder in the URL",
            "The parameter name bookingId must match the URL exactly",
            "Retrofit appends bookingId to the end of the URL automatically",
          ],
          answer: 1,
          explain: "Retrofit matches by the string you give `@Path`, not the Kotlin parameter name — `@Path(\"id\") bookingId` still fills in `{id}`, because `\"id\"` is what's inside the annotation.",
          nudge: "The Kotlin parameter is called `bookingId`, but the URL placeholder is `{id}`. What actually links the two?",
        },
        {
          type: "exercise",
          title: "Add a GET endpoint",
          prompt: [
            "The contract says `GET /pets -> 200 [Pet]` returns the current owner's pets, no path parameters, no body. Add that endpoint to the interface below:",
            "1. Annotate it `@GET(\"pets\")`.\n2. Declare it as a `suspend fun` named `getPets` with no parameters.\n3. Its return type is `List<Pet>`.",
          ],
          starter: String.raw`interface PawWalkApi {
    @GET("walkers")
    suspend fun getWalkers(): List<Walker>

    // your code here
}`,
          solution: String.raw`interface PawWalkApi {
    @GET("walkers")
    suspend fun getWalkers(): List<Walker>

    @GET("pets")
    suspend fun getPets(): List<Pet>
}`,
          checks: [
            { re: /@GET\("pets"\)/, hint: "The annotation is `@GET(\"pets\")` — the path matches the contract's `/pets`, no leading slash." },
            { re: /suspend fun getPets\(\):List<Pet>/, hint: "The function is `suspend fun getPets(): List<Pet>` — no parameters, and the return type wraps `Pet` in a `List`." },
          ],
          mustNot: [
            { re: /@POST\("pets"\)/, hint: "Fetching a list is a GET, not a POST — POST is for creating something new." },
          ],
          success: "That's a real endpoint, matching the one in PawWalkApi.kt. One annotation and one signature — Retrofit does the rest.",
        },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: "the-network-stack",
      title: "The Network Stack",
      steps: [
        {
          type: "text",
          md: [
            "## What actually builds the client",
            "`PawWalkApi` is just an interface — something has to construct the real thing. That's `Network.kt`: one object, built once, shared by every repository in the app. Three ingredients stack on top of each other:",
            "- **OkHttp** — the actual HTTP engine underneath Retrofit. It opens connections, sends bytes, receives bytes.\n- **A converter factory** — teaches Retrofit how to turn JSON bytes into Kotlin objects (and back). PawWalk uses `kotlinx.serialization`'s converter, the same annotations (`@Serializable`, `@SerialName`) you met in Module 3.\n- **Retrofit itself** — glues a `baseUrl`, the OkHttp client, and the converter factory together, then `.create(PawWalkApi::class.java)` produces the real, working implementation of your interface.",
          ],
        },
        {
          type: "code",
          title: "data/Network.kt",
          source: String.raw`object Network {
    private val json = Json { ignoreUnknownKeys = true }

    private val client = OkHttpClient.Builder()
        .addInterceptor(authInterceptor)
        .addInterceptor(HttpLoggingInterceptor().apply { level = HttpLoggingInterceptor.Level.BASIC })
        .build()

    val api: PawWalkApi by lazy {
        Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL.trimEnd('/') + "/")
            .client(client)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()
            .create(PawWalkApi::class.java)
    }
}`,
          caption: "A trimmed slice of the real file — `authInterceptor` is explained in Module 8, when auth headers matter. `object` (Module 2) means there is exactly one `Network` in the whole app.",
        },
        {
          type: "text",
          md: [
            "## `Json { ignoreUnknownKeys = true }`",
            "The `Json { ... }` line configures the kotlinx.serialization parser PawWalk uses everywhere. `ignoreUnknownKeys = true` means: if the backend's JSON has a field your `data class` doesn't know about, don't crash — just skip it.",
            "That one setting is what lets the backend add new fields to a response (say, a new `Walker` property) without breaking every app that's already installed. Without it, any unrecognized key would throw a `SerializationException` and the whole decode would fail.",
          ],
        },
        {
          type: "quiz",
          q: "The backend adds a brand-new field to the Walker JSON that the Android app's data class doesn't have yet. With `ignoreUnknownKeys = true`, what happens when the app decodes it?",
          choices: [
            "The app crashes with a SerializationException",
            "The whole response silently becomes null",
            "The unknown field is skipped; the rest of the object decodes normally",
            "Retrofit refuses to build the client",
          ],
          answer: 2,
          explain: "`ignoreUnknownKeys = true` tells the decoder \"skip what you don't recognize.\" That forward-compatibility is exactly why it's set on every PawWalk decode.",
          nudge: "What's the one job that setting does, per its name?",
        },
        {
          type: "text",
          md: [
            "## `BuildConfig.API_BASE_URL`",
            "`baseUrl(BuildConfig.API_BASE_URL.trimEnd('/') + \"/\")` is where the `10.0.2.2` address from this module's first lesson actually lands. `BuildConfig` is a class Gradle *generates* at build time from values in `app/build.gradle.kts` — `API_BASE_URL` isn't typed anywhere as a literal string in `Network.kt`. That's on purpose: point it at `10.0.2.2:8000` for the emulator today, and a production URL later, without touching this file.",
            "`.trimEnd('/')` strips any trailing slash before appending exactly one `\"/\"` — a small defensive touch so `\"http://10.0.2.2:8000\"` and `\"http://10.0.2.2:8000/\"` both end up correct. Retrofit requires the base URL to end in `/`.",
          ],
        },
        {
          type: "quiz",
          q: "Why does `Network.kt` read `BuildConfig.API_BASE_URL` instead of hardcoding `\"http://10.0.2.2:8000\"` directly in the file?",
          choices: [
            "Hardcoding strings isn't allowed in Kotlin",
            "BuildConfig is faster than a string literal at runtime",
            "It lets the address change per build (emulator vs. production) without editing Network.kt",
            "10.0.2.2 doesn't work unless it comes from BuildConfig",
          ],
          answer: 2,
          explain: "Gradle can bake a different `API_BASE_URL` into `BuildConfig` per build variant — dev, staging, production — so the networking code itself never has to change.",
          nudge: "Think about what changes between running on your emulator today and shipping to the Play Store someday.",
        },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: "repositories-and-errors",
      title: "Repositories & Errors",
      steps: [
        {
          type: "text",
          md: [
            "## One more layer: the repository",
            "Screens never call `Network.api` directly. Between the raw API and the UI sits a **repository** — a small object whose only job is \"know how to get this app's data.\" `WalkerRepository` is about as simple as it gets:",
          ],
        },
        {
          type: "code",
          title: "data/WalkerRepository.kt",
          source: String.raw`object WalkerRepository {
    private val api: PawWalkApi get() = Network.api

    suspend fun fetchWalkers(): List<Walker> = api.getWalkers()

    suspend fun myProfile(): Walker = api.walkerProfile()

    suspend fun updateProfile(update: WalkerProfileUpdate): Walker = api.updateWalkerProfile(update)
}`,
          caption: "The real file, in full. Each function is one line: call the matching endpoint, return what it returns. No sample-data fallback here — if the backend is unreachable, callers see a real error state.",
        },
        {
          type: "quiz",
          q: "What does WalkerRepository add on top of calling Network.api.getWalkers() directly?",
          choices: [
            "It caches results forever so the network is never hit twice",
            "A single, named place a ViewModel calls, instead of every screen reaching into Network directly",
            "It converts the JSON into XML",
            "It runs the request on the main thread",
          ],
          answer: 1,
          explain: "That's the whole point of a repository layer: one seam between \"where data comes from\" and \"who uses it.\" Today it's a thin wrapper around Retrofit; if PawWalk added a local cache later, only this file would change.",
          nudge: "If ten different screens needed walkers, would you rather each one know about Network.api, or one shared object?",
        },
        {
          type: "text",
          md: [
            "## Where try/catch actually lives",
            "A `suspend fun` that hits the network can throw — no backend running, no Wi-Fi, a timeout. PawWalk's rule: the repository stays a thin, honest pass-through (no swallowed errors), and the **ViewModel** is where the try/catch lives, turning a possible exception into a `UiState` the screen can render.",
            "You met this `UiState` shape back in Module 5/6: a sealed interface with `Loading`, `Success`, and `Error` cases. Here's how `WalkersViewModel` fills it in from a real network call.",
          ],
        },
        {
          type: "code",
          title: "ui/screens/WalkersViewModel.kt",
          source: String.raw`class WalkersViewModel : ViewModel() {

    sealed interface UiState {
        data object Loading : UiState
        data class Success(val walkers: List<Walker>) : UiState
        data class Error(val message: String) : UiState
    }

    private val _state = MutableStateFlow<UiState>(UiState.Loading)
    val state: StateFlow<UiState> = _state.asStateFlow()

    init { load() }

    fun load() {
        viewModelScope.launch {
            _state.value = UiState.Loading
            _state.value = try {
                UiState.Success(WalkerRepository.fetchWalkers())
            } catch (e: Exception) {
                UiState.Error(e.message ?: "Something went wrong")
            }
        }
    }
}`,
          caption: "The real file, in full. `viewModelScope.launch` starts a coroutine tied to the ViewModel's lifecycle — cancelled automatically if the screen goes away mid-request.",
        },
        {
          type: "quiz",
          q: "`catch (e: Exception) { UiState.Error(e.message ?: \"Something went wrong\") }` — why the `?:` after `e.message`?",
          choices: [
            "It's required syntax for every catch block",
            "e.message is nullable — some exceptions carry no message — so ?: supplies a fallback string",
            "It converts the exception to a String automatically",
            "It retries the request once before giving up",
          ],
          answer: 1,
          explain: "`Throwable.message` is typed `String?` — not every exception sets one. `?:` (Module 2's Elvis operator) means \"use e.message if it's non-null, otherwise use this fallback,\" so the screen always has something to show.",
          nudge: "What Kotlin type is `message` on an exception — can it ever be missing?",
        },
        {
          type: "text",
          md: [
            "## Loading, error, retry — the UI's job",
            "Once `state` is a `StateFlow<UiState>`, the screen just switches on it: show a spinner for `Loading`, the list for `Success`, and for `Error` a message plus a button that calls `viewModel.load()` again — the exact same function the ViewModel called on `init`. Retrying a failed network call is just \"run the same code again,\" because the repository and ViewModel never held onto broken state.",
          ],
        },
        {
          type: "exercise",
          title: "Rebuild the error branch",
          prompt: [
            "Write `load()` for a `PetsViewModel` that mirrors `WalkersViewModel` exactly, but for pets:",
            "1. Set `_state.value = UiState.Loading` first.\n2. Assign `_state.value` from a `try`/`catch`: on success, wrap `PetRepository.fetchPets()` in `UiState.Success`.\n3. On `catch (e: Exception)`, use `UiState.Error(e.message ?: \"Something went wrong\")` — same fallback message as the real file.",
          ],
          starter: String.raw`fun load() {
    viewModelScope.launch {
        // your code here
    }
}`,
          solution: String.raw`fun load() {
    viewModelScope.launch {
        _state.value = UiState.Loading
        _state.value = try {
            UiState.Success(PetRepository.fetchPets())
        } catch (e: Exception) {
            UiState.Error(e.message ?: "Something went wrong")
        }
    }
}`,
          checks: [
            { re: /_state\.value=UiState\.Loading/, hint: "First line inside the coroutine: `_state.value = UiState.Loading`, so the screen shows a spinner right away." },
            { re: /UiState\.Success\(PetRepository\.fetchPets\(\)\)/, hint: "On success, wrap the repository's result: `UiState.Success(PetRepository.fetchPets())`." },
            { re: /catch\(e:Exception\)\{UiState\.Error\(e\.message\?:"Something went wrong"\)\}/, hint: "The catch block is `catch (e: Exception) { UiState.Error(e.message ?: \"Something went wrong\") }` — same fallback text as WalkersViewModel." },
          ],
          mustNot: [
            { re: /catch\(e:Exception\)\{\}/, hint: "Don't swallow the exception silently — turn it into a `UiState.Error` so the screen can show it." },
          ],
          success: "That's the exact pattern every screen in PawWalk uses to turn a network call into loading/success/error UI — you've now written it yourself.",
        },
      ],
    },
  ],
});
