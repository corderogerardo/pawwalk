"""Seed data for local/dev databases. Idempotent — only inserts if empty."""
from __future__ import annotations

from sqlmodel import Session, select

from .models_db import WalkerTable

_WALKERS = [
    WalkerTable(
        id="wlk_sam", name="Sam Rivera", rating=4.9, price_per_30min_cents=1800,
        bio="10 yrs with dogs. Loves huskies.", neighborhoods=["Mission", "SoMa"],
    ),
    WalkerTable(
        id="wlk_ari", name="Ari Chen", rating=4.8, price_per_30min_cents=2000,
        bio="Certified trainer. Great with reactive dogs.", neighborhoods=["Mission", "Noe Valley"],
    ),
    WalkerTable(
        id="wlk_jo", name="Jo Park", rating=4.7, price_per_30min_cents=1600,
        bio="Marathoner — your pup will be tired and happy.", neighborhoods=["SoMa", "Dogpatch"],
    ),
]

# The assistant's heuristic parser matches against this fixed vocabulary —
# it's seed-data-derived, not a live DB query (see assistant/intent.py).
KNOWN_NEIGHBORHOODS = sorted({h for w in _WALKERS for h in w.neighborhoods})


def seed_walkers(session: Session) -> None:
    if session.exec(select(WalkerTable)).first() is not None:
        return
    session.add_all(_WALKERS)
    session.commit()
