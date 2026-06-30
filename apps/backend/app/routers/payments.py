"""Payments router.

Creates a real Stripe PaymentIntent when `settings.stripe_secret_key` is
configured. Otherwise returns an offline stub with the same response shape, so
the mobile clients work without Stripe set up.
"""
from __future__ import annotations

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session

from .. import data
from ..config import settings
from ..db import get_session
from ..deps import get_current_user
from ..schemas import PaymentIntentRequest, PaymentIntentResponse, User

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/intent", response_model=PaymentIntentResponse)
def create_intent(
    req: PaymentIntentRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> PaymentIntentResponse:
    booking = data.get_booking(session, req.booking_id, current_user.id)
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found")

    if settings.has_stripe:
        intent = stripe.PaymentIntent.create(
            amount=booking.price_cents,
            currency="usd",
            metadata={"booking_id": booking.id},
            api_key=settings.stripe_secret_key,
        )
        client_secret = intent.client_secret
    else:
        client_secret = f"pi_stub_{booking.id}_secret"

    return PaymentIntentResponse(client_secret=client_secret, amount_cents=booking.price_cents)


@router.post("/webhook")
async def stripe_webhook(request: Request, session: Session = Depends(get_session)) -> dict[str, bool]:
    """Stripe calls this directly (no auth header) — verified via signature instead."""
    if not settings.stripe_webhook_secret:
        raise HTTPException(status_code=400, detail="Stripe webhooks not configured")

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, settings.stripe_webhook_secret)
    except (ValueError, stripe.SignatureVerificationError) as exc:
        raise HTTPException(status_code=400, detail="Invalid webhook signature") from exc

    if event["type"] == "payment_intent.succeeded":
        booking_id = event["data"]["object"]["metadata"].get("booking_id")
        if booking_id:
            data.confirm_booking(session, booking_id)

    return {"received": True}
