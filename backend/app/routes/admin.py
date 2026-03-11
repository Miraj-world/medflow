from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any, Dict

from app.database import get_db
from app.models.patient import Patient
from app.models.appointment import Appointment
from app.deps import get_current_user

router = APIRouter(prefix="/admin", tags=["admin"])


def _require_admin(user: Dict[str, Any]) -> None:
    role = (user or {}).get("role")
    if role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")


@router.get("/metrics")
def metrics(user: Dict[str, Any] = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_admin(user)

    patients_count = db.query(Patient).count()
    appointments_count = db.query(Appointment).count()

    return {
        "patients_count": patients_count,
        "appointments_count": appointments_count,
    }
