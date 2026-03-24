import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getHospitalAnalytics, type HospitalAnalytics } from "../api/analytics";

const CHART_COLORS = ["#0284c7", "#16a34a", "#d97706", "#dc2626", "#7c3aed"];

export default function HospitalAnalyticsPanel() {
  const [analytics, setAnalytics] = useState<HospitalAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const data = await getHospitalAnalytics();
        if (mounted) setAnalytics(data);
      } catch (err: any) {
        if (mounted) setError(err?.message || "Failed to load hospital analytics");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const outcomeData = useMemo(() => {
    const distribution = analytics?.outcome_distribution || {};
    return Object.entries(distribution).map(([name, value]) => ({ name, value }));
  }, [analytics]);

  const procedureData = useMemo(() => {
    return (analytics?.procedure_cost_analysis || []).slice(0, 6).map((item) => ({
      procedure: item.procedure,
      avgCost: item.average_cost,
      totalCost: item.total_cost,
      count: item.count,
    }));
  }, [analytics]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-sky-900/40">
        <p className="text-slate-700 dark:text-slate-200">Loading hospital analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-300 bg-red-50 p-6 shadow-sm dark:border-red-700 dark:bg-red-950/50">
        <p className="text-red-800 dark:text-red-200">{error}</p>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-sky-900/40">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Hospital Analytics</h2>
        <span className="text-xs text-slate-500 dark:text-slate-400">Source: imported hospital CSV</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Records" value={analytics.total_patients.toString()} />
        <MetricCard label="Avg Length of Stay" value={`${analytics.avg_length_of_stay} days`} />
        <MetricCard label="Readmission Rate" value={`${(analytics.readmission_rate * 100).toFixed(1)}%`} />
        <MetricCard label="Avg Satisfaction" value={`${analytics.avg_satisfaction} / 5`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="h-72 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <p className="mb-3 text-sm font-medium text-slate-600 dark:text-slate-300">Outcome Distribution</p>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={outcomeData} dataKey="value" nameKey="name" outerRadius={90} label>
                {outcomeData.map((entry, idx) => (
                  <Cell key={entry.name} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="h-72 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <p className="mb-3 text-sm font-medium text-slate-600 dark:text-slate-300">Procedure Cost Analysis</p>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={procedureData} margin={{ top: 10, right: 20, left: 0, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="procedure" angle={-45} textAnchor="end" interval={0} height={100} tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip
                formatter={(value: number, name: string) => {
                  if (name === "avgCost") return [`$${value.toLocaleString()}`, "Average Cost"];
                  if (name === "totalCost") return [`$${value.toLocaleString()}`, "Total Cost"];
                  return [value, name];
                }}
              />
              <Bar dataKey="avgCost" fill="#0284c7" name="avgCost" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-700">
      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
