# MedFlow

Production-ready AI-powered healthcare dashboard built for Render and PostgreSQL.

## Stack

- `backend/`: Node.js + Express API
- `frontend/`: React + Vite dashboard
- PostgreSQL with raw SQL migrations and seed data
- JWT auth with RBAC for `doctor`, `nurse`, and `admin`

## Local Setup

1. Create a root `.env` from `.env.example`.
2. Start PostgreSQL with `docker compose up -d postgres`.
3. In `backend/`, run `npm install`, `npm run migrate`, `npm run seed`, then `npm start`.
4. In `frontend/`, run `npm install` and `npm run dev`.

The backend listens on `http://localhost:10000` and the frontend runs on `http://localhost:5173`.

## Render Deployment

Render services are defined in `render.yaml`:

- `medflow-backend`: Node web service
- `medflow-frontend`: Static site
- `medflow-postgres`: Render PostgreSQL database

Required backend environment variables:

- `DATABASE_URL`
- `JWT_SECRET`
- `OPENAI_API_KEY` optional

Required frontend environment variable:

- `VITE_API_URL`

## Database Workflow

- `npm run migrate`: apply SQL migrations
- `npm run reset-db`: drop and recreate schema, then reapply migrations
- `npm run seed`: create demo staff, 60 realistic patients, appointments, records, prescriptions, treatments, logs, and alerts

## Feature Highlights

- Rule-based AI patient summaries in `backend/src/services/aiSummary.js`
- DB-driven alerts for no-show risk and high cardiovascular risk
- SQL analytics for doctor load, missed appointments, and consultation time
- Heuristic missed-appointment prediction model for patient detail views

## CRUD Operations

The application now supports full CRUD (Create, Read, Update, Delete) operations for:

### Patients
- **Create**: Add new patients with full medical history via the Patient List page
- **Read**: View patient list with search, and detailed patient profiles
- **Update**: Edit patient information (name, contact, condition, care status, etc.)
- **Delete**: Remove patients from the system (with confirmation)

### Appointments
- **Create**: Schedule new appointments for patients
- **Read**: View all appointments for a patient on the Patient Detail page
- **Update**: Mark appointments as attended/missed, or modify appointment details
- **Delete**: Cancel or remove appointments

### Doctors
- **List**: View all available doctors for selection when creating/managing patients and appointments

## User Interface

### Patient List Page
- Search and filter patients
- Quick action buttons to view, edit, or delete patients
- Add new patient form
- Inline edit form for updating patient details

### Patient Detail Page
- View complete patient profile with AI-generated risk summary
- Manage appointments with ability to create, update status, and delete
- View medical records, treatments, prescriptions, and alerts
- Monitor no-show prediction probability
