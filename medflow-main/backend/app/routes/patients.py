from __future__ import annotations

from datetime import date
from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session, selectinload

from app.deps import require_roles
from app.database import get_db
from app.models.disease import Disease
from app.models.patient import Patient

router = APIRouter(prefix="/patients", tags=["patients"])

STAFF_ROLES = ("admin", "clinician")


class DiseaseOut(BaseModel):
    id: int
    name: str


class PatientIn(BaseModel):
    first_name: str = Field(..., min_length=1)
    last_name: str = Field(..., min_length=1)
    dob: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    disease_ids: List[int] = Field(default_factory=list)


class PatientOut(PatientIn):
    id: str
    created_at: str
    diseases: List[DiseaseOut] = Field(default_factory=list)


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


def _patient_to_dict(patient: Patient) -> Dict[str, Any]:
    diseases = [
        {"id": disease.id, "name": disease.name}
        for disease in (patient.diseases or [])
    ]
    return {
        "id": str(patient.id),
        "first_name": patient.first_name,
        "last_name": patient.last_name,
        "dob": patient.dob.isoformat() if patient.dob else None,
        "phone": patient.phone,
        "email": patient.email,
        "address": patient.address,
        "notes": patient.notes,
        "created_at": patient.created_at.isoformat() if patient.created_at else None,
        "disease_ids": [d["id"] for d in diseases],
        "diseases": diseases,
    }


def _load_diseases(db: Session, disease_ids: List[int]) -> List[Disease]:
    if not disease_ids:
        return []
    unique_ids = sorted({int(did) for did in disease_ids})
    diseases = db.query(Disease).filter(Disease.id.in_(unique_ids)).all()
    found_ids = {d.id for d in diseases}
    missing = [did for did in unique_ids if did not in found_ids]
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown disease_ids: {', '.join(map(str, missing))}",
        )
    return diseases


@router.get("/", response_model=List[PatientOut])
def list_patients(
    user: Dict[str, Any] = Depends(require_roles(STAFF_ROLES)),
    db: Session = Depends(get_db),
):
    patients = db.query(Patient).options(selectinload(Patient.diseases)).all()
    return [_patient_to_dict(patient) for patient in patients]


@router.get("/{patient_id}", response_model=PatientOut)
def get_patient(
    patient_id: str,
    user: Dict[str, Any] = Depends(require_roles(STAFF_ROLES)),
    db: Session = Depends(get_db),
):
    patient_uuid = _parse_uuid(patient_id, "patient_id")
    patient = (
        db.query(Patient)
        .options(selectinload(Patient.diseases))
        .filter(Patient.id == patient_uuid)
        .first()
    )
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return _patient_to_dict(patient)


@router.post("/", response_model=PatientOut, status_code=201)
def create_patient(
    payload: PatientIn,
    user: Dict[str, Any] = Depends(require_roles(STAFF_ROLES)),
    db: Session = Depends(get_db),
):
    dob = _parse_date(payload.dob, "dob")
    diseases = _load_diseases(db, payload.disease_ids)
    new_patient = Patient(
        first_name=payload.first_name,
        last_name=payload.last_name,
        dob=dob,
        phone=payload.phone,
        email=payload.email,
        address=payload.address,
        notes=payload.notes,
        diseases=diseases,
    )
    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)
    return _patient_to_dict(new_patient)


@router.put("/{patient_id}", response_model=PatientOut)
def update_patient(
    patient_id: str,
    payload: PatientIn,
    user: Dict[str, Any] = Depends(require_roles(STAFF_ROLES)),
    db: Session = Depends(get_db),
):
    patient_uuid = _parse_uuid(patient_id, "patient_id")
    patient = (
        db.query(Patient)
        .options(selectinload(Patient.diseases))
        .filter(Patient.id == patient_uuid)
        .first()
    )
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    diseases = _load_diseases(db, payload.disease_ids)
    patient.first_name = payload.first_name
    patient.last_name = payload.last_name
    patient.dob = _parse_date(payload.dob, "dob")
    patient.phone = payload.phone
    patient.email = payload.email
    patient.address = payload.address
    patient.notes = payload.notes
    patient.diseases = diseases

    db.commit()
    db.refresh(patient)
    return _patient_to_dict(patient)


@router.delete("/{patient_id}", status_code=204)
def delete_patient(
    patient_id: str,
    user: Dict[str, Any] = Depends(require_roles(STAFF_ROLES)),
    db: Session = Depends(get_db),
):
    patient_uuid = _parse_uuid(patient_id, "patient_id")
    patient = db.query(Patient).filter(Patient.id == patient_uuid).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    db.delete(patient)
    db.commit()
    return None
