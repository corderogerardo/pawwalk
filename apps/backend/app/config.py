"""Application settings, loaded from environment / .env via pydantic-settings.

Learning note: `BaseSettings` is Pydantic's typed configuration loader. Every
field below can be overridden by an env var prefixed with ``PAWWALK_`` (see
``model_config``). This is the idiomatic FastAPI way to manage config — no
scattered ``os.getenv`` calls.
"""
from __future__ import annotations

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="PAWWALK_", env_file=".env", extra="ignore")

    app_name: str = "PawWalk API"
    version: str = "0.1.0"

    database_url: str = "sqlite:///./pawwalk.db"

    # Native iOS/Android clients don't send an Origin header, so this only
    # matters for browser clients (the landing page, Swagger UI on another
    # origin). Comma-separated, e.g. PAWWALK_CORS_ORIGINS=https://pawwalk.app,https://www.pawwalk.app
    cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_csv(cls, v: object) -> object:
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    # No default on purpose: a real deployment must set PAWWALK_JWT_SECRET or
    # startup fails loudly. Local/dev gets a value from compose.yaml instead.
    jwt_secret: str
    jwt_alg: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7

    # When set (e.g. "openai:gpt-4o-mini"), the booking assistant uses a real
    # Pydantic AI agent. The matching provider key (OPENAI_API_KEY, etc.) must
    # also be present in the environment. When unset, a heuristic parser is used
    # so the server is fully functional offline.
    llm_model: str | None = None

    @property
    def has_llm(self) -> bool:
        return bool(self.llm_model)

    # When set, /payments/intent creates a real Stripe PaymentIntent. When
    # unset, it keeps returning the offline stub — same response shape either
    # way, so the mobile clients don't need to know which mode is active.
    stripe_secret_key: str | None = None
    stripe_webhook_secret: str | None = None

    @property
    def has_stripe(self) -> bool:
        return bool(self.stripe_secret_key)


settings = Settings()
