from __future__ import annotations

import time
from typing import Any, Callable, Dict, Optional

from sqlalchemy.orm import Session

from app.models.patient import Patient
from app.routes.analytics import get_hospital_analytics_payload

CACHE_TTL_SECONDS = 60
_CACHE: Dict[str, Dict[str, Any]] = {}


def _get_cached(key: str, ttl_seconds: int, compute: Callable[[], Any]) -> Any:
    now = time.time()
    cached = _CACHE.get(key)
    if cached:
        age = now - cached["ts"]
        if age < ttl_seconds:
            return cached["value"]

    value = compute()
    _CACHE[key] = {"ts": now, "value": value}
    return value


def get_hospital_analytics(ttl_seconds: int = CACHE_TTL_SECONDS) -> Dict[str, Any]:
    return _get_cached("hospital_analytics", ttl_seconds, get_hospital_analytics_payload)


def get_patient_count(db: Optional[Session]) -> Optional[int]:
    if db is None:
        return None
    return db.query(Patient).count()
