import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";

import { getPatients, createPatient, deletePatient, updatePatient } from "../api/patients";
import { Panel } from "../components/Panel";
import { PatientForm } from "../components/PatientForm";
import type {
  PatientCreatePayload,
  PatientListItem,
  PatientUpdatePayload,
} from "../types/medflow";

type PatientEditFormData = PatientUpdatePayload & {
  firstName: string;
  lastName: string;
  primaryCondition: string;
  careStatus: string;
};

export const PatientsPage = () => {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<PatientEditFormData | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    let ignore = false;

    getPatients(query)
      .then((response) => {
        if (!ignore) {
          setPatients(response);
        }
      })
      .catch((requestError) => {
        if (!ignore) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load patients."
          );
        }
      });

    return () => {
      ignore = true;
    };
  }, [query]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setQuery(search.trim());
  };

  const handleCreatePatient = async (data: PatientCreatePayload) => {
    setIsCreating(true);
    setError("");
    try {
      await createPatient(data);
      setShowForm(false);
      setSearch("");
      setQuery("");
      setPatients(await getPatients(""));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create patient.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditPatient = async (
    patientId: string,
    data: PatientUpdatePayload
  ) => {
    setIsEditing(true);
    setError("");
    try {
      await updatePatient(patientId, data);
      setEditingId(null);
      setEditingData(null);
      setPatients(await getPatients(query));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update patient.");
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeletePatient = async (patientId: string) => {
    if (!confirm("Are you sure you want to delete this patient?")) {
      return;
    }
    setError("");
    try {
      await deletePatient(patientId);
      setPatients(patients.filter((p) => p.id !== patientId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete patient.");
    }
  };

  return (
    <div className="page-stack">
      <Panel subtitle="Search by name or email and review operational risk at a glance." title="Patient List">
        <form className="search-row" onSubmit={handleSearch}>
          <input
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search patients"
            value={search}
          />
          <button className="primary-button" type="submit">
            Search
          </button>
        </form>

        <div className="button-row">
          <button
            className="primary-button"
            type="button"
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setEditingData(null);
            }}
          >
            {showForm ? "Cancel" : "Add New Patient"}
          </button>
        </div>

        {error ? <div className="feedback-panel error compact">{error}</div> : null}

        {showForm && (
          <Panel subtitle="Fill in patient information" title="Create New Patient">
            <PatientForm onSubmit={handleCreatePatient} isLoading={isCreating} />
          </Panel>
        )}

        <div className="patient-grid">
          {patients.map((patient) => (
            <div key={patient.id} className="patient-card">
              <div className="patient-card-head">
                <Link to={`/patients/${patient.id}`}>
                  <strong>
                    {patient.first_name} {patient.last_name}
                  </strong>
                </Link>
                <span className="inline-tag">{patient.care_status.replaceAll("_", " ")}</span>
              </div>
              <p>{patient.primary_condition}</p>
              <div className="patient-meta">
                <span>Doctor: {patient.doctor_name}</span>
                <span>Conditions: {patient.conditions.join(", ") || "None recorded"}</span>
                <span>Missed visits: {patient.missed_appointments}</span>
                <span>Active alerts: {patient.active_alerts}</span>
              </div>
              <div className="button-row">
                <Link to={`/patients/${patient.id}`} className="secondary-button">
                  View
                </Link>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(patient.id);
                    setEditingData({
                      firstName: patient.first_name,
                      lastName: patient.last_name,
                      primaryCondition: patient.primary_condition,
                      careStatus: patient.care_status,
                      phone: patient.phone ?? undefined,
                      email: patient.email ?? undefined,
                    });
                  }}
                >
                  Edit
                </button>
                <button
                  className="danger-button"
                  type="button"
                  onClick={() => handleDeletePatient(patient.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {editingId && editingData && (
        <div
          className="modal-backdrop"
          onClick={() => {
            setEditingId(null);
            setEditingData(null);
          }}
          role="presentation"
        >
          <div
            className="modal-panel"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`Edit ${editingData.firstName} ${editingData.lastName}`}
          >
            <Panel
              subtitle="Update patient details and save changes."
              title={`Edit ${editingData.firstName} ${editingData.lastName}`}
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleEditPatient(editingId, editingData);
                }}
                className="form-stack"
              >
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    value={editingData.firstName}
                    onChange={(e) =>
                      setEditingData({ ...editingData, firstName: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    value={editingData.lastName}
                    onChange={(e) =>
                      setEditingData({ ...editingData, lastName: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Primary Condition</label>
                  <input
                    type="text"
                    value={editingData.primaryCondition}
                    onChange={(e) =>
                      setEditingData({
                        ...editingData,
                        primaryCondition: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Care Status</label>
                  <select
                    value={editingData.careStatus}
                    onChange={(e) =>
                      setEditingData({ ...editingData, careStatus: e.target.value })
                    }
                  >
                    <option value="stable">Stable</option>
                    <option value="improved">Improved</option>
                    <option value="declined">Declined</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      value={editingData.phone || ""}
                      onChange={(e) =>
                        setEditingData({ ...editingData, phone: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={editingData.email || ""}
                      onChange={(e) =>
                        setEditingData({ ...editingData, email: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <input
                    type="text"
                    value={editingData.address || ""}
                    onChange={(e) =>
                      setEditingData({ ...editingData, address: e.target.value })
                    }
                  />
                </div>
                <div className="button-row">
                  <button
                    type="submit"
                    className="primary-button"
                    disabled={isEditing}
                  >
                    {isEditing ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setEditingId(null);
                      setEditingData(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
};
