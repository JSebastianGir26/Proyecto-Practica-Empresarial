import type { ApplicationStatus, VacancyStatus } from "@/types";

const shortDate = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short" });
const longDate = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "long", year: "numeric" });

/** "12 ago" */
export function formatShortDate(iso: string | null | undefined) {
  return iso ? shortDate.format(new Date(iso)).replace(".", "").replace(" de ", " ") : "—";
}

/** "12 de agosto de 2026" */
export function formatLongDate(iso: string | null | undefined) {
  return iso ? longDate.format(new Date(iso)) : "—";
}

/** "Hace 2 horas", "Ayer", "Hace 3 días" */
export function formatRelative(iso: string | null | undefined) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "Hace instantes";
  if (min < 60) return `Hace ${min} min`;
  const horas = Math.round(min / 60);
  if (horas < 24) return `Hace ${horas} ${horas === 1 ? "hora" : "horas"}`;
  const dias = Math.round(horas / 24);
  if (dias === 1) return "Ayer";
  if (dias < 30) return `Hace ${dias} días`;
  return formatLongDate(iso);
}

export function formatFileSize(bytes: number | null | undefined) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function firstName(fullName: string | undefined | null) {
  return (fullName ?? "").trim().split(/\s+/)[0] ?? "";
}

export function initials(name: string | undefined | null) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

// Colores de los chips, igual que el mockup (pantalla 11).
export const APPLICATION_CHIP: Record<ApplicationStatus, string> = {
  APLICADO: "chip-neutral",
  EN_REVISION: "chip-bright",
  ENTREVISTA: "chip-info",
  ACEPTADO: "chip-success",
  RECHAZADO: "chip-neutral",
};

export const APPLICATION_LABEL: Record<ApplicationStatus, string> = {
  APLICADO: "Aplicado",
  EN_REVISION: "En revisión",
  ENTREVISTA: "Entrevista",
  ACEPTADO: "Aceptado",
  RECHAZADO: "Rechazado",
};

export const VACANCY_CHIP: Record<VacancyStatus, string> = {
  BORRADOR: "chip-neutral",
  PENDIENTE: "chip-bright",
  APROBADA: "chip-info",
  RECHAZADA: "chip-success",
  PAUSADA: "chip-neutral",
};

export const MODALITY_OPTIONS = [
  { value: "PRESENCIAL", label: "Presencial" },
  { value: "HIBRIDA", label: "Híbrida" },
  { value: "REMOTA", label: "Remota" },
] as const;

export const STAGE_OPTIONS = [
  { value: "LECTIVA", label: "Lectiva" },
  { value: "PRODUCTIVA", label: "Productiva" },
] as const;
