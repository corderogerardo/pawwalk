"""Pets — owned by owner-role users. The booking form picks one of these to fill
`dog_name`, so pets are a first-class entity without changing the booking shape.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from .. import data
from ..db import get_session
from ..deps import get_current_owner
from ..schemas import CreatePetRequest, Pet, User

router = APIRouter(prefix="/pets", tags=["pets"])


@router.post("", response_model=Pet, status_code=201)
def create_pet(
    req: CreatePetRequest,
    session: Session = Depends(get_session),
    owner: User = Depends(get_current_owner),
) -> Pet:
    return data.create_pet(session, owner.id, req)


@router.get("", response_model=list[Pet])
def list_pets(
    session: Session = Depends(get_session),
    owner: User = Depends(get_current_owner),
) -> list[Pet]:
    return data.list_pets(session, owner.id)


@router.delete("/{pet_id}", status_code=204)
def delete_pet(
    pet_id: str,
    session: Session = Depends(get_session),
    owner: User = Depends(get_current_owner),
) -> None:
    if not data.delete_pet(session, pet_id, owner.id):
        raise HTTPException(status_code=404, detail="Pet not found")
