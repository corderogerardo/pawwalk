from __future__ import annotations

from fastapi import APIRouter, HTTPException

from .. import data
from ..schemas import Booking, CreateBookingRequest

router = APIRouter(prefix="/bookings", tags=["bookings"])


@router.post("", response_model=Booking, status_code=201)
def create_booking(req: CreateBookingRequest) -> Booking:
    try:
        return data.create_booking(req)
    except KeyError:
        raise HTTPException(status_code=404, detail="Walker not found") from None


@router.get("", response_model=list[Booking])
def list_bookings() -> list[Booking]:
    return data.list_bookings()


@router.get("/{booking_id}", response_model=Booking)
def get_booking(booking_id: str) -> Booking:
    booking = data.get_booking(booking_id)
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking


@router.post("/{booking_id}/cancel", response_model=Booking)
def cancel_booking(booking_id: str) -> Booking:
    booking = data.cancel_booking(booking_id)
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking
