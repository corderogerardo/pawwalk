"""Point the app at a throwaway SQLite DB for the test session.

`pytest_configure` runs before any test module is imported, so the env var is
in place before `app.config`/`app.db` resolve `settings.database_url`.
"""
from __future__ import annotations

import os
import tempfile
from collections.abc import Iterator
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient


def pytest_configure(config: pytest.Config) -> None:
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    os.environ["PAWWALK_DATABASE_URL"] = f"sqlite:///{path}"
    config._pawwalk_db_path = path
    # Tests run fully offline with zero setup — a throwaway secret here doesn't
    # weaken the "no default in real deployments" guarantee in app/config.py.
    os.environ.setdefault("PAWWALK_JWT_SECRET", "test-secret-not-for-prod")


def pytest_unconfigure(config: pytest.Config) -> None:
    path = getattr(config, "_pawwalk_db_path", None)
    if path and os.path.exists(path):
        os.remove(path)


@pytest.fixture()
def client() -> Iterator[TestClient]:
    from app.main import app  # imported lazily so PAWWALK_DATABASE_URL is set first

    with TestClient(app) as c:
        yield c


@pytest.fixture()
def auth_headers(client: TestClient) -> dict[str, str]:
    """Signs up a fresh user (unique per call — tests share one DB file) and
    returns headers carrying their Bearer token."""
    email = f"tester+{uuid4().hex[:8]}@example.com"
    r = client.post(
        "/auth/signup", json={"email": email, "password": "correct-horse", "name": "Tester"}
    )
    token = r.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
