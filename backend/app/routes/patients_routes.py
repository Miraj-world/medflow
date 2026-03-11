from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_db, require_roles
from app.models import Patient, User
from app.schemas import PatientBase, PatientOut

router = APIRouter(prefix="/patients", tags=["patients"])


@router.get("/", response_model=list[PatientOut])
def list_patients(
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(["admin", "clinician"])),
):
    return db.query(Patient).order_by(Patient.created_at.desc()).all()


@router.get("/{patient_id}", response_model=PatientOut)
def get_patient(
    patient_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(["admin", "clinician"])),
):
    patient = db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    return patient


@router.post("/", response_model=PatientOut, status_code=status.HTTP_201_CREATED)
def create_patient(
    payload: PatientBase,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(["admin", "clinician"])),
):
    patient = Patient(**payload.model_dump())
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


@router.put("/{patient_id}", response_model=PatientOut)
def update_patient(
    patient_id: UUID,
    payload: PatientBase,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(["admin", "clinician"])),
):
    patient = db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    for key, value in payload.model_dump().items():
        setattr(patient, key, value)

    db.commit()
    db.refresh(patient)
    return patient


@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_patient(
    patient_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(["admin", "clinician"])),
):
    patient = db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    db.delete(patient)
    db.commit()
    return None
