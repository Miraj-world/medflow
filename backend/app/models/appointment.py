from sqlalchemy import Column, String, Text
from app.database import Base


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(String, primary_key=True, index=True)
    patient_id = Column(String, nullable=False, index=True)
    clinician = Column(String, nullable=True)
    scheduled_at = Column(String, nullable=False)
    reason = Column(String, nullable=True)
    status = Column(String, default="scheduled", nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(String, nullable=False)
