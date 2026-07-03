// Module 06 — The PawWalk Design System (Android track). See ../lessons/FORMAT.md
// and ./FORMAT-KOTLIN.md for the schema and Kotlin-specific traps.
window.COURSE = window.COURSE || [];
window.COURSE.push({
  id: "design-system-android",
  title: "The PawWalk Design System",
  emoji: "🖌️",
  lang: "kotlin",
  lessons: [
    // ────────────────────────────────────────────────────────────────
    {
      id: "material-3-theming",
      title: "Material 3 Theming",
      steps: [
        {
          type: "text",
          md: [
            "## Every screen, one look",
            "Open PawWalk and you'll notice a consistent style: cool paper backgrounds, near-black ink text, one confident indigo accent, tiny uppercase mono labels that feel like an instrument panel. That's not luck — it's a **design system**: colors and type defined in exactly one place, and every screen borrows from it. Change a value there, and the whole app updates.",
            "Android's design system for this is **Material 3** — Google's current design language. Jetpack Compose ships a `MaterialTheme` composable that every Material component (buttons, text fields, cards) reads its colors and type from automatically.",
            "## ColorScheme: named roles, not raw colors",
            "`MaterialTheme` is built around a `ColorScheme` — a data class with dozens of named color **roles**: `primary`, `onPrimary`, `background`, `onBackground`, `surface`, `onSurface`, and more. Notice the naming pattern: `on<Role>` is always \"a color that's readable *on top of* `<Role>`\" — `onPrimary` is the text/icon color you'd put on a `primary`-colored button.",
            "Compose gives you two built-in factories: `lightColorScheme(...)` and `darkColorScheme(...)`. You don't have to fill in every role — pass the ones your app cares about and Material derives sensible defaults for the rest.",
          ],
        },
        {
          type: "code",
          title: "ui/theme/Theme.kt",
          source: String.raw`private val LightColors = lightColorScheme(
    primary = LightBrand.accent,
    onPrimary = LightBrand.onInverse,
    background = LightBrand.canvas,
    onBackground = LightBrand.ink,
    surface = LightBrand.canvas,
    onSurface = LightBrand.ink,
)

private val DarkColors = darkColorScheme(
    primary = DarkBrand.accent,
    onPrimary = Color(0xFF120E24),
    background = DarkBrand.canvas,
    onBackground = DarkBrand.ink,
    surface = DarkBrand.canvas,
    onSurface = DarkBrand.ink,
)`,
          caption: "Two ColorScheme values — one per appearance — each built from PawWalk's own brand tokens (LightBrand, DarkBrand), not Material's defaults.",
        },
        {
          type: "text",
          md: [
            "## Dark mode: pick the scheme, not the colors",
            "PawWalk doesn't write `if (darkTheme) { ... }` inside every screen. Instead, `PawWalkTheme` — the composable every screen is wrapped in — picks *which whole scheme* to hand to `MaterialTheme` once, at the root.",
            "`isSystemInDarkTheme()` is a Compose function that reads the phone's current appearance setting and — like any state Compose reads — triggers recomposition automatically if it changes while the app is open. So `darkTheme` here isn't computed once and forgotten; it's live.",
          ],
        },
        {
          type: "code",
          title: "ui/theme/Theme.kt",
          source: String.raw`@Composable
fun PawWalkTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    val brand = if (darkTheme) DarkBrand else LightBrand
    val colorScheme = if (darkTheme) DarkColors else LightColors
    CompositionLocalProvider(LocalBrand provides brand) {
        MaterialTheme(colorScheme = colorScheme, typography = Typography, content = content)
    }
}`,
          caption: "The root composable, wrapping the whole app (you saw it in MainActivity back in Module 00). One `if`, and both Material's scheme and PawWalk's own brand tokens switch together.",
        },
        {
          type: "quiz",
          q: "Why does `PawWalkTheme` take a `darkTheme: Boolean = isSystemInDarkTheme()` parameter instead of just always calling `isSystemInDarkTheme()` inside the body?",
          choices: [
            "It doesn't matter, both are identical",
            "A default parameter can still be overridden by a caller — useful for previews or a future in-app theme toggle — while normal calls get the live system value for free",
            "Compose requires all Boolean state to be passed as parameters",
            "`isSystemInDarkTheme()` only works inside function bodies, never as a default",
          ],
          answer: 1,
          explain: "Default parameter values run at the call site if the caller doesn't supply one — so plain callers get the live system setting automatically, but a `@Preview` or a settings screen could pass `darkTheme = true` explicitly to force a mode.",
          nudge: "Think about what a default parameter value buys you that a hardcoded body call doesn't.",
        },
        {
          type: "exercise",
          title: "Wire a scheme into MaterialTheme",
          prompt: [
            "Fill in the body of a trimmed `PawWalkTheme`. Given `darkTheme`, pick `DarkColors` or `LightColors` into a `val colorScheme`, then call `MaterialTheme(...)` passing `colorScheme`, `typography = Typography`, and `content = content`.",
          ],
          starter: String.raw`@Composable
fun PawWalkTheme(darkTheme: Boolean, content: @Composable () -> Unit) {
    // your code here
}`,
          solution: String.raw`@Composable
fun PawWalkTheme(darkTheme: Boolean, content: @Composable () -> Unit) {
    val colorScheme = if (darkTheme) DarkColors else LightColors
    MaterialTheme(colorScheme = colorScheme, typography = Typography, content = content)
}`,
          checks: [
            { re: /val colorScheme=if\(darkTheme\)DarkColors else LightColors/, hint: "Pick the scheme with a plain `if` expression: `val colorScheme = if (darkTheme) DarkColors else LightColors`." },
            { re: /MaterialTheme\(colorScheme=colorScheme,typography=Typography,content=content\)/, hint: "Call `MaterialTheme(colorScheme = colorScheme, typography = Typography, content = content)` — all three named arguments, in that order." },
          ],
          success: "That's the shape of the real PawWalkTheme — one branch, one MaterialTheme call, and every Material component downstream reads from it.",
        },
      ],
    },
    // ────────────────────────────────────────────────────────────────
    {
      id: "pawwalks-brand",
      title: "PawWalk's Brand",
      steps: [
        {
          type: "text",
          md: [
            "## Material's roles aren't enough on their own",
            "`ColorScheme` covers what *Material components* need. But PawWalk's HUD look needs more: a soft \"canvas deep\" background for cards, four fixed signal colors that mean the same thing in light and dark (a green dot for \"walk in progress,\" amber for \"pending\"), and so on. Those live in a second file, `ui/theme/Brand.kt`, as PawWalk's own `BrandColors` data class.",
            "## Reading a hex color in Kotlin",
            "Jetpack Compose's `Color` type takes a hex literal directly — no bit-shifting helper needed like some other frameworks: `Color(0xFF5B4BE0)`. The first byte pair, `FF`, is **alpha** (opacity) — `FF` means fully opaque. Then red `5B`, green `4B`, blue `E0`. So `0xFF5B4BE0` is PawWalk's indigo accent, at full opacity.",
          ],
        },
        {
          type: "code",
          title: "ui/theme/Brand.kt",
          source: String.raw`/** Semantic design tokens (mirrors the CSS custom properties in the handoff). */
data class BrandColors(
    val canvas: Color,
    val canvasDeep: Color,
    val ink: Color,
    val accent: Color,
    val inverse: Color,
    val inverse2: Color,
    val onInverse: Color,
    val inverseScrim: Color,
    // Fixed signal colors (same in both themes)
    val signalGreen: Color = Color(0xFF4A7A5E),
    val signalGreenSoft: Color = Color(0xFF9FD3C0),
    val pinBlue: Color = Color(0xFF457B9D),
    val pinAmber: Color = Color(0xFFC68A1E),
)`,
          caption: "One data class holds every PawWalk color. The last four have default values because they're identical in both themes — no need to repeat them per appearance.",
        },
        {
          type: "text",
          md: [
            "## Tokens: names mean roles, not colors",
            "Look at what these properties are *not* named: there's no `purple` or `almostBlack`. Instead: `canvas` (the background you paint on), `ink` (what you write with), `accent` (the one color allowed to shout). Names describe **roles**, because in dark mode `ink` is nearly *white* — a name like `darkText` would become a lie half the time.",
            "`data class` gives `BrandColors` free `equals()`, `toString()`, and — most useful here — `copy()`, letting you build one variant from another by changing just a few fields (you rebuilt exactly this idea back in Module 03 with `Walker`).",
            "Two full instances exist, one per appearance:",
          ],
        },
        {
          type: "code",
          title: "ui/theme/Brand.kt",
          source: String.raw`val LightBrand = BrandColors(
    canvas = Color(0xFFF5F3FA),
    canvasDeep = Color(0xFFE7E4F2),
    ink = Color(0xFF171327),
    accent = Color(0xFF5B4BE0),
    inverse = Color(0xFF171327),
    inverse2 = Color(0xFF2C2647),
    onInverse = Color(0xFFF5F3FA),
    inverseScrim = Color(0xFF171327),
)

val DarkBrand = BrandColors(
    canvas = Color(0xFF0E0A1C),
    canvasDeep = Color(0xFF1C1636),
    ink = Color(0xFFECEAF7),
    accent = Color(0xFF8E7DFF),
    inverse = Color(0xFF221B3F),
    inverse2 = Color(0xFF2E2752),
    onInverse = Color(0xFFF4F2FC),
    inverseScrim = Color(0xFF07050F),
)`,
          caption: "Same eight roles, two sets of hex values — this is the whole of PawWalk's light/dark palette.",
        },
        {
          type: "text",
          md: [
            "## Getting the brand to every screen: CompositionLocal",
            "A regular function parameter only reaches the composables you call directly. But `Brand.kt`'s colors need to reach *every* screen, deep in the tree, without threading a `colors` parameter through every single composable in between. Compose's answer is `CompositionLocalProvider` + `staticCompositionLocalOf` — an implicit value available to any composable below where it's provided, no parameter passing required.",
          ],
        },
        {
          type: "code",
          title: "ui/theme/Brand.kt",
          source: String.raw`val LocalBrand = staticCompositionLocalOf { LightBrand }

/** Ergonomic accessor: Hud.colors.accent. */
object Hud {
    val colors: BrandColors
        @Composable get() = LocalBrand.current
}`,
          caption: "LightBrand is just the fallback default. PawWalkTheme provides the real value — you saw that CompositionLocalProvider line in the previous lesson.",
        },
        {
          type: "quiz",
          q: "Every screen in PawWalk reads colors with `Hud.colors.accent`, `Hud.colors.ink`, and so on. What makes that work without passing a `BrandColors` parameter into every composable?",
          choices: [
            "BrandColors is a global mutable variable",
            "Hud.colors reads LocalBrand.current, a CompositionLocal that PawWalkTheme provided once at the root of the whole screen tree",
            "Every composable secretly takes a hidden colors parameter added by the compiler",
            "Android caches the last color scheme used in SharedPreferences",
          ],
          answer: 1,
          explain: "CompositionLocalProvider(LocalBrand provides brand) in PawWalkTheme makes that value available to every composable below it in the tree. Hud.colors is just a friendly getter around LocalBrand.current.",
          nudge: "Look at where CompositionLocalProvider was called, and what Hud.colors' getter actually reads.",
        },
        {
          type: "exercise",
          title: "Add the pinAmber token",
          prompt: [
            "A booking that's still waiting for a walker shows a pending badge, tinted amber. Add that property to `BrandColors`: name it `pinAmber`, type `Color`, with a default value of `Color(0xFFC68A1E)`.",
            "It's a fixed signal color — same in both themes — so it belongs with the other defaulted properties, not inside `LightBrand`/`DarkBrand`.",
          ],
          starter: String.raw`data class BrandColors(
    val canvas: Color,
    val accent: Color,
    val signalGreen: Color = Color(0xFF4A7A5E),
    // your code here
)`,
          solution: String.raw`data class BrandColors(
    val canvas: Color,
    val accent: Color,
    val signalGreen: Color = Color(0xFF4A7A5E),
    val pinAmber: Color = Color(0xFFC68A1E),
)`,
          checks: [
            { re: /val pinAmber:Color=Color\(0xFFC68A1E\)/, hint: "Declare it as `val pinAmber: Color = Color(0xFFC68A1E)` — a defaulted constructor property, same style as `signalGreen`." },
          ],
          mustNot: [
            { re: /varpinAmber/, hint: "Data class properties here are immutable — use `val`, not `var`." },
          ],
          success: "That's the real token from Brand.kt — every PENDING badge in the bookings screen gets its amber from your line.",
        },
      ],
    },
    // ────────────────────────────────────────────────────────────────
    {
      id: "reusable-hud-components",
      title: "Reusable HUD Components",
      steps: [
        {
          type: "text",
          md: [
            "## Don't repeat the recipe — bottle it",
            "PawWalk has dozens of little uppercase mono labels: booking statuses, star ratings, section headers. Retyping `fontFamily = JetBrainsMono, letterSpacing = ...` on every `Text` invites drift — someone forgets the tracking, someone picks the wrong weight, and the design quietly falls apart.",
            "The fix is the heart of Compose: **make it a composable**. You've written `@Composable` functions since Module 04 — a reusable component is just one designed with parameters for everything callers might want to change, and **default values** for everything they usually won't. `ui/components/HudComponents.kt` holds PawWalk's two workhorse components.",
          ],
        },
        {
          type: "code",
          title: "ui/components/HudComponents.kt",
          source: String.raw`/** JetBrains Mono caption — the recurring uppercase readout style. */
@Composable
fun MonoText(
    text: String,
    color: Color,
    sizeSp: Float = 10f,
    weight: FontWeight = FontWeight.Medium,
    trackingEm: Float = 0.12f,
    upper: Boolean = true,
    modifier: Modifier = Modifier,
) {
    Text(
        text = if (upper) text.uppercase() else text,
        modifier = modifier,
        color = color,
        fontFamily = JetBrainsMono,
        fontWeight = weight,
        fontSize = sizeSp.sp,
        letterSpacing = trackingEm.em,
        lineHeight = (sizeSp * 1.15f).sp,
        maxLines = 1,
        overflow = TextOverflow.Ellipsis,
    )
}`,
          caption: "Two required parameters (text, color), five with defaults. MonoText(\"distance\", Hud.colors.ink) is the whole call site.",
        },
        {
          type: "text",
          md: [
            "## MonoText, parameter by parameter",
            "- **`text` and `color` have no default** — every caller must decide what to say and in what color; there's no sane house default for either.\n- **`sizeSp = 10f`, `weight = FontWeight.Medium`, `trackingEm = 0.12f`** — the house style: small, medium weight, letter-spacing at 0.12 em (12% of the font size — same em-relative idea as any CSS-derived design system).\n- **`upper = true`** — `if (upper) text.uppercase() else text` — the view shouts by default so screens don't have to remember to. Pass `upper = false` for the rare label that should stay mixed-case (you saw this in the WalkersScreen search results).\n- **`fontSize = sizeSp.sp`** and **`letterSpacing = trackingEm.em`** — `.sp` and `.em` are Compose's unit extension properties, turning a plain `Float` into a type-safe text unit. `sp` scales with the user's font-size accessibility setting; `em` stays relative to that element's own size.\n- **`modifier: Modifier = Modifier`** — every reusable composable should accept a `Modifier` with a default of the empty `Modifier`, so callers can add padding, clicks, or alignment from outside without MonoText needing to know about them.",
            "The second component follows you back from Module 05 in spirit — it's `HudDot`, the glowing status dot next to an in-progress walk, animated with `rememberInfiniteTransition`. You'll meet Compose animation properly in a later module; for now, notice it's built the same way: parameters with defaults, one focused job.",
          ],
        },
        {
          type: "quiz",
          q: "What does `MonoText(\"gps signal\", Hud.colors.ink)` render on screen?",
          choices: [
            "gps signal",
            "GPS SIGNAL",
            "Gps Signal",
            "Nothing — sizeSp and weight are required, so this won't compile",
          ],
          answer: 1,
          explain: "upper defaults to true, so the body runs text.uppercase() before displaying it — and every other parameter (sizeSp, weight, trackingEm, modifier) has a default, so the two-argument call compiles fine.",
          nudge: "Check MonoText's default for the upper parameter, and what the Text call does when it's true.",
        },
        {
          type: "exercise",
          title: "Rebuild a status pill",
          prompt: [
            "PawWalk's bookings list shows a colored pill per booking status. Write `StatusPill`: a `@Composable` function taking `color: Color` and `status: String`, whose body is a `Row` wrapping a single `MonoText`.",
            "Inside the `Row`, call `MonoText(status, color)` — that's the whole body.",
          ],
          starter: String.raw`@Composable
private fun StatusPill(color: Color, status: String) {
    // your code here
}`,
          solution: String.raw`@Composable
private fun StatusPill(color: Color, status: String) {
    Row {
        MonoText(status, color)
    }
}`,
          checks: [
            { re: /@Composable (private fun|fun) StatusPill\(color:Color,status:String\)/, hint: "Keep the given signature: `@Composable private fun StatusPill(color: Color, status: String)`." },
            { re: /Row\{/, hint: "Wrap the label in a `Row { ... }` — that's what lets you add a background/border/padding to the pill later." },
            { re: /MonoText\(status,color\)/, hint: "Inside the Row, call `MonoText(status, color)` — status is the text, color is the tint." },
          ],
          success: "That's the core of the real StatusPill in BookingsScreen.kt — the full version adds a rounded background and a when over the status string to pick the color, which you'll build in Module 10.",
        },
      ],
    },
    // ────────────────────────────────────────────────────────────────
    {
      id: "icons-and-polish",
      title: "Icons & Polish",
      steps: [
        {
          type: "text",
          md: [
            "## No icon library — just a Canvas",
            "Most apps pull in an icon font or a big vector-icon dependency. PawWalk doesn't: `ui/components/HudIcons.kt` draws every icon by hand with Compose's `Canvas`, at whatever size is asked for, in one consistent thin-line style. Cheaper to ship, and every icon matches exactly.",
            "`Canvas(modifier)` gives you a drawing surface and a `DrawScope` — inside its lambda you call primitives like `drawCircle`, `drawLine`, `drawPath`, `drawOval`, each taking real pixel coordinates. To make an icon resize cleanly, every coordinate is written as a **fraction of the icon's own size**, never a hardcoded pixel number.",
          ],
        },
        {
          type: "code",
          title: "ui/components/HudIcons.kt",
          source: String.raw`@Composable
fun CheckIcon(tint: Color, size: Dp = 9.dp, modifier: Modifier = Modifier) = Canvas(modifier.size(size)) {
    val s = this.size.minDimension
    strokePath(tint, s * 0.16f) {
        moveTo(s * 0.20f, s * 0.52f); lineTo(s * 0.42f, s * 0.72f); lineTo(s * 0.80f, s * 0.28f)
    }
}`,
          caption: "The whole checkmark icon. `s` is the icon's actual pixel size at draw time; every point is s times a 0–1 fraction, so the checkmark keeps its proportions whether size is 9.dp or 40.dp.",
        },
        {
          type: "text",
          md: [
            "## Reading strokePath",
            "`strokePath` is a small private helper shared by every icon in the file — you're not meant to duplicate `Path().apply { ... }; drawPath(...)` in each one:",
            "```\nprivate fun DrawScope.strokePath(tint: Color, width: Float, block: Path.() -> Unit) {\n    val p = Path().apply(block)\n    drawPath(p, color = tint, style = Stroke(width = width, cap = StrokeCap.Round, join = StrokeJoin.Round))\n}\n```",
            "It's an **extension function on `DrawScope`** — that's why every icon composable can call `strokePath(...)` directly inside `Canvas { ... }`, without a receiver. The `block: Path.() -> Unit` parameter is a lambda with `Path` as its receiver, so inside `strokePath(tint, s * 0.16f) { moveTo(...); lineTo(...) }`, the braces are running as if they were written inside `Path`'s own class — that's how `moveTo`/`lineTo` resolve with no dot in front of them.",
            "`moveTo` lifts the pen to a point without drawing; `lineTo` draws a straight segment from wherever the pen is to the new point. Three points, two `lineTo` calls: a checkmark is just two connected line segments.",
          ],
        },
        {
          type: "quiz",
          q: "Why does every icon compute coordinates as `s * 0.20f` instead of a fixed number like `20f`?",
          choices: [
            "Fixed numbers don't compile in a DrawScope",
            "So the icon's shape stays proportional at any requested size — s is the icon's actual pixel size, recomputed each time it's drawn",
            "It's purely a style preference with no functional effect",
            "Canvas requires all coordinates to be fractions between 0 and 1",
          ],
          answer: 1,
          explain: "s = this.size.minDimension is the icon's real size in pixels at draw time. Multiplying by a 0–1 fraction keeps every point proportional — draw the same icon at 9.dp or 40.dp and it scales cleanly instead of clipping or looking tiny.",
          nudge: "What would happen to a 20f coordinate if the Canvas were only 12 pixels across?",
        },
        {
          type: "text",
          md: [
            "## When to extract a component",
            "You've now seen the whole ladder: a raw `Text` with manual styling, `MonoText` wrapping that recipe, `StatusPill` wrapping `MonoText` again, and hand-drawn icon composables wrapping `Canvas`. The rule of thumb PawWalk follows: the moment you're about to copy-paste a styling recipe to a second call site, stop and extract a composable instead. One shared definition beats three drifting copies — and it's exactly the same instinct as pulling a repeated calculation into a function, just applied to UI.",
          ],
        },
        {
          type: "exercise",
          title: "A tiny icon from scratch",
          prompt: [
            "Write `DotIcon`: a `@Composable` function taking `tint: Color` and `size: Dp = 10.dp`, whose body is `Canvas(Modifier.size(size)) { drawCircle(tint) }` — a single filled circle that fills the canvas.",
          ],
          starter: String.raw`@Composable
fun DotIcon(tint: Color, size: Dp = 10.dp) {
    // your code here
}`,
          solution: String.raw`@Composable
fun DotIcon(tint: Color, size: Dp = 10.dp) {
    Canvas(Modifier.size(size)) { drawCircle(tint) }
}`,
          checks: [
            { re: /@Composable fun DotIcon\(tint:Color,size:Dp=10\.dp\)/, hint: "Keep the given signature: `@Composable fun DotIcon(tint: Color, size: Dp = 10.dp)`." },
            { re: /Canvas\(Modifier\.size\(size\)\)\{drawCircle\(tint\)\}/, hint: "The body is one line: `Canvas(Modifier.size(size)) { drawCircle(tint) }` — no coordinates needed, drawCircle defaults to centering and filling." },
          ],
          success: "That's a real, minimal HudIcons-style composable — the same pattern (Canvas + a size default) every icon in the file follows, just without the hand-plotted path.",
        },
        {
          type: "xcode",
          label: "Over to Android Studio",
          title: "See the design system live",
          intro: [
            "Everything from this module already ships in the app. Go watch it in action:",
          ],
          items: [
            "Terminal tab 1: `cd apps/backend && uv run fastapi dev` — leave it running.",
            "In Android Studio, run the app on your Pixel API 36 emulator (green ▶ or Shift+F10).",
            "Log in and open the bookings screen — the colored pill next to each booking is your `StatusPill`; every small uppercase label around the app is a `MonoText`.",
            "Open the phone's Settings → Display → toggle **Dark theme**, then come back to PawWalk without relaunching it — watch the whole app restyle instantly. That's `isSystemInDarkTheme()` recomposing `PawWalkTheme` with the other ColorScheme.",
          ],
        },
      ],
    },
  ],
});
