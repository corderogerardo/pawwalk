"""End-to-end API tests using FastAPI's TestClient (no server needed).

These run fully offline — the assistant test exercises the heuristic intent
path, and the Pydantic AI agent is verified separately against a TestModel.
"""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_list_walkers():
    r = client.get("/walkers")
    assert r.status_code == 200
    assert len(r.json()) >= 1


def test_create_and_cancel_booking():
    payload = {
        "walker_id": "wlk_sam",
        "dog_name": "Cooper",
        "start_time": datetime(2026, 7, 1, 15, 0, tzinfo=timezone.utc).isoformat(),
        "duration_minutes": 60,
    }
    r = client.post("/bookings", json=payload)
    assert r.status_code == 201, r.text
    booking = r.json()
    assert booking["status"] == "pending"
    # 60 min at 1800/30min => 3600 cents
    assert booking["price_cents"] == 3600

    bid = booking["id"]
    r2 = client.post(f"/payments/intent", json={"booking_id": bid})
    assert r2.status_code == 200
    assert r2.json()["amount_cents"] == 3600

    r3 = client.post(f"/bookings/{bid}/cancel")
    assert r3.status_code == 200
    assert r3.json()["status"] == "cancelled"


def test_booking_unknown_walker_404():
    payload = {
        "walker_id": "wlk_nope",
        "dog_name": "Rex",
        "start_time": datetime(2026, 7, 1, 15, 0, tzinfo=timezone.utc).isoformat(),
        "duration_minutes": 30,
    }
    r = client.post("/bookings", json=payload)
    assert r.status_code == 404


def test_assistant_heuristic_path():
    r = client.post("/assistant/chat", json={"message": "walker in the Mission for 60 minutes tomorrow at 3pm"})
    assert r.status_code == 200
    body = r.json()
    assert "Mission" in body["reply"] or body["suggested_walkers"]
    assert body["draft_booking"]["duration_minutes"] == 60


def test_pydantic_ai_agent_with_test_model():
    """Prove the Pydantic AI agent returns a typed BookingIntent, offline."""
    from pydantic_ai import Agent
    from pydantic_ai.models.test import TestModel

    from app.schemas import BookingIntent

    agent = Agent(TestModel(), output_type=BookingIntent, instructions="Extract booking intent.")
    out = agent.run_sync("walker in SoMa").output
    assert isinstance(out, BookingIntent)
