// src/lib/api.ts
export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001";

function getToken(): string | null {
  return localStorage.getItem("auth_token");
}

async function request<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error || `Request failed: ${res.status}`
    );
  }

  return res.json() as Promise<T>;
}

export const api = {
  get: <T = unknown>(path: string) => request<T>(path),
  post: <T = unknown>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T = unknown>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  patch: <T = unknown>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T = unknown>(path: string) =>
    request<T>(path, { method: "DELETE" }),
};
