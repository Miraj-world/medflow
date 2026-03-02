from fastapi import APIRouter, Depends
from .storage import read_data
from .security import get_current_user

router = APIRouter()


@router.get("/metrics")
def metrics(user=Depends(get_current_user)):
    patients = read_data("patients.json")
    appts = read_data("appointments.json")

    return {
        "total_patients": len(patients),
        "appointments": len(appts)
    }
