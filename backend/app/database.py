import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()


def _is_railway() -> bool:
    return any(
        os.getenv(key)
        for key in (
            "RAILWAY_ENVIRONMENT",
            "RAILWAY_PROJECT_ID",
            "RAILWAY_SERVICE_NAME",
            "RAILWAY_STATIC_URL",
            "RAILWAY_PUBLIC_DOMAIN",
        )
    )


DATABASE_URL = os.getenv("DATABASE_URL") or os.getenv("DATABASE_PRIVATE_URL")
if not DATABASE_URL:
    if _is_railway():
        raise RuntimeError("DATABASE_URL is required on Railway.")
    # Default to SQLite for local development
    DATABASE_URL = "sqlite:///./medflow.db"

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
