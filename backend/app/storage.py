# backend/app/storage.py
# Kept for hospital data JSON loading only (analytics & hospital_data routes).
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

DATA_DIR = Path(__file__).resolve().parents[1] / "data"


def _ensure_data_dir() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def _file_path(filename: str) -> Path:
    _ensure_data_dir()
    return DATA_DIR / filename


def load_json(filename: str, default: Any) -> Any:
    """Load JSON from backend/data/<filename>."""
    path = _file_path(filename)

    if not path.exists():
        return default

    try:
        raw = path.read_text(encoding="utf-8").strip()
        if raw == "":
            return default
        return json.loads(raw)
    except Exception:
        return default
