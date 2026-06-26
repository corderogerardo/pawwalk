"""In-memory data store (Phase 0).

Phase 1 replaces this module with a real database (Postgres + SQLModel/SQLAlchemy)
without changing the router or schema layers — that's the point of keeping data
access behind these functions.
"""
from __future__ import annotations

import itertools
from datetime import datetime, timezone

from .schemas import Booking, BookingStatus, CreateBookingRequest, Walker

_now = lambda: datetime.now(timezone.utc)  # noqa: E731

WALKERS: dict[str, Walker] = {
    w.id: w
    for w in [
        Walker(id="wlk_sam", name="Sam Rivera", rating=4.9, price_per_30min_cents=1800,
               bio="10 yrs with dogs. Loves huskies.", neighborhoods=["Mission", "SoMa"]),
        Walker(id="wlk_ari", name="Ari Chen", rating=4.8, price_per_30min_cents=2000,
               bio="Certified trainer. Great with reactive dogs.", neighborhoods=["Mission", "Noe Valley"]),
        Walker(id="wlk_jo", name="Jo Park", rating=4.7, price_per_30min_cents=1600,
               bio="Marathoner — your pup will be tired and happy.", neighborhoods=["SoMa", "Dogpatch"]),
    ]
}

BOOKINGS: dict[str, Booking] = {}
_booking_seq = itertools.count(1)


def list_walkers() -> list[Walker]:
    return list(WALKERS.values())


def get_walker(walker_id: str) -> Walker | None:
    return WALKERS.get(walker_id)


def find_walkers(neighborhood: str | None) -> list[Walker]:
    if not neighborhood:
        return list_walkers()
    n = neighborhood.lower()
    return [w for w in WALKERS.values() if any(n == hood.lower() for hood in w.neighborhoods)]


def create_booking(req: CreateBookingRequest) -> Booking:
    walker = get_walker(req.walker_id)
    if walker is None:
        raise KeyError(req.walker_id)
    price = round(walker.price_per_30min_cents * (req.duration_minutes / 30))
    booking = Booking(
        id=f"bkg_{next(_booking_seq)}",
        walker_id=req.walker_id,
        dog_name=req.dog_name,
        start_time=req.start_time,
        duration_minutes=req.duration_minutes,
        status=BookingStatus.pending,
        price_cents=price,
        created_at=_now(),
    )
    BOOKINGS[booking.id] = booking
    return booking


def list_bookings() -> list[Booking]:
    return sorted(BOOKINGS.values(), key=lambda b: b.created_at, reverse=True)


def get_booking(booking_id: str) -> Booking | None:
    return BOOKINGS.get(booking_id)


def cancel_booking(booking_id: str) -> Booking | None:
    booking = BOOKINGS.get(booking_id)
    if booking is None:
        return None
    booking.status = BookingStatus.cancelled
    return booking
