from __future__ import annotations

from typing import Any, Dict, List

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_roles
from app.models.disease import Disease

router = APIRouter(prefix="/diseases", tags=["diseases"])

STAFF_ROLES = ("admin", "clinician")


class DiseaseOut(BaseModel):
    id: int
    name: str


@router.get("/", response_model=List[DiseaseOut])
def list_diseases(
    user: Dict[str, Any] = Depends(require_roles(STAFF_ROLES)),
    db: Session = Depends(get_db),
):
    return db.query(Disease).order_by(Disease.name.asc()).all()
