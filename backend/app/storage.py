# backend/app/storage.py
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

# Points to: backend/data/
DATA_DIR = Path(__file__).resolve().parents[1] / "data"


def _ensure_data_dir() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def _file_path(filename: str) -> Path:
    _ensure_data_dir()
    return DATA_DIR / filename


def load_json(filename: str, default: Any) -> Any:
    """
    Load JSON from backend/data/<filename>.
    If file doesn't exist or is empty/invalid, return `default`.
    """
    path = _file_path(filename)

    if not path.exists():
        save_json(filename, default)
        return default

    try:
        raw = path.read_text(encoding="utf-8").strip()
        if raw == "":
            save_json(filename, default)
            return default
        return json.loads(raw)
    except Exception:
        # If JSON is corrupted, reset to default
        save_json(filename, default)
        return default


def save_json(filename: str, data: Any) -> None:
    """
    Save JSON to backend/data/<filename> with pretty formatting.
    """
    path = _file_path(filename)
    path.write_text(json.dumps(data, indent=2), encoding="utf-8")


# Optional: create files if missing
load_json("patients.json", [])
load_json("appointments.json", [])
load_json("hospital_patients.json", [])
load_json("hospital_appointments.json", [])
