import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";

import { requestPasswordReset } from "../api/auth";

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    setResetToken("");

    try {
      const response = await requestPasswordReset(email);
      setMessage(response.message);
      if (response.resetToken) {
        setResetToken(response.resetToken);
      }
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to start password reset."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <section className="login-card">
        <div>
          <p className="eyebrow">Forgot password</p>
          <h2>Reset your MedFlow password</h2>
          <p className="muted-copy">
            Enter your email and MedFlow will generate a one-time reset token.
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              value={email}
            />
          </label>

          {error ? <div className="form-error">{error}</div> : null}
          {message ? <div className="form-success">{message}</div> : null}

          {resetToken ? (
            <div className="token-panel">
              <p>Demo reset token</p>
              <code>{resetToken}</code>
              <Link className="primary-button inline-button" to={`/reset-password?token=${resetToken}`}>
                Continue to reset
              </Link>
            </div>
          ) : null}

          <button className="primary-button" disabled={loading} type="submit">
            {loading ? "Generating link..." : "Send reset link"}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/login">Back to sign in</Link>
          <Link to="/register">Create account</Link>
        </div>
      </section>
    </div>
  );
};
