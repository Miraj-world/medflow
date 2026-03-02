from fastapi import APIRouter, HTTPException, Depends
from .storage import read_data, write_data
from .models import Appointment
from .security import get_current_user, require_roles
import uuid

router = APIRouter()
FILE = "appointments.json"


@router.get("/")
def get_appointments(user=Depends(require_roles(["clinician", "admin"]))):
    # filter out entries without id
    return [a for a in read_data(FILE) if a.get("id")]


@router.get("/{aid}")
def get_appointment(aid: str, user=Depends(require_roles(["clinician", "admin"]))):
    data = read_data(FILE)
    for a in data:
        if a.get("id") == aid:
            return a
    raise HTTPException(status_code=404, detail="Not found")


@router.post("/")
def add_appointment(appt: Appointment, user=Depends(require_roles(["clinician", "admin"]))):
    data = read_data(FILE)
    appt_dict = appt.dict()
    appt_dict["id"] = str(uuid.uuid4())
    data.append(appt_dict)
    write_data(FILE, data)
    return {"message": "Created", "id": appt_dict["id"]}


@router.put("/{aid}")
def update_appointment(aid: str, appt: Appointment, user=Depends(require_roles(["clinician", "admin"]))):
    data = read_data(FILE)
    updated = False
    for a in data:
        if a.get("id") == aid:
            new_data = appt.dict(exclude_unset=True)
            new_data.pop("id", None)
            a.update(new_data)
            updated = True
    if not updated:
        raise HTTPException(status_code=404, detail="Not found")
    write_data(FILE, data)
    return {"message": "Updated"}


@router.delete("/{aid}")
def delete_appointment(aid: str, user=Depends(require_roles(["clinician", "admin"]))):
    data = read_data(FILE)
    newdata = [a for a in data if a.get("id") != aid]
    write_data(FILE, newdata)
    return {"message": "Deleted"}
