import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { apiFetch } from "../api/client";

interface UserData {
  id: string;
  email: string;
  created_at: string;
}

interface RecordData {
  id: string;
  title: string;
  data: Record<string, unknown>;
  created_at: string;
}

interface DashboardResponse {
  user_data: UserData;
  dashboard_records: RecordData[];
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = (await apiFetch("/dashboard")) as DashboardResponse;
        if (mounted) setData(res);
      } catch (err: any) {
        if (mounted) setError(err?.message || "Failed to load dashboard");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Layout title="Dashboard">
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

        {!loading && data && (
          <>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-sky-900/40">
              <h2 className="text-lg font-semibold">Account</h2>
              <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                <div>Email: {data.user_data.email}</div>
                <div>User ID: {data.user_data.id}</div>
                <div>Created: {new Date(data.user_data.created_at).toLocaleString()}</div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-sky-900/40">
              <h2 className="text-lg font-semibold">Records</h2>

              {data.dashboard_records.length === 0 && (
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                  No records yet.
                </p>
              )}

              {data.dashboard_records.length > 0 && (
                <div className="mt-4 space-y-3">
                  {data.dashboard_records.map((record) => (
                    <div
                      key={record.id}
                      className="rounded-xl border border-slate-200 p-4 text-sm dark:border-slate-700"
                    >
                      <div className="font-semibold">{record.title}</div>
                      <div className="text-slate-500 dark:text-slate-400">
                        {new Date(record.created_at).toLocaleString()}
                      </div>
                      <pre className="mt-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                        {JSON.stringify(record.data, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
