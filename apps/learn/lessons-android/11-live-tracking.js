// Module 11 — Live Walk Tracking (Android track). See ../lessons/FORMAT.md and
// ./FORMAT-KOTLIN.md for the schema and Kotlin-specific traps.
window.COURSE = window.COURSE || [];
window.COURSE.push({
  id: "live-tracking-android",
  title: "Live Walk Tracking",
  emoji: "📍",
  lang: "kotlin",
  lessons: [
    // ────────────────────────────────────────────────────────────────────
    {
      id: "the-live-screen",
      title: "The Live Screen",
      steps: [
        {
          type: "text",
          md: [
            "## Watching a walk happen",
            "Every screen so far has been *ask once, show once*: load the walkers, load a booking, done. Live tracking is different — while a walk is in progress, the walker's phone keeps producing new GPS points, and the owner's phone should show each dot **the moment it lands**, not a beat later.",
            "`ui/screens/LiveScreen.kt` is that screen: a full-bleed `Canvas` drawing the route the walker has taken, with a HUD of stats (Elapsed, Distance, Pace) floating on top. It's the same product you saw on the iOS track — same idea, same backend, a Kotlin file instead of a Swift one.",
            "This module takes `LiveScreen.kt` and its `LiveViewModel.kt` apart piece by piece: how fixes arrive over the network, how a location is *published* from the walker's phone, how the route gets drawn without an actual map, and how Android asks permission to use the GPS at all.",
          ],
        },
        {
          type: "code",
          title: "ui/screens/LiveViewModel.kt (the shell)",
          source: String.raw`class LiveViewModel(app: Application) : AndroidViewModel(app) {
    data class Fix(val lat: Double, val lng: Double)
    enum class Phase { CONNECTING, TRACKING, NO_BOOKING, DENIED, FAILED }
    data class State(
        val phase: Phase = Phase.CONNECTING,
        val fixes: List<Fix> = emptyList(),
        val startedAtMs: Long? = null,
    )

    private val _state = MutableStateFlow(State())
    val state: StateFlow<State> = _state.asStateFlow()
}`,
          caption: "The same private-MutableStateFlow / public-StateFlow shape every view model in this course has used since Module 6. A Fix is one GPS point; Phase names every state the screen can be in — no booking, waiting on GPS, streaming, permission denied, or the socket died.",
        },
        {
          type: "text",
          md: [
            "## Reading the screen's state",
            "`LiveScreen` is a thin consumer of that `State`: it collects it, and switches its HUD text on `phase`. No network code, no location code — all of that lives in the view model, exactly the split you learned in Module 6 (state lives in the view model; composables only *read* it).",
            "Two small helpers turn raw numbers into HUD text — `elapsedLabel` formats seconds as `07:42`, and `distanceLabel` picks metres or kilometres depending on how far the walk has gone.",
          ],
        },
        {
          type: "code",
          title: "ui/screens/LiveScreen.kt — distanceLabel",
          source: String.raw`private fun distanceLabel(fixes: List<LiveViewModel.Fix>): String {
    val m = LiveViewModel.distanceMeters(fixes)
    return if (m < 1000) "${"$"}{m.toInt()} m" else "%.2f km".format(m / 1000)
}`,
          caption: "Under 1000 metres, show whole metres. Past that, switch to kilometres with two decimal places via Kotlin's `String.format`-style `.format(...)` extension — the same C-style `%.2f` you'd use in Swift's `String(format:)`.",
        },
        {
          type: "quiz",
          q: "`distanceLabel` calls `LiveViewModel.distanceMeters(fixes)` — a function attached to the *companion object*, not an instance. Why put it there instead of as a normal method on the view model?",
          choices: [
            "Companion object functions run faster than instance methods",
            "It's pure math over a `List<Fix>` with no dependency on the view model's own state — a `companion object` function is Kotlin's way to expose something call-able without an instance, like Swift's `static func`",
            "Kotlin requires all math functions to live in a companion object",
            "It's a typo — it should be a regular method",
          ],
          answer: 1,
          explain: "distanceMeters only needs the list of fixes you hand it — it doesn't read or write anything on `this`. Making it a companion-object function documents that: you can call `LiveViewModel.distanceMeters(someList)` from a preview or a test with no view model instance at all.",
          nudge: "Does `distanceMeters` read `_state` or any other property of the view model? What does that tell you about whether it needs an instance?",
        },
        {
          type: "exercise",
          title: "Format the elapsed time",
          prompt: [
            "Rebuild `elapsedLabel` from `LiveScreen.kt`. Given `startedAtMs` (nullable) and `nowMs`:",
            "1. If `startedAtMs` is `null`, return `\"00:00\"` immediately.\n2. Otherwise compute whole seconds elapsed: `(nowMs - startedAtMs) / 1000`, and clamp it to never go negative with `.coerceAtLeast(0)`.\n3. Return it formatted as minutes:seconds, each zero-padded to 2 digits, using `\"%02d:%02d\".format(s / 60, s % 60)`.",
          ],
          starter: String.raw`private fun elapsedLabel(startedAtMs: Long?, nowMs: Long): String {
    // your code here
}`,
          solution: String.raw`private fun elapsedLabel(startedAtMs: Long?, nowMs: Long): String {
    if (startedAtMs == null) return "00:00"
    val s = ((nowMs - startedAtMs) / 1000).coerceAtLeast(0)
    return "%02d:%02d".format(s / 60, s % 60)
}`,
          checks: [
            { re: /if\(startedAtMs==null\)return"00:00"/, hint: "Guard the null case first: `if (startedAtMs == null) return \"00:00\"`." },
            { re: /coerceAtLeast\(0\)/, hint: "Clamp the elapsed seconds with `.coerceAtLeast(0)` — clock skew could otherwise produce a negative value." },
            { re: /"%02d:%02d"\.format\(s\/60,s%60\)/, hint: "Format with `\"%02d:%02d\".format(s / 60, s % 60)` — minutes first, then seconds, both zero-padded." },
          ],
          mustNot: [
            { re: /String\.format/, hint: "Kotlin strings have their own `.format(...)` extension — you don't need Java's `String.format(...)` here." },
          ],
          success: "That's the exact clock the HUD's Elapsed readout runs on, ticking once a second.",
        },
      ],
    },
    // ────────────────────────────────────────────────────────────────────
    {
      id: "sockets-and-location",
      title: "Sockets & Location: Fixes In, Fixes Out",
      steps: [
        {
          type: "text",
          md: [
            "## One socket per booking",
            "`connect(bookingId)` runs in `viewModelScope.launch` (Module 3's coroutine-launching pattern). It resolves *which* booking to track — the one it's given, or the caller's most recent active booking — then reads the bearer token from `TokenStore` (Module 8) and opens a WebSocket.",
            "A WebSocket is a connection that, once opened, stays open: either side can send a message at any time, instead of the request-reply-done shape every other screen in this app uses. PawWalk opens one WebSocket per booking — the walker's phone *sends* GPS fixes up the wire, and every phone watching that booking *receives* them.",
          ],
        },
        {
          type: "code",
          title: "ui/screens/LiveViewModel.kt — openSocket",
          source: String.raw`private fun openSocket(bookingId: String, token: String) {
    val base = BuildConfig.API_BASE_URL.trimEnd('/')
    val wsBase = base.replaceFirst("https://", "wss://").replaceFirst("http://", "ws://")
    val url = "${"$"}wsBase/ws/track/${"$"}bookingId?token=${"$"}token"
    val request = Request.Builder().url(url).build()
    socket = OkHttpClient().newWebSocket(request, object : WebSocketListener() {
        override fun onMessage(webSocket: WebSocket, text: String) = handleFrame(text)
        override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
            _state.update { if (it.phase == Phase.NO_BOOKING) it else it.copy(phase = Phase.FAILED) }
        }
    })
}`,
          caption: "http/https becomes ws/wss the same way on Android as anywhere else — WebSockets have their own URL schemes, and swapping the prefix preserves whether the connection is encrypted. The token rides along as a query param because a raw WebSocket handshake from a native client can't set an Authorization header.",
        },
        {
          type: "quiz",
          q: "Why does the URL carry the token as `?token=$token` instead of an `Authorization: Bearer …` header, the way every other PawWalk request does (Module 8)?",
          choices: [
            "It's less secure but faster to type",
            "WebSockets don't support headers at all",
            "The initial WebSocket handshake from a native client can't set a custom header, so the token has to ride in the URL as a query parameter instead",
            "The backend only accepts tokens in query params, never headers",
          ],
          answer: 2,
          explain: "Every other endpoint in this app attaches the token via the OkHttp interceptor from Module 8, which sets a real header. A WebSocket's opening handshake doesn't give native clients that option, so the query string is the accepted workaround — the backend reads `?token=` specifically for this one endpoint.",
          nudge: "Re-read the API contract's note about `?token=` — what kind of client is it calling out as unable to set a header here?",
        },
        {
          type: "exercise",
          title: "Build the WebSocket URL",
          prompt: [
            "`wsBase` is already rewritten to `ws`/`wss` above the marker. Finish `openSocket` by building the `url` line, where the marker is:",
            "Build the `url` string by gluing together, in order: `wsBase`, then `/ws/track/`, then `bookingId`, then `?token=`, then `token` — all via `$name` string templates in one double-quoted string.",
          ],
          starter: String.raw`private fun openSocket(bookingId: String, token: String, wsBase: String) {
    // your code here: url
    val request = Request.Builder().url(url).build()
}`,
          solution: String.raw`private fun openSocket(bookingId: String, token: String, wsBase: String) {
    val url = "${"$"}wsBase/ws/track/${"$"}bookingId?token=${"$"}token"
    val request = Request.Builder().url(url).build()
}`,
          checks: [
            { re: /val url="\$wsBase\/ws\/track\/\$bookingId\?token=\$token"/, hint: "Build the url with `$name` templates: `\"$wsBase/ws/track/$bookingId?token=$token\"` — no braces needed, these are simple names." },
          ],
          mustNot: [
            { re: /wsBase\+/, hint: "Use a single string template, not `+` concatenation, to glue the pieces together." },
          ],
          success: "That's the exact url line shipping in LiveViewModel.kt — one socket per booking, token attached.",
        },
        {
          type: "text",
          md: [
            "## The other direction: publishing a fix",
            "Lesson so far was fixes flowing *in*. On the walker's phone, fixes also flow *out*: Android's location APIs hand `LiveViewModel` a new `Location` object, and `publish(lat, lng)` sends it up the same socket as a tiny hand-written JSON string.",
            "For a three-field message, building JSON by hand with a Kotlin **triple-quoted string** (`\"\"\"…\"\"\"`) beats a whole `@Serializable` data class — the same call the iOS course made with `JSONSerialization` for one-off payloads. Triple-quoted strings don't need escaped inner quotes, which is why the JSON's own `\"` characters read cleanly.",
          ],
        },
        {
          type: "code",
          title: "ui/screens/LiveViewModel.kt — publish",
          source: String.raw`private fun publish(lat: Double, lng: Double) {
    socket?.send("""{"type":"position","lat":${"$"}lat,"lng":${"$"}lng}""")
}`,
          caption: "socket?.send(...) — the safe call means nothing happens if the socket hasn't connected yet, no crash, no if-check needed. lat and lng interpolate straight into the triple-quoted JSON with $name, no braces required.",
        },
        {
          type: "quiz",
          q: "`socket?.send(...)` uses the safe-call operator `?.` instead of a plain `.`. What does that buy `publish`?",
          choices: [
            "It makes the send happen asynchronously",
            "If `socket` is null (not connected yet, or already closed), the whole expression evaluates to null and nothing happens — no crash, no explicit if-check needed",
            "It retries the send automatically if it fails",
            "It converts the socket to a nullable type",
          ],
          answer: 1,
          explain: "`?.` is Kotlin's nullability operator from Module 2: call the method only if the receiver isn't null, otherwise short-circuit to null. Here that means a location update that arrives before the socket is open (or after it's been torn down) is silently dropped instead of throwing a NullPointerException.",
          nudge: "Compare `socket?.send(...)` to `socket!!.send(...)` — what would the second one do if `socket` were null?",
        },
      ],
    },
    // ────────────────────────────────────────────────────────────────────
    {
      id: "drawing-the-path",
      title: "Drawing the Path",
      steps: [
        {
          type: "text",
          md: [
            "## No map, no map tiles",
            "There's no Google Maps tile here — real map tiles cost money and need an API key. `LiveScreen`'s route is *drawn*, with Compose's low-level **`Canvas`** composable: it hands you a drawing scope with methods like `drawLine`, `drawPath`, and `drawCircle`, and you paint directly, pixel by pixel. Think whiteboard, not map widget.",
            "To turn a list of `(lat, lng)` fixes into pixel coordinates, `LiveScreen` projects them: longitude gets squished by `cos(midLat)` — degrees of longitude shrink the farther you get from the equator, so skipping this step stretches every route sideways — then the whole set is scaled and centered to fit a padded rectangle on screen. Relative shape survives; that's all a route sketch needs.",
            "> Where Maps Compose would replace this: if PawWalk added a Google Maps API key, `MapCanvas`'s hand-rolled projection and `drawPath` call would become a `Polyline` composable from the `maps-compose` library, drawn over real map tiles instead of a blank canvas. Same fixes, same `Fix` list — just a fancier renderer.",
          ],
        },
        {
          type: "code",
          title: "ui/screens/LiveScreen.kt — projecting fixes to screen space",
          source: String.raw`val midLat = (fixes.minOf { it.lat } + fixes.maxOf { it.lat }) / 2
val cosLat = cos(Math.toRadians(midLat))
fun projX(f: LiveViewModel.Fix) = f.lng * cosLat
fun projY(f: LiveViewModel.Fix) = f.lat
val minX = fixes.minOf { projX(it) }; val maxX = fixes.maxOf { projX(it) }
val minY = fixes.minOf { projY(it) }; val maxY = fixes.maxOf { projY(it) }
val spanX = max(maxX - minX, 1e-12); val spanY = max(maxY - minY, 1e-12)
val rect = Rect(60f, 200f, size.width - 60f, size.height - 220f)
val sc = min(rect.width / spanX, rect.height / spanY)`,
          caption: "minOf/maxOf with a trailing lambda (Module 2) find the bounding box of every fix. spanX/spanY use max(..., 1e-12) so a single fix (zero span) never divides by zero. sc is the one scale factor — shared by X and Y — that fits the whole route inside rect without distorting it.",
        },
        {
          type: "quiz",
          q: "Why does `sc` take `min(rect.width / spanX, rect.height / spanY)` — the *smaller* of the two ratios — instead of scaling X and Y independently?",
          choices: [
            "The smaller ratio is always more accurate for GPS math",
            "Using one shared scale factor (the tighter-fitting one) keeps the route's proportions correct — scaling X and Y independently would stretch or squash the shape to fill the rectangle",
            "It's a performance optimization to avoid extra divisions",
            "Compose requires width and height to scale identically",
          ],
          answer: 1,
          explain: "A route that goes twice as far north as it does east should look that way on screen. Picking one scale (the smaller ratio, so the bigger dimension still fits) preserves that proportion; two independent scales would distort every shape into whatever aspect ratio the rectangle happens to have.",
          nudge: "If a walk went in a perfect straight line east-to-west and you scaled X and Y with two different numbers, would it still look straight?",
        },
        {
          type: "code",
          title: "ui/screens/LiveScreen.kt — the pulsing ping",
          source: String.raw`val cp = pts.last()
drawCircle(c.accent.copy(alpha = 0.45f * (1f - ping)), 12f + 22f * ping, cp)
drawCircle(c.accent, 8f, cp)
drawCircle(on, 8f, cp, style = Stroke(2.5f))`,
          caption: "ping is an animated Float from 0 to 1, driven by rememberInfiniteTransition (Compose's built-in repeating-animation tool) back up in LiveScreen — every frame it advances, Canvas redraws, and this block runs again with a new value. As ping grows, the outer ring's radius grows (12f + 22f * ping) while its alpha fades toward zero: a ring that expands and disappears, forever, with zero manual @State bookkeeping.",
        },
        {
          type: "exercise",
          title: "Draw the route line",
          prompt: [
            "Given a `List<Offset>` named `pts` (already projected to screen coordinates) and `c.accent` (the theme's accent `Color`), draw the route as a stroked path when there's more than one point:",
            "1. Guard: only proceed `if (pts.size > 1)`.\n2. Build a `Path()` with `.apply { ... }`: `moveTo(pts[0].x, pts[0].y)`, then for every remaining point call `lineTo(it.x, it.y)` via `pts.drop(1).forEach { ... }`.\n3. Draw it with `drawPath(route, c.accent, style = Stroke(width = 3.5f, cap = StrokeCap.Round, join = StrokeJoin.Round))`.",
          ],
          starter: String.raw`// pts: List<Offset>, c.accent: Color
// your code here`,
          solution: String.raw`if (pts.size > 1) {
    val route = Path().apply {
        moveTo(pts[0].x, pts[0].y)
        pts.drop(1).forEach { lineTo(it.x, it.y) }
    }
    drawPath(route, c.accent, style = Stroke(width = 3.5f, cap = StrokeCap.Round, join = StrokeJoin.Round))
}`,
          checks: [
            { re: /if\(pts\.size>1\)/, hint: "Guard with `if (pts.size > 1)` — a path needs at least two points to draw a line." },
            { re: /moveTo\(pts\[0\]\.x,pts\[0\]\.y\)/, hint: "Start the path at the first point: `moveTo(pts[0].x, pts[0].y)`." },
            { re: /pts\.drop\(1\)\.forEach\{lineTo\(it\.x,it\.y\)\}/, hint: "For the rest of the points, `pts.drop(1).forEach { lineTo(it.x, it.y) }` — `drop(1)` skips the point you already moveTo'd." },
          ],
          mustNot: [
            { re: /pts\.forEach\{lineTo/, hint: "Don't forEach over ALL of `pts` for lineTo — the first point should be a moveTo, only the rest are lineTo." },
          ],
          success: "That's the exact path-building block drawing every route on the Live screen.",
        },
      ],
    },
    // ────────────────────────────────────────────────────────────────────
    {
      id: "permissions-and-location",
      title: "Permissions & Location",
      steps: [
        {
          type: "text",
          md: [
            "## Android gatekeeps location too",
            "Just like iOS, Android won't hand an app GPS access silently — the user has to grant a **runtime permission**, and the app has to ask. `LiveScreen` asks with `rememberLauncherForActivityResult`, a Compose tool that wraps Android's permission-request flow into something you call like a function and get a callback from.",
            "PawWalk asks for two related permissions at once — `ACCESS_FINE_LOCATION` (precise GPS) and `ACCESS_COARSE_LOCATION` (approximate, network-based) — because some devices grant only the coarse one. The `grants` map in the callback tells you which ones the user actually said yes to.",
          ],
        },
        {
          type: "code",
          title: "ui/screens/LiveScreen.kt — requesting permission",
          source: String.raw`val permLauncher = rememberLauncherForActivityResult(
    ActivityResultContracts.RequestMultiplePermissions()
) { grants ->
    if (grants.values.any { it }) viewModel.startLocationUpdates() else viewModel.onPermissionDenied()
}
LaunchedEffect(Unit) {
    viewModel.connect(bookingId)
    permLauncher.launch(
        arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION)
    )
}`,
          caption: "grants.values.any { it } — a trailing lambda over the map's values (Module 2's `it` shorthand): true if AT LEAST ONE of the two permissions was granted. LaunchedEffect(Unit) (Module 5) runs this exactly once when the screen first appears — open the socket and ask permission together.",
        },
        {
          type: "quiz",
          q: "The callback checks `grants.values.any { it }` rather than requiring *both* permissions to be granted. Why accept just one?",
          choices: [
            "It's a bug — both permissions should be required",
            "Fine and coarse location are separate permissions, but either one is enough to get a location fix — some devices or user choices grant only the coarse one, so requiring both would needlessly lock those users out",
            "Android always grants both permissions together, so the check is redundant",
            "any { it } actually means \"all\", not \"at least one\"",
          ],
          answer: 1,
          explain: "Fine and coarse are independent permissions the user can grant separately. Since the goal is just \"can we get SOME location\", accepting either one is the more permissive — and correct — check. Requiring both would break tracking for users who only allowed coarse location.",
          nudge: "What does `.any { it }` return if only one of the two values in `grants` is true?",
        },
        {
          type: "text",
          md: [
            "## FusedLocationProvider: the actual GPS tap",
            "Once permission is granted, `startLocationUpdates()` opens the real tap: Google Play services' **`FusedLocationProviderClient`**, which blends GPS, Wi-Fi, and cell data into one best-effort location stream — smarter than talking to raw GPS hardware directly, and it's what almost every Android app uses.",
            "A `LocationRequest` configures the stream: `Priority.PRIORITY_HIGH_ACCURACY` asks for the best the device can do (mirroring iOS's `kCLLocationAccuracyBest`), a interval in milliseconds sets how often to check, and `setMinUpdateDistanceMeters(5f)` — like iOS's `distanceFilter` — means a fix only arrives after the device has moved at least 5 metres, filtering out GPS jitter from a phone sitting still.",
          ],
        },
        {
          type: "code",
          title: "ui/screens/LiveViewModel.kt — startLocationUpdates",
          source: String.raw`@SuppressLint("MissingPermission")
fun startLocationUpdates() {
    val req = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 3000L)
        .setMinUpdateDistanceMeters(5f).build()
    try {
        fused.requestLocationUpdates(req, locationCallback, Looper.getMainLooper())
    } catch (e: SecurityException) {
        _state.update { it.copy(phase = Phase.DENIED) }
    }
}`,
          caption: "@SuppressLint(\"MissingPermission\") tells Android Studio's linter \"yes, I know this needs a permission — I checked it before calling this function\" (LiveScreen only calls startLocationUpdates() after grants succeed). The try/catch is a safety net for the rare case Android still refuses at the system level.",
        },
        {
          type: "text",
          md: [
            "## The callback: fixes arriving from the OS",
            "`FusedLocationProviderClient` delivers updates through a `LocationCallback` — an object with an `onLocationResult` method the OS calls whenever a new batch of locations is ready. This is Android's version of the delegate pattern: instead of a closure you pass inline, you subclass (or, as here, build an anonymous `object :`) a callback type and override its method.",
            "`result.lastLocation` is nullable — a batch could theoretically arrive empty — so it's read with `?.let { ... }`, Kotlin's \"if this isn't null, run this block\" idiom from Module 2.",
          ],
        },
        {
          type: "code",
          title: "ui/screens/LiveViewModel.kt — locationCallback",
          source: String.raw`private val locationCallback = object : LocationCallback() {
    override fun onLocationResult(result: LocationResult) {
        result.lastLocation?.let { publish(it.latitude, it.longitude) }
    }
}`,
          caption: "object : LocationCallback() { ... } builds a one-off anonymous subclass — no separate named class needed for a single override. Every new fix flows straight into publish(lat, lng), the function from lesson 2 that sends it up the socket.",
        },
        {
          type: "exercise",
          title: "Handle a denied permission",
          prompt: [
            "Write `onPermissionDenied()` — the function `LiveScreen` calls when the user rejects both location permissions.",
            "It should update `_state` so that `phase` becomes `Phase.DENIED`, keeping every other field on the state the same. Use `_state.update { it.copy(phase = Phase.DENIED) }`.",
          ],
          starter: String.raw`fun onPermissionDenied() {
    // your code here
}`,
          solution: String.raw`fun onPermissionDenied() {
    _state.update { it.copy(phase = Phase.DENIED) }
}`,
          checks: [
            { re: /_state\.update\{it\.copy\(phase=Phase\.DENIED\)\}/, hint: "Update the state with `_state.update { it.copy(phase = Phase.DENIED) }` — `.copy` keeps every other field, only `phase` changes." },
          ],
          mustNot: [
            { re: /_state\.value=/, hint: "Use `.update { it.copy(...) }`, not direct assignment to `.value` — `.update` is the safe way to transform a MutableStateFlow." },
          ],
          success: "That's the exact one-liner in LiveViewModel.kt — and it's what flips the HUD's status pill to \"Location access is off.\"",
        },
        {
          type: "quiz",
          q: "The owner and the walker are both watching the same booking's Live screen. Whose phone actually calls `startLocationUpdates()` and `publish(lat, lng)` in a way that matters?",
          choices: [
            "Only the owner's — the owner tracks the walker",
            "Only the walker's — the walker's phone is the one producing real GPS fixes to publish; the owner's phone opens the same socket but only ever receives",
            "Both phones publish fixes and the backend averages them",
            "Neither — GPS fixes come from the backend's own server-side location service",
          ],
          answer: 1,
          explain: "Both phones run the identical LiveScreen/LiveViewModel code and both request location permission, but only the walker's fixes are meaningful — theirs is the phone actually moving with the dog. The owner's device technically starts location updates too (same code path), but what matters for the HUD is the position stream arriving over the socket, which only reflects the walker's real movement.",
          nudge: "Think about which phone is physically on the walk. Does the code care which role the current user has, or does it just run the same logic either way?",
        },
      ],
    },
  ],
});
