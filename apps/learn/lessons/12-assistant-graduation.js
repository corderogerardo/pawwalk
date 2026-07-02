// Module 12 — The AI Assistant & Graduation. See FORMAT.md for the schema.
window.COURSE = window.COURSE || [];
window.COURSE.push({
  id: "assistant-graduation",
  title: "The AI Assistant & Graduation",
  emoji: "🎓",
  lessons: [
    // ────────────────────────────────────────────────────────────────────
    {
      id: "assistant-brain",
      title: "The Assistant's Brain",
      steps: [
        {
          type: "text",
          md: [
            "## The last feature",
            "PawWalk has one screen we haven't opened yet: the **Assistant** — a little chat where an owner types *\"a walker in the Mission for my husky tomorrow at 3pm\"* and gets back suggested walkers they can book with one tap.",
            "Here's the good news for your final module: there is **nothing new** in it. The AI lives on the backend (`POST /assistant/chat` parses the sentence and picks walkers). The app's job is the same loop you've built eleven times: send a request, decode `Codable` JSON, keep state in an `@Observable` view model, render it in SwiftUI.",
            "So this module is a victory lap. You'll read the two real files behind the screen — `AssistantViewModel.swift` and `AssistantView.swift` — and recognize every single line.",
          ],
        },
        {
          type: "code",
          title: "Models/Models.swift (assistant section)",
          source: String.raw`struct AssistantChatRequest: Codable {
    let message: String
}

struct AssistantReply: Codable {
    let reply: String
    let suggestedWalkers: [String]
    let draftBooking: DraftBooking?

    enum CodingKeys: String, CodingKey {
        case reply
        case suggestedWalkers = "suggested_walkers"
        case draftBooking = "draft_booking"
    }
}`,
          caption: "The same CodingKeys dance you've done since Module 3: snake_case JSON in, camelCase Swift out. (DraftBooking — walker, time, duration — is defined just above in the same file.)",
        },
        {
          type: "quiz",
          q: "`suggestedWalkers` is `[String]`, not `[Walker]`. What are those strings?",
          choices: [
            "Walker names, ready to show on screen",
            "Walker IDs — the app looks each one up in the walkers it already fetched",
            "URLs of walker profile photos",
            "Raw JSON blobs the view has to decode again",
          ],
          answer: 1,
          explain: "The backend sends just IDs and keeps the payload tiny. The view model already called `/walkers` once and stashed every walker in a dictionary keyed by ID — so turning an ID into a full record (name, rating, price) is one dictionary lookup.",
          nudge: "Think about what's cheapest for the backend to send, given the app already knows how to fetch walkers.",
        },
        {
          type: "code",
          title: "Features/Assistant/AssistantViewModel.swift",
          source: String.raw`import Foundation
import Observation

@MainActor
@Observable
final class AssistantViewModel {
    struct Message: Identifiable {
        let id = UUID()
        let fromUser: Bool
        let text: String
        /// Walkers the assistant suggested for this reply (resolved to real records).
        var walkers: [Walker] = []
    }

    private(set) var messages: [Message] = [
        Message(fromUser: false,
                text: "Hi! Tell me where and when you need a walk — e.g. \"a walker in the Mission for my husky tomorrow at 3pm\".")
    ]
    private(set) var isSending = false

    private var walkersByID: [String: Walker] = [:]

    func loadWalkers() async {
        guard walkersByID.isEmpty else { return }
        let walkers = (try? await APIClient.shared.walkers()) ?? []
        walkersByID = Dictionary(uniqueKeysWithValues: walkers.map { ($0.id, $0) })
    }

    func send(_ text: String) async {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, !isSending else { return }
        messages.append(Message(fromUser: true, text: trimmed))
        isSending = true
        defer { isSending = false }
        do {
            let reply = try await APIClient.shared.assistantChat(message: trimmed)
            let walkers = reply.suggestedWalkers.compactMap { walkersByID[$0] }
            messages.append(Message(fromUser: false, text: reply.reply, walkers: walkers))
        } catch {
            messages.append(Message(fromUser: false,
                                    text: "Sorry — I couldn't reach the assistant. Try again."))
        }
    }
}`,
          caption: "Forty lines, and you know every trick in them: @Observable + @MainActor (Module 5), async/await + do/catch (Module 7), a transcript that's just an array of Identifiable structs.",
        },
        {
          type: "text",
          md: [
            "## Reading it like a senior dev",
            "**`Message` is nested inside the view model** — it only exists to describe this transcript, so it lives with it. `let id = UUID()` mints a fresh unique ID per bubble, which is all `Identifiable` needs for `ForEach` to tell bubbles apart.",
            "**`private(set)`** on `messages` and `isSending` means the view can *read* them (to draw bubbles and the spinner) but only the view model can *change* them. One-way traffic keeps state predictable.",
            "**`loadWalkers()` runs once.** The `guard walkersByID.isEmpty else { return }` line makes repeat calls free — the walkers are cached in `walkersByID: [String: Walker]` for instant ID lookups later.",
            "**`send` appends the user's bubble *before* the network call.** The chat feels instant even on slow Wi-Fi. Then `isSending = true` shows the spinner, and `defer { isSending = false }` guarantees it turns off. On failure, `catch` appends an apology bubble instead of crashing — the same graceful-failure habit from Module 7.",
            "And the network call itself? `APIClient.assistantChat` is a one-liner: `try await post(path: \"assistant/chat\", body: AssistantChatRequest(message: message), authorized: true)` — the same `post` helper and bearer token you built in Modules 7 and 8.",
          ],
        },
        {
          type: "quiz",
          q: "In `send`, right after `isSending = true` comes `defer { isSending = false }`. When does that closing line actually run?",
          choices: [
            "Immediately, right after being declared",
            "When `send` exits — by any path, normal return or a thrown error",
            "Only if the request succeeds",
            "Only inside the catch block",
          ],
          answer: 1,
          explain: "`defer` schedules work for the moment the surrounding scope exits, no matter which door it leaves through. Success appends a reply and returns; a dead network jumps to `catch` and returns — either way the spinner stops. Without `defer` you'd have to remember to write `isSending = false` on every exit path.",
          nudge: "`defer` means \"do this on the way out\" — the question is *which* ways out it covers.",
        },
        {
          type: "exercise",
          title: "Resolve IDs to walkers",
          prompt: [
            "Time to type the cleverest line in the file. After decoding `reply`, add **one line** that turns `reply.suggestedWalkers` (an array of walker ID strings) into full `Walker` records using the `walkersByID` dictionary. Store the result in a constant named `walkers` — the `messages.append` line below expects that name.",
            "Use `compactMap`, because a dictionary lookup returns an *optional*: an ID the app doesn't know (say, a walker added a second ago) comes back `nil`, and `compactMap` quietly drops those instead of crashing.",
          ],
          starter: String.raw`do {
    let reply = try await APIClient.shared.assistantChat(message: trimmed)
    // your code here — one line
    messages.append(Message(fromUser: false, text: reply.reply, walkers: walkers))
} catch {
    messages.append(Message(fromUser: false,
                            text: "Sorry — I couldn't reach the assistant. Try again."))
}`,
          solution: String.raw`do {
    let reply = try await APIClient.shared.assistantChat(message: trimmed)
    let walkers = reply.suggestedWalkers.compactMap { walkersByID[$0] }
    messages.append(Message(fromUser: false, text: reply.reply, walkers: walkers))
} catch {
    messages.append(Message(fromUser: false,
                            text: "Sorry — I couldn't reach the assistant. Try again."))
}`,
          checks: [
            { re: /let walkers(:\[Walker\])?=/, hint: "Store the result in a constant named `walkers` — the append line below uses that exact name." },
            { re: /reply\.suggestedWalkers\.compactMap/, hint: "Call `compactMap` directly on `reply.suggestedWalkers`." },
            { re: /walkersByID\[/, hint: "Inside the closure, look each ID up in the `walkersByID` dictionary with subscript brackets." },
          ],
          mustNot: [
            { re: /\.map\{/, hint: "Plain `map` would give you `[Walker?]` — lookups can miss. Use `compactMap` to drop the nils." },
          ],
          success: "That's the exact line shipping in AssistantViewModel.swift. One dictionary, one compactMap, and ID strings become bookable walkers.",
        },
      ],
    },
    // ────────────────────────────────────────────────────────────────────
    {
      id: "chat-ui",
      title: "The Chat UI",
      steps: [
        {
          type: "text",
          md: [
            "## One screen, three parts",
            "`AssistantView` is a `NavigationStack` holding a `ZStack`: the `Brand.canvas` color fills the back, and in front sits a `VStack` of two pieces — `transcript` (the scrolling bubbles) on top and `inputBar` (text field + send button) pinned below. A **Done** toolbar button dismisses the sheet, and `.task { await model.loadWalkers() }` warms the walker cache the moment the screen appears.",
            "There's one small tool you haven't met: **`ScrollViewReader`**. It wraps a `ScrollView` and hands you a `proxy` that can jump to any view inside it by ID — exactly what a chat needs to keep the newest bubble in sight.",
          ],
        },
        {
          type: "code",
          title: "Features/Assistant/AssistantView.swift (transcript)",
          source: String.raw`private var transcript: some View {
    ScrollViewReader { proxy in
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                ForEach(model.messages) { message in
                    bubble(message).id(message.id)
                }
                if model.isSending {
                    ProgressView().padding(.leading, 4)
                }
            }
            .padding(16)
        }
        .onChange(of: model.messages.count) {
            if let last = model.messages.last { withAnimation { proxy.scrollTo(last.id, anchor: .bottom) } }
        }
    }
}`,
          caption: "Each bubble is tagged with `.id(message.id)` — the same UUID the Message struct minted — so the proxy can find it. `model.isSending` doubles as the typing indicator.",
        },
        {
          type: "quiz",
          q: "What does the `.onChange(of: model.messages.count)` block do?",
          choices: [
            "Re-sends the last message whenever the count changes",
            "Every time a message is added, it animates the scroll down to the newest bubble",
            "It tells ForEach how many rows to build",
            "It scrolls to the top when the screen first appears",
          ],
          answer: 1,
          explain: "Appending a message changes `messages.count`, which fires the closure; `proxy.scrollTo(last.id, anchor: .bottom)` then scrolls the tagged bubble into view, wrapped in `withAnimation` so it glides instead of jumping. State change → UI reaction, the loop you've relied on since Module 5.",
          nudge: "The proxy from ScrollViewReader is right there — what's the one thing a chat must do when a new bubble arrives?",
        },
        {
          type: "code",
          title: "Features/Assistant/AssistantView.swift (bubble + chips)",
          source: String.raw`@ViewBuilder
private func bubble(_ message: AssistantViewModel.Message) -> some View {
    VStack(alignment: message.fromUser ? .trailing : .leading, spacing: 6) {
        Text(message.text)
            .font(.dm(14))
            .foregroundStyle(message.fromUser ? Brand.onInverse : Brand.ink)
            .padding(.horizontal, 14).padding(.vertical, 10)
            .background(message.fromUser ? Brand.accent : Brand.canvasDeep)
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        if !message.walkers.isEmpty {
            ForEach(message.walkers) { walker in
                Button { bookingWalker = walker } label: {
                    HStack(spacing: 8) {
                        Image(systemName: "pawprint.fill").font(.system(size: 12))
                        Text(walker.name).font(.dm(13, .semibold))
                        Text(String(format: "★ %.1f", walker.rating)).font(.mono(11))
                        Spacer()
                        Text("Book").font(.dm(12, .semibold)).foregroundStyle(Brand.accent)
                    }
                    .foregroundStyle(Brand.ink)
                    .padding(.horizontal, 12).frame(height: 44)
                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(Brand.accent.opacity(0.4), lineWidth: 1))
                }
            }
        }
    }
    .frame(maxWidth: .infinity, alignment: message.fromUser ? .trailing : .leading)
}`,
          caption: "One ternary on `fromUser` flips everything — alignment, text color, bubble color. Your messages sit right in accent orange; the assistant's sit left on the deep canvas. All Brand tokens from Module 6.",
        },
        {
          type: "text",
          md: [
            "## Closing the loop: chip → booking",
            "Each suggested walker renders as a tappable chip, and the chip's action is a single assignment: `bookingWalker = walker`.",
            "Up in `body`, `.sheet(item: $bookingWalker) { walker in CreateBookingView(walker: walker) { _ in bookingWalker = nil } }` watches that optional `@State`. The moment it becomes non-nil, the booking form slides up *for that walker* — and when booking finishes, the completion sets it back to `nil`, which dismisses the sheet. State drives presentation; nobody calls `show()` or `dismiss()` on anything.",
            "That's the whole product loop in one gesture: ask in plain English → assistant suggests → tap → book → the walk shows up in your bookings list.",
          ],
        },
        {
          type: "exercise",
          title: "Wire the send button",
          prompt: [
            "Last exercise of the course: the send button's action, three lines, in order.",
            "1. Copy `draft` into a constant named `text`.\n2. Clear `draft` by assigning it an empty string — the field empties instantly.\n3. Start a `Task` that awaits `model.send`, passing it the **copy**.",
            "Why copy first? `send` runs *later*, asynchronously — by the time it reads anything, `draft` is already empty. The copy freezes the message before the field is wiped.",
          ],
          starter: String.raw`Button {
    // your code here — three lines
} label: {
    Image(systemName: "arrow.up")
        .font(.system(size: 16, weight: .semibold))
        .foregroundStyle(Brand.onInverse)
        .frame(width: 42, height: 42)
        .background(Brand.accent, in: Circle())
}
.disabled(draft.trimmingCharacters(in: .whitespaces).isEmpty || model.isSending)`,
          solution: String.raw`Button {
    let text = draft
    draft = ""
    Task { await model.send(text) }
} label: {
    Image(systemName: "arrow.up")
        .font(.system(size: 16, weight: .semibold))
        .foregroundStyle(Brand.onInverse)
        .frame(width: 42, height: 42)
        .background(Brand.accent, in: Circle())
}
.disabled(draft.trimmingCharacters(in: .whitespaces).isEmpty || model.isSending)`,
          checks: [
            { re: /let text(:String)?=draft/, hint: "First: save `draft` into a constant named `text` — you're about to erase the field." },
            { re: /draft=""/, hint: "Second: assign the empty string to `draft` so the text field clears right away." },
            { re: /Task\{await/, hint: "Third: `send` is async, and a button action isn't — wrap the call in a `Task { await … }`." },
            { re: /model\.send\(text\)/, hint: "Pass the frozen copy to `model.send`." },
          ],
          mustNot: [
            { re: /model\.send\(draft\)/, hint: "You just cleared `draft` — by the time `send` runs it's empty. Send the copy instead." },
            { re: /draft=""[\s\S]*let text/, hint: "Order matters: you cleared `draft` *before* copying it, so `text` captures an empty string. Copy first, then clear." },
          ],
          success: "That's the real button from AssistantView.swift — and the last Swift you'll type in this course. The `.disabled` line below it stops empty sends and double-taps for free.",
        },
      ],
    },
    // ────────────────────────────────────────────────────────────────────
    {
      id: "graduation",
      title: "Graduation Day",
      steps: [
        {
          type: "text",
          md: [
            "## Look how far you've come",
            "Twelve modules ago, `let` versus `var` was news. Now look at what you can read — and write:",
            "- **Swift itself** — constants, optionals, structs, closures, enums, `guard`, `defer` (Modules 1–2)\n- **Codable models** — the entire `Models.swift`, snake_case JSON and all (Module 3)\n- **SwiftUI** — views, stacks, modifiers, `@State`, `@Observable` view models (Modules 4–5)\n- **A design system** — the `Brand` tokens and fonts on every screen (Module 6)\n- **Networking & auth** — `APIClient`, async/await, bearer tokens in the Keychain (Modules 7–8)\n- **Real screens** — lists, navigation, booking flows, a live map (Modules 9–11)\n- **And today** — an AI assistant that was, honestly, just all of the above again",
            "That last point is the real graduation gift: the 'hardest' feature in the app introduced *zero* new concepts. That's what knowing a stack feels like — new features stop being new, and start being combinations.",
          ],
        },
        {
          type: "quiz",
          q: "Final exam, one question. You tap a suggested walker's chip in the chat. What happens, in order?",
          choices: [
            "`bookingWalker = walker` → `.sheet(item:)` sees a non-nil value → `CreateBookingView` slides up for that walker → booking it POSTs to `/bookings`",
            "The chip pushes a new screen with `NavigationLink`, and the sheet never appears",
            "The app calls `assistantChat` again, this time with the walker's name",
            "The sheet opens first, then the chip sets `bookingWalker` so the sheet knows which walker to show",
          ],
          answer: 0,
          explain: "State drives everything: the tap only changes a `@State` optional, the item-sheet reacts to it, and the booking form does its usual `POST /bookings` — the same one from the bookings module. When the completion sets `bookingWalker = nil`, the sheet dismisses itself. You didn't just pick the right answer — you traced state through three files.",
          nudge: "Nobody calls `present()` in SwiftUI. What's the only thing a button action ever really does?",
        },
        {
          type: "xcode",
          title: "The graduation walk",
          intro: [
            "One last run. Book a walk the way a real user would — by asking for it:",
          ],
          items: [
            "Terminal tab 1: `cd apps/backend && uv run fastapi dev` — leave it running.",
            "Terminal tab 2: `cd apps/ios && xcodegen generate && open PawWalk.xcodeproj`, pick a simulator, press **⌘R**.",
            "Log in as a **pet owner** — the Assistant lives on the owner's Home screen.",
            "Tap the **chat bubble** button on the Home walk card to open the Assistant, then ask for something specific: \"a walker in the Mission for my husky tomorrow at 3pm\".",
            "Watch the reply arrive with walker chips — that's your `compactMap` resolving IDs to names and ratings.",
            "Tap a chip, confirm the booking form is pre-set to that walker, and book the walk. Then check your bookings list: it's there.",
            "That's the whole app, end to end, and you understand every file it touched. Congratulations, graduate. 🎓🐾",
          ],
        },
      ],
    },
  ],
});
