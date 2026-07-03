"""Seed data for local/dev databases. Idempotent — each block only inserts
what's missing, so it's safe to run on every startup.

Demo accounts (password for all: ``PawwalkDemo1!``):

- ``demo@pawwalk.app`` — owner "Ger Cordero" with pet Mochi, two completed
  walks with recorded GPS tracks (so Home shows real distance/streak/recent
  walks) and one upcoming pending walk.
- ``sam@pawwalk.app`` / ``ari@pawwalk.app`` / ``jo@pawwalk.app`` — walker
  logins linked to the public walker profiles, so the walker workflow
  (accept → start → complete, live GPS streaming) is testable end to end.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import uuid4

from sqlmodel import Session, select

from .live import demo_route
from .models_db import BookingTable, PetTable, PositionTable, UserTable, WalkerTable
from .schemas import BookingStatus
from .security import hash_password

DEMO_PASSWORD = "PawwalkDemo1!"
DEMO_OWNER_EMAIL = "demo@pawwalk.app"

_WALKERS = [
    {
        "id": "wlk_sam", "name": "Sam Rivera", "email": "sam@pawwalk.app",
        "rating": 4.9, "price_per_30min_cents": 1800,
        "bio": "10 yrs with dogs. Loves huskies.", "neighborhoods": ["Mission", "SoMa"],
    },
    {
        "id": "wlk_ari", "name": "Ari Chen", "email": "ari@pawwalk.app",
        "rating": 4.8, "price_per_30min_cents": 2000,
        "bio": "Certified trainer. Great with reactive dogs.", "neighborhoods": ["Mission", "Noe Valley"],
    },
    {
        "id": "wlk_jo", "name": "Jo Park", "email": "jo@pawwalk.app",
        "rating": 4.7, "price_per_30min_cents": 1600,
        "bio": "Marathoner — your pup will be tired and happy.", "neighborhoods": ["SoMa", "Dogpatch"],
    },
]

# The assistant's heuristic parser matches against this fixed vocabulary —
# it's seed-data-derived, not a live DB query (see assistant/intent.py).
KNOWN_NEIGHBORHOODS = sorted({h for w in _WALKERS for h in w["neighborhoods"]})


def _user(email: str, name: str, role: str) -> UserTable:
    return UserTable(
        id=f"usr_{uuid4().hex[:12]}",
        email=email,
        name=name,
        password_hash=hash_password(DEMO_PASSWORD),
        role=role,
        created_at=datetime.now(timezone.utc),
    )


def _completed_walk(
    session: Session, owner_id: str, walker: dict, days_ago: int,
    duration_minutes: int, route_offset: float,
) -> None:
    # Anchor to a fixed afternoon hour on the target calendar day. Subtracting a raw
    # hours offset from "now" could cross midnight and shift start_time's date a day
    # earlier when seeded just after 00:00 UTC — which broke the streak calculation.
    day = datetime.now(timezone.utc).date() - timedelta(days=days_ago)
    start = datetime(day.year, day.month, day.day, 14, 0, tzinfo=timezone.utc)
    booking = BookingTable(
        id=f"bkg_{uuid4().hex[:12]}",
        walker_id=walker["id"],
        user_id=owner_id,
        dog_name="Mochi",
        start_time=start,
        duration_minutes=duration_minutes,
        status=BookingStatus.completed,
        price_cents=round(walker["price_per_30min_cents"] * (duration_minutes / 30)),
        created_at=start - timedelta(days=1),
    )
    session.add(booking)
    route = demo_route(lat0=37.7540 + route_offset)
    step = timedelta(minutes=duration_minutes) / len(route)
    for i, (lat, lng) in enumerate(route):
        session.add(
            PositionTable(booking_id=booking.id, lat=lat, lng=lng, recorded_at=start + i * step)
        )


def seed_demo_data(session: Session) -> None:
    # 1. Public walker profiles.
    if session.exec(select(WalkerTable)).first() is None:
        session.add_all(
            WalkerTable(**{k: v for k, v in w.items() if k != "email"}) for w in _WALKERS
        )
        session.commit()

    # 2. Walker login accounts, linked to their profiles (also links profiles
    #    seeded by older versions of this file that had no accounts).
    for spec in _WALKERS:
        if session.exec(select(UserTable).where(UserTable.email == spec["email"])).first():
            continue
        user = _user(spec["email"], spec["name"], "walker")
        session.add(user)
        row = session.get(WalkerTable, spec["id"])
        if row is not None and row.user_id is None:
            row.user_id = user.id
            session.add(row)
    session.commit()

    # 3. Demo owner + pet + real walk history (only on first run).
    if session.exec(select(UserTable).where(UserTable.email == DEMO_OWNER_EMAIL)).first():
        return
    owner = _user(DEMO_OWNER_EMAIL, "Ger Cordero", "owner")
    session.add(owner)
    session.add(
        PetTable(
            id=f"pet_{uuid4().hex[:12]}",
            owner_id=owner.id,
            name="Mochi",
            breed="Shiba Inu",
            age_years=3.0,
            weight_kg=9.6,
            notes="Friendly but pulls at the start. Loves the beach.",
            created_at=datetime.now(timezone.utc),
        )
    )
    # Two completed walks (yesterday + the day before → a 2-day streak) with
    # recorded GPS tracks, and one upcoming pending walk for the Next-walk card.
    _completed_walk(session, owner.id, _WALKERS[0], days_ago=1, duration_minutes=45, route_offset=0.0)
    _completed_walk(session, owner.id, _WALKERS[2], days_ago=2, duration_minutes=30, route_offset=0.0015)
    tomorrow = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0) + timedelta(days=1)
    session.add(
        BookingTable(
            id=f"bkg_{uuid4().hex[:12]}",
            walker_id=_WALKERS[0]["id"],
            user_id=owner.id,
            dog_name="Mochi",
            start_time=tomorrow,
            duration_minutes=45,
            status=BookingStatus.pending,
            price_cents=round(_WALKERS[0]["price_per_30min_cents"] * 1.5),
            created_at=datetime.now(timezone.utc),
        )
    )
    session.commit()
