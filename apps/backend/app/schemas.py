"""Pydantic models == the API contract (see docs/API-CONTRACT.md).

FastAPI turns these into the OpenAPI schema at /openapi.json, which the iOS and
Android clients mirror as Codable structs / Kotlin data classes. Change a model
here and the generated docs change with it.
"""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field

Duration = Literal[30, 45, 60]


class BookingStatus(str, Enum):
    pending = "pending"
    confirmed = "confirmed"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"


class Walker(BaseModel):
    id: str
    name: str
    photo_url: str | None = None
    rating: float = Field(ge=0, le=5)
    price_per_30min_cents: int
    bio: str = ""
    neighborhoods: list[str] = []


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


class PaymentIntentRequest(BaseModel):
    booking_id: str


class PaymentIntentResponse(BaseModel):
    client_secret: str
    amount_cents: int


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
