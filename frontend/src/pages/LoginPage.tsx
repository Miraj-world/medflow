import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { login } from "../api/auth";

export const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin.lane@medflow.dev");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(email, password);
      navigate("/dashboard", { replace: true });
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to sign in to MedFlow."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <section className="login-hero">
        <p className="eyebrow">Render + PostgreSQL ready</p>
        <h1>MedFlow turns fragmented patient operations into one live clinical canvas.</h1>
        <p>
          Review chronic-risk cohorts, catch missed appointments early, and surface rule-based AI
          summaries before the next visit.
        </p>
        <div className="hero-chip-row">
          <span>AI summaries</span>
          <span>Missed-visit prediction</span>
          <span>DB-driven alerts</span>
        </div>
      </section>

      <section className="login-card">
        <div>
          <p className="eyebrow">Secure access</p>
          <h2>Sign in to the care team dashboard</h2>
          <p className="muted-copy">
            Use one of the seeded MedFlow accounts after running `npm run seed`.
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              autoComplete="username"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="doctor@medflow.dev"
              type="email"
              value={email}
            />
          </label>

          <label>
            Password
            <input
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Seed password"
              type="password"
              value={password}
            />
          </label>

          {error ? <div className="form-error">{error}</div> : null}

          <button className="primary-button" disabled={loading} type="submit">
            {loading ? "Signing in..." : "Open dashboard"}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/register">Create new account</Link>
          <Link to="/forgot-password">Forgot password?</Link>
        </div>

        <div className="login-footnote">
          <span>Demo seed creates 60 patients and multiple staff roles.</span>
        </div>
      </section>
    </div>
  );
};
