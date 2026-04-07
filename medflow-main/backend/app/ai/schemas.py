from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)


class ChatResponse(BaseModel):
    answer: str
    data: Optional[Dict[str, Any]] = None
    intent: Optional[str] = None
    confidence: Optional[float] = None


class InsightsResponse(BaseModel):
    insights: List[str]


class RecommendationItem(BaseModel):
    text: str
    confidence: Optional[float] = None
    explanation: Optional[str] = None


class RecommendationsResponse(BaseModel):
    recommendations: List[RecommendationItem]
