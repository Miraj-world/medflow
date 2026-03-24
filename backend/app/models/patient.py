import uuid

from sqlalchemy import Column, Date, DateTime, Text, Uuid, func

from app.database import Base


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    first_name = Column(Text, nullable=False)
    last_name = Column(Text, nullable=False)
    dob = Column(Date, nullable=True)
    phone = Column(Text, nullable=True)
    email = Column(Text, nullable=True)
    address = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
