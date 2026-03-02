from pydantic import BaseModel
from typing import Optional


class User(BaseModel):
    name: str
    email: str
    password: str
    role: str
    license: Optional[str] = None
    organization: Optional[str] = None
    specialty: Optional[str] = None


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str
    confirm: str
    role: str
    license: Optional[str] = None
    organization: Optional[str] = None
    specialty: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str


class Patient(BaseModel):
    id: Optional[str] = None
    name: str
    dob: str
    gender: str
    phone: str
    address: str
    notes: Optional[str] = None


class Appointment(BaseModel):
    id: Optional[str] = None
    patient_id: str
    date: str
    time: str
    status: str
