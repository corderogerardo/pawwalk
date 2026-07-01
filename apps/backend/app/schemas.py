"""Pydantic models == the API contract (see docs/API-CONTRACT.md).

FastAPI turns these into the OpenAPI schema at /openapi.json, which the iOS and
Android clients mirror as Codable structs / Kotlin data classes. Change a model
here and the generated docs change with it.
"""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_serializer

Duration = Literal[30, 45, 60]
Role = Literal["owner", "walker"]


class BookingStatus(str, Enum):
    pending = "pending"
    confirmed = "confirmed"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"


# ---- Auth ----

class User(BaseModel):
    id: str
    email: EmailStr
    name: str
    role: Role = "owner"
    created_at: datetime

    @field_serializer("created_at")
    def serialize_dt(self, v: datetime, _info) -> str:
        s = v.isoformat()
        if v.tzinfo is None:
            s += "Z"
        return s


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    name: str
    role: Role = "owner"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    user: User


class Walker(BaseModel):
    id: str
    name: str
    photo_url: str | None = None
    rating: float = Field(ge=0, le=5)
    price_per_30min_cents: int
    bio: str = ""
    neighborhoods: list[str] = []


class WalkerProfileUpdate(BaseModel):
    """Fields a walker can edit on their own profile (PATCH /walkers/me)."""
    bio: str | None = None
    price_per_30min_cents: int | None = None
    neighborhoods: list[str] | None = None


# ---- Pets (owned by an owner-role user) ----

class Pet(BaseModel):
    id: str
    name: str
    breed: str = ""
    age_years: float | None = None
    weight_kg: float | None = None
    notes: str = ""
    created_at: datetime

    @field_serializer("created_at")
    def serialize_dt(self, v: datetime, _info) -> str:
        s = v.isoformat()
        if v.tzinfo is None:
            s += "Z"
        return s


class CreatePetRequest(BaseModel):
    name: str
    breed: str = ""
    age_years: float | None = None
    weight_kg: float | None = None
    notes: str | None = None


class CreateBookingRequest(BaseModel):
    walker_id: str
    dog_name: str
    start_time: datetime
    duration_minutes: Duration = 30
    notes: str | None = None


class Booking(BaseModel):
    id: str
    walker_id: str
    dog_name: str
    start_time: datetime
    duration_minutes: Duration
    status: BookingStatus = BookingStatus.pending
    price_cents: int
    created_at: datetime

    @field_serializer("start_time", "created_at")
    def serialize_dt(self, v: datetime, _info) -> str:
        s = v.isoformat()
        if v.tzinfo is None:
            s += "Z"
        return s


# ---- Owner home stats ----

class RecentWalk(BaseModel):
    """A completed walk with its recorded distance, for the Home 'Recent walks' list."""
    booking_id: str
    dog_name: str
    walker_name: str
    start_time: datetime
    duration_minutes: int
    distance_km: float
    # Per-segment distance profile of the recorded track, 6 values normalized
    # 0..1 (empty when the walk has no GPS track). Drives the little sparkline.
    sparkline: list[float] = []

    @field_serializer("start_time")
    def serialize_dt(self, v: datetime, _info) -> str:
        s = v.isoformat()
        if v.tzinfo is None:
            s += "Z"
        return s


class OwnerStats(BaseModel):
    distance_km: float
    streak_days: int
    recent_walks: list[RecentWalk] = []


# ---- Waitlist (landing page) ----

class WaitlistRequest(BaseModel):
    email: EmailStr


class PaymentIntentRequest(BaseModel):
    booking_id: str


class PaymentIntentResponse(BaseModel):
    client_secret: str
    amount_cents: int


# ---- Live tracking ----

class Position(BaseModel):
    lat: float
    lng: float
    recorded_at: datetime

    @field_serializer("recorded_at")
    def serialize_dt(self, v: datetime, _info) -> str:
        s = v.isoformat()
        if v.tzinfo is None:
            s += "Z"
        return s


# ---- AI assistant ----

class AssistantChatRequest(BaseModel):
    message: str


class BookingIntent(BaseModel):
    """Typed output of the intent-parsing step (heuristic or Pydantic AI agent)."""
    neighborhood: str | None = None
    dog_name: str | None = None
    duration_minutes: Duration = 30
    start_time: datetime | None = None


class DraftBooking(BaseModel):
    walker_id: str
    dog_name: str | None = None
    start_time: datetime | None = None
    duration_minutes: Duration = 30


class AssistantReply(BaseModel):
    reply: str
    suggested_walkers: list[str] = []
    draft_booking: DraftBooking | None = None
