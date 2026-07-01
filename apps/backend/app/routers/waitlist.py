"""Landing-page waitlist. No auth — it's a public marketing form. The response
never reveals whether an email was already on the list (201 new, 200 repeat is
visible in the status code but the body stays identical and harmless)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Response
from sqlmodel import Session

from .. import data
from ..db import get_session
from ..schemas import WaitlistRequest

router = APIRouter(tags=["waitlist"])


@router.post("/waitlist", status_code=201)
def join_waitlist(
    req: WaitlistRequest,
    response: Response,
    session: Session = Depends(get_session),
) -> dict[str, str]:
    if not data.add_waitlist_email(session, req.email):
        response.status_code = 200  # already on the list — still "ok"
    return {"status": "ok"}
