/**
 * Cliente HTTP hacia el backend Django. Todas las llamadas a la API pasan
 * por aquí: arma la URL, adjunta el token y lo renueva si venció.
 */
import { clearSession, getAccessToken, getRefreshToken, saveTokens } from "./auth";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

interface ApiOptions extends Omit<RequestInit, "body"> {
  auth?: boolean; // adjunta el access token guardado (por defecto: sí)
  body?: unknown; // objeto (se envía como JSON) o FormData (archivos)
}

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    super(`Error de API (${status})`);
    this.status = status;
    this.body = body;
  }

  /** Código que el backend manda en algunos errores (p. ej. "cv_required"). */
  get code(): string | undefined {
    const body = this.body as { code?: string } | null;
    return body?.code;
  }

  /** Errores por campo: { title: "El título es obligatorio." } */
  fieldErrors(): Record<string, string> {
    const out: Record<string, string> = {};
    if (this.body && typeof this.body === "object") {
      for (const [key, value] of Object.entries(this.body)) {
        const text = firstMessage(value);
        if (text) out[key] = text;
      }
    }
    return out;
  }
}

function firstMessage(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return firstMessage(value[0]);
  if (value && typeof value === "object") return firstMessage(Object.values(value)[0]);
  return undefined;
}

/** Mensaje legible para mostrar al usuario a partir de cualquier error. */
export function errorMessage(err: unknown, fallback = "Algo salió mal. Intenta de nuevo."): string {
  if (err instanceof ApiError) {
    if (err.status === 0) return "No hay conexión con el servidor. Revisa tu internet e intenta de nuevo.";
    if (err.status >= 500) return "El servidor tuvo un problema. Intenta de nuevo en unos minutos.";
    const body = err.body as { detail?: string } | null;
    if (body?.detail) return body.detail;
    return firstMessage(err.body) ?? fallback;
  }
  return fallback;
}

let refreshing: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  // Si varias peticiones vencen a la vez, se renueva una sola vez.
  refreshing ??= fetch(`${API_URL}/auth/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  })
    .then(async (res) => {
      if (!res.ok) return false;
      const data = (await res.json()) as { access: string; refresh?: string };
      saveTokens(data.access, data.refresh);
      return true;
    })
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}, retry = true): Promise<T> {
  const { auth = true, body, ...init } = options;
  const headers = new Headers(init.headers);
  let payload: BodyInit | undefined;

  if (body instanceof FormData) {
    payload = body; // el navegador pone el Content-Type con el boundary
  } else if (body !== undefined) {
    headers.set("Content-Type", "application/json");
    payload = JSON.stringify(body);
  }

  if (auth) {
    const token = getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...init, headers, body: payload });
  } catch {
    throw new ApiError(0, null);
  }

  if (response.status === 401 && auth && retry) {
    if (await refreshAccessToken()) return apiFetch<T>(path, options, false);
    // La sesion vencio: AppShell detecta el cambio y manda a /login.
    clearSession();
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new ApiError(response.status, errorBody);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
