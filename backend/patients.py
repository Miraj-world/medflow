from fastapi import APIRouter, HTTPException, Depends
from .storage import read_data, write_data
from .models import Patient
from .security import get_current_user, require_roles
import uuid

router = APIRouter()
FILE = "patients.json"


@router.get("/")
def get_patients(user=Depends(require_roles(["clinician", "admin"]))):
    # filter out any malformed entries without an id
    return [p for p in read_data(FILE) if p.get("id")]


@router.post("/")
def add_patient(patient: Patient, user=Depends(require_roles(["clinician", "admin"]))):
    patients = read_data(FILE)
    patient_dict = patient.dict()
    patient_dict["id"] = str(uuid.uuid4())
    patients.append(patient_dict)
    write_data(FILE, patients)
    return {"message": "Patient added", "id": patient_dict["id"]}


@router.get("/{pid}")
def get_patient(pid: str, user=Depends(require_roles(["clinician", "admin"]))):
    patients = read_data(FILE)
    for p in patients:
        if p.get("id") == pid:
            return p
    raise HTTPException(status_code=404, detail="Not found")


@router.put("/{pid}")
def update_patient(pid: str, patient: Patient, user=Depends(require_roles(["clinician", "admin"]))):
    patients = read_data(FILE)
    updated = False
    for p in patients:
        if p.get("id") == pid:
            new_data = patient.dict(exclude_unset=True)
            # don't allow id change
            new_data.pop("id", None)
            p.update(new_data)
            updated = True
    if not updated:
        raise HTTPException(status_code=404, detail="Not found")
    write_data(FILE, patients)
    return {"message": "Updated"}


@router.delete("/{pid}")
def delete_patient(pid: str, user=Depends(require_roles(["clinician", "admin"]))):
    patients = read_data(FILE)
    filtered = [p for p in patients if p.get("id") != pid]
    if len(filtered) == len(patients):
        raise HTTPException(status_code=404, detail="Not found")
    write_data(FILE, filtered)
    return {"message": "Deleted"}
