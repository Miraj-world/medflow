from fastapi import APIRouter, HTTPException
from .storage import read_data, write_data
from .models import Patient

router = APIRouter()
FILE = "patients.json"


@router.get("/")
def get_patients():
    return read_data(FILE)


@router.post("/")
def add_patient(patient: Patient):
    patients = read_data(FILE)
    patients.append(patient.dict())
    write_data(FILE, patients)
    return {"message": "Patient added"}


@router.get("/{pid}")
def get_patient(pid: str):
    patients = read_data(FILE)
    for p in patients:
        if p.get("id") == pid:
            return p
    raise HTTPException(status_code=404, detail="Not found")


@router.put("/{pid}")
def update_patient(pid: str, data: dict):
    patients = read_data(FILE)
    updated = False
    for p in patients:
        if p.get("id") == pid:
            p.update(data)
            updated = True
    if not updated:
        raise HTTPException(status_code=404, detail="Not found")
    write_data(FILE, patients)
    return {"message": "Updated"}
