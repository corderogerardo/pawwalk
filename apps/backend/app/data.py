"""DB-backed data access (Phase 1).

Each function takes a `Session` and returns the Pydantic shapes from
`schemas.py` — never the SQLModel table rows — so the router and schema layers
don't change when storage does.
"""
from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from sqlmodel import Session, select

from .models_db import BookingTable, PetTable, PositionTable, WalkerTable
from .schemas import (
    Booking,
    BookingStatus,
    CreateBookingRequest,
    CreatePetRequest,
    Pet,
    Position,
    Walker,
    WalkerProfileUpdate,
)

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


def add_position(session: Session, booking_id: str, lat: float, lng: float) -> Position:
    """Record a GPS fix. On Postgres the `geog` column is filled by a DB trigger
    (migration 0002), so this stays dialect-agnostic — it only writes lat/lng."""
    row = PositionTable(booking_id=booking_id, lat=lat, lng=lng, recorded_at=_now())
    session.add(row)
    session.commit()
    session.refresh(row)
    return Position.model_validate(row, from_attributes=True)


def list_positions(session: Session, booking_id: str) -> list[Position]:
    rows = session.exec(
        select(PositionTable)
        .where(PositionTable.booking_id == booking_id)
        .order_by(PositionTable.recorded_at)
    ).all()
    return [Position.model_validate(row, from_attributes=True) for row in rows]


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


# ---- Pets (owner-scoped) ----

def create_pet(session: Session, owner_id: str, req: CreatePetRequest) -> Pet:
    row = PetTable(
        id=f"pet_{uuid4().hex[:12]}",
        owner_id=owner_id,
        name=req.name,
        breed=req.breed or "",
        age_years=req.age_years,
        weight_kg=req.weight_kg,
        notes=req.notes or "",
        created_at=_now(),
    )
    session.add(row)
    session.commit()
    session.refresh(row)
    return Pet.model_validate(row, from_attributes=True)


def list_pets(session: Session, owner_id: str) -> list[Pet]:
    rows = session.exec(
        select(PetTable).where(PetTable.owner_id == owner_id).order_by(PetTable.created_at)
    ).all()
    return [Pet.model_validate(row, from_attributes=True) for row in rows]


def delete_pet(session: Session, pet_id: str, owner_id: str) -> bool:
    row = session.get(PetTable, pet_id)
    if row is None or row.owner_id != owner_id:
        return False
    session.delete(row)
    session.commit()
    return True


# ---- Walker profiles (linked to a walker-role user) ----

def create_walker_profile(session: Session, user_id: str, name: str) -> Walker:
    row = WalkerTable(
        id=f"wlk_{uuid4().hex[:12]}",
        name=name,
        rating=5.0,
        price_per_30min_cents=2000,
        bio="",
        neighborhoods=[],
        user_id=user_id,
    )
    session.add(row)
    session.commit()
    session.refresh(row)
    return Walker.model_validate(row, from_attributes=True)


def _walker_row_for_user(session: Session, user_id: str) -> WalkerTable | None:
    return session.exec(select(WalkerTable).where(WalkerTable.user_id == user_id)).first()


def get_walker_profile(session: Session, user_id: str) -> Walker | None:
    row = _walker_row_for_user(session, user_id)
    return Walker.model_validate(row, from_attributes=True) if row else None


def update_walker_profile(session: Session, user_id: str, update: WalkerProfileUpdate) -> Walker | None:
    row = _walker_row_for_user(session, user_id)
    if row is None:
        return None
    if update.bio is not None:
        row.bio = update.bio
    if update.price_per_30min_cents is not None:
        row.price_per_30min_cents = update.price_per_30min_cents
    if update.neighborhoods is not None:
        row.neighborhoods = update.neighborhoods
    session.add(row)
    session.commit()
    session.refresh(row)
    return Walker.model_validate(row, from_attributes=True)


# ---- Walker workflow (walks assigned to a walker + status transitions) ----

def list_bookings_for_walker(session: Session, walker_id: str) -> list[Booking]:
    rows = session.exec(
        select(BookingTable)
        .where(BookingTable.walker_id == walker_id)
        .order_by(BookingTable.created_at.desc())
    ).all()
    return [Booking.model_validate(row, from_attributes=True) for row in rows]


def get_walker_booking(session: Session, booking_id: str, walker_id: str) -> Booking | None:
    row = session.get(BookingTable, booking_id)
    if row is None or row.walker_id != walker_id:
        return None
    return Booking.model_validate(row, from_attributes=True)


def set_booking_status(
    session: Session, booking_id: str, walker_id: str, status: BookingStatus
) -> Booking | None:
    """Walker-scoped status change — only the assigned walker can move a walk."""
    row = session.get(BookingTable, booking_id)
    if row is None or row.walker_id != walker_id:
        return None
    row.status = status
    session.add(row)
    session.commit()
    session.refresh(row)
    return Booking.model_validate(row, from_attributes=True)
