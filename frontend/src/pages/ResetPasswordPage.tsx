import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { resetPassword } from "../api/auth";

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const [tokenInput, setTokenInput] = useState(searchParams.get("token") ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const token = useMemo(() => tokenInput.trim(), [tokenInput]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await resetPassword(token, password);
      setMessage(response.message);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to reset password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <section className="login-card">
        <div>
          <p className="eyebrow">Reset password</p>
          <h2>Choose a new password</h2>
          <p className="muted-copy">
            Paste the one-time reset token from the previous step and set a new password.
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Reset token
            <input onChange={(event) => setTokenInput(event.target.value)} value={tokenInput} />
          </label>

          <label>
            New password
            <input
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              value={password}
            />
          </label>

          <label>
            Confirm password
            <input
              minLength={8}
              onChange={(event) => setConfirmPassword(event.target.value)}
              type="password"
              value={confirmPassword}
            />
          </label>

          {error ? <div className="form-error">{error}</div> : null}
          {message ? <div className="form-success">{message}</div> : null}

          <button className="primary-button" disabled={loading || !token} type="submit">
            {loading ? "Updating password..." : "Reset password"}
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
