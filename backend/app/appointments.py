# backend/app/appointments.py
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from .auth import get_current_user
from .storage import load_json, save_json

router = APIRouter(prefix="/appointments", tags=["appointments"])


class AppointmentIn(BaseModel):
    patient_id: str = Field(..., min_length=1)
    clinician: Optional[str] = None
    scheduled_at: str = Field(..., min_length=1)  # ISO string for prototype
    reason: Optional[str] = None
    status: str = Field(default="scheduled")  # scheduled | completed | canceled
    notes: Optional[str] = None


class AppointmentOut(AppointmentIn):
    id: str
    created_at: str


def _require_staff(user: Dict[str, Any]) -> None:
    role = (user or {}).get("role")
    if role not in ("admin", "clinician"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions",
        )


def _load_appts() -> List[Dict[str, Any]]:
    data = load_json("appointments.json", [])
    return data if isinstance(data, list) else []


def _save_appts(appts: List[Dict[str, Any]]) -> None:
    save_json("appointments.json", appts)


def _now_iso() -> str:
    return datetime.utcnow().replace(microsecond=0).isoformat() + "Z"


@router.get("/", response_model=List[AppointmentOut])
def list_appointments(user: Dict[str, Any] = Depends(get_current_user)):
    _require_staff(user)
    return _load_appts()


@router.get("/{appointment_id}", response_model=AppointmentOut)
def get_appointment(appointment_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    _require_staff(user)
    for a in _load_appts():
        if a.get("id") == appointment_id:
            return a
    raise HTTPException(status_code=404, detail="Appointment not found")


@router.post("/", response_model=AppointmentOut, status_code=201)
def create_appointment(payload: AppointmentIn, user: Dict[str, Any] = Depends(get_current_user)):
    _require_staff(user)
    appts = _load_appts()

    new_appt = payload.model_dump()
    new_appt["id"] = str(uuid4())
    new_appt["created_at"] = _now_iso()

    appts.append(new_appt)
    _save_appts(appts)
    return new_appt


@router.put("/{appointment_id}", response_model=AppointmentOut)
def update_appointment(
    appointment_id: str,
    payload: AppointmentIn,
    user: Dict[str, Any] = Depends(get_current_user),
):
    _require_staff(user)
    appts = _load_appts()

    for i, a in enumerate(appts):
        if a.get("id") == appointment_id:
            updated = payload.model_dump()
            updated["id"] = appointment_id
            updated["created_at"] = a.get("created_at", _now_iso())
            appts[i] = updated
            _save_appts(appts)
            return updated

    raise HTTPException(status_code=404, detail="Appointment not found")


@router.delete("/{appointment_id}", status_code=204)
def delete_appointment(appointment_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    _require_staff(user)
    appts = _load_appts()

    new_list = [a for a in appts if a.get("id") != appointment_id]
    if len(new_list) == len(appts):
        raise HTTPException(status_code=404, detail="Appointment not found")

    _save_appts(new_list)
    return None