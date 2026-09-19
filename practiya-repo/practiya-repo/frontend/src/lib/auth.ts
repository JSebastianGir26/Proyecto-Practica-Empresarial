/**
 * Manejo de sesion en el cliente (T5 · HU-02 login).
 * Guarda el JWT devuelto por /api/auth/login/ y expone helpers para
 * leer el rol y redirigir a la pantalla correcta de cada usuario.
 */
export interface LoginResponse {
  access: string;
  refresh: string;
  role: "ESTUDIANTE" | "EMPRESA" | "ADMIN";
  email: string;
}

const ACCESS_KEY = "access_token";
const REFRESH_KEY = "refresh_token";
const ROLE_KEY = "user_role";

export function saveSession(data: LoginResponse) {
  localStorage.setItem(ACCESS_KEY, data.access);
  localStorage.setItem(REFRESH_KEY, data.refresh);
  localStorage.setItem(ROLE_KEY, data.role);
}

export function clearSession() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(ROLE_KEY);
}

export function getRole(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ROLE_KEY);
}

export function homePathForRole(role: string | null): string {
  if (role === "EMPRESA") return "/panel";
  if (role === "ADMIN") return "/moderacion";
  return "/inicio";
}
