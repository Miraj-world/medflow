import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "../pages/Login";
import Register from "../pages/Register";
import AdminDashboard from "../pages/AdminDashboard";
import ClinicianDashboard from "../pages/ClinicianDashboard";
import PatientDashboard from "../pages/PatientDashboard";
import SessionManager from "./SessionManager";

/* --------------------------
   Helpers
-------------------------- */

function getToken(): string | null {
  return localStorage.getItem("token");
}

function getRole(): string {
  return (localStorage.getItem("role") || "").toLowerCase();
}

function defaultRouteForRole(role: string): string {
  if (role === "admin") return "/admin";
  if (role === "clinician") return "/clinician";
  return "/login";
}

/* --------------------------
   Route Guards
-------------------------- */

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = getToken();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function RequireRole({
  allow,
  children,
}: {
  allow: string[];
  children: React.ReactNode;
}) {
  const token = getToken();
  const role = getRole();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!allow.includes(role)) {
    return <Navigate to={defaultRouteForRole(role)} replace />;
  }

  return <>{children}</>;
}

/* --------------------------
   App
-------------------------- */

export default function App() {
  return (
    <>
      {/* 30-minute inactivity auto logout */}
      <SessionManager />

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Admin only */}
        <Route
          path="/admin"
          element={
            <RequireRole allow={["admin"]}>
              <AdminDashboard />
            </RequireRole>
          }
        />

        {/* Clinician (and optionally admin if you want both) */}
        <Route
          path="/clinician"
          element={
            <RequireRole allow={["clinician", "admin"]}>
              <ClinicianDashboard />
            </RequireRole>
          }
        />

        {/* Protected but not used right now */}
        <Route
          path="/patient"
          element={
            <RequireAuth>
              <PatientDashboard />
            </RequireAuth>
          }
        />

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}