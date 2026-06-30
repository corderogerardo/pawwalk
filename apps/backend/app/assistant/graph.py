"""The booking assistant as a LangGraph state machine.

    parse_intent ──▶ find_walkers ──▶ draft_booking ──▶ END

Each node is a pure function from state to a partial state update. Modeling the
conversation as an explicit graph (rather than one big prompt) makes each step
testable and easy to extend — e.g. add a `confirm` node, or a conditional edge
that asks a follow-up question when the dog's name is missing.
"""
from __future__ import annotations

from typing import TypedDict

from langgraph.graph import END, START, StateGraph
from sqlmodel import Session

from .. import data
from ..schemas import AssistantReply, BookingIntent, DraftBooking, Walker
from .intent import extract_intent


class AssistantState(TypedDict, total=False):
    message: str
    session: Session
    intent: BookingIntent
    walkers: list[Walker]
    reply: str
    suggested: list[str]
    draft: DraftBooking | None


def parse_intent(state: AssistantState) -> AssistantState:
    return {"intent": extract_intent(state["message"])}


def find_walkers(state: AssistantState) -> AssistantState:
    intent = state["intent"]
    matches = data.find_walkers(state["session"], intent.neighborhood)
    return {"walkers": matches}


def draft_booking(state: AssistantState) -> AssistantState:
    intent = state["intent"]
    walkers = state.get("walkers", [])
    if not walkers:
        where = f" in {intent.neighborhood}" if intent.neighborhood else ""
        return {
            "reply": f"I couldn't find an available walker{where}. Want to try another area?",
            "suggested": [],
            "draft": None,
        }

    top = walkers[0]
    where = f" in {intent.neighborhood}" if intent.neighborhood else ""
    when = f" at {intent.start_time:%a %b %d, %I:%M %p UTC}" if intent.start_time else ""
    reply = (
        f"I found {len(walkers)} walker(s){where}. "
        f"{top.name} (⭐ {top.rating}) looks like a great fit for a "
        f"{intent.duration_minutes}-min walk{when}."
    )
    draft = DraftBooking(
        walker_id=top.id,
        dog_name=intent.dog_name,
        start_time=intent.start_time,
        duration_minutes=intent.duration_minutes,
    )
    return {"reply": reply, "suggested": [w.id for w in walkers[:3]], "draft": draft}


def _build_graph():
    g = StateGraph(AssistantState)
    g.add_node("parse_intent", parse_intent)
    g.add_node("find_walkers", find_walkers)
    g.add_node("draft_booking", draft_booking)
    g.add_edge(START, "parse_intent")
    g.add_edge("parse_intent", "find_walkers")
    g.add_edge("find_walkers", "draft_booking")
    g.add_edge("draft_booking", END)
    return g.compile()


GRAPH = _build_graph()


def run_assistant(message: str, session: Session) -> AssistantReply:
    final = GRAPH.invoke({"message": message, "session": session})
    return AssistantReply(
        reply=final["reply"],
        suggested_walkers=final.get("suggested", []),
        draft_booking=final.get("draft"),
    )
