"use client";

/**
 * HU-16 · Gestionar postulantes (mockup, pantalla 11)
 * Escenarios:
 *   - Cambio el estado de un candidato → se ve en la lista y en las
 *     postulaciones del estudiante
 *   - "Ver hoja de vida" → se abre su PDF
 */
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Fragment, Suspense, useState } from "react";
import { apiFetch, errorMessage } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { APPLICATION_CHIP, APPLICATION_LABEL, formatShortDate } from "@/lib/format";
import type { ApplicationStatus, CompanyApplication, CompanyVacancy } from "@/types";
import { EmptyState, ErrorState, PageHeader, SkeletonCards, Spinner, Toast, useToast } from "@/components/ui";
import { IconArrowLeft, IconExternal, IconUsers } from "@/components/icons";

const STATUSES = Object.keys(APPLICATION_LABEL) as ApplicationStatus[];

function Applicants() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const vacancyId = params.get("vacante") ?? "";
  const statusFilter = params.get("estado") ?? "";

  const vacancies = useApi<CompanyVacancy[]>("/vacantes/mias/");
  const query = new URLSearchParams();
  if (vacancyId) query.set("vacante", vacancyId);
  if (statusFilter) query.set("estado", statusFilter);
  const { data, error, reload, setData } = useApi<CompanyApplication[]>(`/postulaciones/empresa/?${query}`);

  const [updating, setUpdating] = useState<number | null>(null);
  const [rowError, setRowError] = useState<{ id: number; message: string } | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const toast = useToast();

  const selected = vacancies.data?.find((v) => String(v.id) === vacancyId);

  function setFilter(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  async function changeStatus(app: CompanyApplication, status: ApplicationStatus) {
    setUpdating(app.id);
    setRowError(null);
    try {
      const updated = await apiFetch<CompanyApplication>(`/postulaciones/${app.id}/estado/`, {
        method: "PATCH",
        body: { status },
      });
      setData((list) => (list ?? []).map((a) => (a.id === updated.id ? updated : a)));
      toast.show(`${updated.student.full_name}: ahora "${updated.status_display}".`);
    } catch (err) {
      setRowError({ id: app.id, message: errorMessage(err, "No se pudo cambiar el estado.") });
    } finally {
      setUpdating(null);
    }
  }

  return (
    <>
      <PageHeader
        back={
          <Link href="/panel" className="inline-flex items-center gap-1.5 text-[14px]">
            <IconArrowLeft size={16} /> Panel de la empresa
          </Link>
        }
        title={selected ? `Postulantes · ${selected.title}` : "Postulantes"}
        subtitle={
          selected
            ? `${selected.applicants_count} postulantes · ${selected.modality_display} · ${selected.duration_months} meses · Etapa ${selected.stage_display.toLowerCase()}`
            : "Todas tus vacantes"
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="field-label">Vacante</span>
          <select className="input" value={vacancyId} onChange={(e) => setFilter("vacante", e.target.value)}>
            <option value="">Todas las vacantes</option>
            {vacancies.data?.map((v) => (
              <option key={v.id} value={v.id}>
                {v.title || "Sin título"} ({v.applicants_count})
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 sm:w-56">
          <span className="field-label">Estado</span>
          <select className="input" value={statusFilter} onChange={(e) => setFilter("estado", e.target.value)}>
            <option value="">Todos</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {APPLICATION_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : !data ? (
        <SkeletonCards count={3} />
      ) : data.length === 0 ? (
        <EmptyState
          icon={<IconUsers size={40} />}
          title={statusFilter ? "No hay postulantes en este estado" : "Aún no tienes postulantes"}
          description={
            statusFilter
              ? "Prueba con otro estado."
              : "Cuando un estudiante se postule a tus vacantes activas, aparecerá aquí con su hoja de vida."
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-soft px-2 pt-4 sm:px-3">
          <table className="table min-w-[760px]">
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Carrera</th>
                {!vacancyId && <th>Vacante</th>}
                <th>Fecha</th>
                <th>Estado</th>
                <th className="text-right">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((app) => {
                const s = app.student;
                const open = expanded === app.id;
                return (
                  <Fragment key={app.id}>
                    <tr>
                      <td>
                        <button
                          className="text-left font-semibold text-ink hover:text-brand-700"
                          onClick={() => setExpanded(open ? null : app.id)}
                          aria-expanded={open}
                        >
                          {s.full_name || s.email}
                        </button>
                        <p className="text-[13px] text-ink-3">{s.city}</p>
                      </td>
                      <td className="text-ink-2">
                        {[s.program, s.semester && `${s.semester}º sem.`].filter(Boolean).join(" · ") || "—"}
                      </td>
                      {!vacancyId && <td className="max-w-[200px] truncate text-ink-2">{app.vacancy_title}</td>}
                      <td className="text-ink-2">{formatShortDate(app.created_at)}</td>
                      <td>
                        <span className={`chip ${APPLICATION_CHIP[app.status]}`}>{app.status_display}</span>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          {s.cv_url ? (
                            <a href={s.cv_url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
                              Ver hoja de vida <IconExternal size={14} />
                            </a>
                          ) : (
                            <span className="text-[13px] text-ink-3">Sin hoja de vida</span>
                          )}
                          <label className="sr-only" htmlFor={`st-${app.id}`}>
                            Cambiar estado de {s.full_name}
                          </label>
                          <div className="relative">
                            <select
                              id={`st-${app.id}`}
                              className="btn btn-primary btn-sm cursor-pointer appearance-none pr-7"
                              value={app.status}
                              disabled={updating === app.id}
                              onChange={(e) => changeStatus(app, e.target.value as ApplicationStatus)}
                            >
                              {STATUSES.map((st) => (
                                <option key={st} value={st} className="bg-white text-ink">
                                  {APPLICATION_LABEL[st]}
                                </option>
                              ))}
                            </select>
                            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-white">
                              {updating === app.id ? <Spinner className="h-3 w-3" /> : "▼"}
                            </span>
                          </div>
                        </div>
                        {rowError?.id === app.id && <p className="mt-1 text-right text-[13px] text-rose-text">{rowError.message}</p>}
                      </td>
                    </tr>
                    {open && (
                      <tr>
                        <td colSpan={vacancyId ? 5 : 6} className="border-t-0 bg-white pt-0">
                          <div className="grid gap-4 rounded-xl border border-line p-4 sm:grid-cols-[1fr_auto]">
                            <div className="flex flex-col gap-2 text-[14.5px]">
                              {s.about && <p>{s.about}</p>}
                              {s.skills.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                  {s.skills.map((sk) => (
                                    <span key={sk} className="tagchip">
                                      {sk}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {!s.about && s.skills.length === 0 && <p className="text-ink-3">El estudiante aún no completó su perfil.</p>}
                            </div>
                            <div className="text-[14px] text-ink-2">
                              <p>{s.institution}</p>
                              <a href={`mailto:${s.email}`}>{s.email}</a>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Toast message={toast.message} onClose={toast.close} />
    </>
  );
}

export default function PostulantesPage() {
  return (
    <Suspense fallback={<SkeletonCards count={3} />}>
      <Applicants />
    </Suspense>
  );
}
