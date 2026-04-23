# MedFlow Frontend

React + Vite dashboard for the MedFlow care team experience.

## Local Run

1. Copy `frontend/.env.example` to `frontend/.env`.
2. Set `VITE_API_URL` to your backend API, for example `http://localhost:10000/api`.
3. Run `npm install`.
4. Run `npm run dev`.

## Pages

- **Dashboard** - Overview of patients, alerts, and analytics
- **Patient List** - View, search, create, edit, and delete patients
- **Patient Detail** - View patient details, manage appointments, view medical records and alerts
- **Analytics** - View healthcare analytics and trends

## Features

### Patient Management
- **View Patients**: Browse all patients with search functionality
- **Create Patient**: Add new patients with their information
- **Edit Patient**: Update patient details like name, condition, care status
- **Delete Patient**: Remove patients from the system

### Appointment Management
- **Schedule Appointment**: Create new appointments for patients
- **View Appointments**: See all appointments for a patient
- **Update Status**: Mark appointments as attended or missed
- **Delete Appointment**: Cancel or remove appointments

### Doctor Management
- **View Doctors**: Access list of available doctors
- **Assign Doctors**: Select doctors when creating/managing patients

## Components

- **PatientForm** - Form for creating and editing patients
- **AppointmentForm** - Form for scheduling appointments
- **Panel** - Reusable card component for displaying data
- **AiChatBubble** - AI summary chatbot interface

## API Integration

The frontend communicates with the backend through the following API modules:
- `api/auth.ts` - Authentication and doctor management
- `api/patients.ts` - Patient and appointment CRUD operations
- `api/dashboard.ts` - Dashboard data
- `api/analytics.ts` - Analytics data
- `api/client.ts` - HTTP client with token management

## Type Definitions

All TypeScript types are defined in `types/medflow.ts` for type safety across the application.
