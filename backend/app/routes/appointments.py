from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

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


def _parse_uuid(value: str, field: str) -> UUID:
    try:
        return UUID(value)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=f"Invalid {field}") from exc


def _parse_datetime(value: str, field: str) -> datetime:
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid {field}. Expected ISO 8601 datetime.",
        ) from exc


@router.get("/", response_model=List[AppointmentOut])
def list_appointments(user: Dict[str, Any] = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_staff(user)
    return db.query(Appointment).all()


@router.get("/{appointment_id}", response_model=AppointmentOut)
def get_appointment(appointment_id: str, user: Dict[str, Any] = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_staff(user)
    appointment_uuid = _parse_uuid(appointment_id, "appointment_id")
    appointment = db.query(Appointment).filter(Appointment.id == appointment_uuid).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appointment


@router.post("/", response_model=AppointmentOut, status_code=201)
def create_appointment(payload: AppointmentIn, user: Dict[str, Any] = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_staff(user)
    patient_uuid = _parse_uuid(payload.patient_id, "patient_id")
    scheduled_at = _parse_datetime(payload.scheduled_at, "scheduled_at")
    new_appt = Appointment(
        patient_id=patient_uuid,
        clinician=payload.clinician,
        scheduled_at=scheduled_at,
        reason=payload.reason,
        status=payload.status,
        notes=payload.notes,
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
    appointment_uuid = _parse_uuid(appointment_id, "appointment_id")
    appointment = db.query(Appointment).filter(Appointment.id == appointment_uuid).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    appointment.patient_id = _parse_uuid(payload.patient_id, "patient_id")
    appointment.clinician = payload.clinician
    appointment.scheduled_at = _parse_datetime(payload.scheduled_at, "scheduled_at")
    appointment.reason = payload.reason
    appointment.status = payload.status
    appointment.notes = payload.notes

    db.commit()
    db.refresh(appointment)
    return appointment


@router.delete("/{appointment_id}", status_code=204)
def delete_appointment(appointment_id: str, user: Dict[str, Any] = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_staff(user)
    appointment_uuid = _parse_uuid(appointment_id, "appointment_id")
    appointment = db.query(Appointment).filter(Appointment.id == appointment_uuid).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    db.delete(appointment)
    db.commit()
    return None
