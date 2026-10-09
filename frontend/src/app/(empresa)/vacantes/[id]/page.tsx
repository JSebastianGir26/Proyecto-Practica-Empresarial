"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useApi } from "@/lib/useApi";
import { ApiError } from "@/lib/api";
import type { CompanyVacancy } from "@/types";
import VacancyForm from "@/components/VacancyForm";
import { ErrorState, LoadingBlock, Notice } from "@/components/ui";

export default function EditarVacantePage() {
  const { id } = useParams<{ id: string }>();
  const { data, error, reload } = useApi<CompanyVacancy>(`/vacantes/mias/${id}/`);

  if (error) {
    return error instanceof ApiError && error.status === 404 ? (
      <Notice tone="warning" title="No encontramos esta vacante">
        <Link href="/vacantes">Volver a mis vacantes</Link>
      </Notice>
    ) : (
      <ErrorState error={error} onRetry={reload} />
    );
  }
  if (!data) return <LoadingBlock />;
  // key: si cambia la vacante, el formulario se reinicia con sus datos.
  return <VacancyForm key={`${data.id}-${data.updated_at}`} vacancy={data} />;
}
