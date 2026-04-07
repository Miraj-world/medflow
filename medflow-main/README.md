# Healthcare Platform

Full-stack healthcare platform built with:

- FastAPI (Python) backend API
- React + Vite (TypeScript) frontend
- SQLAlchemy ORM with SQLite (local) or PostgreSQL (production)
- JWT authentication

---

## Overview

This application provides user registration and login functionality with role-based access (admin, clinician, patient). Passwords are securely hashed before storage, and authentication is handled using JWT tokens.

It also includes a lightweight AI module ("Ask Medflow"), hospital analytics insights, and a structured disease selection system for patients.

---

## Quick Start (Windows)

1. Double-click `start.bat`
2. The script will:
   - Configure the backend for local SQLite
   - Configure the frontend for `http://localhost:8000`
   - Install dependencies (if missing)
   - Launch backend + frontend

Frontend:
http://localhost:5173

---

## Local Mode (Backend + Frontend)

`start.bat` is local-only and uses SQLite + localhost by default.

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

By default the frontend uses `VITE_API_URL`. For local dev, ensure:

VITE_API_URL=http://localhost:8000

---

## Database Configuration

- Local dev defaults to SQLite with `DATABASE_URL=sqlite:///./medflow.db`.
- Production uses PostgreSQL (Render).
- You can start a local Postgres instance using `docker-compose.yml`.

The active database is controlled by `DATABASE_URL` in `backend/.env`.

---

## Environment Variables

Backend (`backend/.env`):
- `DATABASE_URL` (optional) SQLite by default
- `SECRET_KEY` (required) JWT signing secret
- `ENCRYPTION_KEY` (optional) key for field-level encryption

Frontend (`frontend/.env`):
- `VITE_API_URL` (required for production builds)

---

## Encryption

Sensitive fields can be encrypted using Fernet. If `ENCRYPTION_KEY` is not
set, the backend creates a local key at `backend/data/.medflow_encryption.key`
(git-ignored). Some endpoints can optionally decrypt data for staff views.

---

## Deployment Notes (Render)

- Backend start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Backend env vars: `DATABASE_URL`, `SECRET_KEY`, `ENCRYPTION_KEY`, `FRONTEND_URL`
- Frontend env vars: `VITE_API_URL=https://your-backend.onrender.com`

---

## Render Deployment Steps

1. Create a **Render PostgreSQL** database.
2. Create a **Render Web Service** for the backend:
   - Root directory: `backend/`
   - Build command: `pip install -r requirements.txt`
   - Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Set env vars: `DATABASE_URL`, `SECRET_KEY`, `ENCRYPTION_KEY`, `FRONTEND_URL`
3. Create a **Render Static Site** for the frontend (or deploy to Vercel):
   - Root directory: `frontend/`
   - Build command: `npm install && npm run build`
   - Publish directory: `dist`
   - Set env var: `VITE_API_URL=https://your-backend.onrender.com`

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

## AI Module (Ask Medflow)

Staff-only endpoints (admin, clinician):

- `POST /ai/chat`  
  Request: `{"message": "What is the readmission rate?"}`  
  Response: `{"answer": "...", "data": {...}, "intent": "...", "confidence": 0.0}`
- `GET /ai/insights`  
  Response: `{"insights": ["..."]}`
- `GET /ai/recommendations`  
  Response: `{"recommendations": [{"text": "...", "confidence": 0.0, "explanation": "..."}]}`

The AI module reuses existing analytics logic and applies rule-based intent parsing (no heavy LLM dependencies).

---

## Diseases (Many-to-Many)

The backend now supports a `Disease` model and patient ↔ disease assignments.

Endpoints:
- `GET /diseases` (staff-only) returns all diseases.
- `POST /patients` accepts `disease_ids: number[]`.

Example create payload:
```json
{
  "first_name": "Ava",
  "last_name": "Nguyen",
  "dob": "1990-08-12",
  "disease_ids": [1, 3]
}
```

Seeded on startup (if empty): Diabetes, Hypertension, Asthma, Cancer, Heart Disease.

---

## Frontend Notes

The clinician dashboard uses a searchable multi-select (react-select) to pick diseases and sends `disease_ids` to the backend. The admin and clinician patient tables now display selected diseases.

---

## Notes

- Do not include `.venv` or `node_modules` when sharing the project.
- These directories are automatically recreated on startup.
