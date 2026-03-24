from __future__ import annotations

from typing import Any, Dict, Iterable

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.utils.security import decode_token
from app.database import get_db
from app.models.user import User

security = HTTPBearer()


def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Validates JWT and returns the full user record from DB."""
    token = creds.credentials
    payload = decode_token(token)

    username = payload.get("sub")
    if not username:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    db_user = db.query(User).filter(User.username == username).first()
    if not db_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    return {"id": db_user.id, "username": db_user.username, "role": db_user.role, "theme": db_user.theme}


def require_roles(allowed: Iterable[str]):
    """Usage: user = Depends(require_roles(["admin","clinician"]))"""
    allowed_set = set(allowed)

    def _dep(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
        role = (user or {}).get("role")
        if role not in allowed_set:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return user

    return _dep