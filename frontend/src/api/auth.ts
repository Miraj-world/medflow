import { apiFetch } from "./client";
import { getUserTheme, setUserTheme, applyThemeMode } from "../theme";

type LoginResponse = {
  access_token: string;
  role: string;
  theme?: "light" | "dark" | "system";
};

export async function login(username: string, password: string) {
  const data = (await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  })) as LoginResponse;

  localStorage.setItem("token", data.access_token);
  localStorage.setItem("role", data.role);

  // store username so theme can be account-based
  localStorage.setItem("username", username);

  // Prefer backend theme if present; otherwise fallback to saved per-user theme.
  const backendMode = data.theme;
  const savedMode = getUserTheme(username);

  const mode = backendMode ?? savedMode ?? "system";

  // If backend sent a theme, persist it into your per-user theme store too
  if (backendMode) {
    setUserTheme(username, backendMode);
  }

  applyThemeMode(mode);

  return data.role;
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("username");
}

export function getRole() {
  return localStorage.getItem("role");
}

export function getUsername() {
  return localStorage.getItem("username");
}

export async function registerUser(username: string, password: string, role: string) {
  return apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, password, role }),
  });
}