from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.deps import get_current_user
from app.database import get_db
from app.models.appointment import Appointment

router = APIRouter(prefix="/appointments", tags=["appointments"])


class AppointmentIn(BaseModel):
    patient_id: str = Field(..., min_length=1)
    clinician: Optional[str] = None
    scheduled_at: str = Field(..., min_length=1)
    reason: Optional[str] = None
    status: str = Field(default="scheduled")
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


def _now_iso() -> str:
    return datetime.utcnow().replace(microsecond=0).isoformat() + "Z"


@router.get("/", response_model=List[AppointmentOut])
def list_appointments(user: Dict[str, Any] = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_staff(user)
    return db.query(Appointment).all()


@router.get("/{appointment_id}", response_model=AppointmentOut)
def get_appointment(appointment_id: str, user: Dict[str, Any] = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_staff(user)
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appointment


@router.post("/", response_model=AppointmentOut, status_code=201)
def create_appointment(payload: AppointmentIn, user: Dict[str, Any] = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_staff(user)
    new_appt = Appointment(
        id=str(uuid4()),
        patient_id=payload.patient_id,
        clinician=payload.clinician,
        scheduled_at=payload.scheduled_at,
        reason=payload.reason,
        status=payload.status,
        notes=payload.notes,
        created_at=_now_iso()
    )
    db.add(new_appt)
    db.commit()
    db.refresh(new_appt)
    return new_appt


@router.put("/{appointment_id}", response_model=AppointmentOut)
def update_appointment(
    appointment_id: str,
    payload: AppointmentIn,
    user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    _require_staff(user)
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    appointment.patient_id = payload.patient_id
    appointment.clinician = payload.clinician
    appointment.scheduled_at = payload.scheduled_at
    appointment.reason = payload.reason
    appointment.status = payload.status
    appointment.notes = payload.notes

    db.commit()
    db.refresh(appointment)
    return appointment


@router.delete("/{appointment_id}", status_code=204)
def delete_appointment(appointment_id: str, user: Dict[str, Any] = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_staff(user)
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    db.delete(appointment)
    db.commit()
    return None
