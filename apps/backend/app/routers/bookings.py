from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from .. import data
from ..db import get_session
from ..deps import get_current_owner, get_current_user, get_current_walker
from ..schemas import Booking, BookingStatus, CreateBookingRequest, User

router = APIRouter(prefix="/bookings", tags=["bookings"])


# ---- Owner side ----

@router.post("", response_model=Booking, status_code=201)
def create_booking(
    req: CreateBookingRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_owner),
) -> Booking:
    try:
        return data.create_booking(session, req, current_user.id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Walker not found") from None


@router.get("", response_model=list[Booking])
def list_bookings(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> list[Booking]:
    return data.list_bookings(session, current_user.id)


# ---- Walker side (declared before `/{booking_id}`) ----

@router.get("/assigned", response_model=list[Booking])
def assigned_bookings(
    session: Session = Depends(get_session),
    walker: User = Depends(get_current_walker),
) -> list[Booking]:
    profile = data.get_walker_profile(session, walker.id)
    if profile is None:
        raise HTTPException(status_code=404, detail="Walker profile not found")
    return data.list_bookings_for_walker(session, profile.id)


@router.get("/{booking_id}", response_model=Booking)
def get_booking(
    booking_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Booking:
    booking = data.get_booking(session, booking_id, current_user.id)
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking


@router.post("/{booking_id}/cancel", response_model=Booking)
def cancel_booking(
    booking_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Booking:
    booking = data.cancel_booking(session, booking_id, current_user.id)
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking


# ---- Walker status transitions ----

def _transition(
    session: Session, walker: User, booking_id: str, allowed_from: BookingStatus, to: BookingStatus
) -> Booking:
    profile = data.get_walker_profile(session, walker.id)
    if profile is None:
        raise HTTPException(status_code=404, detail="Walker profile not found")
    booking = data.get_walker_booking(session, booking_id, profile.id)
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.status != allowed_from:
        raise HTTPException(status_code=409, detail=f"Can't do that from status '{booking.status.value}'")
    updated = data.set_booking_status(session, booking_id, profile.id, to)
    assert updated is not None  # we just fetched it under the same scope
    return updated


@router.post("/{booking_id}/accept", response_model=Booking)
def accept_booking(booking_id: str, session: Session = Depends(get_session),
                   walker: User = Depends(get_current_walker)) -> Booking:
    return _transition(session, walker, booking_id, BookingStatus.pending, BookingStatus.confirmed)


@router.post("/{booking_id}/decline", response_model=Booking)
def decline_booking(booking_id: str, session: Session = Depends(get_session),
                    walker: User = Depends(get_current_walker)) -> Booking:
    return _transition(session, walker, booking_id, BookingStatus.pending, BookingStatus.cancelled)


@router.post("/{booking_id}/start", response_model=Booking)
def start_booking(booking_id: str, session: Session = Depends(get_session),
                  walker: User = Depends(get_current_walker)) -> Booking:
    return _transition(session, walker, booking_id, BookingStatus.confirmed, BookingStatus.in_progress)


@router.post("/{booking_id}/complete", response_model=Booking)
def complete_booking(booking_id: str, session: Session = Depends(get_session),
                     walker: User = Depends(get_current_walker)) -> Booking:
    return _transition(session, walker, booking_id, BookingStatus.in_progress, BookingStatus.completed)
