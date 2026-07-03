// Module 04 — Jetpack Compose: First Steps (Android track). See
// ../lessons/FORMAT.md and ./FORMAT-KOTLIN.md for the schema and traps.
window.COURSE = window.COURSE || [];
window.COURSE.push({
  id: "compose-first-steps",
  title: "Jetpack Compose: First Steps",
  emoji: "🎨",
  lang: "kotlin",
  lessons: [
    // ────────────────────────────────────────────────────────────
    {
      id: "first-composable",
      title: "Your first @Composable",
      steps: [
        {
          type: "text",
          md: [
            "## Functions that draw the screen",
            "You've spent three modules on plain Kotlin — no screen, no pixels. Time to fix that. Jetpack Compose's one big idea: **a UI building block is just a function**, marked with an annotation that tells Compose \"this function describes some UI.\"",
            "That annotation is `@Composable`. Slap it on a function, and instead of returning a value, the function's body *emits* UI by calling other `@Composable` functions inside it — `Text`, `Row`, `Button`, and eventually your own. Compose calls your function to find out what to draw, and calls it again — **recomposition** — whenever the state it reads changes.",
            "> If you've done the iOS track: a `@Composable` function is Kotlin's answer to a SwiftUI `View` struct. Different spelling (`fun` vs `struct` + `body`), same declarative idea — describe the screen for the current state, don't poke pixels by hand.",
          ],
        },
        {
          type: "code",
          title: "Your first composable",
          source: String.raw`import androidx.compose.material3.Text
import androidx.compose.runtime.Composable

@Composable
fun WelcomeBanner() {
    Text("Welcome to PawWalk 🐾")
}`,
          caption: "Five lines. An import, an annotation, a function declaration, and one call to another composable — that's the whole recipe.",
        },
        {
          type: "text",
          md: [
            "## Reading it line by line",
            "- `import androidx.compose.material3.Text` — Compose's UI pieces live in packages you import, same as any other Kotlin class or function.\n- `@Composable fun WelcomeBanner()` — a **composable function**: an ordinary Kotlin `fun`, just annotated. It takes no parameters and returns `Unit` (nothing) — its whole job is emitting UI as a side effect of running.\n- `Text(\"Welcome to PawWalk 🐾\")` — `Text` is itself a `@Composable` function from Material 3. Calling a composable from inside another composable is how you compose (hence the name) bigger UI out of smaller pieces.",
            "## @Preview: see it without running the app",
            "Compiling and launching the emulator for every tiny change would be painfully slow. Android Studio's `@Preview` annotation renders a composable **right in the editor**, no emulator needed:",
          ],
        },
        {
          type: "code",
          title: "Previewing a composable",
          source: String.raw`import androidx.compose.ui.tooling.preview.Preview

@Preview
@Composable
fun WelcomeBannerPreview() {
    WelcomeBanner()
}`,
          caption: "A tiny wrapper function, annotated `@Preview` and `@Composable`, that just calls the real one. Android Studio finds it automatically and renders it in the Split or Design pane.",
        },
        {
          type: "quiz",
          q: "What makes a Kotlin function a \"composable\"?",
          choices: [
            "It returns a value of type UI",
            "It's marked with the `@Composable` annotation",
            "It's named starting with a capital letter",
            "It's declared inside MainActivity",
          ],
          answer: 1,
          explain: "The `@Composable` annotation is the whole signal — it tells the Compose compiler this function describes UI and may call other composables. Naming with a capital letter is just a convention people follow, not a rule the compiler enforces.",
          nudge: "Look at what's different about `WelcomeBanner` compared to a normal Kotlin function.",
        },
        {
          type: "exercise",
          title: "Write your first composable",
          prompt: [
            "Declare a composable function called `PawBadge` that takes no parameters and shows `Text(\"PawWalk\")`.",
            "That's the complete recipe for every Compose UI piece you'll write: the annotation, the function, a call to another composable inside it.",
          ],
          starter: String.raw`import androidx.compose.material3.Text
import androidx.compose.runtime.Composable

// your code here
`,
          solution: String.raw`import androidx.compose.material3.Text
import androidx.compose.runtime.Composable

@Composable
fun PawBadge() {
    Text("PawWalk")
}`,
          checks: [
            { re: /@Composable\s*fun PawBadge\(\)\{/, hint: "Annotate it with `@Composable` on the line above `fun PawBadge() { … }`." },
            { re: /Text\("PawWalk"\)/, hint: "Inside the function body, call `Text(\"PawWalk\")` — text goes in double quotes." },
          ],
          mustNot: [
            { re: /class PawBadge/, hint: "A composable is a function, not a class — use `fun`, not `class`." },
          ],
          success: "That's the skeleton of every screen in PawWalk's Android app — WalkersScreen, AuthScreen, the live map — they all start as a plain function like this one.",
        },
      ],
    },
    // ────────────────────────────────────────────────────────────
    {
      id: "rows-columns-boxes",
      title: "Rows, Columns & Boxes",
      steps: [
        {
          type: "text",
          md: [
            "## Three containers, all of layout",
            "One `Text` on the screen won't get you far. Compose's layout system is built on three container composables, each arranging whatever children you give it:",
            "- **`Column`** — stacks children **vertically**, top to bottom.\n- **`Row`** — lines children up **horizontally**, left to right.\n- **`Box`** — **layers** children on top of each other; later children draw over earlier ones.",
            "You nest them to build real screens: a screen is often a `Column` of rows, each row a `Row` of an icon and some text. Sound familiar? `Column` is Compose's `VStack`, `Row` is its `HStack`, `Box` is its `ZStack` — same three shapes, different names.",
            "Both `Row` and `Column` take `horizontalArrangement`/`verticalArrangement` (spacing and grouping *along* the main axis) and `horizontalAlignment`/`verticalAlignment` (how children line up on the *cross* axis).",
          ],
        },
        {
          type: "code",
          title: "Containers in the wild",
          source: String.raw`import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable

@Composable
fun TodaysWalk() {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("Today's walk")
        Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
            Text("⏱")
            Text("30 min")
        }
    }
}`,
          caption: "A vertical Column holding a title and a row; the row is a horizontal Row of an icon and a duration. Read layouts inside-out, same as always.",
        },
        {
          type: "quiz",
          q: "You want a walker's avatar on the left with their name right next to it. Which container?",
          choices: [
            "Column — it handles every direction",
            "Box — the name sits on top of the avatar",
            "Row — children line up horizontally",
            "You need a special AvatarRow composable",
          ],
          answer: 2,
          explain: "Side by side means horizontal, and horizontal means `Row`. (A `Box` would print the name *over* the avatar — sometimes useful, not here.)",
          nudge: "Which axis do \"left\" and \"next to\" describe?",
        },
        {
          type: "text",
          md: [
            "## Pushing, sizing, spacing vs padding",
            "A few more tools finish the kit:",
            "- **`Spacer(Modifier.weight(1f))`** inside a `Row` — grows to fill leftover room, shoving siblings to opposite edges. That's how a walker card puts a name on the left and a price on the right.\n- **`Modifier.size(...)`** — gives a composable an exact width and height.\n- **`Modifier.padding(...)`** — space *around* one composable, versus **`Arrangement.spacedBy(...)`**, the gap *between* siblings inside a `Row`/`Column`. Padding belongs to a composable; `spacedBy` belongs to the container. Mixing these up is the classic layout bug — in both Compose and SwiftUI.",
            "Now let's read real PawWalk code. `HudDot` is the little \"live\" radar dot you'll see next to GPS status all over the app — a `Box` layering two smaller boxes. It lives in `ui/components/HudComponents.kt`.",
          ],
        },
        {
          type: "code",
          title: "ui/components/HudComponents.kt",
          source: String.raw`/** Status dot with an expanding radar pulse. */
@Composable
fun HudDot(color: Color, sizeDp: Dp = 8.dp, modifier: Modifier = Modifier) {
    val t = rememberInfiniteTransition(label = "dot")
    val scale by t.animateFloat(
        1f, 1.9f,
        infiniteRepeatable(tween(1900, easing = LinearEasing), RepeatMode.Restart), label = "scale"
    )
    val alpha by t.animateFloat(
        0.22f, 0f,
        infiniteRepeatable(tween(1900, easing = LinearEasing), RepeatMode.Restart), label = "alpha"
    )
    Box(modifier.size(sizeDp), contentAlignment = Alignment.Center) {
        Box(
            Modifier.size(sizeDp).graphicsLayer { scaleX = scale; scaleY = scale; this.alpha = alpha }
                .background(color, CircleShape)
        )
        Box(Modifier.size(sizeDp).background(color, CircleShape))
    }
}`,
          caption: "Two small Boxes layered inside an outer Box: the first (drawn first, so it's underneath) is the faint ring that grows and fades; the second is the solid dot on top. The animateFloat / rememberInfiniteTransition machinery is what makes it pulse — file that under \"Module 05, state\" for now. Today, focus on the outer Box and the two children stacking on top of each other.",
        },
        {
          type: "quiz",
          q: "In HudDot, why are the two inner Boxes drawn inside an outer Box?",
          choices: [
            "Box makes children animate automatically",
            "The pulse ring and the solid dot must be layered on top of each other, and Box draws children back-to-front in call order",
            "Boxes are required whenever you use Modifier.size",
            "Box is faster than Column for two children",
          ],
          answer: 1,
          explain: "Box is the layering container: children are drawn in the order you call them, each one on top of the last. The first Box (the expanding, fading ring) is drawn first — underneath — and the solid dot is called second, landing on top of it.",
          nudge: "Column stacks top-to-bottom, Row stacks left-to-right… what does Box stack along?",
        },
        {
          type: "exercise",
          title: "Build a walker row",
          prompt: [
            "Time to compose a real layout. Write a composable `WalkerRow` (no parameters) whose body is a `Row` containing `Text(\"🐾\")`, then a `Column` with two texts inside — `Text(\"Maya\")` on top and `Text(\"$18 / 30 min\")` below.",
            "Icon on the left, a column of name-over-price on the right — the exact shape of the walker rows you'll build for real a few lessons from now.",
          ],
          starter: String.raw`import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable

@Composable
fun WalkerRow() {
    // your code here
}`,
          solution: String.raw`import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable

@Composable
fun WalkerRow() {
    Row {
        Text("🐾")
        Column {
            Text("Maya")
            Text("$18 / 30 min")
        }
    }
}`,
          checks: [
            { re: /Row\{/, hint: "Icon *beside* text means the outer container is horizontal: `Row { … }`." },
            { re: /Text\("🐾"\)/, hint: "First child inside the Row: `Text(\"🐾\")`." },
            { re: /Column\{Text\("Maya"\)Text\("\$18\/30 min"\)\}/, hint: "Inside the Row, a `Column { Text(\"Maya\") Text(\"$18 / 30 min\") }` — name first, price below it." },
          ],
          mustNot: [
            { re: /Column\{Text\("🐾"\)/, hint: "The paw print sits *beside* the text column, not inside it — `Text(\"🐾\")` is a direct child of the `Row`." },
          ],
          success: "Containers inside containers — you just laid out the same shape as PawWalk's walker list rows. Layout is officially in your toolkit.",
        },
      ],
    },
    // ────────────────────────────────────────────────────────────
    {
      id: "modifiers",
      title: "Modifiers",
      steps: [
        {
          type: "text",
          md: [
            "## One parameter, endless composition",
            "Every layout composable — `Text`, `Row`, `Column`, `Box`, `Button` — accepts a `modifier: Modifier` parameter. A `Modifier` is a **chain of instructions** for how a composable should be measured, drawn, and behave: how much padding it gets, what background it paints, whether it responds to taps.",
            "You build a chain by calling methods on `Modifier`, dot after dot — and here's the part that trips people up: **order matters**, because each step wraps the result of the one before it.",
          ],
        },
        {
          type: "code",
          title: "Order changes the picture",
          source: String.raw`import androidx.compose.foundation.background
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

@Composable
fun PaddingThenBackground() {
    Text(
        "Confirmed",
        modifier = Modifier
            .padding(12.dp)
            .background(Color.Green),
    )
}

@Composable
fun BackgroundThenPadding() {
    Text(
        "Confirmed",
        modifier = Modifier
            .background(Color.Green)
            .padding(12.dp),
    )
}`,
          caption: "Same two modifiers, opposite order. In the first, padding is added around the text FIRST, then the green background is painted around that already-padded box — so the green fills the outer edge too. In the second, the background is painted tight around the bare text FIRST, and padding is added around the now-green box — so you see green text on a small patch, surrounded by canvas-colored empty space.",
        },
        {
          type: "text",
          md: [
            "## Reading a modifier chain",
            "Think of each `.method()` as wrapping the composable in one more layer, outside-in, in the order you wrote them:",
            "`Text → padded box → green box` (padding-then-background) is a different nested shape than `Text → green box → padded box` (background-then-padding). Neither order is \"correct\" — you pick whichever nested shape matches the design. When something looks like padding \"isn't working,\" check the modifier order before anything else.",
          ],
        },
        {
          type: "quiz",
          q: "You call `Modifier.padding(12.dp).background(Color.Green)` on a Text. Where does the green paint?",
          choices: [
            "Only tight around the text's letters, with visible gap outside it",
            "Around the padded box — the green fills the outer edge, right up to the padding's boundary",
            "Nowhere — padding cancels the background",
            "Green paints first, so it's covered up",
          ],
          answer: 1,
          explain: "Each modifier wraps the previous result. Padding is applied first, producing a bigger box; background then paints that whole bigger box green — the padding becomes part of what's colored.",
          nudge: "Whichever modifier runs first produces the shape the next one wraps around.",
        },
        {
          type: "exercise",
          title: "Fix the modifier-order bug",
          prompt: [
            "A teammate wanted a `Text` with a green background and 12dp of breathing room *outside* the green box — like `BackgroundThenPadding` above. They wrote the modifiers in the wrong order, so the green touches the outer edge with no gap. Swap the two calls in the chain to fix it.",
          ],
          starter: String.raw`import androidx.compose.foundation.background
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

@Composable
fun StatusBadge() {
    Text(
        "Confirmed",
        modifier = Modifier
            .padding(12.dp)
            .background(Color.Green),
        // your code here — swap the two lines above
    )
}`,
          solution: String.raw`import androidx.compose.foundation.background
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

@Composable
fun StatusBadge() {
    Text(
        "Confirmed",
        modifier = Modifier
            .background(Color.Green)
            .padding(12.dp),
    )
}`,
          checks: [
            { re: /Modifier\.background\(Color\.Green\)\.padding\(12\.dp\)/, hint: "Background needs to come FIRST so it paints tight, then padding adds the outer gap: `Modifier.background(Color.Green).padding(12.dp)`." },
          ],
          mustNot: [
            { re: /Modifier\.padding\(12\.dp\)\.background\(Color\.Green\)/, hint: "That's the original bug's order — padding first means the green fills the padded area too, no visible gap." },
          ],
          success: "You just fixed the single most common Compose layout bug. Whenever spacing looks wrong, read the modifier chain in order, outside-in.",
        },
      ],
    },
    // ────────────────────────────────────────────────────────────
    {
      id: "buttons-images-material3",
      title: "Buttons, Images & Material 3",
      steps: [
        {
          type: "text",
          md: [
            "## Material 3: Compose's design system",
            "The `Text` and containers you've used so far are layout primitives. **Material 3** (`androidx.compose.material3`) is the layer on top: ready-made, styled composables — `Button`, `Card`, `Icon`, `Scaffold` — that follow Google's design guidelines out of the box. PawWalk restyles their colors and type (Module 06), but the shapes and behavior come free from Material 3.",
            "A `Button` needs two things: what happens on tap, and what it looks like inside. Compose expresses \"what happens on tap\" as a **trailing lambda** — the `onClick` parameter, called with no arguments when the user taps — and \"what it looks like\" as a **trailing content lambda**, the composable(s) to draw inside the button:",
          ],
        },
        {
          type: "code",
          title: "A button and an icon",
          source: String.raw`import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

@Composable
fun BookRow() {
    Icon(Icons.Filled.Favorite, contentDescription = "Favorite", tint = Color(0xFFFF9800))
    Button(onClick = { println("Booking Maya…") }) {
        Text("Book walk")
    }
}`,
          caption: "Icon takes an icon, an accessibility contentDescription, and a tint color. Button's onClick fires the lambda on tap; the trailing braces after it are the button's own content — here, a Text label. For now the action just prints; from Module 05 on, actions will change state.",
        },
        {
          type: "text",
          md: [
            "## Card + Scaffold: bigger building blocks",
            "Two more Material 3 composables you'll meet constantly:",
            "- **`Card`** — a `Box`/`Column`-like container with a background, rounded corners, and elevation (a subtle shadow) already applied. It's how PawWalk turns a `Row` of walker info into something that reads as a distinct, tappable card.\n- **`Scaffold`** — the skeleton of an entire screen: slots for a `topBar`, a `bottomBar`, floating action buttons, and the main `content`. You hand it composables for each slot and it handles the plumbing — safe-area insets, padding around your content, the works. You'll build a real one with `TopAppBar` in a later module; for now, just recognize the name when you see it wrapping a screen.",
          ],
        },
        {
          type: "quiz",
          q: "What does Material 3 add on top of plain layout composables like Row and Column?",
          choices: [
            "Nothing — Material 3 is just a naming convention",
            "Ready-made, pre-styled composables (Button, Card, Icon, Scaffold) that follow a shared design system out of the box",
            "A replacement for Kotlin's function syntax",
            "A different way to write @Composable that's required for buttons",
          ],
          answer: 1,
          explain: "Row, Column, and Box are bare layout tools with no visual opinion. Material 3 composables like Button and Card come with built-in styling, shapes, and behavior that follow Google's design guidelines — PawWalk then customizes the colors on top.",
          nudge: "Row and Column don't have a \"look\" of their own. What layer adds one?",
        },
        {
          type: "exercise",
          title: "Wire up a booking button",
          prompt: [
            "Write a composable `BookButton` (no parameters) whose body is a `Button` whose `onClick` prints `Booked!`, containing a `Text(\"Book Maya\")`.",
          ],
          starter: String.raw`import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable

@Composable
fun BookButton() {
    // your code here
}`,
          solution: String.raw`import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable

@Composable
fun BookButton() {
    Button(onClick = { println("Booked!") }) {
        Text("Book Maya")
    }
}`,
          checks: [
            { re: /Button\(onClick=\{println\("Booked!"\)\}\)\{/, hint: "The shape is `Button(onClick = { println(\"Booked!\") }) { … }` — the tap action is the `onClick` argument, a lambda in braces." },
            { re: /Text\("Book Maya"\)/, hint: "Inside the button's trailing braces, its label: `Text(\"Book Maya\")`." },
          ],
          mustNot: [
            { re: /Button\("Book Maya"\)/, hint: "Button doesn't take a text label as a plain argument — pass `onClick` as a named parameter, and put the `Text` inside the trailing content lambda." },
          ],
          success: "onClick lambda + trailing content lambda: that's the pattern behind every tappable thing in PawWalk's Android app, from \"Log in\" to \"Book walk\".",
        },
        {
          type: "text",
          md: [
            "## From building blocks to a real screen",
            "You now know every ingredient in a real PawWalk screen: `@Composable` functions, `Row`/`Column`/`Box` for layout, `Modifier` chains for spacing and styling, and Material 3 pieces like `Button`. Here's `WalkerCard` — the actual private composable inside `WalkersScreen.kt` that renders one row of the walker list you'll browse in the finished app.",
          ],
        },
        {
          type: "code",
          title: "ui/screens/WalkersScreen.kt",
          source: String.raw`@Composable
private fun WalkerCard(c: BrandColors, walker: Walker, onClick: () -> Unit) {
    Row(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(c.canvasDeep.copy(alpha = 0.4f))
            .border(1.dp, c.ink.copy(alpha = 0.12f), RoundedCornerShape(16.dp))
            .clickable { onClick() }
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(Modifier.weight(1f)) {
            DmText(walker.name, c.ink, sizeSp = 15f, weight = FontWeight.SemiBold)
            Row(Modifier.padding(top = 5.dp)) {
                MonoText("★ ${"$"}{walker.rating}", c.ink.copy(alpha = 0.6f), sizeSp = 9f, weight = FontWeight.Normal,
                    trackingEm = 0.07f, upper = false)
                Spacer(Modifier.width(8.dp))
                MonoText(walker.priceLabel, c.accent, sizeSp = 9f, weight = FontWeight.Normal,
                    trackingEm = 0.07f, upper = false)
            }
            if (walker.bio.isNotBlank()) {
                DmText(walker.bio, c.ink.copy(alpha = 0.7f), sizeSp = 12f, modifier = Modifier.padding(top = 6.dp))
            }
            if (walker.neighborhoods.isNotEmpty()) {
                MonoText(walker.neighborhoods.joinToString(" · "), c.ink.copy(alpha = 0.45f), sizeSp = 8.5f,
                    trackingEm = 0.07f, modifier = Modifier.padding(top = 6.dp))
            }
        }
        ChevronRightIcon(c.ink.copy(alpha = 0.35f), size = 16.dp)
    }
}`,
          caption: "Read the modifier chain on the outer Row outside-in, just like you practiced: fill the width, clip to rounded corners, paint a background, draw a border, make it clickable, then pad the content — six wraps, one composable. Inside, a Column (name, rating/price row, bio, neighborhoods) takes the remaining space via `Modifier.weight(1f)`, with a chevron icon pinned at the end — the exact icon-beside-content shape you built in the WalkerRow exercise. `DmText` and `MonoText` are PawWalk's own small wrappers around `Text`, coming in Module 06.",
        },
        {
          type: "quiz",
          q: "In the real WalkerCard, what does `Modifier.weight(1f)` on the inner Column do?",
          choices: [
            "Makes the text bold",
            "Sets a fixed height of 1dp",
            "Tells the Row to give that Column all the leftover space, pushing the chevron to the far end",
            "Slows down recomposition for performance",
          ],
          answer: 2,
          explain: "`weight` inside a Row/Column works like `Spacer(Modifier.weight(1f))` from earlier in this lesson — it claims the remaining space along the main axis. Here it makes the text column flexible and the chevron icon fixed at the trailing edge.",
          nudge: "You already met a weight-like trick for pushing something to an edge — a Spacer that expands. This is the same idea applied to real content instead of an empty spacer.",
        },
      ],
    },
  ],
});
