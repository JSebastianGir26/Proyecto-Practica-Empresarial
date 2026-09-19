/**
 * Cliente HTTP hacia el backend Django. Todas las llamadas a la API
 * pasan por aqui para no repetir la URL base ni el manejo de headers
 * en cada formulario (T4, T5 lo consumen para registro/login).
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

interface ApiOptions extends RequestInit {
  auth?: boolean; // si true, adjunta el access token guardado (ver auth.ts)
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (options.auth) {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new ApiError(response.status, errorBody);
  }

  return response.json() as Promise<T>;
}

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    super(`Error de API (${status})`);
    this.status = status;
    this.body = body;
  }
}
