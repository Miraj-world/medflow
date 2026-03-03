# Healthcare Platform

Full-stack healthcare platform built with:

- FastAPI (Python) – Backend API
- React + Vite (TypeScript) – Frontend
- JSON-based persistent user storage
- JWT authentication

---

## Overview

This application provides user registration and login functionality with role-based access (admin, clinician, patient). Passwords are securely hashed before storage, and authentication is handled using JWT tokens.

---

## Quick Start (Windows)

1. Double-click `start.bat`
2. The script will:
   - Create a backend virtual environment (if missing)
   - Install backend dependencies
   - Install frontend dependencies
   - Launch the backend server
   - Launch the frontend development server

Backend:
http://127.0.0.1:8000

Frontend:
http://localhost:5173

---

## Manual Setup (Optional)

If not using `start.bat`, you may run the servers manually.

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

---

## Project Structure

healthcare-platform/
│
├── backend/        FastAPI application  
├── frontend/       React application  
├── start.bat       Automated launcher  
└── README.md  

---

## Authentication and Security

- Passwords are hashed using bcrypt.
- JWT tokens are issued upon successful login.
- Role-based user structure: admin, clinician, patient.
- User data is persisted in backend/app/users.json.

---

## Notes

- Do not include `.venv` or `node_modules` when sharing the project.
- These directories are automatically recreated on startup.