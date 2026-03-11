from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.models import User, Patient, Appointment  # noqa: F401 — registers models with Base

from app.routes.auth import router as auth_router
from app.routes.patients import router as patients_router
from app.routes.appointments import router as appointments_router
from app.routes.admin import router as admin_router
from app.routes.notifications import router as notifications_router
from app.routes.hospital_data import router as hospital_data_router
from app.routes.analytics import router as analytics_router

# Create tables if they don't exist (Alembic will take over later)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Healthcare Platform API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(auth_router)
app.include_router(patients_router)
app.include_router(appointments_router)
app.include_router(admin_router)
app.include_router(notifications_router)
app.include_router(hospital_data_router)
app.include_router(analytics_router)
