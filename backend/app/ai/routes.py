from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.ai.ai_service import get_hospital_analytics
from app.ai.chatbot import handle_chat
from app.ai.insights import build_insights
from app.ai.recommendations import build_recommendations
from app.ai.schemas import ChatRequest, ChatResponse, InsightsResponse, RecommendationsResponse
from app.database import get_db
from app.deps import require_roles

router = APIRouter(prefix="/ai", tags=["ai"])

STAFF_ROLES = ("admin", "clinician")


@router.get("/insights", response_model=InsightsResponse)
def get_insights(user: Dict[str, Any] = Depends(require_roles(STAFF_ROLES))):
    analytics = get_hospital_analytics()
    return {"insights": build_insights(analytics)}


@router.get("/recommendations", response_model=RecommendationsResponse)
def get_recommendations(user: Dict[str, Any] = Depends(require_roles(STAFF_ROLES))):
    analytics = get_hospital_analytics()
    return {"recommendations": build_recommendations(analytics)}


@router.post("/chat", response_model=ChatResponse)
def chat(
    payload: ChatRequest,
    user: Dict[str, Any] = Depends(require_roles(STAFF_ROLES)),
    db: Session = Depends(get_db),
):
    return handle_chat(payload.message, db)
