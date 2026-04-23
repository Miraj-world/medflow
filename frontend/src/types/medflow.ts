export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  role: "doctor" | "nurse" | "admin";
  specialization?: string | null;
};

export type DoctorOption = {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  role: "doctor";
  specialization?: string | null;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
};

export type ApiMessageResponse = {
  message: string;
};

export type DashboardOverview = {
  total_patients: number;
  active_doctors: number;
  missed_appointments: number;
  avg_consultation_minutes: string;
  active_alerts: number;
};

export type DoctorLoadItem = {
  id: string;
  doctor_name: string;
  patient_count: number;
};

export type ConditionBreakdownItem = {
  condition: string;
  total: number;
};

export type MissedTrendItem = {
  month: string;
  missed: number;
  total: number;
};

export type AlertItem = {
  id: string;
  patient_id: string;
  patientName: string;
  type: string;
  message: string;
  created_at: string;
  resolved: boolean;
};

export type HighRiskPatient = {
  id: string;
  patientName: string;
  primary_condition: string;
  missed_count: number;
  alert_count: number;
};

export type DashboardResponse = {
  overview: DashboardOverview;
  doctorLoad: DoctorLoadItem[];
  conditionBreakdown: ConditionBreakdownItem[];
  missedTrend: MissedTrendItem[];
  activeAlerts: AlertItem[];
  highRiskPatients: HighRiskPatient[];
};

export type AnalyticsResponse = {
  overview: DashboardOverview;
  doctorLoad: DoctorLoadItem[];
  conditionBreakdown: ConditionBreakdownItem[];
  missedTrend: MissedTrendItem[];
};

export type PatientListItem = {
  id: string;
  first_name: string;
  last_name: string;
  gender: string;
  date_of_birth: string;
  phone?: string | null;
  email?: string | null;
  primary_condition: string;
  care_status: string;
  doctor_name: string;
  conditions: string[];
  total_appointments: number;
  missed_appointments: number;
  active_alerts: number;
  next_appointment?: string | null;
};

export type PatientMutationResponse = {
  id: string;
  doctor_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  emergency_contact?: string | null;
  primary_condition: string;
  care_status: string;
  notes?: string | null;
  created_at: string;
  updated_at?: string | null;
};

export type PatientCreatePayload = {
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
};

export type PatientUpdatePayload = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  address?: string;
  emergencyContact?: string;
  primaryCondition?: string;
  careStatus?: string;
  notes?: string;
};

export type AppointmentStatus =
  | "scheduled"
  | "completed"
  | "missed"
  | "cancelled";

export type AppointmentItem = {
  id: string;
  patient_id: string;
  provider_id: string;
  appointment_date: string;
  status: AppointmentStatus;
  reason: string;
  notes?: string | null;
  consultation_minutes?: number | null;
  created_at: string;
};

export type AppointmentCreatePayload = {
  patientId: string;
  providerId: string;
  appointmentDate: string;
  reason: string;
  notes?: string;
  consultationMinutes?: number;
};

export type AppointmentStatusUpdatePayload = {
  status: AppointmentStatus;
  consultationMinutes?: number;
};

export type AppointmentUpdatePayload = {
  appointmentDate?: string;
  status?: AppointmentStatus;
  reason?: string;
  notes?: string;
  consultationMinutes?: number;
};

export type PatientTimelineRecord = {
  id: string;
  diagnosis?: string;
  summary?: string;
  treatment_name?: string;
  medication_name?: string;
  status?: string;
  recorded_at?: string;
  appointment_date?: string;
  start_date?: string;
  end_date?: string | null;
  dosage?: string;
  frequency?: string;
  notes?: string | null;
  reason?: string;
  instructions?: string | null;
  consultation_minutes?: number | null;
  conditions?: string[];
};

export type PatientDetailResponse = {
  patient: {
    id: string;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    gender: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    emergency_contact?: string | null;
    primary_condition: string;
    care_status: string;
    notes?: string | null;
    doctor_name: string;
    doctor_email: string;
  };
  appointments: PatientTimelineRecord[];
  medicalRecords: PatientTimelineRecord[];
  treatments: PatientTimelineRecord[];
  prescriptions: PatientTimelineRecord[];
  alerts: AlertItem[];
  aiSummary: {
    summary: string;
    riskLevel: "low" | "medium" | "high";
    recommendation: string;
  };
  noShowPrediction: {
    model: string;
    probability: number;
    riskBand: "low" | "medium" | "high";
    factors: string[];
  };
};
