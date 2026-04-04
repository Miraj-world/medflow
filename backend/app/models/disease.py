from sqlalchemy import Column, ForeignKey, Integer, Table, Text, Uuid
from sqlalchemy.orm import relationship

from app.database import Base

patient_diseases = Table(
    "patient_diseases",
    Base.metadata,
    Column(
        "patient_id",
        Uuid(as_uuid=True),
        ForeignKey("patients.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "disease_id",
        Integer,
        ForeignKey("diseases.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class Disease(Base):
    __tablename__ = "diseases"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(Text, unique=True, index=True, nullable=False)

    patients = relationship("Patient", secondary=patient_diseases, back_populates="diseases")
