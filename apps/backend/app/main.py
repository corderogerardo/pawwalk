"""FastAPI application entry point.

Run in dev with:  uv run fastapi dev
Then open the auto-generated docs at http://localhost:8000/docs
"""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routers import assistant, bookings, payments, walkers

app = FastAPI(title=settings.app_name, version=settings.version)

# The iOS/Android/web clients call this API from other origins during dev.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Phase 2: lock down to known client origins.
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(walkers.router)
app.include_router(bookings.router)
app.include_router(payments.router)
app.include_router(assistant.router)


@app.get("/health", tags=["meta"])
def health() -> dict[str, str]:
    return {"status": "ok", "version": settings.version}
