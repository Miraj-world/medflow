import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getHospitalAnalytics, type HospitalAnalytics } from "../api/analytics";

const CHART_COLORS = ["#0284c7", "#16a34a", "#d97706", "#dc2626", "#7c3aed"];

type OutcomeChartItem = {
  name: string;
  value: number;
};

type ProcedureChartItem = {
  procedure: string;
  totalCost: number;
  avgCost: number;
  count: number;
};

function truncateLabel(label: string, maxLength = 22) {
  if (label.length <= maxLength) return label;
  return `${label.slice(0, maxLength)}...`;
}

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
      } catch (err: unknown) {
        if (mounted) {
          const msg = err instanceof Error ? err.message : "Failed to load hospital analytics";
          setError(msg);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const outcomeData = useMemo<OutcomeChartItem[]>(() => {
    const distribution = analytics?.outcome_distribution || {};
    return Object.entries(distribution).map(([name, value]) => ({
      name,
      value: Number(value),
    }));
  }, [analytics]);

  const procedureData = useMemo<ProcedureChartItem[]>(() => {
    return [...(analytics?.procedure_cost_analysis || [])]
      .sort((a, b) => b.total_cost - a.total_cost)
      .slice(0, 5)
      .map((item) => ({
        procedure: truncateLabel(item.procedure),
        totalCost: item.total_cost,
        avgCost: item.average_cost,
        count: item.count,
      }));
  }, [analytics]);

  const totalOutcomes = useMemo(() => {
    return outcomeData.reduce((sum, item) => sum + item.value, 0);
  }, [outcomeData]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-sky-900/40">
        Loading hospital analytics...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-300 bg-red-50 p-6 shadow-sm dark:border-red-700 dark:bg-red-950/50">
        {error}
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-sky-900/40">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Hospital Analytics</h2>
          <p className="text-sm text-slate-500">
            Key outcome, quality, and procedure cost metrics from imported hospital data.
          </p>
        </div>
        <span className="text-xs text-slate-500">Source: imported hospital CSV</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Records" value={analytics.total_patients.toString()} />
        <MetricCard label="Avg Length of Stay" value={`${analytics.avg_length_of_stay} days`} />
        <MetricCard label="Readmission Rate" value={`${(analytics.readmission_rate * 100).toFixed(1)}%`} />
        <MetricCard label="Avg Satisfaction" value={`${analytics.avg_satisfaction} / 5`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* PIE CHART */}
        <div className="h-80 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <p className="mb-1 text-sm font-medium">Outcome Distribution</p>
          <p className="mb-3 text-xs text-slate-500">
            Breakdown of patient outcome categories with counts and percentages.
          </p>

          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={outcomeData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={85}
                label={({ name, value }) => {
                  const percent = totalOutcomes > 0 ? (value / totalOutcomes) * 100 : 0;
                  return `${name}: ${percent.toFixed(1)}%`;
                }}
              >
                {outcomeData.map((entry, idx) => (
                  <Cell key={entry.name} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                ))}
              </Pie>

              <Tooltip />
              <Legend verticalAlign="bottom" height={60} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* BAR CHART */}
        <div className="h-80 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <p className="mb-1 text-sm font-medium">Top Procedures by Total Cost</p>
          <p className="mb-3 text-xs text-slate-500">
            Highest-cost procedures ranked by total spend.
          </p>

          <ResponsiveContainer width="100%" height="100%">
            {procedureData.length <= 1 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                Not enough procedure data to display comparison.
              </div>
            ) : (
              <BarChart data={procedureData} margin={{ top: 10, right: 20, left: 10, bottom: 85 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="procedure"
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                  height={90}
                  tick={{ fontSize: 11 }}
                />
                <YAxis tickFormatter={(value: number) => `$${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, "Total Cost"]} />
                <Bar dataKey="totalCost" fill="#0284c7" radius={[6, 6, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-700">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}