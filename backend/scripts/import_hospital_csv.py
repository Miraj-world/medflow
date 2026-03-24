import argparse
import csv
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

from app.data_encryption import encrypt_text
from app.database import Base, SessionLocal, engine
from app.models import Appointment, HospitalAppointment, Notification, Patient


def parse_int(value):
    try:
        return int(str(value).strip())
    except (TypeError, ValueError):
        return None


def parse_float(value):
    try:
        return float(str(value).strip())
    except (TypeError, ValueError):
        return None


def import_hospital_csv(path: Path, reset: bool = False) -> int:
    with SessionLocal() as db:
        if reset:
            db.query(HospitalAppointment).delete()
            db.commit()

        if not reset and db.query(HospitalAppointment).count() > 0:
            return 0

        created = 0
        with path.open("r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                patient_id = str(row.get("Patient_ID", "")).strip()
                condition = str(row.get("Condition", "")).strip()
                procedure = str(row.get("Procedure", "")).strip()

                entry = HospitalAppointment(
                    patient_id_enc=encrypt_text(patient_id or "unknown"),
                    age=parse_int(row.get("Age")),
                    gender=str(row.get("Gender", "")).strip() or None,
                    condition_enc=encrypt_text(condition or "Unknown"),
                    procedure_enc=encrypt_text(procedure or "Unknown"),
                    cost=parse_float(row.get("Cost")),
                    length_of_stay=parse_int(row.get("Length_of_Stay")),
                    readmission=str(row.get("Readmission", "")).strip() or None,
                    outcome=str(row.get("Outcome", "")).strip() or None,
                    satisfaction=parse_int(row.get("Satisfaction")),
                )
                db.add(entry)
                created += 1

        db.commit()
        return created


def seed_dummy_patients(db, count: int = 5) -> None:
    if db.query(Patient).count() > 0:
        return

    base_date = date(1985, 1, 15)
    for i in range(count):
        patient = Patient(
            first_name=f"Demo{i + 1}",
            last_name="Patient",
            dob=base_date.replace(year=base_date.year + i),
            phone=f"555-010{i + 1}",
            email=f"demo{i + 1}@medflow.local",
            address=f"{100 + i} Demo Street",
            notes="Seeded demo patient",
        )
        db.add(patient)

    db.commit()


def seed_dummy_appointments(db, count: int = 5) -> None:
    if db.query(Appointment).count() > 0:
        return

    patients = db.query(Patient).order_by(Patient.created_at.asc()).limit(count).all()
    now = datetime.now(timezone.utc)
    for i, patient in enumerate(patients):
        appointment = Appointment(
            patient_id=patient.id,
            clinician="Dr. Rivera",
            scheduled_at=now + timedelta(days=i + 1),
            reason="Initial consultation",
            status="scheduled",
            notes="Seeded demo appointment",
        )
        db.add(appointment)

    db.commit()


def seed_dummy_notifications(db, count: int = 5) -> None:
    if db.query(Notification).count() > 0:
        return

    now = datetime.now(timezone.utc)
    for i in range(count):
        notification = Notification(
            title=f"Demo Alert {i + 1}",
            message="This is a seeded notification for the demo.",
            timestamp=now - timedelta(hours=i),
            read=False,
        )
        db.add(notification)

    db.commit()


def main():
    parser = argparse.ArgumentParser(description="Import hospital CSV into Postgres")
    parser.add_argument("--csv", required=True, help="Path to hospital data analysis CSV")
    parser.add_argument("--reset", action="store_true", help="Clear hospital_appointments before import")
    args = parser.parse_args()

    path = Path(args.csv).expanduser().resolve()
    if not path.exists():
        raise SystemExit(f"CSV not found: {path}")

    Base.metadata.create_all(bind=engine)

    created = import_hospital_csv(path, reset=args.reset)

    with SessionLocal() as db:
        seed_dummy_patients(db)
        seed_dummy_appointments(db)
        seed_dummy_notifications(db)

    if created:
        print(f"Imported {created} hospital rows.")
    else:
        print("Hospital rows already present; skipped import.")


if __name__ == "__main__":
    main()
