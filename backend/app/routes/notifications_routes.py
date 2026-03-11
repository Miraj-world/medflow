from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_db, require_roles
from app.models import Notification, User
from app.schemas import NotificationOut

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/", response_model=list[NotificationOut])
def list_notifications(
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(["admin", "clinician"])),
):
    return db.query(Notification).order_by(Notification.timestamp.desc()).all()


@router.post("/mark-all-read")
def mark_all_read(
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(["admin", "clinician"])),
):
    db.query(Notification).update({Notification.read: True})
    db.commit()
    return {"message": "All notifications marked read"}
