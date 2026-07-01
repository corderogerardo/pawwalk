"""In-memory pub/sub for live GPS tracking.

Zero-cost transport: a `booking_id → {WebSocket}` map with an asyncio lock. Fine
for a single-process MVP (the whole point — no paid realtime service). If you
ever run more than one worker, swap this class for Redis pub/sub behind the same
`join/leave/broadcast` interface; nothing else changes.
"""
from __future__ import annotations

import asyncio
import math

from fastapi import WebSocket


def demo_route(n: int = 45, lat0: float = 37.7540, lng0: float = -122.4940) -> list[tuple[float, float]]:
    """A smooth ~300 m walking loop near the Sunset District. Deterministic (no
    RNG) so demos and seeded walk history look the same every run. Used by
    POST /bookings/{id}/simulate and by seed.py's completed-walk tracks."""
    m_per_deg_lat = 111_320.0
    m_per_deg_lng = 111_320.0 * math.cos(math.radians(lat0))
    points: list[tuple[float, float]] = []
    for i in range(n):
        t = i / (n - 1)
        east = 220 * math.sin(2 * math.pi * t) + 60 * math.sin(4 * math.pi * t)
        north = 180 * (1 - math.cos(2 * math.pi * t)) - 90 * math.sin(2 * math.pi * t)
        points.append((lat0 + north / m_per_deg_lat, lng0 + east / m_per_deg_lng))
    return points


class TrackHub:
    def __init__(self) -> None:
        self._subs: dict[str, set[WebSocket]] = {}
        self._lock = asyncio.Lock()

    async def join(self, booking_id: str, ws: WebSocket) -> None:
        async with self._lock:
            self._subs.setdefault(booking_id, set()).add(ws)

    async def leave(self, booking_id: str, ws: WebSocket) -> None:
        async with self._lock:
            subs = self._subs.get(booking_id)
            if subs:
                subs.discard(ws)
                if not subs:
                    self._subs.pop(booking_id, None)

    async def broadcast(self, booking_id: str, message: dict) -> None:
        async with self._lock:
            targets = list(self._subs.get(booking_id, ()))
        for ws in targets:
            try:
                await ws.send_json(message)
            except Exception:  # noqa: BLE001 — a dead socket shouldn't break the walk
                pass


hub = TrackHub()
