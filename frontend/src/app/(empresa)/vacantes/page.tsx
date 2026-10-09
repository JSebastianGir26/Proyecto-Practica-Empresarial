"use client";

/** HU-15 · Mis vacantes: todas, con sus acciones según el estado. */
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useApi } from "@/lib/useApi";
import type { CompanyProfile, CompanyVacancy } from "@/types";
import { applyVacancyChange, CompanyStatusNotice, VacancyTable } from "@/components/company";
import { EmptyState, ErrorState, Notice, PageHeader, SkeletonCards } from "@/components/ui";
import { IconBriefcase, IconPlus } from "@/components/icons";

const OK_MESSAGES: Record<string, string> = {
  enviada: "Tu vacante quedó \"Pendiente de revisión\". Será visible para los estudiantes cuando un administrador la apruebe.",
  borrador: "Guardamos tu vacante como borrador. Puedes publicarla cuando esté lista.",
};

function OkMessage() {
  const ok = useSearchParams().get("ok");
  return ok && OK_MESSAGES[ok] ? <Notice tone="success">{OK_MESSAGES[ok]}</Notice> : null;
}

export default function VacantesPage() {
  const company = useApi<CompanyProfile>("/empresas/perfil/");
  const { data, error, reload, setData } = useApi<CompanyVacancy[]>("/vacantes/mias/");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Mis vacantes"
        subtitle="Borradores, vacantes en revisión, activas y en pausa."
        actions={
          <Link href="/vacantes/nueva" className="btn btn-primary">
            <IconPlus size={16} /> Nueva vacante
          </Link>
        }
      />
      <Suspense>
        <OkMessage />
      </Suspense>
      {company.data && <CompanyStatusNotice company={company.data} />}

      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : !data ? (
        <SkeletonCards count={3} />
      ) : data.length === 0 ? (
        <EmptyState
          icon={<IconBriefcase size={40} />}
          title="Aún no has creado vacantes"
          description="Crea tu primera vacante. Puedes guardarla como borrador y publicarla cuando esté lista."
          action={
            <Link href="/vacantes/nueva" className="btn btn-primary">
              Nueva vacante
            </Link>
          }
        />
      ) : (
        <VacancyTable vacancies={data} onChange={(change) => setData((list) => applyVacancyChange(list, change))} />
      )}
    </div>
  );
}
