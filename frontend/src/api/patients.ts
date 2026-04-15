import { fetchJson } from "./client";
import type { PatientDetailResponse, PatientListItem } from "../types/medflow";

export const getPatients = (search = "") =>
  fetchJson<PatientListItem[]>(`/patients${search ? `?search=${encodeURIComponent(search)}` : ""}`);

export const getPatientDetail = (patientId: string) =>
  fetchJson<PatientDetailResponse>(`/patients/${patientId}`);
