import { fetchJson } from "./client";
import type { AuthSession, AuthUser } from "../types/medflow";

const TOKEN_KEY = "medflow.token";
const USER_KEY = "medflow.user";

export const login = async (email: string, password: string) => {
  const payload = await fetchJson<AuthSession>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  localStorage.setItem(TOKEN_KEY, payload.token);
  localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
  return payload;
};

export const register = async (payload: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: "doctor" | "nurse" | "admin";
  specialization?: string;
}) =>
  fetchJson<AuthUser>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const requestPasswordReset = async (email: string) =>
  fetchJson<{ message: string; resetToken?: string; expiresAt?: string }>(
    "/auth/forgot-password",
    {
      method: "POST",
      body: JSON.stringify({ email }),
    }
  );

export const resetPassword = async (token: string, password: string) =>
  fetchJson<{ message: string }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });

export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getDoctors = () =>
  fetchJson<any[]>("/auth/doctors");

export const isAuthenticated = () => Boolean(localStorage.getItem(TOKEN_KEY));

export const getSessionUser = (): AuthUser | null => {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
};
