from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlmodel import Session

from ..assistant.graph import run_assistant
from ..db import get_session
from ..schemas import AssistantChatRequest, AssistantReply

router = APIRouter(prefix="/assistant", tags=["assistant"])


@router.post("/chat", response_model=AssistantReply)
def chat(req: AssistantChatRequest, session: Session = Depends(get_session)) -> AssistantReply:
    """Natural-language booking assistant, powered by a LangGraph state machine."""
    return run_assistant(req.message, session)
