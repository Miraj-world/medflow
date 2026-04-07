from __future__ import annotations

from typing import Any, Dict, Optional, Tuple

from sqlalchemy.orm import Session

from app.ai.ai_service import get_hospital_analytics, get_patient_count


def _normalize(message: str) -> str:
    return " ".join(message.strip().lower().split())


def _detect_intent(message: str) -> Tuple[str, float]:
    text = _normalize(message)

    if "readmission" in text and (
        "how many" in text or "count" in text or "number" in text
    ):
        return "readmission_count", 0.9
    if "readmission" in text:
        return "readmission_rate", 0.9
    if "satisfaction" in text:
        return "avg_satisfaction", 0.88
    if "length of stay" in text or "los" in text:
        return "avg_length_of_stay", 0.84
    if "outcome" in text:
        return "outcome_distribution", 0.78
    if "procedure" in text or "cost" in text:
        return "high_cost_procedures", 0.76
    if "risk" in text:
        return "risk_summary", 0.7
    if ("how many" in text and "patient" in text) or "total patients" in text:
        return "patient_count", 0.72

    return "unknown", 0.2


def handle_chat(message: str, db: Optional[Session] = None) -> Dict[str, Any]:
    intent, confidence = _detect_intent(message)
    analytics = get_hospital_analytics()

    if intent == "readmission_rate":
        rate = float(analytics.get("readmission_rate", 0) or 0)
        return {
            "answer": f"The readmission rate is {rate * 100:.1f}%.",
            "data": {"readmission_rate": rate},
            "intent": intent,
            "confidence": confidence,
        }

    if intent == "readmission_count":
        total = int(analytics.get("total_patients", 0) or 0)
        rate = float(analytics.get("readmission_rate", 0) or 0)
        count = int(round(total * rate))
        return {
            "answer": f"Approximately {count} patients were readmitted.",
            "data": {"readmission_rate": rate, "readmission_count": count},
            "intent": intent,
            "confidence": confidence,
        }

    if intent == "avg_satisfaction":
        avg = float(analytics.get("avg_satisfaction", 0) or 0)
        return {
            "answer": f"The average satisfaction score is {avg:.1f}.",
            "data": {"avg_satisfaction": avg},
            "intent": intent,
            "confidence": confidence,
        }

    if intent == "avg_length_of_stay":
        avg = float(analytics.get("avg_length_of_stay", 0) or 0)
        return {
            "answer": f"The average length of stay is {avg:.1f} days.",
            "data": {"avg_length_of_stay": avg},
            "intent": intent,
            "confidence": confidence,
        }

    if intent == "outcome_distribution":
        distribution = analytics.get("outcome_distribution", {})
        return {
            "answer": "Here is the current outcome distribution.",
            "data": {"outcome_distribution": distribution},
            "intent": intent,
            "confidence": confidence,
        }

    if intent == "high_cost_procedures":
        analysis = analytics.get("procedure_cost_analysis", []) or []
        top = analysis[0] if analysis else {}
        answer = "No procedure cost data is available right now."
        if top:
            answer = (
                f"Highest total cost procedure is {top.get('procedure', 'Unknown')} "
                f"with total cost ${top.get('total_cost', 0):,.0f}."
            )
        return {
            "answer": answer,
            "data": {"procedure_cost_analysis": analysis[:5]},
            "intent": intent,
            "confidence": confidence,
        }

    if intent == "patient_count":
        count = get_patient_count(db)
        if count is None:
            count = int(analytics.get("total_patients", 0) or 0)
            source = "analytics"
        else:
            source = "patients"
        return {
            "answer": f"There are {count} patients in the system.",
            "data": {"patient_count": count, "source": source},
            "intent": intent,
            "confidence": confidence,
        }

    if intent == "risk_summary":
        rate = float(analytics.get("readmission_rate", 0) or 0)
        if rate > 0.15:
            answer = (
                "Readmission rate is elevated, suggesting higher-risk patients. "
                "Consider proactive follow-ups for recent discharges."
            )
        else:
            answer = (
                "Readmission rate is not elevated. For patient-level risk, "
                "add clinical risk scoring data."
            )
        return {
            "answer": answer,
            "data": {"readmission_rate": rate},
            "intent": intent,
            "confidence": confidence,
        }

    return {
        "answer": (
            "I can help with readmissions, satisfaction, costs, outcomes, and patient counts. "
            "Try asking about readmission rate or high-cost procedures."
        ),
        "data": None,
        "intent": "unknown",
        "confidence": confidence,
    }
