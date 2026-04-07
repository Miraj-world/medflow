const API_BASE =
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:8001" : "");

async function requestWithBase(path: string, options: RequestInit, baseUrl: string) {
  const token = localStorage.getItem("token");

  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error("NETWORK_ERROR");
  }

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      if (err?.detail) message = err.detail;
    } catch {
      // Non-JSON error response
    }
    throw new Error(message);
  }

  // No content
  if (res.status === 204) return null;

  // Some endpoints might return empty body
  const text = await res.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  if (!API_BASE) {
    throw new Error("VITE_API_URL is not set for production builds.");
  }

  try {
    return await requestWithBase(path, options, API_BASE);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "NETWORK_ERROR") {
      throw new Error(
        "Failed to reach the API. Check your internet connection, VITE_API_URL, and that the backend is running."
      );
    }
    throw err;
  }
}
