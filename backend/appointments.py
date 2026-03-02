from fastapi import APIRouter, HTTPException
from .storage import read_data, write_data
from .models import Appointment

router = APIRouter()
FILE = "appointments.json"


@router.get("/")
def get_appointments():
    return read_data(FILE)


@router.post("/")
def add_appointment(appt: Appointment):
    data = read_data(FILE)
    data.append(appt.dict())
    write_data(FILE, data)
    return {"message": "Created"}


@router.put("/{aid}")
def update_appointment(aid: str, new: dict):
    data = read_data(FILE)
    updated = False
    for a in data:
        if a.get("id") == aid:
            a.update(new)
            updated = True
    if not updated:
        raise HTTPException(status_code=404, detail="Not found")
    write_data(FILE, data)
    return {"message": "Updated"}


@router.delete("/{aid}")
def delete_appointment(aid: str):
    data = read_data(FILE)
    newdata = [a for a in data if a.get("id") != aid]
    write_data(FILE, newdata)
    return {"message": "Deleted"}
