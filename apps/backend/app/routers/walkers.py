from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from .. import data
from ..db import get_session
from ..deps import get_current_walker
from ..schemas import User, Walker, WalkerProfileUpdate

router = APIRouter(prefix="/walkers", tags=["walkers"])


@router.get("", response_model=list[Walker])
def list_walkers(session: Session = Depends(get_session)) -> list[Walker]:
    return data.list_walkers(session)


# `/me` must precede `/{walker_id}` so it isn't captured as a walker id.
@router.get("/me", response_model=Walker)
def get_my_profile(
    session: Session = Depends(get_session),
    walker: User = Depends(get_current_walker),
) -> Walker:
    profile = data.get_walker_profile(session, walker.id)
    if profile is None:
        raise HTTPException(status_code=404, detail="Walker profile not found")
    return profile


@router.patch("/me", response_model=Walker)
def update_my_profile(
    update: WalkerProfileUpdate,
    session: Session = Depends(get_session),
    walker: User = Depends(get_current_walker),
) -> Walker:
    profile = data.update_walker_profile(session, walker.id, update)
    if profile is None:
        raise HTTPException(status_code=404, detail="Walker profile not found")
    return profile


@router.get("/{walker_id}", response_model=Walker)
def get_walker(walker_id: str, session: Session = Depends(get_session)) -> Walker:
    walker = data.get_walker(session, walker_id)
    if walker is None:
        raise HTTPException(status_code=404, detail="Walker not found")
    return walker
