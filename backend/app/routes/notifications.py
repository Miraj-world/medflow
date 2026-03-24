from __future__ import annotations

from typing import Any, Dict
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models.notification import Notification

router = APIRouter(prefix="/notifications", tags=["notifications"])


def _require_staff(user: Dict[str, Any]) -> None:
    role = (user or {}).get("role")
    if role not in ("admin", "clinician"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden",
        )


def _parse_uuid(value: str, field: str) -> UUID:
    try:
        return UUID(value)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=f"Invalid {field}") from exc


def create_notification(
    db: Session,
    *,
    title: str,
    message: str,
    recipient_username: str | None = None,
    recipient_role: str | None = None,
    notification_type: str | None = None,
    entity_type: str | None = None,
    entity_id: str | None = None,
    created_by: str | None = None,
) -> Notification:
    notification = Notification(
        title=title,
        message=message,
        read=False,
        recipient_username=recipient_username,
        recipient_role=recipient_role,
        type=notification_type,
        entity_type=entity_type,
        entity_id=entity_id,
        created_by=created_by,
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


def _serialize_notification(notification: Notification) -> dict:
    return {
        "id": str(notification.id),
        "title": notification.title,
        "message": notification.message,
        "timestamp": notification.timestamp.isoformat() if notification.timestamp else "",
        "read": notification.read,
        "recipient_username": notification.recipient_username,
        "recipient_role": notification.recipient_role,
        "type": notification.type,
        "entity_type": notification.entity_type,
        "entity_id": notification.entity_id,
        "created_by": notification.created_by,
    }


@router.get("")
@router.get("/")
def list_notifications(
    user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_staff(user)

    username = user.get("username")
    role = user.get("role")

    notifications = (
        db.query(Notification)
        .filter(
            (Notification.recipient_username == username)
            | (Notification.recipient_role == role)
            | (
                Notification.recipient_username.is_(None)
                & Notification.recipient_role.is_(None)
            )
        )
        .order_by(Notification.timestamp.desc())
        .all()
    )

    return [_serialize_notification(n) for n in notifications]


@router.post("/mark-all-read")
def mark_notifications_read(
    user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_staff(user)

    username = user.get("username")
    role = user.get("role")

    notifications = (
        db.query(Notification)
        .filter(
            (Notification.recipient_username == username)
            | (Notification.recipient_role == role)
            | (
                Notification.recipient_username.is_(None)
                & Notification.recipient_role.is_(None)
            )
        )
        .all()
    )

    for notification in notifications:
        notification.read = True

    db.commit()
    return {"message": "All notifications marked read"}


@router.post("/{notification_id}/mark-read")
def mark_notification_read(
    notification_id: str,
    user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_staff(user)

    notification_uuid = _parse_uuid(notification_id, "notification_id")
    notification = (
        db.query(Notification)
        .filter(Notification.id == notification_uuid)
        .first()
    )
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    username = user.get("username")
    role = user.get("role")

    allowed = (
        notification.recipient_username == username
        or notification.recipient_role == role
        or (
            notification.recipient_username is None
            and notification.recipient_role is None
        )
    )

    if not allowed:
        raise HTTPException(status_code=403, detail="Forbidden")

    notification.read = True
    db.commit()

    return {"message": "Notification marked read"}