"use client";

/**
 * HU-08 · Ver detalle y postularme
 * Escenarios:
 *   - Postulación exitosa → estado "Aplicado" y el contador de postulantes +1
 *   - Sin hoja de vida → se pide cargarla antes de continuar (aquí mismo)
 *   - Postulación repetida → botón "Ya te postulaste" deshabilitado
 */
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { apiFetch, ApiError, errorMessage } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import type { StudentApplication, VacancyDetail } from "@/types";
import CvUploader from "@/components/CvUploader";
import { Avatar, ErrorState, LoadingBlock, Notice, Spinner, Toast, useToast } from "@/components/ui";
import { IconArrowLeft, IconArrowRight, IconCheck } from "@/components/icons";

export default function VacancyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: vacancy, error, setData, reload } = useApi<VacancyDetail>(`/vacantes/${id}/`);
  const [applying, setApplying] = useState(false);
  const [needsCv, setNeedsCv] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const toast = useToast();

  async function apply() {
    if (!vacancy) return;
    setApplying(true);
    setApplyError(null);
    try {
      const app = await apiFetch<StudentApplication & { applicants_count: number }>("/postulaciones/", {
        method: "POST",
        body: { vacancy: vacancy.id },
      });
      setNeedsCv(false);
      setData({
        ...vacancy,
        applicants_count: app.applicants_count,
        my_application: { id: app.id, status: app.status, status_display: app.status_display },
      });
      toast.show(`¡Listo! Tu postulación quedó en estado "${app.status_display}".`);
    } catch (err) {
      if (err instanceof ApiError && err.code === "cv_required") setNeedsCv(true);
      else if (err instanceof ApiError && err.code === "already_applied") reload();
      else setApplyError(errorMessage(err, "No pudimos enviar tu postulación. Intenta de nuevo."));
    } finally {
      setApplying(false);
    }
  }

  const back = (
    <Link href="/buscar" className="inline-flex items-center gap-1.5 text-[14px]">
      <IconArrowLeft size={16} /> Volver a la búsqueda
    </Link>
  );

  if (error) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <div className="flex flex-col gap-6">
        {back}
        {notFound ? (
          <Notice tone="warning" title="Esta pasantía ya no está disponible">
            Puede que la empresa la haya cerrado o pausado. <Link href="/buscar">Busca otras pasantías</Link>.
          </Notice>
        ) : (
          <ErrorState error={error} onRetry={reload} />
        )}
      </div>
    );
  }
  if (!vacancy) return <LoadingBlock />;

  const applied = Boolean(vacancy.my_application);
  const applyButton = (
    <button
      type="button"
      className="btn btn-primary btn-lg w-full sm:w-auto"
      onClick={apply}
      disabled={applied || applying}
      aria-disabled={applied || applying}
    >
      {applying ? <Spinner /> : applied ? <IconCheck size={16} /> : null}
      {applied ? "Ya te postulaste" : applying ? "Enviando…" : "Postularme"}
      {!applied && !applying && <IconArrowRight size={16} />}
    </button>
  );

  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-6">
      {back}

      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-4">
          <Avatar src={vacancy.company.logo_url} initials={vacancy.company.initials} size={60} />
          <div className="min-w-0">
            <p className="kicker">
              {vacancy.company.name} · {vacancy.city}
            </p>
            <h1 className="mt-1 text-[26px] sm:text-[32px]">{vacancy.title}</h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="chip chip-info">{vacancy.modality_display}</span>
              <span className="chip chip-bright">{vacancy.duration_months} meses</span>
              <span className="chip chip-neutral">{vacancy.stage_display}</span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-1.5 sm:items-end">
          {applyButton}
          {vacancy.my_application && (
            <Link href="/postulaciones" className="text-[13.5px]">
              Estado: {vacancy.my_application.status_display} · ver mis postulaciones
            </Link>
          )}
        </div>
      </div>

      {applyError && <Notice tone="danger">{applyError}</Notice>}

      {needsCv && (
        <section className="card flex flex-col gap-4 border-brand-50" aria-live="polite">
          <div>
            <p className="text-[17px] font-semibold">Sube tu hoja de vida para postularte</p>
            <p className="mt-1 text-[14.5px] text-ink-2">
              Las empresas la revisan antes de contactarte. Solo tienes que subirla una vez: queda guardada en tu perfil.
            </p>
          </div>
          <CvUploader
            profile={{ cv_url: null, cv_filename: "", cv_size: null, cv_uploaded_at: null }}
            onUploaded={() => {
              setNeedsCv(false);
              apply();
            }}
          />
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <article className="flex flex-col gap-7">
          <section>
            <h2 className="section-title mb-2.5">Descripción</h2>
            <p className="whitespace-pre-line text-[15.5px] leading-relaxed">{vacancy.description}</p>
          </section>
          {vacancy.requirements.length > 0 && (
            <section>
              <h2 className="section-title mb-2.5">Requisitos</h2>
              <ul className="list-disc space-y-1.5 pl-5 text-[15.5px]">
                {vacancy.requirements.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </section>
          )}
          {vacancy.skills.length > 0 && (
            <section>
              <h2 className="section-title mb-2.5">Habilidades</h2>
              <div className="flex flex-wrap gap-2">
                {vacancy.skills.map((s) => (
                  <span key={s} className="tagchip">
                    {s}
                  </span>
                ))}
              </div>
            </section>
          )}
          {vacancy.company.about && (
            <section>
              <h2 className="section-title mb-2.5">Sobre {vacancy.company.name}</h2>
              <p className="text-[15px] text-ink-2">{vacancy.company.about}</p>
              {vacancy.company.website && (
                <a
                  href={/^https?:\/\//.test(vacancy.company.website) ? vacancy.company.website : `https://${vacancy.company.website}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-2 inline-block text-[14.5px]"
                >
                  {vacancy.company.website}
                </a>
              )}
            </section>
          )}
        </article>

        <aside className="card-soft flex h-fit flex-col gap-4 text-[14.5px]">
          <p className="kicker">Datos del contrato</p>
          <dl className="grid gap-3.5">
            <div>
              <dt className="font-semibold">Duración</dt>
              <dd className="text-ink-2">{vacancy.duration_months} meses</dd>
            </div>
            <div>
              <dt className="font-semibold">Apoyo de sostenimiento</dt>
              <dd className="text-ink-2">{vacancy.stipend || "A convenir"}</dd>
            </div>
            <div>
              <dt className="font-semibold">Etapa</dt>
              <dd className="text-ink-2">{vacancy.stage_display}</dd>
            </div>
            <div>
              <dt className="font-semibold">Vacantes</dt>
              <dd className="text-ink-2">{vacancy.openings}</dd>
            </div>
            <div>
              <dt className="font-semibold">Postulantes</dt>
              <dd className="text-ink-2">{vacancy.applicants_count}</dd>
            </div>
          </dl>
        </aside>
      </div>

      <Toast message={toast.message} onClose={toast.close} />
    </div>
  );
}
