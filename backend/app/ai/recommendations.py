from __future__ import annotations

from typing import Any, Dict, List


def build_recommendations(analytics: Dict[str, Any]) -> List[Dict[str, Any]]:
    recommendations: List[Dict[str, Any]] = []

    readmission_rate = float(analytics.get("readmission_rate", 0) or 0)
    avg_satisfaction = float(analytics.get("avg_satisfaction", 0) or 0)
    avg_length_of_stay = float(analytics.get("avg_length_of_stay", 0) or 0)
    procedure_costs = analytics.get("procedure_cost_analysis") or []

    if readmission_rate > 0.15:
        recommendations.append(
            {
                "text": "Increase follow-up appointments for high-risk patients.",
                "confidence": 0.78,
                "explanation": f"Readmission rate is {readmission_rate * 100:.1f}%, above 15%.",
            }
        )

    if avg_satisfaction and avg_satisfaction < 3:
        recommendations.append(
            {
                "text": "Review care experience workflows to improve patient satisfaction.",
                "confidence": 0.72,
                "explanation": f"Average satisfaction is {avg_satisfaction:.1f}, below 3.0.",
            }
        )

    if avg_length_of_stay > 6:
        recommendations.append(
            {
                "text": "Audit length-of-stay drivers and streamline discharge planning.",
                "confidence": 0.66,
                "explanation": f"Average length of stay is {avg_length_of_stay:.1f} days.",
            }
        )

    if procedure_costs:
        top = procedure_costs[0]
        recommendations.append(
            {
                "text": "Investigate high-cost procedures to reduce average spend.",
                "confidence": 0.64,
                "explanation": f"{top.get('procedure', 'Procedure')} has the highest total cost.",
            }
        )

    if not recommendations:
        recommendations.append(
            {
                "text": "Maintain current clinical workflows and monitor key metrics.",
                "confidence": 0.5,
                "explanation": "No threshold-based alerts were triggered.",
            }
        )

    return recommendations
