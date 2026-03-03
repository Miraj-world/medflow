import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../api/auth";

import type { ThemeMode } from "../theme";
import { getUserTheme, setUserTheme, applyThemeMode } from "../theme";

type Portal = "clinician" | "admin";

export default function Login() {
  const nav = useNavigate();

  const [portal, setPortal] = useState<Portal>("clinician");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");

  // Start with whatever is stored for guest (defaults to dark via theme.ts)
  const [theme, setTheme] = useState<ThemeMode>(() => getUserTheme(null));

  // On mount: re-sync from localStorage and apply it (prevents "starts in light" mismatch)
  useEffect(() => {
    const stored = getUserTheme(null);
    setTheme(stored);
    applyThemeMode(stored);
  }, []);

  // If theme state changes, apply it
  useEffect(() => {
    applyThemeMode(theme);
  }, [theme]);

  function toggleTheme() {
    // Use the currently stored guest theme to avoid stale state issues
    const current = getUserTheme(null);
    const next: ThemeMode = current === "dark" ? "light" : "dark";

    setTheme(next);
    setUserTheme(null, next); // persists + applies
  }

  const usernameLabel = useMemo(() => {
    return portal === "clinician" ? "Username or Employee ID" : "Username or Admin ID";
  }, [portal]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    try {
      const role = await login(username, password);

      // Copy guest theme preference to this user (account-based)
      setUserTheme(username, theme);

      if (role === "admin") nav("/admin");
      else if (role === "clinician") nav("/clinician");
      else nav("/clinician"); // no patient portal right now
    } catch (err: any) {
      setError(err?.message || "Login failed.");
    }
  }

  function handleForgotPassword(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    window.alert(
      "Password reset is not implemented yet in this prototype.\n\nFor the demo: ask an admin to create/reset the account or register a new one."
    );
  }

  return (
    <div
      className={[
        "min-h-screen flex flex-col font-sans transition-colors duration-300 relative",
        "text-slate-800 dark:text-slate-200",
        "bg-white dark:bg-gradient-to-br dark:from-[#0f172a] dark:via-[#0b1a2e] dark:to-[#081421]",
      ].join(" ")}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="hidden dark:block absolute top-0 right-0 w-[520px] h-[520px] bg-sky-500/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
        <div className="hidden dark:block absolute bottom-0 left-0 w-[520px] h-[520px] bg-sky-500/10 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3" />
        <div className="block dark:hidden absolute inset-0 bg-slate-50" />
      </div>

      <div className="flex-grow flex items-center justify-center px-4 py-12 relative">
        <div
          className={[
            "max-w-md w-full space-y-8 rounded-2xl p-8 transition-colors duration-300",
            "bg-white dark:bg-[#0f1c2e]",
            "border border-slate-200 dark:border-slate-700/60",
            "shadow-xl dark:shadow-2xl",
          ].join(" ")}
        >
          <div className="flex flex-col items-center text-center relative">
            <button
              type="button"
              onClick={toggleTheme}
              className="absolute right-0 top-0 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white"
              aria-label="Toggle theme"
            >
              {/* You asked for it to show the CURRENT mode */}
              {theme === "dark" ? "Dark mode" : "Light mode"}
            </button>

            <div className="bg-sky-500/10 p-3 rounded-full mb-4">
              <span className="material-symbols-outlined text-sky-500 dark:text-sky-400 text-4xl">
                health_and_safety
              </span>
            </div>

            <h2 className="text-slate-900 dark:text-white text-3xl font-bold tracking-tight">
              Welcome back
            </h2>
            <p className="mt-2 text-slate-500 dark:text-slate-300/80 text-sm">
              Please enter your credentials to access the portal.
            </p>
          </div>

          <div className="mt-8">
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => setPortal("clinician")}
                className={[
                  "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm rounded-lg transition-all",
                  portal === "clinician"
                    ? "bg-sky-500 text-white shadow font-semibold"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white font-medium",
                ].join(" ")}
              >
                <span className="material-symbols-outlined text-[20px]">stethoscope</span>
                Clinician
              </button>

              <button
                type="button"
                onClick={() => setPortal("admin")}
                className={[
                  "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm rounded-lg transition-all",
                  portal === "admin"
                    ? "bg-sky-500 text-white shadow font-semibold"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white font-medium",
                ].join(" ")}
              >
                <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
                Administrator
              </button>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-200"
                >
                  {usernameLabel}
                </label>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-slate-400 text-[20px]">
                      person
                    </span>
                  </div>

                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. j.doe@hospital.org"
                    className={[
                      "block w-full pl-10 pr-3 py-3 rounded-xl border text-sm transition-colors",
                      "bg-white text-slate-900 placeholder-slate-400 border-slate-200",
                      "focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500",
                      "dark:bg-[#13263c] dark:text-white dark:placeholder-slate-400/70 dark:border-slate-700",
                      "dark:focus:border-sky-400 dark:focus:ring-sky-400/20",
                    ].join(" ")}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-200"
                  >
                    Password
                  </label>

                  <a
                    className="text-xs font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
                    href="#"
                    onClick={handleForgotPassword}
                  >
                    Forgot Password?
                  </a>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-slate-400 text-[20px]">
                      lock
                    </span>
                  </div>

                  <input
                    id="password"
                    name="password"
                    type={showPw ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={[
                      "block w-full pl-10 pr-10 py-3 rounded-xl border text-sm transition-colors",
                      "bg-white text-slate-900 placeholder-slate-400 border-slate-200",
                      "focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500",
                      "dark:bg-[#13263c] dark:text-white dark:placeholder-slate-400/70 dark:border-slate-700",
                      "dark:focus:border-sky-400 dark:focus:ring-sky-400/20",
                    ].join(" ")}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 dark:hover:text-white"
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPw ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className={[
                    "w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white",
                    "bg-sky-600 hover:bg-sky-700",
                    "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500",
                    "transition-all",
                  ].join(" ")}
                >
                  <span className="material-symbols-outlined text-[20px]">verified_user</span>
                  Secure Login
                </button>
              </div>

              <div className="text-center text-sm text-slate-600 dark:text-slate-300">
                Need an account?{" "}
                <Link
                  className="font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
                  to="/register"
                >
                  Create one
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>

      <footer className="py-8 px-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-transparent relative">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6 opacity-80">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider">
              HIPAA COMPLIANT
            </span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider">
              SOC2 CERTIFIED
            </span>
            <span className="hidden sm:inline text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider">
              AES-256
            </span>
          </div>

          <div className="text-center md:text-right">
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              SOC2 and HIPAA compliant environment.
              <br className="hidden sm:block" />
              Data is encrypted end-to-end.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}