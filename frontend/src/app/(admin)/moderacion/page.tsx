"use client";

/**
 * HU-19 · Aprobar empresas y vacantes (mockup, pantalla 13)
 * Escenarios:
 *   - Aprobar empresa → puede publicar vacantes visibles
 *   - Rechazar vacante → no es visible para estudiantes y la empresa ve
 *     el aviso del rechazo (con el motivo)
 * También se puede moderar desde el Django Admin (/admin/).
 */
import { useState } from "react";
import { apiFetch, errorMessage } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { formatShortDate, VACANCY_CHIP } from "@/lib/format";
import type { CompanyReview, ReviewStatus, VacancyReview } from "@/types";
import { Avatar, EmptyState, ErrorState, Notice, PageHeader, SkeletonCards, Spinner, Toast, useToast } from "@/components/ui";
import { IconShield } from "@/components/icons";

type Tab = "empresas" | "vacantes";

const STATUS_FILTERS: { value: ReviewStatus; label: string }[] = [
  { value: "PENDIENTE", label: "Pendientes" },
  { value: "APROBADA", label: "Aprobadas" },
  { value: "RECHAZADA", label: "Rechazadas" },
];

const COMPANY_CHIP: Record<ReviewStatus, string> = {
  PENDIENTE: "chip-info",
  APROBADA: "chip-bright",
  RECHAZADA: "chip-success",
};

/** Botones Aprobar / Rechazar con motivo opcional. */
function ReviewActions({
  status,
  onApprove,
  onReject,
}: {
  status: string;
  onApprove: () => Promise<void>;
  onReject: (reason: string) => Promise<void>;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  }

  if (rejecting) {
    return (
      <div className="flex w-full flex-col gap-2.5">
        <label className="field-label" htmlFor="reject-reason">
          Motivo del rechazo (la empresa lo verá)
        </label>
        <textarea
          id="reject-reason"
          className="input"
          rows={2}
          maxLength={500}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ej. El NIT no corresponde a la razón social."
          autoFocus
        />
        <div className="flex flex-wrap justify-end gap-2">
          <button className="btn btn-ghost btn-sm" onClick={() => setRejecting(false)} disabled={busy}>
            Cancelar
          </button>
          <button className="btn btn-danger btn-sm" disabled={busy} onClick={() => run(() => onReject(reason))}>
            {busy && <Spinner />} Confirmar rechazo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {busy && <Spinner className="text-brand-500" />}
      {status !== "RECHAZADA" && (
        <button className="btn btn-danger btn-sm" disabled={busy} onClick={() => setRejecting(true)}>
          Rechazar
        </button>
      )}
      {status !== "APROBADA" && (
        <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => run(onApprove)}>
          Aprobar
        </button>
      )}
    </div>
  );
}

export default function ModeracionPage() {
  const [tab, setTab] = useState<Tab>("empresas");
  const [status, setStatus] = useState<ReviewStatus>("PENDIENTE");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const toast = useToast();

  const summary = useApi<{ pending_companies: number; pending_vacancies: number }>("/moderacion/resumen/");
  const companies = useApi<CompanyReview[]>(tab === "empresas" ? `/moderacion/empresas/?estado=${status}` : null);
  const vacancies = useApi<VacancyReview[]>(tab === "vacantes" ? `/moderacion/vacantes/?estado=${status}` : null);

  async function act(kind: Tab, id: number, action: "aprobar" | "rechazar", reason = "", label = "") {
    setActionError(null);
    try {
      await apiFetch(`/moderacion/${kind}/${id}/${action}/`, { method: "POST", body: action === "rechazar" ? { reason } : {} });
      // Sale de la lista actual (cambió de estado).
      if (kind === "empresas") companies.setData((list) => (list ?? []).filter((c) => c.id !== id));
      else vacancies.setData((list) => (list ?? []).filter((v) => v.id !== id));
      summary.reload();
      toast.show(`${label} ${action === "aprobar" ? "aprobada" : "rechazada"}.`);
    } catch (err) {
      setActionError(errorMessage(err));
    }
  }

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "empresas", label: "Empresas pendientes", count: summary.data?.pending_companies },
    { key: "vacantes", label: "Vacantes pendientes", count: summary.data?.pending_vacancies },
  ];

  const current = tab === "empresas" ? companies : vacancies;

  return (
    <>
      <PageHeader
        title="Moderación"
        subtitle="Revisa empresas y vacantes antes de que los estudiantes las vean. Así evitamos ofertas fraudulentas."
      />

      <div className="mb-5 flex flex-col gap-4 border-b border-line sm:flex-row sm:items-end sm:justify-between">
        <div className="flex gap-6" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => {
                setTab(t.key);
                setExpanded(null);
              }}
              className={`-mb-px border-b-[2.5px] px-1 py-3 text-[15px] font-semibold ${
                tab === t.key ? "border-brand-700 text-brand-900" : "border-transparent text-ink-2 hover:text-brand-900"
              }`}
            >
              {t.label}
              {t.count !== undefined && ` · ${t.count}`}
            </button>
          ))}
        </div>
        <div className="mb-3 flex gap-2">
          {STATUS_FILTERS.map((f) => (
            <button key={f.value} className={`pill py-1.5 text-[13px] ${status === f.value ? "pill-active" : ""}`} onClick={() => setStatus(f.value)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {actionError && (
        <div className="mb-4">
          <Notice tone="danger">{actionError}</Notice>
        </div>
      )}

      {current.error ? (
        <ErrorState error={current.error} onRetry={current.reload} />
      ) : current.loading && !current.data ? (
        <SkeletonCards count={2} />
      ) : tab === "empresas" ? (
        !companies.data?.length ? (
          <EmptyState icon={<IconShield size={40} />} title="No hay empresas en esta lista" description={status === "PENDIENTE" ? "¡Todo al día! No hay empresas esperando revisión." : undefined} />
        ) : (
          <ul className="flex flex-col gap-3.5">
            {companies.data.map((c) => (
              <li key={c.id} className="card-soft flex flex-col gap-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-center gap-4">
                    <Avatar src={c.logo_url} initials={c.initials} size={52} />
                    <div className="min-w-0">
                      <p className="text-[18px] font-semibold">{c.name}</p>
                      <p className="text-[14px] text-ink-2">
                        {[c.nit && `NIT ${c.nit}`, c.city, `Registrada el ${formatShortDate(c.created_at)}`].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className={`chip ${COMPANY_CHIP[c.status]}`}>{c.status_display}</span>
                    <button className="btn btn-ghost btn-sm" onClick={() => setExpanded(expanded === c.id ? null : c.id)} aria-expanded={expanded === c.id}>
                      {expanded === c.id ? "Ocultar datos" : "Ver datos"}
                    </button>
                    <ReviewActions
                      status={c.status}
                      onApprove={() => act("empresas", c.id, "aprobar", "", c.name)}
                      onReject={(reason) => act("empresas", c.id, "rechazar", reason, c.name)}
                    />
                  </div>
                </div>
                {expanded === c.id && (
                  <dl className="grid gap-3 rounded-xl border border-line bg-white p-4 text-[14.5px] sm:grid-cols-2">
                    <div>
                      <dt className="field-label">Contacto</dt>
                      <dd>
                        {c.contact_name} · <a href={`mailto:${c.email}`}>{c.email}</a>
                      </dd>
                    </div>
                    <div>
                      <dt className="field-label">Sitio web</dt>
                      <dd>{c.website || "—"}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="field-label">Sobre la empresa</dt>
                      <dd className="whitespace-pre-line">{c.about || "—"}</dd>
                    </div>
                    <div>
                      <dt className="field-label">Sectores</dt>
                      <dd>{c.sectors.join(", ") || "—"}</dd>
                    </div>
                    <div>
                      <dt className="field-label">Vacantes creadas</dt>
                      <dd>{c.vacancies_count}</dd>
                    </div>
                    {c.rejection_reason && (
                      <div className="sm:col-span-2">
                        <dt className="field-label">Motivo del rechazo</dt>
                        <dd>{c.rejection_reason}</dd>
                      </div>
                    )}
                  </dl>
                )}
              </li>
            ))}
          </ul>
        )
      ) : !vacancies.data?.length ? (
        <EmptyState icon={<IconShield size={40} />} title="No hay vacantes en esta lista" description={status === "PENDIENTE" ? "¡Todo al día! No hay vacantes esperando revisión." : undefined} />
      ) : (
        <ul className="flex flex-col gap-3.5">
          {vacancies.data.map((v) => (
            <li key={v.id} className="card-soft flex flex-col gap-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="kicker">
                    {v.company_name} · {v.city}
                  </p>
                  <p className="text-[18px] font-semibold">{v.title}</p>
                  <p className="text-[14px] text-ink-2">
                    {v.modality_display} · Etapa {v.stage_display.toLowerCase()} · {v.openings} {v.openings === 1 ? "vacante" : "vacantes"}
                    {v.submitted_at && ` · Enviada el ${formatShortDate(v.submitted_at)}`}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className={`chip ${VACANCY_CHIP[v.status]}`}>{v.status_display}</span>
                  <button className="btn btn-ghost btn-sm" onClick={() => setExpanded(expanded === v.id ? null : v.id)} aria-expanded={expanded === v.id}>
                    {expanded === v.id ? "Ocultar detalle" : "Ver detalle"}
                  </button>
                  <ReviewActions
                    status={v.status === "PAUSADA" ? "APROBADA" : v.status}
                    onApprove={() => act("vacantes", v.id, "aprobar", "", v.title)}
                    onReject={(reason) => act("vacantes", v.id, "rechazar", reason, v.title)}
                  />
                </div>
              </div>
              {v.company_status !== "APROBADA" && (
                <p className="rounded-btn bg-[#fdf8e7] px-3.5 py-2 text-[13.5px] text-[#5c4a0c]">
                  La empresa está &quot;{v.company_status_display}&quot;: aunque apruebes la vacante, los estudiantes no la verán hasta aprobar la empresa.
                </p>
              )}
              {expanded === v.id && (
                <div className="flex flex-col gap-3 rounded-xl border border-line bg-white p-4 text-[14.5px]">
                  <p className="whitespace-pre-line">{v.description}</p>
                  {v.requirements.length > 0 && (
                    <ul className="list-disc pl-5">
                      {v.requirements.map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                  )}
                  <p className="text-ink-2">
                    Apoyo: {v.stipend || "—"} · Habilidades: {v.skills.join(", ") || "—"}
                  </p>
                  {v.rejection_reason && <p className="text-rose-text">Motivo del rechazo: {v.rejection_reason}</p>}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <Toast message={toast.message} onClose={toast.close} />
    </>
  );
}
