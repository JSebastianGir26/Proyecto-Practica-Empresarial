"use client";

/** Panel de la empresa (mockup, pantalla "Panel empresa"). */
import Link from "next/link";
import { useApi } from "@/lib/useApi";
import type { CompanyDashboard, CompanyProfile, CompanyVacancy } from "@/types";
import { applyVacancyChange, CompanyStatusNotice, VacancyTable } from "@/components/company";
import { EmptyState, ErrorState, PageHeader, SkeletonCards } from "@/components/ui";
import { IconBriefcase, IconPlus } from "@/components/icons";

export default function PanelPage() {
  const company = useApi<CompanyProfile>("/empresas/perfil/");
  const stats = useApi<CompanyDashboard>("/empresas/panel/");
  const vacancies = useApi<CompanyVacancy[]>("/vacantes/mias/");

  const metrics = [
    { label: "Vacantes activas", value: stats.data?.active_vacancies },
    { label: "Postulantes nuevos", value: stats.data?.new_applicants, hint: "últimos 7 días" },
    { label: "En entrevista", value: stats.data?.interviews },
    { label: "Aceptados", value: stats.data?.accepted },
  ];

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        title="Panel de la empresa"
        subtitle={company.data ? [company.data.legal_name, company.data.city].filter(Boolean).join(" · ") : undefined}
        actions={
          <Link href="/vacantes/nueva" className="btn btn-primary">
            <IconPlus size={16} /> Publicar pasantía
          </Link>
        }
      />

      {company.data && <CompanyStatusNotice company={company.data} />}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label} className="card-soft flex flex-col gap-1 p-4 sm:p-5">
            <p className="text-[12px] font-bold uppercase tracking-[0.06em] text-brand-500">{m.label}</p>
            <p className="text-[30px] font-semibold leading-none">{m.value ?? "–"}</p>
            {m.hint && <p className="text-[12.5px] text-ink-3">{m.hint}</p>}
          </div>
        ))}
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="section-title">Pasantías publicadas</h2>
          <Link href="/vacantes" className="text-[14.5px] font-semibold">
            Gestionar vacantes
          </Link>
        </div>
        {vacancies.error ? (
          <ErrorState error={vacancies.error} onRetry={vacancies.reload} />
        ) : !vacancies.data ? (
          <SkeletonCards count={2} />
        ) : vacancies.data.length === 0 ? (
          <EmptyState
            icon={<IconBriefcase size={40} />}
            title="Aún no has creado vacantes"
            description="Publica tu primera pasantía con contrato de aprendizaje. Puedes guardarla como borrador y terminarla después."
            action={
              <Link href="/vacantes/nueva" className="btn btn-primary">
                Publicar pasantía
              </Link>
            }
          />
        ) : (
          <VacancyTable
            compact
            vacancies={vacancies.data}
            onChange={(change) => {
              vacancies.setData((list) => applyVacancyChange(list, change));
              stats.reload();
            }}
          />
        )}
      </section>
    </div>
  );
}
