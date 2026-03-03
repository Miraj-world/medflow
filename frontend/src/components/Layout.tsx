import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../api/auth";
import { initTheme } from "../theme";

export default function Layout({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const nav = useNavigate();

  function handleLogout() {
    logout();
    // reset to guest theme after logout
    initTheme(null);
    nav("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-sky-950 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-sky-900/40">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold">{title}</h1>

          <button
            className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm
                       hover:bg-slate-100
                       dark:border-slate-600 dark:hover:bg-sky-800"
            onClick={handleLogout}
          >
            Log out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-6">{children}</main>
    </div>
  );
}