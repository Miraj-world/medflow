# Backend – Healthcare Platform

## Overview

This is the backend API for the Healthcare Platform. It is built using FastAPI and provides authentication, user management, and protected route functionality.

The backend handles password hashing, JWT token generation, and persistent user storage.

---

## Technology Stack

- Python 3.10+
- FastAPI
- Uvicorn
- bcrypt (password hashing)
- JWT authentication
- JSON file persistence

---

## Running the Backend

From inside the `backend` directory:

python -m venv .venv  
.venv\Scripts\activate  
pip install -r requirements.txt  
uvicorn app.main:app --reload --port 8000  

The API runs at:

http://127.0.0.1:8000

Interactive API documentation is available at:

http://127.0.0.1:8000/docs

---

## API Endpoints

GET /health  
POST /auth/login  
POST /auth/register  
GET /me  

---

## Authentication

- Passwords are hashed using bcrypt before being stored.
- JWT tokens are issued upon successful login.
- Role-based user structure: admin, clinician, patient.
- Tokens must be included in the Authorization header for protected routes.

---

## Data Storage

User data is stored in:

backend/app/users.json

This file persists between server restarts.

---

## Project Structure

backend/
│
├── app/
│   ├── main.py
│   ├── auth.py
│   ├── db.py
│   ├── models.py
│   └── users.json
├── requirements.txt
└── README.md

---

## Notes

- The `.venv` directory should not be included when sharing the project.
- The virtual environment is automatically recreated by `start.bat`.