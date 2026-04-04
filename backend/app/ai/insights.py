from __future__ import annotations

from typing import Any, Dict, List


def build_insights(analytics: Dict[str, Any]) -> List[str]:
    insights: List[str] = []

    readmission_rate = float(analytics.get("readmission_rate", 0) or 0)
    avg_satisfaction = float(analytics.get("avg_satisfaction", 0) or 0)
    avg_length_of_stay = float(analytics.get("avg_length_of_stay", 0) or 0)
    procedure_costs = analytics.get("procedure_cost_analysis") or []

    if readmission_rate > 0.15:
        insights.append(f"Readmission rate is high at {readmission_rate * 100:.1f}%.")
    elif readmission_rate > 0:
        insights.append(f"Readmission rate is stable at {readmission_rate * 100:.1f}%.")

    if avg_satisfaction and avg_satisfaction < 3:
        insights.append("Average satisfaction is below optimal levels.")
    elif avg_satisfaction:
        insights.append(f"Average satisfaction is {avg_satisfaction:.1f}.")

    if avg_length_of_stay > 6:
        insights.append(f"Average length of stay is elevated at {avg_length_of_stay:.1f} days.")

    if procedure_costs:
        top = procedure_costs[0]
        insights.append(
            f"Top cost driver is {top.get('procedure', 'Unknown')} "
            f"with total cost ${top.get('total_cost', 0):,.0f}."
        )

    if not insights:
        insights.append("No notable analytics signals detected in the current dataset.")

    return insights
