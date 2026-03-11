from sqlalchemy import Column, String, Text
from app.database import Base


class Patient(Base):
    __tablename__ = "patients"

    id = Column(String, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    dob = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    address = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(String, nullable=False)
