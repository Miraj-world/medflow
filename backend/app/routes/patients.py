from __future__ import annotations

from datetime import date, datetime
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

router = APIRouter(prefix="/patients", tags=["patients"])


class PatientIn(BaseModel):
    first_name: str = Field(..., min_length=1)
    last_name: str = Field(..., min_length=1)
    dob: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None


class DeleteReasonIn(BaseModel):
    reason: str = Field(..., min_length=1)


class PatientOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    first_name: str
    last_name: str
    dob: Optional[date] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None


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


def _parse_date(value: Optional[str], field: str) -> Optional[date]:
    if value is None or value == "":
        return None
    try:
        return date.fromisoformat(value)
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid {field}. Expected YYYY-MM-DD.",
        ) from exc


@router.get("", response_model=List[PatientOut])
@router.get("/", response_model=List[PatientOut])
def list_patients(
    user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_staff(user)
    return db.query(Patient).all()


@router.get("/{patient_id}", response_model=PatientOut)
def get_patient(
    patient_id: str,
    user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_staff(user)
    patient_uuid = _parse_uuid(patient_id, "patient_id")
    patient = db.query(Patient).filter(Patient.id == patient_uuid).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.post("", response_model=PatientOut, status_code=201)
@router.post("/", response_model=PatientOut, status_code=201)
def create_patient(
    payload: PatientIn,
    user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_staff(user)
    dob = _parse_date(payload.dob, "dob")

    new_patient = Patient(
        first_name=payload.first_name,
        last_name=payload.last_name,
        dob=dob,
        phone=payload.phone,
        email=payload.email,
        address=payload.address,
        notes=payload.notes,
    )
    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)

    create_notification(
        db,
        title="New Patient Added",
        message=f"{new_patient.first_name} {new_patient.last_name} was added to the system.",
        recipient_role="clinician",
        notification_type="patient_created",
        entity_type="patient",
        entity_id=str(new_patient.id),
        created_by=user.get("username"),
    )

    return new_patient


@router.put("/{patient_id}", response_model=PatientOut)
def update_patient(
    patient_id: str,
    payload: PatientIn,
    user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_staff(user)
    patient_uuid = _parse_uuid(patient_id, "patient_id")
    patient = db.query(Patient).filter(Patient.id == patient_uuid).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    patient.first_name = payload.first_name
    patient.last_name = payload.last_name
    patient.dob = _parse_date(payload.dob, "dob")
    patient.phone = payload.phone
    patient.email = payload.email
    patient.address = payload.address
    patient.notes = payload.notes

    db.commit()
    db.refresh(patient)
    return patient


@router.delete("/{patient_id}", status_code=204)
def delete_patient(
    patient_id: str,
    payload: DeleteReasonIn,
    user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_staff(user)

    patient_uuid = _parse_uuid(patient_id, "patient_id")
    patient = db.query(Patient).filter(Patient.id == patient_uuid).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    delete_reason = payload.reason.strip()
    patient_name = f"{patient.first_name} {patient.last_name}"

    related_appointments = db.query(Appointment).filter(Appointment.patient_id == patient_uuid).all()
    for appointment in related_appointments:
        db.delete(appointment)

    db.delete(patient)
    db.commit()

    create_notification(
        db,
        title="Patient Deleted",
        message=f"{patient_name} was deleted from the system. Reason: {delete_reason}",
        recipient_role="clinician",
        notification_type="patient_deleted",
        entity_type="patient",
        entity_id=str(patient_uuid),
        created_by=user.get("username"),
    )

    return None