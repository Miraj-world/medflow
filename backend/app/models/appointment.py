import uuid

from sqlalchemy import Column, DateTime, ForeignKey, Text, Uuid, func

from app.database import Base


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    patient_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("patients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    clinician = Column(Text, nullable=True)
    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    reason = Column(Text, nullable=True)
    status = Column(Text, default="scheduled", nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
