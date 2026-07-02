// Module 06 — The HUD Design System. See FORMAT.md for the schema.
window.COURSE = window.COURSE || [];
window.COURSE.push({
  id: "design-system",
  title: "The HUD Design System",
  emoji: "✨",
  lessons: [
    // ────────────────────────────────────────────────────────────────
    {
      id: "colors-and-dark-mode",
      title: "Colors & Dark Mode",
      steps: [
        {
          type: "text",
          md: [
            "## Why PawWalk looks like PawWalk",
            "Open the app and you'll notice a consistent look: cool paper backgrounds, indigo-black text, one confident indigo accent, little uppercase labels that feel like an instrument panel. The designers called this language **Subtle HUD** — HUD as in *heads-up display*, the readouts projected in a pilot's view.",
            "That consistency isn't discipline — it's a **design system**: one file, `Theme/Brand.swift`, defines every color and font, and every screen borrows from it. Change one line there and the whole app updates. This module teaches you that file, plus the two signature components built on top of it.",
            "## First: what a hex color is",
            "Designers hand over colors as **hex codes** like `0x5B4BE0` (PawWalk's indigo accent). It's really three numbers glued together, two hex digits each: red `5B`, green `4B`, blue `E0`. Each pair is one **byte** — a value from 0 to 255. So `0x5B4BE0` means red 91, green 75, blue 224: a blue-leaning purple.",
            "> In Swift, `0x` in front of a number literal means \"this is written in hexadecimal\" — `0xFF` is just another way to write 255.",
          ],
        },
        {
          type: "code",
          title: "Theme/Brand.swift",
          source: String.raw`import SwiftUI
import UIKit

extension UIColor {
    convenience init(hex: UInt) {
        self.init(
            red: CGFloat((hex >> 16) & 0xFF) / 255,
            green: CGFloat((hex >> 8) & 0xFF) / 255,
            blue: CGFloat(hex & 0xFF) / 255,
            alpha: 1
        )
    }
}`,
          caption: "An extension adds a new initializer to UIColor — a type Apple wrote, gaining an ability we invented. Let's decode the bit tricks.",
        },
        {
          type: "text",
          md: [
            "## Pulling three bytes out of one number",
            "New faces first. An **extension** re-opens a type that already exists — even one of Apple's — and adds new abilities to it: everything inside `extension UIColor { … }` becomes part of `UIColor`, as if it had always been there. `UIKit` is Apple's *older* UI framework — we import it because its color type, `UIColor`, can do a trick SwiftUI's `Color` can't (coming up next step). `UInt` is an unsigned integer (never negative — right for raw color bits), and `CGFloat` is the decimal type Apple's graphics code uses; treat it like `Double`. The `convenience` keyword is a UIKit-class formality for an initializer that hands off to another one — you'll only ever see it here.",
            "The interesting part is how one number becomes three. Take `hex = 0x5B4BE0`:",
            "- `hex >> 16` **shifts** every bit 16 places to the right, and bits pushed off the edge just fall away. One hex digit is 4 bits, so shifting by 16 drops the last *four* hex digits: `0x5B4BE0` becomes `0x5B`. The red byte, alone.\n- `hex >> 8` drops only two digits, leaving `0x5B4B` — red *and* green stuck together.\n- `& 0xFF` is a **mask**: it keeps only the lowest byte and zeroes everything above. `0x5B4B & 0xFF` is `0x4B` — green, cleanly separated.\n- `hex & 0xFF` with no shift keeps the last byte as-is: `0xE0`, blue.",
            "Finally `/ 255` converts each 0–255 byte into the 0–1 range `UIColor` expects, and `alpha: 1` means fully opaque.",
            "> Read `(hex >> 16) & 0xFF` as one idiom: *\"slide the byte I want down to the end, then chop off everything else.\"* You'll see it in every codebase that touches hex colors.",
          ],
        },
        {
          type: "quiz",
          q: "For `hex = 0x5B4BE0`, what does `(hex >> 8) & 0xFF` produce?",
          choices: [
            "`0x5B` — the red byte",
            "`0x4B` — the green byte",
            "`0xE0` — the blue byte",
            "`0x5B4B` — red and green together",
          ],
          answer: 1,
          explain: "`>> 8` drops the last two hex digits (`E0`), leaving `0x5B4B`. Then `& 0xFF` keeps only the lowest byte: `0x4B`, the green channel.",
          nudge: "Shifting right by 8 bits removes two hex digits. What does the mask keep from what's left?",
        },
        {
          type: "code",
          title: "Theme/Brand.swift",
          source: String.raw`extension Color {
    init(hex: UInt) { self.init(UIColor(hex: hex)) }

    /// A color that resolves differently in light vs dark appearance.
    init(light: UInt, dark: UInt) {
        self.init(UIColor { trait in
            UIColor(hex: trait.userInterfaceStyle == .dark ? dark : light)
        })
    }
}`,
          caption: "Two initializers on SwiftUI's Color: a plain hex one, and the whole reason we imported UIKit.",
        },
        {
          type: "text",
          md: [
            "## Dark mode for free",
            "`Color(hex:)` is simple plumbing: build the `UIColor`, wrap it in a SwiftUI `Color`. The second initializer is the star.",
            "`UIColor { trait in … }` builds a color from a **closure** — a recipe instead of a fixed value. Every time iOS needs to actually draw the color, it calls the closure and passes `trait`, a bundle of facts about the current environment. We check one fact: `trait.userInterfaceStyle == .dark`, and pick the dark hex or the light hex accordingly.",
            "The payoff: when the user switches to Dark Mode, iOS re-asks every one of these colors for its value, the closure runs again, and **every screen restyles itself instantly**. No `if` statements in any view. No \"dark version\" of any screen. This is the trick SwiftUI's plain `Color` can't do on its own — hence the `UIColor` detour.",
          ],
        },
        {
          type: "quiz",
          q: "A user flips their iPhone to Dark Mode while PawWalk is open. What happens to a `Color(light:dark:)` value?",
          choices: [
            "Nothing until the app is relaunched",
            "The closure re-runs with the new trait and the color re-resolves automatically",
            "The app crashes unless every view handles dark mode",
            "You must call a refresh function in each view",
          ],
          answer: 1,
          explain: "The color is a recipe, not a value. iOS re-runs the closure whenever the appearance changes, so every token updates live — zero per-view code.",
          nudge: "The color was built from a closure. Who calls that closure, and when?",
        },
        {
          type: "code",
          title: "Theme/Brand.swift",
          source: String.raw`/// Semantic design tokens. Names mirror the CSS custom properties in the handoff.
enum Brand {
    // Theme-aware tokens (light → dark)
    static let canvas      = Color(light: 0xF5F3FA, dark: 0x0E0A1C)
    static let canvasDeep  = Color(light: 0xE7E4F2, dark: 0x1C1636)
    static let ink         = Color(light: 0x171327, dark: 0xECEAF7)
    static let accent      = Color(light: 0x5B4BE0, dark: 0x8E7DFF)
}`,
          caption: "Trimmed for now — the real file has four more theme-aware tokens plus four fixed \"signal\" colors. You'll add one of those yourself in a moment.",
        },
        {
          type: "text",
          md: [
            "## Tokens: names mean roles, not colors",
            "These `static let`s are the app's **design tokens** — the official, named values every screen uses. Notice what they're *not* named: there's no `lightPurple` or `almostBlack`. Instead: `canvas` (the background you paint on), `ink` (what you write with), `accent` (the one color allowed to shout). Names describe **roles**. That matters because in dark mode `ink` is nearly *white* — a name like `darkText` would become a lie twice a day.",
            "`enum Brand` with **no cases** is a common Swift trick: an enum you can never make an instance of, used purely as a namespace. Views write `Brand.canvas`, `Brand.accent` — impossible to confuse with anything else, and `static let` means one shared constant, created once.",
            "> A tiny sidecar file, `Theme/Theme.swift`, holds one legacy alias — `static let brand = Brand.accent` on `Color` — so older code that says `Color.brand` still compiles. Design systems accumulate history too.",
            "Alongside the theme-aware tokens live four **fixed signal colors** — identical in both themes, because they carry meaning: `signalGreen` (a walk in progress), `signalGreenSoft` (its gentler companion), `pinAmber` (a booking still pending), and `pinBlue` (a map-pin blue from the design handoff, waiting in the palette). Your turn to add one.",
          ],
        },
        {
          type: "exercise",
          title: "Add the pinAmber token",
          prompt: [
            "A booking that's still waiting for a walker shows a **pending** badge, tinted amber. Add that token to `Brand`: call it `pinAmber`, with hex value `0xC68A1E`.",
            "It's a fixed signal color — identical in light and dark — so use the single-hex `Color(hex:)` initializer, not the two-argument one.",
          ],
          starter: String.raw`enum Brand {
    static let accent = Color(light: 0x5B4BE0, dark: 0x8E7DFF)
    // your code here
}`,
          solution: String.raw`enum Brand {
    static let accent = Color(light: 0x5B4BE0, dark: 0x8E7DFF)
    static let pinAmber = Color(hex: 0xC68A1E)
}`,
          checks: [
            { re: /static let pinAmber(:Color)?=/, hint: "Tokens are shared constants on the namespace — start with `static let pinAmber`." },
            { re: /pinAmber(:Color)?=Color\(hex:0xC68A1E\)/i, hint: "Use the one-argument initializer with a Swift hex literal: the label is `hex:` and the number starts with `0x` — no quotes." },
          ],
          mustNot: [
            { re: /pinAmber(:Color)?=Color\(light:/, hint: "`pinAmber` looks the same in both themes — `Color(light:dark:)` is only for tokens that change with the appearance." },
          ],
          success: "That's the real token from Brand.swift — every PENDING badge in the bookings screens gets its amber from your line.",
        },
      ],
    },
    // ────────────────────────────────────────────────────────────────
    {
      id: "typography",
      title: "Typography: DM Sans & JetBrains Mono",
      steps: [
        {
          type: "text",
          md: [
            "## Two typefaces, two jobs",
            "By default, every `Text` in SwiftUI uses the **system font** — San Francisco, the typeface of iOS itself. It's excellent, and it's also what every default-looking app uses. PawWalk ships its own two:",
            "- **DM Sans** — the display face: headings, buttons, body copy. Friendly, geometric.\n- **JetBrains Mono** — a *monospaced* face (every character the same width), used for readouts: coordinates, distances, timers, those uppercase HUD labels. Monospace is why numbers don't jiggle as a timer ticks.",
            "A custom font is just files shipped inside the app (this repo already wires them up in the project config). Swift loads one with `Font.custom(name, size:)`, where `name` is the font's internal name like `\"DMSans-Bold\"`. One catch: **every weight is a separate file** — there's no bold switch, only a differently-named font. Which is exactly the problem the next code solves.",
          ],
        },
        {
          type: "code",
          title: "Theme/Brand.swift",
          source: String.raw`extension Font {
    /// DM Sans — display / UI sans.
    static func dm(_ size: CGFloat, _ weight: Font.Weight = .regular) -> Font {
        let name: String
        switch weight {
        case .bold:               name = "DMSans-Bold"
        case .semibold:           name = "DMSans-SemiBold"
        case .medium:             name = "DMSans-Medium"
        default:                  name = "DMSans-Regular"
        }
        return .custom(name, size: size)
    }

    /// JetBrains Mono — readouts, coordinates, labels.
    static func mono(_ size: CGFloat, _ weight: Font.Weight = .regular) -> Font {
        let name: String
        switch weight {
        case .semibold, .bold:    name = "JetBrainsMono-SemiBold"
        case .medium:             name = "JetBrainsMono-Medium"
        default:                  name = "JetBrainsMono-Regular"
        }
        return .custom(name, size: size)
    }
}`,
          caption: "Two static functions on Font. Everywhere else in the app, fonts are just `.dm(17)` or `.mono(11, .semibold)`.",
        },
        {
          type: "text",
          md: [
            "## Reading the helpers",
            "They're `static func` rather than `static let` because a font needs arguments — a size at minimum. Both parameters use `_` so calls skip labels (`.dm(17, .bold)`, not `.dm(size: 17, weight: .bold)`), and `weight` has a **default value** of `.regular`, so `.dm(17)` alone works too.",
            "`Font.Weight` is SwiftUI's weight type — values like `.regular`, `.medium`, `.semibold`, `.bold`. The `switch` translates each weight into the matching font *file* name, with `default:` catching anything unlisted and falling back to Regular.",
            "One deliberate quirk in `mono`: the line `case .semibold, .bold:` handles **two** weights at once. The app doesn't ship a JetBrains Mono *Bold* file, so asking for `.bold` quietly gets you SemiBold — the heaviest cut that exists. Better than a crash or a silent fallback to the system font.",
          ],
        },
        {
          type: "quiz",
          q: "Which font name does `Font.mono(14, .bold)` resolve to?",
          choices: [
            "`JetBrainsMono-Bold`",
            "`JetBrainsMono-SemiBold`",
            "`JetBrainsMono-Regular`",
            "`DMSans-Bold`",
          ],
          answer: 1,
          explain: "The switch lists `.semibold` and `.bold` in the same case: no Bold file ships, so both map to `JetBrainsMono-SemiBold`.",
          nudge: "Look at the first case in `mono`'s switch — how many weights share it?",
        },
        {
          type: "text",
          md: [
            "## Tracking: air between the letters",
            "The HUD labels don't just use a mono font — they're spaced out, like text etched on an instrument. That's **tracking** (designers say *letter-spacing*): extra distance inserted between every pair of characters. SwiftUI's modifier is `.tracking(_:)`, and the number is in **points** — `.tracking(2)` pushes each letter 2 points from the next.",
            "The design handoff, though, specified tracking the CSS way: `0.12em`. An **em** is relative — it means *12% of whatever the font size is*. That keeps the spacing visually proportional: airy at size 10, equally airy at size 20. Points are absolute; ems scale.",
            "The bridge between the two worlds is one multiplication: `em value × font size = points`. At size 10, `0.12em` is 1.2 points; at size 20 it's 2.4. You'll see exactly this multiplication baked into `MonoCaption` next lesson — now you know why it's there.",
          ],
        },
        {
          type: "quiz",
          q: "A label uses font size 20 and the design calls for `0.12em` tracking. What do you pass to `.tracking(_:)`?",
          choices: ["0.12", "2.4", "12", "20.12"],
          answer: 1,
          explain: "Ems are relative to font size: 0.12 × 20 = 2.4 points. The same 0.12 at size 10 would be 1.2 points — proportion preserved.",
          nudge: "Em × size = points. What's 0.12 × 20?",
        },
        {
          type: "exercise",
          title: "Style a HUD readout",
          prompt: [
            "Here's a stat readout for the Home screen. Style the `Text` with two modifiers, in this order:",
            "1. JetBrains Mono at size 12, semibold — via the `.mono` helper inside `.font(…)`.\n2. Em-relative tracking of 0.12, written as the multiplication `0.12 * 12`.",
          ],
          starter: String.raw`struct WalkStat: View {
    var body: some View {
        Text("12 WALKS")
        // your code here
    }
}`,
          solution: String.raw`struct WalkStat: View {
    var body: some View {
        Text("12 WALKS")
            .font(.mono(12, .semibold))
            .tracking(0.12 * 12)
    }
}`,
          checks: [
            { re: /\.font\((Font)?\.mono\(12,\.semibold\)\)/, hint: "Use the helper from Brand.swift inside `.font(…)` — `.mono` takes the size first, then the weight (with its leading dot)." },
            { re: /\.tracking\(0\.12\*12\)/, hint: "Convert ems to points right in the call: multiply `0.12` by the size, `12`." },
          ],
          mustNot: [
            { re: /\.tracking\(0\.12\)/, hint: "`0.12` alone is 0.12 *points* — invisible. Multiply the em value by the font size." },
          ],
          success: "That's the exact recipe every HUD readout in PawWalk uses — mono, semibold, and letter-spacing that scales with the font.",
        },
      ],
    },
    // ────────────────────────────────────────────────────────────────
    {
      id: "hud-components",
      title: "Building HUD Components",
      steps: [
        {
          type: "text",
          md: [
            "## Don't repeat the recipe — bottle it",
            "Last lesson's exercise took three lines to style one label. PawWalk has *dozens* of those labels — booking statuses, GPS coordinates, section headers. Retyping the recipe everywhere invites drift: someone forgets the tracking, someone types 0.21, and the design quietly falls apart.",
            "The fix is the heart of SwiftUI: **make it a component**. You've built view structs since Module 04 — a component is just a view struct designed for reuse: properties for everything callers might want to change, **default values** for everything they usually won't. Call it with one argument and get the standard look; override a property when a screen needs an exception.",
            "`Components/HUD.swift` holds the two signature HUD components. First, the label you already know how to style.",
          ],
        },
        {
          type: "code",
          title: "Components/HUD.swift",
          source: String.raw`/// Uppercase mono caption — the recurring coordinate/label style.
struct MonoCaption: View {
    let text: String
    var size: CGFloat = 10
    var weight: Font.Weight = .medium
    var tracking: CGFloat = 0.12
    var color: Color = Brand.ink.opacity(0.6)

    init(_ text: String, size: CGFloat = 10, weight: Font.Weight = .medium,
         tracking: CGFloat = 0.12, color: Color = Brand.ink.opacity(0.6)) {
        self.text = text; self.size = size; self.weight = weight
        self.tracking = tracking; self.color = color
    }

    var body: some View {
        Text(text.uppercased())
            .font(.mono(size, weight))
            .tracking(tracking * size)   // CSS letter-spacing is em-relative
            .foregroundStyle(color)
    }
}`,
          caption: "One required property (`text`), four with defaults. `MonoCaption(\"distance\")` is the whole call site.",
        },
        {
          type: "text",
          md: [
            "## MonoCaption, line by line",
            "- **The properties.** Only `text` is required. The rest carry the house defaults: size 10, `.medium`, `0.12em` tracking, and `Brand.ink.opacity(0.6)` — the ink token at 60% opacity, giving that quiet, secondary look (`.opacity` on a `Color` returns a translucent copy).\n- **Why the hand-written `init`?** Its first parameter is `_ text` — no label — so callers write `MonoCaption(\"gps signal\")` instead of `MonoCaption(text: \"gps signal\")`. That tiny ergonomic win is the init's only job; the rest is copying parameters onto `self`.\n- **`text.uppercased()`** — the view shouts so callers don't have to. Screens pass normal text; the HUD style is applied in exactly one place.\n- **`.tracking(tracking * size)`** — last lesson's em-to-points multiplication, now baked in. Change `size` and the spacing scales with it.\n- **`.foregroundStyle(color)`** — sets the text color. It's the modern SwiftUI modifier for \"what color is this content drawn in.\"",
          ],
        },
        {
          type: "quiz",
          q: "What does `MonoCaption(\"gps signal\")` render on screen?",
          choices: [
            "gps signal",
            "GPS SIGNAL",
            "Gps Signal",
            "Nothing — `text:` label is missing, so it won't compile",
          ],
          answer: 1,
          explain: "The body calls `text.uppercased()`, so every caption is uppercase no matter what callers pass. And the custom init's unlabeled first parameter is what makes the label-free call compile.",
          nudge: "Look at what `body` does to `text` before displaying it.",
        },
        {
          type: "exercise",
          title: "Rebuild MonoCaption's body",
          prompt: [
            "The struct and init are given. Write the four-line `body`: display `text` uppercased, give it the mono font using the stored `size` and `weight`, apply em-relative tracking (the stored `tracking` times `size`, in that order), and set the foreground style to the stored `color`.",
          ],
          starter: String.raw`struct MonoCaption: View {
    let text: String
    var size: CGFloat = 10
    var weight: Font.Weight = .medium
    var tracking: CGFloat = 0.12
    var color: Color = Brand.ink.opacity(0.6)

    init(_ text: String, size: CGFloat = 10, weight: Font.Weight = .medium,
         tracking: CGFloat = 0.12, color: Color = Brand.ink.opacity(0.6)) {
        self.text = text; self.size = size; self.weight = weight
        self.tracking = tracking; self.color = color
    }

    var body: some View {
        // your code here
    }
}`,
          solution: String.raw`struct MonoCaption: View {
    let text: String
    var size: CGFloat = 10
    var weight: Font.Weight = .medium
    var tracking: CGFloat = 0.12
    var color: Color = Brand.ink.opacity(0.6)

    init(_ text: String, size: CGFloat = 10, weight: Font.Weight = .medium,
         tracking: CGFloat = 0.12, color: Color = Brand.ink.opacity(0.6)) {
        self.text = text; self.size = size; self.weight = weight
        self.tracking = tracking; self.color = color
    }

    var body: some View {
        Text(text.uppercased())
            .font(.mono(size, weight))
            .tracking(tracking * size)
            .foregroundStyle(color)
    }
}`,
          checks: [
            { re: /Text\(text\.uppercased\(\)\)/, hint: "Uppercase happens inside the view — call `.uppercased()` on `text` right inside `Text(…)`." },
            { re: /\.font\((Font)?\.mono\(size,weight\)\)/, hint: "Pass the *stored properties* straight into the helper: `.mono(size, weight)`." },
            { re: /\.tracking\(tracking\*size\)/, hint: "Same em trick as last lesson, but with the stored values: `tracking` multiplied by `size`." },
            { re: /\.foregroundStyle\(color\)/, hint: "Finish with the color — the modifier is `.foregroundStyle(…)`, taking the stored `color`." },
          ],
          mustNot: [
            { re: /Text\(text\)/, hint: "Displaying raw `text` skips the HUD's signature UPPERCASE — call `.uppercased()` on it." },
          ],
          success: "Character for character, that's the shipping body from Components/HUD.swift. Every little label in the app is now yours.",
        },
        {
          type: "code",
          title: "Components/HUD.swift",
          source: String.raw`/// A status dot with an expanding "radar" pulse ring — the HUD's signature element.
struct PulsingDot: View {
    var color: Color
    var size: CGFloat = 8
    @State private var animate = false

    var body: some View {
        ZStack {
            Circle()
                .fill(color)
                .scaleEffect(animate ? 1.9 : 1.0)
                .opacity(animate ? 0 : 0.22)
            Circle().fill(color)
        }
        .frame(width: size, height: size)
        .onAppear {
            withAnimation(.easeOut(duration: 1.9).repeatForever(autoreverses: false)) {
                animate = true
            }
        }
    }
}`,
          caption: "The glowing status dot next to \"walk in progress\" — you glimpsed it back in Module 04 as a ZStack mystery. Now read the body top to bottom; we'll decode the .onAppear block next lesson.",
        },
        {
          type: "text",
          md: [
            "## PulsingDot, line by line",
            "- **Properties.** `color` is required — the dot signals different things in different colors (`Brand.signalGreen` for an active walk). `size` defaults to 8 points. `animate` is a private `@State` flag — the animation's on-switch, false at birth.\n- **`ZStack`** stacks its children on top of each other — later children draw *on top*. So the second `Circle` (the solid dot) sits above the first (the pulse ring).\n- **`Circle()`** is a built-in shape; `.fill(color)` paints it.\n- **`.scaleEffect(animate ? 1.9 : 1.0)`** visually scales a view — 1.9 means 190%. The `condition ? a : b` form is Swift's one-line if/else: 1.9 when `animate` is true, 1.0 otherwise. Crucially, `scaleEffect` doesn't change layout — the ring can balloon past the frame without shoving neighbors around.\n- **`.opacity(animate ? 0 : 0.22)`** — the ring starts at a faint 22% opacity and ends fully invisible.\n- **`.frame(width: size, height: size)`** pins the whole stack to an 8×8 footprint.",
            "So the body describes **two poses** — and here's the twist: *you can't see the ring in either one*. `animate == false`: the ring is dot-sized, hidden exactly behind the solid dot. `animate == true`: blown up to 1.9× but fully transparent. The radar pulse you actually see is every frame *in between* — the trip from pose one to pose two, played smoothly and forever. That trip is the `.onAppear` block, and it's the whole next lesson.",
          ],
        },
        {
          type: "quiz",
          q: "In the `animate == true` pose, what has happened to the *first* Circle in the ZStack?",
          choices: [
            "It grew to 1.9× and faded to invisible — the ring dissolving outward",
            "It shrank to 0.22× of its size",
            "It turned solid and covers the dot",
            "Nothing — only the second Circle changes",
          ],
          answer: 0,
          explain: "Both ternaries flip together: scale 1.0 → 1.9 while opacity 0.22 → 0. Grown *and* gone — animate between the poses and you get an expanding, fading pulse.",
          nudge: "Check both modifiers on the first Circle — what does each do when `animate` is true?",
        },
      ],
    },
    // ────────────────────────────────────────────────────────────────
    {
      id: "animation",
      title: "A Taste of Animation",
      steps: [
        {
          type: "text",
          md: [
            "## You don't animate views — you animate change",
            "Here's SwiftUI animation in one sentence: **change some state inside `withAnimation { … }`, and SwiftUI smoothly plays the difference instead of jumping.** You already know the first half — flip a `@State` value and the view re-renders. Wrapped in `withAnimation`, that re-render becomes a movie: every affected value (scale, opacity, position…) glides from old to new.",
            "`withAnimation` takes an animation description saying *how* to glide:",
            "- **`.easeOut(duration: 1.9)`** — an *easing curve*: start fast, slow to a gentle stop, the whole trip taking 1.9 seconds. (Its siblings: `.linear` moves robotically evenly, `.easeIn` starts slow.) Ease-out is right for a radar ping — it bursts outward, then dies away.\n- **`.repeatForever(autoreverses: false)`** — chain this on and the animation replays endlessly. `autoreverses` decides the loop style: `true` plays it backwards to return (breathing in, breathing out); `false` snaps back to the start and plays forward again (a radar sweep, always outward).",
          ],
        },
        {
          type: "code",
          title: "Components/HUD.swift",
          source: String.raw`struct PulsingDot: View {
    var color: Color
    var size: CGFloat = 8
    @State private var animate = false

    var body: some View {
        ZStack {
            Circle()
                .fill(color)
                .scaleEffect(animate ? 1.9 : 1.0)
                .opacity(animate ? 0 : 0.22)
            Circle().fill(color)
        }
        .frame(width: size, height: size)
        .onAppear {
            withAnimation(.easeOut(duration: 1.9).repeatForever(autoreverses: false)) {
                animate = true
            }
        }
    }
}`,
          caption: "PulsingDot one more time — eyes on the last six lines of body.",
        },
        {
          type: "text",
          md: [
            "## The flag-flip pattern",
            "`.onAppear { … }` runs its closure once, the moment the view lands on screen — it's the plain cousin of `.task`, which you've used for async work. Perfect for \"start the engine\" moments like this.",
            "Now the pattern, and it's *the* idiom for ambient animation in SwiftUI:",
            "1. A `@State` flag starts `false`. The body's ternaries define pose A (`false`: scale 1.0, opacity 0.22) and pose B (`true`: scale 1.9, opacity 0).\n2. In `onAppear`, flip the flag to `true` — inside `withAnimation`.\n3. SwiftUI animates A → B over 1.9 seconds; `.repeatForever(autoreverses: false)` replays that outward trip endlessly.",
            "Why must the flag start `false` and flip *after* appearing? Because animation needs a **before and after**. If `animate` were born `true`, the view's first frame would already be pose B — nothing changes, nothing animates. The flip is what hands SwiftUI a difference to play.",
          ],
        },
        {
          type: "quiz",
          q: "What would change if PulsingDot used `.repeatForever(autoreverses: true)`?",
          choices: [
            "Nothing — autoreverses only affects the first loop",
            "The ring would grow, then shrink back down — breathing instead of a radar pulse",
            "The animation would play exactly once",
            "The dot itself would start blinking",
          ],
          answer: 1,
          explain: "`autoreverses: true` plays the animation backwards to get back to the start — grow, shrink, grow, shrink. With `false`, it snaps to pose A and bursts outward again: always-outward radar.",
          nudge: "Reverse means the return trip is *played*, not skipped. What does a played return trip look like here?",
        },
        {
          type: "exercise",
          title: "Type the pulse",
          prompt: [
            "The poses are written; the engine is missing. Below `.frame`, add the `.onAppear` block: inside it, a `withAnimation` using `.easeOut` with a `duration:` of 1.9, chained with `.repeatForever(autoreverses: false)` — and in its closure, set `animate` to `true`.",
          ],
          starter: String.raw`struct PulsingDot: View {
    var color: Color
    var size: CGFloat = 8
    @State private var animate = false

    var body: some View {
        ZStack {
            Circle()
                .fill(color)
                .scaleEffect(animate ? 1.9 : 1.0)
                .opacity(animate ? 0 : 0.22)
            Circle().fill(color)
        }
        .frame(width: size, height: size)
        // your code here
    }
}`,
          solution: String.raw`struct PulsingDot: View {
    var color: Color
    var size: CGFloat = 8
    @State private var animate = false

    var body: some View {
        ZStack {
            Circle()
                .fill(color)
                .scaleEffect(animate ? 1.9 : 1.0)
                .opacity(animate ? 0 : 0.22)
            Circle().fill(color)
        }
        .frame(width: size, height: size)
        .onAppear {
            withAnimation(.easeOut(duration: 1.9).repeatForever(autoreverses: false)) {
                animate = true
            }
        }
    }
}`,
          checks: [
            { re: /\.onAppear(\(\))?\{/, hint: "Start the engine when the view appears — the modifier takes a closure in braces." },
            { re: /withAnimation\(\.easeOut\(duration:1\.9\)/, hint: "Wrap the state change in `withAnimation(…)`, handing it `.easeOut` with a labeled `duration:` of 1.9." },
            { re: /\.repeatForever\(autoreverses:false\)/, hint: "Chain `.repeatForever(…)` onto the easing, telling it not to reverse — a radar pulse never shrinks back." },
            { re: /animate=true/, hint: "Inside `withAnimation`'s closure, flip the flag: that state change is the thing being animated." },
          ],
          mustNot: [
            { re: /autoreverses:true/, hint: "With `true` the ring would breathe in and out. The radar look needs the loop to restart from the center — `false`." },
          ],
          success: "That's the signature animation of the entire app — every glowing status dot in PawWalk runs the six lines you just typed.",
        },
        {
          type: "xcode",
          title: "Watch the HUD live",
          intro: [
            "Everything from this module already ships in the app. Go watch your design system move:",
          ],
          items: [
            "Terminal tab 1: `cd apps/backend && uv run fastapi dev` — leave it running.",
            "Terminal tab 2: `cd apps/ios && xcodegen generate && open PawWalk.xcodeproj`, then press **⌘R**.",
            "Log in and tour the Home and booking screens — every small uppercase label is a `MonoCaption`; the glowing dot beside an in-progress walk is a `PulsingDot` in `Brand.signalGreen`.",
            "In the Simulator, press **⇧⌘A** to toggle Dark Mode. Watch the whole app restyle instantly — that's your `Color(light:dark:)` closures re-running with the new trait.",
          ],
        },
      ],
    },
  ],
});
