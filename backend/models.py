from pydantic import BaseModel
from typing import Optional


class User(BaseModel):
    name: str
    email: str
    password: str
    role: str
    license: Optional[str] = None
    organization: Optional[str] = None


class Patient(BaseModel):
    id: str
    name: str
    dob: str
    gender: str
    phone: str
    address: str
    notes: Optional[str] = None


class Appointment(BaseModel):
    id: str
    patient_id: str
    date: str
    time: str
    status: str
