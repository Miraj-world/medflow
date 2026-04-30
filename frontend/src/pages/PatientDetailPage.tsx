import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { 
  getPatientDetail, 
  updateAppointmentStatus, 
  deleteAppointment, 
  createAppointment,
  getAppointments 
} from "../api/patients";
import { Panel } from "../components/Panel";
import { AppointmentForm } from "../components/AppointmentForm";
import type {
  AppointmentCreatePayload,
  AppointmentItem,
  AppointmentStatus,
  PatientDetailResponse
} from "../types/medflow";

export const PatientDetailPage = () => {
  const { patientId = "" } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<PatientDetailResponse | null>(null);
  const [error, setError] = useState("");
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [isCreatingAppointment, setIsCreatingAppointment] = useState(false);

  useEffect(() => {
    let ignore = false;

    Promise.all([
      getPatientDetail(patientId),
      getAppointments(patientId)
    ])
      .then(([response, appointmentsList]) => {
        if (!ignore) {
          setData(response);
          setAppointments(appointmentsList);
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

  const handleCreateAppointment = async (appointmentData: AppointmentCreatePayload) => {
    setIsCreatingAppointment(true);
    setError("");
    try {
      await createAppointment(appointmentData);
      setShowAppointmentForm(false);
      // Refresh appointments list
      const updatedAppointments = await getAppointments(patientId);
      setAppointments(updatedAppointments);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create appointment.");
    } finally {
      setIsCreatingAppointment(false);
    }
  };

  const handleUpdateAppointmentStatus = async (
    appointmentId: string,
    status: AppointmentStatus
  ) => {
    setError("");
    try {
      await updateAppointmentStatus(appointmentId, { status });
      const updatedAppointments = await getAppointments(patientId);
      setAppointments(updatedAppointments);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update appointment.");
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    if (!confirm("Are you sure you want to delete this appointment?")) {
      return;
    }
    setError("");
    try {
      await deleteAppointment(appointmentId);
      setAppointments(appointments.filter((a) => a.id !== appointmentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete appointment.");
    }
  };

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
        <Panel subtitle="Database-grounded summary using patient context and cohort risk analytics." title="AI Summary">
          <div className="summary-card">
            <p>{data.aiSummary.summary}</p>
            <p>{data.aiSummary.recommendation}</p>
          </div>
        </Panel>

        <Panel subtitle="Database-driven cohort model for likely missed appointments." title="Prediction">
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
            {data.alerts.length > 0 ? (
              data.alerts.map((alert) => (
                <div className="list-row static" key={alert.id}>
                  <div>
                    <strong>{alert.type}</strong>
                    <p>{alert.message}</p>
                  </div>
                  <span>{new Date(alert.created_at).toLocaleDateString()}</span>
                </div>
              ))
            ) : (
              <p>No active alerts</p>
            )}
          </div>
        </Panel>

        <Panel subtitle="Latest prescriptions and therapies." title="Treatment Plan">
          <div className="list-stack">
            {data.prescriptions.length > 0 ? (
              data.prescriptions.map((prescription) => (
                <div className="list-row static" key={prescription.id}>
                  <div>
                    <strong>{prescription.medication_name}</strong>
                    <p>
                      {prescription.dosage} | {prescription.frequency}
                    </p>
                  </div>
                  <span>{prescription.status}</span>
                </div>
              ))
            ) : (
              <p>No prescriptions recorded</p>
            )}
          </div>
        </Panel>
      </section>

      <section className="two-column-layout">
        <Panel subtitle="Visit history including missed appointments." title="Appointments">
          <div className="button-row">
            <button
              className="primary-button"
              onClick={() => setShowAppointmentForm(!showAppointmentForm)}
            >
              {showAppointmentForm ? "Cancel" : "Schedule New Appointment"}
            </button>
          </div>
          
          {showAppointmentForm && (
            <AppointmentForm 
              patientId={patientId}
              onSubmit={handleCreateAppointment}
              isLoading={isCreatingAppointment}
            />
          )}

          <div className="list-stack">
            {appointments.length > 0 ? (
              appointments.map((appointment) => (
                <div className="list-row" key={appointment.id}>
                  <div>
                    <strong>{appointment.reason}</strong>
                    <p>{appointment.notes || "No notes"}</p>
                    <small>{new Date(appointment.appointment_date).toLocaleString()}</small>
                  </div>
                  <div className="appointment-actions">
                    <span className={`inline-tag ${appointment.status}`}>{appointment.status}</span>
                    {appointment.status === "scheduled" && (
                      <>
                        <button
                          className="secondary-button small"
                          onClick={() => handleUpdateAppointmentStatus(appointment.id, "completed")}
                        >
                          Mark Attended
                        </button>
                        <button
                          className="secondary-button small"
                          onClick={() => handleUpdateAppointmentStatus(appointment.id, "missed")}
                        >
                          Mark Missed
                        </button>
                      </>
                    )}
                    <button
                      className="danger-button small"
                      onClick={() => handleDeleteAppointment(appointment.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p>No appointments scheduled</p>
            )}
          </div>
        </Panel>

        <Panel subtitle="Latest diagnoses and clinical snapshots." title="Medical Records">
          <div className="list-stack">
            {data.medicalRecords.length > 0 ? (
              data.medicalRecords.map((record) => (
                <div className="list-row static" key={record.id}>
                  <div>
                    <strong>{record.diagnosis}</strong>
                    <p>{record.summary}</p>
                  </div>
                  <span>{record.conditions?.join(", ") || "No conditions"}</span>
                </div>
              ))
            ) : (
              <p>No medical records</p>
            )}
          </div>
        </Panel>
      </section>

      <div className="button-row">
        <button className="secondary-button" onClick={() => navigate("/patients")}>
          Back to Patients
        </button>
      </div>
    </div>
  );
};
