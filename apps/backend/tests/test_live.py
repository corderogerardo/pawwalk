"""Live-tracking WebSocket + track endpoint (runs on SQLite — PostGIS bits are
dialect-guarded, so these pass without a Postgres server)."""
from __future__ import annotations

from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from starlette.websockets import WebSocketDisconnect


def _signup(client: TestClient) -> str:
    r = client.post(
        "/auth/signup",
        json={"email": f"walk+{uuid4().hex[:8]}@ex.com", "password": "correct-horse", "name": "W"},
    )
    return r.json()["access_token"]


def _booking(client: TestClient, token: str) -> str:
    r = client.post(
        "/bookings",
        headers={"Authorization": f"Bearer {token}"},
        json={"walker_id": "wlk_sam", "dog_name": "Rex", "start_time": "2026-07-06T10:00:00Z",
              "duration_minutes": 30},
    )
    return r.json()["id"]


def test_ws_streams_and_persists(client: TestClient) -> None:
    token = _signup(client)
    headers = {"Authorization": f"Bearer {token}"}
    bid = _booking(client, token)

    with client.websocket_connect(f"/ws/track/{bid}?token={token}") as ws:
        history = ws.receive_json()
        assert history == {"type": "history", "points": []}
        ws.send_json({"type": "position", "lat": 37.7749, "lng": -122.4194})
        echoed = ws.receive_json()
        assert echoed["type"] == "position"
        assert echoed["lat"] == 37.7749 and echoed["lng"] == -122.4194

    track = client.get(f"/bookings/{bid}/track", headers=headers).json()
    assert len(track) == 1
    assert track[0]["lat"] == 37.7749


def test_ws_rejects_bad_token(client: TestClient) -> None:
    token = _signup(client)
    bid = _booking(client, token)
    with pytest.raises(WebSocketDisconnect):
        with client.websocket_connect(f"/ws/track/{bid}?token=not-a-token") as ws:
            ws.receive_json()


def test_ws_rejects_other_users_booking(client: TestClient) -> None:
    owner = _signup(client)
    bid = _booking(client, owner)
    other = _signup(client)
    with pytest.raises(WebSocketDisconnect):
        with client.websocket_connect(f"/ws/track/{bid}?token={other}") as ws:
            ws.receive_json()


def test_simulate_starts_for_owner(client: TestClient) -> None:
    token = _signup(client)
    bid = _booking(client, token)
    r = client.post(f"/bookings/{bid}/simulate", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 202
    assert r.json()["points"] > 0


def test_simulate_rejects_other_users_booking(client: TestClient) -> None:
    owner = _signup(client)
    bid = _booking(client, owner)
    other = _signup(client)
    r = client.post(f"/bookings/{bid}/simulate", headers={"Authorization": f"Bearer {other}"})
    assert r.status_code == 404


def test_ws_allows_assigned_walker(client: TestClient) -> None:
    """The assigned walker streams the GPS fixes — they must be able to join
    the channel even though the booking belongs to the owner."""
    owner = _signup(client)
    bid = _booking(client, owner)  # booked with seeded walker wlk_sam
    walker_login = client.post(
        "/auth/login", json={"email": "sam@pawwalk.app", "password": "PawwalkDemo1!"}
    )
    assert walker_login.status_code == 200
    walker_token = walker_login.json()["access_token"]

    with client.websocket_connect(f"/ws/track/{bid}?token={walker_token}") as ws:
        assert ws.receive_json()["type"] == "history"
        ws.send_json({"type": "position", "lat": 37.7749, "lng": -122.4194})
        assert ws.receive_json()["type"] == "position"

    track = client.get(
        f"/bookings/{bid}/track", headers={"Authorization": f"Bearer {walker_token}"}
    )
    assert track.status_code == 200
    assert len(track.json()) == 1


def test_demo_route_is_deterministic_and_local() -> None:
    from app.live import demo_route

    route = demo_route()
    assert len(route) == 45
    assert route == demo_route()  # no RNG
    lats = [lat for lat, _ in route]
    lngs = [lng for _, lng in route]
    assert all(37.74 < lat < 37.77 for lat in lats)  # stays near the Sunset District
    assert all(-122.51 < lng < -122.48 for lng in lngs)
