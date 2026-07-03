// Module 12 — The AI Assistant & Graduation (Android track). See
// ../lessons/FORMAT.md and ./FORMAT-KOTLIN.md for the schema and Kotlin-specific traps.
window.COURSE = window.COURSE || [];
window.COURSE.push({
  id: "assistant-graduation-android",
  title: "The AI Assistant & Graduation",
  emoji: "🎓",
  lang: "kotlin",
  lessons: [
    // ────────────────────────────────────────────────────────────────────
    {
      id: "chat-ui-in-compose",
      title: "A Chat UI in Compose",
      steps: [
        {
          type: "text",
          md: [
            "## The last screen",
            "PawWalk has one screen you haven't opened yet: the **Assistant** — a little chat where an owner types *\"a walker in the Mission for my husky tomorrow at 3pm\"* and gets back suggested walkers they can book with one tap.",
            "Here's the good news for your final module: there is **nothing new** in it. The AI lives on the backend (`POST /assistant/chat` parses the sentence and picks walkers). The app's job is the same loop you've built eleven times: send a request, decode JSON, keep state in a `ViewModel`, render it in Compose.",
            "So this module is a victory lap. You'll read the two real files behind the screen — `AssistantScreen.kt` and `AssistantViewModel.kt` — and recognize every single line.",
          ],
        },
        {
          type: "code",
          title: "AssistantScreen.kt (top of the composable)",
          source: String.raw`@Composable
fun AssistantScreen(onClose: () -> Unit, onBook: (Walker) -> Unit, viewModel: AssistantViewModel = viewModel()) {
    val c = Hud.colors
    val messages by viewModel.messages.collectAsState()
    val sending by viewModel.sending.collectAsState()
    val listState = rememberLazyListState()
    var draft by remember { mutableStateOf("") }

    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) listState.animateScrollToItem(messages.size - 1)
    }`,
          caption: "Four familiar friends: `collectAsState()` for the two StateFlows (Module 5), `remember { mutableStateOf(\"\") }` for the local text field draft (also Module 5), and a `LaunchedEffect` that reacts to `messages.size` changing.",
        },
        {
          type: "quiz",
          q: "`viewModel: AssistantViewModel = viewModel()` — what does giving the parameter a default value of `viewModel()` buy you?",
          choices: [
            "It's required syntax with no real effect",
            "The caller can pass a specific view model for previews/tests, but normally just omits the argument and gets one scoped to this screen automatically",
            "It forces the view model to be recreated on every recomposition",
            "It makes the view model shared across every screen in the app",
          ],
          answer: 1,
          explain: "A default parameter is a normal Kotlin feature (Module 1) put to a very Android-specific use: most call sites write `AssistantScreen(onClose = ..., onBook = ...)` and never mention the view model at all — Compose's `viewModel()` helper looks one up (or creates it) scoped to the screen. Tests or previews can still override it by passing their own.",
          nudge: "Think about what a *default argument* means for the 99% of call sites that don't pass it explicitly.",
        },
        {
          type: "code",
          title: "AssistantScreen.kt (list + typing indicator)",
          source: String.raw`LazyColumn(
    state = listState,
    modifier = Modifier.weight(1f).fillMaxWidth().padding(horizontal = 16.dp),
    verticalArrangement = Arrangement.spacedBy(12.dp),
) {
    itemsIndexed(messages) { _, message ->
        MessageBubble(c, message, onBook)
    }
    if (sending) {
        item {
            Box(Modifier.padding(6.dp)) { CircularProgressIndicator(color = c.accent, strokeWidth = 2.dp) }
        }
    }
}`,
          caption: "The transcript is a `LazyColumn` (Module 9) of `MessageBubble`s. The spinner is just one more `item {}` that appears only while `sending` is true — no separate overlay, no special-casing.",
        },
        {
          type: "text",
          md: [
            "## Auto-scroll, the Compose way",
            "That `LaunchedEffect(messages.size)` block at the top is the whole auto-scroll feature. `LaunchedEffect` runs its block whenever its key — here, `messages.size` — changes. Append one message, the size changes by one, the effect re-runs, `listState.animateScrollToItem(messages.size - 1)` glides the list down to the newest bubble.",
            "That's it. No delegate methods, no manual scroll math — a state change triggers a side effect, the same pattern you've relied on since state entered the course.",
          ],
        },
        {
          type: "quiz",
          q: "Why key the `LaunchedEffect` on `messages.size` instead of on `messages` itself (the whole list)?",
          choices: [
            "`size` is required — Compose can't key on a List",
            "Either would work here since a new message always changes the size too, but keying on the smaller value is simpler and just as correct for this screen",
            "Keying on `messages` would scroll to the top instead of the bottom",
            "`size` makes the effect run on every recomposition, not just when a message is added",
          ],
          answer: 1,
          explain: "Every new message increases the count by exactly one, so watching `size` catches every append — and an `Int` is about as simple a key as you can hand `LaunchedEffect`. You could key on `messages` too; `size` is just the leaner choice here.",
          nudge: "What actually changes every time a message is appended — and is there a simpler value than the whole list to watch for that?",
        },
        {
          type: "exercise",
          title: "Wire the send button",
          prompt: [
            "The send button's `clickable` action, three lines, in order:",
            "1. Copy `draft` into a `val` named `text`.\n2. Clear `draft` by assigning it an empty string — the field empties instantly.\n3. Call `viewModel.send(text)`, passing the **copy**.",
            "Why copy first? By the time `send` finishes reading its argument, you want `draft` already empty on screen — copy freezes the message before the field is wiped.",
          ],
          starter: String.raw`.clickable(enabled = canSend) {
    // your code here — three lines
}`,
          solution: String.raw`.clickable(enabled = canSend) {
    val text = draft
    draft = ""
    viewModel.send(text)
}`,
          checks: [
            { re: /val text=draft/, hint: "First: save `draft` into a `val` named `text` — you're about to erase the field." },
            { re: /draft=""/, hint: "Second: assign the empty string to `draft` so the text field clears right away." },
            { re: /viewModel\.send\(text\)/, hint: "Third: call `viewModel.send(text)`, passing the frozen copy, not `draft`." },
          ],
          mustNot: [
            { re: /viewModel\.send\(draft\)/, hint: "You just cleared `draft` — pass the copy `text` instead, or the assistant gets an empty string." },
          ],
          success: "That's the real click handler from AssistantScreen.kt — and the last Kotlin you'll type in this course.",
        },
      ],
    },
    // ────────────────────────────────────────────────────────────────────
    {
      id: "talking-to-the-agent",
      title: "Talking to the Agent",
      steps: [
        {
          type: "code",
          title: "data/Models.kt (assistant section)",
          source: String.raw`@Serializable
data class AssistantChatRequest(
    val message: String,
)

@Serializable
data class DraftBooking(
    @SerialName("walker_id") val walkerId: String,
    @SerialName("dog_name") val dogName: String? = null,
    @SerialName("start_time") val startTime: String? = null,
    @SerialName("duration_minutes") val durationMinutes: Int = 30,
)

@Serializable
data class AssistantReply(
    val reply: String,
    @SerialName("suggested_walkers") val suggestedWalkers: List<String> = emptyList(),
    @SerialName("draft_booking") val draftBooking: DraftBooking? = null,
)`,
          caption: "The same `@SerialName` dance you've done since Module 4: snake_case JSON in, camelCase Kotlin out. `draftBooking` is nullable — the backend only fills it in when it's confident enough to pre-fill a booking.",
        },
        {
          type: "quiz",
          q: "`suggestedWalkers` is `List<String>`, not `List<Walker>`. What are those strings?",
          choices: [
            "Walker names, ready to show on screen",
            "Walker IDs — the app looks each one up in the walkers it already fetched",
            "URLs of walker profile photos",
            "Raw JSON blobs the app has to decode again",
          ],
          answer: 1,
          explain: "The backend sends just IDs and keeps the payload tiny. The view model already fetched every walker once and stashed them in a map keyed by ID — so turning an ID into a full record (name, rating, price) is one map lookup.",
          nudge: "Think about what's cheapest for the backend to send, given the app already knows how to fetch walkers.",
        },
        {
          type: "code",
          title: "ui/screens/AssistantViewModel.kt",
          source: String.raw`class AssistantViewModel : ViewModel() {
    data class Message(val fromUser: Boolean, val text: String, val walkers: List<Walker> = emptyList())

    private val _messages = MutableStateFlow(
        listOf(
            Message(
                false,
                "Hi! Tell me where and when you need a walk — e.g. \"a walker in the Mission for my husky tomorrow at 3pm\".",
            )
        )
    )
    val messages: StateFlow<List<Message>> = _messages.asStateFlow()

    private val _sending = MutableStateFlow(false)
    val sending: StateFlow<Boolean> = _sending.asStateFlow()

    private var walkersById: Map<String, Walker> = emptyMap()

    fun send(text: String) {
        val trimmed = text.trim()
        if (trimmed.isEmpty() || _sending.value) return
        _messages.value = _messages.value + Message(fromUser = true, text = trimmed)
        viewModelScope.launch {
            _sending.value = true
            try {
                if (walkersById.isEmpty()) walkersById = WalkerRepository.fetchWalkers().associateBy { it.id }
                val reply = Network.api.assistantChat(AssistantChatRequest(trimmed))
                val walkers = reply.suggestedWalkers.mapNotNull { walkersById[it] }
                _messages.value = _messages.value + Message(false, reply.reply, walkers)
            } catch (e: Exception) {
                _messages.value = _messages.value + Message(false, "Sorry — I couldn't reach the assistant. Try again.")
            } finally {
                _sending.value = false
            }
        }
    }
}`,
          caption: "Under forty lines, and you know every trick in them: `MutableStateFlow` + `StateFlow` (Module 5), `viewModelScope.launch` + `try`/`catch`/`finally` (Modules 3 & 8), a transcript that's just a `data class` in a `List`.",
        },
        {
          type: "text",
          md: [
            "## Reading it like a senior dev",
            "**`Message` is nested inside the view model** — it only exists to describe this transcript, so it lives with it. Nesting a `data class` inside a class you already know how to write (Module 2) costs nothing new.",
            "**`_messages` and `_sending` are private `MutableStateFlow`s; `messages` and `sending` are the public, read-only `StateFlow` views.** The screen can *collect* them but only the view model can *change* them — the same one-way-traffic rule from `WalkersViewModel` in Module 5.",
            "**`walkersById` is fetched once and cached.** The `if (walkersById.isEmpty())` guard means the second and third messages in a conversation don't re-fetch the whole walker list — only the very first `send()` pays that cost.",
            "**`send` appends the user's bubble *before* the network call.** The chat feels instant even on slow Wi-Fi. Then `_sending.value = true` shows the spinner, and `finally { _sending.value = false }` guarantees it turns off — success or failure, the spinner always stops. On failure, `catch` appends an apology bubble instead of crashing the screen.",
          ],
        },
        {
          type: "quiz",
          q: "Why does `_sending.value = false` live inside a `finally` block instead of right after the `try` block?",
          choices: [
            "`finally` is required syntax in Kotlin whenever there's a `catch`",
            "`finally` runs no matter which way the block exits — a clean reply or a caught exception — so the spinner always turns off either way",
            "It makes the coroutine run faster",
            "Code after the `try` block never runs if there's a `catch`",
          ],
          answer: 1,
          explain: "If you put `_sending.value = false` only after the `try`, a thrown exception would jump straight to `catch` and skip it — leaving the spinner stuck on. `finally` runs on every exit path, success or failure, so you never have to remember to reset the flag twice.",
          nudge: "What's the one thing `finally` guarantees that placing code after `try` doesn't?",
        },
        {
          type: "exercise",
          title: "Resolve IDs to walkers",
          prompt: [
            "Time to type the cleverest line in the file. After decoding `reply`, add **one line** that turns `reply.suggestedWalkers` (a list of walker ID strings) into full `Walker` records using the `walkersById` map. Store the result in a `val` named `walkers` — the line below expects that exact name.",
            "Use `mapNotNull`, because a map lookup with `[]` returns something that might be missing: an ID the app doesn't recognize (say, a walker added a second ago) comes back as nothing, and `mapNotNull` quietly drops those instead of crashing.",
          ],
          starter: String.raw`val reply = Network.api.assistantChat(AssistantChatRequest(trimmed))
// your code here — one line
_messages.value = _messages.value + Message(false, reply.reply, walkers)`,
          solution: String.raw`val reply = Network.api.assistantChat(AssistantChatRequest(trimmed))
val walkers = reply.suggestedWalkers.mapNotNull { walkersById[it] }
_messages.value = _messages.value + Message(false, reply.reply, walkers)`,
          checks: [
            { re: /val walkers=reply\.suggestedWalkers\.mapNotNull/, hint: "Store the result in `val walkers = reply.suggestedWalkers.mapNotNull { ... }` — the append line below uses that exact name." },
            { re: /mapNotNull\{walkersById\[it\]\}/, hint: "Inside the lambda, look each ID up with `walkersById[it]` — `it` is the implicit name for the single lambda parameter (Module 3)." },
          ],
          mustNot: [
            { re: /\.map\{/, hint: "Plain `map` would keep `null` entries for IDs that aren't found. Use `mapNotNull` to drop them." },
          ],
          success: "That's the exact line shipping in AssistantViewModel.kt. One map, one mapNotNull, and ID strings become bookable walkers.",
        },
      ],
    },
    // ────────────────────────────────────────────────────────────────────
    {
      id: "the-rest-of-the-app",
      title: "The Rest of the App",
      steps: [
        {
          type: "text",
          md: [
            "## A guided tour, no new vocabulary",
            "Two screens are left in PawWalk that this course never stopped to name: **PetsScreen** and **ProfileScreen**. You're not going to learn anything new from them — that's the point of this lesson. Read them and notice you can already explain every line.",
          ],
        },
        {
          type: "code",
          title: "ui/screens/PetsScreen.kt (view model)",
          source: String.raw`class PetsViewModel : ViewModel() {
    sealed interface UiState {
        data object Loading : UiState
        data class Success(val pets: List<Pet>) : UiState
        data class Error(val message: String) : UiState
    }

    private val _state = MutableStateFlow<UiState>(UiState.Loading)
    val state: StateFlow<UiState> = _state.asStateFlow()

    init { load() }

    fun load() {
        viewModelScope.launch {
            _state.value = UiState.Loading
            _state.value = try { UiState.Success(PetRepository.list()) }
            catch (e: Exception) { UiState.Error(e.message ?: "Couldn't load pets") }
        }
    }

    fun add(request: CreatePetRequest) {
        viewModelScope.launch { runCatching { PetRepository.create(request) }; load() }
    }
}`,
          caption: "A `sealed interface UiState` with Loading/Success/Error (Module 3), a `StateFlow` (Module 5), a `suspend`-backed repository call in `viewModelScope.launch` (Module 4). You could have written this file yourself back in Module 8.",
        },
        {
          type: "quiz",
          q: "What does `runCatching { PetRepository.create(request) }` buy over a plain `try`/`catch` in `add`?",
          choices: [
            "It's the only way to call a suspend function",
            "It wraps the call's success-or-failure into a single value that `add` deliberately ignores here — either way, `load()` still runs to refresh the list",
            "It retries the request automatically on failure",
            "It makes the request run on a background thread",
          ],
          answer: 1,
          explain: "`runCatching` is a stdlib helper that turns a thrown exception into a returned value instead of propagating it. `add` doesn't need to branch on the outcome — whether the create succeeded or failed, it wants to call `load()` next to refresh the pets list from the server, and `runCatching` makes that one line instead of a `try`/`catch` block.",
          nudge: "Look at what runs on the line right after — does `add` care about the specific result of the create call, or just that it's done trying?",
        },
        {
          type: "code",
          title: "ui/screens/ProfileScreen.kt (top of the composable)",
          source: String.raw`@Composable
fun ProfileScreen(
    user: User?,
    onClose: () -> Unit,
    onBookings: () -> Unit,
    onPets: () -> Unit,
    onLogout: () -> Unit,
) {
    val c = Hud.colors
    var pets by remember { mutableStateOf<List<Pet>>(emptyList()) }
    LaunchedEffect(Unit) { pets = runCatching { PetRepository.list() }.getOrDefault(emptyList()) }
    Box(Modifier.fillMaxSize().background(c.canvas)) {
        Column(
            Modifier.fillMaxSize().verticalScroll(rememberScrollState())
                .statusBarsPadding().padding(horizontal = 24.dp).padding(top = 16.dp, bottom = 24.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp),
        ) {`,
          caption: "`ProfileScreen` doesn't even have its own ViewModel — the screen fetches `pets` itself in a `LaunchedEffect(Unit)`, which runs its block exactly once when the screen first appears (the key `Unit` never changes, so the effect never re-runs). Callbacks (`onClose`, `onBookings`, `onPets`, `onLogout`) are passed in rather than owned here — events flow up, same as always.",
        },
        {
          type: "quiz",
          q: "Why does `ProfileScreen` take five callback parameters (`onClose`, `onBookings`, `onPets`, `onLogout`, plus `user`) instead of navigating directly with a `NavController`?",
          choices: [
            "Compose doesn't allow composables to trigger navigation",
            "It keeps the composable decoupled from *how* navigation works — the caller (wired up near the NavHost) decides what each action actually does",
            "It's slower to call NavController directly, so callbacks are a performance optimization",
            "Callbacks are required for any function with more than two parameters",
          ],
          answer: 1,
          explain: "This is state-hoisting's sibling principle for events: a reusable composable shouldn't reach out and grab a `NavController` itself — it just reports \"the user tapped bookings\" via `onBookings()` and lets whoever composes it decide what that means (usually `navController.navigate(...)`, wired up once near the `NavHost`). Same idea as Module 9's navigation graph, just applied to a leaf screen.",
          nudge: "Where in the app does something actually call `navController.navigate(...)` for this screen — inside ProfileScreen, or somewhere closer to the NavHost?",
        },
        {
          type: "exercise",
          title: "Spot the pattern",
          prompt: [
            "`PetsScreen`'s delete action and `ProfileScreen`'s pet-loading effect both lean on a helper instead of raw `try`/`catch`. Write one line that loads a `List<Pet>` from `PetRepository.list()`, falling back to `emptyList()` on any failure, and store it in a `val` named `pets` — exactly the pattern `ProfileScreen` uses in its `LaunchedEffect`.",
          ],
          starter: String.raw`// your code here — one line
`,
          solution: String.raw`val pets = runCatching { PetRepository.list() }.getOrDefault(emptyList())`,
          checks: [
            { re: /val pets=runCatching\{PetRepository\.list\(\)\}/, hint: "Wrap `PetRepository.list()` in `runCatching { ... }`, storing the result in `val pets`." },
            { re: /\.getOrDefault\(emptyList\(\)\)/, hint: "Chain `.getOrDefault(emptyList())` after the `runCatching` block to fall back to an empty list on failure." },
          ],
          success: "That's the exact line from ProfileScreen.kt. runCatching + getOrDefault is a one-line try/catch for whenever you just want a safe fallback value.",
        },
      ],
    },
    // ────────────────────────────────────────────────────────────────────
    {
      id: "graduation",
      title: "Graduation",
      steps: [
        {
          type: "text",
          md: [
            "## Look how far you've come",
            "Twelve modules ago, `val` versus `var` was news. Now look at what you can read — and write:",
            "- **Kotlin itself** — constants, nullability, data classes, lambdas, `when`, sealed interfaces (Modules 1–3)\n- **Serializable models & coroutines** — the entire assistant section of `Models.kt`, snake_case JSON and all, plus `suspend fun` (Module 3)\n- **Jetpack Compose** — composables, layout, modifiers, `remember`, `StateFlow` view models (Modules 4–6)\n- **A design system** — the `Hud` tokens and typography on every screen (Module 7)\n- **Networking & auth** — Retrofit, `Network.kt`, the DataStore token, the auth interceptor (Modules 8–9)\n- **Real screens** — lists, navigation, booking flows, a live map (Modules 10–12)\n- **And today** — an AI assistant that was, honestly, just all of the above again",
            "That last point is the real graduation gift: the 'hardest' feature in the app introduced *zero* new concepts. That's what knowing a stack feels like — new features stop being new, and start being combinations.",
          ],
        },
        {
          type: "quiz",
          q: "Self-assessment: which pair is matched correctly?",
          choices: [
            "`suspend fun` ↔ a function that can pause without blocking the thread it's called from",
            "`sealed interface` ↔ a class that can never be instantiated under any circumstance",
            "`StateFlow` ↔ a one-time event, like a button click",
            "`remember` ↔ permanent storage that survives an app restart",
          ],
          answer: 0,
          explain: "`suspend` marks a function that can be paused and resumed without blocking a thread — that's the whole coroutine story from Module 3. A `sealed interface` *can* be instantiated, just only by the implementations you've declared (Module 2). `StateFlow` holds an ongoing *value* over time, not a one-shot event. `remember` only survives recomposition, not a process death or restart — that's what `rememberSaveable` or real persistence (DataStore, Module 8) is for.",
          nudge: "Match each term to what it actually guarantees — not just what it sounds like it might do.",
        },
        {
          type: "quiz",
          q: "Final exam, one question. An owner taps a suggested walker's chip in the assistant chat. What happens, in order?",
          choices: [
            "`onBook(walker)` fires → the screen that hosts `AssistantScreen` reacts (e.g. by navigating to or showing `CreateBookingScreen` for that walker) → booking it POSTs to `/bookings`",
            "The chip calls `Network.api.assistantChat` again, this time with the walker's name",
            "The chip directly inserts a row into the backend database",
            "Nothing — chips are decorative and only the text field can start a booking",
          ],
          answer: 0,
          explain: "Same event-flows-up pattern from every screen this module touched: `MessageBubble`'s chip calls `onBook(walker)`, a callback passed down from wherever `AssistantScreen` is composed, and that caller decides what booking means (opening `CreateBookingScreen`). The actual `POST /bookings` is the same call from your bookings module. You didn't just pick the right answer — you traced a callback through two files.",
          nudge: "Nobody inside `AssistantScreen` imports a booking screen directly — so what's the *one* thing tapping a chip actually does locally?",
        },
        {
          type: "text",
          md: [
            "## Where to go next",
            "This course was one path through Android — deliberately narrow, so every line had a reason. To go deeper:",
            "- **[Android Basics with Compose](https://developer.android.com/courses)** — Google's own project-based course, official and free.\n- **[Now in Android](https://github.com/android/nowinandroid)** — a real, current sample app (plus a podcast) showing best practices at a scale bigger than PawWalk.\n- **`docs/learning/android.md`** in this repo — the original module-by-module plan this course grew out of, with stretch goals: Coil for images, Maps Compose + FusedLocationProvider for live tracking, the Stripe Android SDK for real payments.",
            "> **Challenge exercise:** add a *favorite walker* feature end to end — a star toggle on `WalkerCard`, a field on `Walker` (or a small local store), and a filter on the walkers list for \"favorites only\". Every piece of that — state, a data class field, a `LazyColumn` filter — is something you've already built in this course. Go build it without a tutorial.",
          ],
        },
        {
          type: "xcode",
          label: "Over to Android Studio",
          title: "The graduation walk",
          intro: [
            "One last run. Book a walk the way a real user would — by asking for it:",
          ],
          items: [
            "Terminal tab 1: `cd apps/backend && uv run fastapi dev` — leave it running.",
            "In Android Studio, select your Pixel API 36 emulator and press **Shift+F10** to run.",
            "Log in as a **pet owner** — the Assistant lives on the owner's Home screen.",
            "Open the Assistant and ask for something specific: \"a walker in the Mission for my husky tomorrow at 3pm\".",
            "Watch the reply arrive with walker chips — that's your `mapNotNull` resolving IDs to names and ratings.",
            "Tap a chip, confirm the booking form is pre-set to that walker, and book the walk. Then check your bookings list: it's there.",
            "That's the whole app, end to end, and you understand every file it touched. Congratulations, graduate. 🎓🐾",
          ],
        },
      ],
    },
  ],
});
