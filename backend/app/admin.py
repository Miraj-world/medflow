from fastapi import APIRouter, Depends, HTTPException, status
from typing import Any, Dict

from .storage import load_json
from .auth import get_current_user

router = APIRouter(prefix="/admin", tags=["admin"])


def _require_admin(user: Dict[str, Any]) -> None:
    role = (user or {}).get("role")
    if role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")


@router.get("/metrics")
def metrics(user: Dict[str, Any] = Depends(get_current_user)):
    _require_admin(user)

    patients = load_json("patients.json", [])
    appointments = load_json("appointments.json", [])

    return {
        "patients_count": len(patients) if isinstance(patients, list) else 0,
        "appointments_count": len(appointments) if isinstance(appointments, list) else 0,
    }