import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
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

  const patientsById = useMemo(() => {
    const map = new Map<string, Patient>();
    patients.forEach((p) => map.set(p.id, p));
    return map;
  }, [patients]);

  const scheduledCount = useMemo(() => {
    return appointments.filter((a) => (a.status || "").toLowerCase() === "scheduled").length;
  }, [appointments]);

  // Keep a bigger pool so searching feels useful, but not huge UI
  const recentPatientsPool = useMemo(() => {
    return [...patients]
      .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
      .slice(0, 50);
  }, [patients]);

  const filteredPatients = useMemo(() => {
    const q = patientSearch.trim().toLowerCase();

    // Default (no search): show 8 most recent
    if (!q) return recentPatientsPool.slice(0, 8);

    return recentPatientsPool.filter((p) => {
      const blob =
        `${p.id} ${p.first_name} ${p.last_name} ${p.email ?? ""} ${p.phone ?? ""}`.toLowerCase();
      return blob.includes(q);
    });
  }, [recentPatientsPool, patientSearch]);

  const recentAppointmentsPool = useMemo(() => {
    return [...appointments]
      .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
      .slice(0, 50);
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    const q = apptSearch.trim().toLowerCase();

    // Default (no search): show 8 most recent appointments
    const base = !q ? recentAppointmentsPool.slice(0, 8) : recentAppointmentsPool;

    if (!q) return base;

    return base.filter((a) => {
      const p = patientsById.get(a.patient_id);
      const patientName = p ? `${p.first_name} ${p.last_name}` : "";
      const blob =
        `${a.id} ${a.patient_id} ${patientName} ${a.scheduled_at} ${a.status} ${a.reason ?? ""} ${
          a.clinician ?? ""
        }`.toLowerCase();
      return blob.includes(q);
    });
  }, [recentAppointmentsPool, apptSearch, patientsById]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [p, a] = await Promise.all([apiFetch("/patients"), apiFetch("/appointments")]);
      setPatients(p as Patient[]);
      setAppointments(a as Appointment[]);
    } catch (e: any) {
      setError(e?.message || "Failed to load admin data");
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
    } catch (e: any) {
      setError(e?.message || "Failed to create user");
    } finally {
      setCreatingUser(false);
    }
  }

  const canCreateUser = newUsername.trim().length > 0 && newPassword.trim().length >= 4;

  return (
    <Layout title="Admin Dashboard">
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
            This uses the backend registration endpoint. Accounts persist in <code>backend/data/users.json</code>.
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

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">DOB</th>
                  <th className="py-2 pr-4">Email</th>
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
                  </tr>
                ))}

                {!loading && filteredPatients.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-3 text-slate-600 dark:text-slate-300">
                      No matching patients.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {!patientSearch.trim() && (
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              Showing the 8 most recent patients. Use search to view more.
            </p>
          )}
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

          {!apptSearch.trim() && (
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              Showing the 8 most recent appointments. Use search to view more.
            </p>
          )}
        </div>
      </div>
    </Layout>
  );
}