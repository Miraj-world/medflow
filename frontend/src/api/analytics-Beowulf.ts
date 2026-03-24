import { http } from "./http";

export type ProcedureCostMetric = {
  procedure: string;
  count: number;
  total_cost: number;
  average_cost: number;
};

export type HospitalAnalytics = {
  total_patients: number;
  avg_length_of_stay: number;
  avg_satisfaction: number;
  readmission_rate: number;
  outcome_distribution: Record<string, number>;
  procedure_cost_analysis: ProcedureCostMetric[];
};

export function getHospitalAnalytics() {
  return http.get<HospitalAnalytics>("/analytics/hospital");
}
