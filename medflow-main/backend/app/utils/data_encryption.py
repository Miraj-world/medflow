"""
Fernet-based field-level encryption for sensitive medical data.
Reads ENCRYPTION_KEY from environment / .env file.
"""
from __future__ import annotations

import os
from pathlib import Path

from cryptography.fernet import Fernet, InvalidToken

BASE_DIR = Path(__file__).resolve().parents[2]  # backend/
DATA_DIR = BASE_DIR / "data"
KEY_FILE = DATA_DIR / ".medflow_encryption.key"
ENV_PATH = BASE_DIR / ".env"
KEY_NAME = "ENCRYPTION_KEY"

_cached_fernet: Fernet | None = None


def _read_key_from_env_file() -> str | None:
    if not ENV_PATH.exists():
        return None
    for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        row = line.strip()
        if not row or row.startswith("#") or "=" not in row:
            continue
        key, value = row.split("=", 1)
        if key.strip() == KEY_NAME:
            return value.strip().strip('"').strip("'")
    return None


def _load_key() -> bytes | None:
    env_key = os.getenv(KEY_NAME) or _read_key_from_env_file()
    if env_key:
        return env_key.encode("utf-8")

    if KEY_FILE.exists():
        return KEY_FILE.read_bytes().strip()

    # No key available (some platforms use read-only filesystems).
    return None


def _get_fernet() -> Fernet | None:
    global _cached_fernet
    if _cached_fernet is None:
        key = _load_key()
        if not key:
            return None
        _cached_fernet = Fernet(key)
    return _cached_fernet


def encrypt_text(value: str) -> str:
    fernet = _get_fernet()
    if not fernet:
        raise RuntimeError("ENCRYPTION_KEY is not configured")
    return fernet.encrypt(value.encode("utf-8")).decode("utf-8")


def decrypt_text(value: str) -> str:
    fernet = _get_fernet()
    if not fernet:
        raise RuntimeError("ENCRYPTION_KEY is not configured")
    return fernet.decrypt(value.encode("utf-8")).decode("utf-8")


def try_decrypt_text(value: str) -> str:
    try:
        fernet = _get_fernet()
        if not fernet:
            return value
        return fernet.decrypt(value.encode("utf-8")).decode("utf-8")
    except (InvalidToken, ValueError, TypeError):
        return value
