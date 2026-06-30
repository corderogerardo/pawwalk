"""End-to-end API tests using FastAPI's TestClient (no server needed).

These run fully offline — the assistant test exercises the heuristic intent
path, and the Pydantic AI agent is verified separately against a TestModel.

The `client` fixture (see conftest.py) enters `TestClient` as a context
manager so the app's lifespan runs — that's what creates tables and seeds
walkers against the throwaway test DB.
"""
from __future__ import annotations

from datetime import datetime, timezone


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_cors_allows_dev_origin_rejects_others(client):
    r_allowed = client.get("/health", headers={"Origin": "http://localhost:3000"})
    assert r_allowed.headers.get("access-control-allow-origin") == "http://localhost:3000"

    r_blocked = client.get("/health", headers={"Origin": "http://evil.example.com"})
    assert "access-control-allow-origin" not in r_blocked.headers


def test_unhandled_exception_returns_consistent_error_shape(monkeypatch):
    """A bug shouldn't leak a non-JSON response that breaks the contract's error shape."""
    from fastapi.testclient import TestClient

    from app import data
    from app.main import app

    def boom(*args, **kwargs):
        raise RuntimeError("boom")

    monkeypatch.setattr(data, "list_walkers", boom)

    with TestClient(app, raise_server_exceptions=False) as c:
        r = c.get("/walkers")
        assert r.status_code == 500
        assert r.json() == {"detail": "Internal server error"}


def test_list_walkers(client):
    r = client.get("/walkers")
    assert r.status_code == 200
    assert len(r.json()) >= 1


def test_get_walker(client):
    r = client.get("/walkers/wlk_sam")
    assert r.status_code == 200
    assert r.json()["id"] == "wlk_sam"

    r2 = client.get("/walkers/wlk_nope")
    assert r2.status_code == 404


def test_create_and_cancel_booking(client, auth_headers):
    payload = {
        "walker_id": "wlk_sam",
        "dog_name": "Cooper",
        "start_time": datetime(2026, 7, 1, 15, 0, tzinfo=timezone.utc).isoformat(),
        "duration_minutes": 60,
    }
    r = client.post("/bookings", json=payload, headers=auth_headers)
    assert r.status_code == 201, r.text
    booking = r.json()
    assert booking["status"] == "pending"
    # 60 min at 1800/30min => 3600 cents
    assert booking["price_cents"] == 3600

    bid = booking["id"]
    r2 = client.post("/payments/intent", json={"booking_id": bid}, headers=auth_headers)
    assert r2.status_code == 200
    assert r2.json()["amount_cents"] == 3600
    assert r2.json()["client_secret"].startswith("pi_stub_")  # no Stripe key in tests

    r3 = client.post(f"/bookings/{bid}/cancel", headers=auth_headers)
    assert r3.status_code == 200
    assert r3.json()["status"] == "cancelled"


def test_payment_intent_uses_real_stripe_when_key_set(client, auth_headers, monkeypatch):
    import stripe

    from app.config import settings as app_settings

    payload = {
        "walker_id": "wlk_sam",
        "dog_name": "Cooper",
        "start_time": datetime(2026, 7, 1, 15, 0, tzinfo=timezone.utc).isoformat(),
        "duration_minutes": 30,
    }
    booking = client.post("/bookings", json=payload, headers=auth_headers).json()

    monkeypatch.setattr(app_settings, "stripe_secret_key", "sk_test_fake")

    class FakeIntent:
        client_secret = "pi_real_fake_secret"

    def fake_create(**kwargs):
        assert kwargs["amount"] == booking["price_cents"]
        assert kwargs["currency"] == "usd"
        assert kwargs["metadata"] == {"booking_id": booking["id"]}
        return FakeIntent()

    monkeypatch.setattr(stripe.PaymentIntent, "create", fake_create)

    r = client.post("/payments/intent", json={"booking_id": booking["id"]}, headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["client_secret"] == "pi_real_fake_secret"


def test_payment_intent_unknown_booking_404(client, auth_headers):
    r = client.post("/payments/intent", json={"booking_id": "bkg_nope"}, headers=auth_headers)
    assert r.status_code == 404


def test_webhook_not_configured_400(client):
    r = client.post("/payments/webhook", content=b"{}", headers={"stripe-signature": "t=1,v1=fake"})
    assert r.status_code == 400


def test_webhook_confirms_booking_on_payment_succeeded(client, auth_headers, monkeypatch):
    import stripe

    from app.config import settings as app_settings

    payload = {
        "walker_id": "wlk_sam",
        "dog_name": "Cooper",
        "start_time": datetime(2026, 7, 1, 15, 0, tzinfo=timezone.utc).isoformat(),
        "duration_minutes": 30,
    }
    booking = client.post("/bookings", json=payload, headers=auth_headers).json()

    monkeypatch.setattr(app_settings, "stripe_webhook_secret", "whsec_fake")
    fake_event = {
        "type": "payment_intent.succeeded",
        "data": {"object": {"metadata": {"booking_id": booking["id"]}}},
    }
    monkeypatch.setattr(stripe.Webhook, "construct_event", lambda *a, **k: fake_event)

    r = client.post("/payments/webhook", content=b"{}", headers={"stripe-signature": "t=1,v1=fake"})
    assert r.status_code == 200
    assert r.json() == {"received": True}

    r2 = client.get(f"/bookings/{booking['id']}", headers=auth_headers)
    assert r2.json()["status"] == "confirmed"


def test_bookings_require_auth(client):
    r = client.get("/bookings")
    assert r.status_code == 401


def test_booking_unknown_walker_404(client, auth_headers):
    payload = {
        "walker_id": "wlk_nope",
        "dog_name": "Rex",
        "start_time": datetime(2026, 7, 1, 15, 0, tzinfo=timezone.utc).isoformat(),
        "duration_minutes": 30,
    }
    r = client.post("/bookings", json=payload, headers=auth_headers)
    assert r.status_code == 404


def test_booking_scoped_to_owner(client):
    def signup(email):
        r = client.post("/auth/signup", json={"email": email, "password": "correct-horse", "name": email})
        return {"Authorization": f"Bearer {r.json()['access_token']}"}

    a_headers = signup("a@example.com")
    b_headers = signup("b@example.com")

    payload = {
        "walker_id": "wlk_sam",
        "dog_name": "Cooper",
        "start_time": datetime(2026, 7, 1, 15, 0, tzinfo=timezone.utc).isoformat(),
        "duration_minutes": 30,
    }
    r = client.post("/bookings", json=payload, headers=a_headers)
    bid = r.json()["id"]

    # B can't see A's booking in their list...
    r_list = client.get("/bookings", headers=b_headers)
    assert bid not in [b["id"] for b in r_list.json()]

    # ...can't fetch it directly...
    r_get = client.get(f"/bookings/{bid}", headers=b_headers)
    assert r_get.status_code == 404

    # ...and can't cancel it.
    r_cancel = client.post(f"/bookings/{bid}/cancel", headers=b_headers)
    assert r_cancel.status_code == 404


def test_assistant_heuristic_path(client):
    r = client.post("/assistant/chat", json={"message": "walker in the Mission for 60 minutes tomorrow at 3pm"})
    assert r.status_code == 200
    body = r.json()
    assert "Mission" in body["reply"] or body["suggested_walkers"]
    assert body["draft_booking"]["duration_minutes"] == 60


def test_signup_login_me(client):
    r = client.post(
        "/auth/signup",
        json={"email": "jane@example.com", "password": "correct-horse", "name": "Jane Doe"},
    )
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["access_token"]
    assert body["user"]["email"] == "jane@example.com"

    r2 = client.post(
        "/auth/login", json={"email": "jane@example.com", "password": "wrong-password"}
    )
    assert r2.status_code == 401

    r3 = client.post(
        "/auth/login", json={"email": "jane@example.com", "password": "correct-horse"}
    )
    assert r3.status_code == 200
    token = r3.json()["access_token"]

    r4 = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r4.status_code == 200
    assert r4.json()["email"] == "jane@example.com"

    r5 = client.get("/auth/me")
    assert r5.status_code == 401


def test_signup_duplicate_email_409(client):
    payload = {"email": "dup@example.com", "password": "correct-horse", "name": "Dup"}
    r1 = client.post("/auth/signup", json=payload)
    assert r1.status_code == 201
    r2 = client.post("/auth/signup", json=payload)
    assert r2.status_code == 409


def test_signup_malformed_input_422(client):
    bad_email = client.post(
        "/auth/signup", json={"email": "not-an-email", "password": "correct-horse", "name": "X"}
    )
    assert bad_email.status_code == 422
    assert "detail" in bad_email.json()

    short_password = client.post(
        "/auth/signup", json={"email": "short@example.com", "password": "short", "name": "X"}
    )
    assert short_password.status_code == 422
    assert "detail" in short_password.json()


def test_pydantic_ai_agent_with_test_model():
    """Prove the Pydantic AI agent returns a typed BookingIntent, offline."""
    from pydantic_ai import Agent
    from pydantic_ai.models.test import TestModel

    from app.schemas import BookingIntent

    agent = Agent(TestModel(), output_type=BookingIntent, instructions="Extract booking intent.")
    out = agent.run_sync("walker in SoMa").output
    assert isinstance(out, BookingIntent)
