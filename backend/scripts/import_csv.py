from __future__ import annotations

import argparse
import csv
import json
import sys
from pathlib import Path
from typing import Dict, Iterable, Tuple

BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from app.data_encryption import encrypt_text

DATA_DIR = BASE_DIR / "data"

DEFAULT_CSV_CANDIDATES = [
    DATA_DIR / "hospital_data.csv",
    DATA_DIR / "hospital data analysis.csv",
    BASE_DIR / "app" / "data" / "hospital_data.csv",
]

PATIENTS_OUTPUT = DATA_DIR / "hospital_patients.json"
APPOINTMENTS_OUTPUT = DATA_DIR / "hospital_appointments.json"

REQUIRED_COLUMNS = {
    "Patient_ID",
    "Age",
    "Gender",
    "Condition",
    "Procedure",
    "Cost",
    "Length_of_Stay",
    "Readmission",
    "Outcome",
    "Satisfaction",
}


def _pick_csv_path(override: str | None) -> Path:
    if override:
        path = Path(override)
        if not path.is_absolute():
            path = BASE_DIR / path
        return path

    for path in DEFAULT_CSV_CANDIDATES:
        if path.exists():
            return path

    raise FileNotFoundError(
        "Could not find a CSV file. Tried: "
        + ", ".join(str(path) for path in DEFAULT_CSV_CANDIDATES)
    )


def _read_rows(csv_path: Path) -> Iterable[dict[str, str]]:
    with csv_path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        if not reader.fieldnames:
            raise ValueError("CSV has no header row")

        missing = REQUIRED_COLUMNS.difference(reader.fieldnames)
        if missing:
            raise ValueError(
                "CSV is missing required columns: " + ", ".join(sorted(missing))
            )

        for row in reader:
            yield row


def _convert(csv_path: Path) -> Tuple[list[dict], list[dict]]:
    patients_by_source_id: Dict[str, dict] = {}
    encrypted_patient_ids: Dict[str, str] = {}
    appointments: list[dict] = []

    for idx, row in enumerate(_read_rows(csv_path), start=2):
        try:
            source_patient_id = row["Patient_ID"].strip()
            encrypted_patient_id = encrypted_patient_ids.setdefault(
                source_patient_id, encrypt_text(source_patient_id)
            )

            if source_patient_id not in patients_by_source_id:
                patients_by_source_id[source_patient_id] = {
                    "patient_id": encrypted_patient_id,
                    "age": int(row["Age"]),
                    "gender": row["Gender"].strip(),
                }

            appointments.append(
                {
                    "patient_id": encrypted_patient_id,
                    "condition": encrypt_text(row["Condition"].strip()),
                    "procedure": encrypt_text(row["Procedure"].strip()),
                    "cost": float(row["Cost"]),
                    "length_of_stay": int(row["Length_of_Stay"]),
                    "readmission": row["Readmission"].strip(),
                    "outcome": row["Outcome"].strip(),
                    "satisfaction": int(row["Satisfaction"]),
                }
            )
        except Exception as exc:
            raise ValueError(f"Failed to parse CSV row {idx}: {exc}") from exc

    return list(patients_by_source_id.values()), appointments


def _write_json(path: Path, data: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2), encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Import hospital CSV into encrypted JSON datasets."
    )
    parser.add_argument(
        "--csv",
        dest="csv_path",
        default=None,
        help="CSV path (absolute or relative to backend/).",
    )
    parser.add_argument(
        "--patients-out",
        dest="patients_out",
        default=str(PATIENTS_OUTPUT),
        help="Output JSON for patients.",
    )
    parser.add_argument(
        "--appointments-out",
        dest="appointments_out",
        default=str(APPOINTMENTS_OUTPUT),
        help="Output JSON for appointments.",
    )
    args = parser.parse_args()

    csv_path = _pick_csv_path(args.csv_path)
    patients, appointments = _convert(csv_path)

    _write_json(Path(args.patients_out), patients)
    _write_json(Path(args.appointments_out), appointments)

    print(
        "CSV imported successfully | "
        f"source={csv_path} | patients={len(patients)} | appointments={len(appointments)}"
    )


if __name__ == "__main__":
    main()
