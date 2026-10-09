"use client";

/**
 * Inicio del estudiante.
 * HU-04 "Aviso de perfil incompleto": muestra qué falta y "Completar perfil".
 */
import Link from "next/link";
import { useApi } from "@/lib/useApi";
import { useSession } from "@/lib/auth";
import { APPLICATION_CHIP, firstName, formatShortDate } from "@/lib/format";
import type { Paginated, StudentApplication, StudentProfile, VacancyCard as Vacancy } from "@/types";
import VacancyCard from "@/components/VacancyCard";
import { ErrorState, ProgressBar, SkeletonCards } from "@/components/ui";
import { IconArrowRight } from "@/components/icons";

export default function InicioPage() {
  const session = useSession();
  const profile = useApi<StudentProfile>("/estudiantes/perfil/");
  const applications = useApi<StudentApplication[]>("/postulaciones/");
  const vacancies = useApi<Paginated<Vacancy>>("/vacantes/");

  const name = profile.data?.full_name || session?.fullName;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-[26px] sm:text-[30px]">Hola{name ? `, ${firstName(name)}` : ""}</h1>
        <p className="mt-1 text-ink-2">Estas son tus novedades en PractiYA.</p>
      </div>

      {profile.data && profile.data.completion < 100 && (
        <section className="card flex flex-col gap-4 border-brand-50 bg-brand-100/60 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <p className="text-[17px] font-semibold">Tu perfil está al {profile.data.completion}%</p>
            <p className="mt-1 text-[14.5px] text-ink-2">
              Te falta: {profile.data.missing_fields.join(", ")}.
              {profile.data.missing_fields.includes("Hoja de vida") && " Sin hoja de vida no puedes postularte."}
            </p>
            <div className="mt-3 max-w-md">
              <ProgressBar value={profile.data.completion} />
            </div>
          </div>
          <Link href="/perfil" className="btn btn-primary">
            Completar perfil
          </Link>
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Pasantías recientes</h2>
            <Link href="/buscar" className="inline-flex items-center gap-1 text-[14.5px] font-semibold">
              Ver todas <IconArrowRight size={16} />
            </Link>
          </div>
          {vacancies.error ? (
            <ErrorState error={vacancies.error} onRetry={vacancies.reload} />
          ) : !vacancies.data ? (
            <SkeletonCards />
          ) : vacancies.data.results.length === 0 ? (
            <p className="card-soft text-ink-2">Todavía no hay pasantías publicadas. Vuelve pronto.</p>
          ) : (
            vacancies.data.results.slice(0, 4).map((v) => <VacancyCard key={v.id} vacancy={v} />)
          )}
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Mis postulaciones</h2>
            <Link href="/postulaciones" className="inline-flex items-center gap-1 text-[14.5px] font-semibold">
              Ver todas <IconArrowRight size={16} />
            </Link>
          </div>
          <div className="card flex flex-col divide-y divide-line p-0 sm:p-0">
            {applications.error ? (
              <p className="p-5 text-rose-text">No pudimos cargar tus postulaciones.</p>
            ) : !applications.data ? (
              <p className="p-5 text-ink-2">Cargando…</p>
            ) : applications.data.length === 0 ? (
              <div className="p-5 text-[14.5px] text-ink-2">
                Aún no te has postulado. <Link href="/buscar">Busca tu primera pasantía</Link>.
              </div>
            ) : (
              applications.data.slice(0, 5).map((app) => (
                <Link
                  key={app.id}
                  href={`/buscar/${app.vacancy.id}`}
                  className="flex items-center justify-between gap-3 px-5 py-4 text-ink hover:bg-soft hover:text-ink"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{app.vacancy.title}</p>
                    <p className="truncate text-[13px] text-ink-2">
                      {app.vacancy.company.name} · {formatShortDate(app.created_at)}
                    </p>
                  </div>
                  <span className={`chip ${APPLICATION_CHIP[app.status]}`}>{app.status_display}</span>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
