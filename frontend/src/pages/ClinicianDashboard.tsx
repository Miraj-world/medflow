import { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import type { MultiValue } from "react-select";
import Layout from "../components/Layout";
import NotificationBell from "../components/NotificationBell";
import { apiFetch } from "../api/client";
import AskMedflowPanel from "../components/AskMedflowPanel";

type Patient = {
  id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  dob?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  diseases?: { id: number; name: string }[];
};

type Appointment = {
  id: string;
  created_at: string;
  patient_id: string;
  clinician?: string | null;
  scheduled_at: string;
  reason?: string | null;
  status: string;
  notes?: string | null;
};

type Disease = {
  id: number;
  name: string;
};

type DiseaseOption = {
  value: number;
  label: string;
};

function toDateOnly(isoOrDate: string) {
  if (!isoOrDate) return "";
  return isoOrDate.slice(0, 10);
}

function localDateTimeToIso(localDateTime: string): string | null {
  if (!localDateTime) return null;
  const parsed = new Date(localDateTime);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function formatScheduledAt(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

export default function ClinicianDashboard() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Patient filters
  const [patientQ, setPatientQ] = useState("");
  const [patientFromDate, setPatientFromDate] = useState(""); // YYYY-MM-DD
  const [patientToDate, setPatientToDate] = useState(""); // YYYY-MM-DD

  // Appointment filters
  const [apptQ, setApptQ] = useState("");
  const [apptFromDate, setApptFromDate] = useState(""); // YYYY-MM-DD
  const [apptToDate, setApptToDate] = useState(""); // YYYY-MM-DD

  // Patient search checkbox filters
  const [patientFilters, setPatientFilters] = useState({
    name: true,
    id: false,
    email: false,
    phone: false,
    notes: false,
  });

  // Appointment search checkbox filters
  const [apptFilters, setApptFilters] = useState({
    patient: true,
    clinician: false,
    status: false,
    date: true,
    reason: false,
  });

  // create patient form
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedDiseases, setSelectedDiseases] = useState<DiseaseOption[]>([]);

  // create appointment form
  const [apptPatientId, setApptPatientId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [reason, setReason] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [p, a, d] = await Promise.all([
        apiFetch("/patients"),
        apiFetch("/appointments"),
        apiFetch("/diseases"),
      ]);
      setPatients(p as Patient[]);
      setAppointments(a as Appointment[]);
      setDiseases(d as Disease[]);
    } catch (e: any) {
      setError(e?.message || "Failed to load clinician data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const patientsById = useMemo(() => {
    const m = new Map<string, Patient>();
    patients.forEach((p) => m.set(p.id, p));
    return m;
  }, [patients]);

  const filteredPatients = useMemo(() => {
    const query = patientQ.trim().toLowerCase();
    const from = patientFromDate ? new Date(patientFromDate + "T00:00:00Z").getTime() : null;
    const to = patientToDate ? new Date(patientToDate + "T23:59:59Z").getTime() : null;

    return patients.filter((p) => {
      // text filter (based on checkboxes)
      if (query) {
        const fields: string[] = [];

        if (patientFilters.id) fields.push(p.id);
        if (patientFilters.name) fields.push(`${p.first_name} ${p.last_name}`);
        if (patientFilters.email) fields.push(p.email ?? "");
        if (patientFilters.phone) fields.push(p.phone ?? "");
        if (patientFilters.notes) fields.push(p.notes ?? "");

        if (fields.length === 0) return false;

        const blob = fields.join(" ").toLowerCase();
        if (!blob.includes(query)) return false;
      }

      // created_at date range filter
      if (from || to) {
        const created = p.created_at ? new Date(p.created_at).getTime() : 0;
        if (from && created < from) return false;
        if (to && created > to) return false;
      }

      return true;
    });
  }, [patients, patientQ, patientFromDate, patientToDate, patientFilters]);

  const filteredAppointments = useMemo(() => {
    const query = apptQ.trim().toLowerCase();
    const from = apptFromDate ? new Date(apptFromDate + "T00:00:00Z").getTime() : null;
    const to = apptToDate ? new Date(apptToDate + "T23:59:59Z").getTime() : null;

    return appointments.filter((a) => {
      // text filter (based on checkboxes)
      if (query) {
        const p = patientsById.get(a.patient_id);
        const patientName = p ? `${p.first_name} ${p.last_name}` : "";

        const fields: string[] = [];

        if (apptFilters.patient) fields.push(patientName, a.patient_id);
        if (apptFilters.clinician) fields.push(a.clinician ?? "");
        if (apptFilters.status) fields.push(a.status ?? "");
        if (apptFilters.date) fields.push(a.scheduled_at ?? "");
        if (apptFilters.reason) fields.push(a.reason ?? "", a.notes ?? "");

        if (fields.length === 0) return false;

        const blob = fields.join(" ").toLowerCase();
        if (!blob.includes(query)) return false;
      }

      // date range filter (based on scheduled_at date portion)
      if (from || to) {
        const dateOnly = toDateOnly(a.scheduled_at);
        const ts = dateOnly ? new Date(dateOnly + "T12:00:00Z").getTime() : 0;
        if (from && ts < from) return false;
        if (to && ts > to) return false;
      }

      return true;
    });
  }, [appointments, apptQ, apptFromDate, apptToDate, patientsById, apptFilters]);

  const diseaseOptions = useMemo(
    () =>
      diseases.map((d) => ({
        value: d.id,
        label: d.name,
      })),
    [diseases]
  );

  async function addPatient() {
    setError("");
    try {
      if (!firstName.trim() || !lastName.trim()) {
        throw new Error("First and last name are required");
      }

      await apiFetch("/patients", {
        method: "POST",
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          dob: dob.trim() || null,
          email: email.trim() || null,
          phone: phone.trim() || null,
          disease_ids: selectedDiseases.map((d) => d.value),
        }),
      });

      setFirstName("");
      setLastName("");
      setDob("");
      setEmail("");
      setPhone("");
      setSelectedDiseases([]);

      await load();
    } catch (e: any) {
      setError(e?.message || "Failed to create patient");
    }
  }

  async function addAppointment() {
    setError("");
    try {
      if (!apptPatientId) throw new Error("Select a patient");

      const scheduledAtIso = localDateTimeToIso(scheduledAt);
      if (!scheduledAtIso) throw new Error("Pick a valid scheduled date and time");

      await apiFetch("/appointments", {
        method: "POST",
        body: JSON.stringify({
          patient_id: apptPatientId,
          scheduled_at: scheduledAtIso,
          reason: reason.trim() || null,
        }),
      });

      setScheduledAt("");
      setReason("");
      await load();
    } catch (e: any) {
      setError(e?.message || "Failed to create appointment");
    }
  }

  return (
    <Layout title="Clinician Dashboard">
      {/* Notification bell row */}
      <div className="mb-3 flex items-center justify-end">
        <NotificationBell />
      </div>

      <div className="space-y-6">
        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-sky-900/40">
            Loading...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-300 bg-red-50 p-6 shadow-sm dark:border-red-700 dark:bg-red-950/50">
            {error}
          </div>
        )}

        {/* Create forms */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-sky-900/40">
            <h2 className="text-lg font-semibold">Create Patient</h2>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-sky-950"
                placeholder="First name *"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <input
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-sky-950"
                placeholder="Last name *"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
              <input
                type="date"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-sky-950"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                aria-label="Date of birth"
              />
              <input
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-sky-950"
                placeholder="Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <input
                className="md:col-span-2 rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-sky-950"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <div className="md:col-span-2">
                <Select
                  isMulti
                  options={diseaseOptions}
                  value={selectedDiseases}
                  onChange={(value: MultiValue<DiseaseOption>) =>
                    setSelectedDiseases(value as DiseaseOption[])
                  }
                  placeholder="Select diseases (optional)"
                  className="text-sm"
                  classNamePrefix="react-select"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={addPatient}
              className="mt-4 w-full rounded-xl bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800"
            >
              Add Patient
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-sky-900/40">
            <h2 className="text-lg font-semibold">Create Appointment</h2>

            <div className="mt-4 grid gap-3">
              <select
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-sky-950"
                value={apptPatientId}
                onChange={(e) => setApptPatientId(e.target.value)}
              >
                <option value="">Select patient *</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name} ({p.id.slice(0, 8)})
                  </option>
                ))}
              </select>

              <input
                type="datetime-local"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-sky-950"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                aria-label="Scheduled date and time"
              />

              <input
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-sky-950"
                placeholder="Reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />

              <button
                type="button"
                onClick={addAppointment}
                className="w-full rounded-xl bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800"
              >
                Add Appointment
              </button>

              {patients.length === 0 && (
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Add a patient first to create an appointment.
                </p>
              )}
            </div>
          </div>
        </div>

        <AskMedflowPanel />

        {/* Patients */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-sky-900/40">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">Patients</h2>

            <button
              className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-sky-800"
              onClick={load}
              type="button"
            >
              Refresh
            </button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <input
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-sky-950"
              placeholder="Search patients..."
              value={patientQ}
              onChange={(e) => setPatientQ(e.target.value)}
            />

            <input
              type="date"
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-sky-950"
              value={patientFromDate}
              onChange={(e) => setPatientFromDate(e.target.value)}
            />

            <input
              type="date"
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-sky-950"
              value={patientToDate}
              onChange={(e) => setPatientToDate(e.target.value)}
            />
          </div>

          {/* Patients checkbox filters */}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
            <span className="font-semibold">Filter by:</span>

            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={patientFilters.name}
                onChange={(e) => setPatientFilters((s) => ({ ...s, name: e.target.checked }))}
              />
              Name
            </label>

            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={patientFilters.id}
                onChange={(e) => setPatientFilters((s) => ({ ...s, id: e.target.checked }))}
              />
              ID
            </label>

            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={patientFilters.email}
                onChange={(e) => setPatientFilters((s) => ({ ...s, email: e.target.checked }))}
              />
              Email
            </label>

            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={patientFilters.phone}
                onChange={(e) => setPatientFilters((s) => ({ ...s, phone: e.target.checked }))}
              />
              Phone
            </label>

            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={patientFilters.notes}
                onChange={(e) => setPatientFilters((s) => ({ ...s, notes: e.target.checked }))}
              />
              Notes
            </label>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">DOB</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Phone</th>
                  <th className="py-2 pr-4">Diseases</th>
                  <th className="py-2 pr-4">Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((p) => (
                  <tr key={p.id} className="border-t border-slate-100 dark:border-slate-700">
                    <td className="py-2 pr-4">
                      {p.first_name} {p.last_name}
                      <div className="text-xs text-slate-500 dark:text-slate-400">{p.id}</div>
                    </td>
                    <td className="py-2 pr-4">{p.dob ?? "-"}</td>
                    <td className="py-2 pr-4">{p.email ?? "-"}</td>
                    <td className="py-2 pr-4">{p.phone ?? "-"}</td>
                    <td className="py-2 pr-4">
                      {p.diseases && p.diseases.length > 0
                        ? p.diseases.map((d) => d.name).join(", ")
                        : "-"}
                    </td>
                    <td className="py-2 pr-4">{toDateOnly(p.created_at)}</td>
                  </tr>
                ))}

                {!loading && filteredPatients.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-3 text-slate-600 dark:text-slate-300">
                      No matching patients.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Appointments */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-sky-900/40">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">Appointments</h2>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <input
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-sky-950"
              placeholder="Search appointments..."
              value={apptQ}
              onChange={(e) => setApptQ(e.target.value)}
            />

            <input
              type="date"
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-sky-950"
              value={apptFromDate}
              onChange={(e) => setApptFromDate(e.target.value)}
            />

            <input
              type="date"
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-sky-950"
              value={apptToDate}
              onChange={(e) => setApptToDate(e.target.value)}
            />
          </div>

          {/* Appointments checkbox filters */}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
            <span className="font-semibold">Filter by:</span>

            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={apptFilters.patient}
                onChange={(e) => setApptFilters((s) => ({ ...s, patient: e.target.checked }))}
              />
              Patient
            </label>

            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={apptFilters.clinician}
                onChange={(e) => setApptFilters((s) => ({ ...s, clinician: e.target.checked }))}
              />
              Clinician
            </label>

            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={apptFilters.status}
                onChange={(e) => setApptFilters((s) => ({ ...s, status: e.target.checked }))}
              />
              Status
            </label>

            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={apptFilters.date}
                onChange={(e) => setApptFilters((s) => ({ ...s, date: e.target.checked }))}
              />
              Date
            </label>

            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={apptFilters.reason}
                onChange={(e) => setApptFilters((s) => ({ ...s, reason: e.target.checked }))}
              />
              Reason
            </label>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="py-2 pr-4">Scheduled</th>
                  <th className="py-2 pr-4">Patient</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Reason</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((a) => {
                  const p = patientsById.get(a.patient_id);
                  const patientLabel = p ? `${p.first_name} ${p.last_name}` : a.patient_id;

                  return (
                    <tr key={a.id} className="border-t border-slate-100 dark:border-slate-700">
                      <td className="py-2 pr-4">{formatScheduledAt(a.scheduled_at)}</td>
                      <td className="py-2 pr-4">{patientLabel}</td>
                      <td className="py-2 pr-4">{a.status}</td>
                      <td className="py-2 pr-4">{a.reason ?? "-"}</td>
                    </tr>
                  );
                })}

                {!loading && filteredAppointments.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-3 text-slate-600 dark:text-slate-300">
                      No matching appointments.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
