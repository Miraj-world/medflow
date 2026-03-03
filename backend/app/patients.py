# backend/app/patients.py
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from .auth import get_current_user  # uses your existing JWT user dependency
from .storage import load_json, save_json

router = APIRouter(prefix="/patients", tags=["patients"])

# ---- Models ----

class PatientIn(BaseModel):
    first_name: str = Field(..., min_length=1)
    last_name: str = Field(..., min_length=1)
    dob: Optional[str] = None  # keep simple for prototype (YYYY-MM-DD)
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None

class PatientOut(PatientIn):
    id: str
    created_at: str

# ---- Helpers ----

def _require_staff(user: Dict[str, Any]) -> None:
    """
    Only allow admin/clinician to access patients endpoints.
    Assumes get_current_user() returns dict with 'role'.
    """
    role = (user or {}).get("role")
    if role not in ("admin", "clinician"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions",
        )

def _load_patients() -> List[Dict[str, Any]]:
    data = load_json("patients.json", [])
    # Ensure it's always a list
    return data if isinstance(data, list) else []

def _save_patients(patients: List[Dict[str, Any]]) -> None:
    save_json("patients.json", patients)

def _now_iso() -> str:
    return datetime.utcnow().replace(microsecond=0).isoformat() + "Z"

# ---- Routes ----

@router.get("/", response_model=List[PatientOut])
def list_patients(user: Dict[str, Any] = Depends(get_current_user)):
    _require_staff(user)
    return _load_patients()

@router.get("/{patient_id}", response_model=PatientOut)
def get_patient(patient_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    _require_staff(user)
    patients = _load_patients()
    for p in patients:
        if p.get("id") == patient_id:
            return p
    raise HTTPException(status_code=404, detail="Patient not found")

@router.post("/", response_model=PatientOut, status_code=201)
def create_patient(payload: PatientIn, user: Dict[str, Any] = Depends(get_current_user)):
    _require_staff(user)
    patients = _load_patients()

    new_patient = payload.model_dump()
    new_patient["id"] = str(uuid4())
    new_patient["created_at"] = _now_iso()

    patients.append(new_patient)
    _save_patients(patients)
    return new_patient

@router.put("/{patient_id}", response_model=PatientOut)
def update_patient(
    patient_id: str,
    payload: PatientIn,
    user: Dict[str, Any] = Depends(get_current_user),
):
    _require_staff(user)
    patients = _load_patients()

    for i, p in enumerate(patients):
        if p.get("id") == patient_id:
            updated = payload.model_dump()
            updated["id"] = patient_id
            updated["created_at"] = p.get("created_at", _now_iso())
            patients[i] = updated
            _save_patients(patients)
            return updated

    raise HTTPException(status_code=404, detail="Patient not found")

@router.delete("/{patient_id}", status_code=204)
def delete_patient(patient_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    _require_staff(user)
    patients = _load_patients()

    new_list = [p for p in patients if p.get("id") != patient_id]
    if len(new_list) == len(patients):
        raise HTTPException(status_code=404, detail="Patient not found")

    _save_patients(new_list)
    return None