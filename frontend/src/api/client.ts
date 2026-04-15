const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:10000/api" : "/api");

export const getAuthToken = () => localStorage.getItem("medflow.token");

export const fetchJson = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const headers = new Headers(options.headers ?? {});
  const token = getAuthToken();

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      `Could not reach the MedFlow API at ${API_BASE}. Make sure the backend is running and your local environment is configured.`
    );
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const error = (await response.json()) as { message?: string };
      message = error.message ?? message;
    } catch {
      // Ignore JSON parse errors for non-JSON responses.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
};
