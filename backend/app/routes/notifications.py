import json
from datetime import datetime
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from app.deps import get_current_user

router = APIRouter(prefix="/notifications", tags=["notifications"])

NOTIFICATION_FILE = Path(__file__).resolve().parents[2] / "data" / "notifications.json"


def _require_staff(user):
    role = (user or {}).get("role")
    if role not in ("admin", "clinician"):
        raise HTTPException(status_code=403, detail="Forbidden")


def _load():
    if not NOTIFICATION_FILE.exists():
        return []
    with open(NOTIFICATION_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def _save(data):
    NOTIFICATION_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(NOTIFICATION_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


@router.get("/")
def list_notifications(user=Depends(get_current_user)):
    _require_staff(user)
    return _load()


@router.post("/mark-all-read")
def mark_notifications_read(user=Depends(get_current_user)):
    _require_staff(user)
    notifications = _load()
    for n in notifications:
        n["read"] = True
    _save(notifications)
    return {"message": "All notifications marked read"}
