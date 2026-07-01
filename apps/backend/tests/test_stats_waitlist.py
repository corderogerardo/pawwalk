"""Owner home stats (GET /bookings/stats), seeded demo accounts, and the
landing-page waitlist."""
from __future__ import annotations

from uuid import uuid4

from fastapi.testclient import TestClient


def _login_demo_owner(client: TestClient) -> dict[str, str]:
    r = client.post("/auth/login", json={"email": "demo@pawwalk.app", "password": "PawwalkDemo1!"})
    assert r.status_code == 200
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def test_seeded_demo_owner_has_pet_and_bookings(client: TestClient) -> None:
    headers = _login_demo_owner(client)
    pets = client.get("/pets", headers=headers).json()
    assert [p["name"] for p in pets] == ["Mochi"]
    bookings = client.get("/bookings", headers=headers).json()
    statuses = sorted(b["status"] for b in bookings)
    assert statuses == ["completed", "completed", "pending"]


def test_stats_reflect_seeded_walk_history(client: TestClient) -> None:
    stats = client.get("/bookings/stats", headers=_login_demo_owner(client)).json()
    assert stats["distance_km"] > 0
    assert stats["streak_days"] == 2  # completed walks yesterday + the day before
    assert len(stats["recent_walks"]) == 2
    walk = stats["recent_walks"][0]
    assert walk["walker_name"] == "Sam Rivera"
    assert walk["distance_km"] > 0
    assert len(walk["sparkline"]) == 6
    assert all(0 <= v <= 1 for v in walk["sparkline"])


def test_stats_empty_for_new_owner(client: TestClient, auth_headers: dict[str, str]) -> None:
    stats = client.get("/bookings/stats", headers=auth_headers).json()
    assert stats == {"distance_km": 0.0, "streak_days": 0, "recent_walks": []}


def test_stats_rejects_walker_role(client: TestClient) -> None:
    r = client.post("/auth/login", json={"email": "sam@pawwalk.app", "password": "PawwalkDemo1!"})
    headers = {"Authorization": f"Bearer {r.json()['access_token']}"}
    assert client.get("/bookings/stats", headers=headers).status_code == 403


def test_waitlist_accepts_and_dedupes(client: TestClient) -> None:
    email = f"lead+{uuid4().hex[:8]}@example.com"
    first = client.post("/waitlist", json={"email": email})
    assert first.status_code == 201
    assert first.json() == {"status": "ok"}
    again = client.post("/waitlist", json={"email": email.upper()})
    assert again.status_code == 200  # deduped case-insensitively
    assert again.json() == {"status": "ok"}


def test_waitlist_rejects_garbage_email(client: TestClient) -> None:
    assert client.post("/waitlist", json={"email": "not-an-email"}).status_code == 422
