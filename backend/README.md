# Backend – Healthcare Platform

## Overview

This is the backend API for the Healthcare Platform. It is built using **FastAPI** with **SQLAlchemy** for database access.

By default the backend uses **SQLite** for local development — no database installation required. For production, set `DATABASE_URL` to a PostgreSQL connection string.

---

## Quick Start

From inside the `backend/` directory:

```bash
# 1. Create and activate a virtual environment
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS / Linux

# 2. Install dependencies
pip install -r requirements.txt

# 3. Create your environment file
cp .env.example .env

# 4. Run the server
uvicorn app.main:app --reload --port 8000
```

The API runs at **http://127.0.0.1:8000**

Interactive docs: **http://127.0.0.1:8000/docs**

The SQLite database file (`medflow.db`) is created automatically on first run.

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | No | `sqlite:///./medflow.db` | Database connection string |
| `SECRET_KEY` | Yes | — | JWT signing secret |
| `ENCRYPTION_KEY` | No | — | AES key for sensitive data |

> To use **PostgreSQL**, set `DATABASE_URL` and uncomment `psycopg2-binary` in `requirements.txt`.

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/auth/login` | User login |
| `POST` | `/auth/register` | User registration |
| `GET` | `/me` | Current user profile |

---

## Authentication

- Passwords are hashed using bcrypt.
- JWT tokens are issued on login.
- Role-based access: admin, clinician, patient.
- Include tokens in the `Authorization` header for protected routes.

---

## Project Structure

```
backend/
├── app/
│   ├── main.py          # FastAPI app entry point
│   ├── database.py      # SQLAlchemy engine & session
│   ├── models/          # ORM models
│   ├── routes/          # API route modules
│   └── utils/           # Auth, encryption helpers
├── requirements.txt
├── .env.example
└── README.md
```

---

## Notes

- The `.venv` directory should not be committed.
- `medflow.db` is git-ignored and recreated automatically.