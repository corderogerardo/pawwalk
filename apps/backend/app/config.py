"""Application settings, loaded from environment / .env via pydantic-settings.

Learning note: `BaseSettings` is Pydantic's typed configuration loader. Every
field below can be overridden by an env var prefixed with ``PAWWALK_`` (see
``model_config``). This is the idiomatic FastAPI way to manage config — no
scattered ``os.getenv`` calls.
"""
from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="PAWWALK_", env_file=".env", extra="ignore")

    app_name: str = "PawWalk API"
    version: str = "0.1.0"

    # When set (e.g. "openai:gpt-4o-mini"), the booking assistant uses a real
    # Pydantic AI agent. The matching provider key (OPENAI_API_KEY, etc.) must
    # also be present in the environment. When unset, a heuristic parser is used
    # so the server is fully functional offline.
    llm_model: str | None = None

    @property
    def has_llm(self) -> bool:
        return bool(self.llm_model)


settings = Settings()
