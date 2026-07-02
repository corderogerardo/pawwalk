// Module 08 — Auth: Sign Up, Log In, Stay In. See FORMAT.md for the schema.
window.COURSE = window.COURSE || [];
window.COURSE.push({
  id: "auth",
  title: "Auth: Sign Up, Log In, Stay In",
  emoji: "🔐",
  lessons: [
    // ────────────────────────────────────────────────────────────────────
    {
      id: "tokens-and-keychain",
      title: "Tokens & the Keychain",
      steps: [
        {
          type: "text",
          md: [
            "## How the backend knows it's you",
            "HTTP has no memory. Every request the app sends arrives at the backend as a stranger knocking on the door — so how does `GET /bookings` know *whose* bookings to return?",
            "With a **bearer token**. When you log in, the backend checks your password once and hands back a long signed string (you saw it in Module 3: `AuthResponse.accessToken`). From then on the app attaches that string to every request, in an HTTP header: `Authorization: Bearer <token>`. Whoever *bears* the token is treated as you — no password re-sent, ever.",
            "You already built the sending side in Module 7 — `APIClient` has a `bearerToken` property, and its request helper does this:",
          ],
        },
        {
          type: "code",
          title: "Services/APIClient.swift (excerpt)",
          source: String.raw`private func attachAuthorization(to request: inout URLRequest) {
    guard let bearerToken else { return }
    request.setValue("Bearer \(bearerToken)", forHTTPHeaderField: "Authorization")
}`,
          caption: "One header on every authorized request. This module answers the question Module 7 left open: where does that token come from, and where does it live between launches?",
        },
        {
          type: "quiz",
          q: "The token must survive the app being killed and relaunched. Why is `UserDefaults` (the simple key-value store apps use for settings) the wrong home for it?",
          choices: [
            "UserDefaults is wiped every time the app launches",
            "UserDefaults is stored as a plain unencrypted file on disk — a device backup or a jailbroken phone exposes the token, and the token IS your account",
            "UserDefaults can only store numbers, not strings",
            "UserDefaults is too slow to read at launch",
          ],
          answer: 1,
          explain: "UserDefaults is just an unencrypted plist file. Fine for \"prefers dark mode\", terrible for a credential. iOS ships an encrypted credential vault for exactly this: the **Keychain**. It's hardware-backed, encrypted at rest, and other apps can't read your entries.",
          nudge: "Think about what an attacker could do with the token — it's as good as your password. Where would you NOT leave your house key?",
        },
        {
          type: "code",
          title: "Services/TokenStore.swift (the whole file)",
          source: String.raw`import Foundation
import Security

enum TokenStore {
    private static let service = "com.pawwalk.ios.auth"
    private static let account = "access_token"

    private static var query: [String: Any] {
        [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
        ]
    }

    static func save(token: String) {
        clear()
        var item = query
        item[kSecValueData as String] = Data(token.utf8)
        SecItemAdd(item as CFDictionary, nil)
    }

    static func read() -> String? {
        var item = query
        item[kSecReturnData as String] = true
        item[kSecMatchLimit as String] = kSecMatchLimitOne

        var result: AnyObject?
        let status = SecItemCopyMatching(item as CFDictionary, &result)
        guard status == errSecSuccess, let data = result as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }

    static func clear() {
        SecItemDelete(query as CFDictionary)
    }
}`,
          caption: "PawWalk's entire Keychain layer: 40 lines, zero third-party dependencies.",
        },
        {
          type: "text",
          md: [
            "## Why this file looks so… different",
            "The Keychain API lives in Apple's `Security` framework, which is written in **C**, not Swift. That's why nothing here looks like the Swift you've written so far:",
            "- **Queries are dictionaries.** Instead of calling `keychain.get(\"token\")`, you build a `[String: Any]` dictionary describing what you want — `kSecClass` (what kind of item: a generic password), `kSecAttrService` and `kSecAttrAccount` (a two-part address, like a folder and a filename) — and cast it to `CFDictionary`, the C world's dictionary type.\n- **Results are status codes.** C functions can't `throw`. `SecItemCopyMatching` returns an `OSStatus` — an integer where `errSecSuccess` (0) means \"worked\" and anything else is an error code. Our `read()` checks it with a `guard` and turns failure into a friendly `nil`.\n- **Values are raw bytes.** The Keychain stores `Data`, not `String` — hence `Data(token.utf8)` going in and `String(data:encoding:)` coming out.",
            "Two Swift touches worth noticing: `save` calls `clear()` first, because `SecItemAdd` *refuses* to add an item that already exists — delete-then-add is the standard idiom. And the computed `query` builds a fresh base dictionary each time, so `save`, `read`, and `clear` all address the exact same Keychain slot.",
            "Finally: why `enum TokenStore` and not `class`? There is **no instance state** — the Keychain itself is the storage; this type is just a namespace for three functions. An enum with no cases can never be instantiated, so `TokenStore()` won't even compile. That impossibility is the point: `static func`s on a case-less enum say \"there is nothing to construct here.\"",
          ],
        },
        {
          type: "quiz",
          q: "Why is `TokenStore` a case-less `enum` with `static` funcs instead of a class you'd create with `TokenStore()`?",
          choices: [
            "Enums run faster than classes",
            "Apple requires enums for anything security-related",
            "It holds no instance state — the Keychain is the storage — and a case-less enum can't even be instantiated, which makes that intent impossible to misuse",
            "So it can conform to Codable",
          ],
          answer: 2,
          explain: "An object with no state has no reason to exist as an instance. Making it a case-less enum turns \"please don't instantiate this\" into \"you *can't* instantiate this\" — the compiler enforces the design.",
          nudge: "What would an instance of TokenStore actually hold? Look at the properties — they're all `static`.",
        },
        {
          type: "exercise",
          title: "Write save(token:)",
          prompt: [
            "Time to write the function that tucks the token into the vault. Add `static func save(token: String)` where the marker is. Inside, in order:",
            "1. Call `clear()` — remember, `SecItemAdd` refuses duplicates.\n2. Copy the shared query into a `var` named `item`.\n3. Set `item[kSecValueData as String]` to `Data(token.utf8)` — the Keychain wants bytes.\n4. Call `SecItemAdd(item as CFDictionary, nil)` — the `nil` means \"I don't need the created item handed back\".",
          ],
          starter: String.raw`enum TokenStore {
    private static let service = "com.pawwalk.ios.auth"
    private static let account = "access_token"

    private static var query: [String: Any] {
        [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
        ]
    }

    // your code here

    static func clear() {
        SecItemDelete(query as CFDictionary)
    }
}`,
          solution: String.raw`enum TokenStore {
    private static let service = "com.pawwalk.ios.auth"
    private static let account = "access_token"

    private static var query: [String: Any] {
        [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
        ]
    }

    static func save(token: String) {
        clear()
        var item = query
        item[kSecValueData as String] = Data(token.utf8)
        SecItemAdd(item as CFDictionary, nil)
    }

    static func clear() {
        SecItemDelete(query as CFDictionary)
    }
}`,
          checks: [
            { re: /static func save\(token:String\)\{/, hint: "The signature is `static func save(token: String)` — static, because there's no instance to call it on." },
            { re: /\{(?:TokenStore\.)?clear\(\)/, hint: "First line inside save: call `clear()`. SecItemAdd errors out if an item already exists at this service/account address." },
            { re: /var item=query/, hint: "Copy the shared query into a mutable dictionary: `var item = query` — you need `var` because you're about to add a key." },
            { re: /item\[kSecValueData as String\]=Data\(token\.utf8\)/, hint: "Add the payload under the `kSecValueData as String` key — and the Keychain stores bytes, so wrap the token: `Data(token.utf8)`." },
            { re: /SecItemAdd\(item as CFDictionary,nil\)/, hint: "Finish with `SecItemAdd(item as CFDictionary, nil)` — cast to the C dictionary type, and pass nil for the result we don't need." },
          ],
          mustNot: [
            { re: /UserDefaults/, hint: "Not UserDefaults! That's the unencrypted plist we just ruled out. This function talks to the Keychain via SecItemAdd." },
          ],
          success: "That's the exact `save(token:)` shipping in Services/TokenStore.swift. Your token now survives anything short of the user deleting the app.",
        },
      ],
    },
    // ────────────────────────────────────────────────────────────────────
    {
      id: "auth-session",
      title: "AuthSession: The Login Lifecycle",
      steps: [
        {
          type: "text",
          md: [
            "## One object owns \"who is logged in\"",
            "TokenStore remembers the *token*. But the running app needs to remember the *user* — who they are, whether we're still checking, what went wrong. That's `AuthSession`: an `@Observable` class, the same view-model pattern as Module 5's `WalkersViewModel`, so any view reading its properties re-renders when they change.",
            "It owns exactly three pieces of state:",
            "- `currentUser: User?` — the signed-in user, or `nil`. It's `private(set)`: any view can *read* it, but only AuthSession itself can *write* it — no view can accidentally \"sign someone in\" by assignment.\n- `isRestoring: Bool` — `true` only during the brief launch window while we check for a saved session.\n- `errorMessage: String?` — what the auth screen shows when a login fails. This one is writable from outside so the screen can dismiss it.",
            "Plus one computed convenience: `signedIn` is just `currentUser != nil`. And the whole class is marked `@MainActor` — the guarantee you met in Module 5 — because everything it touches ends up on screen, so all its work stays on the main thread.",
          ],
        },
        {
          type: "code",
          title: "Services/AuthSession.swift (top of the file)",
          source: String.raw`import Foundation
import Observation

@MainActor
@Observable
final class AuthSession {
    private(set) var currentUser: User?
    private(set) var isRestoring = true
    var errorMessage: String?

    var signedIn: Bool { currentUser != nil }

    // the lifecycle methods come next…
}`,
          caption: "Note isRestoring starts `true` — at the instant the app launches, we genuinely don't know yet whether someone is signed in.",
        },
        {
          type: "quiz",
          q: "What does `private(set) var currentUser: User?` buy us?",
          choices: [
            "The property is completely invisible outside AuthSession",
            "Anyone can read it, but only code inside AuthSession can change it — the single-owner rule, enforced by the compiler",
            "It encrypts currentUser in memory",
            "It makes the property faster to read",
          ],
          answer: 1,
          explain: "`private(set)` splits access in two: public read, private write. Views can branch on `auth.currentUser`, but the only code that can set it is AuthSession's own methods — so every sign-in and sign-out flows through one place.",
          nudge: "The `private` applies only to the `(set)` half…",
        },
        {
          type: "text",
          md: [
            "## restore(): the launch handshake",
            "The magic moment of this module: the user killed the app yesterday, opens it today, and is *still signed in*. That's `restore()`, called once at launch. Its job, in order:",
            "1. **Read** the saved token from `TokenStore`. None? Then nobody was signed in — return, done.\n2. **Arm the client**: set `APIClient.shared.bearerToken` so requests go out authorized.\n3. **Confirm** the token still works by calling `GET /auth/me` — the backend returns the `User` the token belongs to. Store it in `currentUser` and the whole app flips to signed-in.\n4. **On failure** (expired or revoked token), quietly undo both sides: `TokenStore.clear()` and `bearerToken = nil`. The user just sees the login screen — no scary error for a token that aged out.",
            "One guarantee matters on *every* path: `isRestoring` must end up `false`, or the app would sit on the launch screen forever. That's what `defer { isRestoring = false }` does — a `defer` block runs when the function exits, no matter which exit it takes: early return, success, or catch.",
          ],
        },
        {
          type: "exercise",
          title: "Write restore()",
          prompt: [
            "The `defer` is written for you. Fill in the four moves:",
            "1. `guard let token = TokenStore.read() else { return }`\n2. Set `APIClient.shared.bearerToken` to that token.\n3. In a `do` block: `currentUser = try await APIClient.shared.me()`.\n4. In `catch`: call `TokenStore.clear()`, then set `APIClient.shared.bearerToken` to `nil`.",
          ],
          starter: String.raw`func restore() async {
    defer { isRestoring = false }
    // your code here
}`,
          solution: String.raw`func restore() async {
    defer { isRestoring = false }
    guard let token = TokenStore.read() else { return }
    APIClient.shared.bearerToken = token
    do {
        currentUser = try await APIClient.shared.me()
    } catch {
        TokenStore.clear()
        APIClient.shared.bearerToken = nil
    }
}`,
          checks: [
            { re: /guard let token=TokenStore\.read\(\)else\{return\}/, hint: "Start with `guard let token = TokenStore.read() else { return }` — a nil from the Keychain means there's no session to restore." },
            { re: /APIClient\.shared\.bearerToken=token/, hint: "Arm the client before calling the backend: assign the token to `APIClient.shared.bearerToken`." },
            { re: /do\{currentUser=try await APIClient\.shared\.me\(\)\}/, hint: "Inside `do { … }`, ask the backend who this token belongs to: `currentUser = try await APIClient.shared.me()`." },
            { re: /catch\{TokenStore\.clear\(\)APIClient\.shared\.bearerToken=nil\}/, hint: "In the `catch`, undo both sides: `TokenStore.clear()` first, then `APIClient.shared.bearerToken = nil`." },
          ],
          mustNot: [
            { re: /try\?/, hint: "Not `try?` — swallowing the error would leave a dead token in the Keychain. Use do/catch so failure can clean up." },
          ],
          success: "That's restore(), verbatim from the repo. Kill the app, relaunch, and this function greets the user by name before the first frame settles.",
        },
        {
          type: "text",
          md: [
            "## Log in and sign up share one spine",
            "Look at what happens *after* a successful login: save the token, arm the API client, set `currentUser`. Now look at what happens after a successful signup: … exactly the same three things. The only difference is *which request* was fired.",
            "So AuthSession has one private worker, `authenticate(_:)`, and its parameter is a **closure** — a function passed as a value (you've been passing closures to `Button` since Module 4). Its type, `() async throws -> AuthResponse`, reads as: \"no arguments, may suspend, may throw, produces an AuthResponse.\" `logIn` and `signUp` each hand it a different one-liner; everything downstream — token saving, error handling — is written once.",
            "Error handling uses the typed errors from Module 7: an `APIError` (like `.emailTaken`) carries a human-readable `errorDescription`, anything else falls through to `localizedDescription`. Either way it lands in `errorMessage`, and the auth screen — which observes this object — shows it automatically.",
          ],
        },
        {
          type: "code",
          title: "Services/AuthSession.swift (the shared path)",
          source: String.raw`func signUp(email: String, password: String, name: String, role: UserRole) async {
    await authenticate { try await APIClient.shared.signup(email: email, password: password, name: name, role: role) }
}

func logIn(email: String, password: String) async {
    await authenticate { try await APIClient.shared.login(email: email, password: password) }
}

private func authenticate(_ request: () async throws -> AuthResponse) async {
    errorMessage = nil
    do {
        let auth = try await request()
        TokenStore.save(token: auth.accessToken)
        APIClient.shared.bearerToken = auth.accessToken
        currentUser = auth.user
    } catch let error as APIError {
        errorMessage = error.errorDescription
    } catch {
        errorMessage = error.localizedDescription
    }
}`,
          caption: "Note neither public method throws or returns anything — success shows up as `currentUser` changing, failure as `errorMessage` changing. Views just observe.",
        },
        {
          type: "quiz",
          q: "Why does `authenticate(_:)` take a closure instead of login and signup each doing their own thing?",
          choices: [
            "Closures execute faster than regular function calls",
            "Login and signup differ only in which request they fire — the closure injects that one difference, so saving the token, arming the client, setting currentUser, and error handling are written exactly once",
            "Swift requires private methods to take closures",
            "So that authenticate can be called from other apps",
          ],
          answer: 1,
          explain: "This is the classic \"parameterize the difference\" move. If the post-login steps ever change — say, analytics on sign-in — there's one place to edit, and login and signup can never drift apart.",
          nudge: "Compare what logIn and signUp would each have to do after their request succeeds. How much of it is identical?",
        },
        {
          type: "text",
          md: [
            "## The self-destruct wire: handling 401s",
            "Suppose the user is happily booking a walk when their token expires. The booking request comes back **401 Unauthorized** — deep inside `APIClient.checkStatus`, which has no idea AuthSession exists. How does the session find out?",
            "Through `NotificationCenter` — an app-wide bulletin board built into Foundation. One object *posts* a named notification; anyone who registered as an *observer* for that name gets called. APIClient posts `APIClient.unauthorizedNotification` whenever any response is a 401; AuthSession, in its `init`, registers to hear it and responds by logging out. The two objects never reference each other.",
            "One subtlety: the observer closure is stored by NotificationCenter *indefinitely*. If it captured `self` strongly, NotificationCenter would keep AuthSession alive forever — a memory leak. `[weak self]` captures a weak reference instead: if AuthSession is ever gone, `self` is `nil` and `self?.logOut()` quietly does nothing.",
          ],
        },
        {
          type: "code",
          title: "Services/AuthSession.swift (init)",
          source: String.raw`init() {
    // A 401 on any authorized request (e.g. an expired token on a
    // booking call) means the session is no longer valid — log out.
    NotificationCenter.default.addObserver(
        forName: APIClient.unauthorizedNotification, object: nil, queue: .main
    ) { [weak self] _ in
        self?.logOut()
    }
}`,
          caption: "queue: .main routes the callback to the main thread, where UI state must change. The `_ in` ignores the notification object — the name alone says everything.",
        },
        {
          type: "quiz",
          q: "Why `[weak self]` in the observer closure?",
          choices: [
            "It's just the conventional style for closures",
            "It makes the closure run on a background thread",
            "NotificationCenter stores the closure indefinitely — a strong capture of self would keep AuthSession alive forever, leaking it. Weak lets AuthSession die normally, and the closure then does nothing",
            "Without it the closure couldn't call logOut at all",
          ],
          answer: 2,
          explain: "A stored closure that strongly captures an object keeps that object alive as long as the closure exists. `[weak self]` breaks that grip: `self` becomes an optional that's nil once the object is gone — hence `self?.logOut()`.",
          nudge: "Who is holding onto this closure, and for how long?",
        },
        {
          type: "exercise",
          title: "Write logOut()",
          prompt: [
            "The final lifecycle method — and the mirror image of a successful login. Write `func logOut()` (not async: everything here is local, no network call). Three moves, in order:",
            "1. `TokenStore.clear()` — wipe the Keychain.\n2. Set `APIClient.shared.bearerToken` to `nil` — disarm the client.\n3. Set `currentUser` to `nil` — and watch the whole UI flip to signed-out on its own.",
          ],
          starter: String.raw`// inside AuthSession — add logOut() below
// your code here`,
          solution: String.raw`func logOut() {
    TokenStore.clear()
    APIClient.shared.bearerToken = nil
    currentUser = nil
}`,
          checks: [
            { re: /func logOut\(\)\{/, hint: "Plain `func logOut() { … }` — no async, no throws. Logging out never fails and never waits." },
            { re: /TokenStore\.clear\(\)/, hint: "First: `TokenStore.clear()` — the saved token must go, or the next launch would restore the session you just ended." },
            { re: /APIClient\.shared\.bearerToken=nil/, hint: "Second: nil out `APIClient.shared.bearerToken` so no future request goes out wearing the old token." },
            { re: /currentUser=nil/, hint: "Last: `currentUser = nil`. That flips `signedIn` to false, and every observing view — including the root gate — reacts instantly." },
          ],
          mustNot: [
            { re: /async/, hint: "No `async` here — logging out touches only local state (Keychain, a property, a property). Nothing to await." },
          ],
          success: "AuthSession is complete: restore, log in, sign up, log out, and a tripwire for expired tokens. Next: the screen the user actually types into.",
        },
      ],
    },
    // ────────────────────────────────────────────────────────────────────
    {
      id: "auth-view",
      title: "The Auth Screen",
      steps: [
        {
          type: "text",
          md: [
            "## One screen, two modes",
            "Login and signup share every field except *name* (and the role picker). Two separate screens would be near-duplicates — so PawWalk ships **one** `AuthView` with a private `Mode` enum: `.login` or `.signup`. All the wording differences live as computed properties *on the enum itself* — the title, the button label, the \"New here?\" hint. Flip `mode`, and every string on screen flips with it.",
            "The screen's state is a handful of `@State` fields — `email`, `password`, `name`, the chosen `role`, plus `isSubmitting` and `validationMessage`. And it reaches the shared `AuthSession` the way you learned in Module 5: `@Environment(AuthSession.self)`.",
          ],
        },
        {
          type: "code",
          title: "Features/Auth/AuthView.swift (mode & state)",
          source: String.raw`struct AuthView: View {
    private enum Mode {
        case login, signup

        var title: String { self == .login ? "Welcome back." : "Join PawWalk." }
        var cta: String { self == .login ? "Log in" : "Sign up" }
        var toggleHint: String { self == .login ? "New here?" : "Already have an account?" }
        var toggleAction: String { self == .login ? "Sign up" : "Log in" }
    }

    @Environment(AuthSession.self) private var auth

    @State private var mode: Mode = .login
    @State private var email = ""
    @State private var password = ""
    @State private var name = ""
    @State private var role: UserRole = .owner
    @State private var isSubmitting = false
    @State private var validationMessage: String?`,
          caption: "\"cta\" = call to action, the big button's label. Putting the strings on Mode means the body never does its own `mode == .login ? … : …` gymnastics for text.",
        },
        {
          type: "quiz",
          q: "Why one AuthView with a Mode enum instead of separate LoginView and SignupView files?",
          choices: [
            "SwiftUI limits an app to one auth screen",
            "The two screens share every field except name and the role picker — two files would be near-total duplication that could drift apart",
            "Enums make the screen render faster",
            "So the user can't tell login and signup apart",
          ],
          answer: 1,
          explain: "Same instinct as `authenticate(_:)` in the last lesson: when two things differ by a sliver, model the sliver (one enum) and share the rest.",
          nudge: "List the fields each screen needs. How many are different?",
        },
        {
          type: "code",
          title: "Features/Auth/AuthView.swift (the fields)",
          source: String.raw`private var fields: some View {
    VStack(spacing: 12) {
        if mode == .signup {
            roleToggle
            AuthField(label: "Name", text: $name, textContentType: .name)
        }
        AuthField(label: "Email", text: $email, keyboard: .emailAddress, textContentType: .emailAddress)
        AuthField(label: "Password", text: $password, isSecure: true,
                  textContentType: mode == .login ? .password : .newPassword)
    }
}

private var roleToggle: some View {
    VStack(alignment: .leading, spacing: 6) {
        MonoCaption("I am a", size: 9, tracking: 0.1)
        HStack(spacing: 8) {
            rolePill(.owner, "Pet owner")
            rolePill(.walker, "Dog walker")
        }
    }
}`,
          caption: "`AuthField` is a small private helper further down the same file: a Brand-styled label over a `TextField` — or a `SecureField` when `isSecure` is true, which shows dots instead of characters for passwords. `rolePill(_:_:)` is another private helper: it draws one selectable capsule, and tapping it sets `role`. The `keyboard`/`textContentType` arguments are hints to iOS (show the @-key keyboard; offer password autofill) — you'll meet those UIKit types properly in a later module.",
        },
        {
          type: "text",
          md: [
            "## The submit flow",
            "Tapping the big button runs `submit()`, which does two things:",
            "**1. Validate locally first.** `validate()` returns a `String?` — `nil` means \"all good\", a string is the problem to show (\"Enter a valid email.\"). Careful reading the guard: `guard let message = validate() else { … }` is *flipped* from the guards you're used to — here, successfully unwrapping a value means something is **wrong**, and the `else` branch is the happy path. This only catches typos; the backend stays the source of truth for real rules like \"email already registered\".",
            "**2. Fire the request in a `Task`.** A button action is a plain synchronous function — you can't `await` in it. `Task { … }` opens an async context to await from (you met this bridge in Module 3). Inside it: set `isSubmitting = true`, `defer` it back to `false`, then call `auth.logIn` or `auth.signUp` depending on the mode.",
            "While `isSubmitting` is true, the button shows a spinner and is disabled — `.disabled(isSubmitting)` — so an impatient double-tap can't fire two signups. And errors? The body shows `validationMessage ?? auth.errorMessage` — local complaint first, otherwise whatever AuthSession caught from the backend. The view never touches errors directly; it just observes.",
          ],
        },
        {
          type: "code",
          title: "Features/Auth/AuthView.swift (submit button)",
          source: String.raw`private var submitButton: some View {
    Button(action: submit) {
        HStack {
            Spacer()
            if isSubmitting {
                ProgressView().tint(Brand.onInverse)
            } else {
                Text(mode.cta).font(.dm(14, .semibold))
            }
            Spacer()
        }
        .frame(height: 46)
        .background(Brand.accent)
        .foregroundStyle(Brand.onInverse)
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
    }
    .disabled(isSubmitting)
}`,
          caption: "Same Brand tokens you built in Module 6. The label swaps to a ProgressView while a request is in flight.",
        },
        {
          type: "quiz",
          q: "Why does `submit()` wrap the network work in `Task { … }`?",
          choices: [
            "Task makes the request run twice as fast",
            "A button action is a synchronous function, so you can't `await` in it directly — Task opens an async context where awaiting is allowed",
            "Task is required for anything touching @State",
            "Without Task the compiler couldn't find auth.logIn",
          ],
          answer: 1,
          explain: "`await` needs an async context, and SwiftUI button actions aren't one. `Task { }` is the bridge from the synchronous UI world into async work — the same bridge you first crossed in Module 3 to call `APIClient.shared.walkers()`.",
          nudge: "Try to imagine writing `await` directly inside a button closure. What would the compiler say?",
        },
        {
          type: "exercise",
          title: "Write the submit action",
          prompt: [
            "Validation passed, the Task is open, `isSubmitting` is handled. Your job is the fork at the heart of the screen — 5 lines:",
            "If `mode == .login`, `await auth.logIn(email: email, password: password)`. Otherwise, `await auth.signUp(email: email, password: password, name: name, role: role)`.",
          ],
          starter: String.raw`private func submit() {
    guard let message = validate() else {
        validationMessage = nil
        Task {
            isSubmitting = true
            defer { isSubmitting = false }
            // your code here
        }
        return
    }
    validationMessage = message
}`,
          solution: String.raw`private func submit() {
    guard let message = validate() else {
        validationMessage = nil
        Task {
            isSubmitting = true
            defer { isSubmitting = false }
            if mode == .login {
                await auth.logIn(email: email, password: password)
            } else {
                await auth.signUp(email: email, password: password, name: name, role: role)
            }
        }
        return
    }
    validationMessage = message
}`,
          checks: [
            { re: /if mode==\.login\{/, hint: "Branch on the mode: `if mode == .login { … } else { … }`." },
            { re: /await auth\.logIn\(email:email,password:password\)/, hint: "The login branch: `await auth.logIn(email: email, password: password)` — argument labels and all." },
            { re: /else\{await auth\.signUp\(email:email,password:password,name:name,role:role\)\}/, hint: "The else branch passes all four: `await auth.signUp(email: email, password: password, name: name, role: role)`." },
          ],
          mustNot: [
            { re: /try await/, hint: "No `try` — logIn and signUp don't throw. AuthSession catches every error internally and surfaces it as errorMessage. Plain `await`." },
          ],
          success: "The screen is wired. Notice what it does NOT do: no token handling, no error parsing, no navigation. It asks AuthSession and observes the answer — that's the whole job.",
        },
      ],
    },
    // ────────────────────────────────────────────────────────────────────
    {
      id: "gating-the-app",
      title: "Gating the App on Auth",
      steps: [
        {
          type: "text",
          md: [
            "## One gate to rule the app",
            "You now have a vault, a session, and a login screen. The last piece decides *which world the user sees* — and it lives in exactly one place: `ContentView`, the root view. It reads `AuthSession` from the environment and branches:",
            "- **Still restoring?** Show a bare `Brand.canvas` — a calm blank in the app's background color. Not a spinner: `restore()` usually finishes in a blink, and a flash of spinner looks like jank. Crucially, *not* the login screen either — flashing \"Log in\" at someone who is already signed in feels broken.\n- **Signed in?** Route by role, in one `if`: a `.walker` gets `WalkerHomeView` (the walker's dashboard — you'll dig into it in a later module), everyone else gets the `HomeView` you know.\n- **Otherwise:** `AuthView`.",
            "Nobody *navigates* between these worlds. When `currentUser` changes — login, logout, a 401 tripwire — `signedIn` changes, ContentView re-evaluates, and SwiftUI swaps the entire tree. Log out from five screens deep and the whole stack simply ceases to exist.",
            "Note the optional chaining in the role check: `auth.currentUser?.role == .walker`. If `currentUser` were somehow nil, the comparison is just `false` — no crash, owner path wins.",
          ],
        },
        {
          type: "code",
          title: "ContentView.swift (the gate)",
          source: String.raw`import SwiftUI

struct ContentView: View {
    @Environment(AuthSession.self) private var auth

    var body: some View {
        Group {
            if auth.isRestoring {
                Brand.canvas.ignoresSafeArea()
            } else if auth.signedIn {
                if auth.currentUser?.role == .walker {
                    WalkerHomeView()
                } else {
                    HomeView()
                }
            } else {
                AuthView()
            }
        }
        .tint(Brand.accent)
    }
}`,
          caption: "Group exists so `.tint` can be applied to whichever branch wins — an if/else chain alone can't take a modifier.",
        },
        {
          type: "quiz",
          q: "During the moment `restore()` is checking the Keychain and calling /auth/me, what does the user see — and why?",
          choices: [
            "The login screen, so they can start typing early",
            "A plain Brand.canvas — showing AuthView would flash a login screen at an already-signed-in user, and a spinner for a sub-second check looks like jank",
            "A frozen screenshot of the last session",
            "HomeView with placeholder data",
          ],
          answer: 1,
          explain: "The restoring state exists precisely to avoid guessing. Until /auth/me answers, we honestly don't know who's there — so we show nothing that could be wrong.",
          nudge: "Imagine you're signed in and the app briefly showed you \"Log in\" on every launch. How would that feel?",
        },
        {
          type: "text",
          md: [
            "## Full circle: the 14 lines from Module 0",
            "Remember the very first Swift file this course showed you — `PawWalkApp.swift`, with a promise that by Module 8 you'd understand every character? That module is this one. Read it again:",
            "- `@State private var auth = AuthSession()` — the app **owns** the one and only session object; `@State` keeps it alive for the app's whole life.\n- `.environment(auth)` — pours it into the environment, where ContentView, AuthView, and every future screen pull it out with `@Environment(AuthSession.self)`.\n- `.task { await auth.restore() }` — runs when the window's content appears, i.e. once at launch: the Keychain read, the /auth/me handshake, the `isRestoring` flip. This is the line that makes sessions survive restarts.",
          ],
        },
        {
          type: "code",
          title: "PawWalkApp.swift (the whole file)",
          source: String.raw`import SwiftUI

@main
struct PawWalkApp: App {
    @State private var auth = AuthSession()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(auth)
                .task { await auth.restore() }
        }
    }
}`,
          caption: "Promise kept: create the session, share it, restore it. Every character should read as an old friend now.",
        },
        {
          type: "quiz",
          q: "If you deleted `.task { await auth.restore() }`, what would happen on launch?",
          choices: [
            "The app would crash on the first frame",
            "Everyone would be logged out on every launch, but otherwise fine",
            "restore() would never run, so `isRestoring` never flips to false — every user stares at a blank Brand.canvas forever",
            "SwiftUI would call restore() automatically anyway",
          ],
          answer: 2,
          explain: "`isRestoring` starts `true` and only `restore()`'s `defer` sets it `false`. No call, no flip — the gate's first branch wins forever. A good reminder that the blank state is a *promise* to leave quickly, and restore() is what keeps it.",
          nudge: "Trace it: who sets isRestoring to false, and when?",
        },
        {
          type: "exercise",
          title: "Capstone: rebuild the gate",
          prompt: [
            "Type out ContentView's whole decision — the three-way gate plus the role fork. Inside the `Group`:",
            "1. `if auth.isRestoring` → `Brand.canvas.ignoresSafeArea()`\n2. `else if auth.signedIn` → inside: `if auth.currentUser?.role == .walker` → `WalkerHomeView()`, `else` → `HomeView()`\n3. final `else` → `AuthView()`",
          ],
          starter: String.raw`struct ContentView: View {
    @Environment(AuthSession.self) private var auth

    var body: some View {
        Group {
            // your code here
        }
        .tint(Brand.accent)
    }
}`,
          solution: String.raw`struct ContentView: View {
    @Environment(AuthSession.self) private var auth

    var body: some View {
        Group {
            if auth.isRestoring {
                Brand.canvas.ignoresSafeArea()
            } else if auth.signedIn {
                if auth.currentUser?.role == .walker {
                    WalkerHomeView()
                } else {
                    HomeView()
                }
            } else {
                AuthView()
            }
        }
        .tint(Brand.accent)
    }
}`,
          checks: [
            { re: /if auth\.isRestoring\{Brand\.canvas\.ignoresSafeArea\(\)\}/, hint: "First branch: while `auth.isRestoring`, show `Brand.canvas.ignoresSafeArea()` — the calm blank canvas." },
            { re: /else if auth\.signedIn\{/, hint: "Second branch: `else if auth.signedIn { … }` — the signed-in world." },
            { re: /if auth\.currentUser\?\.role==\.walker\{WalkerHomeView\(\)\}else\{HomeView\(\)\}/, hint: "Inside the signed-in branch, fork on role with optional chaining: `if auth.currentUser?.role == .walker { WalkerHomeView() } else { HomeView() }`." },
            { re: /else\{AuthView\(\)\}/, hint: "The final `else` — not restoring, not signed in — shows `AuthView()`." },
          ],
          mustNot: [
            { re: /ProgressView/, hint: "No spinner in the restoring branch — restore() finishes in a blink, and a flash of spinner reads as jank. A quiet Brand.canvas is the deliberate choice." },
          ],
          success: "That's the real ContentView.swift, and with it the entire auth architecture: Keychain → session → screen → gate. One last thing: prove it works.",
        },
        {
          type: "xcode",
          title: "Run the full auth flow",
          intro: ["Time to watch four files conspire. Backend first, then the app:"],
          items: [
            "Terminal tab 1: `cd apps/backend && uv run fastapi dev` — leave it running.",
            "Terminal tab 2: `cd apps/ios && xcodegen generate && open PawWalk.xcodeproj`, pick a simulator, press **⌘R**.",
            "On the auth screen, toggle to **Sign up**, pick **Pet owner**, and create a brand-new account. You should land on HomeView — that was AuthView → AuthSession.signUp → authenticate → TokenStore.save, then the gate flipping on `signedIn`.",
            "Now the payoff: stop the app (the ■ button in Xcode), then **⌘R** again. No login screen — `restore()` read the Keychain, `/auth/me` confirmed you, and the gate went straight to Home. Sessions survive restarts.",
            "Go to the Profile tab and tap **Log out**, then relaunch once more — you're back at the auth screen, because logOut() wiped the Keychain.",
            "Bonus: sign up again as a **Dog walker** with a different email. You land on the walker dashboard instead — that's the one-line role fork you just typed.",
          ],
        },
      ],
    },
  ],
});
