// Module 05 — State & Data Flow (Android track). See ../lessons/FORMAT.md and
// ./FORMAT-KOTLIN.md for the schema and Kotlin-specific traps.
window.COURSE = window.COURSE || [];
window.COURSE.push({
  id: "compose-state",
  title: "State & Data Flow",
  emoji: "🔄",
  lang: "kotlin",
  lessons: [
    // ────────────────────────────────────────────────────────────
    {
      id: "remember-mutable-state",
      title: "remember & mutableStateOf",
      steps: [
        {
          type: "text",
          md: [
            "## Composables have no memory",
            "A `@Composable` function is just that — a function. Compose calls it to draw the screen, and calls it again ('recomposes' it) whenever something it reads changes. Here's the catch: every time it's called, any plain `var count = 0` inside it resets right back to `0`. A composable function has no memory of its own between calls.",
            "That's the job of **`remember`**: it tells Compose *store this value for me, outside the function, and hand it back unchanged the next time you call me.* Pair it with **`mutableStateOf(...)`**, which creates a value Compose can watch for changes, and you get a variable that both survives recomposition AND triggers a new one when it changes.",
            "> New term: **recomposition** — Compose calling a `@Composable` function again to recompute what's on screen. SwiftUI calls the same idea a re-render.",
          ],
        },
        {
          type: "code",
          title: "A counter — the \"hello world\" of Compose state",
          source: String.raw`@Composable
fun WalkCounter() {
    var walksToday by remember { mutableStateOf(0) }

    Column {
        Text("Walks today: $walksToday")
        Button(onClick = { walksToday += 1 }) {
            Text("Add a walk")
        }
    }
}`,
          caption: "Tap the button, the number on screen goes up. Nobody told the Text to redraw — that's the recomposition loop we unpack next.",
        },
        {
          type: "text",
          md: [
            "## The update loop, and that `by` keyword",
            "When `walksToday` changes, Compose notices, re-runs `WalkCounter`, and redraws whatever changed. You never call a refresh function — you change the *data*, and the *screen follows*. That's the whole contract, and it's identical to SwiftUI's: change state, and the UI updates itself.",
            "`mutableStateOf(0)` alone gives you a `MutableState<Int>` object — you'd have to write `walksToday.value` everywhere. The **`by`** keyword is Kotlin's *property delegate* syntax: it lets `walksToday` behave like a plain `Int` (read and write it directly) while `MutableState` still does the watching behind the scenes. You'll see `var x by remember { mutableStateOf(...) }` in nearly every screen in this app.",
            "**The rule: `remember { mutableStateOf(...) }` is for composable-local state** — a count, a piece of text, a Boolean that only this one composable cares about. Data shared across screens is a different tool — that's lesson 3.",
          ],
        },
        {
          type: "quiz",
          q: "You tap \"Add a walk\" and `walksToday` goes from 0 to 1. What makes the Text on screen update?",
          choices: [
            "Compose notices the mutableStateOf change and recomposes automatically",
            "You must call `refresh()` on the Text",
            "The Text re-reads the variable once per second",
            "Nothing — the screen shows 0 until the app restarts",
          ],
          answer: 0,
          explain: "Change the data, and Compose recomposes and redraws whatever read it. Your job is state, Compose's job is the screen.",
          nudge: "Who owns the recomposition loop — you or Compose?",
        },
        {
          type: "exercise",
          title: "A walk-length picker",
          prompt: [
            "PawWalk walks come in 30, 45, and 60-minute lengths. Build the state behind a simple length picker.",
            "1. Declare a `remember { mutableStateOf(...) }` property called `minutes`, starting at `30`, using `by`.\n2. In the button's `onClick`, add `15` to it.",
          ],
          starter: String.raw`@Composable
fun WalkLengthPicker() {
    // your code here (the state property)

    Column {
        Text("$minutes min walk")
        Button(onClick = {
            // your code here (the action)
        }) { Text("+15 min") }
    }
}`,
          solution: String.raw`@Composable
fun WalkLengthPicker() {
    var minutes by remember { mutableStateOf(30) }

    Column {
        Text("$minutes min walk")
        Button(onClick = {
            minutes += 15
        }) { Text("+15 min") }
    }
}`,
          checks: [
            { re: /var minutes by remember\{mutableStateOf\(30\)\}/, hint: "The shape is `var minutes by remember { mutableStateOf(30) }` — `by` is what lets you treat it like a plain Int." },
            { re: /minutes\+=15/, hint: "Inside `onClick`, bump `minutes` in place — the `+=` operator from Module 01 does it in one line." },
          ],
          mustNot: [
            { re: /val minutes/, hint: "`val` values can never change — state that changes must be a `var`." },
          ],
          success: "Tap +15 and the Text redraws with the new length — no refresh call in sight.",
        },
        {
          type: "quiz",
          q: "Which of these is the RIGHT job for `remember { mutableStateOf(...) }`?",
          choices: [
            "The app's accent color, fixed at compile time",
            "The signed-in user, needed by every screen in the app",
            "Whether this one composable is currently showing its filter options — a Boolean only it cares about",
            "The backend's database connection",
          ],
          answer: 2,
          explain: "Composable-local values — that's the sweet spot for `remember`. App-wide shared data (like the signed-in user) gets its own tools later in this module.",
          nudge: "The rule was: *local to this composable*, *survives recomposition*.",
        },
      ],
    },
    // ────────────────────────────────────────────────────────────
    {
      id: "state-hoisting",
      title: "State Hoisting",
      steps: [
        {
          type: "text",
          md: [
            "## State down, events up",
            "`Text(\"30 min walk\")` only *displays* state. A text field is different: it must show the current value AND report back every character the user types. Compose's pattern for that is called **state hoisting**: a composable doesn't own its own state — it takes the current `value` as a parameter, and reports changes back up through a callback like `onValueChange`. The *caller* decides where the state actually lives.",
            "This is the direct equivalent of SwiftUI's `@Binding`: instead of a two-way connection object, Compose just passes a plain value down and a lambda up. Same idea, different mechanics — no special property wrapper needed.",
          ],
        },
        {
          type: "code",
          title: "Three controls, one hoisted state each",
          source: String.raw`@Composable
fun LoginForm() {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var staySignedIn by remember { mutableStateOf(true) }

    Column {
        TextField(value = email, onValueChange = { email = it })
        TextField(value = password, onValueChange = { password = it })
        Switch(checked = staySignedIn, onCheckedChange = { staySignedIn = it })
    }
}`,
          caption: "Each control reads its current value from state and writes back through a callback. `it` is Kotlin's implicit name for a lambda's single parameter — you met it in Module 02.",
        },
        {
          type: "quiz",
          q: "In `TextField(value = email, onValueChange = { email = it })`, what does `onValueChange` do?",
          choices: [
            "It runs once, when the TextField first appears",
            "It's called every time the user types a character, handing back the field's new text as `it`",
            "It validates the email format",
            "It sets the placeholder text",
          ],
          answer: 1,
          explain: "You type a character → Compose calls `onValueChange` with the new text → you write it into `email` → recomposition shows the updated text. State down, events up, every keystroke.",
          nudge: "Which parameter name means \"the thing that just changed\"?",
        },
        {
          type: "text",
          md: [
            "## Hoisting one level further: passing state to a child composable",
            "PawWalk's login screen, `AuthScreen`, owns the email and password state. But a styled text field is its own small composable, `AuthField`, so the styling isn't rewritten for every field. If `AuthField` declared its own `remember { mutableStateOf(\"\") }`, it would collect typing into *its own copy* — `AuthScreen`'s `email` would stay empty forever.",
            "The fix is the same hoisting pattern, one level deeper: `AuthField` takes `value: String` and `onValueChange: (String) -> Unit` as plain parameters — no state of its own — and the parent supplies both.",
          ],
        },
        {
          type: "code",
          title: "ui/screens/AuthScreen.kt (excerpt)",
          source: String.raw`var email by remember { mutableStateOf("") }
var password by remember { mutableStateOf("") }

AuthField(
    label = "Email", value = email, onValueChange = { email = it },
    keyboardType = KeyboardType.Email,
)
Spacer(Modifier.height(14.dp))
AuthField(
    label = "Password", value = password, onValueChange = { password = it },
    keyboardType = KeyboardType.Password, isPassword = true,
)`,
          caption: "Straight from the real file. `AuthScreen` owns both `email` and `password` — `AuthField` never declares state of its own.",
        },
        {
          type: "code",
          title: "ui/screens/AuthScreen.kt — the AuthField child (trimmed)",
          source: String.raw`@Composable
private fun AuthField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    keyboardType: KeyboardType = KeyboardType.Text,
    isPassword: Boolean = false,
) {
    val c = Hud.colors
    Column {
        MonoText(label, c.ink.copy(alpha = 0.55f), sizeSp = 9.5f, trackingEm = 0.1f)
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            modifier = Modifier.fillMaxWidth().padding(top = 6.dp),
            singleLine = true,
        )
    }
}`,
          caption: "Trimmed — the real file also sets text styling, colors, and visual transformation for passwords. Note: `value` and `onValueChange` are just parameters, forwarded straight into the real `OutlinedTextField`.",
        },
        {
          type: "quiz",
          q: "Why does `AuthField` take `value` and `onValueChange` as parameters instead of declaring its own `remember { mutableStateOf(\"\") }`?",
          choices: [
            "remember only works with numbers",
            "AuthField renders faster without its own state",
            "The email lives in AuthScreen — AuthField needs to read and update *that* value, not a private copy of its own",
            "Composables aren't allowed to use remember",
          ],
          answer: 2,
          explain: "With its own state, AuthField would happily collect your typing into a copy — and when you hit \"Log in\", AuthScreen would send an empty email to the backend. Ownership stays with the parent; the child just displays and reports.",
          nudge: "Who owns the value — the parent or the child?",
        },
        {
          type: "exercise",
          title: "A notes field for the walker",
          prompt: [
            "PawWalk's booking form lets owners leave notes for the walker (\"Mochi pulls on the leash near squirrels\"). Build the hoisted state + field pair.",
            "1. Declare `notes` with `remember { mutableStateOf(\"\") }`, using `by`.\n2. Add a `TextField` whose `value` is `notes` and whose `onValueChange` writes the new text back into `notes`.",
          ],
          starter: String.raw`@Composable
fun BookingNotes() {
    // your code here (the state)

    // your code here (the text field)
}`,
          solution: String.raw`@Composable
fun BookingNotes() {
    var notes by remember { mutableStateOf("") }

    TextField(value = notes, onValueChange = { notes = it })
}`,
          checks: [
            { re: /var notes by remember\{mutableStateOf\(""\)\}/, hint: "Same shape as the walk-length picker's state line — `var notes by remember { mutableStateOf(\"\") }`." },
            { re: /TextField\(value=notes,onValueChange=\{notes=it\}\)/, hint: "`TextField` takes `value = notes` and `onValueChange = { notes = it }` — write the callback's `it` straight back into `notes`." },
          ],
          mustNot: [
            { re: /remember\{mutableStateOf\(""\)\}.*remember\{mutableStateOf\(""\)\}/s, hint: "Only one state property is needed here — one `notes` variable, hoisted into one TextField." },
          ],
          success: "Every character typed lands straight in `notes` — ready to send with the booking.",
        },
      ],
    },
    // ────────────────────────────────────────────────────────────
    {
      id: "viewmodel-stateflow",
      title: "ViewModel & StateFlow",
      steps: [
        {
          type: "text",
          md: [
            "## When state outgrows the composable",
            "The Walkers screen shows a list fetched from the backend. That involves real logic: start a request, handle success, handle failure. Stuffing all of that into a `@Composable` function gets ugly fast — and recomposition can re-run that function far more often than you'd want a network call to fire.",
            "The Android pattern is a **`ViewModel`**: a class that owns a screen's data and the logic around it, and — unlike a composable — survives configuration changes (like a screen rotation) on its own. The composable's only job is to *display* whatever the ViewModel says.",
            "Inside the ViewModel, PawWalk uses a pair of Flows: a **private `MutableStateFlow`** that only the ViewModel can change, and a **public `StateFlow`** — the read-only view of the same stream — that the screen observes. That split is exactly `private(set) var` from the iOS course, just spelled with two properties instead of one keyword.",
          ],
        },
        {
          type: "quiz",
          q: "Why does WalkersViewModel expose `state` as `StateFlow<UiState>` (read-only) while keeping `_state` as `MutableStateFlow<UiState>` (private)?",
          choices: [
            "StateFlow is faster than MutableStateFlow",
            "So only code inside the ViewModel can change the state, while any screen can read it",
            "MutableStateFlow doesn't work with sealed interfaces",
            "It's required by the Kotlin compiler for all classes",
          ],
          answer: 1,
          explain: "Same idea as `private(set)` on the iOS side: everyone can read, only the owner can write. It's how a ViewModel protects its own state from outside interference.",
          nudge: "One property is `private`, the other isn't — what does that buy you?",
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
          caption: "The whole file. `UiState` you met in Module 02 — one sealed interface, three impossible-to-mix cases. `viewModelScope.launch` starts a coroutine tied to this ViewModel's lifetime — proper coverage in Module 03/07; for today, just know it's how `load()` runs without freezing the UI.",
        },
        {
          type: "text",
          md: [
            "## Reading a StateFlow from a composable: `collectAsState()`",
            "A `StateFlow` on its own isn't something Compose watches automatically — you have to bridge it. `collectAsState()` does exactly that: it collects the Flow and exposes its latest value as Compose `State`, so reading it inside a composable triggers recomposition on every new value, just like `remember { mutableStateOf(...) }` would.",
            "`by viewModel.state.collectAsState()` — same `by` delegate you already know, just delegating to a Flow instead of a plain `mutableStateOf`. That one line is the entire wiring between a ViewModel's business logic and a screen's UI.",
          ],
        },
        {
          type: "code",
          title: "ui/screens/WalkersScreen.kt (excerpt)",
          source: String.raw`@Composable
fun WalkersScreen(
    onWalkerSelected: (Walker) -> Unit,
    viewModel: WalkersViewModel = viewModel(),
) {
    val state by viewModel.state.collectAsState()

    when (val s = state) {
        is WalkersViewModel.UiState.Loading -> CircularProgressIndicator()
        is WalkersViewModel.UiState.Error -> Text("Couldn't load walkers: ${"$"}{s.message}")
        is WalkersViewModel.UiState.Success ->
            LazyColumn { items(s.walkers) { walker -> WalkerCard(walker) } }
    }
}`,
          caption: "`viewModel: WalkersViewModel = viewModel()` is a default parameter that asks Android for the screen's ViewModel — new the first time, the SAME instance across recompositions and rotations. `when (val s = state)` both switches on the sealed interface and smart-casts `s` to the matching branch's type.",
        },
        {
          type: "quiz",
          q: "What does `val state by viewModel.state.collectAsState()` do inside a composable?",
          choices: [
            "It runs the ViewModel's `load()` function",
            "It collects the StateFlow and exposes its latest value as Compose State — reading it triggers recomposition on every new emission",
            "It copies the ViewModel's state once, at first launch, and never updates",
            "It blocks the UI thread until the Flow completes",
          ],
          answer: 1,
          explain: "That's the bridge: business-logic Flow on one side, Compose recomposition on the other. Same recipe every screen in this app uses to read its ViewModel.",
          nudge: "What does `remember { mutableStateOf(...) } ` do for a plain value — now do that, but for a Flow.",
        },
        {
          type: "exercise",
          title: "Rebuild the WalkersViewModel shell",
          prompt: [
            "Time to build the real thing. The `UiState` sealed interface is given — you write the Flow pair and the body of `load()`.",
            "1. Declare `_state`: a `MutableStateFlow<UiState>` starting at `UiState.Loading`.\n2. Declare the public `state`: a `StateFlow<UiState>` built from `_state.asStateFlow()`.\n3. Inside `load()`, wrap the work in `viewModelScope.launch { }`. Set `_state.value` to `UiState.Loading`, then to a `try`/`catch` result: on success, `UiState.Success(WalkerRepository.fetchWalkers())`; on `catch (e: Exception)`, `UiState.Error(e.message ?: \"Something went wrong\")`.",
          ],
          starter: String.raw`class WalkersViewModel : ViewModel() {

    sealed interface UiState {
        data object Loading : UiState
        data class Success(val walkers: List<Walker>) : UiState
        data class Error(val message: String) : UiState
    }

    // your code here (the two Flow properties)

    fun load() {
        // your code here (viewModelScope.launch with the try/catch)
    }
}`,
          solution: String.raw`class WalkersViewModel : ViewModel() {

    sealed interface UiState {
        data object Loading : UiState
        data class Success(val walkers: List<Walker>) : UiState
        data class Error(val message: String) : UiState
    }

    private val _state = MutableStateFlow<UiState>(UiState.Loading)
    val state: StateFlow<UiState> = _state.asStateFlow()

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
          checks: [
            { re: /private val _state=MutableStateFlow<UiState>\(UiState\.Loading\)/, hint: "`private val _state = MutableStateFlow<UiState>(UiState.Loading)` — private so only this class can write it." },
            { re: /val state:StateFlow<UiState>=_state\.asStateFlow\(\)/, hint: "The public property: `val state: StateFlow<UiState> = _state.asStateFlow()` — read-only outside the class." },
            { re: /viewModelScope\.launch\{/, hint: "`load()`'s body starts with `viewModelScope.launch { … }` — everything else happens inside that block." },
            { re: /catch\(e:Exception\)\{UiState\.Error\(e\.message\?:/, hint: "The catch branch's result is `UiState.Error(e.message ?: \"…\")` — a human fallback message when `e.message` is null. It's the value of the whole `try { … } catch { … }` expression, same as the `_state.value = try { … } catch { … }` shape in the source." },
          ],
          mustNot: [
            { re: /valstate:MutableStateFlow/, hint: "The PUBLIC property must be `StateFlow`, not `MutableStateFlow` — only `_state` is mutable." },
          ],
          success: "That's the exact file at ui/screens/WalkersViewModel.kt — the pattern every PawWalk screen's ViewModel follows.",
        },
      ],
    },
    // ────────────────────────────────────────────────────────────
    {
      id: "where-state-lives",
      title: "Where State Lives",
      steps: [
        {
          type: "text",
          md: [
            "## One `when`, three screens",
            "Look back at `WalkersScreen`'s body: it doesn't have an `if isLoading` and a separate `if hasError` sitting side by side — it has one `when (val s = state)` with three branches, one per `UiState` case. Because `UiState` is a `sealed interface`, the screen is *exactly one* of loading, success, or error, never some confusing mix. The compiler even checks the `when` is exhaustive — miss a case and it won't build.",
            "Compare that to three separate flags (`isLoading: Boolean`, `walkers: List<Walker>`, `errorMessage: String?`), where \"loading AND showing an error\" becomes a state you can accidentally construct — and will, at the worst possible time. The sealed interface makes that whole bug category impossible to write.",
          ],
        },
        {
          type: "quiz",
          q: "Why does WalkersViewModel use one `UiState` sealed interface instead of three separate properties (`isLoading`, `walkers`, `errorMessage`)?",
          choices: [
            "Sealed interfaces use less memory",
            "With three separate properties the screen could be loading AND showing an error at once — the sealed interface makes exactly one state representable at a time",
            "Compose can only observe sealed interfaces",
            "Lists can't be stored in a ViewModel",
          ],
          answer: 1,
          explain: "\"Make impossible states impossible\" — the sealed interface turns a whole family of bugs into code that won't compile, and a `when` over it can't accidentally skip a case.",
          nudge: "What would `isLoading == true` while `errorMessage != null` even mean on screen?",
        },
        {
          type: "text",
          md: [
            "## Why composables never own business state",
            "Notice what `WalkersScreen` does NOT do: it never calls the backend, never catches an exception, never decides what counts as an error message. All of that lives in `WalkersViewModel`. The composable's entire job is to pattern-match on `state` and render the matching UI.",
            "That split matters for a very practical reason: a composable can be recomposed dozens of times a second during a scroll or animation. If `WalkersScreen` owned the network call, you'd risk re-fetching walkers on every recomposition. A `ViewModel` fetches once (via `init { load() }`) and survives — the screen just keeps reading whatever it currently holds.",
            "This is the same layering as the iOS course's `@Observable` view models: **view models own data and logic; views (composables) only display it.** Different keywords, identical architecture.",
          ],
        },
        {
          type: "code",
          title: "ui/screens/WalkersScreen.kt — the full switch",
          source: String.raw`when (val s = state) {
    is WalkersViewModel.UiState.Loading ->
        Column(
            Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally,
        ) { CircularProgressIndicator(color = c.accent) }

    is WalkersViewModel.UiState.Error ->
        Column(
            Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally,
        ) { MonoText("Couldn't load walkers: ${"$"}{s.message}", c.ink.copy(alpha = 0.6f), upper = false) }

    is WalkersViewModel.UiState.Success ->
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            items(s.walkers) { walker -> WalkerCard(c, walker, onClick = { onWalkerSelected(walker) }) }
        }
}`,
          caption: "Verbatim from the repo. `is WalkersViewModel.UiState.Error -> ` smart-casts `s` to the `Error` case for that branch alone, so `s.message` is available without an unwrap. `LazyColumn`/`items` get full coverage in Module 09.",
        },
        {
          type: "quiz",
          q: "WalkersScreen recomposes several times while the user scrolls the list. What happens to the network request that fetched the walkers?",
          choices: [
            "It fires again on every recomposition, once per frame",
            "Nothing re-fetches — the ViewModel already fetched once and holds the result; the screen just keeps reading the same StateFlow",
            "The app crashes from too many requests",
            "Compose automatically deduplicates the requests",
          ],
          answer: 1,
          explain: "Because the fetch lives in the ViewModel (triggered once via `init { load() }`), recomposition is just Compose re-reading a value that's already sitting in `state` — no repeated network calls.",
          nudge: "Where does `load()` get called from — inside the composable, or inside the ViewModel's `init`?",
        },
        {
          type: "exercise",
          title: "One state, one switch",
          prompt: [
            "Write a tiny composable, `WalkerCountLabel`, that displays a walker count based on a `WalkersViewModel.UiState`.",
            "1. Take one parameter: `state: WalkersViewModel.UiState`.\n2. Use `when (state)` with three branches: `Loading` shows `Text(\"Loading…\")`; `is Success` shows `Text(\"${state.walkers.size} walkers\")`; `is Error` shows `Text(\"Error\")`.",
          ],
          starter: String.raw`@Composable
fun WalkerCountLabel(state: WalkersViewModel.UiState) {
    // your code here (the when)
}`,
          solution: String.raw`@Composable
fun WalkerCountLabel(state: WalkersViewModel.UiState) {
    when (state) {
        is WalkersViewModel.UiState.Loading -> Text("Loading…")
        is WalkersViewModel.UiState.Success -> Text("${"$"}{state.walkers.size} walkers")
        is WalkersViewModel.UiState.Error -> Text("Error")
    }
}`,
          checks: [
            { re: /when\(state\)\{/, hint: "Switch directly on the parameter: `when (state) { … }`." },
            { re: /is WalkersViewModel\.UiState\.Success->Text\("\$\{state\.walkers\.size\}/, hint: "The Success branch reads `state.walkers.size` inside a string template: `Text(\"${state.walkers.size} walkers\")`." },
            { re: /is WalkersViewModel\.UiState\.Error->Text\("Error"\)/, hint: "The Error branch is the simplest one: just `Text(\"Error\")`." },
          ],
          mustNot: [
            { re: /if\s*\(state is WalkersViewModel\.UiState\.Loading\)/, hint: "Use a single exhaustive `when`, not a chain of `if` checks — that's the whole point of a sealed interface." },
          ],
          success: "One sealed interface, one exhaustive `when`, zero impossible states — you now hold the complete data-flow toolkit: remember/mutableStateOf, hoisted state, ViewModel + StateFlow, and collectAsState. Every screen in PawWalk is built from exactly these.",
        },
      ],
    },
  ],
});
