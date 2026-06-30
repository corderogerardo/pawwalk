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
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
