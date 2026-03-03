import { http } from "./http";

export type Patient = {
  id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  dob?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
};

export function listPatients() {
  return http.get<Patient[]>("/patients");
}

export function createPatient(p: Omit<Patient, "id" | "created_at">) {
  return http.post<Patient>("/patients", p);
}