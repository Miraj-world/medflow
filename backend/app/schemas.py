from datetime import date, datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    role: str
    theme: Optional[str] = None


class RegisterRequest(BaseModel):
    username: str
    password: str
    role: str


class RegisterResponse(BaseModel):
    username: str
    role: str


class MeResponse(BaseModel):
    username: str
    role: str


class PatientBase(BaseModel):
    first_name: str
    last_name: str
    dob: Optional[date] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None


class PatientOut(PatientBase):
    id: UUID
    created_at: datetime


class AppointmentBase(BaseModel):
    patient_id: UUID
    clinician: Optional[str] = None
    scheduled_at: datetime
    reason: Optional[str] = None
    status: str = "scheduled"
    notes: Optional[str] = None


class AppointmentOut(AppointmentBase):
    id: UUID
    created_at: datetime


class NotificationOut(BaseModel):
    id: UUID
    title: str
    message: str
    timestamp: datetime
    read: bool


class ProcedureCostItem(BaseModel):
    procedure: str
    count: int
    total_cost: float
    average_cost: float


class HospitalAnalyticsResponse(BaseModel):
    total_patients: int
    avg_length_of_stay: float
    avg_satisfaction: float
    readmission_rate: float
    outcome_distribution: dict[str, int]
    procedure_cost_analysis: list[ProcedureCostItem]


class UserData(BaseModel):
    id: UUID
    email: str
    created_at: datetime


class RecordData(BaseModel):
    id: UUID
    title: str
    data: dict[str, Any]
    created_at: datetime


class DashboardResponse(BaseModel):
    user_data: UserData
    dashboard_records: list[RecordData]
