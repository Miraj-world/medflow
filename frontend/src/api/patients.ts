import { fetchJson } from "./client";
import type { PatientDetailResponse, PatientListItem } from "../types/medflow";

export const getPatients = (search = "") =>
  fetchJson<PatientListItem[]>(`/patients${search ? `?search=${encodeURIComponent(search)}` : ""}`);

export const getPatientDetail = (patientId: string) =>
  fetchJson<PatientDetailResponse>(`/patients/${patientId}`);

export const createPatient = (data: {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone?: string;
  email?: string;
  address?: string;
  emergencyContact?: string;
  primaryCondition: string;
  careStatus?: string;
  notes?: string;
  conditions?: string[];
  diagnosis: string;
  summary?: string;
  doctorId: string;
}) =>
  fetchJson<any>("/patients", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updatePatient = (patientId: string, data: {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  address?: string;
  emergencyContact?: string;
  primaryCondition?: string;
  careStatus?: string;
  notes?: string;
}) =>
  fetchJson<any>(`/patients/${patientId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const deletePatient = (patientId: string) =>
  fetchJson<any>(`/patients/${patientId}`, {
    method: "DELETE",
  });

export const createAppointment = (data: {
  patientId: string;
  providerId: string;
  appointmentDate: string;
  reason: string;
  notes?: string;
  consultationMinutes?: number;
}) =>
  fetchJson<any>("/appointments", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateAppointmentStatus = (appointmentId: string, data: {
  status: string;
  consultationMinutes?: number;
}) =>
  fetchJson<any>(`/appointments/${appointmentId}/status`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const updateAppointment = (appointmentId: string, data: {
  appointmentDate?: string;
  status?: string;
  reason?: string;
  notes?: string;
  consultationMinutes?: number;
}) =>
  fetchJson<any>(`/appointments/${appointmentId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const deleteAppointment = (appointmentId: string) =>
  fetchJson<any>(`/appointments/${appointmentId}`, {
    method: "DELETE",
  });

export const getAppointments = (patientId: string) =>
  fetchJson<any[]>(`/appointments/patient/${patientId}`);
