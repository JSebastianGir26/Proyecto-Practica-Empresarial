/**
 * Sesión en el cliente (HU-02). Guarda el JWT devuelto por
 * /api/auth/login/ en localStorage y avisa a los componentes cuando cambia.
 */
import { useSyncExternalStore } from "react";
import type { Role } from "@/types";

export interface LoginResponse {
  access: string;
  refresh: string;
  role: Role;
  email: string;
  full_name?: string;
}

export interface Session {
  role: Role;
  email: string;
  fullName: string;
}

const ACCESS_KEY = "access_token";
const REFRESH_KEY = "refresh_token";
const ROLE_KEY = "user_role";
const EMAIL_KEY = "user_email";
const NAME_KEY = "user_name";
const CHANGE_EVENT = "practiya:session";

function notify() {
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function saveSession(data: LoginResponse) {
  localStorage.setItem(ACCESS_KEY, data.access);
  localStorage.setItem(REFRESH_KEY, data.refresh);
  localStorage.setItem(ROLE_KEY, data.role);
  localStorage.setItem(EMAIL_KEY, data.email);
  localStorage.setItem(NAME_KEY, data.full_name ?? "");
  notify();
}

export function saveTokens(access: string, refresh?: string) {
  localStorage.setItem(ACCESS_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
}

export function updateSessionName(fullName: string) {
  localStorage.setItem(NAME_KEY, fullName);
  notify();
}

export function clearSession() {
  [ACCESS_KEY, REFRESH_KEY, ROLE_KEY, EMAIL_KEY, NAME_KEY].forEach((k) => localStorage.removeItem(k));
  notify();
}

export function getAccessToken(): string | null {
  return typeof window === "undefined" ? null : localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return typeof window === "undefined" ? null : localStorage.getItem(REFRESH_KEY);
}

export function getRole(): Role | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ROLE_KEY) as Role | null;
}

export function homePathForRole(role: string | null): string {
  if (role === "EMPRESA") return "/panel";
  if (role === "ADMIN") return "/moderacion";
  return "/inicio";
}

// --- Hook para leer la sesión desde un componente -------------------------

let cachedKey = "";
let cachedSession: Session | null = null;

function readSession(): Session | null {
  const token = localStorage.getItem(ACCESS_KEY);
  const role = localStorage.getItem(ROLE_KEY) as Role | null;
  const email = localStorage.getItem(EMAIL_KEY) ?? "";
  const fullName = localStorage.getItem(NAME_KEY) ?? "";
  const key = `${token ? 1 : 0}|${role}|${email}|${fullName}`;
  if (key !== cachedKey) {
    cachedKey = key;
    cachedSession = token && role ? { role, email, fullName } : null;
  }
  return cachedSession;
}

function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

/**
 * Devuelve `undefined` mientras no se sabe (render en el servidor), `null`
 * si no hay sesión, o la sesión.
 */
export function useSession(): Session | null | undefined {
  return useSyncExternalStore(subscribe, readSession, () => undefined);
}
