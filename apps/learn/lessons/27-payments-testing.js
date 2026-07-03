window.COURSE = window.COURSE || [];
window.COURSE.push({
  id: "payments-testing",
  title: "Payments & Testing",
  emoji: "💳",
  lang: "python",
  lessons: [
    {
      id: "payments",
      title: "How a payment actually happens",
      steps: [
        {
          type: "text",
          md: [
            "## Money never touches your server",
            "PawWalk never sees a credit card number — that's Stripe's job. Your backend's job is narrower: create a **PaymentIntent** (Stripe's object for \"we intend to charge this much\"), hand the client a `client_secret`, and let the mobile app finish the charge directly with Stripe. Read the real router.",
          ],
        },
        {
          type: "code",
          title: "app/routers/payments.py",
          source: String.raw`@router.post("/intent", response_model=PaymentIntentResponse)
def create_intent(
    req: PaymentIntentRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> PaymentIntentResponse:
    booking = data.get_booking(session, req.booking_id, current_user.id)
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found")

    if settings.has_stripe:
        intent = stripe.PaymentIntent.create(
            amount=booking.price_cents,
            currency="usd",
            metadata={"booking_id": booking.id},
            api_key=settings.stripe_secret_key,
        )
        client_secret = intent.client_secret
    else:
        client_secret = f"pi_stub_{booking.id}_secret"

    return PaymentIntentResponse(client_secret=client_secret, amount_cents=booking.price_cents)`,
          caption: "No Stripe key configured (like in every test and most dev setups)? The `else` branch returns a stub `client_secret` with the exact same response shape — the mobile app can't tell the difference.",
        },
        {
          type: "text",
          md: [
            "## Amounts in cents — again",
            "Notice `amount=booking.price_cents` — a plain `int`, not a `float` dollar amount. You met this in Part I's `priceLabel` and again in module 14: floating-point dollars accumulate rounding errors (`$19.99 + $0.01` can land on `$20.00000000000002`). Stripe's own API is cents-denominated for the same reason. One integer type, no ambiguity, all the way from the database to Stripe's servers.",
          ],
        },
        {
          type: "text",
          md: [
            "## Statuses and idempotency",
            "A booking's `status` moves through `pending → confirmed → …` (module 26 territory) as payment events land. A real payment can be **retried** — a flaky network means the mobile app might call `/payments/intent` twice for the same booking. That's why the request carries `booking_id`, not a fresh blank slate: calling it again for a booking that's already paid should be safe, not double-charge the customer. This safety property — *doing the same operation twice has the same effect as doing it once* — is called **idempotency**, and it's why payment APIs are built around stable IDs instead of \"just charge the card again.\"",
          ],
        },
        {
          type: "text",
          md: [
            "## Webhooks: Stripe calls you back",
            "`/payments/intent` only *starts* a charge — the card might take a few seconds to actually clear. Stripe reports the outcome by calling your server back on a **webhook**: a plain HTTP endpoint Stripe `POST`s to, verified by a signature header instead of a login token (Stripe isn't a logged-in user).",
          ],
        },
        {
          type: "code",
          title: "app/routers/payments.py",
          source: String.raw`@router.post("/webhook")
async def stripe_webhook(request: Request, session: Session = Depends(get_session)) -> dict[str, bool]:
    """Stripe calls this directly (no auth header) — verified via signature instead."""
    if not settings.stripe_webhook_secret:
        raise HTTPException(status_code=400, detail="Stripe webhooks not configured")

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, settings.stripe_webhook_secret)
    except (ValueError, stripe.SignatureVerificationError) as exc:
        raise HTTPException(status_code=400, detail="Invalid webhook signature") from exc

    if event["type"] == "payment_intent.succeeded":
        booking_id = event["data"]["object"]["metadata"].get("booking_id")
        if booking_id:
            data.confirm_booking(session, booking_id)

    return {"received": True}`,
          caption: "The `metadata={\"booking_id\": booking.id}` set back in `create_intent` is how the webhook finds its way back to the right booking — Stripe echoes metadata back on every event.",
        },
        {
          type: "text",
          md: [
            "## The repo pattern first, Stripe in production as the outlook",
            "Everything above works with **zero Stripe account**: no key configured means `create_intent` returns a stub and the webhook route politely 400s. That's deliberate — the pattern (intent → client finishes the charge → webhook confirms) is what matters for learning; wiring a real Stripe account (test API keys, forwarding webhooks with the Stripe CLI) is a drop-in swap once `settings.stripe_secret_key` is set, with no code changes.",
          ],
        },
        {
          type: "quiz",
          q: "The mobile app calls POST /payments/intent for a booking twice in a row (a retry after a flaky network). What should NOT happen?",
          choices: [
            "The customer's card gets charged twice",
            "The server returns the same response shape both times",
            "A stub client_secret is returned when Stripe isn't configured",
            "The booking_id is looked up again on the second call",
          ],
          answer: 0,
          explain: "That's exactly what idempotency protects against — retries and double-taps should be safe. Stripe's PaymentIntent is built so re-confirming an existing intent doesn't create a second charge.",
          nudge: "Think about the property this lesson just named: doing the same operation twice should have the same effect as doing it once.",
        },
      ],
    },
    {
      id: "pytest-testclient",
      title: "pytest & TestClient",
      steps: [
        {
          type: "text",
          md: [
            "## Tests that never touch the network",
            "Every backend module so far you've poked by hand: run the server, hit `/docs`, read the JSON. `pytest` automates exactly that, without a running server or a real database. FastAPI's `TestClient` sends requests straight into your app in-process — same routing, same validation, same responses, just no socket.",
          ],
        },
        {
          type: "code",
          title: "tests/conftest.py",
          source: String.raw`def pytest_configure(config: pytest.Config) -> None:
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    os.environ["PAWWALK_DATABASE_URL"] = f"sqlite:///{path}"
    config._pawwalk_db_path = path
    # Tests run fully offline with zero setup — a throwaway secret here doesn't
    # weaken the "no default in real deployments" guarantee in app/config.py.
    os.environ.setdefault("PAWWALK_JWT_SECRET", "test-secret-not-for-prod")


@pytest.fixture()
def client() -> Iterator[TestClient]:
    from app.main import app  # imported lazily so PAWWALK_DATABASE_URL is set first

    with TestClient(app) as c:
        yield c`,
          caption: "`pytest_configure` swaps in a brand-new throwaway SQLite file BEFORE any app code runs — so tests never touch your real dev database. A `@pytest.fixture` is a reusable setup function; any test that takes a `client` argument gets a fresh, ready-to-use `TestClient`.",
        },
        {
          type: "text",
          md: [
            "## Fixtures build on fixtures",
            "`conftest.py` also defines `auth_headers`, a fixture that itself asks for `client` — it signs up a throwaway user and hands back a ready `Authorization` header. Any test that needs a logged-in user just adds `auth_headers` to its parameter list; pytest wires the dependency chain automatically, the same spirit as FastAPI's `Depends(...)` from module 24.",
          ],
        },
        {
          type: "code",
          title: "tests/test_api.py",
          source: String.raw`def test_list_walkers(client):
    r = client.get("/walkers")
    assert r.status_code == 200
    assert len(r.json()) >= 1`,
          caption: "One real test, start to finish: `client` is the fixture from conftest.py, `client.get(...)` sends the request in-process, and `assert` is a plain Python statement — if the condition is falsy, the test fails right there.",
        },
        {
          type: "text",
          md: [
            "## `def test_...` is the whole discovery mechanism",
            "pytest finds tests by naming convention alone: any function named `test_*` in a file named `test_*.py` gets collected and run — no decorator, no registration list, no base class to inherit from. Run the whole suite with `uv run pytest`; it prints a dot per passing test and a full traceback for any failure.",
          ],
        },
        {
          type: "quiz",
          q: "Why does conftest.py point PAWWALK_DATABASE_URL at a brand-new temp file in pytest_configure, before any test runs?",
          choices: [
            "So tests run against an isolated, throwaway database instead of your real dev data",
            "Because SQLite requires a new file for every connection",
            "To make the tests run faster than Postgres would",
            "So multiple developers can share the same test database over the network",
          ],
          answer: 0,
          explain: "Isolation is the whole point: tests can create users, bookings, and payments freely, and nothing they do ever touches — or is affected by — your real database.",
          nudge: "What would go wrong if `uv run pytest` reused the same database file you seed and browse in `/docs`?",
        },
        {
          type: "exercise",
          title: "Write the walkers test",
          prompt: [
            "Fill in the body of `test_list_walkers` so it asserts `GET /walkers` returns **200** and **at least one** walker. Use the `client` fixture — it's already offered as a parameter.",
          ],
          starter: String.raw`def test_list_walkers(client):
    # your code here
`,
          solution: String.raw`def test_list_walkers(client):
    resp = client.get("/walkers")
    assert resp.status_code == 200
    assert len(resp.json()) >= 1`,
          checks: [
            { re: /def test_list_walkers\(client\):/, hint: "Keep the function name and signature exactly as given — pytest discovers tests by the `test_` prefix." },
            { re: /client\.get\("\/walkers"\)/, hint: "Send the request with `client.get(\"/walkers\")` — that's the TestClient method for a GET." },
            { re: /assert.+status_code==200/, hint: "Check the response status: `assert <response>.status_code == 200`." },
            { re: /assert len\(.+\)>=1/, hint: "Check there's at least one walker in the JSON body: `assert len(<response>.json()) >= 1`." },
          ],
          mustNot: [
            { re: /pass/, hint: "A bare `pass` doesn't test anything — the body needs real assertions." },
          ],
          success: "That's a real pytest test — the same shape as every test in tests/test_api.py.",
        },
      ],
    },
    {
      id: "write-your-own-test",
      title: "Write your own test",
      steps: [
        {
          type: "text",
          md: [
            "## A second style: stats and dedup",
            "`tests/test_stats_waitlist.py` tests different endpoints but leans on the exact same fixtures. Skimming a second file is how you learn a codebase's testing habits fast — the *shape* repeats even when the behavior doesn't.",
          ],
        },
        {
          type: "code",
          title: "tests/test_stats_waitlist.py",
          source: String.raw`def test_waitlist_accepts_and_dedupes(client: TestClient) -> None:
    email = f"lead+{uuid4().hex[:8]}@example.com"
    first = client.post("/waitlist", json={"email": email})
    assert first.status_code == 201
    assert first.json() == {"status": "ok"}
    again = client.post("/waitlist", json={"email": email.upper()})
    assert again.status_code == 200  # deduped case-insensitively
    assert again.json() == {"status": "ok"}`,
          caption: "Same `client` fixture, same `assert`-per-line style — just a different endpoint and a made-up unique email per run (`uuid4().hex[:8]`) so tests never collide with each other.",
        },
        {
          type: "text",
          md: [
            "## Your turn: the availability endpoint from module 24",
            "Back in module 24 you added a real (if toy) `GET /walkers/{id}/availability` endpoint to the repo. It has no test yet. Time to close that gap for real, in the actual codebase — not a browser exercise this time.",
          ],
        },
        {
          type: "xcode",
          label: "Over to the terminal",
          title: "Add and run a real test",
          intro: [
            "Add a new test file next to the existing ones and get the suite green:",
          ],
          items: [
            "Create `apps/backend/tests/test_availability.py`",
            "Write `def test_walker_availability(client):` that calls `client.get(\"/walkers/wlk_sam/availability\")`",
            "Assert `resp.status_code == 200`",
            "Assert the response JSON has at least one slot (e.g. `assert len(resp.json()[\"slots\"]) >= 1`, adjusting the key to match whatever shape your module 24 endpoint actually returns)",
            "Run `cd apps/backend && uv run pytest` — keep adjusting your test until it's green",
            "Run `uv run pytest -k availability` to run just your new test in isolation",
          ],
        },
        {
          type: "quiz",
          q: "You're reviewing a teammate's new test. It calls three different endpoints and has one assert at the very end checking the last response. What's the best fix?",
          choices: [
            "Split it into separate tests, one behavior each, following arrange → act → assert",
            "Leave it — more endpoints covered per test means better coverage",
            "Delete the asserts on the first two endpoints since they're not checked anyway",
            "Add a comment explaining what each endpoint does",
          ],
          answer: 0,
          explain: "A good test checks ONE behavior: arrange the setup, act (make the call), assert the outcome. When a three-endpoint test fails, you don't know which of the three broke — split tests are cheap to write and precise to debug.",
          nudge: "If this test goes red, could you tell which of the three endpoints broke it?",
        },
      ],
    },
  ],
});
