"""SQLModel table definitions (Phase 1 — DB-backed storage).

Mirrors the field shapes in `schemas.py`. These are the storage layer; the
Pydantic models in `schemas.py` stay the request/response shapes and are never
returned directly from a route.
"""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel

from .schemas import BookingStatus


class WalkerTable(SQLModel, table=True):
    __tablename__ = "walkers"

    id: str = Field(primary_key=True)
    name: str
    photo_url: str | None = None
    rating: float
    price_per_30min_cents: int
    bio: str = ""
    # Stored as a JSON column (not comma-joined) so values round-trip as a
    # real list without ad-hoc parsing.
    neighborhoods: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    # Links a walker-role user to their public walker profile (seeded walkers
    # get demo login accounts too — see seed.py).
    user_id: str | None = Field(default=None, foreign_key="users.id")


class BookingTable(SQLModel, table=True):
    __tablename__ = "bookings"

    id: str = Field(primary_key=True)
    walker_id: str = Field(foreign_key="walkers.id")
    user_id: str = Field(foreign_key="users.id")
    dog_name: str
    start_time: datetime
    duration_minutes: int
    status: BookingStatus = BookingStatus.pending
    price_cents: int
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class UserTable(SQLModel, table=True):
    __tablename__ = "users"

    id: str = Field(primary_key=True)
    email: str = Field(unique=True, index=True)
    name: str
    password_hash: str
    # "owner" (books walks, owns pets) or "walker" (fulfils walks). Drives which
    # app experience the client shows after login. Server default backfills
    # pre-role rows and keeps `--autogenerate` quiet.
    role: str = Field(default="owner", sa_column_kwargs={"server_default": "owner"})
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class PetTable(SQLModel, table=True):
    __tablename__ = "pets"

    id: str = Field(primary_key=True)
    owner_id: str = Field(foreign_key="users.id", index=True)
    name: str
    breed: str = ""
    age_years: float | None = None
    weight_kg: float | None = None
    notes: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class WaitlistTable(SQLModel, table=True):
    """Landing-page waitlist signups (POST /waitlist)."""
    __tablename__ = "waitlist"

    id: int | None = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class PositionTable(SQLModel, table=True):
    """A single GPS fix on a walk, streamed over the live-tracking WebSocket.

    Only `lat`/`lng` live in the model — they're the source of truth and work on
    SQLite too (dev/tests). On Postgres, migration 0002 adds a PostGIS
    `geog geography(Point,4326)` column + GiST index, kept in sync by a trigger,
    so spatial queries ("walkers near me") are ready without the app touching it.
    """
    __tablename__ = "positions"

    id: int | None = Field(default=None, primary_key=True)
    booking_id: str = Field(foreign_key="bookings.id", index=True)
    lat: float
    lng: float
    recorded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
