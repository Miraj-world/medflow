from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.deps import get_current_user
from app.database import get_db
from app.models.patient import Patient

router = APIRouter(prefix="/patients", tags=["patients"])


class PatientIn(BaseModel):
    first_name: str = Field(..., min_length=1)
    last_name: str = Field(..., min_length=1)
    dob: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None


class PatientOut(PatientIn):
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


@router.get("/", response_model=List[PatientOut])
def list_patients(user: Dict[str, Any] = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_staff(user)
    return db.query(Patient).all()


@router.get("/{patient_id}", response_model=PatientOut)
def get_patient(patient_id: str, user: Dict[str, Any] = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_staff(user)
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.post("/", response_model=PatientOut, status_code=201)
def create_patient(payload: PatientIn, user: Dict[str, Any] = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_staff(user)
    new_patient = Patient(
        id=str(uuid4()),
        first_name=payload.first_name,
        last_name=payload.last_name,
        dob=payload.dob,
        phone=payload.phone,
        email=payload.email,
        address=payload.address,
        notes=payload.notes,
        created_at=_now_iso()
    )
    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)
    return new_patient


@router.put("/{patient_id}", response_model=PatientOut)
def update_patient(
    patient_id: str,
    payload: PatientIn,
    user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    _require_staff(user)
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    patient.first_name = payload.first_name
    patient.last_name = payload.last_name
    patient.dob = payload.dob
    patient.phone = payload.phone
    patient.email = payload.email
    patient.address = payload.address
    patient.notes = payload.notes

    db.commit()
    db.refresh(patient)
    return patient


@router.delete("/{patient_id}", status_code=204)
def delete_patient(patient_id: str, user: Dict[str, Any] = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_staff(user)
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    db.delete(patient)
    db.commit()
    return None
