from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from .. import data
from ..db import get_session
from ..schemas import Walker

router = APIRouter(prefix="/walkers", tags=["walkers"])


@router.get("", response_model=list[Walker])
def list_walkers(session: Session = Depends(get_session)) -> list[Walker]:
    return data.list_walkers(session)


@router.get("/{walker_id}", response_model=Walker)
def get_walker(walker_id: str, session: Session = Depends(get_session)) -> Walker:
    walker = data.get_walker(session, walker_id)
    if walker is None:
        raise HTTPException(status_code=404, detail="Walker not found")
    return walker
