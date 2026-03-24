import uuid

from sqlalchemy import Column, DateTime, Text, Uuid, func

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    username = Column(Text, unique=True, index=True, nullable=False)
    password_hash = Column("password_hash", Text, nullable=False)
    role = Column(Text, nullable=False, default="patient")  # admin, clinician, patient
    theme = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
