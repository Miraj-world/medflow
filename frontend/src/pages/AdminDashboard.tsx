import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import NotificationBell from "../components/NotificationBell";
import HospitalAnalyticsPanel from "../components/HospitalAnalyticsPanel";
import AskMedflowPanel from "../components/AskMedflowPanel";
import { apiFetch } from "../api/client";
import { registerUser } from "../api/auth";

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

type NewUserRole = "admin" | "clinician";

export default function AdminDashboard() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create user form
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<NewUserRole>("clinician");
  const [creatingUser, setCreatingUser] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Admin searches
  const [patientSearch, setPatientSearch] = useState("");
  const [apptSearch, setApptSearch] = useState("");

  // Patient checkbox filters
  const [patientFilters, setPatientFilters] = useState({
    name: true,
    id: false,
    email: false,
    phone: false,
    notes: false,
  });

  // Appointment checkbox filters
  const [apptFilters, setApptFilters] = useState({
    patient: true,
    clinician: false,
    status: false,
    date: true,
    reason: false,
  });

  const patientsById = useMemo(() => {
    const map = new Map<string, Patient>();
    patients.forEach((p) => map.set(p.id, p));
    return map;
  }, [patients]);

  const scheduledCount = useMemo(() => {
    return appointments.filter((a) => (a.status || "").toLowerCase() === "scheduled").length;
  }, [appointments]);

  const filteredPatients = useMemo(() => {
    const q = patientSearch.trim().toLowerCase();

    // Default (no search): show all
    if (!q) return patients;

    return patients.filter((p) => {
      const fields: string[] = [];

      if (patientFilters.id) fields.push(p.id);
      if (patientFilters.name) fields.push(`${p.first_name} ${p.last_name}`);
      if (patientFilters.email) fields.push(p.email ?? "");
      if (patientFilters.phone) fields.push(p.phone ?? "");
      if (patientFilters.notes) fields.push(p.notes ?? "");

      // If somehow none are checked, no match
      if (fields.length === 0) return false;

      const blob = fields.join(" ").toLowerCase();
      return blob.includes(q);
    });
  }, [patients, patientSearch, patientFilters]);

  const filteredAppointments = useMemo(() => {
    const q = apptSearch.trim().toLowerCase();

    // Default (no search): show all appointments
    const base = !q ? appointments : appointments;

    if (!q) return base;

    return base.filter((a) => {
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
      return blob.includes(q);
    });
  }, [appointments, apptSearch, patientsById, apptFilters]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [patientsRes, apptsRes] = await Promise.allSettled([
        apiFetch("/patients/"),
        apiFetch("/appointments/"),
      ]);

      const errors: string[] = [];

      if (patientsRes.status === "fulfilled") {
        setPatients(patientsRes.value as Patient[]);
      } else {
        errors.push(patientsRes.reason?.message || "Failed to load patients");
      }

      if (apptsRes.status === "fulfilled") {
        setAppointments(apptsRes.value as Appointment[]);
      } else {
        errors.push(apptsRes.reason?.message || "Failed to load appointments");
      }

      if (errors.length) {
        setError(errors.join(" | "));
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreateUser() {
    setCreatingUser(true);
    setError("");
    setSuccessMsg("");

    try {
      const u = newUsername.trim().toLowerCase();
      if (!u) throw new Error("Username is required");
      if (newPassword.trim().length < 4) throw new Error("Password must be at least 4 characters");

      await registerUser(u, newPassword, newRole);

      setSuccessMsg(`Created ${newRole} account: ${u}`);
      setNewUsername("");
      setNewPassword("");
      setNewRole("clinician");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to create user";
      setError(msg);
    } finally {
      setCreatingUser(false);
    }
  }

  const canCreateUser = newUsername.trim().length > 0 && newPassword.trim().length >= 4;

  return (
    <Layout title="Admin Dashboard">
      {/* Notification bell row */}
      <div className="mb-3 flex items-center justify-end">
        <NotificationBell />
      </div>

      <div className="space-y-6">
        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-sky-900/40">
            <p className="text-slate-700 dark:text-slate-200">Loading...</p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-300 bg-red-50 p-6 shadow-sm dark:border-red-700 dark:bg-red-950/50">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {!loading && successMsg && (
          <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-6 shadow-sm dark:border-emerald-700 dark:bg-emerald-950/40">
            <p className="text-emerald-900 dark:text-emerald-200">{successMsg}</p>
          </div>
        )}

        {/* Overview */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-sky-900/40">
            <p className="text-sm text-slate-600 dark:text-slate-300">Patients</p>
            <p className="mt-2 text-3xl font-semibold">{patients.length}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-sky-900/40">
            <p className="text-sm text-slate-600 dark:text-slate-300">Appointments</p>
            <p className="mt-2 text-3xl font-semibold">{appointments.length}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-sky-900/40">
            <p className="text-sm text-slate-600 dark:text-slate-300">Scheduled</p>
            <p className="mt-2 text-3xl font-semibold">{scheduledCount}</p>
          </div>
        </div>

        <HospitalAnalyticsPanel />

        <AskMedflowPanel />

        {/* Create account */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-sky-900/40">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">Create Staff Account</h2>

            <button
              className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-sky-800"
              onClick={load}
              type="button"
            >
              Refresh Data
            </button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <input
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-sky-950"
              placeholder="Username (email or id)"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
            />

            <input
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-sky-950"
              placeholder="Password (min 4 chars)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              type="password"
            />

            <select
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-sky-950"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as NewUserRole)}
            >
              <option value="clinician">Clinician</option>
              <option value="admin">Admin</option>
            </select>

            <button
              className="rounded-xl bg-sky-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              disabled={!canCreateUser || creatingUser}
              onClick={handleCreateUser}
              type="button"
            >
              {creatingUser ? "Creating..." : "Create Account"}
            </button>
          </div>

          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            This uses the backend registration endpoint. Accounts are stored in the primary database. Admin access can
            also be bootstrapped via <code>ADMIN_USERNAME</code> and <code>ADMIN_PASSWORD</code>.
          </p>
        </div>

        {/* Patients + Search */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-sky-900/40">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">Patients</h2>

            <input
              className="w-full max-w-xs rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-sky-950"
              placeholder="Search patients..."
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
            />
          </div>

          {/* Patients filters */}
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
                  <th className="py-2 pr-4">Diseases</th>
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
                    <td className="py-2 pr-4">
                      {p.diseases && p.diseases.length > 0
                        ? p.diseases.map((d) => d.name).join(", ")
                        : "-"}
                    </td>
                  </tr>
                ))}

                {!loading && filteredPatients.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-3 text-slate-600 dark:text-slate-300">
                      No matching patients.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>

        {/* Appointments + Search */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-sky-900/40">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">Appointments</h2>

            <input
              className="w-full max-w-xs rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-sky-950"
              placeholder="Search appointments..."
              value={apptSearch}
              onChange={(e) => setApptSearch(e.target.value)}
            />
          </div>

          {/* Appointments filters */}
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
                      <td className="py-2 pr-4">{a.scheduled_at}</td>
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

