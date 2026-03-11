from collections import Counter, defaultdict

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.data_encryption import try_decrypt_text
from app.dependencies import get_db, require_roles
from app.models import HospitalAppointment, User
from app.schemas import HospitalAnalyticsResponse

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/hospital", response_model=HospitalAnalyticsResponse)
def hospital_analytics(
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(["admin", "clinician"])),
):
    rows = db.query(HospitalAppointment).all()
    total = len(rows)

    if total == 0:
        return HospitalAnalyticsResponse(
            total_patients=0,
            avg_length_of_stay=0,
            avg_satisfaction=0,
            readmission_rate=0,
            outcome_distribution={},
            procedure_cost_analysis=[],
        )

    length_of_stay_values: list[int] = []
    satisfaction_values: list[int] = []
    readmissions = 0
    outcomes: Counter[str] = Counter()
    procedure_totals: dict[str, float] = defaultdict(float)
    procedure_counts: dict[str, int] = defaultdict(int)

    for row in rows:
        los = int(row.length_of_stay or 0)
        sat = int(row.satisfaction or 0)
        cost = float(row.cost or 0)

        readmission = (row.readmission or "").strip().lower()
        outcome = (row.outcome or "Unknown").strip() or "Unknown"
        procedure = try_decrypt_text(row.procedure_enc or "Unknown")

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

    return HospitalAnalyticsResponse(
        total_patients=total,
        avg_length_of_stay=round(sum(length_of_stay_values) / total, 2),
        avg_satisfaction=round(sum(satisfaction_values) / total, 2),
        readmission_rate=round(readmissions / total, 4),
        outcome_distribution=dict(outcomes),
        procedure_cost_analysis=procedure_cost_analysis,
    )
