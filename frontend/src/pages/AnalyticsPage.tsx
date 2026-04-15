import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getAnalytics } from "../api/dashboard";
import { Panel } from "../components/Panel";
import type { AnalyticsResponse } from "../types/medflow";

const piePalette = ["#d0742a", "#156f6c", "#9b2c2c", "#23395b", "#5d7a4c", "#7f5539"];

export const AnalyticsPage = () => {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    getAnalytics()
      .then((response) => {
        if (!ignore) {
          setData(response);
        }
      })
      .catch((requestError) => {
        if (!ignore) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load analytics."
          );
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const formatMonth = (value: string) =>
    new Date(value).toLocaleDateString(undefined, { month: "short", year: "2-digit" });

  if (error) {
    return <div className="feedback-panel error">{error}</div>;
  }

  if (!data) {
    return <div className="feedback-panel">Loading analytics...</div>;
  }

  return (
    <div className="page-stack">
      <Panel subtitle="SQL-first analytics computed directly from PostgreSQL tables." title="Population Analytics">
        <div className="analytics-highlight-row">
          <div className="summary-card">
            <strong>{data.overview.total_patients}</strong>
            <span>Patients in active panels</span>
          </div>
          <div className="summary-card">
            <strong>{data.overview.missed_appointments}</strong>
            <span>Missed appointments captured</span>
          </div>
          <div className="summary-card">
            <strong>{Number(data.overview.avg_consultation_minutes).toFixed(1)} min</strong>
            <span>Average consultation time</span>
          </div>
        </div>
      </Panel>

      <section className="two-column-layout">
        <Panel subtitle="Condition distribution from latest medical records." title="Condition Mix">
          <div className="chart-frame">
            <ResponsiveContainer height={280} width="100%">
              <PieChart>
                <Pie
                  data={data.conditionBreakdown}
                  dataKey="total"
                  innerRadius={55}
                  outerRadius={92}
                  nameKey="condition"
                  paddingAngle={3}
                >
                  {data.conditionBreakdown.map((item, index) => (
                    <Cell fill={piePalette[index % piePalette.length]} key={item.condition} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="factor-row">
            {data.conditionBreakdown.map((item, index) => (
              <span className="legend-chip" key={item.condition}>
                <i style={{ backgroundColor: piePalette[index % piePalette.length] }} />
                {item.condition} ({item.total})
              </span>
            ))}
          </div>
        </Panel>

        <Panel subtitle="Trend line used to monitor operational leakage." title="Appointment Reliability">
          <div className="chart-frame">
            <ResponsiveContainer height={280} width="100%">
              <AreaChart data={data.missedTrend}>
                <defs>
                  <linearGradient id="missedFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#9b2c2c" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#9b2c2c" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#d8d0c2" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#304355", fontSize: 12 }}
                  tickFormatter={formatMonth}
                />
                <YAxis tick={{ fill: "#304355", fontSize: 12 }} />
                <Tooltip />
                <Area
                  dataKey="missed"
                  fill="url(#missedFill)"
                  stroke="#9b2c2c"
                  strokeWidth={3}
                  type="monotone"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </section>
    </div>
  );
};
