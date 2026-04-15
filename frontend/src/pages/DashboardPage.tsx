import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Link } from "react-router-dom";

import { getDashboard } from "../api/dashboard";
import { Panel } from "../components/Panel";
import { StatCard } from "../components/StatCard";
import type { DashboardResponse } from "../types/medflow";

const chartPalette = ["#d0742a", "#156f6c", "#9b2c2c", "#23395b", "#5d7a4c", "#7f5539"];

export const DashboardPage = () => {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState("");
  const formatMonth = (value: string) =>
    new Date(value).toLocaleDateString(undefined, { month: "short", year: "2-digit" });

  useEffect(() => {
    let ignore = false;

    getDashboard()
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
              : "Unable to load dashboard data."
          );
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  if (error) {
    return <div className="feedback-panel error">{error}</div>;
  }

  if (!data) {
    return <div className="feedback-panel">Loading MedFlow dashboard...</div>;
  }

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Operational snapshot</p>
          <h1>See chronic-care risk before it turns into back-office chaos.</h1>
          <p>
            MedFlow combines patient counts, no-show exposure, and active alerts into a single live
            view for clinical staff.
          </p>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard
          helper="Population currently assigned across the platform"
          label="Patients"
          tone="gold"
          value={String(data.overview.total_patients)}
        />
        <StatCard
          helper="Providers carrying active panels"
          label="Doctors"
          tone="teal"
          value={String(data.overview.active_doctors)}
        />
        <StatCard
          helper="Missed visits captured by SQL aggregation"
          label="Missed Appointments"
          tone="red"
          value={String(data.overview.missed_appointments)}
        />
        <StatCard
          helper="Average minutes for completed consultations"
          label="Avg Consultation"
          tone="ink"
          value={`${Number(data.overview.avg_consultation_minutes).toFixed(1)} min`}
        />
      </section>

      <section className="two-column-layout">
        <Panel subtitle="Patient panel size by doctor" title="Doctor Load">
          <div className="chart-frame">
            <ResponsiveContainer height={260} width="100%">
              <BarChart data={data.doctorLoad}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d8d0c2" />
                <XAxis dataKey="doctor_name" tick={{ fill: "#304355", fontSize: 12 }} />
                <YAxis tick={{ fill: "#304355", fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="patient_count" radius={[10, 10, 0, 0]}>
                  {data.doctorLoad.map((entry, index) => (
                    <Cell fill={chartPalette[index % chartPalette.length]} key={entry.id} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel subtitle="Monthly missed visits across the seeded timeline" title="Missed Visit Trend">
          <div className="chart-frame">
            <ResponsiveContainer height={260} width="100%">
              <LineChart data={data.missedTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d8d0c2" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#304355", fontSize: 12 }}
                  tickFormatter={formatMonth}
                />
                <YAxis tick={{ fill: "#304355", fontSize: 12 }} />
                <Tooltip />
                <Line dataKey="missed" dot={false} stroke="#9b2c2c" strokeWidth={3} type="monotone" />
                <Line dataKey="total" dot={false} stroke="#156f6c" strokeWidth={2} type="monotone" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </section>

      <section className="two-column-layout">
        <Panel subtitle="Patients currently surfacing the most unresolved pressure" title="High Risk Patients">
          <div className="list-stack">
            {data.highRiskPatients.map((patient) => (
              <Link className="list-row" key={patient.id} to={`/patients/${patient.id}`}>
                <div>
                  <strong>{patient.patientName}</strong>
                  <p>{patient.primary_condition}</p>
                </div>
                <div className="row-metrics">
                  <span>{patient.alert_count} alerts</span>
                  <span>{patient.missed_count} missed</span>
                </div>
              </Link>
            ))}
          </div>
        </Panel>

        <Panel subtitle="Auto-generated from appointment and condition rules" title="Active Alerts">
          <div className="list-stack">
            {data.activeAlerts.map((alert) => (
              <div className="list-row static" key={alert.id}>
                <div>
                  <strong>{alert.patientName}</strong>
                  <p>{alert.message}</p>
                </div>
                <span className="inline-tag">{alert.type}</span>
              </div>
            ))}
          </div>
        </Panel>
      </section>
    </div>
  );
};
