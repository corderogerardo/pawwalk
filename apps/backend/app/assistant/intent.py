"""Turn a free-text message into a typed BookingIntent.

Two paths:
  1. Heuristic parser (always runs, no network) — keeps the server useful offline
     and makes tests deterministic.
  2. Pydantic AI agent (runs only when PAWWALK_LLM_MODEL + a provider key are set)
     — this is the piece you grow while learning the AI stack.

Learning note: a Pydantic AI `Agent` with `output_type=BookingIntent` guarantees
the model returns data matching our schema (or it retries), so the rest of the
code stays fully type-safe.
"""
from __future__ import annotations

import re
from datetime import datetime, time, timedelta, timezone
from functools import lru_cache

from ..config import settings
from ..data import WALKERS
from ..schemas import BookingIntent

# Build the set of known neighborhoods from seed data.
_KNOWN_HOODS = sorted({h for w in WALKERS.values() for h in w.neighborhoods})


def _parse_duration(text: str) -> int:
    t = text.lower()
    if re.search(r"\b(60|sixty)\b|\b1\s*hour\b|\ban?\s*hour\b", t):
        return 60
    if re.search(r"\b45\b|forty[-\s]?five", t):
        return 45
    return 30


def _parse_neighborhood(text: str) -> str | None:
    t = text.lower()
    for hood in _KNOWN_HOODS:
        if hood.lower() in t:
            return hood
    return None


def _parse_start_time(text: str) -> datetime | None:
    """Very small natural-time parser: handles 'today'/'tomorrow' + 'at 3pm'."""
    t = text.lower()
    now = datetime.now(timezone.utc)
    day = now.date()
    if "tomorrow" in t:
        day = day + timedelta(days=1)
    elif "today" not in t and "at" not in t:
        return None

    m = re.search(r"\bat\s*(\d{1,2})\s*(am|pm)?\b", t)
    if not m:
        return None
    hour = int(m.group(1)) % 12
    if (m.group(2) or "").lower() == "pm":
        hour += 12
    return datetime.combine(day, time(hour=hour), tzinfo=timezone.utc)


def heuristic_intent(message: str) -> BookingIntent:
    return BookingIntent(
        neighborhood=_parse_neighborhood(message),
        duration_minutes=_parse_duration(message),  # type: ignore[arg-type]
        start_time=_parse_start_time(message),
    )


@lru_cache(maxsize=1)
def _agent():
    """Construct the Pydantic AI agent once. Imported lazily so the package has no
    hard runtime dependency on a configured model."""
    from pydantic_ai import Agent

    return Agent(
        settings.llm_model,
        output_type=BookingIntent,
        instructions=(
            "You extract dog-walking booking details from a user's message. "
            f"Known neighborhoods: {', '.join(_KNOWN_HOODS)}. "
            "Only fill fields you are confident about; leave others null."
        ),
    )


def extract_intent(message: str) -> BookingIntent:
    base = heuristic_intent(message)
    if not settings.has_llm:
        return base
    try:
        result = _agent().run_sync(message)
        llm = result.output
        # Prefer LLM values, but fall back to heuristic where the LLM left blanks.
        return BookingIntent(
            neighborhood=llm.neighborhood or base.neighborhood,
            dog_name=llm.dog_name or base.dog_name,
            duration_minutes=llm.duration_minutes or base.duration_minutes,
            start_time=llm.start_time or base.start_time,
        )
    except Exception:
        # Never let an LLM/network error break the endpoint.
        return base
