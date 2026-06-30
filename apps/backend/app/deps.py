"""Shared FastAPI dependencies."""
from __future__ import annotations

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlmodel import Session

from .db import get_session
from .models_db import UserTable
from .schemas import User
from .security import decode_token

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    session: Session = Depends(get_session),
) -> User:
    user_id = decode_token(credentials.credentials) if credentials else None
    if user_id is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    row = session.get(UserTable, user_id)
    if row is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return User.model_validate(row, from_attributes=True)
