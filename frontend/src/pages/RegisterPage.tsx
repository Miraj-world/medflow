import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { register } from "../api/auth";

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "doctor" as "doctor" | "nurse" | "admin",
    specialization: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await register(form);
      setSuccess("Account created successfully. You can sign in now.");
      setTimeout(() => navigate("/login", { replace: true }), 900);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to create account."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <section className="login-card">
        <div>
          <p className="eyebrow">Create account</p>
          <h2>Join the MedFlow care team</h2>
          <p className="muted-copy">
            Doctors and nurses can self-register. Admin accounts still require an existing admin.
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="split-row">
            <label>
              First name
              <input
                onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
                value={form.firstName}
              />
            </label>
            <label>
              Last name
              <input
                onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
                value={form.lastName}
              />
            </label>
          </div>

          <label>
            Email
            <input
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              type="email"
              value={form.email}
            />
          </label>

          <div className="split-row">
            <label>
              Role
              <select
                className="auth-select"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    role: event.target.value as "doctor" | "nurse" | "admin",
                  }))
                }
                value={form.role}
              >
                <option value="doctor">Doctor</option>
                <option value="nurse">Nurse</option>
                <option value="admin">Admin</option>
              </select>
            </label>

            <label>
              Specialization
              <input
                onChange={(event) =>
                  setForm((current) => ({ ...current, specialization: event.target.value }))
                }
                value={form.specialization}
              />
            </label>
          </div>

          <label>
            Password
            <input
              minLength={8}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              type="password"
              value={form.password}
            />
          </label>

          {error ? <div className="form-error">{error}</div> : null}
          {success ? <div className="form-success">{success}</div> : null}

          <button className="primary-button" disabled={loading} type="submit">
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/login">Back to sign in</Link>
          <Link to="/forgot-password">Forgot password?</Link>
        </div>
      </section>
    </div>
  );
};
