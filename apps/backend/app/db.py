"""DB engine + session dependency (Phase 1).

Replaces the in-memory store in `data.py` with a real database, without the
router or schema layers changing — `data.py` stays the seam.
"""
from __future__ import annotations

from collections.abc import Iterator

from sqlmodel import Session, create_engine

from .config import settings

connect_args = (
    {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
)
engine = create_engine(settings.database_url, connect_args=connect_args)


def get_session() -> Iterator[Session]:
    with Session(engine) as session:
        yield session


def run_migrations() -> None:
    """Bring the DB to the latest schema (``alembic upgrade head``).

    Called on startup instead of ``create_all()`` so schema *changes* (added
    columns, altered types) are applied to an existing DB — the thing
    ``create_all()`` silently skips (see docs/IMPLEMENTATION-PLAN.md B12).
    """
    from pathlib import Path

    from alembic import command
    from alembic.config import Config

    backend_root = Path(__file__).resolve().parent.parent  # apps/backend (/app in Docker)
    cfg = Config(str(backend_root / "alembic.ini"))
    cfg.set_main_option("script_location", str(backend_root / "alembic"))
    command.upgrade(cfg, "head")  # env.py injects sqlalchemy.url from settings
