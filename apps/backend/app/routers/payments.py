"""Payments router — STUBBED in Phase 0.

The response shape matches a real Stripe PaymentIntent so the mobile clients can
build the full checkout UI now. Phase 3 replaces the body of `create_intent`
with a real `stripe.PaymentIntent.create(...)` call; the contract stays the same.
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from .. import data
from ..schemas import PaymentIntentRequest, PaymentIntentResponse

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/intent", response_model=PaymentIntentResponse)
def create_intent(req: PaymentIntentRequest) -> PaymentIntentResponse:
    booking = data.get_booking(req.booking_id)
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found")
    return PaymentIntentResponse(
        client_secret=f"pi_stub_{booking.id}_secret",
        amount_cents=booking.price_cents,
    )
