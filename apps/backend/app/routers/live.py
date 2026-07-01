"""Live GPS tracking — a WebSocket the walker publishes to and the owner
subscribes to, plus a REST endpoint for the recorded track.

Auth: the JWT is passed as `?token=` (WebSockets can't send an Authorization
header from JS/native clients). The caller must own the booking — same rule as
the REST `/bookings` endpoints.
"""
from __future__ import annotations

import asyncio
import math

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlmodel import Session

from .. import data
from ..db import engine, get_session
from ..deps import get_current_user
from ..live import hub
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
    if data.get_booking(session, booking_id, current_user.id) is None:
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
    if data.get_booking(session, booking_id, current_user.id) is None:
        raise HTTPException(status_code=404, detail="Booking not found")
    route = _demo_route()
    # ponytail: fire-and-forget task, fine for a single-process demo. If a walk
    # can be simulated concurrently at scale, track/cancel these tasks.
    asyncio.create_task(_replay(booking_id, route))
    return {"status": "started", "points": len(route)}


def _demo_route(n: int = 45) -> list[tuple[float, float]]:
    """A smooth ~300 m loop near the Sunset District (matches Mochi's home).
    Deterministic (no RNG) so the demo looks the same every run."""
    lat0, lng0 = 37.7540, -122.4940
    m_per_deg_lat = 111_320.0
    m_per_deg_lng = 111_320.0 * math.cos(math.radians(lat0))
    points: list[tuple[float, float]] = []
    for i in range(n):
        t = i / (n - 1)
        east = 220 * math.sin(2 * math.pi * t) + 60 * math.sin(4 * math.pi * t)
        north = 180 * (1 - math.cos(2 * math.pi * t)) - 90 * math.sin(2 * math.pi * t)
        points.append((lat0 + north / m_per_deg_lat, lng0 + east / m_per_deg_lng))
    return points


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
    if data.get_booking(session, booking_id, user_id) is None:
        await websocket.close(code=4404)  # not the caller's booking
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
