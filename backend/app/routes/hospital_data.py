from __future__ import annotations

from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.deps import get_current_user
from app.utils.data_encryption import try_decrypt_text
from app.storage import load_json

router = APIRouter(prefix="/hospital-data", tags=["hospital-data"])


def _require_staff(user: Dict[str, Any]) -> None:
    role = (user or {}).get("role")
    if role not in ("admin", "clinician"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions",
        )


def _load_list(filename: str) -> List[Dict[str, Any]]:
    data = load_json(filename, [])
    return data if isinstance(data, list) else []


@router.get("/patients")
def get_hospital_patients(
    decrypt: bool = Query(default=False),
    user: Dict[str, Any] = Depends(get_current_user),
):
    _require_staff(user)
    rows = _load_list("hospital_patients.json")

    if not decrypt:
        return rows

    decrypted: List[Dict[str, Any]] = []
    for row in rows:
        item = dict(row)
        item["patient_id"] = try_decrypt_text(str(row.get("patient_id", "")))
        decrypted.append(item)

    return decrypted


@router.get("/appointments")
def get_hospital_appointments(
    decrypt: bool = Query(default=False),
    user: Dict[str, Any] = Depends(get_current_user),
):
    _require_staff(user)
    rows = _load_list("hospital_appointments.json")

    if not decrypt:
        return rows

    decrypted: List[Dict[str, Any]] = []
    for row in rows:
        item = dict(row)
        item["patient_id"] = try_decrypt_text(str(row.get("patient_id", "")))
        item["condition"] = try_decrypt_text(str(row.get("condition", "")))
        item["procedure"] = try_decrypt_text(str(row.get("procedure", "")))
        decrypted.append(item)

    return decrypted
