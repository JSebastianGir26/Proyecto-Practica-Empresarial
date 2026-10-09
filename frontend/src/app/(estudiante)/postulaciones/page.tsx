"use client";

/**
 * HU-10 · Seguir mis postulaciones
 * Escenario: veo cada vacante con su estado (Aplicado, En revisión,
 * Entrevista, Aceptado o Rechazado).
 */
import Link from "next/link";
import { useApi } from "@/lib/useApi";
import { APPLICATION_CHIP, formatRelative, formatShortDate } from "@/lib/format";
import type { StudentApplication } from "@/types";
import ApplicationTimeline from "@/components/ApplicationTimeline";
import { Avatar, EmptyState, ErrorState, PageHeader, SkeletonCards } from "@/components/ui";
import { IconChecklist } from "@/components/icons";

export default function PostulacionesPage() {
  const { data, error, reload } = useApi<StudentApplication[]>("/postulaciones/");

  return (
    <>
      <PageHeader
        title="Mis postulaciones"
        subtitle={data && data.length > 0 ? `Te has postulado a ${data.length} ${data.length === 1 ? "pasantía" : "pasantías"}.` : undefined}
      />

      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : !data ? (
        <SkeletonCards />
      ) : data.length === 0 ? (
        <EmptyState
          icon={<IconChecklist size={40} />}
          title="Aún no te has postulado"
          description="Cuando te postules a una pasantía, aquí verás en qué va tu proceso."
          action={
            <Link href="/buscar" className="btn btn-primary">
              Buscar pasantías
            </Link>
          }
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {data.map((app) => (
            <li key={app.id} className="card flex flex-col gap-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 gap-3.5">
                  <Avatar src={app.vacancy.company.logo_url} initials={app.vacancy.company.initials} size={44} />
                  <div className="min-w-0">
                    <Link href={`/buscar/${app.vacancy.id}`} className="text-[17px] font-semibold text-ink hover:text-brand-700">
                      {app.vacancy.title}
                    </Link>
                    <p className="text-[14px] text-ink-2">
                      {app.vacancy.company.name} · {app.vacancy.city} · {app.vacancy.modality_display}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
                  <span className={`chip ${APPLICATION_CHIP[app.status]}`}>{app.status_display}</span>
                  <span className="text-[12.5px] text-ink-3">
                    Te postulaste el {formatShortDate(app.created_at)}
                    {app.status_changed_at !== app.created_at && ` · actualizado ${formatRelative(app.status_changed_at).toLowerCase()}`}
                  </span>
                </div>
              </div>
              <ApplicationTimeline status={app.status} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
