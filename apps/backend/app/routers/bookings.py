from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from .. import data
from ..db import get_session
from ..deps import get_current_user
from ..schemas import Booking, CreateBookingRequest, User

router = APIRouter(prefix="/bookings", tags=["bookings"])


@router.post("", response_model=Booking, status_code=201)
def create_booking(
    req: CreateBookingRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
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
