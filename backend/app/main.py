import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, SessionLocal, engine
from app.models.appointment import Appointment  # noqa: F401
from app.models.patient import Patient  # noqa: F401
from app.models.user import User  # noqa: F401
from app.utils.security import hash_password

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

cors_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "").split(",")
    if origin.strip()
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


@app.on_event("startup")
def _startup_seed_admin() -> None:
    _seed_admin()


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
