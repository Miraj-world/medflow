import { http } from "./http";

export type Appointment = {
  id: string;
  created_at: string;
  patient_id: string;
  clinician?: string | null;
  scheduled_at: string;
  reason?: string | null;
  status: string;
  notes?: string | null;
};

export function listAppointments() {
  return http.get<Appointment[]>("/appointments");
}

export function createAppointment(a: Omit<Appointment, "id" | "created_at">) {
  return http.post<Appointment>("/appointments", a);
}

export function deleteAppointment(id: string, reason: string) {
  return http.del<void>(`/appointments/${id}`, { reason });
}