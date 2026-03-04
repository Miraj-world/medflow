from fastapi import APIRouter, Depends
from app.security import require_roles
from app.notifications import get_notifications, mark_all_read

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/")
def list_notifications(user=Depends(require_roles(["clinician", "admin"]))):
    return get_notifications()


@router.post("/mark-all-read")
def mark_notifications_read(user=Depends(require_roles(["clinician", "admin"]))):
    mark_all_read()
    return {"message": "All notifications marked read"}