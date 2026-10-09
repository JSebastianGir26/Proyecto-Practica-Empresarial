"use client";

/** Piezas compartidas por las pantallas de la empresa. */
import Link from "next/link";
import { useState } from "react";
import { apiFetch, errorMessage } from "@/lib/api";
import { formatShortDate, VACANCY_CHIP } from "@/lib/format";
import type { CompanyProfile, CompanyVacancy } from "@/types";
import { Notice, Spinner } from "./ui";

/** Aviso del estado de aprobación de la empresa (HU-19). */
export function CompanyStatusNotice({ company }: { company: CompanyProfile }) {
  if (company.status === "PENDIENTE") {
    return (
      <Notice
        tone="warning"
        title="Tu empresa está en revisión"
        action={
          company.completion < 100 && (
            <Link href="/perfil-empresa" className="btn btn-secondary btn-sm">
              Completar perfil
            </Link>
          )
        }
      >
        Puedes crear vacantes desde ya; los estudiantes las verán cuando un administrador apruebe tu empresa. Un perfil completo
        (NIT, sitio web, descripción) agiliza la revisión.
      </Notice>
    );
  }
  if (company.status === "RECHAZADA") {
    return (
      <Notice
        tone="danger"
        title="Tu empresa no fue aprobada"
        action={
          <Link href="/perfil-empresa" className="btn btn-danger btn-sm">
            Corregir datos
          </Link>
        }
      >
        {company.rejection_reason ? `Motivo: ${company.rejection_reason}. ` : ""}
        Corrige los datos de tu perfil y guárdalos para enviarlo de nuevo a revisión.
      </Notice>
    );
  }
  return null;
}

type Action = "publicar" | "pausar" | "reanudar";

/**
 * Tabla de vacantes de la empresa con sus acciones según el estado.
 * `compact` oculta las acciones secundarias (se usa en el panel).
 */
export function VacancyTable({
  vacancies,
  onChange,
  compact = false,
}: {
  vacancies: CompanyVacancy[];
  onChange: (updated: CompanyVacancy | { id: number; deleted: true }) => void;
  compact?: boolean;
}) {
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<{ id: number; message: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  async function run(v: CompanyVacancy, action: Action) {
    setBusy(v.id);
    setError(null);
    try {
      const updated = await apiFetch<CompanyVacancy>(`/vacantes/mias/${v.id}/${action}/`, { method: "POST" });
      onChange(updated);
    } catch (err) {
      setError({
        id: v.id,
        message:
          action === "publicar"
            ? "Faltan campos obligatorios (título, ciudad y descripción). Edita la vacante para completarlos."
            : errorMessage(err),
      });
    } finally {
      setBusy(null);
    }
  }

  async function remove(v: CompanyVacancy) {
    setBusy(v.id);
    setError(null);
    try {
      await apiFetch(`/vacantes/mias/${v.id}/`, { method: "DELETE" });
      onChange({ id: v.id, deleted: true });
    } catch (err) {
      setError({ id: v.id, message: errorMessage(err) });
    } finally {
      setBusy(null);
      setConfirmDelete(null);
    }
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-white px-2 pt-4 sm:px-3">
      <table className="table min-w-[720px]">
        <thead>
          <tr>
            <th>Puesto</th>
            <th>Modalidad</th>
            <th>Postulantes</th>
            <th>Estado</th>
            <th className="text-right">
              <span className="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {vacancies.map((v) => (
            <tr key={v.id} className="align-top">
              <td className="max-w-[280px]">
                <Link href={`/vacantes/${v.id}`} className="font-semibold text-ink hover:text-brand-700">
                  {v.title || "Sin título"}
                </Link>
                <p className="text-[13px] text-ink-3">
                  {v.city || "Sin ciudad"} · creada {formatShortDate(v.created_at)}
                </p>
                {v.status === "RECHAZADA" && v.rejection_reason && (
                  <p className="mt-1 text-[13px] text-rose-text">Motivo del rechazo: {v.rejection_reason}</p>
                )}
                {error?.id === v.id && (
                  <p className="mt-1 text-[13px] text-rose-text" role="alert">
                    {error.message}
                  </p>
                )}
              </td>
              <td className="text-ink-2">{v.modality_display}</td>
              <td>
                {v.applicants_count > 0 ? (
                  <Link href={`/postulantes?vacante=${v.id}`} className="font-semibold">
                    {v.applicants_count}
                  </Link>
                ) : (
                  <span className="text-ink-3">0</span>
                )}
              </td>
              <td>
                <span className={`chip ${VACANCY_CHIP[v.status]}`}>{v.status_display}</span>
              </td>
              <td>
                <div className="flex flex-wrap justify-end gap-2">
                  {busy === v.id && <Spinner className="mt-2 text-brand-500" />}
                  {(v.status === "BORRADOR" || v.status === "RECHAZADA") && (
                    <button className="btn btn-primary btn-sm" disabled={busy === v.id} onClick={() => run(v, "publicar")}>
                      {v.status === "RECHAZADA" ? "Reenviar a revisión" : "Publicar"}
                    </button>
                  )}
                  {!compact && v.status === "APROBADA" && (
                    <button className="btn btn-ghost btn-sm" disabled={busy === v.id} onClick={() => run(v, "pausar")}>
                      Pausar
                    </button>
                  )}
                  {v.status === "PAUSADA" && (
                    <button className="btn btn-secondary btn-sm" disabled={busy === v.id} onClick={() => run(v, "reanudar")}>
                      Reanudar
                    </button>
                  )}
                  {v.applicants_count > 0 && (
                    <Link href={`/postulantes?vacante=${v.id}`} className="btn btn-ghost btn-sm">
                      Ver postulantes
                    </Link>
                  )}
                  <Link href={`/vacantes/${v.id}`} className="btn btn-ghost btn-sm">
                    Editar
                  </Link>
                  {!compact &&
                    v.applicants_count === 0 &&
                    (confirmDelete === v.id ? (
                      <>
                        <button className="btn btn-danger btn-sm" disabled={busy === v.id} onClick={() => remove(v)}>
                          Sí, eliminar
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDelete(null)}>
                          No
                        </button>
                      </>
                    ) : (
                      <button className="btn btn-ghost btn-sm text-rose-text" onClick={() => setConfirmDelete(v.id)}>
                        Eliminar
                      </button>
                    ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Aplica el cambio devuelto por VacancyTable a una lista. */
export function applyVacancyChange(
  list: CompanyVacancy[] | undefined,
  change: CompanyVacancy | { id: number; deleted: true },
): CompanyVacancy[] {
  const current = list ?? [];
  if ("deleted" in change) return current.filter((v) => v.id !== change.id);
  return current.map((v) => (v.id === change.id ? change : v));
}
