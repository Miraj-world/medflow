import type { ReactElement } from "react";
import { Suspense, lazy, useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AppShell } from "./components/AppShell";
import AiChatBubble from "./components/AiChatBubble";
import { clearSession, getSessionUser, isAuthenticated } from "./api/auth";

const AnalyticsPage = lazy(() =>
  import("./pages/AnalyticsPage").then((module) => ({ default: module.AnalyticsPage }))
);
const DashboardPage = lazy(() =>
  import("./pages/DashboardPage").then((module) => ({ default: module.DashboardPage }))
);
const LoginPage = lazy(() =>
  import("./pages/LoginPage").then((module) => ({ default: module.LoginPage }))
);
const RegisterPage = lazy(() =>
  import("./pages/RegisterPage").then((module) => ({ default: module.RegisterPage }))
);
const ForgotPasswordPage = lazy(() =>
  import("./pages/ForgotPasswordPage").then((module) => ({ default: module.ForgotPasswordPage }))
);
const ResetPasswordPage = lazy(() =>
  import("./pages/ResetPasswordPage").then((module) => ({ default: module.ResetPasswordPage }))
);
const PatientDetailPage = lazy(() =>
  import("./pages/PatientDetailPage").then((module) => ({ default: module.PatientDetailPage }))
);
const PatientsPage = lazy(() =>
  import("./pages/PatientsPage").then((module) => ({ default: module.PatientsPage }))
);

const RequireAuth = ({ children }: { children: ReactElement }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const ProtectedLayout = ({ children }: { children: ReactElement }) => {
  const user = getSessionUser();

  if (!user) {
    clearSession();
    return <Navigate to="/login" replace />;
  }

  return <AppShell user={user}>{children}</AppShell>;
};

const getInitialTheme = () => {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedTheme = window.localStorage.getItem("medflow.theme");
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export default function App() {
  const sessionUser = getSessionUser();
  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("medflow.theme", theme);
  }, [theme]);

  return (
    <>
      <Suspense fallback={<div className="feedback-panel">Loading MedFlow module...</div>}>
        <Routes>
          <Route
            path="/login"
            element={isAuthenticated() ? <Navigate to="/dashboard" replace /> : <LoginPage />}
          />
          <Route
            path="/register"
            element={isAuthenticated() ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
          />
          <Route
            path="/forgot-password"
            element={
              isAuthenticated() ? <Navigate to="/dashboard" replace /> : <ForgotPasswordPage />
            }
          />
          <Route
            path="/reset-password"
            element={
              isAuthenticated() ? <Navigate to="/dashboard" replace /> : <ResetPasswordPage />
            }
          />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <ProtectedLayout>
                  <DashboardPage />
                </ProtectedLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/patients"
            element={
              <RequireAuth>
                <ProtectedLayout>
                  <PatientsPage />
                </ProtectedLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/patients/:patientId"
            element={
              <RequireAuth>
                <ProtectedLayout>
                  <PatientDetailPage />
                </ProtectedLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/analytics"
            element={
              <RequireAuth>
                <ProtectedLayout>
                  <AnalyticsPage />
                </ProtectedLayout>
              </RequireAuth>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>

      <button
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        className="theme-toggle"
        onClick={() => setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"))}
        type="button"
      >
        <span aria-hidden="true" className="theme-toggle-icon">
          {theme === "dark" ? "☀" : "☾"}
        </span>
        <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
      </button>

      <AiChatBubble userName={sessionUser?.fullName} />
    </>
  );
}
