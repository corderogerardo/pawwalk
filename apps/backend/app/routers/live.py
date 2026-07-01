"""Live GPS tracking — a WebSocket the walker publishes to and the owner
subscribes to, plus a REST endpoint for the recorded track.

Auth: the JWT is passed as `?token=` (WebSockets can't send an Authorization
header from JS/native clients). The caller must own the booking — same rule as
the REST `/bookings` endpoints.
"""
from __future__ import annotations

import asyncio

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlmodel import Session

from .. import data
from ..db import engine, get_session
from ..deps import get_current_user
from ..live import demo_route, hub
from ..schemas import Position, User
from ..security import decode_token

router = APIRouter(tags=["live"])


@router.get("/bookings/{booking_id}/track", response_model=list[Position])
def get_track(
    booking_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> list[Position]:
    """The path recorded so far — handy for an initial render before the socket opens."""
    if not data.can_access_booking(session, booking_id, current_user.id):
        raise HTTPException(status_code=404, detail="Booking not found")
    return data.list_positions(session, booking_id)


@router.post("/bookings/{booking_id}/simulate", status_code=202)
async def simulate(
    booking_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> dict[str, object]:
    """Demo helper: replay a realistic walking route into the live channel so you
    can see movement on a stationary simulator (no phone walk needed). Publishes
    to the same hub + `positions` table the real walker would.
    """
    if not data.can_access_booking(session, booking_id, current_user.id):
        raise HTTPException(status_code=404, detail="Booking not found")
    route = demo_route()
    # ponytail: fire-and-forget task, fine for a single-process demo. If a walk
    # can be simulated concurrently at scale, track/cancel these tasks.
    asyncio.create_task(_replay(booking_id, route))
    return {"status": "started", "points": len(route)}


async def _replay(booking_id: str, route: list[tuple[float, float]]) -> None:
    with Session(engine) as session:
        for lat, lng in route:
            pos = data.add_position(session, booking_id, lat, lng)
            await hub.broadcast(booking_id, {"type": "position", **pos.model_dump(mode="json")})
            await asyncio.sleep(1.2)


@router.websocket("/ws/track/{booking_id}")
async def track(
    websocket: WebSocket,
    booking_id: str,
    token: str | None = None,
    session: Session = Depends(get_session),
) -> None:
    # Authenticate + authorize before accepting — close with a policy code otherwise.
    user_id = decode_token(token) if token else None
    if user_id is None:
        await websocket.close(code=4401)  # unauthorized
        return
    if not data.can_access_booking(session, booking_id, user_id):
        await websocket.close(code=4404)  # neither the owner nor the assigned walker
        return

    await websocket.accept()
    # Replay the track so far so a late joiner (the owner) sees the whole route.
    history = [p.model_dump(mode="json") for p in data.list_positions(session, booking_id)]
    await websocket.send_json({"type": "history", "points": history})
    await hub.join(booking_id, websocket)
    try:
        while True:
            msg = await websocket.receive_json()
            if msg.get("type") == "position":
                try:
                    lat, lng = float(msg["lat"]), float(msg["lng"])
                except (KeyError, TypeError, ValueError):
                    continue  # ignore malformed frames rather than dropping the walk
                pos = data.add_position(session, booking_id, lat, lng)
                await hub.broadcast(booking_id, {"type": "position", **pos.model_dump(mode="json")})
    except WebSocketDisconnect:
        pass
    finally:
        await hub.leave(booking_id, websocket)
