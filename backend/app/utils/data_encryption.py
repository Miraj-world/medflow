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


def _load_key() -> bytes:
    env_key = os.getenv(KEY_NAME) or _read_key_from_env_file()
    if env_key:
        return env_key.encode("utf-8")

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if KEY_FILE.exists():
        return KEY_FILE.read_bytes().strip()

    key = Fernet.generate_key()
    KEY_FILE.write_bytes(key)
    return key


def _get_fernet() -> Fernet:
    global _cached_fernet
    if _cached_fernet is None:
        _cached_fernet = Fernet(_load_key())
    return _cached_fernet


def encrypt_text(value: str) -> str:
    return _get_fernet().encrypt(value.encode("utf-8")).decode("utf-8")


def decrypt_text(value: str) -> str:
    return _get_fernet().decrypt(value.encode("utf-8")).decode("utf-8")


def try_decrypt_text(value: str) -> str:
    try:
        return decrypt_text(value)
    except (InvalidToken, ValueError, TypeError):
        return value
