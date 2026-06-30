"""DB engine + session dependency (Phase 1).

Replaces the in-memory store in `data.py` with a real database, without the
router or schema layers changing — `data.py` stays the seam.
"""
from __future__ import annotations

from collections.abc import Iterator

from sqlmodel import Session, SQLModel, create_engine

from .config import settings

connect_args = (
    {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
)
engine = create_engine(settings.database_url, connect_args=connect_args)


def get_session() -> Iterator[Session]:
    with Session(engine) as session:
        yield session


def init_db() -> None:
    from . import models_db  # noqa: F401  (import registers tables on SQLModel.metadata)

    SQLModel.metadata.create_all(engine)
