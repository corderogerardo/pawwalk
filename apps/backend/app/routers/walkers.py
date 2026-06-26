from __future__ import annotations

from fastapi import APIRouter, HTTPException

from .. import data
from ..schemas import Walker

router = APIRouter(prefix="/walkers", tags=["walkers"])


@router.get("", response_model=list[Walker])
def list_walkers() -> list[Walker]:
    return data.list_walkers()


@router.get("/{walker_id}", response_model=Walker)
def get_walker(walker_id: str) -> Walker:
    walker = data.get_walker(walker_id)
    if walker is None:
        raise HTTPException(status_code=404, detail="Walker not found")
    return walker
