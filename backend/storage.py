import json
import os

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), 'data'))


def read_data(filename):
    path = os.path.join(BASE_DIR, filename)
    if not os.path.exists(path):
        return []
    with open(path, 'r', encoding='utf-8') as f:
        try:
            return json.load(f)
        except Exception:
            return []


def write_data(filename, data):
    path = os.path.join(BASE_DIR, filename)
    # ensure data directory exists
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
