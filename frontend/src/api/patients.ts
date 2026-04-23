import { fetchJson } from "./client";
import type {
  ApiMessageResponse,
  AppointmentCreatePayload,
  AppointmentItem,
  AppointmentStatusUpdatePayload,
  AppointmentUpdatePayload,
  PatientCreatePayload,
  PatientDetailResponse,
  PatientListItem,
  PatientMutationResponse,
  PatientUpdatePayload,
} from "../types/medflow";

export const getPatients = (search = "") =>
  fetchJson<PatientListItem[]>(`/patients${search ? `?search=${encodeURIComponent(search)}` : ""}`);

export const getPatientDetail = (patientId: string) =>
  fetchJson<PatientDetailResponse>(`/patients/${patientId}`);

export const createPatient = (data: PatientCreatePayload) =>
  fetchJson<PatientMutationResponse>("/patients", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updatePatient = (patientId: string, data: PatientUpdatePayload) =>
  fetchJson<PatientMutationResponse>(`/patients/${patientId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const deletePatient = (patientId: string) =>
  fetchJson<ApiMessageResponse>(`/patients/${patientId}`, {
    method: "DELETE",
  });

export const createAppointment = (data: AppointmentCreatePayload) =>
  fetchJson<AppointmentItem>("/appointments", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateAppointmentStatus = (
  appointmentId: string,
  data: AppointmentStatusUpdatePayload
) =>
  fetchJson<AppointmentItem>(`/appointments/${appointmentId}/status`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const updateAppointment = (
  appointmentId: string,
  data: AppointmentUpdatePayload
) =>
  fetchJson<AppointmentItem>(`/appointments/${appointmentId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const deleteAppointment = (appointmentId: string) =>
  fetchJson<ApiMessageResponse>(`/appointments/${appointmentId}`, {
    method: "DELETE",
  });

export const getAppointments = (patientId: string) =>
  fetchJson<AppointmentItem[]>(`/appointments/patient/${patientId}`);
