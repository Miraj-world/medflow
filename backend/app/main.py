import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, SessionLocal, engine
from app.models.appointment import Appointment  # noqa: F401
from app.models.patient import Patient  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.disease import Disease  # noqa: F401
from app.utils.security import hash_password

from app.routes.auth import router as auth_router
from app.routes.patients import router as patients_router
from app.routes.appointments import router as appointments_router
from app.routes.admin import router as admin_router
from app.routes.notifications import router as notifications_router
from app.routes.hospital_data import router as hospital_data_router
from app.routes.analytics import router as analytics_router
from app.routes.diseases import router as diseases_router
from app.ai.routes import router as ai_router

DEFAULT_DISEASES = (
    "Asthma",
    "Cancer",
    "Diabetes",
    "Heart Disease",
    "Hypertension",
)

# Create tables if they don't exist (Alembic will take over later)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Healthcare Platform API")

cors_env = os.getenv("CORS_ORIGINS", "").strip()
frontend_url = os.getenv("FRONTEND_URL", "").strip()

cors_origins = [origin.strip() for origin in cors_env.split(",") if origin.strip()]
if frontend_url and frontend_url not in cors_origins:
    cors_origins.append(frontend_url)

if not cors_origins:
    cors_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

if cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


def _seed_admin() -> None:
    username = os.getenv("ADMIN_USERNAME", "").strip().lower()
    password = os.getenv("ADMIN_PASSWORD", "")
    if not username or not password:
        return

    db = SessionLocal()
    try:
        db_user = db.query(User).filter(User.username == username).first()
        if db_user:
            db_user.password_hash = hash_password(password)
            db_user.role = "admin"
            if not db_user.theme:
                db_user.theme = "system"
        else:
            db.add(
                User(
                    username=username,
                    password_hash=hash_password(password),
                    role="admin",
                    theme="system",
                )
            )
        db.commit()
    finally:
        db.close()


def _seed_diseases() -> None:
    db = SessionLocal()
    try:
        existing = db.query(Disease).count()
        if existing:
            return
        db.add_all([Disease(name=name) for name in DEFAULT_DISEASES])
        db.commit()
    finally:
        db.close()


@app.on_event("startup")
def _startup_seed_admin() -> None:
    _seed_admin()
    _seed_diseases()


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
app.include_router(diseases_router)
app.include_router(ai_router)
