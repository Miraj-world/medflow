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
