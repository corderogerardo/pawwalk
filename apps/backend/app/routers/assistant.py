from __future__ import annotations

from fastapi import APIRouter

from ..assistant.graph import run_assistant
from ..schemas import AssistantChatRequest, AssistantReply

router = APIRouter(prefix="/assistant", tags=["assistant"])


@router.post("/chat", response_model=AssistantReply)
def chat(req: AssistantChatRequest) -> AssistantReply:
    """Natural-language booking assistant, powered by a LangGraph state machine."""
    return run_assistant(req.message)
