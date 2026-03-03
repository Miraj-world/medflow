# backend/app/deps.py
from __future__ import annotations

from typing import Any, Dict, Iterable

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.auth import decode_token
from app.db import users

security = HTTPBearer()


def get_current_user(creds: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """
    Validates JWT and returns the full user record from app.db.users.
    This keeps your current behavior (token must map to a real stored user).
    """
    token = creds.credentials
    payload = decode_token(token)

    username = payload.get("sub")
    if not username or username not in users:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    return users[username]


def require_roles(allowed: Iterable[str]):
    """
    Usage:
      user = Depends(require_roles(["admin","clinician"]))
    """
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