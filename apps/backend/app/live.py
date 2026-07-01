"""In-memory pub/sub for live GPS tracking.

Zero-cost transport: a `booking_id → {WebSocket}` map with an asyncio lock. Fine
for a single-process MVP (the whole point — no paid realtime service). If you
ever run more than one worker, swap this class for Redis pub/sub behind the same
`join/leave/broadcast` interface; nothing else changes.
"""
from __future__ import annotations

import asyncio

from fastapi import WebSocket


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
