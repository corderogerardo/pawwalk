// Module 09 — Lists & Navigation. See ../lessons/FORMAT.md and ./FORMAT-KOTLIN.md
// for the schema and Kotlin-specific traps.
window.COURSE = window.COURSE || [];
window.COURSE.push({
  id: "lists-navigation",
  title: "Lists & Navigation",
  emoji: "🧭",
  lang: "kotlin",
  lessons: [
    // ────────────────────────────────────────────────────────────
    {
      id: "lazy-column",
      title: "LazyColumn: Rows from a List",
      steps: [
        {
          type: "text",
          md: [
            "## The scrolling workhorse",
            "Almost every content screen in PawWalk is a list on display: walkers, bookings, pets. Compose's tool for that is **LazyColumn** — a vertically scrolling list that only composes the rows currently visible on screen, plus a small buffer. Scroll a thousand-walker list and it stays fast, because it never builds all thousand rows at once.",
            "Contrast that with plain `Column`, which you met in Module 04: a `Column` lays out *everything* you hand it immediately, whether it's on screen or not. Fine for a handful of fixed items — a real problem for a list that could hold hundreds. `LazyColumn` is `Column`'s lazy cousin, built for exactly that case.",
            "Inside a `LazyColumn`, you don't put children directly — you call `items(...)` inside a trailing lambda that acts as a small DSL (`LazyListScope`). `items(walkers) { walker -> WalkerCard(walker) }` says: for each element of `walkers`, run this closure and place the result as one row.",
          ],
        },
        {
          type: "code",
          title: "ui/screens/WalkersScreen.kt — the loaded state",
          source: String.raw`is WalkersViewModel.UiState.Success ->
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        items(s.walkers) { walker -> WalkerCard(c, walker, onClick = { onWalkerSelected(walker) }) }
    }`,
          caption: "`verticalArrangement = Arrangement.spacedBy(12.dp)` puts 12dp of breathing room between every row — no per-row bottom padding needed. `items` needs an `import androidx.compose.foundation.lazy.items` alongside `LazyColumn`'s own import.",
        },
        {
          type: "quiz",
          q: "A plain `Column` and a `LazyColumn` can both display a list of items. What's the real difference?",
          choices: [
            "LazyColumn only composes the rows currently visible on screen; Column builds everything up front",
            "LazyColumn is only for text, Column is for anything else",
            "They're identical — LazyColumn is just a newer name",
            "Column can scroll automatically; LazyColumn cannot scroll at all",
          ],
          answer: 0,
          explain: "That's the whole point of the word \"lazy\": rows are composed on demand as they scroll into view, so a 1,000-walker list costs about the same as a 10-walker one.",
          nudge: "Which one would choke if you handed it a thousand items — and why?",
        },
        {
          type: "text",
          md: [
            "## Why `key` matters",
            "Look closely and `WalkersScreen.kt` calls `items(s.walkers) { walker -> … }` with **no key** — Compose falls back to using each item's position in the list as its identity. That's fine here because the walkers list is loaded once and never reordered underneath the user.",
            "But `WalkerScreen.kt`'s assigned-walks list writes `items(state.bookings, key = { it.id })` — an explicit key. Bookings *do* change shape while the screen is open: a walker taps **Accept**, and that booking's status flips from `pending` to `confirmed`, possibly reordering the list. Without a stable key, Compose can only compare \"the item that used to be at position 2\" to \"the item now at position 2\" — and if the list reordered, it may reuse the wrong row's internal state (scroll position, remembered UI) for the wrong booking.",
            "**The rule of thumb:** if a lazy list's items can be added, removed, or reordered while the screen is alive, pass `key = { it.id }` (or whatever uniquely identifies an item). If the list is loaded once and stays put, the default is harmless — but reaching for `key` out of habit costs nothing and saves you a subtle bug later.",
          ],
        },
        {
          type: "code",
          title: "ui/screens/WalkerScreen.kt — a keyed list",
          source: String.raw`else -> LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
    items(state.bookings, key = { it.id }) { b ->
        WalkCard(c, b, onTrack = { onTrack(b) }) { action -> viewModel.act(b.id, action) }
    }
}`,
          caption: "`it.id` is the booking's unique id from the backend — the same id used everywhere in `docs/API-CONTRACT.md`. `WalkCard` is the row; `viewModel.act(b.id, action)` posts an accept/decline/start/complete action for that one booking.",
        },
        {
          type: "quiz",
          q: "A walker accepts one booking out of five, which re-sorts the list by status. Which version handles that re-sort more safely — `items(bookings) { … }` or `items(bookings, key = { it.id }) { … }`?",
          choices: [
            "They behave identically either way",
            "The unkeyed version — keys only matter for LazyRow, not LazyColumn",
            "The keyed version — Compose tracks each row by booking id instead of by position, so state follows the right item",
            "Neither — LazyColumn always re-fetches from scratch on any change",
          ],
          answer: 2,
          explain: "A stable key tells Compose \"this row IS booking abc123,\" no matter where it lands after a reorder. Position-based identity (the default) can silently mix up per-row state when the order changes.",
          nudge: "What does the key actually give Compose that a list position can't?",
        },
        {
          type: "exercise",
          title: "Build a keyed pet list",
          prompt: [
            "Practice the shape on a fresh composable that lists a screen's pets.",
            "1. Inside `LazyColumn`, call `items` on `pets`, passing `key = { it.id }`.\n2. Name the closure parameter `pet` and return a `PetRow(pet = pet)` for each one.",
          ],
          starter: String.raw`@Composable
fun PetList(pets: List<Pet>) {
    LazyColumn {
        // your code here
    }
}`,
          solution: String.raw`@Composable
fun PetList(pets: List<Pet>) {
    LazyColumn {
        items(pets, key = { it.id }) { pet ->
            PetRow(pet = pet)
        }
    }
}`,
          checks: [
            { re: /items\(pets,key=\{it\.id\}\)\{pet->/, hint: "`items(pets, key = { it.id }) { pet -> … }` — the list, then a named `key`, then the trailing closure naming one element `pet`." },
            { re: /PetRow\(pet=pet\)/, hint: "Return one row per pet: `PetRow(pet = pet)`." },
          ],
          success: "Same shape LazyColumn uses everywhere in PawWalk: a keyed items() call turning a list into rows.",
        },
      ],
    },
    // ────────────────────────────────────────────────────────────
    {
      id: "navigation-compose",
      title: "Navigation Compose: Routes & the Back Stack",
      steps: [
        {
          type: "text",
          md: [
            "## The Android way to move between screens",
            "You've seen individual screens — `WalkersScreen`, `WalkerScreen`, `HomeScreen` — but nothing yet about *moving between them*. Android's standard answer is a library called **Navigation Compose**. Three pieces:",
            "- **`NavController`** — an object that remembers which screen is showing and the stack of screens behind it. You get one with `val navController = rememberNavController()`.\n- **`NavHost`** — a composable that owns a `NavController` and a map of **routes**: string ids ↦ which composable to show. `NavHost(navController, startDestination = \"walkers\") { composable(\"walkers\") { WalkersScreen(...) } }`.\n- **Routes** — plain strings, like `\"walkers\"` or `\"walker/{walkerId}\"`. Navigating is `navController.navigate(\"walker/w1\")`; going back is `navController.popBackStack()` (or the system Back button, which does the same thing automatically).",
            "This is the standard, most-taught way to navigate in a Compose app — and worth knowing well, because you'll meet it in almost every tutorial and most production codebases.",
          ],
        },
        {
          type: "code",
          title: "A NavHost, in general Compose form",
          source: String.raw`val navController = rememberNavController()

NavHost(navController, startDestination = "walkers") {
    composable("walkers") {
        WalkersScreen(onWalkerSelected = { walker ->
            navController.navigate("walker/${"$"}{walker.id}")
        })
    }
    composable("walker/{walkerId}") { backStackEntry ->
        val walkerId = backStackEntry.arguments?.getString("walkerId")
        WalkerDetailRoute(walkerId)
    }
}`,
          caption: "`\"walker/{walkerId}\"` is a route *template* — the `{walkerId}` segment is a placeholder that Navigation Compose fills in from whatever you pass to `navigate(\"walker/w1\")`, then hands back to you as an argument on the destination side.",
        },
        {
          type: "quiz",
          q: "In the route template `\"walker/{walkerId}\"`, what does `{walkerId}` mean?",
          choices: [
            "A literal path segment — the route only matches the exact string \"{walkerId}\"",
            "A placeholder argument — Navigation Compose fills it in from the value passed to navigate() and hands it back on the destination side",
            "A comment that Navigation Compose ignores",
            "The name of the composable function to call",
          ],
          answer: 1,
          explain: "Curly braces mark a route argument. navigate(\"walker/w1\") matches the template with walkerId = \"w1\", and the destination composable reads it back off the backStackEntry.",
          nudge: "What changes between navigate(\"walker/w1\") and navigate(\"walker/w2\")?",
        },
        {
          type: "text",
          md: [
            "## How PawWalk actually does it — and why",
            "Now the honest part: open `MainActivity.kt` and you will **not** find a `NavHost`. PawWalk's whole post-login flow is one hand-rolled `sealed interface Screen` plus Compose's `Crossfade`, switched on with a plain `when`. There's even a comment admitting the tradeoff, right there in the file:",
            "`// ponytail: state-based nav instead of Navigation Compose — one screen\n// stack is plenty for this flow, add a real nav graph if it grows.`",
            "That's a deliberate, size-appropriate choice, not a mistake: PawWalk's whole app is a handful of screens with no deep drill-down and no back-stack sharing across tabs, so a `var screen by remember { mutableStateOf<Screen>(Screen.Home) }` plus a `when` does the job in far less code than wiring up `NavHost` and route strings. Navigation Compose earns its keep once you have many destinations, deep links, or a back stack that needs to survive process death — none of which PawWalk needs yet. You now know **both** tools: the industry-standard one (Navigation Compose, above) and the pragmatic one PawWalk actually ships (next).",
          ],
        },
        {
          type: "code",
          title: "MainActivity.kt — the real navigation model",
          source: String.raw`private sealed interface Screen {
    data object Home : Screen
    data class Live(val dogName: String? = null) : Screen
    data object Walkers : Screen
    data class CreateBooking(val walker: Walker) : Screen
    data object Bookings : Screen
    data object Profile : Screen
    data object Pets : Screen
    data object Assistant : Screen
}`,
          caption: "A `sealed interface` (Module 03) lists every possible screen as a `data object` (no data) or `data class` (carries data — `CreateBooking` needs to know *which* walker). Read the type as \"one of these eight things, exhaustively, nothing else.\"",
        },
        {
          type: "code",
          title: "MainActivity.kt — switching on it",
          source: String.raw`var screen by remember { mutableStateOf<Screen>(Screen.Home) }
Crossfade(targetState = screen, label = "screen") { current ->
    when (current) {
        is Screen.Home -> HomeScreen(
            user = currentUser,
            onTrack = { dog -> screen = Screen.Live(dog) },
            onBook = { screen = Screen.Walkers },
        )
        is Screen.Walkers -> WalkersScreen(
            onWalkerSelected = { walker -> screen = Screen.CreateBooking(walker) },
        )
        // …the rest of the cases…
        else -> Unit
    }
}`,
          caption: "Trimmed for the lesson (see the real file for all eight cases). `remember { mutableStateOf(...) }` is Module 05's tool — `screen` is just state. `Crossfade` fades between whatever the state currently is, which is the entire animation budget this navigation model needs. \"Going back\" is nothing special: a screen's `onClose` just assigns `screen` back to wherever it came from.",
        },
        {
          type: "quiz",
          q: "In PawWalk's `Screen` model, how does `WalkersScreen` hand off to the booking screen with the tapped walker attached?",
          choices: [
            "It calls navController.navigate(\"booking/{walkerId}\")",
            "It sets screen = Screen.CreateBooking(walker) — the data class carries the walker directly, no string route needed",
            "It stores the walker in a global singleton",
            "It can't — PawWalk has no way to pass data between screens",
          ],
          answer: 1,
          explain: "Screen.CreateBooking(val walker: Walker) carries its payload as a typed Kotlin property, not a stringly-typed route argument. That's the one real advantage of the hand-rolled approach: no string parsing, the compiler checks it.",
          nudge: "Screen.CreateBooking is a data class with a `walker` property — what does assigning `screen = Screen.CreateBooking(walker)` do with that property?",
        },
        {
          type: "exercise",
          title: "Add a screen to the sealed interface",
          prompt: [
            "PawWalk is getting a new screen: a walker's public reviews. It needs to know which walker it's showing reviews for.",
            "Add a case named `Reviews` to the `Screen` interface below: a `data class` with one property, `walker`, of type `Walker`.",
          ],
          starter: String.raw`private sealed interface Screen {
    data object Home : Screen
    data class CreateBooking(val walker: Walker) : Screen
    // your code here
}`,
          solution: String.raw`private sealed interface Screen {
    data object Home : Screen
    data class CreateBooking(val walker: Walker) : Screen
    data class Reviews(val walker: Walker) : Screen
}`,
          checks: [
            { re: /data class Reviews\(val walker:Walker\):Screen/, hint: "Same shape as `CreateBooking`: `data class Reviews(val walker: Walker) : Screen`." },
          ],
          mustNot: [
            { re: /dataobjectReviews/, hint: "This screen needs to carry a `Walker` — that means `data class`, not `data object` (which carries nothing)." },
          ],
          success: "That's exactly how you'd extend PawWalk's real navigation model — one new case, and the compiler forces every `when` over Screen to handle it.",
        },
      ],
    },
    // ────────────────────────────────────────────────────────────
    {
      id: "walker-detail",
      title: "The Walker Screen: State, Actions & a Dialog",
      steps: [
        {
          type: "text",
          md: [
            "## One screen, two very different jobs",
            "`WalkerScreen.kt` is what a signed-in *walker* sees — completely different from the owner-facing `WalkersScreen` you studied in Lesson 1 (mind the near-identical names!). Where owners browse a list of walkers, a walker sees their own profile plus the bookings assigned to them, each with action buttons: **Accept**, **Decline**, **Start walk**, **Complete**.",
            "Its `WalkerViewModel` holds a small state shape, just like `WalkersViewModel`'s `UiState` from Module 05 — except this one bundles multiple pieces of data in a single `data class` rather than a sealed interface, because several of the fields (bookings, profile, loading, error) can all be meaningfully non-default at once.",
          ],
        },
        {
          type: "code",
          title: "ui/screens/WalkerScreen.kt — the state shape",
          source: String.raw`data class State(
    val bookings: List<Booking> = emptyList(),
    val profile: Walker? = null,
    val loading: Boolean = true,
    val error: String? = null,
)`,
          caption: "Every field has a default, so `State()` alone is a valid \"nothing loaded yet\" state. `profile` and `error` are nullable — either can simply not exist yet.",
        },
        {
          type: "text",
          md: [
            "## Reacting to a tap: `act()`",
            "Each booking's card shows different buttons depending on `booking.status` — a `when` maps status strings to a list of `(label, action)` pairs. Tapping one calls `viewModel.act(b.id, action)`, which posts the transition to the backend and reloads:",
          ],
        },
        {
          type: "code",
          title: "ui/screens/WalkerScreen.kt — WalkerViewModel.act",
          source: String.raw`fun act(id: String, action: String) {
    viewModelScope.launch { runCatching { BookingRepository.transition(id, action) }; load() }
}`,
          caption: "`runCatching { … }` (Module 03) swallows a failed transition rather than crashing the screen — either way, `load()` re-fetches so the UI reflects whatever the backend now says is true. That's simpler than tracking optimistic UI state by hand, at the cost of one extra network round trip.",
        },
        {
          type: "quiz",
          q: "Why does `act()` call `load()` again after `BookingRepository.transition(...)`, instead of just updating the tapped booking's status locally?",
          choices: [
            "Kotlin requires every ViewModel function to call load()",
            "It re-syncs the whole state from the backend — the source of truth — rather than guessing what changed locally, at the cost of one more request",
            "load() is required to dismiss the loading spinner",
            "transition() doesn't actually change anything on the server",
          ],
          answer: 1,
          explain: "Trusting the server's response over a hand-maintained local copy avoids the two ever disagreeing — simpler code, one extra request.",
          nudge: "What's the tradeoff between trusting the server's fresh answer versus editing local state by hand?",
        },
        {
          type: "text",
          md: [
            "## A dialog is just a composable with an on/off switch",
            "Tap **Edit** on your profile and an `AlertDialog` appears — Compose's built-in modal. Notice it's driven by the exact `remember { mutableStateOf(false) }` pattern from Module 05: `showEdit` is local UI state, flipped `true` by the Edit tap, and the dialog itself is only placed in the composition `if (showEdit)` is true.",
          ],
        },
        {
          type: "code",
          title: "ui/screens/WalkerScreen.kt — showing the dialog",
          source: String.raw`var showEdit by remember { mutableStateOf(false) }

// … "Edit" text has Modifier.clickable { showEdit = true } …

if (showEdit) {
    EditProfileDialog(state.profile, onDismiss = { showEdit = false }) { update ->
        viewModel.updateProfile(update); showEdit = false
    }
}`,
          caption: "`onDismiss` fires when the user taps outside the dialog or presses Back — Compose calls it for you. The trailing lambda (the third argument, `onSave`) is the Save button's callback: apply the update, then close.",
        },
        {
          type: "exercise",
          title: "Wire up a details dialog",
          prompt: [
            "Build the same on/off pattern for a \"walker details\" dialog.",
            "1. Declare `var showDetails` with `remember { mutableStateOf(false) }`, defaulting to `false`.\n2. Below it, add an `if (showDetails)` block that calls `WalkerDetailsDialog(onDismiss = { showDetails = false })`.",
          ],
          starter: String.raw`@Composable
fun ProfileSection() {
    // your code here (the state)

    // your code here (the conditional dialog)
}`,
          solution: String.raw`@Composable
fun ProfileSection() {
    var showDetails by remember { mutableStateOf(false) }

    if (showDetails) {
        WalkerDetailsDialog(onDismiss = { showDetails = false })
    }
}`,
          checks: [
            { re: /var showDetails by remember\{mutableStateOf\(false\)\}/, hint: "`var showDetails by remember { mutableStateOf(false) }` — the `by` delegate makes `showDetails` read like a plain Boolean." },
            { re: /if\(showDetails\)\{/, hint: "Guard the dialog with `if (showDetails) { … }` — it's only placed in the composition while true." },
            { re: /WalkerDetailsDialog\(onDismiss=\{showDetails=false\}\)/, hint: "Inside the block: `WalkerDetailsDialog(onDismiss = { showDetails = false })` — dismissing flips the flag back off." },
          ],
          success: "The exact shape EditProfileDialog uses: a Boolean flag, an if-guard, and an onDismiss that turns itself back off.",
        },
      ],
    },
    // ────────────────────────────────────────────────────────────
    {
      id: "tabs-and-scaffolding",
      title: "Tabs & Scaffolding: How Home Ties It Together",
      steps: [
        {
          type: "text",
          md: [
            "## The tab bar isn't a system component",
            "Unlike iOS's `TabView`, PawWalk's bottom tab bar in `HomeScreen.kt` isn't a built-in Compose or Material 3 component — it's hand-built from pieces you already know: a `Row`, a `RoundedCornerShape` background, and a `clickable` per tab. That's normal in Compose: when the built-in `NavigationBar` doesn't match a custom design (like PawWalk's pill-shaped, floating HUD bar), you compose your own from primitives.",
          ],
        },
        {
          type: "code",
          title: "ui/screens/HomeScreen.kt — HudTabBar",
          source: String.raw`@Composable
private fun HudTabBar(
    c: BrandColors, onTrack: () -> Unit, onBook: () -> Unit, onProfile: () -> Unit, modifier: Modifier = Modifier,
) {
    val on = c.onInverse
    Row(
        modifier.clip(RoundedCornerShape(50)).background(c.inverse).padding(6.dp),
        horizontalArrangement = Arrangement.spacedBy(2.dp)
    ) {
        Tab("Home", active = true) { HomeIcon(on, 15.dp) }
        Tab("Book", onClick = onBook) { CalendarIcon(on.copy(alpha = 0.6f), 15.dp) }
        Tab("Track", onClick = onTrack) { LocationArrowIcon(on.copy(alpha = 0.6f), 15.dp) }
        Tab("Profile", onClick = onProfile) { PawIcon(on.copy(alpha = 0.6f), 15.dp) }
    }
}`,
          caption: "`RoundedCornerShape(50)` on a `Row` this short makes a full pill/capsule shape. Each `Tab` takes a label, whether it's the active one, a click handler, and an `icon` composable — a parameter of *function type* that itself returns UI, so every tab can show a different icon.",
        },
        {
          type: "text",
          md: [
            "## `Tab`: a private helper with `RowScope` receiver",
            "One new shape in `Tab`'s signature: `private fun RowScope.Tab(...)`. Writing the receiver type (`RowScope`) before the function name makes `Tab` an **extension function** — it can only be called *inside* a `Row` (or another `RowScope`), and inside its body it gets access to `Row`-only modifiers like `.weight(1f)`, which makes all four tabs share the available width equally.",
          ],
        },
        {
          type: "code",
          title: "ui/screens/HomeScreen.kt — Tab",
          source: String.raw`@Composable
private fun RowScope.Tab(
    label: String, active: Boolean = false, onClick: () -> Unit = {}, icon: @Composable () -> Unit,
) {
    val c = Hud.colors
    val on = c.onInverse
    Column(
        Modifier.weight(1f).clip(RoundedCornerShape(50))
            .background(if (active) c.accent else Color.Transparent)
            .clickable { onClick() }.padding(vertical = 9.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        icon()
        Spacer(Modifier.height(3.dp))
        MonoText(label, if (active) on else on.copy(alpha = 0.6f), sizeSp = 8.5f, trackingEm = 0.08f)
    }
}`,
          caption: "`icon()` calls the passed-in composable right where the icon should render. The active tab gets `c.accent` as its background; every other tab is transparent — the whole \"which tab is selected\" visual comes from one Boolean.",
        },
        {
          type: "quiz",
          q: "Why is `Tab` declared as `private fun RowScope.Tab(...)` instead of a plain `private fun Tab(...)`?",
          choices: [
            "RowScope makes the function faster",
            "It's required syntax for any @Composable function",
            "It restricts Tab to being called inside a Row, and unlocks Row-only modifiers like .weight() inside its body",
            "It has no effect — RowScope is purely documentation",
          ],
          answer: 2,
          explain: "An extension function's receiver type both scopes where it can be called AND grants access to that scope's members — here, .weight(1f), which is what makes all four tabs share the row equally.",
          nudge: "What does Tab's body use that only makes sense inside a Row — and what does the RowScope receiver unlock?",
        },
        {
          type: "text",
          md: [
            "## HomeScreen wires the whole flow",
            "Zoom out to `HomeScreen` itself: it's a `Box` (Module 04) layering two things — a scrollable `Column` of content, and the tab bar pinned to the bottom with `Modifier.align(Alignment.BottomCenter)`. Every tab's `onClick` is a callback parameter (Module 05's \"events flow up\") that `HomeScreen` doesn't implement itself — it just forwards taps to whoever constructed it.",
            "That whoever is `MainActivity`, where those callbacks become `screen = Screen.Walkers`-style assignments — the sealed-interface navigation from Lesson 2. Trace it end to end: tap **Book** in the tab bar → `HudTabBar`'s `onBook` fires → `HomeScreen`'s `onBook` parameter fires → `MainActivity`'s `onBook = { screen = Screen.Walkers }` runs → `screen` changes → `Crossfade` swaps to `WalkersScreen`.",
          ],
        },
        {
          type: "code",
          title: "ui/screens/HomeScreen.kt — HomeScreen's signature and tab bar placement",
          source: String.raw`@Composable
fun HomeScreen(
    user: User?,
    onTrack: (dogName: String?) -> Unit,
    onBook: () -> Unit = {},
    onProfile: () -> Unit = {},
    onAssistant: () -> Unit = {},
    onViewBookings: () -> Unit = {},
    viewModel: HomeViewModel = viewModel(),
) {
    val c = Hud.colors
    val state by viewModel.state.collectAsState()
    Box(Modifier.fillMaxSize().background(c.canvas)) {
        Column(/* … scrolling content … */) { /* … */ }
        HudTabBar(
            c, { onTrack(state.upcoming?.booking?.dogName ?: state.pets.firstOrNull()?.name) },
            onBook, onProfile,
            Modifier.align(Alignment.BottomCenter).navigationBarsPadding().padding(16.dp)
        )
    }
}`,
          caption: "Five callback parameters, every one defaulted to a no-op `{}` (or `{ _ in }`-style default) — Module 05's \"opt-in callback\" pattern from the iOS course applies here too. `.navigationBarsPadding()` keeps the floating bar clear of the system's gesture bar at the bottom of the screen.",
        },
        {
          type: "exercise",
          title: "Add a fifth tab",
          prompt: [
            "PawWalk wants an Assistant tab in the bar, next to Profile.",
            "Inside `HudTabBar`'s `Row`, after the existing `Tab(\"Profile\", ...)` line, add one more: `Tab(\"Assistant\", onClick = onAssistant)` with a trailing lambda body of `{ ChatIcon(on.copy(alpha = 0.6f), 15.dp) }`.",
          ],
          starter: String.raw`Row(modifier, horizontalArrangement = Arrangement.spacedBy(2.dp)) {
    Tab("Home", active = true) { HomeIcon(on, 15.dp) }
    Tab("Profile", onClick = onProfile) { PawIcon(on.copy(alpha = 0.6f), 15.dp) }
    // your code here
}`,
          solution: String.raw`Row(modifier, horizontalArrangement = Arrangement.spacedBy(2.dp)) {
    Tab("Home", active = true) { HomeIcon(on, 15.dp) }
    Tab("Profile", onClick = onProfile) { PawIcon(on.copy(alpha = 0.6f), 15.dp) }
    Tab("Assistant", onClick = onAssistant) { ChatIcon(on.copy(alpha = 0.6f), 15.dp) }
}`,
          checks: [
            { re: /Tab\("Assistant",onClick=onAssistant\)\{/, hint: "Match the existing tabs' shape: `Tab(\"Assistant\", onClick = onAssistant) { … }`." },
            { re: /ChatIcon\(on\.copy\(alpha=0\.6f\),15\.dp\)/, hint: "Inside the trailing lambda: `ChatIcon(on.copy(alpha = 0.6f), 15.dp)` — same dimmed style as the other inactive tabs." },
          ],
          success: "That's the whole cost of a new tab: one Tab(...) call. The Row's weight(1f) modifiers mean all five now share the width automatically.",
        },
        {
          type: "xcode",
          label: "Over to Android Studio",
          title: "Trace a tap across three files",
          intro: ["Everything in this module is live in the app. Prove it end to end:"],
          items: [
            "Terminal tab 1: `cd apps/backend && uv run fastapi dev` — leave it running.",
            "In Android Studio, run the app on your Pixel emulator and sign in as a pet owner.",
            "On Home, tap the **Track** tab. Watch `screen` flip to `Screen.Live(...)` in `MainActivity.kt` and `Crossfade` swap in `LiveScreen`.",
            "Tap **Book**. That's `HudTabBar`'s onBook → `HomeScreen`'s onBook → `MainActivity`'s `screen = Screen.Walkers` → the `LazyColumn` of walkers from Lesson 1 appears.",
            "Tap a walker row. `WalkersScreen`'s `onWalkerSelected` fires, and `MainActivity` sets `screen = Screen.CreateBooking(walker)` — the walker travels as typed data, no route string involved.",
            "Log out and back in as a walker (or use a second account). Confirm you land on `WalkerScreen` instead — the keyed `LazyColumn` over assigned bookings from Lesson 3.",
          ],
        },
      ],
    },
  ],
});
