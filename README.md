# Healthcare Platform

Full-stack healthcare platform built with:

- FastAPI (Python) backend API
- React + Vite (TypeScript) frontend
- SQLAlchemy ORM with SQLite (local) or PostgreSQL (production)
- JWT authentication

---

## Overview

This application provides user registration and login functionality with role-based access (admin, clinician, patient). Passwords are securely hashed before storage, and authentication is handled using JWT tokens.

---

## Quick Start (Windows)

1. Double-click `start.bat`
2. The script will:
   - Configure the frontend to use the Railway backend
   - Install frontend dependencies (if missing)
   - Launch the frontend development server

Backend (default):
https://medflow-production-9424.up.railway.app

Frontend:
http://localhost:5173

---

## Local Mode (Backend + Frontend)

Use local mode if you want the API running on your machine.

start.bat local

What this does:
- Creates `backend/.env` from `backend/.env.example` if missing
- Creates a Python venv and installs backend dependencies
- Writes `frontend/.env` with `VITE_API_URL=http://localhost:8000`
- Starts the backend and frontend in separate windows

---

## Manual Setup (Optional)

### Backend

From the `backend` folder:

python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

### Frontend

From the `frontend` folder:

npm install
npm run dev

By default the frontend calls the Railway backend. To use a local backend,
create `frontend/.env` with:

VITE_API_URL=http://localhost:8000

---

## Database Configuration

- Local dev defaults to SQLite with `DATABASE_URL=sqlite:///./medflow.db`.
- Production uses PostgreSQL via Railway or a local Postgres container.
- You can start a local Postgres instance using `docker-compose.yml`.

The active database is controlled by `DATABASE_URL` in `backend/.env`.

---

## Environment Variables

Backend (`backend/.env`):
- `DATABASE_URL` (optional) SQLite by default
- `SECRET_KEY` (required) JWT signing secret
- `ENCRYPTION_KEY` (optional) key for field-level encryption

Frontend (`frontend/.env`):
- `VITE_API_URL` (optional) defaults to Railway API

---

## Encryption

Sensitive fields can be encrypted using Fernet. If `ENCRYPTION_KEY` is not
set, the backend creates a local key at `backend/data/.medflow_encryption.key`
(git-ignored). Some endpoints can optionally decrypt data for staff views.

---

## Deployment Notes

- The backend honors `PORT` and binds to `0.0.0.0` for platforms like Railway.
- Set Railway variables: `DATABASE_URL`, `SECRET_KEY`, and optionally `ENCRYPTION_KEY`.
- The frontend defaults to Railway unless `VITE_API_URL` is set.

---

## Project Structure

healthcare-platform/
|
|-- backend/        FastAPI application
|-- frontend/       React application
|-- start.bat       Automated launcher
`-- README.md

---

## Authentication and Security

- Passwords are hashed using bcrypt.
- JWT tokens are issued upon successful login.
- Role-based user structure: admin, clinician, patient.

---

## Notes

- Do not include `.venv` or `node_modules` when sharing the project.
- These directories are automatically recreated on startup.
