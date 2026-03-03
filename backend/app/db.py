# backend/app/db.py
import json
from pathlib import Path
from typing import Dict, Any

DB_PATH = Path(__file__).resolve().parent / "users.json"

def load_users() -> Dict[str, Any]:
    if not DB_PATH.exists():
        DB_PATH.write_text("{}", encoding="utf-8")
        return {}
    try:
        return json.loads(DB_PATH.read_text(encoding="utf-8") or "{}")
    except json.JSONDecodeError:
        return {}

def save_users(users: Dict[str, Any]) -> None:
    DB_PATH.write_text(json.dumps(users, indent=2), encoding="utf-8")

# Persistent store
users: Dict[str, Any] = load_users()