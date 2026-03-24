from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, ConfigDict
from sqlalchemy.orm import Session

from app.deps import get_current_user
from app.database import get_db
from app.models.appointment import Appointment
from app.models.patient import Patient
from app.routes.notifications import create_notification

router = APIRouter(prefix="/appointments", tags=["appointments"])


class AppointmentIn(BaseModel):
    patient_id: str
    clinician: Optional[str] = None
    scheduled_at: str
    reason: str = Field(..., min_length=1)
    status: str = "scheduled"
    notes: Optional[str] = None


class DeleteReasonIn(BaseModel):
    reason: str = Field(..., min_length=1)


class AppointmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    patient_id: UUID
    clinician: Optional[str] = None
    scheduled_at: datetime
    reason: str
    status: str
    notes: Optional[str] = None
    created_at: datetime


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
        return datetime.fromisoformat(value)
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid {field}. Expected ISO datetime format.",
        ) from exc


@router.get("", response_model=List[AppointmentOut])
@router.get("/", response_model=List[AppointmentOut])
def list_appointments(
    user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_staff(user)
    return db.query(Appointment).all()


@router.get("/{appointment_id}", response_model=AppointmentOut)
def get_appointment(
    appointment_id: str,
    user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_staff(user)
    appointment_uuid = _parse_uuid(appointment_id, "appointment_id")
    appointment = db.query(Appointment).filter(Appointment.id == appointment_uuid).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appointment


@router.post("", response_model=AppointmentOut, status_code=201)
@router.post("/", response_model=AppointmentOut, status_code=201)
def create_appointment(
    payload: AppointmentIn,
    user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_staff(user)

    patient_uuid = _parse_uuid(payload.patient_id, "patient_id")
    patient = db.query(Patient).filter(Patient.id == patient_uuid).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    scheduled_at = _parse_datetime(payload.scheduled_at, "scheduled_at")
    clinician_value = payload.clinician or user.get("username")

    new_appt = Appointment(
        patient_id=patient_uuid,
        clinician=clinician_value,
        scheduled_at=scheduled_at,
        reason=payload.reason,
        status=payload.status,
        notes=payload.notes,
    )
    db.add(new_appt)
    db.commit()
    db.refresh(new_appt)

    create_notification(
        db,
        title="New Appointment Scheduled",
        message=f"Appointment scheduled for {patient.first_name} {patient.last_name} on {new_appt.scheduled_at.isoformat()}.",
        recipient_username=new_appt.clinician,
        notification_type="appointment_created",
        entity_type="appointment",
        entity_id=str(new_appt.id),
        created_by=user.get("username"),
    )

    return new_appt


@router.put("/{appointment_id}", response_model=AppointmentOut)
def update_appointment(
    appointment_id: str,
    payload: AppointmentIn,
    user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_staff(user)

    appointment_uuid = _parse_uuid(appointment_id, "appointment_id")
    appointment = db.query(Appointment).filter(Appointment.id == appointment_uuid).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    patient_uuid = _parse_uuid(payload.patient_id, "patient_id")
    patient = db.query(Patient).filter(Patient.id == patient_uuid).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    old_scheduled_at = appointment.scheduled_at
    old_status = appointment.status
    old_clinician = appointment.clinician

    appointment.patient_id = patient_uuid
    appointment.clinician = payload.clinician or appointment.clinician or user.get("username")
    appointment.scheduled_at = _parse_datetime(payload.scheduled_at, "scheduled_at")
    appointment.reason = payload.reason
    appointment.status = payload.status
    appointment.notes = payload.notes

    db.commit()
    db.refresh(appointment)

    title = "Appointment Updated"
    notification_type = "appointment_updated"

    if old_scheduled_at != appointment.scheduled_at:
        title = "Appointment Rescheduled"
        notification_type = "appointment_rescheduled"
    elif (old_status or "").lower() != (appointment.status or "").lower() and (appointment.status or "").lower() == "cancelled":
        title = "Appointment Cancelled"
        notification_type = "appointment_cancelled"

    create_notification(
        db,
        title=title,
        message=f"Appointment for {patient.first_name} {patient.last_name} is now set for {appointment.scheduled_at.isoformat()} with status '{appointment.status}'.",
        recipient_username=appointment.clinician or old_clinician,
        notification_type=notification_type,
        entity_type="appointment",
        entity_id=str(appointment.id),
        created_by=user.get("username"),
    )

    return appointment


@router.delete("/{appointment_id}", status_code=204)
def delete_appointment(
    appointment_id: str,
    payload: DeleteReasonIn,
    user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_staff(user)

    appointment_uuid = _parse_uuid(appointment_id, "appointment_id")
    appointment = db.query(Appointment).filter(Appointment.id == appointment_uuid).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    patient = db.query(Patient).filter(Patient.id == appointment.patient_id).first()
    patient_name = f"{patient.first_name} {patient.last_name}" if patient else "patient"

    clinician = appointment.clinician
    scheduled_at = appointment.scheduled_at.isoformat() if appointment.scheduled_at else ""
    appointment_id_value = str(appointment.id)
    delete_reason = payload.reason.strip()

    db.delete(appointment)
    db.commit()

    create_notification(
        db,
        title="Appointment Deleted",
        message=f"Appointment for {patient_name} on {scheduled_at} was deleted. Reason: {delete_reason}",
        recipient_username=clinician,
        notification_type="appointment_deleted",
        entity_type="appointment",
        entity_id=appointment_id_value,
        created_by=user.get("username"),
    )

    return None