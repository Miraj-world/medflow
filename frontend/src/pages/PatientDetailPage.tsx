import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { getPatientDetail } from "../api/patients";
import { Panel } from "../components/Panel";
import type { PatientDetailResponse } from "../types/medflow";

export const PatientDetailPage = () => {
  const { patientId = "" } = useParams();
  const [data, setData] = useState<PatientDetailResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    getPatientDetail(patientId)
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
              : "Unable to load patient detail."
          );
        }
      });

    return () => {
      ignore = true;
    };
  }, [patientId]);

  if (error) {
    return <div className="feedback-panel error">{error}</div>;
  }

  if (!data) {
    return <div className="feedback-panel">Loading patient profile...</div>;
  }

  return (
    <div className="page-stack">
      <section className="detail-hero">
        <div>
          <p className="eyebrow">Patient detail</p>
          <h1>
            {data.patient.first_name} {data.patient.last_name}
          </h1>
          <p>
            Primary condition: {data.patient.primary_condition} | Assigned doctor:{" "}
            {data.patient.doctor_name}
          </p>
        </div>
        <div className="risk-badge-block">
          <span className={`risk-badge ${data.aiSummary.riskLevel}`}>{data.aiSummary.riskLevel} risk</span>
          <strong>{Math.round(data.noShowPrediction.probability * 100)}%</strong>
          <span>No-show probability</span>
        </div>
      </section>

      <section className="two-column-layout">
        <Panel subtitle="Rule-based patient summary generated from conditions and missed visits." title="AI Summary">
          <div className="summary-card">
            <p>{data.aiSummary.summary}</p>
            <p>{data.aiSummary.recommendation}</p>
          </div>
        </Panel>

        <Panel subtitle="Heuristic baseline model for likely missed appointments." title="Prediction">
          <div className="summary-card">
            <p>Model: {data.noShowPrediction.model}</p>
            <p>Risk band: {data.noShowPrediction.riskBand}</p>
            <div className="factor-row">
              {data.noShowPrediction.factors.map((factor) => (
                <span className="inline-tag" key={factor}>
                  {factor}
                </span>
              ))}
            </div>
          </div>
        </Panel>
      </section>

      <section className="two-column-layout">
        <Panel subtitle="Unresolved alerts linked directly to this patient record." title="Alerts">
          <div className="list-stack">
            {data.alerts.map((alert) => (
              <div className="list-row static" key={alert.id}>
                <div>
                  <strong>{alert.type}</strong>
                  <p>{alert.message}</p>
                </div>
                <span>{new Date(alert.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel subtitle="Latest prescriptions and therapies." title="Treatment Plan">
          <div className="list-stack">
            {data.prescriptions.map((prescription) => (
              <div className="list-row static" key={prescription.id}>
                <div>
                  <strong>{prescription.medication_name}</strong>
                  <p>
                    {prescription.dosage} | {prescription.frequency}
                  </p>
                </div>
                <span>{prescription.status}</span>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="two-column-layout">
        <Panel subtitle="Visit history including missed appointments." title="Appointments">
          <div className="list-stack">
            {data.appointments.map((appointment) => (
              <div className="list-row static" key={appointment.id}>
                <div>
                  <strong>{appointment.reason}</strong>
                  <p>{appointment.notes}</p>
                </div>
                <span>{appointment.status}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel subtitle="Latest diagnoses and clinical snapshots." title="Medical Records">
          <div className="list-stack">
            {data.medicalRecords.map((record) => (
              <div className="list-row static" key={record.id}>
                <div>
                  <strong>{record.diagnosis}</strong>
                  <p>{record.summary}</p>
                </div>
                <span>{record.conditions?.join(", ")}</span>
              </div>
            ))}
          </div>
        </Panel>
      </section>
    </div>
  );
};
