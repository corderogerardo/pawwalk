// Module 10 — Bookings & Forms. See ../lessons/FORMAT.md and
// ./FORMAT-KOTLIN.md for the schema and Kotlin-specific traps.
window.COURSE = window.COURSE || [];
window.COURSE.push({
  id: "bookings-android",
  title: "Bookings & Forms",
  emoji: "📅",
  lang: "kotlin",
  lessons: [
    // ────────────────────────────────────────────────────────────────────
    {
      id: "the-booking-form",
      title: "The Booking Form",
      steps: [
        {
          type: "text",
          md: [
            "## From tap to walk",
            "Everything you've built so far pays off here. Tap a walker on `WalkersScreen`, and PawWalk opens `CreateBookingScreen` — a form with a pet picker, a duration choice, a start-time nudge, and a Confirm button that POSTs the whole thing to the backend. This module rebuilds that form and the loop it kicks off.",
            "The screen takes a `Walker` and two callbacks: `onClose` (the back arrow) and `onBooked` (fired once the booking exists on the server). It doesn't know or care *who* opened it — same \"events flow up, state flows down\" shape you used for `WalkerScreen` in Module 9.",
          ],
        },
        {
          type: "code",
          title: "ui/screens/CreateBookingScreen.kt (signature + pet picker)",
          source: String.raw`@Composable
fun CreateBookingScreen(
    walker: Walker,
    onClose: () -> Unit,
    onBooked: () -> Unit,
    viewModel: CreateBookingViewModel = androidx.lifecycle.viewmodel.compose.viewModel(),
) {
    var dogName by remember { mutableStateOf("") }
    var pets by remember { mutableStateOf<List<Pet>>(emptyList()) }
    var duration by remember { mutableStateOf(30) }
    var hoursFromNow by remember { mutableStateOf(2) }
    var validationError by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        pets = runCatching { PetRepository.list() }.getOrDefault(emptyList())
        if (dogName.isBlank()) pets.firstOrNull()?.let { dogName = it.name }
    }
    // …form UI below
}`,
          caption: "Five remember { mutableStateOf(...) } fields — every editable field on the screen has its own slice of state, straight out of Module 5.",
        },
        {
          type: "text",
          md: [
            "### `LaunchedEffect(Unit)` — a `.task` you already know",
            "You met `LaunchedEffect` in Module 9 for network loads; here it fetches the owner's saved pets *once*, when the screen first appears (`Unit` never changes, so it never restarts). `runCatching { … }.getOrDefault(emptyList())` is one line doing what a `try`/`catch` would do in three: attempt the call, and if it throws, fall back to an empty list instead of crashing the screen.",
            "That empty-list fallback isn't just error handling — it's a feature. Look at the form below: `if (pets.isEmpty())` swaps between a free-text field and a row of pet chips. A brand-new owner with no saved pets still types a name by hand; a returning owner taps Mochi. Same form, two experiences, driven by one `if`.",
          ],
        },
        {
          type: "code",
          title: "ui/screens/CreateBookingScreen.kt (pet picker excerpt)",
          source: String.raw`if (pets.isEmpty()) {
    OutlinedTextField(
        value = dogName,
        onValueChange = { dogName = it },
        singleLine = true,
    )
} else {
    Row {
        pets.forEach { pet ->
            val selected = pet.name == dogName
            Row(
                Modifier
                    .clickable { dogName = pet.name }
            ) {
                DmText(pet.name, if (selected) c.onInverse else c.ink)
            }
        }
    }
}`,
          caption: "Trimmed for focus — the real file adds shape, color, and spacing modifiers to each chip.",
        },
        {
          type: "quiz",
          q: "Why does `CreateBookingScreen` fall back to an empty pet list instead of showing an error when `PetRepository.list()` fails?",
          choices: [
            "Because `runCatching` always returns an empty list no matter what",
            "So the form degrades gracefully to a free-text field instead of blocking the booking entirely",
            "Because pets are optional in the API contract",
            "It doesn't — a failed fetch crashes the screen",
          ],
          answer: 1,
          explain: "`runCatching { … }.getOrDefault(emptyList())` turns any thrown exception into an empty list. With no pets loaded, `pets.isEmpty()` is true, and the form shows the plain text field — booking still works.",
          nudge: "Look at what happens to the screen when `pets` stays `emptyList()` — is that a dead end or a fallback?",
        },
        {
          type: "text",
          md: [
            "### Duration chips and the `+`/`−` start time",
            "Duration is a `Row` of three chips — 30, 45, 60 — over a hardcoded `DURATIONS` list; tapping one sets `duration = mins`. Same selected/unselected coloring pattern as the pet chips, just a different backing list.",
            "Start time skips a full date-and-time picker on purpose — the file's doc comment says so directly: *\"kept simple — pick an hour later today — rather than pulling in a date/time picker dependency for one field.\"* `hoursFromNow` is just an `Int`, nudged by `+`/`−` buttons, and `remember(hoursFromNow) { Instant.now().plusSeconds(hoursFromNow * 3600L) }` recomputes the actual `Instant` whenever it changes. That's `remember` with a **key** — Module 5 showed `remember` with no arguments (compute once, keep forever); passing `hoursFromNow` here means *recompute whenever this key changes*, not on every recomposition.",
          ],
        },
        {
          type: "exercise",
          title: "Guard against a minus past zero",
          prompt: [
            "The `−` button under Start time should stop decrementing once `hoursFromNow` reaches 1 — nobody can book a walk zero hours from now and land in the past. Add the missing `enabled` condition to the modifier below.",
            "Use `Modifier.clickable(enabled = ..., onClick ...)` — the click only fires when `enabled` is true.",
          ],
          starter: String.raw`MonoText(
    "−", c.ink.copy(alpha = 0.6f),
    modifier = Modifier.clickable(/* your code here */) { hoursFromNow-- }
)`,
          solution: String.raw`MonoText(
    "−", c.ink.copy(alpha = 0.6f),
    modifier = Modifier.clickable(enabled = hoursFromNow > 1) { hoursFromNow-- }
)`,
          checks: [
            { re: /clickable\(enabled=hoursFromNow>1\)/, hint: "The condition is `enabled = hoursFromNow > 1` — only allow the decrement while there's room above 1." },
            { re: /\{hoursFromNow--\}/, hint: "Keep the trailing lambda `{ hoursFromNow-- }` as the click action." },
          ],
          success: "That's the exact guard from CreateBookingScreen.kt. A disabled clickable is the Compose way to grey out a control — no separate 'enabled' visual state to manage by hand.",
        },
      ],
    },
    // ────────────────────────────────────────────────────────────────────
    {
      id: "validate-then-post",
      title: "Validate, then POST",
      steps: [
        {
          type: "text",
          md: [
            "## What Confirm booking actually does",
            "The Confirm button calls a local `submit()` function, not the view model directly. `submit()` has one job before it ever touches the network: **validate client-side first**, so a bad input never becomes a wasted round trip.",
          ],
        },
        {
          type: "code",
          title: "ui/screens/CreateBookingScreen.kt (submit)",
          source: String.raw`fun submit() {
    validationError = if (dogName.isBlank()) "Enter your dog's name" else null
    if (validationError != null) return
    viewModel.book(walker.id, dogName.trim(), startTime.toString(), duration)
}`,
          caption: "One check today: a blank dog name. dogName.trim() strips whitespace before it's sent — same discipline as the iOS course's trimmingCharacters.",
        },
        {
          type: "text",
          md: [
            "### `dogName.isBlank()` vs `dogName.isEmpty()`",
            "Kotlin's `String` has both. `isEmpty()` is true only for `\"\"` — zero characters. `isBlank()` is true for `\"\"` **and** for a string made entirely of whitespace, like `\"   \"`. A dog \"named\" three spaces would pass `isEmpty()` but correctly fails `isBlank()` — that's why the form checks `isBlank()`, exactly like the iOS form trims before checking `isEmpty` for the same reason, just one Kotlin function instead of two Swift steps.",
            "If validation fails, `submit()` returns immediately — no network call, no view model touched. Only a validated request reaches `viewModel.book(...)`, which hands off to the repository:",
          ],
        },
        {
          type: "code",
          title: "ui/screens/CreateBookingViewModel.kt",
          source: String.raw`class CreateBookingViewModel : ViewModel() {

    sealed interface UiState {
        data object Idle : UiState
        data object Loading : UiState
        data class Success(val booking: Booking) : UiState
        data class Error(val message: String) : UiState
    }

    private val _state = MutableStateFlow<UiState>(UiState.Idle)
    val state: StateFlow<UiState> = _state.asStateFlow()

    fun book(walkerId: String, dogName: String, startTime: String, durationMinutes: Int) {
        viewModelScope.launch {
            _state.value = UiState.Loading
            _state.value = try {
                val booking = BookingRepository.createBooking(
                    CreateBookingRequest(walkerId, dogName, startTime, durationMinutes)
                )
                UiState.Success(booking)
            } catch (e: Exception) {
                UiState.Error(e.message ?: "Couldn't create booking")
            }
        }
    }
}`,
          caption: "The whole file. Four UiState cases, one function — the same StateFlow shape every ViewModel in this course has used since Module 5.",
        },
        {
          type: "text",
          md: [
            "### Cents math the server owns — not the client",
            "Notice what's missing from `CreateBookingRequest`: a price. The client sends `walkerId`, `dogName`, `startTime`, `durationMinutes` — never a total. `BookingRepository.createBooking` just forwards the request to Retrofit; the *server* multiplies the walker's `pricePer30MinCents` by the chosen duration and writes `priceCents` onto the `Booking` it hands back. The client only ever *displays* cents math (`priceCents / 100.0` — Module 1), it never *computes* the number that determines what gets charged. Never trust the device the user controls with the money math.",
            "When the request succeeds, `state` becomes `UiState.Success(booking)` — and back in the screen, a `LaunchedEffect(state)` watches for exactly that case and calls `onBooked()`, closing the loop back to whoever presented this screen.",
          ],
        },
        {
          type: "quiz",
          q: "Where does the final `priceCents` on a new booking get computed?",
          choices: [
            "In `CreateBookingScreen`, from `duration` and the walker's price",
            "In `CreateBookingViewModel.book`, before sending the request",
            "On the backend server, from the walker's rate and the requested duration",
            "It's hardcoded to the walker's 30-minute price regardless of duration",
          ],
          answer: 2,
          explain: "`CreateBookingRequest` never carries a price field — only walkerId, dogName, startTime, and durationMinutes. The server computes priceCents and returns it on the Booking. The client that requests a walk is never the client trusted to price it.",
          nudge: "Look at what fields `CreateBookingRequest` actually has — is a price one of them?",
        },
        {
          type: "exercise",
          title: "Rebuild the happy/sad split",
          prompt: [
            "`book()` lost its try/catch. Rebuild the body of the `viewModelScope.launch` block: set `_state.value` to `UiState.Loading`, then assign the result of a `try`/`catch` to `_state.value` — on success wrap the booking from `BookingRepository.createBooking(...)` in `UiState.Success`, on failure wrap `e.message ?: \"Couldn't create booking\"` in `UiState.Error`.",
          ],
          starter: String.raw`fun book(walkerId: String, dogName: String, startTime: String, durationMinutes: Int) {
    viewModelScope.launch {
        // your code here
    }
}`,
          solution: String.raw`fun book(walkerId: String, dogName: String, startTime: String, durationMinutes: Int) {
    viewModelScope.launch {
        _state.value = UiState.Loading
        _state.value = try {
            val booking = BookingRepository.createBooking(
                CreateBookingRequest(walkerId, dogName, startTime, durationMinutes)
            )
            UiState.Success(booking)
        } catch (e: Exception) {
            UiState.Error(e.message ?: "Couldn't create booking")
        }
    }
}`,
          checks: [
            { re: /_state\.value=UiState\.Loading/, hint: "First line: flip the state to `_state.value = UiState.Loading` before the network call starts." },
            { re: /_state\.value=try\{/, hint: "Assign the whole try/catch expression to `_state.value` — a `try` block in Kotlin evaluates to a value." },
            { re: /UiState\.Success\(booking\)/, hint: "On success, wrap the created booking: `UiState.Success(booking)`." },
            { re: /catch\(e:Exception\)\{UiState\.Error\(e\.message\?:"Couldn't create booking"\)\}/, hint: "On failure: `catch (e: Exception) { UiState.Error(e.message ?: \"Couldn't create booking\") }`." },
          ],
          success: "That's the real book() function. Loading, then a try/catch that resolves to exactly one of two states — the same shape you'll see in every ViewModel that talks to the network.",
        },
      ],
    },
    // ────────────────────────────────────────────────────────────────────
    {
      id: "your-bookings",
      title: "Your Bookings",
      steps: [
        {
          type: "text",
          md: [
            "## A list, a status pill, and a bug that got fixed here",
            "`BookingsScreen` is Module 9's `LazyColumn` pattern again: a `when` over a `UiState` (Loading / Success / Error), and inside Success a `LazyColumn` keyed by `booking.id`. Nothing new in the list mechanics — the new part is what each row shows and does.",
          ],
        },
        {
          type: "code",
          title: "ui/screens/BookingsViewModel.kt",
          source: String.raw`class BookingsViewModel : ViewModel() {

    sealed interface UiState {
        data object Loading : UiState
        data class Success(val bookings: List<Booking>) : UiState
        data class Error(val message: String) : UiState
    }

    private val _state = MutableStateFlow<UiState>(UiState.Loading)
    val state: StateFlow<UiState> = _state.asStateFlow()

    init { load() }

    fun load() {
        viewModelScope.launch {
            _state.value = UiState.Loading
            _state.value = try {
                UiState.Success(BookingRepository.fetchBookings())
            } catch (e: Exception) {
                UiState.Error(e.message ?: "Something went wrong")
            }
        }
    }

    fun cancel(bookingId: String) {
        viewModelScope.launch {
            try {
                BookingRepository.cancelBooking(bookingId)
                load()
            } catch (e: Exception) {
                _state.value = UiState.Error(e.message ?: "Couldn't cancel booking")
            }
        }
    }
}`,
          caption: "init { load() } — the view model fetches the moment it's created, so the screen never shows a blank frame before the first load kicks off.",
        },
        {
          type: "text",
          md: [
            "### `cancel()` re-fetches instead of patching one row",
            "Compare `cancel()` to what you might expect: it doesn't find the cancelled booking in the list and flip its status locally. It calls `BookingRepository.cancelBooking(bookingId)` on the server, then just calls `load()` again — the whole list, fresh from the source of truth. With a handful of bookings, re-fetching is simpler and can't drift out of sync with the server. No index bookkeeping, no partial updates to get wrong.",
            "### The bug: what counts as *cancellable*, and what counts as *upcoming*",
            "Each row only shows a Cancel button for bookings the owner can actually still back out of:",
          ],
        },
        {
          type: "code",
          title: "ui/screens/BookingsScreen.kt (BookingCard excerpt)",
          source: String.raw`@Composable
private fun BookingCard(c: BrandColors, booking: Booking, onCancel: () -> Unit) {
    val cancellable = booking.status == "pending" || booking.status == "confirmed"
    // …
}`,
          caption: "Cancellable: pending or confirmed only. Once a walk is in_progress, completed, or already cancelled, the button never renders — same idea as the iOS canCancel.",
        },
        {
          type: "text",
          md: [
            "That `cancellable` check is local to the bookings list. A related — and easy to get wrong — question lives elsewhere: **which bookings count as \"upcoming\"?** Home's \"Next walk\" card and the live-tracking screen both need to pick *one* booking out of the list to feature. The first version of this code picked any booking whose status wasn't `cancelled` — which meant a booking that had already run to `completed` could still get picked as the \"next\" walk, or auto-selected for live tracking, because `completed != cancelled` too.",
            "The fix: add a shared `isActive` property to the `Booking` model itself, with an explicit allowlist instead of a denylist — `pending`, `confirmed`, or `in_progress` count as active; everything else (`completed`, `cancelled`) doesn't. One property, defined once, used everywhere a screen needs to ask \"is this walk still coming up or happening now?\"",
          ],
        },
        {
          type: "code",
          title: "data/Models.kt (Booking, excerpt)",
          source: String.raw`data class Booking(
    val id: String,
    @SerialName("walker_id") val walkerId: String,
    @SerialName("dog_name") val dogName: String,
    @SerialName("start_time") val startTime: String,
    @SerialName("duration_minutes") val durationMinutes: Int,
    val status: String,
    @SerialName("price_cents") val priceCents: Int,
    @SerialName("created_at") val createdAt: String,
) {
    /** Walk hasn't happened yet or is happening now (excludes completed and cancelled). */
    val isActive: Boolean get() = status == "pending" || status == "confirmed" || status == "in_progress"
}`,
          caption: "A computed property, not a stored field — isActive is recalculated from status every time it's read, so it can never go stale.",
        },
        {
          type: "quiz",
          q: "Why did the old `status != \"cancelled\"` check pick the wrong booking for Home's \"Next walk\" card?",
          choices: [
            "It threw an exception on completed bookings",
            "`completed` also satisfies `status != \"cancelled\"`, so a walk that already finished could still be treated as upcoming",
            "It only checked the first booking in the list, ignoring the rest",
            "`cancelled` bookings were being shown as upcoming instead",
          ],
          answer: 1,
          explain: "A denylist (\"not cancelled\") is true for completed, in_progress, confirmed, and pending alike — completed walks slipped through. The fix switched to an allowlist: isActive is true only for pending, confirmed, or in_progress.",
          nudge: "`status != \"cancelled\"` is true for every status except one. Which other status shouldn't count as 'upcoming', but still passes that check?",
        },
        {
          type: "exercise",
          title: "Write isActive",
          prompt: [
            "Add the `isActive` computed property to `Booking`, matching the real one in `Models.kt`: `true` when `status` is `\"pending\"`, `\"confirmed\"`, or `\"in_progress\"` — `false` for anything else (`completed`, `cancelled`).",
          ],
          starter: String.raw`data class Booking(
    val id: String,
    val status: String,
    // …other fields omitted
) {
    // your code here
}`,
          solution: String.raw`data class Booking(
    val id: String,
    val status: String,
    // …other fields omitted
) {
    val isActive: Boolean get() = status == "pending" || status == "confirmed" || status == "in_progress"
}`,
          checks: [
            { re: /val isActive:Boolean get\(\)=/, hint: "Declare it as `val isActive: Boolean get() = …` — a computed property, not a function." },
            { re: /status=="pending"/, hint: "First allowed status: `status == \"pending\"`." },
            { re: /status=="confirmed"/, hint: "Second allowed status, joined with `||`: `status == \"confirmed\"`." },
            { re: /status=="in_progress"/, hint: "Third allowed status: `status == \"in_progress\"` — the underscore matters, it must match the backend's exact string." },
          ],
          mustNot: [
            { re: /status!="cancelled"/, hint: "That's the old, buggy denylist — it lets `completed` through too. Write the allowlist instead: three `==` checks joined by `||`." },
          ],
          success: "You just rebuilt the real bug fix — an allowlist beats a denylist whenever 'not one bad value' isn't the same as 'one specific good value'.",
        },
      ],
    },
    // ────────────────────────────────────────────────────────────────────
    {
      id: "paying-for-a-walk",
      title: "Paying for a Walk",
      steps: [
        {
          type: "text",
          md: [
            "## Status pills and the shape of the payment flow",
            "One more thing worth reading before this module ends: how a booking's `status` string becomes color on screen, and where money actually changes hands.",
          ],
        },
        {
          type: "code",
          title: "ui/screens/BookingsScreen.kt (StatusPill)",
          source: String.raw`@Composable
private fun StatusPill(c: BrandColors, status: String) {
    val color = when (status) {
        "completed" -> c.signalGreen
        "cancelled" -> Color(0xFFC0392B)
        "in_progress" -> c.pinBlue
        else -> c.accent
    }
    Row(
        Modifier.clip(RoundedCornerShape(50)).background(color.copy(alpha = 0.16f))
    ) {
        MonoText(status.replace('_', ' '), color, sizeSp = 8.5f, trackingEm = 0.08f)
    }
}`,
          caption: "when's else branch covers both pending and confirmed with one accent color — only three statuses earn a distinct color.",
        },
        {
          type: "text",
          md: [
            "### `status.replace('_', ' ')`",
            "One line of real string polish: the raw status from the server is `\"in_progress\"` — a fine identifier, an ugly label. `.replace('_', ' ')` swaps every underscore for a space before the text ever reaches the screen, so the pill reads *in progress* instead of *in_progress*. Small, but it's the difference between code-shaped text and human-shaped text.",
            "### Where does the money actually move?",
            "Booking a walk creates it as `pending` — no charge yet. According to `docs/API-CONTRACT.md`, paying happens through a separate endpoint: `POST /payments/intent`, which returns a Stripe `client_secret` (or an offline stub if Stripe isn't configured on the backend — same response shape either way, so the client code never needs to know which mode it's in). On a real device, that `client_secret` is where Stripe's **PaymentSheet** would slot in: hand it the secret, PaymentSheet renders Stripe's own card-entry UI, and a webhook on the backend (`POST /payments/webhook`) flips the booking to `confirmed` once Stripe confirms the charge succeeded.",
            "That means PawWalk's booking flow and its payment flow are two separate server calls, on purpose — you can have a `pending` booking sitting unpaid, and the payment step is what would eventually push it forward. This course builds the booking half in full; the PaymentSheet integration itself is a stretch goal for later, once the rest of the app is second nature.",
          ],
        },
        {
          type: "quiz",
          q: "In the real API contract, what confirms a booking after payment succeeds?",
          choices: [
            "The Android app sets status to confirmed itself, right after PaymentSheet closes",
            "A Stripe webhook hits the backend (`POST /payments/webhook`), and the server flips the booking to confirmed",
            "The walker manually confirms it in their app",
            "Bookings are confirmed at creation time, before any payment",
          ],
          answer: 1,
          explain: "The client never marks its own payment as successful — that would mean trusting the device again, the same mistake price math would be. Stripe calls the backend's webhook directly; only then does the server flip the booking's status.",
          nudge: "Think back to the isActive lesson: who's allowed to be the source of truth for anything money-related — the phone, or the server?",
        },
        {
          type: "exercise",
          title: "Format a status for display",
          prompt: [
            "Write a one-line function `displayStatus` that takes a raw booking `status` string and returns it with underscores replaced by spaces — matching what `StatusPill` does to its label before showing it.",
          ],
          starter: String.raw`fun displayStatus(status: String): String {
    // your code here
}`,
          solution: String.raw`fun displayStatus(status: String): String {
    return status.replace('_', ' ')
}`,
          checks: [
            { re: /return status\.replace\('_',''\)/, hint: "Return `status.replace('_', ' ')` — single-quoted chars for both the underscore and the space, same as StatusPill." },
          ],
          mustNot: [
            { re: /replace\("_","/, hint: "Use single-quote `Char` literals (`'_'`, `' '`), not double-quoted strings — that's what the real StatusPill code uses." },
          ],
          success: "\"in_progress\" becomes \"in progress\" — one call, real polish. Small readability wins like this are worth the one extra line.",
        },
      ],
    },
  ],
});
