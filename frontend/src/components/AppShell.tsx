import { NavLink, useNavigate } from "react-router-dom";
import type { PropsWithChildren } from "react";

import { clearSession } from "../api/auth";
import type { AuthUser } from "../types/medflow";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/patients", label: "Patient List" },
  { to: "/analytics", label: "Analytics" },
];

export const AppShell = ({
  children,
  user,
}: PropsWithChildren<{ user: AuthUser }>) => {
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <p className="eyebrow">MedFlow</p>
          <h1>Clinical command center</h1>
          <p className="brand-copy">
            Population health, operational signals, and AI-backed patient review in one place.
          </p>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="profile-card">
          <span className="role-pill">{user.role}</span>
          <h2>{user.fullName}</h2>
          <p>{user.email}</p>
          <p>{user.specialization ?? "Care team access"}</p>
          <button
            className="ghost-button"
            onClick={() => {
              clearSession();
              navigate("/login", { replace: true });
            }}
            type="button"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="main-content">{children}</main>
    </div>
  );
};
