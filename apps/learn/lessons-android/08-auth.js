// Module 08 — Auth & Secure Storage (Android track). See ../lessons/FORMAT.md
// and ./FORMAT-KOTLIN.md for the schema and Kotlin-specific traps.
window.COURSE = window.COURSE || [];
window.COURSE.push({
  id: "auth-android",
  title: "Auth & Secure Storage",
  emoji: "🔐",
  lang: "kotlin",
  lessons: [
    // ────────────────────────────────────────────────────────────────────
    {
      id: "tokens-101",
      title: "Tokens 101",
      steps: [
        {
          type: "text",
          md: [
            "## HTTP forgets you instantly",
            "Every request your app sends is, as far as the backend is concerned, a stranger knocking on the door. There's no built-in \"remember me\" in HTTP — so how does `GET /bookings` know *whose* bookings to return?",
            "The answer is a **bearer token**. Log in once, and the backend checks your password, then hands back a long signed string — you'll meet it as `AuthResponse.accessToken` when we get to `PawWalkApi.kt`. From then on, every request the app makes carries that string in one HTTP header: `Authorization: Bearer <token>`. Whoever *bears* the token is treated as you. No password gets re-sent, ever.",
            "This module answers three questions in order: where does the token live between app launches, how does it get attached to every request automatically, and how do the login/signup screens create one in the first place?",
          ],
        },
        {
          type: "quiz",
          q: "The token needs to survive the app being closed and reopened tomorrow. Which of these is the biggest problem with just keeping it in a plain, unencrypted file on disk?",
          choices: [
            "Plain files are read one character at a time, which is slow",
            "A plain file is readable by anyone with access to the device's storage — a backup, a rooted phone, or a bug that leaks a path exposes the token, and the token IS your account",
            "Plain files can't hold text longer than a few hundred characters",
            "Android deletes plain files automatically after a few hours",
          ],
          answer: 1,
          explain: "A bearer token is a bare credential — anyone holding it can act as you, no password required. Storing it unencrypted turns any way of reading the device's files (a backup, root access, a misconfigured share) into full account takeover. That's exactly the class of risk encrypted storage exists to close.",
          nudge: "Think about what someone could do if they simply copied that file off the device. What would they be holding?",
        },
        {
          type: "text",
          md: [
            "## Where PawWalk keeps it: EncryptedSharedPreferences",
            "Android's plain `SharedPreferences` is a small, unencrypted XML file — great for \"remember the last tab I was on\", wrong for a credential. AndroidX ships a drop-in replacement, **`EncryptedSharedPreferences`**, that encrypts both the keys and the values, using a master key generated and held by the **Android Keystore** — a hardware-backed vault the OS itself protects. PawWalk wraps it in one small object: `TokenStore`.",
            "You'll build that object in the next lesson. First, the shape of the whole flow, so you know where each piece slots in:",
            "1. **Log in or sign up** → the backend returns a token.\n2. **Save it** → `TokenStore` writes it into `EncryptedSharedPreferences`.\n3. **Attach it automatically** → an OkHttp interceptor reads it out of `TokenStore` and stamps it onto every outgoing request.\n4. **Read it back on launch** → the app asks the backend \"who does this token belong to?\" and either restores the session or, if the token's gone stale, falls back to the login screen.",
          ],
        },
        {
          type: "quiz",
          q: "What does the Android Keystore add that a plain encrypted file on its own wouldn't?",
          choices: [
            "It makes reads and writes instant instead of taking a few milliseconds",
            "It automatically deletes the token after 24 hours",
            "It holds the master key that encrypts your data in hardware the OS protects — so even a copied file is useless without the key material the Keystore never exposes",
            "It lets multiple apps share the same token",
          ],
          answer: 2,
          explain: "Encryption is only as strong as where the key lives. If the key sat in a normal file next to the encrypted data, copying both would defeat the whole point. The Keystore keeps the key in hardware-backed storage the app can use but never directly read out — that's what makes the encryption meaningful.",
          nudge: "Encrypted data is only safe if the *key* is safe too. Where does that key have to live for the encryption to mean anything?",
        },
        {
          type: "exercise",
          title: "Warm-up: the Authorization header",
          prompt: [
            "Before we touch any real files, let's write the one line at the heart of this whole module: the HTTP header PawWalk sends on every authorized request.",
            "Declare a `val` named `header` holding the string `Authorization: Bearer` followed by a space and a variable `token` (a string template, not concatenation with `+`).",
          ],
          starter: String.raw`val token = "abc123"
// your code here
`,
          solution: String.raw`val token = "abc123"
val header = "Authorization: Bearer $token"`,
          checks: [
            { re: /val header="Authorization:Bearer\$token"/, hint: "Build it as `val header = \"Authorization: Bearer $token\"` — reference `token` with a plain `$token`, no braces needed for a simple name." },
          ],
          mustNot: [
            { re: /\+token/, hint: "Use a string template (`$token` inside the quotes), not `+` concatenation — that's the idiomatic Kotlin way." },
          ],
          success: "That's the exact header PawWalk attaches to every authorized request — you'll see the real version, built from a real interceptor, two lessons from now.",
        },
      ],
    },
    // ────────────────────────────────────────────────────────────────────
    {
      id: "storing-the-token",
      title: "Storing the Token",
      steps: [
        {
          type: "text",
          md: [
            "## TokenStore: the whole vault, in one object",
            "PawWalk's entire token storage layer is one Kotlin `object` — a singleton, meaning there's exactly one instance and you never construct it yourself (no `TokenStore()`, just `TokenStore.saveToken(...)`). Read it top to bottom:",
          ],
        },
        {
          type: "code",
          title: "data/TokenStore.kt (the whole file)",
          source: String.raw`package com.pawwalk.android.data

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

/**
 * Holds the JWT on disk. Backed by EncryptedSharedPreferences so the token
 * (and the master key protecting it) live in the Android Keystore instead of
 * a plaintext prefs file — worth it for something as sensitive as an auth
 * token, even in a learning app.
 */
object TokenStore {
    private const val PREFS_NAME = "pawwalk_secure_prefs"
    private const val KEY_TOKEN = "access_token"

    private lateinit var prefs: android.content.SharedPreferences

    fun init(context: Context) {
        if (::prefs.isInitialized) return
        val masterKey = MasterKey.Builder(context.applicationContext)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()
        prefs = EncryptedSharedPreferences.create(
            context.applicationContext,
            PREFS_NAME,
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
        )
    }

    fun saveToken(token: String) = prefs.edit().putString(KEY_TOKEN, token).apply()

    fun getToken(): String? = prefs.getString(KEY_TOKEN, null)

    fun clear() = prefs.edit().remove(KEY_TOKEN).apply()
}`,
          caption: "38 lines, zero hand-rolled crypto — AndroidX does the encryption; TokenStore just wires it up and exposes three small functions.",
        },
        {
          type: "text",
          md: [
            "## Reading it line by line",
            "- **`object TokenStore`** — a Kotlin `object` declaration creates a class *and* its one-and-only instance at the same time. There's no constructor to call; `TokenStore` the name IS the instance. Same reason iOS's equivalent is a case-less `enum`: nothing here needs more than one copy.\n- **`private lateinit var prefs`** — `lateinit` is a promise to the compiler: \"this `var` has no value yet, but I guarantee I'll set it before anyone reads it.\" It only works on non-null `var` properties, and reading one before it's set crashes with a clear error rather than silently returning null. That's the trade PawWalk makes here, because `prefs` genuinely can't be built until `init(context)` runs — you need a `Context` (a handle to the running app) to reach the Keystore, and that context only exists once Android hands one to `MainActivity`.\n- **`fun init(context: Context)`** — builds a `MasterKey` (the Keystore-backed encryption key) and hands it to `EncryptedSharedPreferences.create(...)` to produce an encrypted `SharedPreferences`. The `if (::prefs.isInitialized) return` guard makes calling `init` twice harmless — `::prefs.isInitialized` checks the lateinit var's state without touching its value.\n- **`saveToken` / `getToken` / `clear`** — ordinary `SharedPreferences` calls (`putString`, `getString`, `remove`) — the encryption is invisible at this layer; `EncryptedSharedPreferences` handles it underneath. `getToken()` returns `String?`: no saved token is a completely normal `null`, not an error.",
            "One more thing worth noticing: `saveToken` and `clear` are one-line functions with no `{ }` body — `fun saveToken(token: String) = prefs.edit()....apply()`. When a function's whole body is one expression, Kotlin lets you write `= expression` instead of `{ return expression }`. You'll use this shape constantly once it clicks.",
          ],
        },
        {
          type: "quiz",
          q: "Why is `prefs` declared `private lateinit var` instead of just being set up immediately when the object is created?",
          choices: [
            "lateinit makes property access faster",
            "Kotlin objects aren't allowed to have var properties at all",
            "lateinit is required for anything involving encryption",
            "Building the EncryptedSharedPreferences needs a Context (a handle to the running app), which doesn't exist yet when the TokenStore object itself is first referenced — so it's deferred to an explicit init(context) call",
          ],
          answer: 3,
          explain: "TokenStore has to exist as a plain Kotlin object with no constructor arguments — but building an EncryptedSharedPreferences needs an Android Context. lateinit bridges that gap: the property is declared now, and MainActivity fills it in with a real Context on app startup, before anything touches Network (which reads the token through the auth interceptor).",
          nudge: "What does EncryptedSharedPreferences.create(...) need that TokenStore, as a bare `object`, doesn't have lying around by default?",
        },
        {
          type: "exercise",
          title: "Write getToken() and clear()",
          prompt: [
            "`saveToken` is written for you below. Add the other two one-liners `TokenStore` needs, in order:",
            "1. `getToken(): String?` — return `prefs.getString(KEY_TOKEN, null)`.\n2. `clear()` — remove the saved token: `prefs.edit().remove(KEY_TOKEN).apply()`.",
            "Both are single-expression functions — no curly braces, just `fun name(...) = ...`.",
          ],
          starter: String.raw`object TokenStore {
    private const val PREFS_NAME = "pawwalk_secure_prefs"
    private const val KEY_TOKEN = "access_token"

    private lateinit var prefs: android.content.SharedPreferences

    fun init(context: Context) {
        if (::prefs.isInitialized) return
        val masterKey = MasterKey.Builder(context.applicationContext)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()
        prefs = EncryptedSharedPreferences.create(
            context.applicationContext,
            PREFS_NAME,
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
        )
    }

    fun saveToken(token: String) = prefs.edit().putString(KEY_TOKEN, token).apply()

    // your code here
}`,
          solution: String.raw`object TokenStore {
    private const val PREFS_NAME = "pawwalk_secure_prefs"
    private const val KEY_TOKEN = "access_token"

    private lateinit var prefs: android.content.SharedPreferences

    fun init(context: Context) {
        if (::prefs.isInitialized) return
        val masterKey = MasterKey.Builder(context.applicationContext)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()
        prefs = EncryptedSharedPreferences.create(
            context.applicationContext,
            PREFS_NAME,
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
        )
    }

    fun saveToken(token: String) = prefs.edit().putString(KEY_TOKEN, token).apply()

    fun getToken(): String? = prefs.getString(KEY_TOKEN, null)

    fun clear() = prefs.edit().remove(KEY_TOKEN).apply()
}`,
          checks: [
            { re: /fun getToken\(\):String\?=prefs\.getString\(KEY_TOKEN,null\)/, hint: "`fun getToken(): String? = prefs.getString(KEY_TOKEN, null)` — one expression, no `{ return ... }` needed." },
            { re: /fun clear\(\)=prefs\.edit\(\)\.remove\(KEY_TOKEN\)\.apply\(\)/, hint: "`fun clear() = prefs.edit().remove(KEY_TOKEN).apply()` — same shape as `saveToken`, but `.remove(KEY_TOKEN)` instead of `.putString(...)`." },
          ],
          mustNot: [
            { re: /getToken\(\):String\{/, hint: "Don't write a `{ }` block body here — match the file's style: a single-expression function with `=`." },
          ],
          success: "That's the real TokenStore.kt, complete. Three tiny functions sitting on top of an encrypted, Keystore-backed vault — the whole vault, done.",
        },
      ],
    },
    // ────────────────────────────────────────────────────────────────────
    {
      id: "attaching-it-automatically",
      title: "Attaching It Automatically",
      steps: [
        {
          type: "text",
          md: [
            "## Nobody should have to remember the header",
            "If every screen that calls the API had to remember to read the token and stick it on the request, sooner or later one would forget — and ship a silent bug. PawWalk solves this once, centrally, with an OkHttp **interceptor**: a function that gets a look at every outgoing request before it leaves the device, and can modify it on the way out.",
            "You met `Network.kt`'s overall shape in the last module. Here's the piece we skipped: the `authInterceptor` sitting right above the `OkHttpClient`.",
          ],
        },
        {
          type: "code",
          title: "data/Network.kt (the auth interceptor)",
          source: String.raw`// Attaches the saved JWT to every outgoing request, when there is one.
// Public endpoints (e.g. /walkers) ignore the header; the backend only
// checks it on routes that require auth.
private val authInterceptor = okhttp3.Interceptor { chain ->
    val token = TokenStore.getToken()
    val request = if (token != null) {
        chain.request().newBuilder().addHeader("Authorization", "Bearer $token").build()
    } else {
        chain.request()
    }
    chain.proceed(request)
}

private val client = OkHttpClient.Builder()
    .addInterceptor(authInterceptor)
    .addInterceptor(HttpLoggingInterceptor().apply { level = HttpLoggingInterceptor.Level.BASIC })
    .build()`,
          caption: "One interceptor, wired in once. Every repository that goes through `Network.api` gets this for free — WalkerRepository never thinks about tokens at all.",
        },
        {
          type: "text",
          md: [
            "## How a chain interceptor works",
            "`okhttp3.Interceptor { chain -> ... }` is a lambda taking one parameter, `chain`, that represents \"the request on its way out, plus the ability to send it onward.\" The pattern:",
            "1. **Ask `TokenStore` for the token.** `TokenStore.getToken()` returns `String?` — remember, no saved token is a normal `null`, not an error.\n2. **Branch on whether there is one.** If `token != null`, build a *new* request that's a copy of the original plus one extra header: `chain.request().newBuilder().addHeader(...).build()`. HTTP requests in OkHttp are immutable, so \"adding a header\" always means building a fresh copy via `newBuilder()`. If there's no token, just reuse `chain.request()` unchanged — public endpoints like `/walkers` don't need the header, and the backend simply ignores it if it's missing.\n3. **`chain.proceed(request)`** — hands the (possibly modified) request to the next link in the chain, eventually reaching the network. Whatever it returns becomes this interceptor's return value.",
            "Notice this interceptor knows nothing about *why* a request needs auth or not — it just always tries to attach the token if one exists, and the backend decides per-route whether to check it. That separation is what lets one interceptor cover every endpoint, forever, with zero per-call code.",
          ],
        },
        {
          type: "quiz",
          q: "Why does the interceptor build a whole new request with `newBuilder().addHeader(...).build()` instead of just mutating the existing `chain.request()` object?",
          choices: [
            "newBuilder() is faster than direct mutation",
            "OkHttp Request objects are immutable — there's no header-setter to mutate, so \"changing\" a request always means building a new one from a builder copy",
            "Only newBuilder() results are allowed to have an Authorization header",
            "Kotlin doesn't allow modifying objects inside a lambda",
          ],
          answer: 1,
          explain: "OkHttp models a Request as a value that, once built, doesn't change — the same immutability discipline you'll see again with StateFlow later in this course. `newBuilder()` copies every existing field into a fresh mutable builder, `addHeader` adds one more, and `build()` produces a new, distinct Request. The original is untouched.",
          nudge: "Is there a `request.headers.add(...)` method anywhere in this snippet? What does that suggest about whether Request objects can be mutated in place?",
        },
        {
          type: "exercise",
          title: "Rebuild the interceptor",
          prompt: [
            "Fill in the interceptor's body. In order:",
            "1. `val token = TokenStore.getToken()`\n2. `val request = if (token != null) { chain.request().newBuilder().addHeader(\"Authorization\", \"Bearer $token\").build() } else { chain.request() }`\n3. `chain.proceed(request)`",
          ],
          starter: String.raw`private val authInterceptor = okhttp3.Interceptor { chain ->
    // your code here
}`,
          solution: String.raw`private val authInterceptor = okhttp3.Interceptor { chain ->
    val token = TokenStore.getToken()
    val request = if (token != null) {
        chain.request().newBuilder().addHeader("Authorization", "Bearer $token").build()
    } else {
        chain.request()
    }
    chain.proceed(request)
}`,
          checks: [
            { re: /val token=TokenStore\.getToken\(\)/, hint: "First line: `val token = TokenStore.getToken()`." },
            { re: /addHeader\("Authorization","Bearer\$token"\)/, hint: "The header call is `addHeader(\"Authorization\", \"Bearer $token\")` — note the space before `$token` inside the string." },
            { re: /chain\.proceed\(request\)/, hint: "Finish with `chain.proceed(request)` — this is what actually sends the (possibly modified) request onward." },
          ],
          mustNot: [
            { re: /chain\.proceed\(chain\.request\(\)\)/, hint: "Proceed with your local `request` variable, not `chain.request()` directly — otherwise the header you just built never actually gets sent." },
          ],
          success: "That's Network.kt's authInterceptor, verbatim. Every repository in the app now attaches the token automatically, forever, without a single line of token-handling code in any of them.",
        },
      ],
    },
    // ────────────────────────────────────────────────────────────────────
    {
      id: "the-auth-screens",
      title: "The Auth Screens",
      steps: [
        {
          type: "text",
          md: [
            "## One screen, two modes",
            "Login and signup share almost every field — only *name* and the role picker are signup-only. Rather than two near-duplicate composables, PawWalk ships one `AuthScreen` with a boolean flag, `isSignup`, that toggles which fields show and which request fires. You've seen this exact instinct before with `UiState` in Module 2: model the difference, share everything else.",
            "The screen's local state is a handful of `remember { mutableStateOf(...) }` fields you met in Module 5 — `email`, `password`, `name`, `role`, plus a `validationError`. It reaches its `AuthViewModel` the same way `WalkersScreen` reaches its view model: `viewModel: AuthViewModel = viewModel()` as a default parameter.",
          ],
        },
        {
          type: "code",
          title: "ui/screens/AuthScreen.kt (state + submit)",
          source: String.raw`@Composable
fun AuthScreen(viewModel: AuthViewModel = viewModel()) {
    val c = Hud.colors
    val state by viewModel.state.collectAsState()

    var isSignup by remember { mutableStateOf(false) }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var name by remember { mutableStateOf("") }
    var role by remember { mutableStateOf("owner") }
    var validationError by remember { mutableStateOf<String?>(null) }

    val loading = state is AuthViewModel.UiState.Loading
    val serverError = (state as? AuthViewModel.UiState.Error)?.message

    fun submit() {
        validationError = validate(email, password, name, isSignup)
        if (validationError != null) return
        if (isSignup) viewModel.signup(email.trim(), password, name.trim(), role)
        else viewModel.login(email.trim(), password)
    }`,
          caption: "`validate(...)` is a small private function further down the file — local checks only (blank fields, `@` in the email, password length). The backend stays the source of truth for real rules like \"email already registered\".",
        },
        {
          type: "quiz",
          q: "In `val serverError = (state as? AuthViewModel.UiState.Error)?.message`, what does `as?` do if `state` is actually `UiState.Loading` at that moment?",
          choices: [
            "It throws a ClassCastException",
            "It converts Loading into an Error automatically",
            "It blocks until state changes to Error",
            "It safely produces null instead of crashing — `as?` is a \"try to cast, or give me null\" operator, so `serverError` ends up null and the `?.message` never even runs",
          ],
          answer: 3,
          explain: "`as` crashes on a mismatched type; `as?` is its safe cousin — it evaluates to the value cast to that type, or `null` if the value isn't actually that type. Chaining `?.message` afterward means the whole expression short-circuits to `null` unless `state` really is an `Error`. This is the sealed-interface `when`-adjacent pattern you saw in Module 2, applied to one branch at a time.",
          nudge: "What's the difference between Kotlin's `as` and `as?` when the cast doesn't match?",
        },
        {
          type: "text",
          md: [
            "## The view model: one Loading/Error/Success shape for both flows",
            "`AuthViewModel` gives login and signup the exact same shape of result — a `UiState` (the sealed interface pattern from Module 2, again) — through one private helper, `runAuthCall`. It takes a `suspend () -> User` lambda: \"no arguments, may suspend, produces a `User`.\" `signup` and `login` each hand it a different one-liner; everything downstream — the Loading flip, catching failures, turning them into a message — is written exactly once.",
          ],
        },
        {
          type: "code",
          title: "ui/screens/AuthViewModel.kt (the shared call path)",
          source: String.raw`fun signup(email: String, password: String, name: String, role: String) = runAuthCall {
    AuthRepository.signup(email, password, name, role)
}

fun login(email: String, password: String) = runAuthCall {
    AuthRepository.login(email, password)
}

fun logout() {
    AuthRepository.logout()
    _currentUser.value = null
    _signedIn.value = false
    _state.value = UiState.Idle
}

private fun runAuthCall(block: suspend () -> User) {
    viewModelScope.launch {
        _state.value = UiState.Loading
        _state.value = try {
            val user = block()
            _currentUser.value = user
            _signedIn.value = true
            UiState.Success(user)
        } catch (e: Exception) {
            UiState.Error(e.toUserMessage())
        }
    }
}`,
          caption: "`viewModelScope.launch { ... }` is the coroutine bridge from Module 3/7 — it's what lets `runAuthCall` call the `suspend fun`s on `AuthRepository` at all. Neither `signup` nor `login` returns anything; the screen just observes `state` change.",
        },
        {
          type: "quiz",
          q: "Where must the auth token NEVER be allowed to live, based on everything this module has built?",
          choices: [
            "Hardcoded as a string literal committed to git, or held only inside a Composable's local variable that vanishes on recomposition — the token belongs in TokenStore's encrypted storage and nowhere else",
            "In viewModelScope",
            "In a suspend function",
            "In a sealed interface",
          ],
          answer: 0,
          explain: "The whole architecture in this module exists to funnel the token through exactly one path: earned from the backend, saved by TokenStore into encrypted, Keystore-backed storage, read back only by the interceptor. Committing it to source control or stashing it in a screen's local state would defeat all of that — either exposes it or loses it the moment the composable is gone.",
          nudge: "Think about the two failure modes this module worked hard to avoid: the token leaking to someone who shouldn't have it, or disappearing when it shouldn't.",
        },
        {
          type: "exercise",
          title: "Capstone: rebuild runAuthCall's happy path",
          prompt: [
            "`viewModelScope.launch { ... }` and the `_state.value = UiState.Loading` line are given. Write the `try` block's three lines, in order:",
            "1. `val user = block()`\n2. `_currentUser.value = user`\n3. `_signedIn.value = true`",
            "Then finish the block with `UiState.Success(user)` as its last expression (already given) — the whole `try` is itself an expression, whose value becomes `_state.value`.",
          ],
          starter: String.raw`private fun runAuthCall(block: suspend () -> User) {
    viewModelScope.launch {
        _state.value = UiState.Loading
        _state.value = try {
            // your code here
            UiState.Success(user)
        } catch (e: Exception) {
            UiState.Error(e.toUserMessage())
        }
    }
}`,
          solution: String.raw`private fun runAuthCall(block: suspend () -> User) {
    viewModelScope.launch {
        _state.value = UiState.Loading
        _state.value = try {
            val user = block()
            _currentUser.value = user
            _signedIn.value = true
            UiState.Success(user)
        } catch (e: Exception) {
            UiState.Error(e.toUserMessage())
        }
    }
}`,
          checks: [
            { re: /val user=block\(\)/, hint: "First line inside `try`: `val user = block()` — this calls whichever suspend lambda `signup` or `login` handed in." },
            { re: /_currentUser\.value=user/, hint: "Second: `_currentUser.value = user` — update the shared current-user state." },
            { re: /_signedIn\.value=true/, hint: "Third: `_signedIn.value = true` — this is what flips MainActivity's gate from AuthScreen to the signed-in app." },
          ],
          mustNot: [
            { re: /try\{block\(\)\}/, hint: "Don't just call `block()` and discard it — you need the `User` it returns to update `_currentUser` and build the `Success` state." },
          ],
          success: "That's the real happy path from AuthViewModel.kt. Trace the full circle: AuthScreen.submit() → viewModel.login/signup → runAuthCall → AuthRepository → Network's interceptor picks up the fresh token on every request after this.",
        },
      ],
    },
  ],
});
