import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";

import { getPatients } from "../api/patients";
import { Panel } from "../components/Panel";
import type { PatientListItem } from "../types/medflow";

export const PatientsPage = () => {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [error, setError] = useState("");

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

        {error ? <div className="feedback-panel error compact">{error}</div> : null}

        <div className="patient-grid">
          {patients.map((patient) => (
            <Link className="patient-card" key={patient.id} to={`/patients/${patient.id}`}>
              <div className="patient-card-head">
                <strong>
                  {patient.first_name} {patient.last_name}
                </strong>
                <span className="inline-tag">{patient.care_status.replaceAll("_", " ")}</span>
              </div>
              <p>{patient.primary_condition}</p>
              <div className="patient-meta">
                <span>Doctor: {patient.doctor_name}</span>
                <span>Conditions: {patient.conditions.join(", ") || "None recorded"}</span>
                <span>Missed visits: {patient.missed_appointments}</span>
                <span>Active alerts: {patient.active_alerts}</span>
              </div>
            </Link>
          ))}
        </div>
      </Panel>
    </div>
  );
};
