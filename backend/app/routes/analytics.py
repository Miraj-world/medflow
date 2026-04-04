from __future__ import annotations

from collections import Counter, defaultdict
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, status

from app.deps import require_roles
from app.utils.data_encryption import try_decrypt_text
from app.storage import load_json

router = APIRouter(prefix="/analytics", tags=["analytics"])

STAFF_ROLES = ("admin", "clinician")

def _load_hospital_appointments() -> List[Dict[str, Any]]:
    data = load_json("hospital_appointments.json", [])
    return data if isinstance(data, list) else []


def _sanitize_procedure_name(value: str) -> str:
    if not value:
        return "Unknown"
    trimmed = value.strip()
    if trimmed.startswith("gAAAA") and len(trimmed) > 30:
        return "Encrypted procedure"
    return trimmed


def compute_hospital_analytics(rows: List[Dict[str, Any]]) -> Dict[str, Any]:
    total = len(rows)

    if total == 0:
        return {
            "total_patients": 0,
            "avg_length_of_stay": 0,
            "avg_satisfaction": 0,
            "readmission_rate": 0,
            "outcome_distribution": {},
            "procedure_cost_analysis": [],
        }

    length_of_stay_values = []
    satisfaction_values = []
    readmissions = 0
    outcomes: Counter[str] = Counter()
    procedure_totals: dict[str, float] = defaultdict(float)
    procedure_counts: dict[str, int] = defaultdict(int)

    for row in rows:
        los = int(row.get("length_of_stay", 0) or 0)
        sat = int(row.get("satisfaction", 0) or 0)
        cost = float(row.get("cost", 0) or 0)

        readmission = str(row.get("readmission", "")).strip().lower()
        outcome = str(row.get("outcome", "Unknown")).strip() or "Unknown"
        procedure_raw = try_decrypt_text(str(row.get("procedure", "Unknown")))
        procedure = _sanitize_procedure_name(procedure_raw)

        length_of_stay_values.append(los)
        satisfaction_values.append(sat)

        if readmission == "yes":
            readmissions += 1

        outcomes[outcome] += 1
        procedure_totals[procedure] += cost
        procedure_counts[procedure] += 1

    procedure_cost_analysis = []
    for procedure_name, total_cost in procedure_totals.items():
        count = procedure_counts[procedure_name]
        procedure_cost_analysis.append(
            {
                "procedure": procedure_name,
                "count": count,
                "total_cost": round(total_cost, 2),
                "average_cost": round(total_cost / count, 2) if count else 0,
            }
        )

    procedure_cost_analysis.sort(key=lambda item: item["total_cost"], reverse=True)

    return {
        "total_patients": total,
        "avg_length_of_stay": round(sum(length_of_stay_values) / total, 2),
        "avg_satisfaction": round(sum(satisfaction_values) / total, 2),
        "readmission_rate": round(readmissions / total, 4),
        "outcome_distribution": dict(outcomes),
        "procedure_cost_analysis": procedure_cost_analysis,
    }


def get_hospital_analytics_payload() -> Dict[str, Any]:
    rows = _load_hospital_appointments()
    return compute_hospital_analytics(rows)


@router.get("/hospital")
def hospital_analytics(user: Dict[str, Any] = Depends(require_roles(STAFF_ROLES))):
    return get_hospital_analytics_payload()
