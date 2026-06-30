"""DB-backed data access (Phase 1).

Each function takes a `Session` and returns the Pydantic shapes from
`schemas.py` — never the SQLModel table rows — so the router and schema layers
don't change when storage does.
"""
from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from sqlmodel import Session, select

from .models_db import BookingTable, WalkerTable
from .schemas import Booking, BookingStatus, CreateBookingRequest, Walker

_now = lambda: datetime.now(timezone.utc)  # noqa: E731


def list_walkers(session: Session) -> list[Walker]:
    rows = session.exec(select(WalkerTable)).all()
    return [Walker.model_validate(row, from_attributes=True) for row in rows]


def get_walker(session: Session, walker_id: str) -> Walker | None:
    row = session.get(WalkerTable, walker_id)
    return Walker.model_validate(row, from_attributes=True) if row else None


def find_walkers(session: Session, neighborhood: str | None) -> list[Walker]:
    if not neighborhood:
        return list_walkers(session)
    n = neighborhood.lower()
    rows = session.exec(select(WalkerTable)).all()
    return [
        Walker.model_validate(row, from_attributes=True)
        for row in rows
        if any(n == hood.lower() for hood in row.neighborhoods)
    ]


def create_booking(session: Session, req: CreateBookingRequest, user_id: str) -> Booking:
    walker = session.get(WalkerTable, req.walker_id)
    if walker is None:
        raise KeyError(req.walker_id)
    price = round(walker.price_per_30min_cents * (req.duration_minutes / 30))
    row = BookingTable(
        id=f"bkg_{uuid4().hex[:12]}",
        walker_id=req.walker_id,
        user_id=user_id,
        dog_name=req.dog_name,
        start_time=req.start_time,
        duration_minutes=req.duration_minutes,
        status=BookingStatus.pending,
        price_cents=price,
        created_at=_now(),
    )
    session.add(row)
    session.commit()
    session.refresh(row)
    return Booking.model_validate(row, from_attributes=True)


def list_bookings(session: Session, user_id: str) -> list[Booking]:
    rows = session.exec(
        select(BookingTable)
        .where(BookingTable.user_id == user_id)
        .order_by(BookingTable.created_at.desc())
    ).all()
    return [Booking.model_validate(row, from_attributes=True) for row in rows]


def get_booking(session: Session, booking_id: str, user_id: str) -> Booking | None:
    row = session.get(BookingTable, booking_id)
    if row is None or row.user_id != user_id:
        return None
    return Booking.model_validate(row, from_attributes=True)


def cancel_booking(session: Session, booking_id: str, user_id: str) -> Booking | None:
    row = session.get(BookingTable, booking_id)
    if row is None or row.user_id != user_id:
        return None
    row.status = BookingStatus.cancelled
    session.add(row)
    session.commit()
    session.refresh(row)
    return Booking.model_validate(row, from_attributes=True)


def confirm_booking(session: Session, booking_id: str) -> Booking | None:
    """Unscoped — called from the Stripe webhook, not a user request."""
    row = session.get(BookingTable, booking_id)
    if row is None:
        return None
    row.status = BookingStatus.confirmed
    session.add(row)
    session.commit()
    session.refresh(row)
    return Booking.model_validate(row, from_attributes=True)
