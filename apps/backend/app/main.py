"""FastAPI application entry point.

Run in dev with:  uv run fastapi dev
Then open the auto-generated docs at http://localhost:8000/docs
"""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlmodel import Session

from .config import settings
from .db import engine, run_migrations
from .routers import assistant, auth, bookings, live, payments, pets, waitlist, walkers
from .seed import seed_demo_data


@asynccontextmanager
async def lifespan(app: FastAPI):
    run_migrations()
    with Session(engine) as session:
        seed_demo_data(session)
    yield


app = FastAPI(title=settings.app_name, version=settings.version, lifespan=lifespan)

# Native iOS/Android don't send an Origin header — this only gates browser
# clients (the landing page, Swagger UI on another origin). See config.py.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(walkers.router)
app.include_router(bookings.router)
app.include_router(pets.router)
app.include_router(payments.router)
app.include_router(assistant.router)
app.include_router(live.router)
app.include_router(waitlist.router)


# HTTPException and validation errors already return {"detail": ...} via
# FastAPI's defaults — this catches everything else so a bug never leaks a
# non-JSON response that breaks the contract's error shape.
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


@app.get("/health", tags=["meta"])
def health() -> dict[str, str]:
    return {"status": "ok", "version": settings.version}
