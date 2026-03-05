import json
from datetime import datetime
from pathlib import Path
import uuid

# locate backend/data/notifications.json
NOTIFICATION_FILE = Path(__file__).parent.parent / "data" / "notifications.json"


def load_notifications():
    if not NOTIFICATION_FILE.exists():
        return []

    with open(NOTIFICATION_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def save_notifications(data):
    with open(NOTIFICATION_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def create_notification(title, message):
    notifications = load_notifications()

    new_notification = {
        "id": str(uuid.uuid4()),
        "title": title,
        "message": message,
        "timestamp": datetime.now().isoformat(),
        "read": False
    }

    notifications.append(new_notification)

    save_notifications(notifications)


def mark_all_read():
    notifications = load_notifications()

    for n in notifications:
        n["read"] = True

    save_notifications(notifications)


def get_notifications():
    return load_notifications()