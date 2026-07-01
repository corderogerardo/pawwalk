"""Roles (owner/walker), pets, and the walker workflow."""
from __future__ import annotations

from uuid import uuid4

from fastapi.testclient import TestClient


def _signup(client: TestClient, role: str = "owner") -> tuple[str, str]:
    """Returns (token, name)."""
    name = f"{role.title()} {uuid4().hex[:6]}"
    r = client.post("/auth/signup", json={
        "email": f"{role}+{uuid4().hex[:8]}@ex.com", "password": "correct-horse", "name": name, "role": role,
    })
    assert r.status_code == 201
    body = r.json()
    assert body["user"]["role"] == role
    return body["access_token"], name


def _h(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_walker_signup_creates_browsable_profile(client: TestClient) -> None:
    token, name = _signup(client, "walker")
    names = [w["name"] for w in client.get("/walkers").json()]
    assert name in names
    # walker can read + edit their own profile
    me = client.get("/walkers/me", headers=_h(token)).json()
    assert me["name"] == name
    patched = client.patch("/walkers/me", headers=_h(token), json={"price_per_30min_cents": 2500}).json()
    assert patched["price_per_30min_cents"] == 2500


def test_pets_are_owner_scoped(client: TestClient) -> None:
    owner, _ = _signup(client, "owner")
    created = client.post("/pets", headers=_h(owner), json={"name": "Mochi", "breed": "Shiba"})
    assert created.status_code == 201
    pet_id = created.json()["id"]
    assert [p["name"] for p in client.get("/pets", headers=_h(owner)).json()] == ["Mochi"]

    # a walker cannot touch pets
    walker, _ = _signup(client, "walker")
    assert client.post("/pets", headers=_h(walker), json={"name": "X"}).status_code == 403
    assert client.get("/pets", headers=_h(walker)).status_code == 403

    # another owner can't delete someone else's pet; the real owner can
    other, _ = _signup(client, "owner")
    assert client.delete(f"/pets/{pet_id}", headers=_h(other)).status_code == 404
    assert client.delete(f"/pets/{pet_id}", headers=_h(owner)).status_code == 204


def _book(client: TestClient, owner_token: str, walker_id: str) -> str:
    r = client.post("/bookings", headers=_h(owner_token), json={
        "walker_id": walker_id, "dog_name": "Mochi", "start_time": "2026-07-06T10:00:00Z", "duration_minutes": 30,
    })
    return r.json()["id"]


def test_walker_workflow_transitions(client: TestClient) -> None:
    owner, _ = _signup(client, "owner")
    walker, name = _signup(client, "walker")
    walker_id = next(w["id"] for w in client.get("/walkers").json() if w["name"] == name)
    bid = _book(client, owner, walker_id)

    # walker sees it assigned, pending
    assigned = client.get("/bookings/assigned", headers=_h(walker)).json()
    assert [b["id"] for b in assigned] == [bid]
    assert assigned[0]["status"] == "pending"

    # accept → confirmed → in_progress → completed
    assert client.post(f"/bookings/{bid}/accept", headers=_h(walker)).json()["status"] == "confirmed"
    assert client.post(f"/bookings/{bid}/start", headers=_h(walker)).json()["status"] == "in_progress"
    assert client.post(f"/bookings/{bid}/complete", headers=_h(walker)).json()["status"] == "completed"


def test_transition_guards(client: TestClient) -> None:
    owner, _ = _signup(client, "owner")
    walker, name = _signup(client, "walker")
    walker_id = next(w["id"] for w in client.get("/walkers").json() if w["name"] == name)
    bid = _book(client, owner, walker_id)

    # owner (wrong role) can't accept
    assert client.post(f"/bookings/{bid}/accept", headers=_h(owner)).status_code == 403
    # can't start before accepting (wrong from-state)
    assert client.post(f"/bookings/{bid}/start", headers=_h(walker)).status_code == 409
    # a different walker can't touch this booking
    other, _ = _signup(client, "walker")
    assert client.post(f"/bookings/{bid}/accept", headers=_h(other)).status_code == 404
    # owners can't create bookings as walkers, and walkers can't create bookings
    assert client.post("/bookings", headers=_h(walker), json={
        "walker_id": walker_id, "dog_name": "X", "start_time": "2026-07-06T10:00:00Z", "duration_minutes": 30,
    }).status_code == 403
