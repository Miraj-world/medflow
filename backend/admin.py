from fastapi import APIRouter
from .storage import read_data

router = APIRouter()


@router.get("/metrics")
def metrics():
    patients = read_data("patients.json")
    appts = read_data("appointments.json")

    return {
        "total_patients": len(patients),
        "appointments": len(appts)
    }
