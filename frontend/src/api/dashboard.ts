import { fetchJson } from "./client";
import type { AnalyticsResponse, DashboardResponse } from "../types/medflow";

export const getDashboard = () => fetchJson<DashboardResponse>("/dashboard");
export const getAnalytics = () => fetchJson<AnalyticsResponse>("/analytics");
