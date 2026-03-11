from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_db, require_roles
from app.models import Appointment, Patient, User
from app.schemas import AppointmentBase, AppointmentOut

router = APIRouter(prefix="/appointments", tags=["appointments"])


@router.get("/", response_model=list[AppointmentOut])
def list_appointments(
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(["admin", "clinician"])),
):
    return db.query(Appointment).order_by(Appointment.created_at.desc()).all()


@router.get("/{appointment_id}", response_model=AppointmentOut)
def get_appointment(
    appointment_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(["admin", "clinician"])),
):
    appointment = db.get(Appointment, appointment_id)
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    return appointment


@router.post("/", response_model=AppointmentOut, status_code=status.HTTP_201_CREATED)
def create_appointment(
    payload: AppointmentBase,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(["admin", "clinician"])),
):
    patient = db.get(Patient, payload.patient_id)
    if not patient:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Patient does not exist")

    data = payload.model_dump()
    if not data.get("clinician"):
        data["clinician"] = user.username

    appointment = Appointment(**data)
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment


@router.put("/{appointment_id}", response_model=AppointmentOut)
def update_appointment(
    appointment_id: UUID,
    payload: AppointmentBase,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(["admin", "clinician"])),
):
    appointment = db.get(Appointment, appointment_id)
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")

    patient = db.get(Patient, payload.patient_id)
    if not patient:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Patient does not exist")

    data = payload.model_dump()
    if not data.get("clinician"):
        data["clinician"] = user.username

    for key, value in data.items():
        setattr(appointment, key, value)

    db.commit()
    db.refresh(appointment)
    return appointment


@router.delete("/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_appointment(
    appointment_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(["admin", "clinician"])),
):
    appointment = db.get(Appointment, appointment_id)
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")

    db.delete(appointment)
    db.commit()
    return None
