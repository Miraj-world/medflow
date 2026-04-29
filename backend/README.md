# MedFlow Backend

Node.js + Express backend for the MedFlow healthcare dashboard.

## Scripts

`npm install` - Install dependencies

`npm run migrate` - Run database migrations

`npm run seed` - Seed database with demo data

`npm start` - Start the server

`npm run reset-db` - Drop and recreate the database schema

## Swagger API Docs

Swagger is available after the backend starts.

1. From [backend](D:\Medflow v3\medflow-main\medflow-main\backend), run `npm start`
2. Open [http://localhost:10000/api-docs](http://localhost:10000/api-docs)
3. For the raw OpenAPI JSON, open [http://localhost:10000/api-docs.json](http://localhost:10000/api-docs.json)
4. Use `POST /auth/login` first, copy the returned JWT token, then click `Authorize` in Swagger and paste `Bearer <your-token>`

This lets you present the available endpoints interactively, including request bodies, auth requirements, and sample responses.

## Required Environment Variables

- `DATABASE_URL`
- `JWT_SECRET`
- `PORT` optional locally, required by Render at runtime
- `FRONTEND_URL` optional for CORS
- `DATABASE_USE_SSL` set to `true` on Render, `false` locally

## API Endpoints

### Authentication
- `POST /auth/login` - Login with email and password
- `POST /auth/register` - Register a new user (doctor, nurse, or admin)
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password with token
- `GET /auth/me` - Get current user profile
- `GET /auth/doctors` - Get list of all doctors

### Patients
- `GET /patients` - List all patients (with optional search)
- `GET /patients/:patientId` - Get patient details
- `GET /patients/:patientId/prediction` - Get no-show prediction for patient
- `POST /patients` - Create a new patient (doctor/admin only)
- `PUT /patients/:patientId` - Update patient information (doctor/admin only)
- `DELETE /patients/:patientId` - Delete a patient (doctor/admin only)

### Appointments
- `POST /appointments` - Create a new appointment (doctor/admin only)
- `GET /appointments/:appointmentId` - Get appointment details
- `GET /appointments/patient/:patientId` - Get all appointments for a patient
- `PUT /appointments/:appointmentId/status` - Update appointment status (mark attended/missed)
- `PUT /appointments/:appointmentId` - Update appointment details (doctor/admin only)
- `DELETE /appointments/:appointmentId` - Delete an appointment (doctor/admin only)

### Dashboard & Analytics
- `GET /dashboard` - Get dashboard overview data
- `GET /analytics` - Get analytics data
- `GET /alerts` - Get active alerts

## CRUD Operations

The API now supports full CRUD operations for:

### Patients
- Create: POST /patients
- Read: GET /patients, GET /patients/:patientId
- Update: PUT /patients/:patientId
- Delete: DELETE /patients/:patientId

### Appointments
- Create: POST /appointments
- Read: GET /appointments/:appointmentId, GET /appointments/patient/:patientId
- Update: PUT /appointments/:appointmentId, PUT /appointments/:appointmentId/status
- Delete: DELETE /appointments/:appointmentId

## Notes

- The API binds to `0.0.0.0` and reads `process.env.PORT`.
- Migrations are raw SQL files stored in `db/migrations/`.
- All routes except login, register, forgot-password, and reset-password require JWT authentication via `Authorization` header.
- Doctors can only manage their own patients and appointments.
- Admins can manage all patients and appointments.
